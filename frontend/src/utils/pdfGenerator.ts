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
  completionStatus: string;
  closeOutReport: string;
  sitePhotos?: string[];
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

// Colors — unchanged from original
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
  // Header background — full-width dark bar
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, pageWidth, 46, 'F');

  // Left accent bar (mirrors the app's left-border card style)
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, 4, 46, 'F');

  // Bottom accent line
  doc.setFillColor(...C.accent);
  doc.rect(0, 46, pageWidth, 1.5, 'F');

  // Company name — large bold uppercase (mirrors app header "SECURITY ENGINEERING INC.")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...C.headerText);
  doc.text('SECURITY ENGINEERING INC.', pageWidth / 2, 18, { align: 'center' });

  // Report title — smaller subtitle (mirrors app "Daily Field Report")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.headerSub);
  // Spaced-out tracking effect via character spacing workaround
  doc.text('DAILY  FIELD  REPORT', pageWidth / 2, 29, { align: 'center' });

  // Date generated — smallest line
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.footerText);
  doc.text(`Generated: ${dateStr}`, pageWidth / 2, 39, { align: 'center' });
}

function drawFooter(doc: jsPDFInstance, pageWidth: number, pageHeight: number, pageNum: number, totalPages: number) {
  doc.setFillColor(...C.footerBg);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');

  // Top accent line on footer
  doc.setFillColor(...C.accent);
  doc.rect(0, pageHeight - 14, pageWidth, 1, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...C.footerText);
  doc.text('Security Engineering Inc. — Confidential Field Report', 12, pageHeight - 5);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 12, pageHeight - 5, { align: 'right' });
}

/**
 * Draws a section header that mirrors the app's card section headings:
 * dark background block, left accent bar, bold uppercase label with wide tracking.
 */
function drawSectionHeader(doc: jsPDFInstance, label: string, y: number, pageWidth: number): number {
  const margin = 10;

  // Card-like section background
  doc.setFillColor(...C.sectionBg);
  doc.rect(margin, y, pageWidth - margin * 2, 9, 'F');

  // Left accent bar — mirrors app's yellow left-border on section headings
  doc.setFillColor(...C.accent);
  doc.rect(margin, y, 3, 9, 'F');

  // Section label — bold, uppercase, wide tracking (mirrors app heading style)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.sectionText);
  doc.text(label.toUpperCase(), margin + 7, y + 6);

  return y + 13; // extra bottom padding after heading
}

/**
 * Draws a horizontal divider line between sections,
 * mirroring the app's card/section dividers.
 */
function drawDivider(doc: jsPDFInstance, y: number, pageWidth: number): number {
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.4);
  doc.line(10, y, pageWidth - 10, y);
  return y + 5;
}

/**
 * Draws a card-like container background for a section's content block.
 * Mirrors the app's bg-surface card style.
 */
function drawCardBackground(doc: jsPDFInstance, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...C.cardBg);
  doc.rect(x, y, w, h, 'F');
  // Subtle border
  doc.setDrawColor(...C.cardBorder);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'S');
}

/**
 * Draws a label + value pair with consistent spacing.
 * Label is small, muted, uppercase. Value is larger, light-colored.
 */
function drawField(doc: jsPDFInstance, label: string, value: string, x: number, y: number, colWidth: number): number {
  // Label — small, muted, uppercase (mirrors app's labelClass)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.labelText);
  doc.text(label.toUpperCase(), x, y);

  // Value — normal weight, light color (mirrors app's value text)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.valueText);
  const lines = doc.splitTextToSize(value || '—', colWidth - 4);
  doc.text(lines, x, y + 5);

  return y + 5 + lines.length * 4.8 + 3;
}

