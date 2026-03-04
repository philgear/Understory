import { Injectable, inject } from '@angular/core';
import { MarkdownService } from './markdown.service';

import { Patient, HistoryEntry, PatientVitals, BodyPartIssue } from './patient.types';

/** Shape of the native JSON export file. */
export interface NativePatientExport {
  _format: 'pocket-gall-native';
  _version: 1;
  exportedAt: string;
  patient: Omit<Patient, 'id'>;
}

/** Minimal FHIR R4 resource types used for import/export. */
interface FhirResource {
  resourceType: string;
  id?: string;
  [key: string]: any;
}

interface FhirBundle {
  resourceType: 'Bundle';
  id?: string;
  type: 'collection';
  timestamp: string;
  meta?: { tag?: { system: string; code: string; display: string }[] };
  entry: { resource: FhirResource }[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private readonly markdownService = inject(MarkdownService);

  // ─── PDF / Print Export ────────────────────────────────────

  /**
   * Opens a styled clinical print document in a new window and triggers window.print().
   * Uses the PocketGall design system: Inter font, brand colours, section cards,
   * markdown-rendered prose, proper tables, blockquotes, and page-break hints.
   */
  async downloadAsPdf(data: any, patientName: string = 'Patient'): Promise<void> {
    console.log('[ExportService] Opening styled print report for:', patientName);

    // Ensure marked is loaded
    let parser = this.markdownService.parser();
    if (!parser) {
      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          parser = this.markdownService.parser();
          if (parser) { clearInterval(interval); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(interval); resolve(); }, 3000);
      });
    }

    const renderMd = (md: string): string => {
      if (!md) return '';
      try { return (parser as any).parse(md) as string; } catch { return `<p>${md}</p>`; }
    };

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const lensLabels: Record<string, string> = {
      'Summary Overview': 'Summary Overview',
      'Functional Protocols': 'Functional Protocols',
      'Monitoring & Follow-up': 'Monitoring & Follow-up',
      'Patient Education': 'Patient Education',
    };

    const lensIcons: Record<string, string> = {
      'Summary Overview': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-800v560q0 33-23.5 56.5T760-120H200zm80-160h320v-80H280v80zm0-160h400v-80H280v80zm0-160h400v-80H280v80z"/></svg>`,
      'Functional Protocols': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>`,
      'Monitoring & Follow-up': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80Z"/></svg>`,
      'Patient Education': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 210 200-108v-132L480-360 280-470v132l200 108Zm0-210Zm0 90Zm0 0Z"/></svg>`,
    };

    const lensColors: Record<string, string> = {
      'Summary Overview': '#1C6AFF',
      'Functional Protocols': '#059669',
      'Monitoring & Follow-up': '#D97706',
      'Patient Education': '#7C3AED',
    };

    const report = typeof data.report === 'object' ? data.report : {};
    const summary = data.summary || '';

    const sectionsHtml = Object.entries(lensLabels).map(([key, label]) => {
      const content = report[key] || '';
      if (!content) return '';
      const color = lensColors[key] || '#1C1C1C';
      const icon = lensIcons[key] || '';
      const renderedContent = renderMd(content);
      return `
            <section class="lens-section" style="--accent: ${color}">
                <div class="lens-header">
                    <span class="lens-icon" style="color: ${color}">${icon}</span>
                    <h2 class="lens-title">${label}</h2>
                </div>
                <div class="lens-body rams-typography">
                    ${renderedContent}
                </div>
            </section>`;
    }).join('');

    const summaryHtml = summary ? `
            <section class="lens-section summary-section" style="--accent: #1C1C1C">
                <div class="lens-header">
                    <h2 class="lens-title">Clinical Summary</h2>
                </div>
                <div class="lens-body">
                    <p class="summary-text">${summary}</p>
                </div>
            </section>` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pocket Gall Clinical Report — ${patientName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --brand: #1C6AFF;
      --brand-dark: #0A3FCC;
      --ink: #1C1C1C;
      --ink-muted: #6B7280;
      --surface: #FFFFFF;
      --surface-subtle: #F9FAFB;
      --border: #E5E7EB;
      --green: #059669;
      --amber: #D97706;
      --violet: #7C3AED;
      --radius: 10px;
      --font: 'Inter', system-ui, -apple-system, sans-serif;
    }

    html { font-size: 10pt; }
    body {
      font-family: var(--font);
      color: var(--ink);
      background: var(--surface);
      line-height: 1.65;
      padding: 0;
      margin: 0;
    }

    /* ─── Page Layout ───────────────────────────────── */
    .page-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 48px 60px;
    }

    /* ─── Letterhead ────────────────────────────────── */
    .letterhead {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--ink);
      margin-bottom: 28px;
    }
    .brand-block {}
    .brand-name {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--ink);
      line-height: 1;
    }
    .brand-tagline {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--ink-muted);
      margin-top: 4px;
    }
    .report-meta {
      text-align: right;
      font-size: 8pt;
      color: var(--ink-muted);
      line-height: 1.8;
    }
    .report-meta strong { color: var(--ink); font-weight: 600; }

    /* ─── Patient Banner ────────────────────────────── */
    .patient-banner {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 28px;
    }
    .patient-field {
      background: var(--surface-subtle);
      padding: 10px 14px;
    }
    .patient-field-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      font-weight: 600;
      margin-bottom: 2px;
    }
    .patient-field-value {
      font-size: 10pt;
      font-weight: 600;
      color: var(--ink);
    }

    /* ─── AI Disclaimer ─────────────────────────────── */
    .ai-disclaimer {
      font-size: 7.5pt;
      color: var(--ink-muted);
      border-left: 3px solid var(--amber);
      padding: 6px 10px;
      background: #FFFBEB;
      border-radius: 0 4px 4px 0;
      margin-bottom: 28px;
      line-height: 1.5;
    }

    /* ─── Lens Sections ─────────────────────────────── */
    .lens-section {
      margin-bottom: 28px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .lens-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 18px;
      background: var(--surface-subtle);
      border-bottom: 1px solid var(--border);
    }
    .lens-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .lens-icon svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .lens-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent, var(--ink));
    }
    .lens-body {
      padding: 18px 20px;
    }
    .summary-text {
      font-size: 9.5pt;
      color: var(--ink-muted);
      font-style: italic;
    }

    /* ─── RAM Typography ────────────────────────────── */
    .rams-typography h3 {
      font-size: 9.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ink);
      margin: 16px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border);
    }
    .rams-typography h3:first-child { margin-top: 0; }

    .rams-typography p {
      font-size: 9.5pt;
      margin-bottom: 10px;
      color: #374151;
    }

    .rams-typography ul, .rams-typography ol {
      padding-left: 18px;
      margin-bottom: 10px;
    }
    .rams-typography li {
      font-size: 9.5pt;
      margin-bottom: 4px;
      color: #374151;
    }
    .rams-typography li strong { color: var(--ink); }

    .rams-typography strong { font-weight: 600; color: var(--ink); }
    .rams-typography em { font-style: italic; }

    /* Tables */
    .rams-typography table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 10px 0 14px;
    }
    .rams-typography th {
      background: var(--surface-subtle);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 7.5pt;
      padding: 7px 10px;
      text-align: left;
      border: 1px solid var(--border);
      color: var(--ink);
    }
    .rams-typography td {
      padding: 6px 10px;
      border: 1px solid var(--border);
      vertical-align: top;
      color: #374151;
    }
    .rams-typography tr:nth-child(even) td { background: #FAFAFA; }

    /* Blockquotes */
    .rams-typography blockquote {
      border-left: 3px solid var(--accent, var(--brand));
      background: #F9FAFB;
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
    }
    .rams-typography blockquote p {
      margin: 0;
      font-size: 9pt;
      color: #374151;
    }

    /* ─── Footer ────────────────────────────────────── */
    .report-footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      font-size: 8pt;
      font-weight: 700;
      color: var(--ink-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .footer-disclaimer {
      font-size: 7.5pt;
      color: var(--ink-muted);
      max-width: 380px;
      text-align: right;
      line-height: 1.4;
    }

    /* ─── Print Overrides ───────────────────────────── */
    @media print {
      html { font-size: 9.5pt; }
      body { background: white !important; }
      .page-wrap { padding: 0; max-width: 100%; }
      .lens-section { page-break-inside: avoid; break-inside: avoid; }
      @page {
        size: A4;
        margin: 18mm 18mm 22mm 18mm;
      }
    }

    /* ─── Print Action Bar (screen only) ────────────── */
    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: var(--ink);
      color: white;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
      font-size: 9pt;
      gap: 12px;
    }
    .print-bar-title { font-weight: 600; }
    .print-bar-actions { display: flex; gap: 10px; }
    .btn-print {
      background: var(--brand);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 7px 18px;
      font-size: 9pt;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-print:hover { background: var(--brand-dark); }
    .btn-close {
      background: transparent;
      color: #9CA3AF;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 7px 12px;
      font-size: 9pt;
      cursor: pointer;
      font-family: inherit;
    }
    @media print { .print-bar { display: none !important; } }
    .main-content { padding-top: 56px; }
    @media print { .main-content { padding-top: 0; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <span class="print-bar-title">Pocket Gall Clinical Report — ${patientName}</span>
    <div class="print-bar-actions">
      <button class="btn-close" onclick="window.close()">Close</button>
      <button class="btn-print" onclick="window.print()">Save as PDF / Print</button>
    </div>
  </div>

  <div class="main-content">
    <div class="page-wrap">

      <!-- Letterhead -->
      <header class="letterhead">
        <div class="brand-block">
          <div class="brand-name">Pocket Gall</div>
          <div class="brand-tagline">Clinical Intelligence Platform</div>
        </div>
        <div class="report-meta">
          <div><strong>Generated</strong> ${timestamp}</div>
          <div><strong>Report Type</strong> Comprehensive Clinical Analysis</div>
          <div><strong>Classification</strong> Confidential – Clinical Use Only</div>
        </div>
      </header>

      <!-- Patient Banner -->
      <div class="patient-banner">
        <div class="patient-field">
          <div class="patient-field-label">Patient Name</div>
          <div class="patient-field-value">${patientName}</div>
        </div>
        <div class="patient-field">
          <div class="patient-field-label">Report Date</div>
          <div class="patient-field-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="patient-field">
          <div class="patient-field-label">Generated By</div>
          <div class="patient-field-value">Gemini AI (Pocket Gall)</div>
        </div>
      </div>

      <!-- AI Disclaimer -->
      <div class="ai-disclaimer">
        <strong>AI-Assisted Clinical Report.</strong> This document was generated by the PocketGall AI engine powered by Google Gemini.
        All recommendations are advisory and must be reviewed and approved by a licensed healthcare professional before clinical application.
        Not a substitute for professional medical judgement.
      </div>

      ${summaryHtml}
      ${sectionsHtml}

      <!-- Footer -->
      <footer class="report-footer">
        <div class="footer-brand">Pocket Gall &mdash; pocket-gall.app</div>
        <div class="footer-disclaimer">
          AI-generated content. For clinical reference only. Verify all recommendations with qualified clinical staff prior to implementation.
        </div>
      </footer>

    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=750,scrollbars=yes');
    if (!printWindow) {
      console.error('[ExportService] Could not open print window — popup blocked?');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    console.log('[ExportService] Print window opened for:', patientName);
  }

  // ─── Care Plan Print Export ────────────────────────────────

  /**
   * Opens a styled Care Plan print document in a new window.
   * Uses the same PocketGall design system as downloadAsPdf() but
   * formatted for the patient Care Plan / Visit Summary document.
   * Includes halftone decorative elements and a green-accented clinical layout.
   */
  async downloadCarePlanPdf(
    carePlanMarkdown: string,
    patientName: string = 'Patient',
    vitals?: { bp?: string; hr?: string; temp?: string; spO2?: string; weight?: string },
    conditions?: string[]
  ): Promise<void> {
    console.log('[ExportService] Opening styled Care Plan print report for:', patientName);

    let parser = this.markdownService.parser();
    if (!parser) {
      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          parser = this.markdownService.parser();
          if (parser) { clearInterval(interval); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(interval); resolve(); }, 3000);
      });
    }

    const renderMd = (md: string): string => {
      if (!md) return '';
      try { return (parser as any).parse(md) as string; } catch { return `<p>${md}</p>`; }
    };

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const carePlanHtml = renderMd(carePlanMarkdown || '_No active care plan recorded for this visit._');

    // Strip trailing unit strings that may already be embedded in stored vitals values
    const stripUnits = (val: string, ...units: string[]): string => {
      let result = val.trim();
      for (const unit of units) {
        const re = new RegExp(`\\s*${unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
        result = result.replace(re, '');
      }
      return result.trim();
    };

    const vitalsHtml = vitals ? `
        <div class="vitals-row">
            ${vitals.bp ? `<div class="vital-chip"><span class="vital-label">BP</span><span class="vital-value">${vitals.bp}</span></div>` : ''}
            ${vitals.hr ? `<div class="vital-chip"><span class="vital-label">HR</span><span class="vital-value">${stripUnits(vitals.hr, 'bpm')} <small>bpm</small></span></div>` : ''}
            ${vitals.temp ? `<div class="vital-chip"><span class="vital-label">Temp</span><span class="vital-value">${stripUnits(vitals.temp, '°F', '°C', 'F', 'C')}°F</span></div>` : ''}
            ${vitals.spO2 ? `<div class="vital-chip"><span class="vital-label">SpO2</span><span class="vital-value">${stripUnits(vitals.spO2, '%')}%</span></div>` : ''}
            ${vitals.weight ? `<div class="vital-chip"><span class="vital-label">Weight</span><span class="vital-value">${stripUnits(vitals.weight, 'lbs', 'kg', 'lb')} lbs</span></div>` : ''}
        </div>` : '';

    const conditionsHtml = (conditions && conditions.length > 0) ? `
        <div class="conditions-block">
            <div class="conditions-label">Historical Conditions</div>
            <div class="conditions-tags">${conditions.map(c => `<span class="condition-tag">${c}</span>`).join('')}</div>
        </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pocket Gall Care Plan — ${patientName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --brand: #689F38;
      --brand-dark: #4a7428;
      --ink: #1C1C1C;
      --ink-muted: #6B7280;
      --surface: #FFFFFF;
      --surface-subtle: #F9FAFB;
      --surface-green: #F0F7E8;
      --border: #E5E7EB;
      --border-green: #C8E6C9;
      --radius: 10px;
      --font: 'Inter', system-ui, -apple-system, sans-serif;
    }

    html { font-size: 10pt; }
    body {
      font-family: var(--font);
      color: var(--ink);
      background: var(--surface);
      line-height: 1.65;
      padding: 0;
      margin: 0;
      position: relative;
    }

    /* ─── Halftone background decoration ───────────── */
    body::before {
      content: '';
      position: fixed;
      top: -60px;
      right: -60px;
      width: 340px;
      height: 340px;
      background-image: radial-gradient(circle, #689F38 1.5px, transparent 1.5px);
      background-size: 16px 16px;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    }
    body::after {
      content: '';
      position: fixed;
      bottom: -80px;
      left: -80px;
      width: 280px;
      height: 280px;
      background-image: radial-gradient(circle, #689F38 1.5px, transparent 1.5px);
      background-size: 18px 18px;
      opacity: 0.055;
      pointer-events: none;
      z-index: 0;
    }

    /* ─── Page Layout ───────────────────────────────── */
    .page-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 48px 60px;
      position: relative;
      z-index: 1;
    }

    /* ─── Letterhead ────────────────────────────────── */
    .letterhead {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--ink);
      margin-bottom: 28px;
    }
    .brand-name {
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--ink);
      line-height: 1;
    }
    .brand-tagline {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--ink-muted);
      margin-top: 4px;
    }
    .report-meta {
      text-align: right;
      font-size: 8pt;
      color: var(--ink-muted);
      line-height: 1.8;
    }
    .report-meta strong { color: var(--ink); font-weight: 600; }

    /* ─── Document Type Badge ───────────────────────── */
    .doc-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface-green);
      border: 1px solid var(--border-green);
      color: var(--brand-dark);
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 5px 12px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .doc-type-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      background: var(--brand);
      border-radius: 50%;
    }

    /* ─── Patient Banner ────────────────────────────── */
    .patient-banner {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 20px;
    }
    .patient-field {
      background: var(--surface-subtle);
      padding: 10px 14px;
    }
    .patient-field-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      font-weight: 600;
      margin-bottom: 2px;
    }
    .patient-field-value {
      font-size: 10pt;
      font-weight: 600;
      color: var(--ink);
    }

    /* ─── Vitals Row ────────────────────────────────── */
    .vitals-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .vital-chip {
      display: flex;
      flex-direction: column;
      padding: 7px 12px;
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 6px;
      min-width: 72px;
    }
    .vital-label {
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      margin-bottom: 2px;
    }
    .vital-value {
      font-size: 10pt;
      font-weight: 600;
      color: var(--ink);
    }
    .vital-value small { font-size: 7.5pt; font-weight: 400; color: var(--ink-muted); }

    /* ─── Conditions ─────────────────────────────────── */
    .conditions-block {
      margin-bottom: 20px;
    }
    .conditions-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      margin-bottom: 8px;
    }
    .conditions-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .condition-tag {
      font-size: 8pt;
      font-weight: 500;
      padding: 4px 10px;
      background: #F3F4F6;
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--ink);
    }

    /* ─── Care Plan Section ──────────────────────────── */
    .care-plan-section {
      border: 1px solid var(--border-green);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 28px;
    }
    .care-plan-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 18px;
      background: var(--surface-green);
      border-bottom: 1px solid var(--border-green);
    }
    .care-plan-header-icon {
      width: 18px;
      height: 18px;
      fill: var(--brand);
      flex-shrink: 0;
    }
    .care-plan-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--brand-dark);
    }
    .care-plan-body {
      padding: 20px 22px;
    }

    /* ─── Care Plan Typography ───────────────────────── */
    .care-plan-body h1, .care-plan-body h2 {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ink);
      margin: 18px 0 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid var(--border);
    }
    .care-plan-body h1:first-child, .care-plan-body h2:first-child { margin-top: 0; }
    .care-plan-body h3 {
      font-size: 9.5pt;
      font-weight: 700;
      color: var(--brand-dark);
      margin: 14px 0 6px;
    }
    .care-plan-body p {
      font-size: 9.5pt;
      margin-bottom: 10px;
      color: #374151;
    }
    .care-plan-body ul, .care-plan-body ol {
      padding-left: 18px;
      margin-bottom: 10px;
    }
    .care-plan-body li {
      font-size: 9.5pt;
      margin-bottom: 6px;
      color: #374151;
    }
    .care-plan-body li strong { color: var(--ink); font-weight: 600; }
    .care-plan-body strong { font-weight: 600; color: var(--ink); }
    .care-plan-body em { font-style: italic; }
    .care-plan-body table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 10px 0 14px;
    }
    .care-plan-body th {
      background: var(--surface-green);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 7.5pt;
      padding: 7px 10px;
      text-align: left;
      border: 1px solid var(--border-green);
      color: var(--brand-dark);
    }
    .care-plan-body td {
      padding: 6px 10px;
      border: 1px solid var(--border);
      vertical-align: top;
      color: #374151;
    }
    .care-plan-body tr:nth-child(even) td { background: #F9FBF5; }
    .care-plan-body blockquote {
      border-left: 3px solid var(--brand);
      background: var(--surface-green);
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
    }
    .care-plan-body blockquote p { margin: 0; font-size: 9pt; color: #374151; }

    /* ─── Attestation Box ────────────────────────────── */
    .attestation {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 20px;
      background: var(--surface-subtle);
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .attestation-field {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .attestation-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
    }
    .attestation-line {
      border-bottom: 1px solid var(--ink-muted);
      height: 1px;
      margin-top: 4px;
    }

    /* ─── Footer ────────────────────────────────────── */
    .report-footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      font-size: 8pt;
      font-weight: 700;
      color: var(--ink-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .footer-disclaimer {
      font-size: 7.5pt;
      color: var(--ink-muted);
      max-width: 380px;
      text-align: right;
      line-height: 1.4;
    }

    /* ─── Print Overrides ───────────────────────────── */
    @media print {
      html { font-size: 9.5pt; }
      body { background: white !important; }
      body::before, body::after { position: absolute !important; }
      .page-wrap { padding: 0; max-width: 100%; }
      .care-plan-section { page-break-inside: avoid; break-inside: avoid; }
      @page {
        size: A4;
        margin: 18mm 18mm 22mm 18mm;
      }
    }

    /* ─── Print Action Bar (screen only) ────────────── */
    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: var(--ink);
      color: white;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
      font-size: 9pt;
      gap: 12px;
    }
    .print-bar-title { font-weight: 600; }
    .print-bar-actions { display: flex; gap: 10px; }
    .btn-print {
      background: var(--brand);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 7px 18px;
      font-size: 9pt;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-print:hover { background: var(--brand-dark); }
    .btn-close {
      background: transparent;
      color: #9CA3AF;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 7px 12px;
      font-size: 9pt;
      cursor: pointer;
      font-family: inherit;
    }
    @media print { .print-bar { display: none !important; } }
    .main-content { padding-top: 56px; }
    @media print { .main-content { padding-top: 0; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <span class="print-bar-title">Pocket Gall Care Plan — ${patientName}</span>
    <div class="print-bar-actions">
      <button class="btn-close" onclick="window.close()">Close</button>
      <button class="btn-print" onclick="window.print()">Save as PDF / Print</button>
    </div>
  </div>

  <div class="main-content">
    <div class="page-wrap">

      <!-- Letterhead -->
      <header class="letterhead">
        <div class="brand-block">
          <div class="brand-name">Pocket Gall</div>
          <div class="brand-tagline">Clinical Intelligence Platform</div>
        </div>
        <div class="report-meta">
          <div><strong>Generated</strong> ${timestamp}</div>
          <div><strong>Report Type</strong> Care Plan &amp; Visit Summary</div>
          <div><strong>Classification</strong> Confidential – Clinical Use Only</div>
        </div>
      </header>

      <!-- Document Type Badge -->
      <div class="doc-type-badge">Finalized Care Plan</div>

      <!-- Patient Banner -->
      <div class="patient-banner">
        <div class="patient-field">
          <div class="patient-field-label">Patient Name</div>
          <div class="patient-field-value">${patientName}</div>
        </div>
        <div class="patient-field">
          <div class="patient-field-label">Visit Date</div>
          <div class="patient-field-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="patient-field">
          <div class="patient-field-label">Prepared By</div>
          <div class="patient-field-value">Pocket Gall AI</div>
        </div>
      </div>

      ${vitalsHtml}
      ${conditionsHtml}

      <!-- Care Plan Section -->
      <div class="care-plan-section">
        <div class="care-plan-header">
          <svg class="care-plan-header-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
            <path d="M480-80q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q97-30 162-118.5T718-480H480v-315l-240 90v185h240v316Z"/>
          </svg>
          <div class="care-plan-title">Active Care Plan</div>
        </div>
        <div class="care-plan-body">
          ${carePlanHtml}
        </div>
      </div>

      <!-- Clinician Attestation -->
      <div class="attestation">
        <div class="attestation-field">
          <div class="attestation-label">Clinician Signature</div>
          <div class="attestation-line"></div>
        </div>
        <div class="attestation-field">
          <div class="attestation-label">Date &amp; Time</div>
          <div class="attestation-line"></div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="report-footer">
        <div class="footer-brand">Pocket Gall &mdash; pocket-gall.app</div>
        <div class="footer-disclaimer">
          This care plan was generated with AI assistance. Review and approval by a licensed clinician is required before implementation.
        </div>
      </footer>

    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=750,scrollbars=yes');
    if (!printWindow) {
      console.error('[ExportService] Could not open Care Plan print window — popup blocked?');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    console.log('[ExportService] Care Plan print window opened for:', patientName);
  }

  // ─── Analysis-only FHIR Export (existing) ─────────────────

  /**
   * Generates and downloads a FHIR DiagnosticReport (JSON) for the analysis only.
   */
  async downloadAsFhir(data: any, patientName: string = 'Patient'): Promise<void> {
    console.log('[ExportService] Starting FHIR DiagnosticReport generation...');
    try {
      const fhirReport = {
        resourceType: 'DiagnosticReport',
        id: `pocket-gall-${Date.now()}`,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
                code: 'GE',
                display: 'General'
              }
            ]
          }
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11506-3',
              display: 'Progress note'
            }
          ],
          text: 'Pocket Gall AI Clinical Analysis'
        },
        subject: {
          display: patientName
        },
        effectiveDateTime: new Date().toISOString(),
        issued: new Date().toISOString(),
        conclusion: data.summary,
        presentedForm: [
          {
            contentType: 'text/markdown',
            data: this._toBase64(typeof data.report === 'object' ? JSON.stringify(data.report) : data.report)
          }
        ]
      };

      const blob = new Blob([JSON.stringify(fhirReport, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FHIR_Report_${patientName.replace(/\s+/g, '_')}.json`;
      console.log('[ExportService] Triggering FHIR download:', a.download);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[ExportService] FHIR export failed:', error);
    }
  }

  // ─── Native JSON Export / Import ──────────────────────────

  /**
   * Exports the full patient record as a native JSON file.
   * This is a lossless round-trip format that preserves all app data.
   */
  downloadAsNativeJson(patient: Patient): void {
    const { id, ...patientWithoutId } = patient;
    const exportData: NativePatientExport = {
      _format: 'pocket-gall-native',
      _version: 1,
      exportedAt: new Date().toISOString(),
      patient: patientWithoutId,
    };

    this._downloadJson(exportData, `Pocket Gall_Patient_${patient.name.replace(/\s+/g, '_')}.json`);
  }

  /**
   * Parses a native JSON file and returns a Patient object.
   * Assigns a new unique ID so imported patients never collide.
   */
  async importFromNativeJson(file: File): Promise<Patient> {
    const text = await file.text();
    const data = JSON.parse(text) as NativePatientExport;

    if (data._format !== 'pocket-gall-native') {
      throw new Error('Not a valid PocketGall native export file.');
    }

    return {
      id: `p_${Date.now()}`,
      ...data.patient,
      // Ensure required arrays exist even from older exports
      history: data.patient.history ?? [],
      bookmarks: data.patient.bookmarks ?? [],
      preexistingConditions: data.patient.preexistingConditions ?? [],
    };
  }

  // ─── FHIR R4 Bundle Export / Import ───────────────────────

  /**
   * Exports the full patient record as a FHIR R4 Bundle.
   * Includes Patient, Condition, Observation, Goal, and DiagnosticReport resources.
   */
  downloadAsFhirBundle(patient: Patient): void {
    console.log('[ExportService] Starting FHIR Bundle generation for:', patient.name);
    try {
      const patientRef = `Patient/pocket-gall-${patient.id}`;
      const entries: { resource: FhirResource }[] = [];

      // 1. Patient resource
      entries.push({
        resource: {
          resourceType: 'Patient',
          id: `pocket-gall-${patient.id}`,
          name: [{ text: patient.name }],
          gender: this._toFhirGender(patient.gender),
          birthDate: this._estimateBirthYear(patient.age),
          extension: [
            {
              url: 'http://pocket-gall.app/fhir/StructureDefinition/last-visit',
              valueString: patient.lastVisit,
            }
          ]
        }
      });

      // 2. Conditions
      patient.preexistingConditions.forEach((condition, i) => {
        entries.push({
          resource: {
            resourceType: 'Condition',
            id: `condition-${i}`,
            subject: { reference: patientRef },
            code: { text: condition },
            clinicalStatus: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
            }
          }
        });
      });

      // 3. Vitals as Observations
      const vitals = patient.vitals;
      const vitalMappings: { field: keyof PatientVitals; loinc: string; display: string }[] = [
        { field: 'bp', loinc: '85354-9', display: 'Blood Pressure' },
        { field: 'hr', loinc: '8867-4', display: 'Heart Rate' },
        { field: 'temp', loinc: '8310-5', display: 'Body Temperature' },
        { field: 'spO2', loinc: '2708-6', display: 'Oxygen Saturation' },
        { field: 'weight', loinc: '29463-7', display: 'Body Weight' },
        { field: 'height', loinc: '8302-2', display: 'Body Height' },
      ];

      vitalMappings.forEach(({ field, loinc, display }) => {
        const value = vitals[field];
        if (!value) return;
        entries.push({
          resource: {
            resourceType: 'Observation',
            id: `vital-${String(field)}`,
            status: 'final',
            category: [{
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
            }],
            code: { coding: [{ system: 'http://loinc.org', code: loinc, display }], text: display },
            subject: { reference: patientRef },
            valueString: value,
          }
        });
      });

      // 4. Body issues as Observations
      Object.entries(patient.issues).forEach(([partId, issues]) => {
        (issues as BodyPartIssue[]).forEach((issue, i) => {
          entries.push({
            resource: {
              resourceType: 'Observation',
              id: `issue-${partId}-${i}`,
              status: 'final',
              category: [{
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam' }]
              }],
              code: { text: issue.name },
              subject: { reference: patientRef },
              bodySite: { text: partId },
              valueString: issue.description,
              extension: [
                {
                  url: 'http://pocket-gall.app/fhir/StructureDefinition/pain-level',
                  valueInteger: issue.painLevel,
                },
                {
                  url: 'http://pocket-gall.app/fhir/StructureDefinition/note-id',
                  valueString: issue.noteId,
                },
              ]
            }
          });
        });
      });

      // 5. Patient goals
      if (patient.patientGoals) {
        entries.push({
          resource: {
            resourceType: 'Goal',
            id: 'goal-chief-complaint',
            lifecycleStatus: 'active',
            subject: { reference: patientRef },
            description: { text: patient.patientGoals },
          }
        });
      }

      // 6. Analysis reports from history
      patient.history
        .filter(h => h.type === 'AnalysisRun' || h.type === 'FinalizedPatientSummary')
        .forEach((entry, i) => {
          if (entry.type === 'AnalysisRun' || entry.type === 'FinalizedPatientSummary') {
            entries.push({
              resource: {
                resourceType: 'DiagnosticReport',
                id: `report-${i}`,
                status: 'final',
                code: { text: 'Pocket Gall AI Clinical Analysis' },
                subject: { reference: patientRef },
                effectiveDateTime: this._toISODate(entry.date),
                conclusion: entry.summary,
                presentedForm: [{
                  contentType: 'application/json',
                  data: this._toBase64(JSON.stringify(entry.report)),
                }]
              }
            });
          }
        });

      const bundle: FhirBundle = {
        resourceType: 'Bundle',
        id: `pocket-gall-bundle-${Date.now()}`,
        type: 'collection',
        timestamp: new Date().toISOString(),
        meta: {
          tag: [{
            system: 'http://pocket-gall.app/fhir',
            code: 'pocket-gall-export',
            display: 'Pocket Gall Patient Export',
          }]
        },
        entry: entries,
      };

      const filename = `FHIR_Bundle_${patient.name.replace(/\s+/g, '_')}.json`;
      console.log('[ExportService] Triggering FHIR Bundle download:', filename);
      this._downloadJson(bundle, filename);
    } catch (error) {
      console.error('[ExportService] FHIR Bundle export failed:', error);
    }
  }

  /**
   * Parses a FHIR R4 Bundle and maps it back to an PocketGall Patient.
   */
  async importFromFhirBundle(file: File): Promise<Patient> {
    const text = await file.text();
    const bundle = JSON.parse(text) as FhirBundle;

    if (bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
      throw new Error('Not a valid FHIR Bundle.');
    }

    const resources = bundle.entry.map(e => e.resource);
    const fhirPatient = resources.find(r => r['resourceType'] === 'Patient');

    // Demographics
    const name = fhirPatient?.name?.[0]?.text || fhirPatient?.name?.[0]?.family || 'Imported Patient';
    const gender = this._fromFhirGender(fhirPatient?.gender);
    const age = fhirPatient?.birthDate ? this._ageFromBirthDate(fhirPatient.birthDate) : 0;
    const lastVisitExt = fhirPatient?.extension?.find((e: any) => e.url?.includes('last-visit'));
    const lastVisit = lastVisitExt?.valueString || new Date().toISOString().split('T')[0].replace(/-/g, '.');

    // Conditions
    const conditions = resources
      .filter(r => r['resourceType'] === 'Condition')
      .map(r => r['code']?.text || 'Unknown Condition');

    // Vitals
    const vitals: PatientVitals = { bp: '', hr: '', temp: '', spO2: '', weight: '', height: '' };
    const vitalObs = resources.filter(r =>
      r['resourceType'] === 'Observation' &&
      r['category']?.[0]?.coding?.[0]?.code === 'vital-signs'
    );
    const loincToField: Record<string, keyof PatientVitals> = {
      '85354-9': 'bp', '8867-4': 'hr', '8310-5': 'temp',
      '2708-6': 'spO2', '29463-7': 'weight', '8302-2': 'height',
    };
    vitalObs.forEach(obs => {
      const loinc = obs['code']?.coding?.[0]?.code;
      const field = loinc ? loincToField[loinc] : undefined;
      if (field) {
        vitals[field] = obs['valueString'] || '';
      }
    });

    // Body issues
    const issues: Record<string, BodyPartIssue[]> = {};
    const issueObs = resources.filter(r =>
      r['resourceType'] === 'Observation' &&
      r['category']?.[0]?.coding?.[0]?.code === 'exam'
    );
    issueObs.forEach(obs => {
      const partId = obs['bodySite']?.text || 'unknown';
      const painExt = obs['extension']?.find((e: any) => e.url?.includes('pain-level'));
      const noteIdExt = obs['extension']?.find((e: any) => e.url?.includes('note-id'));
      const issue: BodyPartIssue = {
        id: partId,
        noteId: noteIdExt?.valueString || `note_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: obs['code']?.text || partId,
        painLevel: painExt?.valueInteger ?? 0,
        description: obs['valueString'] || '',
        symptoms: [],
      };
      if (!issues[partId]) issues[partId] = [];
      issues[partId].push(issue);
    });

    // Goals
    const goalResource = resources.find(r => r['resourceType'] === 'Goal');
    const patientGoals = goalResource?.description?.text || '';

    // Analysis history
    const history: HistoryEntry[] = [];
    resources
      .filter(r => r['resourceType'] === 'DiagnosticReport')
      .forEach(report => {
        try {
          const reportData = report['presentedForm']?.[0]?.data;
          const parsed = reportData ? JSON.parse(this._fromBase64(reportData)) : {};
          history.push({
            type: 'AnalysisRun',
            date: report['effectiveDateTime']?.split('T')[0]?.replace(/-/g, '.') || lastVisit,
            summary: report['conclusion'] || 'Imported Analysis',
            report: parsed,
          });
        } catch {
          // Skip malformed reports
        }
      });

    return {
      id: `p_${Date.now()}`,
      name,
      age,
      gender,
      lastVisit,
      preexistingConditions: conditions,
      patientGoals,
      vitals,
      issues,
      history,
      bookmarks: [],
    };
  }

  // ─── Auto-detect and import ───────────────────────────────

  /**
   * Detects the format of a JSON file and imports accordingly.
   */
  async importFromFile(file: File): Promise<Patient> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data._format === 'pocket-gall-native') {
      // Re-create a file-like object from the already-read text
      const blob = new Blob([text], { type: 'application/json' });
      const syntheticFile = new File([blob], file.name, { type: 'application/json' });
      return this.importFromNativeJson(syntheticFile);
    } else if (data.resourceType === 'Bundle') {
      const blob = new Blob([text], { type: 'application/json' });
      const syntheticFile = new File([blob], file.name, { type: 'application/json' });
      return this.importFromFhirBundle(syntheticFile);
    } else {
      throw new Error('Unrecognized file format. Expected PocketGall native JSON or FHIR R4 Bundle.');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  private _downloadJson(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private _toFhirGender(gender: string): string {
    const map: Record<string, string> = {
      'Male': 'male', 'Female': 'female', 'Non-binary': 'other', 'Other': 'unknown'
    };
    return map[gender] || 'unknown';
  }

  private _fromFhirGender(fhirGender?: string): 'Male' | 'Female' | 'Non-binary' | 'Other' {
    const map: Record<string, 'Male' | 'Female' | 'Non-binary' | 'Other'> = {
      'male': 'Male', 'female': 'Female', 'other': 'Non-binary', 'unknown': 'Other'
    };
    return map[fhirGender || ''] || 'Other';
  }

  private _estimateBirthYear(age: number): string {
    const year = new Date().getFullYear() - age;
    return `${year}-01-01`;
  }

  private _ageFromBirthDate(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  private _toISODate(dotDate: string): string {
    // Convert "2024.06.15" to "2024-06-15"
    return dotDate.replace(/\./g, '-');
  }

  private _toBase64(str: string): string {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
    } catch (e) {
      console.error('Base64 encoding failed:', e);
      return btoa(unescape(encodeURIComponent(str)));
    }
  }

  private _fromBase64(base64: string): string {
    try {
      return decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      console.error('Base64 decoding failed:', e);
      return decodeURIComponent(escape(atob(base64)));
    }
  }
}
