// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    // NFT contract address => Token ID => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    // Marketplace fee (2.5%)
    uint256 public marketplaceFee = 250; // 250 basis points = 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;

    event NFTListed(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event NFTSold(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 price
    );

    event ListingCancelled(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed seller
    );

    function listNFT(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be greater than 0");
        
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.getApproved(tokenId) == address(this) || 
            nft.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listings[nftAddress][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit NFTListed(nftAddress, tokenId, msg.sender, price);
    }

    function buyNFT(address nftAddress, uint256 tokenId) 
        external 
        payable 
        nonReentrant 
    {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.isActive, "NFT not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == listing.seller, "Seller no longer owns NFT");

        // Calculate marketplace fee
        uint256 fee = (listing.price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerProceeds = listing.price - fee;

        // Mark as inactive
        listings[nftAddress][tokenId].isActive = false;

        // Transfer NFT to buyer
        nft.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer payment to seller
        (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(success, "Transfer to seller failed");

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }

        emit NFTSold(nftAddress, tokenId, msg.sender, listing.seller, listing.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId) 
        external 
        nonReentrant 
    {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");

        listings[nftAddress][tokenId].isActive = false;

        emit ListingCancelled(nftAddress, tokenId, msg.sender);
    }

    function getListing(address nftAddress, uint256 tokenId) 
        external 
        view 
        returns (Listing memory) 
    {
        return listings[nftAddress][tokenId];
    }

    function updateMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = newFee;
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {}
}
