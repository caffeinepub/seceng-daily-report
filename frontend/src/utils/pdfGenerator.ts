export interface ReportData {
  projectName: string;
  projectNumber: string;
  date: string;
  weather: string;
  temperature: string;
  reportNumber: string;
  preparedBy: string;
  locationContact: string;
  siteAddress: string;
  clientName: string;
  pointOfContact?: string;
  projectManager?: string;
  personnel: Array<{ name: string; role: string; hours: string }>;
  workItems: Array<{ description: string; status: string; notes: string }>;
  safetyNotes: string;
  generalNotes: string;
  signature?: string;
  sitePhotos?: string[]; // base64 data URLs
}

declare global {
  interface Window {
    jspdf: { jsPDF: new (...args: unknown[]) => JsPDFInstance };
  }
}

interface JsPDFInstance {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFontSize: (size: number) => void;
  setFont: (font: string, style?: string) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setFillColor: (r: number, g: number, b: number) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  setLineWidth: (width: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  text: (text: string | string[], x: number, y: number, options?: Record<string, unknown>) => void;
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number
  ) => void;
  addPage: () => void;
  save: (filename: string) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  getTextWidth: (text: string) => number;
}

function getJsPDF(): new (...args: unknown[]) => JsPDFInstance {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.jsPDF) return w.jsPDF;
  throw new Error("jsPDF not loaded. Make sure the CDN script is included in index.html.");
}

// Colors
const C = {
  black: [20, 20, 20] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  yellow: [245, 197, 24] as [number, number, number],
  darkGray: [40, 40, 40] as [number, number, number],
  midGray: [90, 90, 90] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  veryLightGray: [240, 240, 240] as [number, number, number],
  sectionBg: [30, 30, 30] as [number, number, number],
};

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

function checkPageBreak(doc: JsPDFInstance, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    return MARGIN + 10;
  }
  return y;
}

function drawSectionHeader(doc: JsPDFInstance, y: number, title: string): number {
  y = checkPageBreak(doc, y, 12);
  doc.setFillColor(...C.sectionBg);
  doc.rect(MARGIN, y, CONTENT_W, 9, "F");
  doc.setFillColor(...C.yellow);
  doc.rect(MARGIN, y, 3, 9, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.yellow);
  doc.text(title.toUpperCase(), MARGIN + 6, y + 6);
  return y + 13;
}

function drawField(
  doc: JsPDFInstance,
  y: number,
  label: string,
  value: string,
  x: number = MARGIN,
  w: number = CONTENT_W
): number {
  y = checkPageBreak(doc, y, 8);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.midGray);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.black);
  const lines = doc.splitTextToSize(value || "—", w - 2);
  doc.text(lines, x, y + 4.5);
  return y + 4.5 + lines.length * 4.5;
}

function drawDivider(doc: JsPDFInstance, y: number): number {
  doc.setDrawColor(...C.lightGray);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  return y + 3;
}

