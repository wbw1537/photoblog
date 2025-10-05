# Implementation Roadmap: Photoblog Project

This document outlines the strategic, three-phase implementation plan for the Photoblog project. The roadmap is designed to deliver value incrementally, starting with a robust, standalone application and progressively adding advanced federated and Web3 features.

---

## Phase 1: Local-First Photo Management Application

**Goal:** Create a fully-featured, user-friendly, and easily deployable photo management system for a single user. The primary deliverable is a polished, installable Docker image for a seamless self-hosting experience.

### 1.1. Backend Solidification
- **[ ] API Finalization:** Review and complete the RESTful API endpoints for all core entities: `User`, `Photo`, `PhotoFile`, `Blog`, and `Tag`. Ensure consistent request/response formats and error handling.
- **[ ] Core Logic Refinement:**
    -   Strengthen the photo scanning and indexing logic in `photo-scan.service.ts`.
    -   Optimize thumbnail generation in `convert-photo.job.ts` for performance and quality.
    -   Ensure EXIF data extraction is robust and handles edge cases.
- **[ ] Authentication:** Implement a secure, local-only authentication system using JWTs based on username and password. The `LocalUser` model will be the source of truth.
- **[ ] Configuration:** Externalize all configuration (database URL, photo paths, cache paths, JWT secrets) using a `.env` file to make the application environment-agnostic and Docker-friendly.

### 1.2. Frontend Development (UI/UX)
- **[ ] Technology Stack Selection:**
    -   **Framework:** Adopt a modern frontend framework like **React (with Vite or Next.js)** for a reactive and efficient user interface.
    -   **Styling:** Utilize a component library like **Material-UI** or a utility-first CSS framework like **Tailwind CSS** to build a professional and responsive design.
- **[ ] Core UI Components:**
    -   **Photo Gallery:** A responsive grid view with lazy loading for displaying photo thumbnails.
    -   **Photo Detail View:** A view to display a single photo, its metadata (EXIF), tags, and description.
    -   **Blog Editor:** A rich-text editor (e.g., TipTap, TinyMCE) for creating and editing blog posts with embedded photos.
    -   **Tag Management:** An interface to create, view, and manage tags, and see all photos/blogs associated with a tag.
    -   **Settings/Admin Panel:** A section for the user to configure their `basePath`, trigger new photo scans, and manage their account.

### 1.3. Packaging and Deployment
- **[ ] Dockerization:**
    -   Create a multi-stage `Dockerfile` for the Node.js backend to produce a small, optimized production image.
    -   Create a `docker-compose.yml` file to orchestrate the backend service and a MySQL database service. This will enable a one-command (`docker-compose up`) installation for end-users.
- **[ ] Documentation:** Write clear, concise documentation in the `README.md` on how to deploy the application using the provided Docker Compose setup.
- **[ ] Release:** Publish the final Docker image to Docker Hub.

**Phase 1 Deliverable:** A stable, self-hostable photo management application focused on an excellent single-user experience.

---

## Phase 2: Web2 Federated Sharing

**Goal:** Implement the secure, private, instance-to-instance sharing functionality as specified in the project's design documents.

### 2.1. Backend Implementation
- **[ ] Implement Handshake API (`/handshake/*`):**
    -   Develop the controllers and services to handle the Diffie-Hellman Key Exchange (DHKE) protocol.
    -   Use the built-in Node.js `crypto` module for generating key pairs and shared secrets.
    -   Persist remote user data and relationship status in the `RemoteUser` and `UserRelationship` tables.
- **[ ] Implement Private API (`/api/private/v1/*`):**
    -   Create a new set of routes protected by a custom authentication middleware.
    -   This middleware must verify the digital signature of incoming requests from federated instances using the stored public keys.
- **[ ] Service Layer Integration:**
    -   Update existing services (`photo.service.ts`, `blog.service.ts`) to handle data requests from authenticated remote users.
    -   The services must check permissions defined in the `UserRelationship` table before returning data.
- **[ ] Federation Logic:** Implement the logic that proxies a local user's request to a remote instance if the requested resource belongs to a `RemoteUser`.

### 2.2. Frontend Integration
- **[ ] Connection Management UI:**
    -   Create a "Connections" or "Friends" page where a user can initiate a connection by entering a remote user's instance URL and email.
    -   Build the UI for users to see pending incoming requests and approve or deny them.
- **[ ] Unified Content View:**
    -   Integrate remote content seamlessly into the main photo gallery and blog feeds.
    -   Add visual indicators (e.g., user avatars, instance URLs) to distinguish local content from remote content.

**Phase 2 Deliverable:** An updated application version that allows users on different instances to form trusted relationships and share photos and blogs privately and securely.

---

## Phase 3: Web3 Integration (NFT Minting)

**Goal:** Empower users to take public ownership of their work by minting photos as NFTs on a public blockchain.

### 3.1. Smart Contract Development
- **[ ] NFT Contract (ERC-721):**
    -   Develop an ERC-721 compliant smart contract in **Solidity**.
    -   Use the battle-tested **OpenZeppelin Contracts** library for security and standards compliance.
    -   Implement the **EIP-2981** standard for on-chain royalty payments.
- **[ ] Deployment:**
    -   Deploy the contract to a cost-effective Layer 2 blockchain like **Polygon** or **Optimism**.
    -   First, deploy to a testnet (e.g., Polygon Mumbai) for thorough testing.

### 3.2. Backend Infrastructure
- **[ ] Database Schema Update:**
    -   Add the new Web3-related fields to the `Photo` model in `prisma/schema.prisma` (`ipfsCid`, `tokenId`, `mintingStatus`, etc.).
    -   Create and apply the new database migration.
- **[ ] Decentralized Storage Integration (IPFS):**
    -   Integrate an IPFS client or a pinning service API (e.g., **Pinata**, **Infura IPFS**).
    -   Create a `Web3Service` that handles uploading a photo and its metadata JSON to IPFS.
- **[ ] Minting API:**
    -   Create a new `web3.controller.ts` with an endpoint like `POST /api/v1/web3/prepare-mint/:photoId`.
    -   This endpoint will upload the assets to IPFS and construct the unsigned minting transaction data. It will **never** handle private keys.

### 3.3. Frontend DApp Functionality
- **[ ] Wallet Integration:**
    -   Integrate a wallet connection library like **RainbowKit** or **ConnectKit** to provide a smooth, user-friendly "Connect Wallet" experience.
    -   Use **wagmi** or **ethers.js** for interacting with the user's wallet and the blockchain.
- **[ ] Minting Flow:**
    -   Add a "Mint as NFT" button to the photo detail page.
    -   Create a modal or form that guides the user through the minting process.
    -   The frontend will call the backend to get the prepared transaction data.
    -   The frontend will then use the user's wallet (e.g., MetaMask) to prompt them to sign and send the transaction.
- **[ ] Web3 Profile View:**
    -   Display the status of minted photos (e.g., "Minting...", "Minted").
    -   Provide links to view the NFT on a blockchain explorer (e.g., PolygonScan) and popular NFT marketplaces (e.g., OpenSea).

**Phase 3 Deliverable:** A fully integrated application that bridges Web2 and Web3, offering users a private management tool and a public platform for true digital ownership.
