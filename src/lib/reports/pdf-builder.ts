import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  EngineeringDecisionReport,
  ReportSectionSelection,
  DEFAULT_SECTION_SELECTION,
} from '@/types/report';
import { PDF_THEME } from './pdf-theme';

export interface BuildPdfOptions {
  customTitle?: string;
  sections?: Partial<ReportSectionSelection>;
}

/**
 * Sanitize arbitrary repository text to prevent raw control characters
 * from breaking PDF rendering.
 */
function sanitizeText(input?: string): string {
  if (!input) return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

/**
 * Main PDF Builder class for engineering decision reports.
 */
export class ReportPdfBuilder {
  private doc: jsPDF;
  private report: EngineeringDecisionReport;
  private sections: ReportSectionSelection;
  private currentY: number;
  private title: string;

  constructor(report: EngineeringDecisionReport, options: BuildPdfOptions = {}) {
    this.report = report;
    this.title = sanitizeText(options.customTitle) || sanitizeText(report.title) || 'Engineering Decision Report';
    this.sections = { ...DEFAULT_SECTION_SELECTION, ...(options.sections || {}) };

    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: PDF_THEME.page.unit,
      format: PDF_THEME.page.format,
      compress: true,
    });

    this.currentY = PDF_THEME.page.margin;
  }

  /**
   * Generates the complete PDF and returns it as a Uint8Array buffer.
   */
  public generate(): Uint8Array {
    this.renderCoverHeader();

    if (this.sections.includeExecutiveSummary && this.report.executiveSummary) {
      this.renderExecutiveSummary();
    }

    if (this.sections.includeProposedChange && this.report.proposedChange) {
      this.renderProposedChange();
    }

    if (this.sections.includeFindings && this.report.findings?.length > 0) {
      this.renderFindings();
    }

    if (this.sections.includeArchitectureContext && this.report.architectureContext) {
      this.renderArchitectureContext();
    }

    if (this.sections.includeImpactAnalysis && this.report.impactAnalysis) {
      this.renderImpactAnalysis();
    }

    if (this.sections.includeDecisionTimeline && this.report.decisionTimeline && this.report.decisionTimeline.length > 0) {
      this.renderDecisionTimeline();
    }

    if (this.sections.includeKnowledgeGaps && this.report.knowledgeGaps) {
      this.renderKnowledgeGaps();
    }

    if (this.sections.includeEvidenceReferences && this.report.evidence?.length > 0) {
      this.renderEvidenceReferences();
    }

    if (this.sections.includeUncertainties && this.report.uncertainties && this.report.uncertainties.length > 0) {
      this.renderUncertainties();
    }

    if (this.sections.includeLimitationsAndNextSteps && this.report.limitations) {
      this.renderLimitationsAndNextSteps();
    }

    // Apply two-pass headers and footers with accurate total page count
    this.renderHeadersAndFooters();

    const arrayBuffer = this.doc.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }

  // ---------------------------------------------------------------------------
  // Geometry & Page Break Management
  // ---------------------------------------------------------------------------

  private ensureSpace(requiredMm: number) {
    const bottomLimit = PDF_THEME.page.height - PDF_THEME.page.margin - 12; // preserve footer margin
    if (this.currentY + requiredMm > bottomLimit) {
      this.doc.addPage();
      this.currentY = PDF_THEME.page.margin + 10; // preserve header space
    }
  }

  private renderSectionHeading(numberStr: string, title: string) {
    this.ensureSpace(18);
    this.currentY += 4;

    // Small accent rectangle on left
    this.doc.setFillColor(...PDF_THEME.colors.accentPrimary);
    this.doc.rect(PDF_THEME.page.margin, this.currentY, 2.5, 6.5, 'F');

    // Section title text
    this.doc.setFont(PDF_THEME.fonts.family, 'bold');
    this.doc.setFontSize(PDF_THEME.fonts.h1);
    this.doc.setTextColor(...PDF_THEME.colors.textPrimary);
    this.doc.text(
      `${numberStr}. ${title}`.toUpperCase(),
      PDF_THEME.page.margin + 5,
      this.currentY + 5.2
    );

    this.currentY += 9;
  }

  // ---------------------------------------------------------------------------
  // 1. Cover / Top Header & Metadata
  // ---------------------------------------------------------------------------

  private renderCoverHeader() {
    const margin = PDF_THEME.page.margin;
    const printableW = PDF_THEME.page.printableWidth;

    // Top banner card background
    this.doc.setFillColor(...PDF_THEME.colors.cardBg);
    this.doc.setDrawColor(...PDF_THEME.colors.border);
    this.doc.roundedRect(margin, this.currentY, printableW, 36, 2, 2, 'FD');

    // Brand tag
    this.doc.setFont(PDF_THEME.fonts.family, 'bold');
    this.doc.setFontSize(PDF_THEME.fonts.caption);
    this.doc.setTextColor(...PDF_THEME.colors.accentPrimary);
    this.doc.text('CODEWHY — ENGINEERING DECISION INTELLIGENCE REPORT', margin + 4, this.currentY + 6);

    // Title
    this.doc.setFont(PDF_THEME.fonts.family, 'bold');
    this.doc.setFontSize(PDF_THEME.fonts.title);
    this.doc.setTextColor(...PDF_THEME.colors.textPrimary);
    
    // Wrap title if needed
    const wrappedTitle = this.doc.splitTextToSize(this.title, printableW - 8);
    this.doc.text(wrappedTitle, margin + 4, this.currentY + 14);

    // Metadata line (Generation Date, Author, Confidence Level)
    const dateFormatted = new Date(this.report.generatedAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const metaParts = [`Generated: ${dateFormatted}`];
    if (this.report.author) metaParts.push(`Auditor: ${sanitizeText(this.report.author)}`);
    if (this.report.version) metaParts.push(`Version: ${sanitizeText(this.report.version)}`);
    metaParts.push(`Confidence: ${(this.report.confidence?.level || 'high').toUpperCase()}`);

    this.doc.setFont(PDF_THEME.fonts.family, 'normal');
    this.doc.setFontSize(PDF_THEME.fonts.small);
    this.doc.setTextColor(...PDF_THEME.colors.textMuted);
    this.doc.text(metaParts.join('   |   '), margin + 4, this.currentY + 23);

    // Repository Context Strip
    const repo = this.report.repository;
    const repoParts: string[] = [`Repository: ${repo.repoName || repo.repoId}`];
    if (repo.analyzedBranch) repoParts.push(`Branch: ${repo.analyzedBranch}`);
    if (repo.analyzedCommit) repoParts.push(`Commit: ${repo.analyzedCommit.slice(0, 10)}`);
    if (repo.primaryLanguage) repoParts.push(`Language: ${repo.primaryLanguage}`);

    this.doc.setFont(PDF_THEME.fonts.mono, 'bold');
    this.doc.setFontSize(PDF_THEME.fonts.small);
    this.doc.setTextColor(...PDF_THEME.colors.accentSecondary);
    this.doc.text(repoParts.join('   |   '), margin + 4, this.currentY + 30);

    // Clickable repository link if available
    if (repo.repoUrl) {
      const linkText = `View on Remote ->`;
      this.doc.setFont(PDF_THEME.fonts.family, 'bold');
      this.doc.setTextColor(...PDF_THEME.colors.accentPrimary);
      this.doc.textWithLink(linkText, margin + printableW - 32, this.currentY + 30, { url: repo.repoUrl });
    }

    this.currentY += 41;
  }

  // ---------------------------------------------------------------------------
  // 2. Executive Summary
  // ---------------------------------------------------------------------------

  private renderExecutiveSummary() {
    this.renderSectionHeading('1', 'Executive Summary');
    const margin = PDF_THEME.page.margin;
    const printableW = PDF_THEME.page.printableWidth;
    const summary = this.report.executiveSummary;

    // Headline callout box
    this.doc.setFillColor(...PDF_THEME.colors.cardBg);
    this.doc.setDrawColor(...PDF_THEME.colors.borderDark);
    
    const headlineLines = this.doc.splitTextToSize(sanitizeText(summary.headline), printableW - 12);
    const boxHeight = Math.max(14, headlineLines.length * 4.5 + 6);

    this.doc.roundedRect(margin, this.currentY, printableW, boxHeight, 1.5, 1.5, 'FD');

    // Risk badge indicator on left
    const riskColors = {
      low: PDF_THEME.colors.success,
      moderate: PDF_THEME.colors.info,
      elevated: PDF_THEME.colors.warning,
      critical: PDF_THEME.colors.error,
    }[summary.riskAssessmentLevel || 'moderate'];

    this.doc.setFillColor(...riskColors);
    this.doc.rect(margin, this.currentY, 3, boxHeight, 'F');

    this.doc.setFont(PDF_THEME.fonts.family, 'bold');
    this.doc.setFontSize(PDF_THEME.fonts.h3);
    this.doc.setTextColor(...PDF_THEME.colors.textPrimary);
    this.doc.text(headlineLines, margin + 6, this.currentY + 5.5);

    this.currentY += boxHeight + 4;

    // Detailed overview paragraph
    this.doc.setFont(PDF_THEME.fonts.family, 'normal');
    this.doc.setFontSize(PDF_THEME.fonts.body);
    this.doc.setTextColor(...PDF_THEME.colors.textSecondary);
    const overviewLines = this.doc.splitTextToSize(sanitizeText(summary.overview), printableW);
    this.doc.text(overviewLines, margin, this.currentY);
    this.currentY += overviewLines.length * PDF_THEME.spacing.lineHeight + 3;

    // Critical takeaways bullets
    if (summary.criticalTakeaways && summary.criticalTakeaways.length > 0) {
      this.ensureSpace(summary.criticalTakeaways.length * 6);
      this.doc.setFont(PDF_THEME.fonts.family, 'bold');
      this.doc.setFontSize(PDF_THEME.fonts.small);
      this.doc.setTextColor(...PDF_THEME.colors.textPrimary);
      this.doc.text('Key Strategic Takeaways:', margin, this.currentY);
      this.currentY += 4.5;

      this.doc.setFont(PDF_THEME.fonts.family, 'normal');
      this.doc.setFontSize(PDF_THEME.fonts.body);
      this.doc.setTextColor(...PDF_THEME.colors.textSecondary);

      for (const item of summary.criticalTakeaways) {
        const itemLines = this.doc.splitTextToSize(`- ${sanitizeText(item)}`, printableW - 4);
        this.doc.text(itemLines, margin + 2, this.currentY);
        this.currentY += itemLines.length * 4.2 + 1;
      }
      this.currentY += 2;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Original Engineering Question or Proposed Change
  // ---------------------------------------------------------------------------

  private renderProposedChange() {
    this.renderSectionHeading('2', 'Engineering Problem Statement & Scope');
    const margin = PDF_THEME.page.margin;
    const printableW = PDF_THEME.page.printableWidth;
    const change = this.report.proposedChange;

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: {
        fontSize: PDF_THEME.fonts.body,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: PDF_THEME.colors.textPrimary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold', textColor: PDF_THEME.colors.textSecondary },
        1: { cellWidth: 'auto', textColor: PDF_THEME.colors.textPrimary },
      },
      body: [
        ['Target Component', change.targetSymbolOrFile || 'Unspecified'],
        ['Change Category', (change.changeCategory || 'Standard Refactor').replace(/_/g, ' ').toUpperCase()],
        ['Inquiry / Description', sanitizeText(change.questionOrDescription)],
        ...(change.rationale ? [['Architecture Rationale', sanitizeText(change.rationale)]] : []),
      ],
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
  }

  // ---------------------------------------------------------------------------
  // 4. Findings and Reasoning Summary
  // ---------------------------------------------------------------------------

  private renderFindings() {
    this.renderSectionHeading('3', 'Audited Findings & Architectural Reasoning');
    const margin = PDF_THEME.page.margin;

    const tableRows = this.report.findings.map(f => [
      f.severity.toUpperCase(),
      f.category.replace(/_/g, ' '),
      f.title,
      sanitizeText(f.explanation),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        overflow: 'linebreak',
        lineColor: PDF_THEME.colors.border,
      },
      head: [['Severity', 'Category', 'Finding Title', 'Reasoning & Grounding']],
      body: tableRows,
      headStyles: {
        fillColor: PDF_THEME.colors.textPrimary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 32, textColor: PDF_THEME.colors.textSecondary },
        2: { cellWidth: 44, fontStyle: 'bold' },
        3: { cellWidth: 'auto', textColor: PDF_THEME.colors.textSecondary },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const val = String(data.cell.raw).toLowerCase();
          if (val === 'critical') data.cell.styles.textColor = PDF_THEME.colors.error;
          else if (val === 'high') data.cell.styles.textColor = PDF_THEME.colors.warning;
          else if (val === 'medium') data.cell.styles.textColor = PDF_THEME.colors.accentPrimary;
          else data.cell.styles.textColor = PDF_THEME.colors.textMuted;
        }
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
  }

  // ---------------------------------------------------------------------------
  // 5. Architecture and Dependency Context
  // ---------------------------------------------------------------------------

  private renderArchitectureContext() {
    const arch = this.report.architectureContext!;
    this.renderSectionHeading('4', 'Architecture & Dependency Context');
    const margin = PDF_THEME.page.margin;

    const summaryItems = [
      ['Focal Component', `${arch.focalNode.label} (${arch.focalNode.filePath})`],
      ['Direct Callers (1-Hop)', String(arch.directCallersCount || 0)],
      ['Transitive Consumers', String(arch.transitiveConsumersCount || 0)],
      ['Connected Graph Nodes', String(arch.connectedNodes?.length || 0)],
      ['Total AST Edges Traced', String(arch.edges?.length || 0)],
      ['Architectural Role', sanitizeText(arch.architecturalRoleDescription)],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 48, fontStyle: 'bold', textColor: PDF_THEME.colors.textSecondary },
        1: { cellWidth: 'auto', textColor: PDF_THEME.colors.textPrimary },
      },
      body: summaryItems,
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 4;

    // Table of top connected nodes
    if (arch.connectedNodes && arch.connectedNodes.length > 0) {
      const topNodes = arch.connectedNodes.slice(0, 10).map(n => [
        n.label,
        n.type.toUpperCase(),
        n.filePath,
        sanitizeText(n.description || 'Exported symbol or component module'),
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: PDF_THEME.colors.border },
        head: [['Connected Symbol', 'Type', 'File Path', 'Description']],
        body: topNodes,
        headStyles: { fillColor: PDF_THEME.colors.borderDark, textColor: PDF_THEME.colors.textPrimary, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 20 },
          2: { cellWidth: 50, font: 'courier' },
          3: { cellWidth: 'auto', textColor: PDF_THEME.colors.textSecondary },
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Impact Analysis (if available)
  // ---------------------------------------------------------------------------

  private renderImpactAnalysis() {
    const impact = this.report.impactAnalysis!;
    this.renderSectionHeading('5', 'Pre-Change Blast Radius & Downstream Impact');
    const margin = PDF_THEME.page.margin;

    // Metrics grid
    const metrics = impact.summary;
    const metricsRow = [
      ['Total Affected', String(metrics.totalAffected)],
      ['Direct Dependents', String(metrics.directCount)],
      ['Transitive Consumers', String(metrics.transitiveCount)],
      ['Unit/E2E Tests', String(metrics.testCount)],
      ['Config Schemas', String(metrics.configCount)],
      ['Historical Co-Changes', String(metrics.coChangeCount)],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, halign: 'center', lineColor: PDF_THEME.colors.border },
      headStyles: { fillColor: PDF_THEME.colors.accentLight, textColor: PDF_THEME.colors.accentPrimary, fontStyle: 'bold' },
      head: [metricsRow.map(m => m[0])],
      body: [metricsRow.map(m => m[1])],
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 4;

    // High Severity Potential Risks
    if (impact.potentialRisks && impact.potentialRisks.length > 0) {
      const riskRows = impact.potentialRisks.map(r => [
        r.level.toUpperCase(),
        r.risk,
        sanitizeText(r.rationale),
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: PDF_THEME.colors.border },
        head: [['Risk Level', 'Identified Hazard', 'Grounding Rationale']],
        body: riskRows,
        headStyles: { fillColor: PDF_THEME.colors.textPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 24, fontStyle: 'bold' },
          1: { cellWidth: 46, fontStyle: 'bold' },
          2: { cellWidth: 'auto', textColor: PDF_THEME.colors.textSecondary },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const val = String(data.cell.raw).toLowerCase();
            if (val === 'high') data.cell.styles.textColor = PDF_THEME.colors.error;
            else if (val === 'medium') data.cell.styles.textColor = PDF_THEME.colors.warning;
            else data.cell.styles.textColor = PDF_THEME.colors.info;
          }
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Decision Timeline (if available)
  // ---------------------------------------------------------------------------

  private renderDecisionTimeline() {
    const timeline = this.report.decisionTimeline!;
    this.renderSectionHeading('6', 'Historical Engineering Decision Timeline');
    const margin = PDF_THEME.page.margin;

    const rows = timeline.map(entry => [
      entry.date ? new Date(entry.date).toLocaleDateString() : 'Historical',
      entry.commitHash ? entry.commitHash.slice(0, 10) : '—',
      entry.title,
      entry.status.toUpperCase(),
      sanitizeText(entry.rationale),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: PDF_THEME.colors.border },
      head: [['Date', 'Commit', 'Decision Title', 'Status', 'Architectural Rationale']],
      body: rows,
      headStyles: { fillColor: PDF_THEME.colors.textPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 20, font: 'courier' },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 22, fontStyle: 'bold' },
        4: { cellWidth: 'auto', textColor: PDF_THEME.colors.textSecondary },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
  }

  // ---------------------------------------------------------------------------
  // 8. Knowledge Gaps (if available)
  // ---------------------------------------------------------------------------

  private renderKnowledgeGaps() {
    const gaps = this.report.knowledgeGaps!;
    this.renderSectionHeading('7', 'Knowledge & Documentation Gaps');
    const margin = PDF_THEME.page.margin;

    if (gaps.debtScore) {
      this.ensureSpace(12);
      this.doc.setFont(PDF_THEME.fonts.family, 'bold');
      this.doc.setFontSize(PDF_THEME.fonts.body);
      this.doc.setTextColor(...PDF_THEME.colors.textPrimary);
      this.doc.text(
        `Calculated Knowledge Debt Score: ${gaps.debtScore.overallScore}/100 (${gaps.debtScore.tier.toUpperCase()}) — ${gaps.debtScore.totalFindingsCount} findings`,
        margin,
        this.currentY
      );
      this.currentY += 5;
    }

    if (gaps.keyGaps && gaps.keyGaps.length > 0) {
      const gapRows = gaps.keyGaps.map(g => [
        g.severity.toUpperCase(),
        g.category.replace(/_/g, ' '),
        g.targetComponent,
        sanitizeText(g.description || g.title),
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        margin: { left: margin, right: margin },
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: PDF_THEME.colors.border },
        head: [['Severity', 'Category', 'Target File/Symbol', 'Gap Detail & Risk']],
        body: gapRows,
        headStyles: { fillColor: PDF_THEME.colors.borderDark, textColor: PDF_THEME.colors.textPrimary, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 34 },
          2: { cellWidth: 40, font: 'courier' },
          3: { cellWidth: 'auto', textColor: PDF_THEME.colors.textSecondary },
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Evidence References and Source URLs
  // ---------------------------------------------------------------------------

  private renderEvidenceReferences() {
    this.renderSectionHeading('8', 'Traceable Evidence & Verified Grounding');
    const margin = PDF_THEME.page.margin;

    const rows = this.report.evidence.map(ev => {
      const location = ev.filePath
        ? `${ev.filePath}${ev.startLine != null ? `:${ev.startLine}` : ''}`
        : ev.commitHash
        ? `Commit: ${ev.commitHash.slice(0, 10)}`
        : 'Repository Metadata';

      const confidenceStr = `${Math.round(ev.confidenceScore * 100)}%`;
      return [
        ev.type.replace(/_/g, ' ').toUpperCase(),
        ev.title,
        location,
        confidenceStr,
        ev.url || '',
      ];
    });

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: PDF_THEME.colors.border },
      head: [['Type', 'Evidence Title', 'Source Location', 'Confidence', 'Remote Source Link']],
      body: rows.map(r => [r[0], r[1], r[2], r[3], r[4] ? 'View Code ->' : 'Local AST']),
      headStyles: { fillColor: PDF_THEME.colors.textPrimary, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },
        1: { cellWidth: 48 },
        2: { cellWidth: 54, font: 'courier' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 'auto', textColor: PDF_THEME.colors.accentPrimary, fontStyle: 'bold' },
      },
      didDrawCell: (data) => {
        // If there's an actual URL, create a clickable PDF hyperlink box over the cell
        if (data.section === 'body' && data.column.index === 4) {
          const rawUrl = rows[data.row.index][4];
          if (rawUrl) {
            this.doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: rawUrl });
          }
        }
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
  }

  // ---------------------------------------------------------------------------
  // 10. Conflicting Evidence and Uncertainty
  // ---------------------------------------------------------------------------

  private renderUncertainties() {
    this.renderSectionHeading('9', 'Conflicting Signals & Identified Uncertainties');
    const margin = PDF_THEME.page.margin;

    const rows = this.report.uncertainties!.map(u => [
      u.area,
      sanitizeText(u.divergingSignals),
      `${Math.round(u.confidenceScore * 100)}%`,
      sanitizeText(u.suggestedClarification),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: PDF_THEME.colors.border },
      head: [['Investigation Domain', 'Conflicting / Ambiguous Observations', 'Confidence', 'Recommended Resolution']],
      body: rows,
      headStyles: { fillColor: PDF_THEME.colors.borderDark, textColor: PDF_THEME.colors.textPrimary, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold' },
        1: { cellWidth: 55, textColor: PDF_THEME.colors.textSecondary },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 'auto', textColor: PDF_THEME.colors.textPrimary },
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 6;
  }

  // ---------------------------------------------------------------------------
  // 11. Limitations and Suggested Next Steps
  // ---------------------------------------------------------------------------

  private renderLimitationsAndNextSteps() {
    this.renderSectionHeading('10', 'Analysis Caveats & Verification Checklist');
    const margin = PDF_THEME.page.margin;
    const printableW = PDF_THEME.page.printableWidth;
    const lim = this.report.limitations;

    // Static analysis caveats
    if (lim.staticAnalysisCaveats && lim.staticAnalysisCaveats.length > 0) {
      this.ensureSpace(lim.staticAnalysisCaveats.length * 6 + 6);
      this.doc.setFont(PDF_THEME.fonts.family, 'bold');
      this.doc.setFontSize(PDF_THEME.fonts.small);
      this.doc.setTextColor(...PDF_THEME.colors.textPrimary);
      this.doc.text('Known Methodological Limitations:', margin, this.currentY);
      this.currentY += 4.5;

      this.doc.setFont(PDF_THEME.fonts.family, 'normal');
      this.doc.setFontSize(PDF_THEME.fonts.body);
      this.doc.setTextColor(...PDF_THEME.colors.textSecondary);

      for (const caveat of lim.staticAnalysisCaveats) {
        const lines = this.doc.splitTextToSize(`* ${sanitizeText(caveat)}`, printableW - 4);
        this.doc.text(lines, margin + 2, this.currentY);
        this.currentY += lines.length * 4.2 + 1;
      }
      this.currentY += 3;
    }

    // Recommended Checklist
    if (lim.recommendedChecklist && lim.recommendedChecklist.length > 0) {
      this.ensureSpace(lim.recommendedChecklist.length * 6 + 6);
      this.doc.setFont(PDF_THEME.fonts.family, 'bold');
      this.doc.setFontSize(PDF_THEME.fonts.small);
      this.doc.setTextColor(...PDF_THEME.colors.textPrimary);
      this.doc.text('Mandatory Pre-Deployment Checklist:', margin, this.currentY);
      this.currentY += 4.5;

      this.doc.setFont(PDF_THEME.fonts.family, 'normal');
      this.doc.setFontSize(PDF_THEME.fonts.body);
      this.doc.setTextColor(...PDF_THEME.colors.textSecondary);

      for (const item of lim.recommendedChecklist) {
        const lines = this.doc.splitTextToSize(`[ ] ${sanitizeText(item)}`, printableW - 4);
        this.doc.text(lines, margin + 2, this.currentY);
        this.currentY += lines.length * 4.2 + 1;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Two-Pass Running Headers & Footers
  // ---------------------------------------------------------------------------

  private renderHeadersAndFooters() {
    const totalPages = this.doc.getNumberOfPages();
    const margin = PDF_THEME.page.margin;
    const printableW = PDF_THEME.page.printableWidth;
    const pageH = PDF_THEME.page.height;

    for (let p = 1; p <= totalPages; p++) {
      this.doc.setPage(p);

      // Running Header (pages 2 and higher)
      if (p > 1) {
        this.doc.setFont(PDF_THEME.fonts.family, 'normal');
        this.doc.setFontSize(PDF_THEME.fonts.caption);
        this.doc.setTextColor(...PDF_THEME.colors.textMuted);
        this.doc.text('CodeWhy — Engineering Decision Report', margin, 10);
        this.doc.text(
          sanitizeText(this.report.repository.repoName),
          margin + printableW,
          10,
          { align: 'right' }
        );

        // Subtle top rule
        this.doc.setDrawColor(...PDF_THEME.colors.border);
        this.doc.setLineWidth(0.2);
        this.doc.line(margin, 12, margin + printableW, 12);
      }

      // Running Footer on every page
      const footerY = pageH - 9;
      this.doc.setDrawColor(...PDF_THEME.colors.border);
      this.doc.setLineWidth(0.2);
      this.doc.line(margin, footerY - 2.5, margin + printableW, footerY - 2.5);

      this.doc.setFont(PDF_THEME.fonts.family, 'normal');
      this.doc.setFontSize(PDF_THEME.fonts.caption);
      this.doc.setTextColor(...PDF_THEME.colors.textMuted);

      // Left: Confidentiality/Grounding note
      this.doc.text('Audited by CodeWhy Knowledge Graph  |  Traceable Grounded AST', margin, footerY);

      // Right: Page numbers "Page X of Y"
      this.doc.text(
        `Page ${p} of ${totalPages}`,
        margin + printableW,
        footerY,
        { align: 'right' }
      );
    }
  }
}
