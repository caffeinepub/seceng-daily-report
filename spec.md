# Specification

## Summary
**Goal:** Update the SECENG Daily Report form and PDF generator by removing the technician signature field, enabling multi-photo upload with per-photo labels, and renaming the "HELPER" role to "ASSIS TECHNICIAN".

**Planned changes:**
- Remove the "Technician Signature" field from the report form UI, its state, and all references in the PDF generation logic.
- Replace the single photo upload input with a multi-photo upload control that allows adding multiple images, each stored individually in state.
- Add a text input (description/label) for each uploaded photo; include both the image and its label in the generated PDF.
- Replace all occurrences of "HELPER" with "ASSIS TECHNICIAN" in the form UI and PDF generator.

**User-visible outcome:** Users can upload multiple photos with individual labels in the report form, no longer see a signature field, and the generated PDF reflects all changes including the renamed "ASSIS TECHNICIAN" role.
