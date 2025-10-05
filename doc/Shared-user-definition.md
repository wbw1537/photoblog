# Shared User Definition

## Overview

A **Shared User** is a conceptual entity representing any user (local or remote) with whom a local user has established a trusted relationship for federated asset sharing. This concept enables secure cross-instance communication and resource access in the photoblog federation network.

## Database Architecture

### Core Tables

#### User Table (Universal User Model)
```sql
User {
  id: String (cuid)
  name: String
  email: String (unique)
  type: UserType (Admin|Normal|Pending|Remote)
  instanceUrl: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### LocalUser Table (Local Instance Data)
```sql
LocalUser {
  id: String (cuid)
  userId: String (FK to User.id)
  password: String (hashed)
  basePath: String (file system path)
  cachePath: String (cache directory)
  publicKey: String (RSA public key for federation)
  privateKey: String (RSA private key for federation)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### RemoteUser Table (Federated User Data)
```sql
RemoteUser {
  id: String (cuid)
  userId: String (FK to User.id)
  instanceUrl: String (remote instance URL)
  publicKey: String (remote user's RSA public key)
  tempSymmetricKey: String (DHKE shared secret)
  accessToken: String (JWT for API access)
  accessTokenExpireTime: DateTime
  session: String (encrypted session data)
  status: RemoteUserStatus (Pending|Active|Blocked)
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### UserRelationship Table (Trust Relationships)
```sql
UserRelationship {
  id: String (cuid)
  fromUserId: String (FK to User.id - initiator)
  toUserId: String (FK to User.id - target)
  relationshipType: RelationshipType (Share|Block)
  status: RelationshipStatus (Pending|Active|Blocked)
  permissions: Json (sharing permissions)
  comment: String (optional notes)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Shared User Types

### 1. Local-to-Local Shared User
- **Definition**: Another local user on the same instance with established sharing relationship
- **Database Representation**:
  - Both users exist in `User` table with `type: Normal/Admin`
  - Both have corresponding `LocalUser` records
  - Relationship tracked in `UserRelationship` table
- **Authentication**: Standard JWT-based authentication
- **Access**: Direct database queries, no federation required

### 2. Local-to-Remote Shared User
- **Definition**: A user from another instance with established federated relationship
- **Database Representation**:
  - Local user: `User` + `LocalUser` records
  - Remote user: `User` (type: Remote) + `RemoteUser` records
  - Relationship tracked in `UserRelationship` table
- **Authentication**: RSA key pair + DHKE for secure communication
- **Access**: Federated API calls through private endpoints

## Federation Process

### Trust Establishment (DHKE Protocol)
1. **Initialization**: Local user initiates connection with remote user
2. **Key Exchange**: Temporary X25519 keys exchanged via Diffie-Hellman
3. **Symmetric Key**: Shared secret generated for secure communication
4. **Public Key Exchange**: Permanent RSA keys exchanged (encrypted with symmetric key)
5. **Verification**: Digital signatures validated using exchanged public keys
6. **Activation**: Relationship status updated to `Active`

### Session Management
- **Access Tokens**: JWT tokens for API authentication
- **Session Keys**: Encrypted session data for secure communication
- **Token Refresh**: Automatic renewal when tokens expire
- **Signature Validation**: RSA signatures for request authentication

## Service Layer Integration

### SharedUserService Responsibilities
1. **Relationship Management**: Create, activate, block shared user relationships
2. **Key Exchange**: Handle DHKE protocol implementation
3. **Session Management**: Generate and validate access tokens/sessions
4. **Federation**: Proxy requests to remote instances
5. **Authentication**: Validate signatures and permissions

### API Endpoints
- **Public API**: Standard user operations (`/api/v1/*`)
- **Private API**: Federated access (`/api/private/v1/*`)
- **Handshake API**: Trust establishment (`/handshake/*`)

## Security Considerations

### Encryption
- **RSA Keys**: 2048-bit keys for digital signatures and public key encryption
- **AES-256-CBC**: Symmetric encryption for sensitive data exchange
- **DHKE**: X25519 curves for ephemeral key exchange

### Access Control
- **Permission Matrix**: JSON-based permissions in UserRelationship
- **Status Validation**: Only `Active` relationships allow access
- **Signature Verification**: All federated requests must be signed

### Data Isolation
- **Local Data**: Accessible only to local users and active shared users
- **Remote Data**: Proxied through federation layer with permission checks
- **Session Security**: Encrypted sessions with expiration times

## Migration Considerations

The refactored architecture provides:
- **Unified User Model**: Single source of truth for all users
- **Type Safety**: Clear distinction between local and remote users
- **Relationship Flexibility**: Extensible relationship types and permissions
- **Federation Scalability**: Support for multiple instance connections
- **Data Consistency**: Foreign key constraints and cascading deletes

