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
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── helpers ──────────────────────────────────────────────────────────────
  const checkPage = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionHeader = (title: string) => {
    checkPage(28);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11); // amber
    doc.text(title.toUpperCase(), margin + 8, y + 15);
    y += 28;
  };

  const fieldRow = (label: string, value: string, x = margin, w = contentW) => {
    checkPage(32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label.toUpperCase(), x, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(value || '—', w);
    doc.text(lines, x, y);
    y += lines.length * 14 + 6;
  };

  const twoCol = (
    label1: string, val1: string,
    label2: string, val2: string
  ) => {
    const half = (contentW - 12) / 2;
    const startY = y;
    fieldRow(label1, val1, margin, half);
    const leftEndY = y;
    y = startY;
    fieldRow(label2, val2, margin + half + 12, half);
    y = Math.max(leftEndY, y);
  };

  // ── HEADER ───────────────────────────────────────────────────────────────
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(245, 158, 11);
  doc.text('SECURITY ENGINEERING INC.', margin, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.text('Daily Field Report', margin, 52);
  const generatedStr = `Generated: ${new Date().toLocaleString()}`;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(generatedStr, pageW - margin - doc.getTextWidth(generatedStr), 52);
  y = 90;

  // ── PUNCH SECTION ────────────────────────────────────────────────────────
  sectionHeader('Punch');
  const punchIn = `${data.punchInDate || '—'} ${data.punchInTime || ''}`.trim();
  const punchOut = `${data.punchOutDate || '—'} ${data.punchOutTime || ''}`.trim();
  twoCol('Punch In', punchIn, 'Punch Out', punchOut);
  y += 8;

  // ── PROJECT INFORMATION ──────────────────────────────────────────────────
  sectionHeader('Project Information');
  twoCol('Project Name', data.projectName, 'Project Number', data.projectNumber);
  fieldRow('Project Address', data.projectAddress);
  y += 8;

  // ── PERSONNEL ────────────────────────────────────────────────────────────
  sectionHeader('Personnel');

  // Lead Tech
  checkPage(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('LEAD TECHNICIAN', margin, y);
  y += 14;
  fieldRow('Name', data.leadTechName);
  y += 6;

  // Assist Tech
  checkPage(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('ASSISTANT TECHNICIAN', margin, y);
  y += 14;
  fieldRow('Name', data.assistTechName);
  y += 6;

  // Additional Techs
  if (data.additionalTechs && data.additionalTechs.length > 0) {
    data.additionalTechs.forEach((tech, i) => {
      checkPage(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text(`TECHNICIAN ${i + 1}`, margin, y);
      y += 14;
      fieldRow('Name', tech.name);
      const techIn = `${tech.punchInDate || '—'} ${tech.punchInTime || ''}`.trim();
      const techOut = `${tech.punchOutDate || '—'} ${tech.punchOutTime || ''}`.trim();
      twoCol('Punch In', techIn, 'Punch Out', techOut);
      y += 6;
    });
  }
  y += 8;

  // ── WORK DETAILS ─────────────────────────────────────────────────────────
  sectionHeader('Work Details');
  fieldRow('Work Performed', data.workPerformed);
  twoCol('Materials Used', data.materialsUsed, 'Equipment Used', data.equipmentUsed);
  y += 8;

  // ── STATUS ───────────────────────────────────────────────────────────────
  sectionHeader('Status');
  twoCol('Work Status', data.workStatus, 'Percent Complete', data.percentComplete);
  y += 8;

  // ── NOTES ────────────────────────────────────────────────────────────────
  sectionHeader('Notes');
  fieldRow('Safety Notes', data.safetyNotes);
  fieldRow('Additional Notes', data.additionalNotes);
  y += 8;

  // ── SIGNATURE ────────────────────────────────────────────────────────────
  sectionHeader('Signature');
  twoCol('Name', data.signatureName, 'Title', data.signatureTitle);
  if (data.signatureData && data.signatureData !== 'data:,') {
    checkPage(100);
    doc.addImage(data.signatureData, 'PNG', margin, y, 200, 60);
    y += 70;
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(15, 15, 15);
    doc.rect(0, pageH - 30, pageW, 30, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Security Engineering Inc. — Daily Field Report', margin, pageH - 12);
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin - 50, pageH - 12);
  }

  const reportDate = data.punchInDate || new Date().toISOString().split('T')[0];
  doc.save(`field-report-${reportDate}.pdf`);
}
