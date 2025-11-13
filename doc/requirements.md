# Requirements

This document tracks all product requirements organized by feature area.

**Legend**:
- Priority: 🔴 High | 🟡 Medium | 🟢 Low
- Implementation: ✅ Implemented | ❌ Not Implemented | 🚧 In Progress
- Release: 🚀 Released | 🎯 Planned | 📋 Backlog | 🔮 Future

---

## Feature: User Authentication (PB-AUTH)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.1.0

Core functionality for user registration, login, and session management.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-AUTH-01 | Backend - User can register a new account via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-AUTH-02 | UI - User can register a new account via a UI form | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-AUTH-03 | Backend - User can log in with email and password via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-AUTH-04 | UI - User can log in with email and password via a UI form | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-AUTH-05 | Backend - API endpoint to check if an email is already registered | 🟡 Medium | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-AUTH-06 | UI - Real-time feedback on email availability during registration | 🟡 Medium | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-AUTH-07 | Backend - Application supports token refreshing for persistent sessions | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |

---

## Feature: User Profile Management (PB-PROFILE)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.1.0

Allow users to view and update their profile information.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-PROFILE-01 | Backend - Authenticated user can retrieve their own information via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-PROFILE-02 | UI - Displays user profile information on a settings/profile page | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-PROFILE-03 | Backend - Authenticated user can modify their own information via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-PROFILE-04 | UI - Provides a form for users to update their profile information | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |

---

## Feature: Photo Scanning (PB-SCAN)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.1.0

Allow users to scan their photo directories and import photos into the system.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-SCAN-01 | Backend - User can initiate a full scan of their photo directory via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md) |
| PB-SCAN-02 | UI - Provides a button to trigger a full photo scan from the settings page | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-SCAN-03 | Backend - User can initiate a delta scan to find new photos via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md) |
| PB-SCAN-04 | UI - Provides a button to trigger a delta scan from the settings page | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-SCAN-05 | Backend - User can check the status of a scan via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | [Photo-scan-enhancement.md](tech/Photo-scan-enhancement.md) |
| PB-SCAN-06 | UI - Displays the current status of a photo scan | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |

---

## Feature: Photo Viewing & Gallery (PB-GALLERY)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.1.0

Display photos in gallery and detail views with filtering capabilities.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-GALLERY-01 | Backend - API provides extensive filtering options for retrieving photos | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-GALLERY-02 | UI - Provides a gallery view with filters to browse photos | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-GALLERY-03 | Backend - API provides detailed information for a single photo | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-GALLERY-04 | UI - Provides a detail view page for a single photo | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-GALLERY-05 | Backend - API allows viewing of photo image files at different resolutions | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-GALLERY-06 | UI - Displays photo images in the gallery and detail views | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-GALLERY-07 | Backend - API provides a low-resolution preview of a photo | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-GALLERY-08 | UI - Uses photo previews for gallery view thumbnails | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |

---

## Feature: Photo Social Features (PB-SOCIAL)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.1.0

Basic social features for interacting with photos (likes).

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-SOCIAL-01 | Backend - User can "like" a photo via API | 🟡 Medium | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-SOCIAL-02 | Backend - User can "unlike" a photo via API | 🟡 Medium | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-SOCIAL-03 | UI - Provides a button to "like" and "unlike" a photo | 🟡 Medium | ❌ Not Implemented | 🎯 v0.1.0 | N/A |

---

## Feature: Blog Management (PB-BLOG)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.1.0

Create, browse, and view blog posts.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-BLOG-01 | Backend - User can create a blog post via API | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-BLOG-02 | UI - Provides a rich-text editor for creating and editing blog posts | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-BLOG-03 | Backend - API provides filtering for retrieving blog posts | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-BLOG-04 | UI - Provides a list view with filters to browse blog posts | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |
| PB-BLOG-05 | Backend - API allows viewing a single blog post by its ID | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-BLOG-06 | UI - Displays a single blog post | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |

---

## Feature: Tag Management (PB-TAG)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.1.0

Organize content with tags.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-TAG-01 | Backend - API allows adding, updating, and deleting tags | 🔴 High | ✅ Implemented | 🎯 v0.1.0 | N/A |
| PB-TAG-02 | UI - Provides an interface for managing tags | 🔴 High | ❌ Not Implemented | 🎯 v0.1.0 | N/A |

---

## Feature: Federation & Networking (PB-NETWORK)
**Overall Status**: 🟡 Partially Complete | **Target Release**: v0.2.0

Connect with remote instances and manage trusted relationships.

| ID | Requirement | Priority | Implementation | Release Status | Tech Docs |
|:---|:------------|:---------|:---------------|:---------------|:----------|
| PB-NETWORK-01 | Backend - API allows fetching public user info from a remote instance | 🔴 High | ✅ Implemented | 🎯 v0.2.0 | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-NETWORK-02 | UI - Provides a form to fetch and display remote user info | 🔴 High | ❌ Not Implemented | 🎯 v0.2.0 | N/A |
| PB-NETWORK-03 | Backend - API allows initiating a trusted relationship with a remote user | 🔴 High | ✅ Implemented | 🎯 v0.2.0 | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-NETWORK-04 | UI - Provides a button to send a connection request to a remote user | 🔴 High | ❌ Not Implemented | 🎯 v0.2.0 | N/A |
| PB-NETWORK-05 | Backend - API allows approving a pending relationship request | 🔴 High | ✅ Implemented | 🎯 v0.2.0 | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-NETWORK-06 | UI - Displays incoming connection requests with approve/deny buttons | 🔴 High | ❌ Not Implemented | 🎯 v0.2.0 | N/A |
| PB-NETWORK-07 | Backend - API allows blocking an existing relationship | 🔴 High | ✅ Implemented | 🎯 v0.2.0 | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-NETWORK-08 | UI - Provides a button to block a connected user | 🔴 High | ❌ Not Implemented | 🎯 v0.2.0 | N/A |
| PB-NETWORK-09 | Backend - System handles the secure key exchange (handshake) protocol | 🔴 High | ✅ Implemented | 🎯 v0.2.0 | [Network-and-sharing.md](tech/Network-and-sharing.md), [Shared-user-definition.md](tech/Shared-user-definition.md) |
| PB-NETWORK-10 | Backend - System provides private API endpoints for federated access | 🔴 High | ✅ Implemented | 🎯 v0.2.0 | [Network-and-sharing.md](tech/Network-and-sharing.md) |
| PB-NETWORK-11 | Backend - System proxies a local user's request to a remote instance | 🔴 High | ✅ Implemented | 🎯 v0.2.0 | [Network-and-sharing.md](tech/Network-and-sharing.md) |

---

## Summary Statistics

**v0.1.0 Progress**:
- Total Requirements: 36
- ✅ Implemented: 18 (50%)
- ❌ Not Implemented: 18 (50%)

**v0.2.0 Progress**:
- Total Requirements: 11
- ✅ Implemented: 6 (55%)
- ❌ Not Implemented: 5 (45%)

**By Feature Area**:
- PB-AUTH: 4/7 complete (57%)
- PB-PROFILE: 2/4 complete (50%)
- PB-SCAN: 3/6 complete (50%)
- PB-GALLERY: 4/8 complete (50%)
- PB-SOCIAL: 2/3 complete (67%)
- PB-BLOG: 3/6 complete (50%)
- PB-TAG: 1/2 complete (50%)
- PB-NETWORK: 6/11 complete (55%)
