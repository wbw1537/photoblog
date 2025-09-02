# Network & Sharing Documentation

This document outlines the authentication mechanism for user-to-user connections across different instances in a federated network. The process ensures secure communication and data exchange between users on separate instances.

## Basic Flow

1. **Trust Establishment**: User A on Instance A establish a trusted connection with User B on Instance B.
2. **Assets Sharing**: Based on the established trust, User A can make authenticated API requests to Instance B, access User B exposed assets.

## Detailed Flow

### Trust Establishment

#### Overview

The **Trust Establishment** part assume current connection between Instance A and Instance B is not in a secure state, the core algorism used is **Diffie-Hellman Key Exchange (DHKE)**, which allows two parties to generate a shared secret over the insecure channel. Finally, parties will exchange their permanent key pair for future authentication, each party will keep their own private key secret and share the public key with the other party.

#### Sequence Diagram

```mermaid
sequenceDiagram
    title: Authenticating Mechanism (User-Centric Approach)
    
    participant UA as User A
    participant IA as Instance A
    participant IB as Instance B
    participant UB as User B
    
    activate UA
    UA->>+IA: Require connection with User B
    
    IA->>IA: Generate temporary public key and private key
    IA->>+IB: POST /handshake/init
    
    note over IA: Request:<br/>1. User A's ID<br/>2. Temporary public key<br/>3. Timestamp<br/>4. Connect purpose
    note over IB: Response:<br/>1. User B's ID<br/>2. Temporary public key<br/>3. Timestamp
    
    IB-->>IA: Response /handshake/init
    IB->>+UB: Require User B's approval for connection
    UB->>IB: Approve connection to User A
    
    IA->>IA: Establish shared secret using Diffie-Hellman
    IB->>IB: Establish shared secret using Diffie-Hellman
    IB->>IB: Generate permanent key pair
    
    IB->>IA: POST /handshake/exchange
    IA->>IA: Generate permanent key pair
    
    note over IB: Request:<br/>1. User B's ID<br/>2. Encrypted permanent public key<br/>3. User approval status
    note over IA: Response:<br/>1. User A's ID<br/>2. Encrypted permanent public key of IA
    
    IA-->>IB: Response to /handshake/exchange
    
    IA->>IB: POST /handshake/verify
    
    note over IA: Request:<br/>1. User A's ID<br/>2. Signed message (User IDs + timestamp)
    note over IB: Response:<br/>1. User B's ID<br/>2. Signed message from IB
    
    IB-->>IA: Response to /handshake/verify
    
    IA->>IA: Verify IB's signature
    IB->>IB: Verify IA's signature
    
    IA->>IB: POST /handshake/complete
    
    note over IA: Request:<br/>1. User A's ID<br/>2. Final confirmation
    note over IB: Response:<br/>1. User B's ID<br/>2. Acknowledgment
    
    IB-->>IA: Respond to /handshake/complete
    
    IA->>UA: connection established
    IB->>UB: connection established
    
    IA->>IB: POST /api/auth
    
    note over IA: Request:<br/>1. User A's ID<br/>2. Encrypted session key<br/>Encrypted by instance B's public key
    note over IB: Response:<br/>1. Expiration time
    
    IB-->>IA: Respond to /api/auth
    
    IA->>IB: POST /api/someEndpoint
    
    note over IA: Request:<br/>1. Encrypted payload (Request data + timestamp)
    note over IB: Response:<br/>1. Encrypted response data
    
    IB-->>IA: Respond to /api/someEndpoint
    
    deactivate UB
    deactivate IB
    deactivate IA
    deactivate UA
```

### Assets Sharing

#### Overview

Once the trust is established between User A and User B, User A can make authenticated API requests to Instance B to access User B's exposed assets.

When Instance A receives a request from User A to access User B's assets, it will first check if User B is a user in current instance, if not, it will check if User B is a trusted remote user. If so, the request would be federated to Instance B to fetch the assets.

We provide a private API endpoint on each assets like `/api/private/v1/photos` which only accept requests from trusted users.

#### Sequence Diagram

```mermaid
sequenceDiagram
    title: Accessing Shared Assets
    participant UA as User A
    participant IA as Instance A
    participant IB as Instance B
    participant UB as User B
    activate UB
    UB->>IB: Expose assets to User A
    IB->>IB: Mark assets as shared with User A
    deactivate UB
    activate UA
    UA->>IA: Request access to User B's assets<br/>GET /api/photos
    activate IA
    IA->>IA: Check if User B is local user
    IA->>IA: Check if User B is a trusted remote user
    IA->>IB: GET /api/private/v1/photos
    activate IB
    note over IA: Request:<br/>1. User A's ID<br/>2. Asset request details
    IB->>IB: Verify User A's trust status
    note over IB: Response:<br/>1. Requested assets
    IB-->>IA: Response to /api/private/v1/photos
    IA-->>UA: Deliver requested assets
    deactivate IA
    deactivate IB
    deactivate UA
```

## Security Considerations

The application would determine if HTTPS is enabled between instances.

- If HTTPS is supported, instances will communicate directly using HTTPS.
- If not, instances will generate a symmetric key for encrypting the communication.

## Further implementation tasks

- Add a is local field in User table, enhance shared-user service to add the user into user table after trust establishment.
- Enhance all assets API to involve shared-user checking logic.
- Implement private API endpoints for assets.
