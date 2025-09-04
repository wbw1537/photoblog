export const API_URLS = {
  USER: {
    REGISTER: '/v1/register',
    LOGIN: '/v1/login',
    EMAIL_AVAILABILITY: '/v1/email-availability',
    USER_INFO: '/v1/user-info',
    REFRESH_TOKEN: '/v1/refresh-token',
    // Public endpoints
    PUBLIC_USERS: '/public/v1/users',
  },
  TAG: {
    BASE: '/v1/tags',
  },
  SCAN_STATUS: {
    BASE: '/v1/scan-status',
  },
  PHOTO: {
    BASE: '/v1/photos',
    BY_ID: '/v1/photos/:id',
    LIKE: '/v1/photos/:id/like',
    // Private endpoints
    PRIVATE_BASE: '/private/v1/photos',
    PRIVATE_BY_ID: '/private/v1/photos/:id',
  },
  PHOTO_SCAN: {
    SCAN: '/v1/scan',
    DELTA_SCAN: '/v1/delta-scan',
  },
  PHOTO_FILE: {
    VIEW: '/v1/photos/view/:fileId',
    PREVIEW: '/v1/photos/preview/:fileId',
    // Private endpoints
    PRIVATE_VIEW: '/private/v1/photos/view/:fileId',
    PRIVATE_PREVIEW: '/private/v1/photos/preview/:fileId',
  },
  BLOG: {
    BASE: '/v1/blogs',
    BY_ID: '/v1/blogs/:blogId',
    // Private endpoints
    PRIVATE_BASE: '/private/v1/blogs',
    PRIVATE_BY_ID: '/private/v1/blogs/:blogId',
  },
  SHARED_USER: {
    BASE: '/v1/shared-user',
    FETCH_REMOTE: '/v1/shared-user/fetch-remote',
    INIT: '/v1/shared-user/init',
    ACTIVE: '/v1/shared-user/active/:id',
    BLOCK: '/v1/shared-user/block/:id',
    REQUEST: '/v1/shared-user/request',
    // Public endpoints
    PUBLIC_INIT: '/public/v1/shared-user/init',
    PUBLIC_EXCHANGE: '/public/v1/shared-user/exchange',
    PUBLIC_VALIDATE: '/public/v1/shared-user/validate',
    PUBLIC_SESSION: '/public/v1/shared-user/session',
  },
};