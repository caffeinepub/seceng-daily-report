# Specification

## Summary
**Goal:** Remove specific fields from the Project Information and Punch sections of the Field Report Pro form.

**Planned changes:**
- Remove the Date, Weather Condition, and Temperature fields from the Project Information section of the ReportForm component
- Remove the Punch In and Punch Out fields for the Lead Technician and Assistant Technician from the Punch section of the ReportForm component
- Ensure the PDF generator no longer includes Lead/Assistant Technician punch times in generated reports
- Gracefully handle any previously persisted localStorage data for the removed fields

**User-visible outcome:** The form no longer displays Date, Weather Condition, or Temperature in the Project Information section, and no longer displays Punch In/Out fields for Lead and Assistant Technicians. All other form functionality, persistence, and PDF generation remain intact.
