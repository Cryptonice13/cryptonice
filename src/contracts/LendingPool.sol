// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./AToken.sol";
import "./DebtToken.sol";
import "./InterestRateModel.sol";

/**
 * @title LendingPool (Aave/Compound-style MVP)
 * @notice Core flows: deposit, withdraw, borrow, repay, liquidation.
 * Accrual uses Compound-like borrowIndex & reserves.
 */
contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ======= Interfaces =======
    interface IPriceOracle {
        /// @notice returns USD price with 1e8 decimals (Chainlink-like)
        function getPrice(address asset) external view returns (int256 priceE8, uint256 updatedAt);
    }

    // ======= Structs =======
    struct AssetConfig {
        bool isListed;
        address aToken;
        address debtToken;
        address interestRateModel;
        uint256 reserveFactorE4;        // e.g. 1000 = 10%
        uint256 ltvE4;                  // loan-to-value, e.g. 7500 = 75%
        uint256 liqThresholdE4;         // e.g. 8000 = 80%
        uint256 liqBonusE4;             // e.g. 500 = 5%
        uint256 closeFactorE4;          // e.g. 5000 = 50%
        uint8   decimals;               // underlying decimals
    }

    struct AssetState {
        uint256 totalCash;              // underlying balance tracked
        uint256 totalBorrows;           // principal
        uint256 totalReserves;          // accumulated reserves
        uint256 borrowIndexE18;         // starts at 1e18
        uint40  lastAccrual;            // last timestamp
    }

    // ======= Storage =======
    IPriceOracle public oracle;
    address public admin;               // separate from owner if you like

    // asset => config/state
    mapping(address => AssetConfig) public configs;
    mapping(address => AssetState) public states;

    // ======= Events =======
    event MarketListed(address indexed asset, address aToken, address debtToken);
    event Deposit(address indexed user, address indexed asset, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, address indexed asset, uint256 shares, uint256 amountOut);
    event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 sharesMinted);
    event Repay(address indexed payer, address indexed user, address indexed asset, uint256 amount, uint256 sharesBurned);
    event Liquidation(
        address indexed liquidator,
        address indexed user,
        address debtAsset,
        address collateralAsset,
        uint256 repayAmount,
        uint256 seizeAmount
    );

    // ======= Modifiers =======
    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner(), "not admin");
        _;
    }

    // ======= Constructor / Admin =======
    constructor(IPriceOracle _oracle, address _admin) {
        oracle = _oracle;
        admin  = _admin;
    }

    function setAdmin(address _admin) external onlyOwner {
        admin = _admin;
    }

    function _now() internal view returns (uint256) { return block.timestamp; }

    // ======= Market Management =======
    function listMarket(
        address asset,
        uint8 assetDecimals,
        address irm,           // InterestRateModel
        uint256 reserveFactorE4,
        uint256 ltvE4,
        uint256 liqThresholdE4,
        uint256 liqBonusE4,
        uint256 closeFactorE4,
        string memory aName,
        string memory aSymbol,
        string memory dName,
        string memory dSymbol
    ) external onlyAdmin {
        require(!configs[asset].isListed, "listed");
        require(ltvE4 <= liqThresholdE4, "ltv>threshold");
        require(liqBonusE4 <= 2000, "bonus too high"); // <=20% for MVP

        // Deploy per-asset tokens
        AToken a = new AToken(asset, aName, aSymbol, address(this));
        DebtToken d = new DebtToken(dName, dSymbol, address(this));
        a.setPool(address(this));
        d.setPool(address(this));

        configs[asset] = AssetConfig({
            isListed: true,
            aToken: address(a),
            debtToken: address(d),
            interestRateModel: irm,
            reserveFactorE4: reserveFactorE4,
            ltvE4: ltvE4,
            liqThresholdE4: liqThresholdE4,
            liqBonusE4: liqBonusE4,
            closeFactorE4: closeFactorE4,
            decimals: assetDecimals
        });

        states[asset] = AssetState({
            totalCash: 0,
            totalBorrows: 0,
            totalReserves: 0,
            borrowIndexE18: 1e18,
            lastAccrual: uint40(_now())
        });

        emit MarketListed(asset, address(a), address(d));
    }

    // ======= Views (accounting) =======
    function getUtilizationE18(address asset) public view returns (uint256) {
        AssetState memory s = states[asset];
        uint256 cash = s.totalCash;
        uint256 borrows = s.totalBorrows;
        uint256 reserves = s.totalReserves;
        if (borrows == 0) return 0;
        uint256 denom = cash + borrows - reserves;
        if (denom == 0) return 0;
        return (borrows * 1e18) / denom;
    }

    function _borrowRate(address asset) internal view returns (uint256) {
        uint256 util = getUtilizationE18(asset);
        return InterestRateModel(configs[asset].interestRateModel).borrowRatePerSecond(util);
    }

    function getExchangeRateE18(address asset) public view returns (uint256) {
        // exchangeRate = (cash + borrows - reserves) / aTokenSupply
        AssetState memory s = states[asset];
        uint256 num = s.totalCash + s.totalBorrows - s.totalReserves;
        uint256 supply = ERC20(configs[asset].aToken).totalSupply();
        if (supply == 0) return 1e18; // initial rate
        return (num * 1e18) / supply;
    }

    function debtOf(address user, address asset) public view returns (uint256) {
        // debt = shares * borrowIndex / 1e18
        uint256 shares = ERC20(configs[asset].debtToken).balanceOf(user);
        return (shares * states[asset].borrowIndexE18) / 1e18;
    }

    function collateralOf(address user, address asset) public view returns (uint256) {
        // user underlying claim = shares * exchangeRate
        uint256 aShares = ERC20(configs[asset].aToken).balanceOf(user);
        uint256 er = getExchangeRateE18(asset);
        return (aShares * er) / 1e18;
    }

    /**
     * @return totalCollateralUSD_e8, totalDebtUSD_e8, healthFactor_e18
     */
    function getUserAccountData(address user, address[] calldata assets)
        external
        view
        returns (uint256, uint256, uint256)
    {
        uint256 colE8;
        uint256 debtE8;

        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            if (!configs[asset].isListed) continue;

            (int256 px, ) = oracle.getPrice(asset);
            if (px <= 0) continue;

            uint256 priceE8 = uint256(px); // 1e8
            // collateral
            uint256 col = collateralOf(user, asset);
            // normalize by decimals to get USD-e8
            uint256 colUsd = (col * priceE8) / (10 ** configs[asset].decimals);
            // apply LTV for HF numerator
            colE8 += (colUsd * configs[asset].ltvE4) / 10000;

            // debt
            uint256 deb = debtOf(user, asset);
            uint256 debUsd = (deb * priceE8) / (10 ** configs[asset].decimals);
            debtE8 += debUsd;
        }

        uint256 hf = (debtE8 == 0) ? type(uint256).max : (colE8 * 1e18) / debtE8;
        return (colE8, debtE8, hf);
    }

    // ======= Accrual =======
    function accrueInterest(address asset) public {
        AssetState storage s = states[asset];
        AssetConfig storage c = configs[asset];
        require(c.isListed, "unlisted");

        uint256 nowTs = _now();
        uint256 dt = nowTs - s.lastAccrual;
        if (dt == 0) return;

        s.lastAccrual = uint40(nowTs);
        if (s.totalBorrows == 0) return;

        uint256 rbps = _borrowRate(asset); // per second, 1e18
        // interest = borrows * rbps * dt
        uint256 interest = (s.totalBorrows * rbps * dt) / 1e18;
        s.totalBorrows += interest;

        // reserves
        uint256 reserves = (interest * c.reserveFactorE4) / 10000;
        s.totalReserves += reserves;

        // update borrowIndex
        uint256 borrowsPrior = s.totalBorrows - interest;
        // newIndex = oldIndex * (1 + interest/borrowsPrior)
        //           = oldIndex + oldIndex * interest / borrowsPrior
        if (borrowsPrior > 0) {
            s.borrowIndexE18 = s.borrowIndexE18 + (s.borrowIndexE18 * interest) / borrowsPrior;
        }
    }

    // ======= Core: Deposit / Withdraw =======
    function deposit(address asset, uint256 amount) external nonReentrant {
        AssetConfig storage c = configs[asset];
        AssetState storage s = states[asset];
        require(c.isListed, "unlisted");
        require(amount > 0, "zero");

        accrueInterest(asset);

        // compute aToken shares to mint
        uint256 er = getExchangeRateE18(asset);
        // shares = amount / er
        uint256 shares = (amount * 1e18) / er;

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        s.totalCash += amount;

        AToken(c.aToken).mint(msg.sender, shares);

        emit Deposit(msg.sender, asset, amount, shares);
    }

    function withdraw(address asset, uint256 shares) external nonReentrant {
        AssetConfig storage c = configs[asset];
        AssetState storage s = states[asset];
        require(c.isListed, "unlisted");
        require(shares > 0, "zero");

        accrueInterest(asset);

        uint256 er = getExchangeRateE18(asset);
        uint256 amountOut = (shares * er) / 1e18;

        // checks: enough cash
        require(amountOut <= s.totalCash, "insufficient cash");

        AToken(c.aToken).burn(msg.sender, shares);

        s.totalCash -= amountOut;
        IERC20(asset).safeTransfer(msg.sender, amountOut);

        emit Withdraw(msg.sender, asset, shares, amountOut);
    }

    // ======= Core: Borrow / Repay =======
    function borrow(address asset, uint256 amount, address[] calldata allAssets) external nonReentrant {
        AssetConfig storage c = configs[asset];
        AssetState storage s = states[asset];
        require(c.isListed, "unlisted");
        require(amount > 0, "zero");

        accrueInterest(asset);

        // Check HF after
        // Compute user total collateral (LTV-applied) and total debt including this borrow
        (uint256 colE8, uint256 debtE8Before, ) = this.getUserAccountData(msg.sender, allAssets);
        (int256 px, ) = oracle.getPrice(asset);
        require(px > 0, "bad px");
        uint256 priceE8 = uint256(px);
        uint256 addDebtUsdE8 = (amount * priceE8) / (10 ** c.decimals);
        uint256 debtAfter = debtE8Before + addDebtUsdE8;

        require(debtAfter > 0, "calc err");
        // HF = col / debtAfter  (all in e8, but we compare with liqThreshold? Use >=1 check logically)
        // For simplicity, require colE8 >= debtAfter
        require(colE8 >= debtAfter, "HF < 1");

        // mint debt shares
        // shares = amount * 1e18 / borrowIndex
        uint256 shares = (amount * 1e18) / s.borrowIndexE18;
        DebtToken(c.debtToken).mint(msg.sender, shares);

        // book-keeping & transfer
        s.totalBorrows += amount;
        require(amount <= s.totalCash, "insufficient liquidity");
        s.totalCash -= amount;
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, asset, amount, shares);
    }

    function repay(address asset, uint256 amount, address onBehalfOf) external nonReentrant {
        AssetConfig storage c = configs[asset];
        AssetState storage s = states[asset];
        require(c.isListed, "unlisted");
        require(amount > 0, "zero");

        accrueInterest(asset);

        // user's current debt in underlying
        uint256 userDebt = debtOf(onBehalfOf, asset);
        if (amount > userDebt) amount = userDebt;

        // corresponding shares = amount * 1e18 / borrowIndex
        uint256 shares = (amount * 1e18) / s.borrowIndexE18;
        if (shares > ERC20(c.debtToken).balanceOf(onBehalfOf)) {
            shares = ERC20(c.debtToken).balanceOf(onBehalfOf);
            // recalc amount = shares * index / 1e18
            amount = (shares * s.borrowIndexE18) / 1e18;
        }

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        s.totalCash += amount;
        s.totalBorrows -= amount;

        DebtToken(c.debtToken).burn(onBehalfOf, shares);

        emit Repay(msg.sender, onBehalfOf, asset, amount, shares);
    }

    // ======= Liquidation =======
    function liquidate(
        address user,
        address debtAsset,
        address collateralAsset,
        uint256 repayAmount,                 // amount of debtAsset to repay
        address[] calldata allAssets
    ) external nonReentrant {
        // Accrue both markets for correctness
        accrueInterest(debtAsset);
        accrueInterest(collateralAsset);

        AssetConfig storage dcfg = configs[debtAsset];
        AssetConfig storage ccfg = configs[collateralAsset];
        require(dcfg.isListed && ccfg.isListed, "unlisted");

        // Check if user is liquidatable: HF using liquidationThreshold (a bit stricter)
        (uint256 colE8, uint256 debtE8, ) = this.getUserAccountData(user, allAssets);

        // Recompute using liquidation threshold instead of LTV for safety:
        // Quick-and-dirty: adjust colE8 to mimic threshold by scaling with (liqThreshold/ltv)
        // (For MVP; in production compute with thresholds directly per-asset.)
        require(debtE8 > 0, "no debt");
        uint256 adjColE8 = (colE8 * ccfg.liqThresholdE4) / ccfg.ltvE4;
        require(adjColE8 < debtE8, "HF >= 1");

        // Limit by closeFactor
        uint256 userDebt = debtOf(user, debtAsset);
        uint256 maxClose = (userDebt * dcfg.closeFactorE4) / 10000;
        if (repayAmount > maxClose) repayAmount = maxClose;

        // Take repayment from liquidator
        IERC20(debtAsset).safeTransferFrom(msg.sender, address(this), repayAmount);

        // Burn user's debt shares corresponding to repayAmount
        AssetState storage ds = states[debtAsset];
        uint256 debtSharesToBurn = (repayAmount * 1e18) / ds.borrowIndexE18;
        if (debtSharesToBurn > ERC20(dcfg.debtToken).balanceOf(user)) {
            debtSharesToBurn = ERC20(dcfg.debtToken).balanceOf(user);
            repayAmount = (debtSharesToBurn * ds.borrowIndexE18) / 1e18;
        }
        ds.totalCash += repayAmount;
        ds.totalBorrows -= repayAmount;
        DebtToken(dcfg.debtToken).burn(user, debtSharesToBurn);

        // Compute seize amount of collateral with bonus
        (int256 debtPx, ) = oracle.getPrice(debtAsset);
        (int256 colPx, ) = oracle.getPrice(collateralAsset);
        require(debtPx > 0 && colPx > 0, "bad px");

        uint256 repayUsdE8 = (repayAmount * uint256(debtPx)) / (10 ** dcfg.decimals);
        // seize in underlying = repayUSD * (1 + bonus) / price(collateral)
        uint256 seizeUsdE8 = (repayUsdE8 * (10000 + ccfg.liqBonusE4)) / 10000;
        uint256 seizeUnderlying = (seizeUsdE8 * (10 ** ccfg.decimals)) / uint256(colPx);

        // Burn user's aTokens (seizing collateral)
        uint256 er = getExchangeRateE18(collateralAsset);
        // needed aToken shares to cover seizeUnderlying
        uint256 aSharesToBurn = (seizeUnderlying * 1e18) / er;

        require(aSharesToBurn <= ERC20(ccfg.aToken).balanceOf(user), "not enough collateral");

        AToken(ccfg.aToken).burn(user, aSharesToBurn);

        // Transfer seized underlying to liquidator
        AssetState storage cs = states[collateralAsset];
        require(seizeUnderlying <= cs.totalCash, "insufficient cash");
        cs.totalCash -= seizeUnderlying;
        IERC20(collateralAsset).safeTransfer(msg.sender, seizeUnderlying);

        emit Liquidation(msg.sender, user, debtAsset, collateralAsset, repayAmount, seizeUnderlying);
    }

    // ======= Admin tweaks =======
    function setOracle(IPriceOracle _oracle) external onlyAdmin { oracle = _oracle; }

    function setParams(
        address asset,
        uint256 reserveFactorE4,
        uint256 ltvE4,
        uint256 liqThresholdE4,
        uint256 liqBonusE4,
        uint256 closeFactorE4
    ) external onlyAdmin {
        AssetConfig storage c = configs[asset];
        require(c.isListed, "unlisted");
        require(ltvE4 <= liqThresholdE4, "ltv>threshold");
        c.reserveFactorE4 = reserveFactorE4;
        c.ltvE4 = ltvE4;
        c.liqThresholdE4 = liqThresholdE4;
        c.liqBonusE4 = liqBonusE4;
        c.closeFactorE4 = closeFactorE4;
    }

    // ======= Internal helpers (for testing/seed) =======
    function _syncCash(address asset) external {
        // optional helper: sync recorded cash to actual token balance (useful in dev)
        uint256 bal = IERC20(asset).balanceOf(address(this));
        states[asset].totalCash = bal + states[asset].totalBorrows - states[asset].totalReserves; // rough
    }
}
