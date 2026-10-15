/**
 * PDF Styling and Design System Tokens
 * Engineered for publication-grade, light-mode technical reports.
 */

export const PDF_THEME = {
  // Page geometry (A4 standard: 210mm x 297mm)
  page: {
    format: 'a4' as const,
    unit: 'mm' as const,
    width: 210,
    height: 297,
    margin: 16, // 16mm margin
    printableWidth: 210 - 32, // 178mm
  },

  // Color Palette (RGB tuples for jsPDF)
  colors: {
    background: [255, 255, 255] as [number, number, number],
    cardBg: [248, 250, 252] as [number, number, number], // #F8FAFC slate-50
    codeBg: [241, 245, 249] as [number, number, number], // #F1F5F9 slate-100
    border: [226, 232, 240] as [number, number, number], // #E2E8F0 slate-200
    borderDark: [203, 213, 225] as [number, number, number], // #CBD5E1 slate-300

    textPrimary: [17, 24, 39] as [number, number, number], // #111827 gray-900
    textSecondary: [75, 85, 99] as [number, number, number], // #4B5563 gray-600
    textMuted: [107, 114, 128] as [number, number, number], // #6B7280 gray-500

    // Accents
    accentPrimary: [37, 99, 235] as [number, number, number], // #2563EB blue-600
    accentSecondary: [124, 58, 237] as [number, number, number], // #7C3AED violet-600
    accentLight: [238, 242, 255] as [number, number, number], // #EEF2FF indigo-50

    // Status
    success: [5, 150, 105] as [number, number, number], // #059669 emerald-600
    warning: [217, 119, 6] as [number, number, number], // #D97706 amber-600
    error: [220, 38, 38] as [number, number, number], // #DC2626 red-600
    info: [2, 132, 199] as [number, number, number], // #0284C7 sky-600
  },

  // Typography scale in points (pt)
  fonts: {
    family: 'helvetica' as const,
    mono: 'courier' as const,
    title: 22,
    h1: 14,
    h2: 11,
    h3: 10,
    body: 9,
    small: 8,
    caption: 7.5,
  },

  // Spacing in mm
  spacing: {
    sectionGap: 8,
    itemGap: 4,
    lineHeight: 4.8,
  },
};
