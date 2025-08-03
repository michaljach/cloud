# File Preview Feature

## Overview

The files app now supports double-clicking on text and image files to open them in a preview dialog. This feature allows users to quickly view file contents without downloading them.

## Supported File Types

### Text Files

- `.txt` - Plain text files
- `.md` - Markdown files
- `.json` - JSON files
- `.js`, `.ts`, `.jsx`, `.tsx` - JavaScript/TypeScript files
- `.html`, `.css`, `.scss` - Web files
- `.xml`, `.csv` - Data files
- `.log`, `.ini`, `.conf` - Configuration files
- `.yaml`, `.yml` - YAML files

### Image Files

- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.gif` - GIF images
- `.bmp` - BMP images
- `.webp` - WebP images
- `.svg` - SVG images
- `.ico` - Icon files
- `.tiff`, `.tif` - TIFF images

## How to Use

1. Navigate to any folder in the files app
2. Double-click on any file to open a preview dialog
3. For text and image files, the content will be displayed
4. For other file types, a generic preview message will be shown
5. You can download any file using the download button in the dialog footer
6. Close the dialog by clicking outside or pressing Escape

## Visual Indicators

- All files show a pointer cursor when hovering (indicating they're clickable)
- Folders work as before - double-click to navigate into them

## Technical Implementation

### Components

- `FilePreview` - Main preview dialog component
- `fileTypeDetection.ts` - Utility functions for detecting file types
- Updated `DataTable` - Handles double-click events and shows preview dialog

### Features

- Text files are displayed in a monospace font with syntax highlighting
- Images are displayed with proper aspect ratio and max dimensions
- All file types can be double-clicked to open preview dialog
- Generic preview message for unsupported file types
- Loading states and error handling
- Automatic cleanup of blob URLs
- Download functionality in the dialog footer

## Testing

Run the tests to verify file type detection:

```bash
npm test -- fileTypeDetection.test.ts
```

## Future Enhancements

- Support for more file types (PDF, video, audio)
- Syntax highlighting for code files
- Image zoom and pan functionality
- Full-screen preview mode
- Keyboard navigation in preview dialog
