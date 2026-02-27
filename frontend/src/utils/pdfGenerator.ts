export interface PhotoData {
  data: string;
  label: string;
}

export interface ReportData {
  checkIn: string;
  checkOut: string;
  projectManager: string;
  locationContact: string;
  leadTechnician: string;
  assistTech: string;
  jobCode: string;
  customerName: string;
  jobLocation: string;
  jobType: string;
  jobDescription: string;
  completionStatus: 'Fully Complete' | 'Uncompleted' | 'Partial' | 'Pending Parts' | 'Follow-Up Required' | string;
  closeOutReport: string;
  sitePhotos?: PhotoData[];
}

declare const window: Window & {
  jspdf?: { jsPDF: new (...args: unknown[]) => jsPDFInstance };
};

interface jsPDFInstance {
  internal: {
    pageSize: { getWidth: () => number; getHeight: () => number };
    getNumberOfPages: () => number;
  };
  setPage: (page: number) => void;
  addPage: () => void;
  setFillColor: (r: number, g: number, b: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  setFont: (font: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setLineWidth: (width: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  text: (text: string | string[], x: number, y: number, options?: Record<string, unknown>) => void;
  addImage: (imageData: string, format: string, x: number, y: number, w: number, h: number) => void;
  getImageProperties: (imageData: string) => { width: number; height: number };
  save: (filename: string) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
}

function getJsPDF(): new (...args: unknown[]) => jsPDFInstance {
  const w = window as typeof window & { jspdf?: { jsPDF: new (...args: unknown[]) => jsPDFInstance } };
  if (w.jspdf?.jsPDF) return w.jspdf.jsPDF;
  throw new Error('jsPDF not loaded. Make sure the CDN script is included in index.html.');
}

// Colors
const C = {
  headerBg: [20, 20, 20] as [number, number, number],
  headerText: [255, 204, 0] as [number, number, number],
  headerSub: [180, 180, 180] as [number, number, number],
  sectionBg: [30, 30, 30] as [number, number, number],
  sectionText: [255, 204, 0] as [number, number, number],
  labelText: [150, 150, 150] as [number, number, number],
  valueText: [230, 230, 230] as [number, number, number],
  divider: [60, 60, 60] as [number, number, number],
  pageBg: [15, 15, 15] as [number, number, number],
  footerBg: [20, 20, 20] as [number, number, number],
  footerText: [120, 120, 120] as [number, number, number],
  accent: [255, 204, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  cardBg: [22, 22, 22] as [number, number, number],
  cardBorder: [45, 45, 45] as [number, number, number],
};

function drawPageBackground(doc: jsPDFInstance, pageWidth: number, pageHeight: number) {
  doc.setFillColor(...C.pageBg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

function drawHeader(doc: jsPDFInstance, pageWidth: number) {
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, pageWidth, 46, 'F');

  doc.setFillColor(...C.accent);
  doc.rect(0, 0, 4, 46, 'F');

  doc.setFillColor(...C.accent);
  doc.rect(0, 46, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...C.headerText);
  doc.text('SECURITY ENGINEERING INC.', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.headerSub);
  doc.text('DAILY  FIELD  REPORT', pageWidth / 2, 29, { align: 'center' });

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.footerText);
  doc.text(`Generated: ${dateStr}`, pageWidth / 2, 39, { align: 'center' });
}

function drawFooter(doc: jsPDFInstance, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  doc.setFillColor(...C.footerBg);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');

  doc.setFillColor(...C.accent);
  doc.rect(0, pageHeight - 14, pageWidth, 1, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.footerText);
  doc.text('Security Engineering Inc. — Confidential Field Report', 12, pageHeight - 5);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 12, pageHeight - 5, { align: 'right' });
}

function drawSectionHeader(doc: jsPDFInstance, label: string, y: number, pageWidth: number): number {
  const margin = 10;

  doc.setFillColor(...C.sectionBg);
  doc.rect(margin, y, pageWidth - margin * 2, 9, 'F');

  doc.setFillColor(...C.accent);
  doc.rect(margin, y, 3, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.sectionText);
  doc.text(label.toUpperCase(), margin + 7, y + 6);

  return y + 13;
}

function drawDivider(doc: jsPDFInstance, y: number, pageWidth: number): number {
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.4);
  doc.line(10, y, pageWidth - 10, y);
  return y + 5;
}

function drawCardBackground(doc: jsPDFInstance, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...C.cardBg);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(...C.cardBorder);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'S');
}

