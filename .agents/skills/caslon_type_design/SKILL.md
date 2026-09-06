---
name: caslon-type-design
description: Guidelines and automated agent procedures for William Caslon-inspired typography engineering, leading, optical kerning, baseline grid alignment, and clinical legibility font stacks.
---

# 🔤 Caslon Type Design Department & Typography Engineering Skill

This skill establishes the **Type Design Department** for PocketGull, inspired by **William Caslon (1692–1766)** and his legendary eighteenth-century English typefoundry collaborators (**William Caslon II**, **Thomas Cottrell**, and **Joseph Jackson**).

> *"When in doubt, use Caslon."* — Classic Printer's Maxim

---

## 🏛️ Type Department Roles & Collaborators

### 1. William Caslon (Master Type Founder & Rhythm Specialist)
* **Scope**: Overall proportional rhythm, organic warmth, optical weight distribution, and authority.
* **Core Principles**:
  * **Proportional Balance**: X-height ($0.48 - 0.52 \times \text{Cap Height}$) tuned for immediate scanning.
  * **Line Height & Leading**: Baseline-to-baseline leading set between $1.4\times$ and $1.65\times$ font size.
  * **Baseline Grid Alignment**: All body, card, and telemetry text locked to a 4px/8px vertical rhythm.

### 2. Thomas Cottrell (Kerning & Optical Spacing Specialist)
* **Scope**: Optical tracking, sidebearing calibration, and character pair collision prevention.
* **Core Principles**:
  * **Display Kerning**: Tight display tracking (`letter-spacing: -0.025em`) on section headings (`h1`–`h4`).
  * **Body Tracking**: Micro-spaced tracking (`letter-spacing: -0.011em`) on `body` and `.font-sans` to prevent word collision during rapid clinical scanning.
  * **Serif Kerning**: Relaxed serif tracking (`letter-spacing: -0.012em`, `line-height: 1.65`) for `Libre Caslon Text` clinical reports and long-form intake documents.

### 3. Joseph Jackson (Contrast & Medical Readability Auditor)
* **Scope**: OpenType feature disambiguation, high-contrast WCAG 2.1 AAA accessibility, and dark mode luminance matching.
* **Core Principles**:
  * **Character Disambiguation**: Enforces `font-feature-settings: 'cv05', 'cv08', 'cv11'` (`1` vs `l` vs `I`, `0` vs `O`).
  * **Luminance Ratios**: $\ge 7:1$ contrast ratio for body text in papercraft and dark themes.
  * **Zero Layout Shift (CLS)**: Preloads all Google Font faces with `font-display: swap` and metric matching.

---

## 🎨 Master Font Stack Hierarchy

```css
/* 1. PocketGull Native Clinical & Telemetry Superfamily */
/* Display Headings & Brand Mark: PocketGull-Chiseltip (900) */
font-family: 'PocketGull-Chiseltip', 'Outfit', sans-serif;
font-weight: 900;
letter-spacing: -0.025em;
line-height: 1.2;

/* High-Contrast Clinical Alerts: PocketGull-Bold (700) */
font-family: 'PocketGull-Bold', 'Inter', sans-serif;
font-weight: 700;
letter-spacing: -0.015em;
line-height: 1.35;

/* Primary Clinical Body & Diagnostic Intake: PocketGull-Fineliner (400) */
font-family: 'PocketGull-Fineliner', 'Inter', -apple-system, sans-serif;
font-weight: 400;
line-height: 1.55;
letter-spacing: -0.011em;

/* Telemetry, Biometrics & Dosage Readouts: PocketGullMono-Regular (400 fixed 600 UPM) */
font-family: 'PocketGullMono-Regular', 'JetBrains Mono', monospace;
font-feature-settings: "cv08", "cv05", "ss02", "tnum";
font-variant-numeric: tabular-nums;
line-height: 1.4;

/* 2. Formal Clinical & Heritage Reports (Caslon Serif) */
font-family: 'Libre Caslon Text', 'Georgia', 'Times New Roman', serif;
line-height: 1.65;
letter-spacing: -0.012em;
```

---

## 🛠️ Automated Typography Verification Script

When modifying CSS or component font styles, run:
```bash
node scripts/verify_caslon_typography.mjs
```
This checks line-heights, letter-spacing, font-family fallbacks, and contrast standards across all `.css` and `.ts` files.
