// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LoanFactory is ReentrancyGuard {
    struct Loan {
        uint256 id;
        address borrower;
        address lender;
        uint256 amount;
        uint256 duration; // in seconds
        uint256 interestRate; // basis points (e.g., 500 = 5%)
        string purpose;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 repaidAt;
        LoanStatus status;
        uint256 totalRepayment;
    }

    enum LoanStatus {
        Pending,
        Funded,
        Repaid,
        Defaulted,
        Cancelled
    }

    uint256 public loanCounter;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderLoans;

    IERC20 public lendingToken;

    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 duration, uint256 interestRate);
    event LoanFunded(uint256 indexed loanId, address indexed lender);
    event LoanDisbursed(uint256 indexed loanId);
    event LoanRepaid(uint256 indexed loanId, uint256 amount);
    event LoanCancelled(uint256 indexed loanId);

    constructor(address _lendingToken) {
        lendingToken = IERC20(_lendingToken);
    }

    function createLoan(
        uint256 _amount,
        uint256 _duration,
        uint256 _interestRate,
        string memory _purpose
    ) external returns (uint256) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_interestRate > 0 && _interestRate <= 10000, "Invalid interest rate");

        uint256 loanId = loanCounter++;
        uint256 totalRepayment = _amount + (_amount * _interestRate / 10000);

        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            lender: address(0),
            amount: _amount,
            duration: _duration,
            interestRate: _interestRate,
            purpose: _purpose,
            createdAt: block.timestamp,
            fundedAt: 0,
            repaidAt: 0,
            status: LoanStatus.Pending,
            totalRepayment: totalRepayment
        });

        borrowerLoans[msg.sender].push(loanId);

        emit LoanCreated(loanId, msg.sender, _amount, _duration, _interestRate);
        return loanId;
    }

    function fundLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Pending, "Loan is not pending");
        require(msg.sender != loan.borrower, "Borrower cannot fund own loan");

        require(
            lendingToken.transferFrom(msg.sender, address(this), loan.amount),
            "Token transfer failed"
        );

        loan.lender = msg.sender;
        loan.fundedAt = block.timestamp;
        loan.status = LoanStatus.Funded;

        lenderLoans[msg.sender].push(_loanId);

        emit LoanFunded(_loanId, msg.sender);
    }

    function disburseLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan is not funded");
        require(msg.sender == loan.borrower, "Only borrower can disburse");

        require(
            lendingToken.transfer(loan.borrower, loan.amount),
            "Token transfer failed"
        );

        emit LoanDisbursed(_loanId);
    }

    function repayLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan is not funded");
        require(msg.sender == loan.borrower, "Only borrower can repay");

        require(
            lendingToken.transferFrom(msg.sender, loan.lender, loan.totalRepayment),
            "Token transfer failed"
        );

        loan.repaidAt = block.timestamp;
        loan.status = LoanStatus.Repaid;

        emit LoanRepaid(_loanId, loan.totalRepayment);
    }

    function cancelLoan(uint256 _loanId) external {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Pending, "Can only cancel pending loans");
        require(msg.sender == loan.borrower, "Only borrower can cancel");

        loan.status = LoanStatus.Cancelled;

        emit LoanCancelled(_loanId);
    }

    function getBorrowerLoans(address _borrower) external view returns (uint256[] memory) {
        return borrowerLoans[_borrower];
    }

    function getLenderLoans(address _lender) external view returns (uint256[] memory) {
        return lenderLoans[_lender];
    }

    function getAllPendingLoans() external view returns (Loan[] memory) {
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < loanCounter; i++) {
            if (loans[i].status == LoanStatus.Pending) {
                pendingCount++;
            }
        }

        Loan[] memory pendingLoans = new Loan[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < loanCounter; i++) {
            if (loans[i].status == LoanStatus.Pending) {
                pendingLoans[index] = loans[i];
                index++;
            }
        }

        return pendingLoans;
    }

    function getLoanDetails(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }
}
