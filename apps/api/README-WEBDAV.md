# WebDAV Integration

This API now supports WebDAV (Web Distributed Authoring and Versioning) protocol, allowing users to access their files natively on iOS devices and other WebDAV-compatible clients.

## Features

- **Full WebDAV Compliance**: Implements all core WebDAV methods (PROPFIND, GET, PUT, DELETE, MKCOL, COPY, MOVE)
- **iOS Files App Integration**: Seamlessly works with iOS Files app
- **Authentication**: Uses existing user authentication system
- **Workspace Support**: Supports both personal and workspace file storage
- **Security**: Proper error handling and input validation

## Supported WebDAV Methods

| Method   | Description                                 | Status |
| -------- | ------------------------------------------- | ------ |
| OPTIONS  | Server capabilities discovery               | ✅     |
| PROPFIND | List directory contents and file properties | ✅     |
| GET      | Download files                              | ✅     |
| PUT      | Upload files                                | ✅     |
| DELETE   | Delete files and folders                    | ✅     |
| MKCOL    | Create directories                          | ✅     |
| COPY     | Copy files and folders                      | ✅     |
| MOVE     | Move/rename files and folders               | ✅     |

## API Endpoints

### Base URL

```
/webdav
```

### Authentication

All WebDAV requests require authentication using the existing OAuth2 token system. Include the Authorization header:

```
Authorization: Bearer <your-oauth2-token>
```

### Query Parameters

- `workspaceId`: Specify workspace ID (defaults to 'personal' for personal storage)

## Usage Examples

### 1. List Directory Contents (PROPFIND)

```bash
curl -X PROPFIND \
  -H "Authorization: Bearer <token>" \
  -H "Depth: 1" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
  <prop>
    <resourcetype/>
    <getcontentlength/>
    <getlastmodified/>
    <getcontenttype/>
    <displayname/>
  </prop>
</propfind>' \
  http://localhost:4000/webdav
```

### 2. Download File (GET)

```bash
curl -X GET \
  -H "Authorization: Bearer <token>" \
  http://localhost:4000/webdav/document.pdf
```

### 3. Upload File (PUT)

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/pdf" \
  --data-binary @document.pdf \
  http://localhost:4000/webdav/document.pdf
```

### 4. Create Directory (MKCOL)

```bash
curl -X MKCOL \
  -H "Authorization: Bearer <token>" \
  http://localhost:4000/webdav/new-folder
```

### 5. Delete File (DELETE)

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:4000/webdav/document.pdf
```

## iOS Files App Setup

1. Open the Files app on your iOS device
2. Tap the three dots menu (⋯) in the top right
3. Select "Connect to Server"
4. Enter the WebDAV URL: `http://localhost:4000/webdav`
5. Enter your email address and password
6. Your cloud storage will appear under "Locations"

## Security Considerations

### Production Deployment

- **HTTPS Required**: Always use HTTPS in production to protect data in transit
- **Token Expiration**: OAuth2 tokens have expiration times for security
- **Input Validation**: All file paths are validated to prevent directory traversal attacks
- **File Size Limits**: Implement appropriate file size limits based on your requirements

### Current Limitations

- No file locking support (LOCK/UNLOCK methods)
- No versioning support
- Depth limited to 1 for security (prevents infinite recursion)

## File Storage Structure

The WebDAV implementation uses the same storage structure as the existing file system:

```
storage/
├── users/
│   └── {userId}/
│       └── files/          # Personal files
└── workspaces/
    └── {workspaceId}/
        └── files/          # Workspace files
```

## Error Handling

The WebDAV implementation returns proper HTTP status codes and XML error responses:

- `401 Unauthorized`: Invalid or missing authentication
- `404 Not Found`: File or directory doesn't exist
- `405 Method Not Allowed`: Unsupported operation
- `409 Conflict`: Resource conflict (e.g., trying to create existing directory)
- `500 Internal Server Error`: Server-side error

## Testing

Run the test script to verify WebDAV functionality:

```bash
node test-webdav.js
```

This will test:

- OPTIONS request (server capabilities)
- PROPFIND request (authentication required)

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify your OAuth2 token is valid and not expired
   - Check that you're using the correct email/password

2. **Connection Refused**
   - Ensure the API server is running on the correct port
   - Check firewall settings

3. **Files Not Appearing**
   - Verify the WebDAV URL is correct
   - Check that you have files in your storage
   - Try refreshing the Files app

4. **Upload Fails**
   - Check file size limits
   - Ensure you have sufficient storage space
   - Verify the file path is valid

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=webdav npm run dev
```

## Future Enhancements

- [ ] File locking support (LOCK/UNLOCK)
- [ ] Versioning support
- [ ] Quota enforcement
- [ ] File sharing via WebDAV
- [ ] Custom properties support
- [ ] Search functionality
- [ ] Compression support

## Dependencies

- `xml2js`: XML parsing and generation
- `express`: Web framework
- `fs`: File system operations
- `path`: Path manipulation utilities

## License

This WebDAV implementation is part of the cloud storage platform and follows the same license terms.