function drawStackedField(
  doc: jsPDFInstance,
  label: string,
  value: string,
  x: number,
  y: number,
  contentWidth: number,
  isLast: boolean,
  pageWidth: number
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.labelText);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.valueText);
  const lines = doc.splitTextToSize(value || '—', contentWidth - 6);
  doc.text(lines, x, y + 5);

  const fieldBottom = y + 5 + lines.length * 4.8 + 4;

  if (!isLast) {
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.25);
    doc.line(x, fieldBottom, x + contentWidth - 4, fieldBottom);
    return fieldBottom + 5;
  }

  return fieldBottom;
}

export function generateReportPDF(data: ReportData): void {
  const JsPDF = getJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const headerH = 50;
  const footerH = 16;
  const maxY = pageHeight - footerH;
  const fieldX = margin + 4;
  const fieldW = contentWidth - 4;

  let y = headerH;

  drawPageBackground(doc, pageWidth, pageHeight);
  drawHeader(doc, pageWidth);

  const ensureSpace = (needed: number): number => {
    if (y + needed > maxY) {
      doc.addPage();
      drawPageBackground(doc, pageWidth, pageHeight);
      drawHeader(doc, pageWidth);
      y = headerH;
    }
    return y;
  };

  // ── TIME & ATTENDANCE ──────────────────────────────────────────────────────
  y = ensureSpace(55);
  y = drawSectionHeader(doc, 'Time & Attendance', y, pageWidth);

  const taCardY = y;
  const taCardH = 30;
  drawCardBackground(doc, margin, taCardY, contentWidth, taCardH);
  y = taCardY + 5;

  y = drawStackedField(doc, 'Check In', data.checkIn, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Check Out', data.checkOut, fieldX, y, fieldW, true, pageWidth);

  y = taCardY + taCardH + 4;
  y = drawDivider(doc, y, pageWidth);

  // ── PERSONNEL ─────────────────────────────────────────────────────────────
  y = ensureSpace(70);
  y = drawSectionHeader(doc, 'Personnel', y, pageWidth);

  const pCardY = y;
  const pCardH = 58;
  drawCardBackground(doc, margin, pCardY, contentWidth, pCardH);
  y = pCardY + 5;

  y = drawStackedField(doc, 'Project Manager', data.projectManager, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Location Contact', data.locationContact, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Lead Technician', data.leadTechnician, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Assis Technician', data.assistTech, fieldX, y, fieldW, true, pageWidth);

  y = pCardY + pCardH + 4;
  y = drawDivider(doc, y, pageWidth);

  // ── JOB DETAILS ───────────────────────────────────────────────────────────
  y = ensureSpace(20);
  y = drawSectionHeader(doc, 'Job Details', y, pageWidth);

  const descLines = doc.splitTextToSize(data.jobDescription || '—', fieldW - 6);
  const descFieldH = 5 + descLines.length * 4.8 + 4;
  const jdCardH = 14 * 4 + descFieldH + 10;

  y = ensureSpace(jdCardH + 20);
  const jdActualCardY = y;
  drawCardBackground(doc, margin, jdActualCardY, contentWidth, jdCardH);
  y = jdActualCardY + 5;

  y = drawStackedField(doc, 'Job Code', data.jobCode, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Customer Name', data.customerName, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Job Location', data.jobLocation, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Job Type', data.jobType, fieldX, y, fieldW, false, pageWidth);
  y = drawStackedField(doc, 'Job Description', data.jobDescription, fieldX, y, fieldW, true, pageWidth);

  y = jdActualCardY + jdCardH + 4;
  y = drawDivider(doc, y, pageWidth);

  // ── COMPLETION STATUS ─────────────────────────────────────────────────────
  y = ensureSpace(35);
  y = drawSectionHeader(doc, 'Completion Status', y, pageWidth);

  const csCardY = y;
  const csCardH = 18;
  drawCardBackground(doc, margin, csCardY, contentWidth, csCardH);
  y = csCardY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.labelText);
  doc.text('STATUS', fieldX, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...C.accent);
  doc.text((data.completionStatus || '—').toUpperCase(), fieldX, y + 7);

  y = csCardY + csCardH + 4;
  y = drawDivider(doc, y, pageWidth);

  // ── CLOSE OUT REPORT ──────────────────────────────────────────────────────
  y = ensureSpace(35);
  y = drawSectionHeader(doc, 'Close Out Report', y, pageWidth);

  const corLines = doc.splitTextToSize(data.closeOutReport || '—', contentWidth - 10);
  const corContentH = corLines.length * 5 + 8;
  y = ensureSpace(corContentH + 10);

  const corCardY = y;
  drawCardBackground(doc, margin, corCardY, contentWidth, corContentH);
  y = corCardY + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.valueText);
  doc.text(corLines, fieldX, y);
  y = corCardY + corContentH + 4;

  y = drawDivider(doc, y, pageWidth);

  // ── SITE PHOTOS ───────────────────────────────────────────────────────────
  if (data.sitePhotos && data.sitePhotos.length > 0) {
    y = ensureSpace(25);
    y = drawSectionHeader(doc, 'Site Photos', y, pageWidth);

    for (let i = 0; i < data.sitePhotos.length; i++) {
      const photo = data.sitePhotos[i];
      const imgData = photo.data;
      const photoLabel = photo.label;

      try {
        const props = doc.getImageProperties(imgData);
        const maxImgWidth = contentWidth - 6;
        const aspectRatio = props.height / props.width;
        const imgW = maxImgWidth;
        const imgH = imgW * aspectRatio;

        // Calculate label caption height
        const captionLines = photoLabel
          ? doc.splitTextToSize(photoLabel, contentWidth - 10)
          : [];
        const captionH = captionLines.length > 0 ? captionLines.length * 4.5 + 8 : 0;

        // Ensure enough space for photo header + image + caption
        const neededH = Math.min(imgH, maxY - headerH - 10) + 14 + captionH;
        y = ensureSpace(neededH);

        // Photo number header card
        const photoLabelH = 9;
        drawCardBackground(doc, margin, y, contentWidth, photoLabelH);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.labelText);
        doc.text(`PHOTO ${i + 1} OF ${data.sitePhotos.length}`, fieldX, y + 6);
        y += photoLabelH + 2;

        // Clamp image height to available space
        const availH = maxY - y - captionH - 10;
        const renderH = Math.min(imgH, availH);
        const renderW = renderH / aspectRatio;

        // Thin border around image
        doc.setDrawColor(...C.cardBorder);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, renderW + 3, renderH + 3, 'S');

        doc.addImage(imgData, 'JPEG', margin + 1.5, y + 1.5, renderW, renderH);
        y += renderH + 5;

        // Photo caption / label below image
        if (captionLines.length > 0) {
          const captionCardY = y;
          drawCardBackground(doc, margin, captionCardY, contentWidth, captionH);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(...C.labelText);
          doc.text('DESCRIPTION', fieldX, captionCardY + 5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...C.valueText);
          doc.text(captionLines, fieldX, captionCardY + 10);

          y += captionH + 3;
        }

        y += 5;

        if (i < data.sitePhotos.length - 1) {
          y = drawDivider(doc, y, pageWidth);
        }
      } catch {
        // Skip images that fail to load
      }
    }
  }

  // ── Finalize: add footers to all pages ────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, pageWidth, pageHeight, p, totalPages);
  }

  // Save
  const dateTag = new Date().toISOString().slice(0, 10);
  const jobTag = data.jobCode ? `_${data.jobCode.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
  doc.save(`field-report${jobTag}_${dateTag}.pdf`);
}
