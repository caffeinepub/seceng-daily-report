// PDF Generation Utility using jsPDF (loaded via CDN in index.html)
/* eslint-disable @typescript-eslint/no-explicit-any */

declare const window: Window & { jspdf?: { jsPDF: any } };

export interface ReportData {
  // Project Info
  projectName: string;
  projectNumber: string;
  projectAddress: string;
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
  const SECTION_GAP = 18;       // space between end of one section and next header
  const HEADER_H = 26;          // height of the dark section header bar
  const HEADER_BOTTOM_PAD = 14; // space below header bar before first field
  const FIELD_LABEL_H = 13;     // space after label text before value
  const FIELD_LINE_H = 15;      // line height for value text
  const FIELD_BOTTOM_PAD = 10;  // space after value before next field
  const SUB_HEADER_BOTTOM = 16; // space after amber sub-header text before field

  // ── helpers ──────────────────────────────────────────────────────────────
  const checkPage = (needed: number) => {
    if (y + needed > pageH - 50) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionHeader = (title: string) => {
    checkPage(HEADER_H + HEADER_BOTTOM_PAD + 20);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, y, contentW, HEADER_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11); // amber
    doc.text(title.toUpperCase(), margin + 10, y + 17);
    y += HEADER_H + HEADER_BOTTOM_PAD;
  };

  const fieldRow = (label: string, value: string, x = margin, w = contentW) => {
    const lines = doc.splitTextToSize(value || '—', w);
    const needed = FIELD_LABEL_H + lines.length * FIELD_LINE_H + FIELD_BOTTOM_PAD;
    checkPage(needed);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(label.toUpperCase(), x, y);
    y += FIELD_LABEL_H;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(25, 25, 25);
    doc.text(lines, x, y);
    y += lines.length * FIELD_LINE_H + FIELD_BOTTOM_PAD;
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
  y += SECTION_GAP;

  // ── PERSONNEL ────────────────────────────────────────────────────────────
  sectionHeader('Personnel');

  // Lead Tech
  checkPage(SUB_HEADER_BOTTOM + 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('LEAD TECHNICIAN', margin, y);
  y += SUB_HEADER_BOTTOM;
  fieldRow('Name', data.leadTechName);
  y += 8;

  // Assist Tech
  checkPage(SUB_HEADER_BOTTOM + 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('ASSISTANT TECHNICIAN', margin, y);
  y += SUB_HEADER_BOTTOM;
  fieldRow('Name', data.assistTechName);
  y += 8;

  // Additional Techs
  if (data.additionalTechs && data.additionalTechs.length > 0) {
    data.additionalTechs.forEach((tech, i) => {
      checkPage(SUB_HEADER_BOTTOM + 80);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text(`TECHNICIAN ${i + 1}`, margin, y);
      y += SUB_HEADER_BOTTOM;
      fieldRow('Name', tech.name);
      const techIn = `${tech.punchInDate || '—'} ${tech.punchInTime || ''}`.trim();
      const techOut = `${tech.punchOutDate || '—'} ${tech.punchOutTime || ''}`.trim();
      twoCol('Punch In', techIn, 'Punch Out', techOut);
      y += 8;
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
