# Specification

## Summary
**Goal:** Auto-fill the current date and time on every app load, and add a Site Photos upload section to the Field Report form with thumbnail previews and PDF embedding.

**Planned changes:**
- On every page load, pre-fill the date field with today's date (YYYY-MM-DD) and the time field with the current local time (HH:MM), overriding any cached localStorage values.
- Add a "Site Photos" section to the ReportForm with a multiple-image file picker (`accept="image/*" multiple`).
- Display thumbnail previews of selected images below the upload control, with the ability to remove individual photos before generating the PDF.
- Embed the selected site photos in the generated PDF report under a "Site Photos" section, styled to match the existing dark industrial theme.

**User-visible outcome:** Users always see the current date and time when they open the app, and can attach multiple site photos to their field report, previewing and removing them before generating a PDF that includes the photos.
