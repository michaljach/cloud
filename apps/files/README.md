# Files App

A file management application with search capabilities.

## Features

- **File Management**: Upload, download, delete, and organize files
- **Folder Navigation**: Navigate through folders with breadcrumb navigation
- **Search**: Search for files and folders by name across your entire storage
- **Workspace Support**: Support for both personal and workspace storage
- **File Preview**: Preview files in a modal dialog
- **Batch Operations**: Select multiple files for download or deletion
- **Drag & Drop**: Upload files by dragging them into the interface

## Search Functionality

The search feature allows you to find files and folders by name across your entire storage:

- **Real-time Search**: Search results update as you type (with 300ms debounce)
- **Recursive Search**: Searches through all subdirectories
- **Case-insensitive**: Search is not case-sensitive
- **Path Display**: Search results show the full path to help you locate files
- **Navigation**: Click on search results to navigate to their location
- **Clear Search**: Use the clear button or clear the search input to return to normal view

### How to Use Search

1. Type in the search box in the header
2. Results will appear in the table below
3. Click on a folder result to navigate to that location
4. Click on a file result to preview it
5. Use the "Clear Search" button to return to normal browsing

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Type check
npx tsc --noEmit
```
