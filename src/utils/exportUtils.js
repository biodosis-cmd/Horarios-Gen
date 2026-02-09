import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { DIAS_SEMANA } from '@/constants';

// --- CONSTANTS ---
const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 600 minutes

// --- PDF EXPORT (Manual Drawing for Precision) ---
export const generatePDF = (scheduleData, teacherName, year) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;
    const headerHeight = 30;

    // Grid Dimensions
    const gridTop = margin + headerHeight;
    const gridHeight = pageHeight - gridTop - margin;
    const gridWidth = pageWidth - (margin * 2);

    const timeColWidth = 15;
    const dayColWidth = (gridWidth - timeColWidth) / 5;
    const rowHeightPerMin = gridHeight / TOTAL_MINUTES;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text(`Horario Año Escolar ${year}`, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    if (teacherName) {
        doc.text(`Docente: ${teacherName}`, pageWidth / 2, 30, { align: 'center' });
    }

    // --- Grid Background (Time Slots) ---
    doc.setLineWidth(0.1);
    doc.setDrawColor(200, 200, 200);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    // Draw Header Row for Days
    const daysTop = gridTop - 8;
    DIAS_SEMANA.forEach((day, i) => {
        const x = margin + timeColWidth + (i * dayColWidth);
        doc.setFillColor(245, 245, 245);
        doc.rect(x, daysTop, dayColWidth, 8, 'F');
        doc.rect(x, daysTop, dayColWidth, 8, 'S'); // border
        doc.text(day, x + (dayColWidth / 2), daysTop + 5, { align: 'center' });
    });

    // Draw Time Markers (every 60 mins)
    for (let h = START_HOUR; h <= END_HOUR; h++) {
        const minutesFromStart = (h - START_HOUR) * 60;
        const y = gridTop + (minutesFromStart * rowHeightPerMin);

        // Time Label
        doc.text(`${h.toString().padStart(2, '0')}:00`, margin + 2, y + 3);

        // Horizontal Line across entire grid
        doc.line(margin + timeColWidth, y, pageWidth - margin, y);
    }

    // Vertical Lines (Day Columns)
    for (let i = 0; i <= 5; i++) {
        const x = margin + timeColWidth + (i * dayColWidth);
        doc.line(x, gridTop, x, gridTop + gridHeight);
    }

    // --- Draw Blocks ---
    // Flatten data for easier iteration
    let allBlocks = [];
    if (scheduleData) {
        Object.entries(scheduleData).forEach(([curso, asignaturas]) => {
            Object.entries(asignaturas).forEach(([asignatura, horarios]) => {
                horarios.forEach(h => {
                    allBlocks.push({ ...h, curso, asignatura });
                });
            });
        });
    }

    doc.setFontSize(9);
    doc.setLineWidth(0.2);

    allBlocks.forEach(block => {
        const [hStart, mStart] = block.hora.split(':').map(Number);
        const startTotalMinutes = (hStart - START_HOUR) * 60 + mStart;
        const duration = block.duration || 45; // Default if missing

        // Check bounds
        if (hStart < START_HOUR || hStart >= END_HOUR) return;

        const diaIndex = block.dia - 1; // 1-based in data, 0-based for array

        // Coordinates
        const x = margin + timeColWidth + (diaIndex * dayColWidth);
        const y = gridTop + (startTotalMinutes * rowHeightPerMin);
        const w = dayColWidth;
        const h = duration * rowHeightPerMin;

        // Card Layout Calculations
        const inset = 1;
        const cardX = x + inset;
        const cardY = y + inset;
        const cardW = w - (inset * 2);
        const cardH = h - (inset * 2);

        // --- Draw Card Container ---
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(50, 50, 50);
        doc.roundedRect(cardX, cardY, cardW, cardH, 1, 1, 'FD');

        // --- Layout Logic based on Height ---
        // 45 min block is approx 12mm high.
        const isSmallBlock = cardH < 15;

        // Use very tight margins for small blocks
        const topMargin = isSmallBlock ? 1.5 : 3;
        const bottomMargin = isSmallBlock ? 1.5 : 3;
        const centerX = cardX + (cardW / 2);

        // 1. Time (Top)
        const hp = Math.round((duration / 45) * 10) / 10;
        const hpText = hp === 1 ? '1 h.p.' : `${hp} h.p.`;
        const timeText = `${block.hora} (${hpText})`;

        doc.setFont(undefined, 'normal');
        // Tiny font for small blocks
        doc.setFontSize(isSmallBlock ? 5 : 7);
        doc.setTextColor(80, 80, 80);

        // Position at top
        const timeY = cardY + topMargin + (isSmallBlock ? 1 : 1.5);
        doc.text(timeText, centerX, timeY, { align: 'center' });

        // 2. Course (Bottom)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(isSmallBlock ? 6 : 9); // Smaller font
        doc.setTextColor(0, 0, 0);

        const courseText = block.curso;
        const courseY = cardY + cardH - bottomMargin;
        doc.text(courseText, centerX, courseY, { align: 'center', maxWidth: cardW - 1 });

        // 3. Subject (Middle)
        // Calculate available vertical space
        // For small blocks: 12mm height - 1.5mm top - 1.5mm bottom = 9mm available (approx)
        // Text height 5pt ~ 1.7mm. Time + Course taking up space.
        // We effectively have the space between timeY and courseY.

        // Visual approximation of space taken:
        const timeHeightApprox = isSmallBlock ? 2 : 3;
        const courseHeightApprox = isSmallBlock ? 2 : 3;

        const middleAreaY = cardY + topMargin + timeHeightApprox;
        const middleAreaEndY = cardY + cardH - bottomMargin - courseHeightApprox;
        const middleAreaH = middleAreaEndY - middleAreaY;
        const middleCenterY = middleAreaY + (middleAreaH / 2);

        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);

        // Dynamic Font Sizing for Subject
        let subjectFontSize = 10;
        if (cardH < 25) subjectFontSize = 9;
        if (cardH < 15) subjectFontSize = 7; // Small but readable check

        doc.setFontSize(subjectFontSize);

        const subjectText = block.asignatura;
        const usableWidth = cardW - 1;

        // Always try to draw subject
        const textLines = doc.splitTextToSize(subjectText, usableWidth);
        const lineHeight = subjectFontSize * 0.3527 * 1.1;
        const totalTextH = textLines.length * lineHeight;

        // If it still doesn't fit, shrink more
        if (isSmallBlock && totalTextH > middleAreaH) {
            doc.setFontSize(5); // Minimum readable
            // Recalculate height
            const newTotalTextH = textLines.length * (5 * 0.3527 * 1.1);
            const textY = middleCenterY - (newTotalTextH / 2) + (5 * 0.3527 * 1.1 / 1.5);
            doc.text(textLines, centerX, textY, { align: 'center' });
        } else {
            // Standard centering
            const textY = middleCenterY - (totalTextH / 2) + (lineHeight / 1.5);
            doc.text(textLines, centerX, textY, { align: 'center' });
        }
    });

    doc.save(`Horario_${year}_${teacherName || 'Docente'}.pdf`);
};

