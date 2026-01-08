# Extract File Text Function

A Supabase Edge Function that extracts text content from uploaded documents.

## Supported File Types

- **PDF** (`.pdf`) - Basic text extraction
- **Word Documents** (`.docx`, `.doc`) - Basic text extraction
- **Text Files** (`.txt`, `.md`) - Direct text reading

## Usage

### Request Format

```
POST /functions/v1/extract-file-text
Content-Type: multipart/form-data

FormData:
  file: <File object>
```

### Response Format

```json
{
  "success": true,
  "text": "Extracted text content...",
  "fileName": "document.pdf",
  "fileSize": 1024000
}
```

## Limitations

- Maximum file size: 50MB (enforced by frontend)
- Text extraction limit: 50,000 characters per file
- Basic PDF/DOCX extraction (for production, consider using specialized libraries)
- Note: Very large files may take longer to process

## Error Responses

- `400`: No file provided, unsupported file type, or empty file
- `500`: Internal server error during extraction

## Future Improvements

For production, consider:
- Using `pdf-parse` library for better PDF extraction
- Using `mammoth` or `docx` library for better DOCX extraction
- Adding OCR support for scanned PDFs
- Storing files in Supabase Storage for later retrieval