export async function generatePDF(data: ReportData): Promise<void> {
  const JsPDF = getJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = MARGIN;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // Logo area
  doc.setFillColor(...C.black);
  doc.rect(0, 0, PAGE_W, 28, "F");

  // Yellow accent bar
  doc.setFillColor(...C.yellow);
  doc.rect(0, 28, PAGE_W, 1.5, "F");

  // Try to add logo
  try {
    doc.addImage("/assets/generated/seceng-logo.dim_256x256.png", "PNG", MARGIN, 4, 18, 18);
  } catch {
    // Logo not available, skip
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.yellow);
  doc.text("DAILY FIELD REPORT", MARGIN + 22, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.lightGray);
  doc.text("SECURITY ENGINEERING CORP", MARGIN + 22, 19);

  // Report number top-right
  if (data.reportNumber) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.yellow);
    doc.text(`REPORT #${data.reportNumber}`, PAGE_W - MARGIN, 13, { align: "right" });
  }

  // Date top-right
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.lightGray);
  doc.text(data.date || "", PAGE_W - MARGIN, 19, { align: "right" });

  y = 36;

  // ── PROJECT INFO ─────────────────────────────────────────────────────────────
  y = drawSectionHeader(doc, y, "Project Information");

  const col1x = MARGIN;
  const col2x = MARGIN + CONTENT_W / 2 + 2;
  const colW = CONTENT_W / 2 - 4;

  const infoRows: [string, string, string, string][] = [
    ["Project Name", data.projectName, "Client", data.clientName],
    ["Project Number", data.projectNumber, "Site Address", data.siteAddress],
    ["Prepared By", data.preparedBy, "Point of Contact", data.locationContact || data.pointOfContact || ""],
    ["Project Manager", data.projectManager || "", "Weather", data.weather],
    ["Temperature", data.temperature, "Report Number", data.reportNumber],
  ];

  for (const [l1, v1, l2, v2] of infoRows) {
    const startY = y;
    const endY1 = drawField(doc, startY, l1, v1, col1x, colW);
    const endY2 = drawField(doc, startY, l2, v2, col2x, colW);
    y = Math.max(endY1, endY2) + 2;
    y = drawDivider(doc, y);
  }

  y += 4;

  // ── TECHNICAL TEAM ───────────────────────────────────────────────────────────
  y = drawSectionHeader(doc, y, "Technical Team");

  // Table header
  y = checkPageBreak(doc, y, 8);
  doc.setFillColor(...C.veryLightGray);
  doc.rect(MARGIN, y, CONTENT_W, 7, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.midGray);
  doc.text("NAME", MARGIN + 2, y + 5);
  doc.text("ROLE", MARGIN + 70, y + 5);
  doc.text("HOURS", MARGIN + 140, y + 5);
  y += 9;

  for (const person of data.personnel) {
    if (!person.name && !person.role) continue;
    y = checkPageBreak(doc, y, 7);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.black);
    doc.text(person.name || "—", MARGIN + 2, y + 4);
    doc.text(person.role || "—", MARGIN + 70, y + 4);
    doc.text(person.hours || "—", MARGIN + 140, y + 4);
    y += 7;
    doc.setDrawColor(...C.lightGray);
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  }

  y += 6;

  // ── WORK PERFORMED ───────────────────────────────────────────────────────────
  y = drawSectionHeader(doc, y, "Work Performed");

  for (let i = 0; i < data.workItems.length; i++) {
    const item = data.workItems[i];
    if (!item.description) continue;

    y = checkPageBreak(doc, y, 14);

    // Status badge
    const statusColors: Record<string, [number, number, number]> = {
      Completed: [34, 197, 94],
      "In Progress": [245, 197, 24],
      Pending: [156, 163, 175],
      "On Hold": [239, 68, 68],
    };
    const statusColor = statusColors[item.status] || C.midGray;

    doc.setFillColor(...statusColor);
    doc.rect(MARGIN, y, 2.5, 2.5, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.midGray);
    doc.text(`ITEM ${i + 1}`, MARGIN + 5, y + 2);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...statusColor);
    doc.text(item.status.toUpperCase(), MARGIN + 25, y + 2);

    y += 5;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.black);
    const descLines = doc.splitTextToSize(item.description, CONTENT_W - 4);
    y = checkPageBreak(doc, y, descLines.length * 5);
    doc.text(descLines, MARGIN + 2, y + 4);
    y += descLines.length * 5 + 2;

    if (item.notes) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.midGray);
      const noteLines = doc.splitTextToSize(`Notes: ${item.notes}`, CONTENT_W - 6);
      y = checkPageBreak(doc, y, noteLines.length * 4.5);
      doc.text(noteLines, MARGIN + 4, y);
      y += noteLines.length * 4.5 + 2;
    }

    y = drawDivider(doc, y);
  }

  y += 4;

  // ── SAFETY NOTES ─────────────────────────────────────────────────────────────
  if (data.safetyNotes) {
    y = drawSectionHeader(doc, y, "Safety Notes");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.black);
    const safetyLines = doc.splitTextToSize(data.safetyNotes, CONTENT_W - 4);
    y = checkPageBreak(doc, y, safetyLines.length * 5);
    doc.text(safetyLines, MARGIN + 2, y);
    y += safetyLines.length * 5 + 6;
  }

  // ── GENERAL NOTES ────────────────────────────────────────────────────────────
  if (data.generalNotes) {
    y = drawSectionHeader(doc, y, "General Notes");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.black);
    const generalLines = doc.splitTextToSize(data.generalNotes, CONTENT_W - 4);
    y = checkPageBreak(doc, y, generalLines.length * 5);
    doc.text(generalLines, MARGIN + 2, y);
    y += generalLines.length * 5 + 6;
  }

  // ── SITE PHOTOS + SIGNATURE (side by side) ───────────────────────────────────
  // Calculate column widths: SITE PHOTOS takes ~60%, SIGNATURE takes ~40%
  const photoColW = CONTENT_W * 0.58;
  const sigColW = CONTENT_W * 0.38;
  const colGap = CONTENT_W * 0.04;
  const sigColX = MARGIN + photoColW + colGap;

  const hasSitePhotos = data.sitePhotos && data.sitePhotos.length > 0;

  // Estimate height needed for the combined section
  const thumbW = (photoColW - 4) / 2;
  const thumbH = thumbW * 0.75;
  const photoRows = hasSitePhotos ? Math.ceil(data.sitePhotos!.length / 2) : 0;
  const photosBlockH = hasSitePhotos ? photoRows * (thumbH + 10) + 4 : 0;
  const sigBlockH = 40;
  const sectionNeeded = Math.max(photosBlockH, sigBlockH) + 20;

  y = checkPageBreak(doc, y, sectionNeeded);

  // Draw section headers side by side
  // SITE PHOTOS header
  doc.setFillColor(...C.sectionBg);
  doc.rect(MARGIN, y, photoColW, 9, "F");
  doc.setFillColor(...C.yellow);
  doc.rect(MARGIN, y, 3, 9, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.yellow);
  doc.text("SITE PHOTOS", MARGIN + 6, y + 6);

  // SIGNATURE header
  doc.setFillColor(...C.sectionBg);
  doc.rect(sigColX, y, sigColW, 9, "F");
  doc.setFillColor(...C.yellow);
  doc.rect(sigColX, y, 3, 9, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.yellow);
  doc.text("SIGNATURE", sigColX + 6, y + 6);

  y += 13;

  const contentStartY = y;

  // ── SITE PHOTOS content ──────────────────────────────────────────────────────
  if (hasSitePhotos) {
    let photoY = contentStartY;
    const photosPerRow = 2;

    for (let i = 0; i < data.sitePhotos!.length; i++) {
      const col = i % photosPerRow;
      const photoX = MARGIN + col * (thumbW + 4);

      if (col === 0 && i > 0) {
        photoY += thumbH + 10;
      }

      // Photo border/background
      doc.setFillColor(...C.veryLightGray);
      doc.rect(photoX, photoY, thumbW, thumbH, "F");
      doc.setDrawColor(...C.lightGray);
      doc.setLineWidth(0.3);
      doc.rect(photoX, photoY, thumbW, thumbH, "S");

      // Embed image
      try {
        const photoDataUrl = data.sitePhotos![i];
        let format = "JPEG";
        if (photoDataUrl.startsWith("data:image/png")) format = "PNG";
        else if (photoDataUrl.startsWith("data:image/webp")) format = "WEBP";
        else if (photoDataUrl.startsWith("data:image/gif")) format = "GIF";
        doc.addImage(photoDataUrl, format, photoX, photoY, thumbW, thumbH);
      } catch {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...C.midGray);
        doc.text("Image unavailable", photoX + thumbW / 2, photoY + thumbH / 2, { align: "center" });
      }

      // Photo label
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.midGray);
      doc.text(`PHOTO ${i + 1}`, photoX + thumbW / 2, photoY + thumbH + 5, { align: "center" });
    }
  } else {
    // No photos placeholder
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...C.midGray);
    doc.text("No site photos attached.", MARGIN + 2, contentStartY + 8);
  }

  // ── SIGNATURE content ────────────────────────────────────────────────────────
  let sigY = contentStartY;

  if (data.signature) {
    try {
      doc.addImage(data.signature, "PNG", sigColX, sigY, sigColW, 25);
      sigY += 28;
    } catch {
      sigY += 4;
    }
  } else {
    // Blank signature line
    doc.setDrawColor(...C.lightGray);
    doc.setLineWidth(0.4);
    doc.line(sigColX, sigY + 20, sigColX + sigColW, sigY + 20);
    sigY += 24;
  }

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.midGray);
  doc.text(`Prepared by: ${data.preparedBy || ""}`, sigColX, sigY);
  sigY += 5;
  doc.text(`Date: ${data.date || ""}`, sigColX, sigY);

  // Advance y past both columns
  const photosFinalY = hasSitePhotos
    ? contentStartY + (Math.ceil(data.sitePhotos!.length / 2) - 1) * (thumbH + 10) + thumbH + 12
    : contentStartY + 20;
  y = Math.max(photosFinalY, sigY + 6) + 6;

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= totalPages; p++) {
    (doc as unknown as { setPage: (n: number) => void }).setPage?.(p);
    doc.setFillColor(...C.black);
    doc.rect(0, PAGE_H - 10, PAGE_W, 10, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.lightGray);
    doc.text("SECURITY ENGINEERING CORP — CONFIDENTIAL", MARGIN, PAGE_H - 4);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 4, { align: "right" });
  }

  const filename = `DFR_${data.projectNumber || "report"}_${data.date || "date"}.pdf`;
  doc.save(filename);
}
