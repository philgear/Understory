---
name: font-tooling-hygiene
description: Operational hygiene, environment isolation, cross-platform CLI troubleshooting, and Randal L. Schwartz Dart/Python tooling invariants for the PocketGull typography pipeline.
---

# 🛡️ Font Tooling Hygiene & Pipeline Diagnostics Skill

This skill documents critical environment isolation, runtime sandboxing, and compiler hygiene invariants discovered across the **PocketGull Typefoundry** procedural toolchain (Dart 3, Python `fontTools`, and headless WSL/Linux Inkscape).

---

## 🔀 1. Environment & Package Manager Isolation

### The Problem
The root `pocketgull` workspace is an Angular 22 Node/TypeScript monorepo whose local Python environment lacks font engineering packages (`fonttools`, `opentype-sanitizer`, `brotli`). Attempting to run `python -c "from fontTools..."` in the root workspace throws `ModuleNotFoundError: No module named 'fontTools'`.

### The Invariant
Always invoke Python font tooling via directory-pinned `uv`:
```powershell
# CORRECT: Targets the typeface repository's pyproject.toml environment
uv --directory ../pocketgull-typeface run python sources/validate_fonts.py

# INCORRECT: Uses root workspace ambient python environment
python sources/validate_fonts.py
```

---

## 🎯 2. Dart Multiline Template Invariants (Randal L. Schwartz Standard)

### The Problem
When generating SVG specimens, XML files, or CSS templates from Dart scripts (`dart run tool/generate_specimens.dart`), literal dollar signs (e.g. `$25.00`, CSS variable references, or inline LaTeX `\$`) trigger the Dart runtime compiler error:
`Error: A '$' has special meaning inside a string, and must be followed by an identifier or an expression in curly braces`

### The Invariant
1. Use **Raw Multiline Strings** for SVG/XML templates:
   ```dart
   final svgContent = r'''
   <svg viewBox="0 0 3840 2160">
     <!-- Literal $ characters are completely safe here -->
     <text>$25.00 USD / dosage</text>
   </svg>
   ''';
   ```
2. When template interpolation is required, explicitly escape all non-interpolated dollar signs as `\$`.

---

## 🖼️ 3. Headless Vector Rasterization (Inkscape CLI)

### The Problem
Headless vector rasterization on CI/CD runners or WSL (`inkscape --export-type=png --export-filename=...`) has two strict limitations:
1. **`<feDropShadow>` Filter Failure**: Modern SVG `<filter>` tags with `<feDropShadow>` cause headless Inkscape to drop elements, clip viewports, or throw segmentation faults.
2. **Web Font `@import` Inability**: Headless CLI rendering does not fetch remote CSS `@import url('https://fonts.googleapis.com/...')`.

### The Invariant
1. **Primitive SVG Shadows**: Render shadows using stacked geometric rectangle or path primitives with calibrated opacity (`fill="black" opacity="0.12"`).
2. **Local Fontconfig & Inline Fallbacks**: Use system-installed font family names (`font-family: 'PocketGull-Fineliner', 'DejaVu Sans', 'Arial', sans-serif;`) and declare explicit `@font-face` blocks pointing to local TTF files if necessary.

---

## 🔍 4. OpenType Table & Memory Safety (OTS Guard)

Before distributing any compiled font:
1. Ensure **Zero Duplicate Nodes**: OTS (OpenType Sanitizer) used by Chrome and Firefox will reject fonts with consecutive identical contour points.
2. Ensure **Integer Coordinates**: TrueType `glyf` coordinates must be integer values. Round all Bézier curve evaluations before emitting TTF outlines.
3. Ensure **Table Symmetry**: Check that `hhea`, `OS/2`, and `head` tables report identical ascender, descender, and bounding box parameters.

---

## 🛠️ Diagnostics Cheat Sheet

| Symptom | Root Cause | Remediation |
| :--- | :--- | :--- |
| `ModuleNotFoundError: fontTools` | Running `python` in wrong cwd | Run with `uv --directory ../pocketgull-typeface run ...` |
| `Error: A '$' has special meaning` | Dart unescaped string interpolation | Use `r'''...'''` or `\$` |
| Inkscape CLI outputs blank PNG | SVG uses `<feDropShadow>` | Replace filter with native SVG `<rect>` shadow |
| Chrome fails to load webfont | Duplicate nodes or OTS rejection | Run `sources/validate_fonts.py` |
