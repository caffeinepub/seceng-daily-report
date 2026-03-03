# Specification

## Summary
**Goal:** Fix spacing and layout issues in the generated PDF document output.

**Planned changes:**
- Audit and fix vertical spacing between all sections (punch times, project info, personnel, work details, signatures) in `frontend/src/utils/pdfGenerator.ts`
- Adjust padding around section headers and field labels for clear separation
- Ensure consistent line height throughout the document
- Fix margins so content fills the letter-sized page without overflow or excessive empty space
- Ensure the signature section is properly spaced and positioned at the bottom

**User-visible outcome:** The generated PDF document has clean, balanced spacing throughout — no cramped or overlapping content — and reads clearly on a letter-sized page.
