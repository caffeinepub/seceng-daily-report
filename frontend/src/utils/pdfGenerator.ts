export interface ReportData {
    checkInDateTime: string;   // ISO string from punch button
    checkOutDateTime: string;  // ISO string from punch button
    closeOutReport: string;
    projectManager: string;
    locationContact: string;
    leadTechnician: string;
    helper: string;
    jobCode?: string;
    customerName?: string;
    jobLocation?: string;
    jobType: string;
    jobDescription: string;
    completionStatus: string;
    beforeImage?: string;
    afterImage?: string;
}

// jsPDF is loaded via CDN script tag in index.html
declare const window: Window & {
    jspdf: {
        jsPDF: new (options?: {
            orientation?: string;
            unit?: string;
            format?: string | number[];
        }) => JsPDFInstance;
    };
};

interface JsPDFInstance {
    internal: {
        pageSize: { getWidth: () => number; getHeight: () => number };
        getNumberOfPages: () => number;
    };
    setFillColor: (r: number, g: number, b: number) => void;
    setDrawColor: (r: number, g: number, b: number) => void;
    setTextColor: (r: number, g: number, b: number) => void;
    setFont: (fontName: string, fontStyle: string) => void;
    setFontSize: (size: number) => void;
    setLineWidth: (width: number) => void;
    setGState: (gState: unknown) => void;
    GState: new (params: { opacity?: number; 'fill-opacity'?: number }) => unknown;
    rect: (x: number, y: number, w: number, h: number, style?: string) => void;
    roundedRect: (x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string) => void;
    triangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style?: string) => void;
    text: (text: string | string[], x: number, y: number, options?: { align?: string }) => void;
    splitTextToSize: (text: string, maxWidth: number) => string[];
    line: (x1: number, y1: number, x2: number, y2: number) => void;
    addImage: (
        imageData: string,
        format: string,
        x: number,
        y: number,
        width: number,
        height: number,
        alias?: string,
        compression?: string,
        rotation?: number
    ) => void;
    addPage: () => void;
    save: (filename: string) => void;
}

function formatDateTime(isoStr: string): string {
    if (!isoStr) return '—';
    try {
        const d = new Date(isoStr);
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch {
        return isoStr;
    }
}

function extractDateOnly(isoStr: string): string {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    } catch {
        return '';
    }
}

/** Returns the natural pixel dimensions of an image from a base64 data URL. */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 1, height: 1 });
        img.src = dataUrl;
    });
}

/** Extracts the jsPDF-compatible format string from a base64 data URL. */
function getImageFormat(dataUrl: string): string {
    if (dataUrl.startsWith('data:image/png')) return 'PNG';
    if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
    return 'JPEG';
}

