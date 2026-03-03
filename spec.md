# Specification

## Summary
**Goal:** Add "Project Manager" and "Location Contact" text input fields to the Field Report form and PDF output.

**Planned changes:**
- Add a `projectManager` field to the `ReportData` interface
- Add a `locationContact` field to the `ReportData` interface
- Add a labeled "Project Manager" text input in the Project Info section of `ReportForm`
- Add a labeled "Location Contact" text input in the Project Info section of `ReportForm`
- Render both fields in the generated PDF under the project info section

**User-visible outcome:** Users can enter a Project Manager name and a Location Contact name when filling out a field report, and both values appear in the generated PDF report.
