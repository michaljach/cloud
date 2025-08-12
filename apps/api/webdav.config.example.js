// WebDAV Configuration Example
// Copy this file to webdav.config.js and adjust settings as needed

module.exports = {
  // Enable/disable WebDAV functionality
  enabled: process.env.WEBDAV_ENABLED !== 'false',

  // Maximum file size for uploads (in bytes)
  maxFileSize: parseInt(process.env.WEBDAV_MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB

  // Maximum directory depth for PROPFIND requests
  maxDepth: parseInt(process.env.WEBDAV_MAX_DEPTH) || 1,

  // Allowed MIME types (empty array allows all)
  allowedMimeTypes: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',

    // Documents
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    // Archives
    'application/zip',
    'application/x-tar',
    'application/gzip',

    // Media
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',

    // Web
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'application/xml'
  ],

  // Security settings
  security: {
    // Enable HTTPS requirement in production
    requireHttps: process.env.NODE_ENV === 'production',

    // Rate limiting (requests per minute per user)
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },

  // Logging
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    level: process.env.LOG_LEVEL || 'info'
  }
}
