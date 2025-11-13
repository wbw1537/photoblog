# Feature List

## v0.1.0

### Blog Management

- ✅ **PB-BLOG-01**: Backend - User can create a blog post via API
- ❌ **PB-BLOG-02**: UI - Provides a rich-text editor for creating and editing blog posts
- ✅ **PB-BLOG-03**: Backend - API provides filtering for retrieving blog posts
- ❌ **PB-BLOG-04**: UI - Provides a list view with filters to browse blog posts
- ✅ **PB-BLOG-05**: Backend - API allows viewing a single blog post by its ID
- ❌ **PB-BLOG-06**: UI - Displays a single blog post

### Photo Scanning

- ✅ **PB-SCAN-01**: Backend - User can initiate a full scan of their photo directory via API
  - 📚 Tech Doc: [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md)
- ❌ **PB-SCAN-02**: UI - Provides a button to trigger a full photo scan from the settings page
- ✅ **PB-SCAN-03**: Backend - User can initiate a delta scan to find new photos via API
  - 📚 Tech Doc: [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md)
- ❌ **PB-SCAN-04**: UI - Provides a button to trigger a delta scan from the settings page
- ✅ **PB-SCAN-05**: Backend - User can check the status of a scan via API
  - 📚 Tech Doc: [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md)
- ❌ **PB-SCAN-06**: UI - Displays the current status of a photo scan

### Photo Social Features

- ✅ **PB-SOCIAL-01**: Backend - User can "like" a photo via API
- ✅ **PB-SOCIAL-02**: Backend - User can "unlike" a photo via API
- ❌ **PB-SOCIAL-03**: UI - Provides a button to "like" and "unlike" a photo

### Photo Viewing & Gallery

- ✅ **PB-GALLERY-01**: Backend - API provides extensive filtering options for retrieving photos
- ❌ **PB-GALLERY-02**: UI - Provides a gallery view with filters to browse photos
- ✅ **PB-GALLERY-03**: Backend - API provides detailed information for a single photo
- ❌ **PB-GALLERY-04**: UI - Provides a detail view page for a single photo
- ✅ **PB-GALLERY-05**: Backend - API allows viewing of photo image files at different resolutions
- ❌ **PB-GALLERY-06**: UI - Displays photo images in the gallery and detail views
- ✅ **PB-GALLERY-07**: Backend - API provides a low-resolution preview of a photo
- ❌ **PB-GALLERY-08**: UI - Uses photo previews for gallery view thumbnails

### Tag Management

- ✅ **PB-TAG-01**: Backend - API allows adding, updating, and deleting tags
- ❌ **PB-TAG-02**: UI - Provides an interface for managing tags

### User Authentication

- ✅ **PB-AUTH-01**: Backend - User can register a new account via API
- ❌ **PB-AUTH-02**: UI - User can register a new account via a UI form
- ✅ **PB-AUTH-03**: Backend - User can log in with email and password via API
- ❌ **PB-AUTH-04**: UI - User can log in with email and password via a UI form
- ✅ **PB-AUTH-05**: Backend - API endpoint to check if an email is already registered
- ❌ **PB-AUTH-06**: UI - Real-time feedback on email availability during registration
- ✅ **PB-AUTH-07**: Backend - Application supports token refreshing for persistent sessions

### User Profile Management

- ✅ **PB-PROFILE-01**: Backend - Authenticated user can retrieve their own information via API
- ❌ **PB-PROFILE-02**: UI - Displays user profile information on a settings/profile page
- ✅ **PB-PROFILE-03**: Backend - Authenticated user can modify their own information via API
- ❌ **PB-PROFILE-04**: UI - Provides a form for users to update their profile information


## v0.2.0

### Federation & Networking

- ✅ **PB-NETWORK-01**: Backend - API allows fetching public user info from a remote instance
  - 📚 Tech Doc: [Network-and-sharing.md](tech/Network-and-sharing.md)
- ❌ **PB-NETWORK-02**: UI - Provides a form to fetch and display remote user info
- ✅ **PB-NETWORK-03**: Backend - API allows initiating a trusted relationship with a remote user
  - 📚 Tech Doc: [Network-and-sharing.md](tech/Network-and-sharing.md)
- ❌ **PB-NETWORK-04**: UI - Provides a button to send a connection request to a remote user
- ✅ **PB-NETWORK-05**: Backend - API allows approving a pending relationship request
  - 📚 Tech Doc: [Network-and-sharing.md](tech/Network-and-sharing.md)
- ❌ **PB-NETWORK-06**: UI - Displays incoming connection requests with approve/deny buttons
- ✅ **PB-NETWORK-07**: Backend - API allows blocking an existing relationship
  - 📚 Tech Doc: [Network-and-sharing.md](tech/Network-and-sharing.md)
- ❌ **PB-NETWORK-08**: UI - Provides a button to block a connected user
- ✅ **PB-NETWORK-09**: Backend - System handles the secure key exchange (handshake) protocol
  - 📚 Tech Doc: [Network-and-sharing.md](tech/Network-and-sharing.md), [Shared-user-definition.md](tech/Shared-user-definition.md)
- ✅ **PB-NETWORK-10**: Backend - System provides private API endpoints for federated access
  - 📚 Tech Doc: [Network-and-sharing.md](tech/Network-and-sharing.md)
- ✅ **PB-NETWORK-11**: Backend - System proxies a local user's request to a remote instance
  - 📚 Tech Doc: [Network-and-sharing.md](tech/Network-and-sharing.md)

