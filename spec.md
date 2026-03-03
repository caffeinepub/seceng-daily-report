# Specification

## Summary
**Goal:** Add a Site Photos column to the PDF report table and add Point of Contact and Project Manager input fields to the report form.

**Planned changes:**
- Add a "SITE PHOTOS" column to the PDF report table, positioned immediately before the "SIGNATURE" column, rendering uploaded photo thumbnails as embedded images in the PDF
- Add a "Point of Contact" text input field to the ReportForm that persists to localStorage and appears in the generated PDF
- Add a "Project Manager" text input field to the ReportForm that persists to localStorage and appears in the generated PDF
- Both new fields are cleared when the form is reset

**User-visible outcome:** Users can fill in Point of Contact and Project Manager names in the form, and the generated PDF report will display those names as well as a dedicated Site Photos column showing uploaded photo thumbnails.
