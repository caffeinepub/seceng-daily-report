# Specification

## Summary
**Goal:** Make the SECENG Daily Report form more compact, and replace the separate Check In/Check Out datetime inputs with a single toggle button that auto-records timestamps.

**Planned changes:**
- Reduce vertical padding, margins, and gaps throughout the form in `App.tsx` and `ReportForm.tsx` so more content is visible without scrolling.
- Replace the Check In and Check Out datetime inputs with a single toggle button labeled "Check In"; pressing it records the current timestamp as Check In and relabels the button to "Check Out"; pressing it again records the Check Out timestamp and disables/completes the button.
- Display the recorded Check In and Check Out timestamps as read-only text near the toggle button.
- Update the `ReportData` interface and `pdfGenerator.ts` to pass both timestamps through to the generated PDF report.

**User-visible outcome:** The form is more compact and fits more content on screen. Users can check in and check out with a single button press, with timestamps automatically captured and included in the generated PDF report.
