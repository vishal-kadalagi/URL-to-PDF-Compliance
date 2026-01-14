# URL to PDF Compliance Backend

This backend service converts websites to PDFs for compliance auditing purposes. It crawls a given website, generates PDFs for each page, and merges them into a single document.

## Features

- Website crawling with configurable depth
- PDF generation for each crawled page
- Merging of all pages into a single PDF
- Video/media detection for compliance review
- Unique job IDs to prevent file collisions
- URL validation and sanitization for security
- Sequential processing to prevent server overload

## Improvements Made

1. **Security Enhancements**:
   - URL validation to prevent SSRF attacks
   - Filename sanitization to prevent path traversal
   - Input validation on all parameters

2. **Error Handling**:
   - Comprehensive error handling throughout
   - Proper resource cleanup
   - Detailed logging

3. **Performance & Reliability**:
   - Sequential PDF processing to avoid overwhelming the server
   - Better browser resource management
   - Improved page loading strategy

4. **Organization**:
   - Unique job directories to prevent file collisions
   - Configurable max pages parameter
   - Better file organization

## Dependencies

- express: Web framework
- cors: Cross-origin resource sharing
- playwright: Browser automation for PDF generation
- pdf-lib: PDF manipulation
- uuid: Unique identifier generation

## Setup

1. Install dependencies: `npm install`
2. The postinstall script will automatically install Playwright browsers
3. Start the server: `npm start`

## API

### POST /convert

Converts a website to PDFs.

Request body:
```json
{
  "url": "https://example.com",
  "maxPages": 10
}
```

Response:
```json
{
  "jobId": "unique-job-id",
  "pages": [
    {
      "pageUrl": "https://example.com/page1",
      "pdf": "job-id/page_1.pdf",
      "videoDetected": false
    }
  ],
  "mergedPdf": "job-id/merged.pdf"
}
```

The generated PDFs are accessible at `/output/{pdf-path}`.