export function generateReportPDF(data: ReportData): void {
  const JsPDF = getJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const colWidth = (contentWidth - 6) / 2;
  const headerH = 50; // taller header
  const footerH = 16;
  const maxY = pageHeight - footerH;

  let y = headerH;

  // Draw first page background and header
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

  const leftX = margin;
  const rightX = margin + colWidth + 6;

  // ── Time & Attendance ──
  y = ensureSpace(48);
  y = drawSectionHeader(doc, 'Time & Attendance', y, pageWidth);

  // Card background for this section's content
  const taCardY = y;
  const taCardH = 22;
  drawCardBackground(doc, margin, taCardY, contentWidth, taCardH);
  y = taCardY + 4;

  const ciY = drawField(doc, 'Check In', data.checkIn, leftX + 3, y, colWidth);
  const coY = drawField(doc, 'Check Out', data.checkOut, rightX - 3, y, colWidth);
  y = Math.max(ciY, coY);
  y = taCardY + taCardH + 5;

  y = drawDivider(doc, y, pageWidth);

  // ── Personnel ──
  y = ensureSpace(58);
  y = drawSectionHeader(doc, 'Personnel', y, pageWidth);

  const pCardY = y;
  const pCardH = 36;
  drawCardBackground(doc, margin, pCardY, contentWidth, pCardH);
  y = pCardY + 4;

  const pmY = drawField(doc, 'Project Manager', data.projectManager, leftX + 3, y, colWidth);
  const lcY = drawField(doc, 'Location Contact', data.locationContact, rightX - 3, y, colWidth);
  y = Math.max(pmY, lcY) + 2;

  const ltY = drawField(doc, 'Lead Technician', data.leadTechnician, leftX + 3, y, colWidth);
  const atY = drawField(doc, 'Assis Technician', data.assistTech, rightX - 3, y, colWidth);
  y = Math.max(ltY, atY);
  y = pCardY + pCardH + 5;

  y = drawDivider(doc, y, pageWidth);

  // ── Job Details ──
  y = ensureSpace(58);
  y = drawSectionHeader(doc, 'Job Details', y, pageWidth);

  const jdCardY = y;
  const jdCardH = 36;
  drawCardBackground(doc, margin, jdCardY, contentWidth, jdCardH);
  y = jdCardY + 4;

  const jcY = drawField(doc, 'Job Code', data.jobCode, leftX + 3, y, colWidth);
  const cnY = drawField(doc, 'Customer Name', data.customerName, rightX - 3, y, colWidth);
  y = Math.max(jcY, cnY) + 2;

  const jlY = drawField(doc, 'Job Location', data.jobLocation, leftX + 3, y, colWidth);
  const jtY = drawField(doc, 'Job Type', data.jobType, rightX - 3, y, colWidth);
  y = Math.max(jlY, jtY);
  y = jdCardY + jdCardH + 5;

  y = drawDivider(doc, y, pageWidth);

  // ── Completion Status ──
  y = ensureSpace(30);
  y = drawSectionHeader(doc, 'Completion Status', y, pageWidth);

  const csCardY = y;
  const csCardH = 16;
  drawCardBackground(doc, margin, csCardY, contentWidth, csCardH);
  y = csCardY + 4;

  // Status value with accent color highlight
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.labelText);
  doc.text('STATUS', leftX + 3, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...C.accent);
  doc.text((data.completionStatus || '—').toUpperCase(), leftX + 3, y + 6);

  y = csCardY + csCardH + 5;
  y = drawDivider(doc, y, pageWidth);

  // ── Job Description ──
  y = ensureSpace(35);
  y = drawSectionHeader(doc, 'Job Description', y, pageWidth);

  const descLines = doc.splitTextToSize(data.jobDescription || '—', contentWidth - 10);
  const descContentH = descLines.length * 5 + 8;
  y = ensureSpace(descContentH + 10);

  const descCardY = y;
  drawCardBackground(doc, margin, descCardY, contentWidth, descContentH);
  y = descCardY + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.valueText);
  doc.text(descLines, leftX + 3, y);
  y = descCardY + descContentH + 5;

  y = drawDivider(doc, y, pageWidth);

  // ── Close Out Report ──
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
  doc.text(corLines, leftX + 3, y);
  y = corCardY + corContentH + 5;

  y = drawDivider(doc, y, pageWidth);

  // ── Site Photos ──
  if (data.sitePhotos && data.sitePhotos.length > 0) {
    y = ensureSpace(25);
    y = drawSectionHeader(doc, 'Site Photos', y, pageWidth);

    for (let i = 0; i < data.sitePhotos.length; i++) {
      const imgData = data.sitePhotos[i];
      try {
        const props = doc.getImageProperties(imgData);
        const maxImgWidth = contentWidth - 6;
        const aspectRatio = props.height / props.width;
        const imgW = maxImgWidth;
        const imgH = imgW * aspectRatio;

        // Ensure enough space for the image
        const neededH = Math.min(imgH, maxY - headerH - 10) + 14;
        y = ensureSpace(neededH);

        // Photo label card
        const photoLabelH = 9;
        drawCardBackground(doc, margin, y, contentWidth, photoLabelH);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.labelText);
        doc.text(`PHOTO ${i + 1} OF ${data.sitePhotos.length}`, leftX + 3, y + 6);
        y += photoLabelH + 2;

        // Clamp image height to available space
        const availH = maxY - y - 6;
        const renderH = Math.min(imgH, availH);
        const renderW = renderH / aspectRatio;

        // Thin border around image
        doc.setDrawColor(...C.cardBorder);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, renderW + 3, renderH + 3, 'S');

        doc.addImage(imgData, 'JPEG', margin + 1.5, y + 1.5, renderW, renderH);
        y += renderH + 8;

        if (i < data.sitePhotos.length - 1) {
          y = drawDivider(doc, y, pageWidth);
        }
      } catch {
        // Skip images that fail to load
      }
    }
  }

  // ── Finalize: add footers to all pages ──
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
