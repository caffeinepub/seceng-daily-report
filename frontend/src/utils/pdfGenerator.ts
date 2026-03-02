// PDF generation utility using jsPDF (loaded via CDN in index.html)

export interface TechnicianData {
  name: string;
  workPunchIn: string;
  workPunchOut: string;
  lunchPunchIn: string;
  lunchPunchOut: string;
}

export interface AssisTech {
  name: string;
  workPunchIn: string;
  workPunchOut: string;
  lunchPunchIn: string;
  lunchPunchOut: string;
}

export interface ReportData {
  // Header info
  date: string;
  jobName: string;
  jobNumber: string;
  location: string;
  weatherConditions: string;
  temperature: string;

  // Personnel
  technicians: TechnicianData[];
  assisTechs?: AssisTech[];

  // Work details
  workPerformed: string;
  materialsUsed: string;
  equipmentUsed: string;

  // Status
  workStatus: string;
  percentComplete: string;

  // Notes
  additionalNotes: string;

  // Signature
  signature?: string;
}

function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return 'N/A';
  try {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateTimeStr;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getJsPDF(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.jspdf && w.jspdf.jsPDF) return w.jspdf.jsPDF;
  if (w.jsPDF) return w.jsPDF;
  throw new Error('jsPDF not loaded');
}

