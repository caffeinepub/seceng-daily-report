// PDF Generation Utility using jsPDF (loaded via CDN in index.html)
/* eslint-disable @typescript-eslint/no-explicit-any */

declare const window: Window & { jspdf?: { jsPDF: any } };

export interface ReportData {
  // Project Info
  projectName: string;
  projectNumber: string;
  projectAddress: string;
  projectManager: string;
  locationContact: string;
  // Punch times (top-level / general)
  punchInDate: string;
  punchInTime: string;
  punchOutDate: string;
  punchOutTime: string;
  // Personnel
  leadTechName: string;
  assistTechName: string;
  additionalTechs: Array<{
    name: string;
    punchInDate: string;
    punchInTime: string;
    punchOutDate: string;
    punchOutTime: string;
  }>;
  // Work Details
  workPerformed: string;
  materialsUsed: string;
  equipmentUsed: string;
  // Status
  workStatus: string;
  percentComplete: string;
  // Notes
  safetyNotes: string;
  additionalNotes: string;
  // Signature
  signatureName: string;
  signatureTitle: string;
  signatureData: string;
  // Site Photos (data URLs)
  sitePhotos?: string[];
}

export async function generatePDF(data: ReportData): Promise<void> {
  const jsPDFLib = window.jspdf;
  if (!jsPDFLib) throw new Error('jsPDF not loaded');
  const { jsPDF } = jsPDFLib;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── spacing constants ─────────────────────────────────────────────────────
  const SECTION_GAP = 18;         // space between end of one section and next header
  const HEADER_H = 26;            // height of the dark section header bar
  const HEADER_BOTTOM_PAD = 16;   // space below header bar before first field label baseline
  const LABEL_FONT_SIZE = 8;      // pt — grey uppercase label
  const VALUE_FONT_SIZE = 10.5;   // pt — field value text
  const LABEL_TO_VALUE_GAP = 14;  // pt — from label baseline to first value line baseline
  const VALUE_LINE_H = 16;        // pt — line height between value lines (for multi-line values)
  const FIELD_BOTTOM_PAD = 12;    // pt — space after last value line before next label
  const SUB_HEADER_FONT_SIZE = 9; // pt — amber sub-section header
  const SUB_HEADER_BOTTOM = 18;   // pt — from sub-header baseline to first label baseline

  // ── helpers ──────────────────────────────────────────────────────────────
  const checkPage = (needed: number) => {
    if (y + needed > pageH - 50) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionHeader = (title: string) => {
    checkPage(HEADER_H + HEADER_BOTTOM_PAD + 30);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, y, contentW, HEADER_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11); // amber
    doc.text(title.toUpperCase(), margin + 10, y + 17);
    y += HEADER_H + HEADER_BOTTOM_PAD;
  };

  /**
   * Render a labelled field.
   * jsPDF text() with an array renders lines at the given y using the current
   * font's internal line-height. We render each line manually so we fully
   * control the vertical rhythm and avoid overlap / excessive gaps.
   */
  const fieldRow = (label: string, value: string, x = margin, w = contentW) => {
    const lines: string[] = doc.splitTextToSize(value || '—', w);
    const totalValueH = lines.length * VALUE_LINE_H;
    const needed = LABEL_TO_VALUE_GAP + totalValueH + FIELD_BOTTOM_PAD;
    checkPage(needed + 10);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(LABEL_FONT_SIZE);
    doc.setTextColor(110, 110, 110);
    doc.text(label.toUpperCase(), x, y);
    y += LABEL_TO_VALUE_GAP;

    // Value lines — rendered one-by-one for precise spacing
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(VALUE_FONT_SIZE);
    doc.setTextColor(25, 25, 25);
    for (const line of lines) {
      checkPage(VALUE_LINE_H + FIELD_BOTTOM_PAD);
      doc.text(line, x, y);
      y += VALUE_LINE_H;
    }

    y += FIELD_BOTTOM_PAD;
  };

  const twoCol = (
    label1: string, val1: string,
    label2: string, val2: string
  ) => {
    const half = (contentW - 16) / 2;
    const startY = y;
    fieldRow(label1, val1, margin, half);
    const leftEndY = y;
    y = startY;
    fieldRow(label2, val2, margin + half + 16, half);
    y = Math.max(leftEndY, y);
  };

  // ── HEADER ───────────────────────────────────────────────────────────────
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageW, 76, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(245, 158, 11);
  doc.text('SECURITY ENGINEERING INC.', margin, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.text('Daily Field Report', margin, 56);
  const generatedStr = `Generated: ${new Date().toLocaleString()}`;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(generatedStr, pageW - margin - doc.getTextWidth(generatedStr), 56);
  y = 76 + SECTION_GAP;

  // ── PUNCH SECTION ────────────────────────────────────────────────────────
  sectionHeader('Punch');
  const punchIn = `${data.punchInDate || '—'} ${data.punchInTime || ''}`.trim();
  const punchOut = `${data.punchOutDate || '—'} ${data.punchOutTime || ''}`.trim();
  twoCol('Punch In', punchIn, 'Punch Out', punchOut);
  y += SECTION_GAP;

  // ── PROJECT INFORMATION ──────────────────────────────────────────────────
  sectionHeader('Project Information');
  twoCol('Project Name', data.projectName, 'Project Number', data.projectNumber);
  fieldRow('Project Address', data.projectAddress);
  twoCol('Project Manager', data.projectManager, 'Location Contact', data.locationContact);
  y += SECTION_GAP;

  // ── PERSONNEL ────────────────────────────────────────────────────────────
  sectionHeader('Personnel');

  // Lead Tech
  checkPage(SUB_HEADER_BOTTOM + 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(SUB_HEADER_FONT_SIZE);
  doc.setTextColor(245, 158, 11);
  doc.text('LEAD TECHNICIAN', margin, y);
  y += SUB_HEADER_BOTTOM;
  fieldRow('Name', data.leadTechName);
  y += 6;

  // Assist Tech
  checkPage(SUB_HEADER_BOTTOM + 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(SUB_HEADER_FONT_SIZE);
  doc.setTextColor(245, 158, 11);
  doc.text('ASSISTANT TECHNICIAN', margin, y);
  y += SUB_HEADER_BOTTOM;
  fieldRow('Name', data.assistTechName);
  y += 6;

  // Additional Techs
  if (data.additionalTechs && data.additionalTechs.length > 0) {
    data.additionalTechs.forEach((tech, i) => {
      checkPage(SUB_HEADER_BOTTOM + 90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(SUB_HEADER_FONT_SIZE);
      doc.setTextColor(245, 158, 11);
      doc.text(`TECHNICIAN ${i + 1}`, margin, y);
      y += SUB_HEADER_BOTTOM;
      fieldRow('Name', tech.name);
      const techIn = `${tech.punchInDate || '—'} ${tech.punchInTime || ''}`.trim();
      const techOut = `${tech.punchOutDate || '—'} ${tech.punchOutTime || ''}`.trim();
      twoCol('Punch In', techIn, 'Punch Out', techOut);
      y += 6;
    });
  }
  y += SECTION_GAP;

  // ── WORK DETAILS ─────────────────────────────────────────────────────────
  sectionHeader('Work Details');
  fieldRow('Work Performed', data.workPerformed);
  twoCol('Materials Used', data.materialsUsed, 'Equipment Used', data.equipmentUsed);
  y += SECTION_GAP;

  // ── STATUS ───────────────────────────────────────────────────────────────
  sectionHeader('Status');
  twoCol('Work Status', data.workStatus, 'Percent Complete', data.percentComplete);
  y += SECTION_GAP;

  // ── NOTES ────────────────────────────────────────────────────────────────
  sectionHeader('Notes');
  fieldRow('Safety Notes', data.safetyNotes);
  fieldRow('Additional Notes', data.additionalNotes);
  y += SECTION_GAP;

  // ── SIGNATURE ────────────────────────────────────────────────────────────
  sectionHeader('Signature');
  twoCol('Name', data.signatureName, 'Title', data.signatureTitle);
  if (data.signatureData && data.signatureData !== 'data:,') {
    checkPage(90);
    // Light border box around signature
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, 220, 70);
    doc.addImage(data.signatureData, 'PNG', margin + 4, y + 4, 212, 62);
    y += 82;
  }
  y += SECTION_GAP;

  // ── SITE PHOTOS ──────────────────────────────────────────────────────────
  if (data.sitePhotos && data.sitePhotos.length > 0) {
    sectionHeader('Site Photos');

    // Layout: 2 photos per row
    const PHOTOS_PER_ROW = 2;
    const PHOTO_GAP = 12;
    const photoW = (contentW - PHOTO_GAP * (PHOTOS_PER_ROW - 1)) / PHOTOS_PER_ROW;
    const photoH = photoW * 0.75; // 4:3 aspect ratio
    const CAPTION_H = 16;
    const ROW_BOTTOM_PAD = 14;

    for (let i = 0; i < data.sitePhotos.length; i += PHOTOS_PER_ROW) {
      const rowPhotos = data.sitePhotos.slice(i, i + PHOTOS_PER_ROW);
      const rowNeeded = photoH + CAPTION_H + ROW_BOTTOM_PAD;
      checkPage(rowNeeded + 10);

      rowPhotos.forEach((photoDataUrl, colIdx) => {
        const x = margin + colIdx * (photoW + PHOTO_GAP);

        // Determine image format from data URL
        let imgFormat = 'JPEG';
        if (photoDataUrl.startsWith('data:image/png')) imgFormat = 'PNG';
        else if (photoDataUrl.startsWith('data:image/webp')) imgFormat = 'WEBP';

        try {
          doc.addImage(photoDataUrl, imgFormat, x, y, photoW, photoH);
        } catch {
          // If format detection fails, try JPEG as fallback
          try {
            doc.addImage(photoDataUrl, 'JPEG', x, y, photoW, photoH);
          } catch {
            // Draw placeholder box if image fails
            doc.setFillColor(50, 50, 50);
            doc.rect(x, y, photoW, photoH, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Image unavailable', x + photoW / 2, y + photoH / 2, { align: 'center' });
          }
        }

        // Caption: "Photo N"
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.text(`Photo ${i + colIdx + 1}`, x, y + photoH + 11);
      });

      y += photoH + CAPTION_H + ROW_BOTTOM_PAD;
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 15, 15);
    doc.rect(0, pageH - 32, pageW, 32, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Security Engineering Inc. — Daily Field Report', margin, pageH - 11);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin - 50, pageH - 11);
  }

  const reportDate = data.punchInDate || new Date().toISOString().split('T')[0];
  doc.save(`field-report-${reportDate}.pdf`);
}
