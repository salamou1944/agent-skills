---
name: document-intelligence-extraction
description: Extracts structured, source-grounded information from PDFs and scanned documents while preserving page provenance, OCR uncertainty, and verification boundaries.
---
# Document Intelligence Extraction

## Procedure
1. Identify document type, pages, language, expected fields, and whether native text or scans are present.
2. Prefer native text extraction; use OCR only for image-only regions.
3. Preserve page or section references for every extracted field.
4. Distinguish directly extracted text from OCR-inferred text.
5. Validate tables, numbers, names, dates, and identifiers against the source image when accuracy matters.
6. Record extraction errors and unresolved regions rather than inventing values.
7. Emit structured output plus provenance sufficient to trace every material field back to the document.

## Completion rule
A successful parser or OCR run is not proof of correctness. Material extracted fields require source-level verification.
