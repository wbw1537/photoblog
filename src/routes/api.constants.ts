export const API_URLS = {
  USER: {
    REGISTER: '/v1/register',
    LOGIN: '/v1/login',
    EMAIL_AVAILABILITY: '/v1/email-availability',
    USER_INFO: '/v1/user-info',
    REFRESH_TOKEN: '/v1/refresh-token',
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
  },
  PHOTO_SCAN: {
    SCAN: '/v1/scan',
    DELTA_SCAN: '/v1/delta-scan',
  },
  PHOTO_FILE: {
    VIEW: '/v1/photos/view/:fileId',
    PREVIEW: '/v1/photos/preview/:fileId',
  },
  BLOG: {
    BASE: '/v1/blogs',
    BY_ID: '/v1/blogs/:blogId',
  },
  SHARED_USER: {
    FETCH_REMOTE: '/v1/shared-user/fetch-remote',
    INIT_REMOTE: '/public/v1/shared-user/init',
  },
};