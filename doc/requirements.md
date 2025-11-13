# Requirements

| PBID | Requirement | Reason | Priority | Status | Tech Doc Reference? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PB-1 | Backend - User can register a new account via API. | Core functionality for a multi-user system. | High | Implemented | N/A |
| PB-2 | UI - User can register a new account via a UI form. | Core functionality for a multi-user system. | High | Not Implemented | N/A |
| PB-3 | Backend - User can log in with email and password via API. | Core functionality for user authentication. | High | Implemented | N/A |
| PB-4 | UI - User can log in with email and password via a UI form. | Core functionality for user authentication. | High | Not Implemented | N/A |
| PB-5 | Backend - API endpoint to check if an email is already registered. | Improves user experience during registration. | Medium | Implemented | N/A |
| PB-6 | UI - Real-time feedback on email availability during registration. | Improves user experience during registration. | Medium | Not Implemented | N/A |
| PB-7 | Backend - Authenticated user can retrieve their own information via API. | Allows users to view their profile details. | High | Implemented | N/A |
| PB-8 | UI - Displays user profile information on a settings/profile page. | Allows users to view their profile details. | High | Not Implemented | N/A |
| PB-9 | Backend - Authenticated user can modify their own information via API. | Allows users to update their profile. | High | Implemented | N/A |
| PB-10 | UI - Provides a form for users to update their profile information. | Allows users to update their profile. | High | Not Implemented | N/A |
| PB-11 | Backend - Application supports token refreshing for persistent sessions. | Improves user experience by avoiding frequent logouts. | High | Implemented | N/A |
| PB-12 | Backend - User can initiate a full scan of their photo directory via API. | Core functionality for importing photos into the system. | High | Implemented | [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md) |
| PB-13 | UI - Provides a button to trigger a full photo scan from the settings page. | Core functionality for importing photos into the system. | High | Not Implemented | N/A |
| PB-14 | Backend - User can initiate a delta scan to find new photos via API. | Provides an efficient way to update the photo library. | High | Implemented | [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md) |
| PB-15 | UI - Provides a button to trigger a delta scan from the settings page. | Provides an efficient way to update the photo library. | High | Not Implemented | N/A |
| PB-16 | Backend - User can check the status of a scan via API. | Provides feedback on long-running background processes. | High | Implemented | [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md) |
| PB-17 | UI - Displays the current status of a photo scan. | Provides feedback on long-running background processes. | High | Not Implemented | N/A |
| PB-18 | Backend - API provides extensive filtering options for retrieving photos. | Allows users to search and browse their photo collection effectively. | High | Implemented | N/A |
| PB-19 | UI - Provides a gallery view with filters to browse photos. | Allows users to search and browse their photo collection effectively. | High | Not Implemented | N/A |
| PB-20 | Backend - API provides detailed information for a single photo. | Allows users to see photo metadata and details. | High | Implemented | N/A |
| PB-21 | UI - Provides a detail view page for a single photo. | Allows users to see photo metadata and details. | High | Not Implemented | N/A |
| PB-22 | Backend - API allows viewing of photo image files at different resolutions. | Core functionality for displaying photos. | High | Implemented | N/A |
| PB-23 | UI - Displays photo images in the gallery and detail views. | Core functionality for displaying photos. | High | Not Implemented | N/A |
| PB-24 | Backend - API provides a low-resolution preview of a photo. | Used for gallery views to improve performance. | High | Implemented | N/A |
| PB-25 | UI - Uses photo previews for gallery view thumbnails. | Used for gallery views to improve performance. | High | Not Implemented | N/A |
| PB-26 | Backend - User can "like" a photo via API. | Basic social/organizational feature. | Medium | Implemented | N/A |
| PB-27 | Backend - User can "unlike" a photo via API. | Basic social/organizational feature. | Medium | Implemented | N/A |
| PB-28 | UI - Provides a button to "like" and "unlike" a photo. | Basic social/organizational feature. | Medium | Not Implemented | N/A |
| PB-29 | Backend - User can create a blog post via API. | Core content creation feature. | High | Implemented | N/A |
| PB-30 | UI - Provides a rich-text editor for creating and editing blog posts. | Core content creation feature. | High | Not Implemented | N/A |
| PB-31 | Backend - API provides filtering for retrieving blog posts. | Allows users to browse and search for blog content. | High | Implemented | N/A |
| PB-32 | UI - Provides a list view with filters to browse blog posts. | Allows users to browse and search for blog content. | High | Not Implemented | N/A |
| PB-33 | Backend - API allows viewing a single blog post by its ID. | Allows users to read a specific blog post. | High | Implemented | N/A |
| PB-34 | UI - Displays a single blog post. | Allows users to read a specific blog post. | High | Not Implemented | N/A |
| PB-35 | Backend - API allows adding, updating, and deleting tags. | Core feature for organizing content. | High | Implemented | N/A |
| PB-36 | UI - Provides an interface for managing tags. | Core feature for organizing content. | High | Not Implemented | N/A |
| PB-37 | Backend - API allows fetching public user info from a remote instance. | First step for initiating a federated connection. | High | Implemented | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-38 | UI - Provides a form to fetch and display remote user info. | First step for initiating a federated connection. | High | Not Implemented | N/A |
| PB-39 | Backend - API allows initiating a trusted relationship with a remote user. | Core functionality for federated sharing. | High | Implemented | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-40 | UI - Provides a button to send a connection request to a remote user. | Core functionality for federated sharing. | High | Not Implemented | N/A |
| PB-41 | Backend - API allows approving a pending relationship request. | Allows users to control who can connect with them. | High | Implemented | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-42 | UI - Displays incoming connection requests with approve/deny buttons. | Allows users to control who can connect with them. | High | Not Implemented | N/A |
| PB-43 | Backend - API allows blocking an existing relationship. | Provides a way to revoke access for a connected user. | High | Implemented | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-44 | UI - Provides a button to block a connected user. | Provides a way to revoke access for a connected user. | High | Not Implemented | N/A |
| PB-45 | Backend - System handles the secure key exchange (handshake) protocol. | Foundational security for all federated communication. | High | Implemented | [Network-and-sharing.md](tech/Network-and-sharing.md), [Shared-user-definition.md](tech/Shared-user-definition.md) |
| PB-46 | Backend - System provides private API endpoints for federated access. | Securely exposes shared content to trusted remote users. | High | Implemented | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-47 | Backend - System proxies a local user's request to a remote instance. | Enables seamless access to a remote user's shared content. | High | Implemented | [Network-and-sharing.md](tech/Network-and-sharing.md) |