export async function generateReportPDF(data: ReportData): Promise<void> {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    // ── Color Palette ────────────────────────────────────────────────────────
    const blackR = 10,    blackG = 10,    blackB = 10;
    const darkR  = 28,    darkG  = 28,    darkB  = 28;
    const whiteR = 255,   whiteG = 255,   whiteB = 255;
    const lightBgR = 248, lightBgG = 248, lightBgB = 248;
    const labelR = 110,   labelG = 110,   labelB = 110;
    const valueR = 18,    valueG = 18,    valueB = 18;
    const borderR = 215,  borderG = 215,  borderB = 215;
    const mutedR  = 150,  mutedG  = 150,  mutedB  = 150;
    const accentR = 30,   accentG = 60,   accentB = 120;  // navy blue accent

    // ── Shared helpers ────────────────────────────────────────────────────────
    const drawPageBackground = () => {
        doc.setFillColor(lightBgR, lightBgG, lightBgB);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    const drawFooter = (pageLabel: string) => {
        const footerY = pageHeight - 14;
        doc.setFillColor(accentR, accentG, accentB);
        doc.rect(0, footerY - 4, pageWidth, 1.5, 'F');
        doc.setFillColor(blackR, blackG, blackB);
        doc.rect(0, footerY - 2.5, pageWidth, 16.5, 'F');
        doc.setTextColor(mutedR, mutedG, mutedB);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('SECURITY ENGINEERING INC.  ·  Est. 1975  ·  Confidential Field Report', margin, footerY + 5);
        doc.text(pageLabel, pageWidth - margin, footerY + 5, { align: 'right' });
    };

    const drawSectionHeader = (title: string, y: number): number => {
        doc.setFillColor(accentR, accentG, accentB);
        doc.rect(margin, y, 3, 9, 'F');
        doc.setFillColor(darkR, darkG, darkB);
        doc.rect(margin + 3, y, contentWidth - 3, 9, 'F');
        doc.setTextColor(whiteR, whiteG, whiteB);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(title.toUpperCase(), margin + 8, y + 6);
        return y + 9;
    };

    const drawField = (label: string, value: string, x: number, y: number, w: number): void => {
        doc.setFillColor(whiteR, whiteG, whiteB);
        doc.roundedRect(x, y, w, 14, 1.5, 1.5, 'F');
        doc.setDrawColor(borderR, borderG, borderB);
        doc.setLineWidth(0.25);
        doc.roundedRect(x, y, w, 14, 1.5, 1.5, 'S');
        doc.setTextColor(labelR, labelG, labelB);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(label.toUpperCase(), x + 3.5, y + 5.2);
        doc.setTextColor(valueR, valueG, valueB);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const displayValue = value.trim() || '—';
        doc.text(displayValue, x + 3.5, y + 11.2);
    };

    const drawTextAreaField = (label: string, value: string, x: number, y: number, w: number, h: number): void => {
        doc.setFillColor(whiteR, whiteG, whiteB);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
        doc.setDrawColor(borderR, borderG, borderB);
        doc.setLineWidth(0.25);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S');
        doc.setTextColor(labelR, labelG, labelB);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(label.toUpperCase(), x + 3.5, y + 5.2);
        doc.setTextColor(valueR, valueG, valueB);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const displayValue = value.trim() || '—';
        const lines = doc.splitTextToSize(displayValue, w - 7);
        doc.text(lines, x + 3.5, y + 11.5);
    };

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 1
    // ════════════════════════════════════════════════════════════════════════
    drawPageBackground();

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(blackR, blackG, blackB);
    doc.rect(0, 0, pageWidth, 52, 'F');
    doc.setFillColor(accentR, accentG, accentB);
    doc.rect(0, 0, pageWidth, 3, 'F');
    doc.setFillColor(whiteR, whiteG, whiteB);
    doc.rect(0, 52, pageWidth, 1.5, 'F');

    const textStartX = margin;
    doc.setTextColor(whiteR, whiteG, whiteB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SECURITY ENGINEERING INC.', textStartX, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(mutedR, mutedG, mutedB);
    doc.text('DAILY FIELD REPORT', textStartX, 31);

    doc.setDrawColor(accentR, accentG, accentB);
    doc.setLineWidth(0.5);
    doc.line(textStartX, 34.5, textStartX + 60, 34.5);

    doc.setTextColor(mutedR, mutedG, mutedB);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Est. 1975  ·  Professional Security Solutions', textStartX, 42);

    const reportDate = new Date().toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    doc.setTextColor(mutedR, mutedG, mutedB);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${reportDate}`, pageWidth - margin, 22, { align: 'right' });

    const reportDateStr = extractDateOnly(data.checkInDateTime) || new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const reportId = `RPT-${reportDateStr}`;
    doc.setFontSize(7);
    doc.text(`Report ID: ${reportId}`, pageWidth - margin, 30, { align: 'right' });

    // ── Content ───────────────────────────────────────────────────────────────
    let yPos = 62;
    const halfW = (contentWidth - 5) / 2;
    const thirdW = (contentWidth - 10) / 3;

    // Section 1: Time & Attendance
    yPos = drawSectionHeader('Time & Attendance', yPos);
    yPos += 4;

    drawField('Check-In', formatDateTime(data.checkInDateTime), margin, yPos, halfW);
    drawField('Check-Out', formatDateTime(data.checkOutDateTime), margin + halfW + 5, yPos, halfW);
    yPos += 18;

    if (data.checkInDateTime && data.checkOutDateTime) {
        try {
            const inDt = new Date(data.checkInDateTime);
            const outDt = new Date(data.checkOutDateTime);
            const diffMs = outDt.getTime() - inDt.getTime();
            if (diffMs > 0) {
                const hours = Math.floor(diffMs / 3600000);
                const minutes = Math.floor((diffMs % 3600000) / 60000);
                const durationStr = `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min`;
                doc.setFillColor(accentR, accentG, accentB);
                doc.roundedRect(margin, yPos, contentWidth, 10.5, 1.5, 1.5, 'F');
                doc.setTextColor(whiteR, whiteG, whiteB);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.text('TOTAL DURATION ON SITE', margin + 4, yPos + 4.8);
                doc.setFontSize(9.5);
                doc.text(durationStr, pageWidth - margin - 4, yPos + 7, { align: 'right' });
                yPos += 14.5;
            }
        } catch { /* skip */ }
    }

    yPos += 5;

    // Section 2: Personnel
    yPos = drawSectionHeader('Personnel', yPos);
    yPos += 4;

    drawField('Project Manager', data.projectManager || '—', margin, yPos, halfW);
    drawField('Location Contact', data.locationContact || '—', margin + halfW + 5, yPos, halfW);
    yPos += 18;

    drawField('Lead Technician', data.leadTechnician || '—', margin, yPos, halfW);
    drawField('Helper / Assistant', data.helper || '—', margin + halfW + 5, yPos, halfW);
    yPos += 18;

    yPos += 5;

    // Section 3: Job Details
    yPos = drawSectionHeader('Job Details', yPos);
    yPos += 4;

    drawField('Job Code', data.jobCode || '—', margin, yPos, thirdW);
    drawField('Customer Name', data.customerName || '—', margin + thirdW + 5, yPos, thirdW);
    drawField('Job Location', data.jobLocation || '—', margin + (thirdW + 5) * 2, yPos, thirdW);
    yPos += 18;

    drawField('Job Type / Category', data.jobType || '—', margin, yPos, contentWidth);
    yPos += 18;

    const isComplete = data.completionStatus === 'Fully Complete';
    if (isComplete) {
        doc.setFillColor(accentR, accentG, accentB);
    } else {
        doc.setFillColor(darkR, darkG, darkB);
    }
    doc.roundedRect(margin, yPos, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(borderR, borderG, borderB);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, yPos, contentWidth, 14, 1.5, 1.5, 'S');
    doc.setTextColor(mutedR, mutedG, mutedB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('COMPLETION STATUS', margin + 3.5, yPos + 5.2);
    doc.setTextColor(whiteR, whiteG, whiteB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(data.completionStatus || 'Fully Complete', margin + 3.5, yPos + 11.2);
    const statusLabel = isComplete ? '✓ COMPLETE' : '○ FOLLOW-UP REQUIRED';
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(statusLabel, pageWidth - margin - 3.5, yPos + 8.5, { align: 'right' });
    yPos += 18;

    const jobDescH = Math.max(32, Math.min(55, 32 + Math.ceil(data.jobDescription.length / 80) * 5));
    drawTextAreaField('Job Description', data.jobDescription, margin, yPos, contentWidth, jobDescH);
    yPos += jobDescH + 5;

    yPos += 4;

    // Section 4: Close Out Report
    yPos = drawSectionHeader('Close Out Report', yPos);
    yPos += 4;

    const remainingHeight = pageHeight - yPos - 24;
    const textAreaH = Math.max(38, Math.min(remainingHeight, 65));
    drawTextAreaField('Summary / Notes', data.closeOutReport, margin, yPos, contentWidth, textAreaH);

    // Determine total pages for footer
    const hasPhotos = !!(data.beforeImage || data.afterImage);
    const totalPages = hasPhotos ? 2 : 1;

    // Draw footer on page 1
    drawFooter(`Page 1 of ${totalPages}`);

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 2 — Site Photos (only if photos provided)
    // ════════════════════════════════════════════════════════════════════════
    if (hasPhotos) {
        doc.addPage();
        drawPageBackground();

        // Compact header band for continuation page
        doc.setFillColor(blackR, blackG, blackB);
        doc.rect(0, 0, pageWidth, 22, 'F');
        doc.setFillColor(accentR, accentG, accentB);
        doc.rect(0, 0, pageWidth, 3, 'F');
        doc.setFillColor(whiteR, whiteG, whiteB);
        doc.rect(0, 22, pageWidth, 1, 'F');

        doc.setTextColor(whiteR, whiteG, whiteB);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('SECURITY ENGINEERING INC.', margin, 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(mutedR, mutedG, mutedB);
        doc.text('DAILY FIELD REPORT — SITE PHOTOS', pageWidth - margin, 14, { align: 'right' });

        let photoY = 32;
        photoY = drawSectionHeader('Site Photos', photoY);
        photoY += 7;

        const photoEntries: Array<{ label: string; dataUrl: string }> = [];
        if (data.beforeImage) photoEntries.push({ label: 'Before', dataUrl: data.beforeImage });
        if (data.afterImage) photoEntries.push({ label: 'After', dataUrl: data.afterImage });

        for (const photo of photoEntries) {
            const dims = await getImageDimensions(photo.dataUrl);
            const aspectRatio = dims.width / dims.height;

            const maxImgW = contentWidth;
            const maxImgH = 85;
            let imgW = maxImgW;
            let imgH = imgW / aspectRatio;
            if (imgH > maxImgH) {
                imgH = maxImgH;
                imgW = imgH * aspectRatio;
            }

            doc.setTextColor(labelR, labelG, labelB);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text(photo.label.toUpperCase(), margin, photoY + 4);
            doc.setDrawColor(accentR, accentG, accentB);
            doc.setLineWidth(0.5);
            doc.line(margin, photoY + 5.8, margin + 22, photoY + 5.8);

            photoY += 10;

            doc.setFillColor(whiteR, whiteG, whiteB);
            doc.setDrawColor(borderR, borderG, borderB);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, photoY, imgW, imgH, 2, 2, 'FD');

            const fmt = getImageFormat(photo.dataUrl);
            doc.addImage(photo.dataUrl, fmt, margin, photoY, imgW, imgH);

            photoY += imgH + 14;
        }

        drawFooter('Page 2 of 2');
    }

    // ── Save ─────────────────────────────────────────────────────────────────
    const dateStr = extractDateOnly(data.checkInDateTime) || new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`SECENG_Daily_Report_${dateStr}.pdf`);
}