// --- CREATIVE PDF EXPORT (Elegant Slate) ---
const getCourseColor = (curso) => {
    // UNUSED IN ELEGANT MODE but kept for reference or future fallback
    const colors = {
        'NT1': [244, 63, 94], // Rose-500
        'NT2': [217, 70, 239], // Fuchsia-500
        // ...
    };
    return [51, 65, 85]; // Default Slate-700
};

export const generateCreativePDF = (scheduleData, teacherName, year) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;
    const headerHeight = 35; // Taller header for style

    // Grid Dimensions
    const gridTop = margin + headerHeight;
    const gridHeight = pageHeight - gridTop - margin;
    const gridWidth = pageWidth - (margin * 2);

    // Custom Dimensions
    const timeColWidth = 12; // Narrower
    const dayColWidth = (gridWidth - timeColWidth) / 5;
    const rowHeightPerMin = gridHeight / TOTAL_MINUTES;

    // --- Modern Background ---
    doc.setFillColor(248, 250, 252); // Slate-50 (Very light gray bg)
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // --- Header (Elegant Dark) ---
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Accent Line
    doc.setDrawColor(99, 102, 241); // Indigo-500
    doc.setLineWidth(1);
    doc.line(0, headerHeight, pageWidth, headerHeight);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text(`HORARIO ${year}`, margin, 22);

    // Teacher Name (Right aligned)
    if (teacherName) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(16);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(teacherName.toUpperCase(), pageWidth - margin, 22, { align: 'right' });
    }

    // --- Grid Structure (Minimalist) ---
    // Day Headers
    const daysTop = gridTop - 12;
    DIAS_SEMANA.forEach((day, i) => {
        const x = margin + timeColWidth + (i * dayColWidth);
        const centerX = x + (dayColWidth / 2);

        // Pill shape for day
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.roundedRect(x + 2, daysTop, dayColWidth - 4, 10, 3, 3, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85); // Slate-700
        doc.text(day.toUpperCase(), centerX, daysTop + 6.5, { align: 'center' });
    });

    // Time Column (Minimalist)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400

    for (let h = START_HOUR; h <= END_HOUR; h++) {
        const minutesFromStart = (h - START_HOUR) * 60;
        const y = gridTop + (minutesFromStart * rowHeightPerMin);

        doc.text(`${h}:00`, margin + 2, y + 3);

        // Faint grid lines
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setLineWidth(0.1);
        doc.line(margin + timeColWidth, y, pageWidth - margin, y);
    }

    // Vertical dividers
    for (let i = 0; i <= 5; i++) {
        const x = margin + timeColWidth + (i * dayColWidth);
        doc.line(x, gridTop, x, gridTop + gridHeight);
    }

    // --- Draw Blocks (ELEGANT & SOBER) ---
    let allBlocks = [];
    if (scheduleData) {
        Object.entries(scheduleData).forEach(([curso, asignaturas]) => {
            Object.entries(asignaturas).forEach(([asignatura, horarios]) => {
                horarios.forEach(h => {
                    allBlocks.push({ ...h, curso, asignatura });
                });
            });
        });
    }

    allBlocks.forEach(block => {
        const [hStart, mStart] = block.hora.split(':').map(Number);
        const startTotalMinutes = (hStart - START_HOUR) * 60 + mStart;
        const duration = block.duration || 45;

        if (hStart < START_HOUR || hStart >= END_HOUR) return;

        const diaIndex = block.dia - 1;
        const x = margin + timeColWidth + (diaIndex * dayColWidth);
        const y = gridTop + (startTotalMinutes * rowHeightPerMin);
        const w = dayColWidth;
        const h = duration * rowHeightPerMin;

        // Card Dimensions
        const inset = 1;
        const cardX = x + inset;
        const cardY = y + inset;
        const cardW = w - (inset * 2);
        const cardH = h - (inset * 2);

        // Elegant Color (Sober & Elegant - Deep Slate/Charcoal)
        const r = 51, g = 65, b = 85; // Slate-700 #334155

        // Main Card Body (Sober)
        doc.setFillColor(r, g, b);
        doc.setDrawColor(r, g, b);
        doc.roundedRect(cardX, cardY, cardW, cardH, 1, 1, 'FD');

        // Text Color: White
        doc.setTextColor(255, 255, 255);

        const centerX = cardX + (cardW / 2);
        const safeW = cardW - 2;

        // --- Layout ---

        // 1. Start Time (Tiny, Top Left)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text(block.hora, cardX + 2, cardY + 3);

        // 2. Course (Tiny, Top Right - Same size/style as Time)
        doc.text(block.curso, cardX + cardW - 2, cardY + 3, { align: 'right' });

        // 3. Subject (Center, Large)
        // Determine font size based on height
        let subjectSize = 10;
        if (cardH < 25) subjectSize = 9;
        if (cardH < 15) subjectSize = 8; // Small block

        doc.setFontSize(subjectSize);
        doc.setFont("helvetica", "bold");

        // Split text
        const textLines = doc.splitTextToSize(block.asignatura, safeW);
        const lineHeight = subjectSize * 0.3527 * 1.1;
        const blockH = textLines.length * lineHeight;

        // Center vertically in the entire card area
        const cardCenterY = cardY + (cardH / 2);

        // Default: Centered
        let textY = cardCenterY - (blockH / 2) + (lineHeight / 1.5);

        // For small blocks (45 mins approx 12-13mm), align BOTTOM to avoid header overlap
        if (cardH < 15) {
            // Target Y: Bottom of card - Padding - TextHeight
            // Text Y in pdf is baseline. So we need (Bottom - Padding) - TextHeight + LineHeight
            const bottomPadding = 2; // tight padding
            // Calculate starting Y position
            textY = (cardY + cardH - bottomPadding) - blockH + lineHeight;

            // Safety Clamp: Don't go higher than y+4 (Header area)
            if (textY < cardY + 5) {
                textY = cardY + 5;
                // If it still overflows bottom, it will just overflow, better than hitting header
            }
        }

        // Safety check to ensure text fits
        if (cardH < 15) {
            if (blockH > (cardH - 5)) {
                doc.setFontSize(6); // Emergency shrink
                const shrinkLineHeight = 6 * 0.3527 * 1.1;
                const shrinkBlockH = textLines.length * shrinkLineHeight;
                textY = cardCenterY - (shrinkBlockH / 2) + (shrinkLineHeight / 1.5);
            }
        }

        doc.text(textLines, centerX, textY, { align: 'center' });
    });

    doc.save(`Horario_Creativo_${year}_${teacherName || 'Docente'}.pdf`);
};
