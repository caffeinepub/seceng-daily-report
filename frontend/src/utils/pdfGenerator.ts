export interface ReportData {
  projectName: string;
  projectNumber: string;
  projectAddress: string;
  projectManager: string;
  locationContact: string; // displayed as "Point of Contact"
  reportDate: string;
  reportNumber: string;
  weatherConditions: string;
  temperature: string;
  personnel: Array<{
    id: string;
    name: string;
    role: string;
    hoursWorked: string;
    company: string;
  }>;
  workPerformed: string;
  materialsUsed: Array<{
    id: string;
    description: string;
    quantity: string;
    unit: string;
  }>;
  equipmentUsed: Array<{
    id: string;
    description: string;
    quantity: string;
    hours: string;
  }>;
  safetyObservations: string;
  incidents: string;
  nearMisses: string;
  issuesDelays: string;
  visitors: Array<{
    id: string;
    name: string;
    company: string;
    purpose: string;
    timeIn: string;
    timeOut: string;
  }>;
  sitePhotos: Array<{
    id: string;
    file: File;
    caption: string;
    preview: string;
  }>;
  signatureData: string;
  signatoryName: string;
  signatoryTitle: string;
}

// Colors
const COLORS = {
  black: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  yellow: [245, 158, 11] as [number, number, number],
  darkGray: [30, 30, 30] as [number, number, number],
  medGray: [60, 60, 60] as [number, number, number],
  lightGray: [120, 120, 120] as [number, number, number],
  veryLightGray: [220, 220, 220] as [number, number, number],
  offWhite: [245, 245, 245] as [number, number, number],
  sectionBg: [240, 240, 240] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

function getJsPDF() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.jspdf?.jsPDF) return w.jspdf.jsPDF;
  if (w.jsPDF) return w.jsPDF;
  throw new Error("jsPDF not loaded");
}

