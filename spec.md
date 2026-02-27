# Specification

## Summary
**Goal:** Rename "Assis Tech" to "Assis Technician" throughout the form UI and PDF output, and update the PDF layout to mirror the app's industrial dark-theme aesthetic (typography, spacing, and structure) without changing any color values.

**Planned changes:**
- In `ReportForm.tsx`, update all labels, placeholders, aria labels, and section headings from "Assis Tech" / "ASSIS TECH" to "Assis Technician" / "ASSIS TECHNICIAN"
- In `pdfGenerator.ts`, update the displayed label for the `assistTech` field from "Assis Tech:" to "Assis Technician:" (property name unchanged)
- Update PDF layout to use bold, uppercase, wide-tracked typography for section headings matching the app's Oswald/bold heading style
- Add horizontal divider lines between PDF sections to mirror the app's section dividers
- Increase whitespace and padding around section blocks to reflect the app's card-based layout
- Render field label-value pairs in a structured, consistently spaced two-column or clearly separated format
- Update the PDF header block so "SECURITY ENGINEERING INC." appears in large bold type and "Daily Field Report" as a smaller subtitle

**User-visible outcome:** The form and generated PDF both display "Assis Technician" instead of "Assis Tech", and the PDF report has an improved layout that closely mirrors the app's structured, industrial heading and section style.