export function generatePDF(data: ReportData): void {
  const jsPDF = getJsPDF();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' }) as any;

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const darkGray = [30, 30, 30];
  const medGray = [60, 60, 60];
  const lightGray = [200, 200, 200];
  const accentYellow = [245, 197, 24];
  const white = [255, 255, 255];
  const offWhite = [245, 245, 245];

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function drawSectionHeader(title: string) {
    checkPageBreak(30);
    doc.setFillColor(...darkGray);
    doc.rect(margin, y, contentWidth, 24, 'F');
    doc.setFillColor(...accentYellow);
    doc.rect(margin, y, 4, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...white);
    doc.text(title.toUpperCase(), margin + 12, y + 16);
    y += 30;
  }

  function drawField(label: string, value: string, x: number, fieldWidth: number) {
    checkPageBreak(40);
    doc.setFillColor(...offWhite);
    doc.rect(x, y, fieldWidth, 36, 'F');
    doc.setDrawColor(...lightGray);
    doc.rect(x, y, fieldWidth, 36, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(label.toUpperCase(), x + 6, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    const lines = doc.splitTextToSize(value || 'N/A', fieldWidth - 12);
    doc.text(lines[0] || 'N/A', x + 6, y + 28);
    y += 42;
  }

  function drawTwoFields(
    label1: string, value1: string,
    label2: string, value2: string
  ) {
    checkPageBreak(40);
    const halfWidth = (contentWidth - 8) / 2;
    const x1 = margin;
    const x2 = margin + halfWidth + 8;

    doc.setFillColor(...offWhite);
    doc.rect(x1, y, halfWidth, 36, 'F');
    doc.setDrawColor(...lightGray);
    doc.rect(x1, y, halfWidth, 36, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(label1.toUpperCase(), x1 + 6, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text(value1 || 'N/A', x1 + 6, y + 28);

    doc.setFillColor(...offWhite);
    doc.rect(x2, y, halfWidth, 36, 'F');
    doc.setDrawColor(...lightGray);
    doc.rect(x2, y, halfWidth, 36, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(label2.toUpperCase(), x2 + 6, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text(value2 || 'N/A', x2 + 6, y + 28);

    y += 42;
  }

  function drawTextArea(label: string, value: string) {
    const lines = doc.splitTextToSize(value || 'N/A', contentWidth - 12);
    const boxHeight = Math.max(52, lines.length * 15 + 24);
    checkPageBreak(boxHeight + 8);

    doc.setFillColor(...offWhite);
    doc.rect(margin, y, contentWidth, boxHeight, 'F');
    doc.setDrawColor(...lightGray);
    doc.rect(margin, y, contentWidth, boxHeight, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(label.toUpperCase(), margin + 6, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text(lines, margin + 6, y + 28);
    y += boxHeight + 6;
  }

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...darkGray);
  doc.rect(0, 0, pageWidth, 70, 'F');
  // No yellow border/bar in the header

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(...white);
  doc.text('SECURITY ENGINEERING INC.', margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...accentYellow);
  doc.text('DAILY FIELD REPORT', margin, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...lightGray);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 54, { align: 'right' });

  y = 90;

  // ── PROJECT INFORMATION ──────────────────────────────────────────────────────
  drawSectionHeader('Project Information');
  drawField('Date', formatDate(data.date), margin, contentWidth);
  drawTwoFields('Job Name', data.jobName, 'Job Number', data.jobNumber);
  drawTwoFields('Location', data.location, 'Weather Conditions', data.weatherConditions);
  drawField('Temperature', data.temperature ? `${data.temperature}°F` : 'N/A', margin, contentWidth);

  // ── LEAD TECHNICIANS ────────────────────────────────────────────────────────
  drawSectionHeader('Lead Technicians — Time & Attendance');

  if (data.technicians && data.technicians.length > 0) {
    data.technicians.forEach((tech, idx) => {
      checkPageBreak(130);

      // Sub-header for each technician
      doc.setFillColor(...medGray);
      doc.rect(margin, y, contentWidth, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...accentYellow);
      doc.text(`Technician ${idx + 1}: ${tech.name || 'Unnamed'}`, margin + 8, y + 15);
      y += 28;

      drawTwoFields('Work Punch In', formatDateTime(tech.workPunchIn), 'Work Punch Out', formatDateTime(tech.workPunchOut));
      drawTwoFields('Lunch Punch In', formatDateTime(tech.lunchPunchIn), 'Lunch Punch Out', formatDateTime(tech.lunchPunchOut));
    });
  } else {
    checkPageBreak(40);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(...medGray);
    doc.text('No technicians recorded.', margin + 6, y + 16);
    y += 32;
  }

  // ── ASSISTANT TECHNICIANS ────────────────────────────────────────────────────
  if (data.assisTechs && data.assisTechs.length > 0) {
    drawSectionHeader('Assistant Technicians — Time & Attendance');

    data.assisTechs.forEach((tech, idx) => {
      checkPageBreak(130);

      doc.setFillColor(...medGray);
      doc.rect(margin, y, contentWidth, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...accentYellow);
      doc.text(`ASSIS Tech ${idx + 1}: ${tech.name || 'Unnamed'}`, margin + 8, y + 15);
      y += 28;

      drawTwoFields('Work Punch In', formatDateTime(tech.workPunchIn), 'Work Punch Out', formatDateTime(tech.workPunchOut));
      drawTwoFields('Lunch Punch In', formatDateTime(tech.lunchPunchIn), 'Lunch Punch Out', formatDateTime(tech.lunchPunchOut));
    });
  }

  // ── WORK DETAILS ────────────────────────────────────────────────────────────
  drawSectionHeader('Work Details');
  drawTextArea('Work Performed', data.workPerformed);
  drawTextArea('Materials Used', data.materialsUsed);
  drawTextArea('Equipment Used', data.equipmentUsed);

  // ── STATUS ──────────────────────────────────────────────────────────────────
  drawSectionHeader('Project Status');
  drawTwoFields('Work Status', data.workStatus, 'Percent Complete', data.percentComplete ? `${data.percentComplete}%` : 'N/A');

  // ── ADDITIONAL NOTES ────────────────────────────────────────────────────────
  if (data.additionalNotes) {
    drawSectionHeader('Additional Notes');
    drawTextArea('Notes', data.additionalNotes);
  }

  // ── SIGNATURE ───────────────────────────────────────────────────────────────
  if (data.signature) {
    drawSectionHeader('Signature');
    checkPageBreak(100);
    try {
      doc.addImage(data.signature, 'PNG', margin, y, 200, 80);
      y += 90;
    } catch {
      // skip if signature image fails
    }
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...darkGray);
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...lightGray);
    doc.text('Security Engineering Inc. — Confidential Field Report', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Save
  const fileName = `field-report-${data.jobNumber || 'draft'}-${data.date || 'undated'}.pdf`;
  doc.save(fileName);
}