export async function generatePDF(data: ReportData): Promise<void> {
  const jsPDF = getJsPDF();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = MARGIN;

  // ── helpers ──────────────────────────────────────────────────────────────

  function checkPageBreak(needed = 10) {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function drawSectionHeader(title: string) {
    checkPageBreak(12);
    doc.setFillColor(...COLORS.darkGray);
    doc.rect(MARGIN, y, CONTENT_W, 8, "F");
    doc.setTextColor(...COLORS.yellow);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title, MARGIN + 3, y + 5.5);
    doc.setTextColor(...COLORS.black);
    y += 10;
  }

  function drawField(label: string, value: string, x: number, w: number) {
    checkPageBreak(14);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.lightGray);
    doc.text(label.toUpperCase(), x, y);
    y += 3.5;
    doc.setFillColor(...COLORS.offWhite);
    doc.rect(x, y, w, 7, "F");
    doc.setDrawColor(...COLORS.veryLightGray);
    doc.rect(x, y, w, 7, "S");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.darkGray);
    const lines = doc.splitTextToSize(value || "—", w - 4);
    doc.text(lines[0] || "—", x + 2, y + 4.8);
    y += 9;
  }

  function drawTextArea(label: string, value: string) {
    const lines = doc.splitTextToSize(value || "—", CONTENT_W - 6);
    const boxH = Math.max(12, lines.length * 4.5 + 5);
    checkPageBreak(boxH + 8);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.lightGray);
    doc.text(label.toUpperCase(), MARGIN, y);
    y += 3.5;
    doc.setFillColor(...COLORS.offWhite);
    doc.rect(MARGIN, y, CONTENT_W, boxH, "F");
    doc.setDrawColor(...COLORS.veryLightGray);
    doc.rect(MARGIN, y, CONTENT_W, boxH, "S");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.darkGray);
    doc.text(lines, MARGIN + 3, y + 4.5);
    y += boxH + 4;
  }

  // ── HEADER ───────────────────────────────────────────────────────────────

  // Logo area
  try {
    const logoUrl = "/assets/generated/seceng-logo.dim_256x256.png";
    const resp = await fetch(logoUrl);
    if (resp.ok) {
      const blob = await resp.blob();
      const reader = new FileReader();
      const logoData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      doc.addImage(logoData, "PNG", MARGIN, y, 18, 18);
    }
  } catch {
    // logo optional
  }

  // Company name + report title
  doc.setFillColor(...COLORS.darkGray);
  doc.rect(MARGIN + 20, y, CONTENT_W - 20, 18, "F");
  doc.setTextColor(...COLORS.yellow);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("SECENG", MARGIN + 24, y + 7);
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("DAILY FIELD REPORT", MARGIN + 24, y + 13);

  // Report meta (top right)
  const metaX = PAGE_W - MARGIN - 55;
  doc.setTextColor(...COLORS.lightGray);
  doc.setFontSize(6.5);
  doc.text(`DATE: ${data.reportDate || "—"}`, metaX, y + 5);
  doc.text(`REPORT #: ${data.reportNumber || "—"}`, metaX, y + 10);
  doc.text(`WEATHER: ${data.weatherConditions || "—"}`, metaX, y + 15);

  y += 22;

  // ── PROJECT INFORMATION ───────────────────────────────────────────────────

  drawSectionHeader("PROJECT INFORMATION");

  // Row 1: Project Name + Project Number
  const halfW = (CONTENT_W - 4) / 2;
  const col2X = MARGIN + halfW + 4;

  const savedY1 = y;
  drawField("Project Name", data.projectName, MARGIN, halfW);
  const afterLeft1 = y;
  y = savedY1;
  drawField("Project Number", data.projectNumber, col2X, halfW);
  y = Math.max(afterLeft1, y);

  // Row 2: Project Address (full width)
  drawField("Project Address", data.projectAddress, MARGIN, CONTENT_W);

  // Row 3: Project Manager + Point of Contact
  const savedY3 = y;
  drawField("Project Manager", data.projectManager, MARGIN, halfW);
  const afterLeft3 = y;
  y = savedY3;
  drawField("Point of Contact", data.locationContact, col2X, halfW);
  y = Math.max(afterLeft3, y);

  // Row 4: Temperature
  drawField("Temperature", data.temperature ? `${data.temperature}°F` : "", MARGIN, halfW);

  // ── TECHNICAL TEAM ────────────────────────────────────────────────────────

  if (data.personnel.length > 0) {
    drawSectionHeader("TECHNICAL TEAM");

    // Table header
    checkPageBreak(10);
    doc.setFillColor(...COLORS.medGray);
    doc.rect(MARGIN, y, CONTENT_W, 6, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    const colW = [50, 40, 40, 22];
    const colX = [MARGIN + 2, MARGIN + 52, MARGIN + 92, MARGIN + 132];
    doc.text("NAME", colX[0], y + 4);
    doc.text("COMPANY", colX[1], y + 4);
    doc.text("ROLE / TRADE", colX[2], y + 4);
    doc.text("HOURS", colX[3], y + 4);
    y += 7;

    data.personnel.forEach((p, i) => {
      checkPageBreak(7);
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.offWhite);
        doc.rect(MARGIN, y, CONTENT_W, 6, "F");
      }
      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(p.name || "—", colW[0] - 2)[0], colX[0], y + 4);
      doc.text(doc.splitTextToSize(p.company || "—", colW[1] - 2)[0], colX[1], y + 4);
      doc.text(doc.splitTextToSize(p.role || "—", colW[2] - 2)[0], colX[2], y + 4);
      doc.text(p.hoursWorked || "—", colX[3], y + 4);
      y += 6;
    });
    y += 4;
  }

  // ── WORK PERFORMED ────────────────────────────────────────────────────────

  if (data.workPerformed) {
    drawSectionHeader("WORK PERFORMED");
    drawTextArea("Description", data.workPerformed);
  }

  // ── MATERIALS USED ────────────────────────────────────────────────────────

  if (data.materialsUsed.length > 0) {
    drawSectionHeader("MATERIALS USED");

    checkPageBreak(10);
    doc.setFillColor(...COLORS.medGray);
    doc.rect(MARGIN, y, CONTENT_W, 6, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", MARGIN + 2, y + 4);
    doc.text("QTY", MARGIN + 120, y + 4);
    doc.text("UNIT", MARGIN + 145, y + 4);
    y += 7;

    data.materialsUsed.forEach((m, i) => {
      checkPageBreak(7);
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.offWhite);
        doc.rect(MARGIN, y, CONTENT_W, 6, "F");
      }
      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(m.description || "—", 115)[0], MARGIN + 2, y + 4);
      doc.text(m.quantity || "—", MARGIN + 120, y + 4);
      doc.text(m.unit || "—", MARGIN + 145, y + 4);
      y += 6;
    });
    y += 4;
  }

  // ── EQUIPMENT USED ────────────────────────────────────────────────────────

  if (data.equipmentUsed.length > 0) {
    drawSectionHeader("EQUIPMENT USED");

    checkPageBreak(10);
    doc.setFillColor(...COLORS.medGray);
    doc.rect(MARGIN, y, CONTENT_W, 6, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", MARGIN + 2, y + 4);
    doc.text("QTY", MARGIN + 120, y + 4);
    doc.text("HOURS", MARGIN + 145, y + 4);
    y += 7;

    data.equipmentUsed.forEach((e, i) => {
      checkPageBreak(7);
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.offWhite);
        doc.rect(MARGIN, y, CONTENT_W, 6, "F");
      }
      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(e.description || "—", 115)[0], MARGIN + 2, y + 4);
      doc.text(e.quantity || "—", MARGIN + 120, y + 4);
      doc.text(e.hours || "—", MARGIN + 145, y + 4);
      y += 6;
    });
    y += 4;
  }

  // ── SAFETY OBSERVATIONS ───────────────────────────────────────────────────

  if (data.safetyObservations || data.incidents || data.nearMisses) {
    drawSectionHeader("SAFETY OBSERVATIONS");
    if (data.safetyObservations) drawTextArea("Observations", data.safetyObservations);
    if (data.incidents) drawTextArea("Incidents", data.incidents);
    if (data.nearMisses) drawTextArea("Near Misses", data.nearMisses);
  }

  // ── ISSUES & DELAYS ───────────────────────────────────────────────────────

  if (data.issuesDelays) {
    drawSectionHeader("ISSUES & DELAYS");
    drawTextArea("Description", data.issuesDelays);
  }

  // ── VISITORS ─────────────────────────────────────────────────────────────

  if (data.visitors.length > 0) {
    drawSectionHeader("VISITORS");

    checkPageBreak(10);
    doc.setFillColor(...COLORS.medGray);
    doc.rect(MARGIN, y, CONTENT_W, 6, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("NAME", MARGIN + 2, y + 4);
    doc.text("COMPANY", MARGIN + 45, y + 4);
    doc.text("PURPOSE", MARGIN + 90, y + 4);
    doc.text("IN", MARGIN + 140, y + 4);
    doc.text("OUT", MARGIN + 158, y + 4);
    y += 7;

    data.visitors.forEach((v, i) => {
      checkPageBreak(7);
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.offWhite);
        doc.rect(MARGIN, y, CONTENT_W, 6, "F");
      }
      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(v.name || "—", 40)[0], MARGIN + 2, y + 4);
      doc.text(doc.splitTextToSize(v.company || "—", 42)[0], MARGIN + 45, y + 4);
      doc.text(doc.splitTextToSize(v.purpose || "—", 47)[0], MARGIN + 90, y + 4);
      doc.text(v.timeIn || "—", MARGIN + 140, y + 4);
      doc.text(v.timeOut || "—", MARGIN + 158, y + 4);
      y += 6;
    });
    y += 4;
  }

  // ── SITE PHOTOS ───────────────────────────────────────────────────────────

  if (data.sitePhotos.length > 0) {
    drawSectionHeader("SITE PHOTOS");

    const photoW = (CONTENT_W - 4) / 2;
    const photoH = 55;

    for (let i = 0; i < data.sitePhotos.length; i += 2) {
      checkPageBreak(photoH + 14);

      const photos = [data.sitePhotos[i], data.sitePhotos[i + 1]].filter(Boolean);

      for (let j = 0; j < photos.length; j++) {
        const photo = photos[j];
        const px = MARGIN + j * (photoW + 4);

        try {
          const reader = new FileReader();
          const imgData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(photo.file);
          });

          doc.addImage(imgData, "JPEG", px, y, photoW, photoH);
        } catch {
          doc.setFillColor(...COLORS.sectionBg);
          doc.rect(px, y, photoW, photoH, "F");
          doc.setTextColor(...COLORS.lightGray);
          doc.setFontSize(7);
          doc.text("Image unavailable", px + photoW / 2, y + photoH / 2, { align: "center" });
        }

        if (photo.caption) {
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(...COLORS.lightGray);
          doc.text(
            doc.splitTextToSize(photo.caption, photoW)[0],
            px,
            y + photoH + 4
          );
        }
      }

      y += photoH + 10;
    }
    y += 4;
  }

  // ── SIGNATURE (LAST) ─────────────────────────────────────────────────────

  drawSectionHeader("SIGNATURE");

  checkPageBreak(45);

  // Signatory info
  const savedYSig = y;
  drawField("Signatory Name", data.signatoryName, MARGIN, halfW);
  const afterSigLeft = y;
  y = savedYSig;
  drawField("Title", data.signatoryTitle, col2X, halfW);
  y = Math.max(afterSigLeft, y);

  // Signature image
  if (data.signatureData) {
    checkPageBreak(35);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.lightGray);
    doc.text("SIGNATURE", MARGIN, y);
    y += 3.5;
    doc.setFillColor(...COLORS.offWhite);
    doc.rect(MARGIN, y, CONTENT_W, 28, "F");
    doc.setDrawColor(...COLORS.veryLightGray);
    doc.rect(MARGIN, y, CONTENT_W, 28, "S");
    try {
      doc.addImage(data.signatureData, "PNG", MARGIN + 2, y + 2, CONTENT_W - 4, 24);
    } catch {
      // signature draw failed
    }
    y += 32;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COLORS.veryLightGray);
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.lightGray);
    doc.text(
      `SECENG Daily Field Report — Generated ${new Date().toLocaleDateString()}`,
      MARGIN,
      PAGE_H - 6
    );
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 6, { align: "right" });
  }

  const filename = `SECENG_DFR_${data.projectNumber || "DRAFT"}_${data.reportDate || "undated"}.pdf`;
  doc.save(filename);
}
