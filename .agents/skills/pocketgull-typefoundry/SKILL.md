---
name: pocketgull-typefoundry
description: Comprehensive procedural typefoundry engineering for PocketGull 4-master font superfamily, 1000 UPM grid, parametric chisel nib physics, multi-script synthesis, 300 DPI landmark architectural triad generation, and 34/34 OTS/Google Fonts verification.
---

# ✒️ PocketGull Typefoundry Engineering Skill

This skill defines the complete operational standard for developing, compiling, verifying, and publishing fonts within the **PocketGull Open-Source Typeface Superfamily** (`pocketgull-typeface`), licensed under SIL Open Font License 1.1 and archived with CERN Zenodo (`DOI: 10.5281/zenodo.18882512`).

---

## 🏛️ Superfamily Architecture & 4-Master Taxonomy

| Cut / Master | Weight / UPM | Primary Purpose & Optical Domain | Mathematical Character |
| :--- | :--- | :--- | :--- |
| **`PocketGull-Chiseltip`** | 900 Black / 1000 | Monumental display titles, brand lettering, and clinical signposts. | Parametric physical $45^\circ$ chisel nib simulation with asymmetric stroke dynamics. |
| **`PocketGull-Bold`** | 700 Bold / 1000 | Emergency triage banners, high-acuity HUD alerts, Snellen 20/20 optotypes. | High-contrast optical anchor, 5:1 Sloan ratio, enlarged apertures. |
| **`PocketGull-Fineliner`** | 400 Regular / 1000 | Diagnostic narrative intake, EHR clinical notes, multi-paragraph reading. | Deep inktraps, wide interior counters, relaxed tracking, low cognitive fatigue. |
| **`PocketGullMono-Regular`** | 400 Mono / 600 pitch | Tabular vitals, ECG waveforms, blood pressure, lab values, dosages. | Slashed zero (`cv08`), tabular digits, strict 600 UPM fixed advance with 0 layout jitter. |

---

## 📐 Parametric Chisel Nib Physical Simulation

Stroke thickness $w(\varphi)$ along drawing vector angle $\varphi$ with chisel angle $\theta = 45^\circ$, primary nib width $a$, and edge thickness $b$:

$$w(\varphi) = \sqrt{\left(a \cos(\varphi - \theta)\right)^2 + \left(b \sin(\varphi - \theta)\right)^2}$$

- **Stroke Inktraps**: Negative internal junction corners cut back by $18\text{--}24\text{ UPM}$ to eliminate optical ink pooling at 5–8 pt rendering sizes.
- **Node Precision**: All Bézier control points and on-curve vertices MUST snap to integer coordinates on the 1000 UPM EM-square grid. No floating-point coordinates in production TTF tables.
- **Zero Duplicate Nodes**: Successive contour points with identical $(x, y)$ are strictly forbidden by OTS memory-safety filters.

---

## 🔬 Multi-Script ISMP Clinical Disambiguation Invariants

1. **Alphanumeric Disambiguation (Latin / Numbers)**:
   - Slashed Zero (`cv08`): Prevents confusion with capital `O` in medication dosages (`10 mg` vs `1O mg`).
   - Curved Lowercase `l` (`cv05`): Curved bottom hook prevents confusion with numeral `1` or uppercase `I`.
   - Serifed Uppercase `I` (`ss02`): Distinct top and bottom serifs.
2. **Canadian Aboriginal Syllabics (UCAS - Inuktitut / Cree)**:
   - $\Delta$ Rotational Cardinality Invariant: Minimum $>30^\circ$ angular separation between rotational vowels (`ᐃ`, `ᐅ`, `ᐊ`, `ᐁ`).
   - Diacritic Superdot Clearance: Elevation minimum $1.2\times$ baseline cap height to prevent collision in multi-point diacritic clusters (`ᐄ`, `ᐆ`, `ᐋ`).
   - Coda Final Elevation: Upper-40% bounding box positioning (`ᒃ`, `ᒡ`, `ᒻ`, `ᓐ`, `ᔅ`).
3. **Chinuk Pipa / Duployan Shorthand**:
   - Euclidean Vector Angle Invariant: $>15^\circ$ angular separation between adjacent phonetic strokes.
   - Circle Vowel Counter-Dilation: Inner counter diameter $\ge 2.2\times$ stroke line weight to prevent closed-loop ink pooling at reading speeds.
   - Kamloops Crossed Saltire Delimiter: Distinct glyph boundary punctuation (`𛲟` `U+1BC9F`).
4. **Right-to-Left (Arabic / Hebrew)**:
   - Bidirectional Numeric Isolation: Enforce `<bdi dir="ltr">` wrapper tags on all numeric dosage strings to prevent catastrophic digit transposition (`15 mg` reversing to `51 mg`).
5. **Indic & Devanagari**:
   - Shirorekha Hanging Baseline: Unified horizontal header line at $y = 720$ with guaranteed sub-baseline conjunct clearance.

---

## 🎨 Landmark Architectural Triad Generation Protocol

Every script release or milestone MUST generate the complete 3-Plate Landmark Specimen Triad at 300 DPI master print resolution ($3840 \times 2160\text{ px}$):

```
documentation/images/<script>/
├── <script>_type_engineering_specimen.png   (Plate 1: Engineering Grid)
├── <script>_telemetry_type_specimen.png          (Plate 2: Telemetry HUD)
├── <script>_pedagogical_typeface.png             (Plate 3: Pedagogical Washi)
├── vector_specimens/
│   ├── plate1_engineering_grid.svg
│   ├── plate2_telemetry_hud.svg
│   └── plate3_pedagogical_washi.svg
```

### Plate Characteristics:
- **Plate 1 (Engineering Grid)**: Deep blueprint slate background (`#0D1117`), 1000 UPM grid markings, Bézier curve control handles, inktrap cutaway callouts, and Sloan 5:1 aspect ratios.
- **Plate 2 (Telemetry HUD)**: Dark obsidian cockpit interface (`#09090B`), emergency vitals telemetry, ISMP disambiguation badges, real-time audio waveform graphs, and tabular biometrics.
- **Plate 3 (Pedagogical Washi)**: Historic handmade washi/parchment background (`#F9F6F0`), high-legibility typographic specimens, cultural sovereignty attributions, and full phonological vowel/consonant matrix.

---

## 🚀 5-Phase Zero-Tofu Release Protocol & SemVer 2.0.0

1. **Phonological Matrix Definition**: Codify orthography into `fonts/<script>_matrix.json`.
2. **Procedural Vector Synthesis**: Generate TTF contours via parametric physical equations in Dart or Python.
3. **34/34 Pre-Flight Verification**: Run font validation suite ensuring 0 errors.
4. **300 DPI Landmark Architectural Triad**: Generate print plates and vector SVGs.
5. **CERN Zenodo Immutable Archival**: Commit release tag, build GitHub release assets, and update persistent Zenodo DOI.

---

## 🧪 Verification Commands

```powershell
# Run 34/34 Google Fonts & OTS checks
uv --directory ../pocketgull-typeface run python sources/validate_fonts.py

# Inspect glyph coverage and name tables
uv --directory ../pocketgull-typeface run python -c "from fontTools.ttLib import TTFont; f=TTFont('fonts/ttf/PocketGull-Fineliner.ttf'); print(f'Glyphs: {len(f.getGlyphOrder())}')"

# Run landmark plate generation script (Dart Randal L. Schwartz Standard)
dart run ../pocketgull-typeface/tool/generate_<script>_specimens.dart
```
