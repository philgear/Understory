import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IGlyphSpec {
  char: string;
  name: string;
  category: 'uppercase' | 'lowercase' | 'numeral' | 'symbol';
  svgPath: string;
  width: number;
}

@Component({
  selector: 'app-pocketgull-typeface-specimen',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl space-y-8 font-sans">
      
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-2xl shadow-lg">
            📐
          </div>
          <div>
            <h2 class="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight font-pocketgull">
              PocketGull Variable Superfamily Foundry Specimen
            </h2>
            <p class="text-xs text-amber-700 dark:text-amber-300 font-medium">
              TrueType &amp; SVG glyph vector engine with mathematical Bézier curvature, optical overshoot, and clinical telemetry standards.
            </p>
          </div>
        </div>

        <!-- Specimen Mode Switcher -->
        <div class="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-amber-500/30 text-xs font-mono">
          <button
            (click)="activeSpecimenTab.set('sandbox')"
            [class.bg-amber-500]="activeSpecimenTab() === 'sandbox'"
            [class.text-zinc-950]="activeSpecimenTab() === 'sandbox'"
            [class.font-bold]="activeSpecimenTab() === 'sandbox'"
            class="px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            ✍️ Type Sandbox
          </button>
          <button
            (click)="activeSpecimenTab.set('telemetry')"
            [class.bg-cyan-500]="activeSpecimenTab() === 'telemetry'"
            [class.text-zinc-950]="activeSpecimenTab() === 'telemetry'"
            [class.font-bold]="activeSpecimenTab() === 'telemetry'"
            class="px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            🩺 Telemetry &amp; Glyphs
          </button>
          <button
            (click)="activeSpecimenTab.set('grid')"
            [class.bg-emerald-500]="activeSpecimenTab() === 'grid'"
            [class.text-zinc-950]="activeSpecimenTab() === 'grid'"
            [class.font-bold]="activeSpecimenTab() === 'grid'"
            class="px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            📏 Grid &amp; Overshoot
          </button>
          <button
            (click)="activeSpecimenTab.set('ladder')"
            [class.bg-rose-500]="activeSpecimenTab() === 'ladder'"
            [class.text-zinc-950]="activeSpecimenTab() === 'ladder'"
            [class.font-bold]="activeSpecimenTab() === 'ladder'"
            class="px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            🪜 Optical Ladder (100–900)
          </button>
        </div>
      </div>

      <!-- TAB 1: Live Type Preview Sandbox -->
      @if (activeSpecimenTab() === 'sandbox') {
        <div class="space-y-6 animate-in fade-in duration-200">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                Interactive Type Sandbox
              </label>
              <div class="flex items-center gap-2 text-xs font-mono">
                <span class="text-zinc-400">Node Inspector:</span>
                <button
                  (click)="showBezierNodes.set(!showBezierNodes())"
                  [class.bg-emerald-500/20]="showBezierNodes()"
                  [class.text-emerald-400]="showBezierNodes()"
                  [class.border-emerald-500]="showBezierNodes()"
                  class="px-2.5 py-0.5 rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  {{ showBezierNodes() ? '🟢 Bézier Handles ON' : '⚪ Curves ON' }}
                </button>
              </div>
            </div>
            <input 
              type="text" 
              [value]="previewText()" 
              (input)="updateText($event)"
              class="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-2xl text-lg font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Type in PocketGull Superfamily..."
            />
          </div>

          <!-- Marker Rendering Output Box -->
          <div class="p-8 bg-amber-50/80 dark:bg-zinc-900/90 border border-amber-300 dark:border-zinc-800 rounded-2xl shadow-inner min-h-[140px] flex items-center justify-center overflow-x-auto relative">
            <div class="flex items-center gap-2 flex-wrap justify-center">
              @for (char of previewTextArray(); track $index) {
                @if (char === ' ') {
                  <span class="w-6 inline-block"></span>
                } @else {
                  <div class="relative group">
                    <svg class="w-9 h-12 text-zinc-950 dark:text-amber-400 drop-shadow-sm transition-transform hover:scale-110" viewBox="0 0 100 120">
                      <path [attr.d]="getGlyphPath(char)" stroke="currentColor" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                      @if (showBezierNodes()) {
                        <!-- Extrema Nodes -->
                        <circle cx="50" cy="20" r="3" fill="#10b981" />
                        <circle cx="50" cy="100" r="3" fill="#10b981" />
                        <circle cx="20" cy="60" r="3" fill="#06b6d4" />
                        <circle cx="80" cy="60" r="3" fill="#06b6d4" />
                      }
                    </svg>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Character Set Grid -->
          <div class="space-y-3">
            <h3 class="text-sm font-black uppercase text-zinc-800 dark:text-zinc-200 tracking-wide">
              Glyph Palette &amp; Diacritics
            </h3>
            <div class="grid grid-cols-6 sm:grid-cols-12 gap-2">
              @for (glyph of glyphCatalog; track glyph.char) {
                <div class="p-2 bg-white dark:bg-zinc-950 border border-amber-500/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-amber-500/60 transition cursor-pointer" (click)="appendChar(glyph.char)">
                  <svg class="w-6 h-7 text-zinc-900 dark:text-zinc-100" viewBox="0 0 100 120">
                    <path [attr.d]="glyph.svgPath" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                  </svg>
                  <span class="text-[9px] font-mono text-zinc-500 uppercase">{{ glyph.char }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: Telemetry & Clinical Glyphs Specimen (Sheet 1) -->
      @if (activeSpecimenTab() === 'telemetry') {
        <div class="space-y-6 animate-in fade-in duration-200">
          <div class="p-6 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-6 text-zinc-100">
            <div class="flex items-center justify-between border-b border-cyan-500/20 pb-3 font-mono text-xs">
              <span class="text-cyan-400 font-bold uppercase tracking-wider">Clinical Disambiguation Matrix (ISMP / FDA Standards)</span>
              <span class="text-zinc-500">ISO/IEC 10646 Healthcare</span>
            </div>

            <!-- Disambiguation Pairs -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-zinc-900/80 border border-cyan-500/20 rounded-xl space-y-2">
                <div class="text-xs text-zinc-400 font-mono">Zero vs Capital O</div>
                <div class="flex items-center justify-around py-2">
                  <div class="text-center">
                    <div class="text-4xl font-mono font-bold text-cyan-400">Ø</div>
                    <div class="text-[10px] text-zinc-400 font-mono mt-1">Slashed Zero</div>
                  </div>
                  <span class="text-zinc-600 font-mono">vs</span>
                  <div class="text-center">
                    <div class="text-4xl font-sans font-bold text-zinc-200">O</div>
                    <div class="text-[10px] text-zinc-400 font-mono mt-1">Capital Letter O</div>
                  </div>
                </div>
                <p class="text-[10px] text-zinc-400">Prevents fatal 10x dosing calculation errors (e.g. 50 mg vs 500 mg).</p>
              </div>

              <div class="p-4 bg-zinc-900/80 border border-cyan-500/20 rounded-xl space-y-2">
                <div class="text-xs text-zinc-400 font-mono">One vs Lowercase l vs Capital I</div>
                <div class="flex items-center justify-around py-2">
                  <div class="text-center">
                    <div class="text-4xl font-mono font-bold text-cyan-400">1</div>
                    <div class="text-[10px] text-zinc-400 font-mono mt-1">Serifed 1</div>
                  </div>
                  <span class="text-zinc-600 font-mono">vs</span>
                  <div class="text-center">
                    <div class="text-4xl font-sans font-bold text-emerald-400">l</div>
                    <div class="text-[10px] text-zinc-400 font-mono mt-1">Curved l</div>
                  </div>
                  <span class="text-zinc-600 font-mono">vs</span>
                  <div class="text-center">
                    <div class="text-4xl font-mono font-bold text-zinc-200">I</div>
                    <div class="text-[10px] text-zinc-400 font-mono mt-1">Serifed I</div>
                  </div>
                </div>
                <p class="text-[10px] text-zinc-400">Essential for LASA (Look-Alike / Sound-Alike) drug name safety.</p>
              </div>

              <div class="p-4 bg-zinc-900/80 border border-cyan-500/20 rounded-xl space-y-2">
                <div class="text-xs text-zinc-400 font-mono">Seven vs Capital T</div>
                <div class="flex items-center justify-around py-2">
                  <div class="text-center">
                    <div class="text-4xl font-mono font-bold text-cyan-400">7</div>
                    <div class="text-[10px] text-zinc-400 font-mono mt-1">Cross-bar 7</div>
                  </div>
                  <span class="text-zinc-600 font-mono">vs</span>
                  <div class="text-center">
                    <div class="text-4xl font-sans font-bold text-zinc-200">T</div>
                    <div class="text-[10px] text-zinc-400 font-mono mt-1">Capital T</div>
                  </div>
                </div>
                <p class="text-[10px] text-zinc-400">Rapid triage chart reading during high-velocity surgical intake.</p>
              </div>
            </div>

            <!-- Medical Units & Symbols -->
            <div class="p-4 bg-zinc-900/80 border border-slate-800 rounded-xl space-y-3 font-mono">
              <div class="text-xs font-bold text-emerald-400 uppercase">Optical Ligatures &amp; Tabular Units</div>
              <div class="flex flex-wrap items-center gap-6 text-sm">
                <div class="flex items-center gap-2"><span class="text-zinc-400">Micrograms:</span> <strong class="text-cyan-300 text-lg">mcg <span class="text-xs text-rose-400 font-normal">[ISMP: avoid µg]</span></strong></div>
                <div class="flex items-center gap-2"><span class="text-zinc-400">Milligrams per dL:</span> <strong class="text-cyan-300 text-lg">mg/dL</strong></div>
                <div class="flex items-center gap-2"><span class="text-zinc-400">Blood Pressure:</span> <strong class="text-cyan-300 text-lg">mmHg</strong></div>
                <div class="flex items-center gap-2"><span class="text-zinc-400">Heart Rate:</span> <strong class="text-rose-400 text-lg">72 bpm</strong></div>
                <div class="flex items-center gap-2"><span class="text-zinc-400">SpO₂ Pulse:</span> <strong class="text-emerald-400 text-lg">98%</strong></div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: Geometric Grid & Optical Overshoot (Sheet 2) -->
      @if (activeSpecimenTab() === 'grid') {
        <div class="space-y-6 animate-in fade-in duration-200">
          <div class="p-6 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-4 text-zinc-100 font-mono">
            <div class="flex items-center justify-between border-b border-emerald-500/20 pb-3 text-xs">
              <span class="text-emerald-400 font-bold uppercase tracking-wider">TrueType 1000 UPM Grid &amp; Optical Overshoot Alignment</span>
              <span class="text-zinc-500">Cap: 800 • X-Height: 520 • Baseline: 0 • Descender: -200</span>
            </div>

            <!-- SVG Grid Diagram -->
            <div class="p-6 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-x-auto">
              <svg viewBox="0 0 800 240" class="w-full max-w-2xl h-auto">
                <!-- Guide Lines -->
                <line x1="20" y1="30" x2="780" y2="30" stroke="#f43f5e" stroke-dasharray="4,4" stroke-width="1.5" />
                <text x="710" y="24" fill="#f43f5e" font-size="10">OVERSHOOT (820)</text>

                <line x1="20" y1="50" x2="780" y2="50" stroke="#38bdf8" stroke-width="1.5" />
                <text x="710" y="44" fill="#38bdf8" font-size="10">CAP-HEIGHT (800)</text>

                <line x1="20" y1="110" x2="780" y2="110" stroke="#10b981" stroke-width="1.5" />
                <text x="710" y="104" fill="#10b981" font-size="10">X-HEIGHT (520)</text>

                <line x1="20" y1="170" x2="780" y2="170" stroke="#fbbf24" stroke-width="2" />
                <text x="710" y="164" fill="#fbbf24" font-size="10">BASELINE (0)</text>

                <line x1="20" y1="190" x2="780" y2="190" stroke="#f43f5e" stroke-dasharray="4,4" stroke-width="1.5" />
                <text x="710" y="186" fill="#f43f5e" font-size="10">OVERSHOOT (-20)</text>

                <!-- Specimen Characters: H (flat) and O (round with overshoot) -->
                <!-- H -->
                <path d="M 120 50 L 120 170 M 120 110 L 200 110 M 200 50 L 200 170" fill="none" stroke="#f8fafc" stroke-width="16" stroke-linecap="square" />
                <text x="140" y="220" fill="#94a3b8" font-size="12">Flat Edge (Exact 800 / 0)</text>

                <!-- O (with optical overshoot) -->
                <path d="M 360 30 C 300 30, 270 90, 270 110 C 270 130, 300 190, 360 190 C 420 190, 450 130, 450 110 C 450 90, 420 30, 360 30 Z" fill="none" stroke="#38bdf8" stroke-width="16" />
                <text x="300" y="220" fill="#38bdf8" font-size="12">Round Overshoot (+20 / -20)</text>

                <!-- Slashed Zero -->
                <path d="M 580 30 C 530 30, 510 90, 510 110 C 510 130, 530 190, 580 190 C 630 190, 650 130, 650 110 C 650 90, 630 30, 580 30 Z" fill="none" stroke="#10b981" stroke-width="16" />
                <line x1="535" y1="160" x2="625" y2="60" stroke="#10b981" stroke-width="10" stroke-linecap="round" />
                <text x="540" y="220" fill="#10b981" font-size="12">Slashed Zero Ø</text>
              </svg>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: Variable Superfamily Weight Ladder (Sheet 3 & 4) -->
      @if (activeSpecimenTab() === 'ladder') {
        <div class="space-y-6 animate-in fade-in duration-200">
          <div class="p-6 bg-slate-950 border border-rose-500/30 rounded-2xl space-y-6 text-zinc-100 font-sans">
            <div class="flex items-center justify-between border-b border-rose-500/20 pb-3 text-xs font-mono">
              <span class="text-rose-400 font-bold uppercase tracking-wider">Living Brand Optical Weight Ladder (100–900)</span>
              <span class="text-zinc-500">Origami Gull Palette</span>
            </div>

            <!-- Optical Weights List -->
            <div class="space-y-4">
              <!-- 100 Fineliner -->
              <div class="p-4 bg-zinc-900/60 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span class="text-xs font-mono text-zinc-400 w-36">100 Fineliner</span>
                <span class="text-2xl font-light tracking-wide text-zinc-200">
                  SPHINX OF BLACK QUARTZ, JUDGE MY VOW.
                </span>
              </div>

              <!-- 300 Light -->
              <div class="p-4 bg-zinc-900/60 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span class="text-xs font-mono text-zinc-400 w-36">300 Light</span>
                <span class="text-2xl font-normal tracking-wide text-zinc-200">
                  PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS.
                </span>
              </div>

              <!-- 500 Medium -->
              <div class="p-4 bg-zinc-900/60 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span class="text-xs font-mono text-cyan-400 w-36">500 Medium</span>
                <span class="text-2xl font-medium tracking-normal text-cyan-300 font-pocketgull">
                  THE QUICK BROWN FOX JUMPS OVER THE LAZY.
                </span>
              </div>

              <!-- 700 Bold Display -->
              <div class="p-4 bg-zinc-900/60 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span class="text-xs font-mono text-amber-400 w-36">700 Bold Display</span>
                <span class="text-3xl font-bold tracking-tight text-amber-300 font-pocketgull uppercase">
                  POCKETGULL LIVING BRAND TYPEFACE
                </span>
              </div>

              <!-- 900 Chiseltip Black -->
              <div class="p-4 bg-zinc-900/60 rounded-xl border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span class="text-xs font-mono text-rose-400 w-36">900 Chiseltip</span>
                <span class="text-3xl font-black tracking-tighter text-zinc-100 uppercase font-pocketgull">
                  POCKETGULL: AN ADVENTURE IN FORM &amp; FUNCTION
                </span>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class PocketgullTypefaceSpecimenComponent {
  activeSpecimenTab = signal<'sandbox' | 'telemetry' | 'grid' | 'ladder'>('sandbox');
  previewText = signal('PocketGull 2026');
  showBezierNodes = signal<boolean>(false);

  previewTextArray = computed(() => this.previewText().split(''));

  readonly glyphCatalog: IGlyphSpec[] = [
    { char: 'P', name: 'Capital P', category: 'uppercase', width: 80, svgPath: 'M 25 15 L 25 105 M 25 15 C 65 15, 75 35, 75 50 C 75 65, 65 70, 25 70' },
    { char: 'o', name: 'Lowercase o', category: 'lowercase', width: 70, svgPath: 'M 50 45 C 25 45, 20 85, 50 85 C 80 85, 75 45, 50 45 Z' },
    { char: 'c', name: 'Lowercase c', category: 'lowercase', width: 65, svgPath: 'M 70 50 C 40 40, 20 60, 30 80 C 40 95, 70 85, 75 80' },
    { char: 'k', name: 'Lowercase k', category: 'lowercase', width: 70, svgPath: 'M 25 15 L 25 105 M 25 65 L 70 40 M 35 60 L 75 105' },
    { char: 'e', name: 'Lowercase e', category: 'lowercase', width: 65, svgPath: 'M 20 65 L 75 65 C 75 40, 45 40, 35 55 C 20 75, 45 90, 75 80' },
    { char: 't', name: 'Lowercase t', category: 'lowercase', width: 60, svgPath: 'M 45 20 L 45 95 C 45 105, 65 105, 75 95 M 20 45 L 75 45' },
    { char: 'G', name: 'Capital G', category: 'uppercase', width: 85, svgPath: 'M 75 35 C 50 15, 20 30, 20 60 C 20 90, 50 105, 75 85 L 75 60 L 50 60' },
    { char: 'u', name: 'Lowercase u', category: 'lowercase', width: 70, svgPath: 'M 25 45 L 25 80 C 25 95, 65 95, 65 80 L 65 45' },
    { char: 'l', name: 'Lowercase l', category: 'lowercase', width: 40, svgPath: 'M 40 15 L 40 95 C 40 105, 55 105, 65 95' },
    { char: '0', name: 'Numeral 0', category: 'numeral', width: 70, svgPath: 'M 50 20 C 25 20, 20 60, 20 60 C 20 90, 50 100, 50 100 C 75 100, 80 60, 80 60 C 80 20, 50 20, 50 20 Z M 30 85 L 70 35' },
    { char: '1', name: 'Numeral 1', category: 'numeral', width: 45, svgPath: 'M 35 30 L 50 15 L 50 100 M 30 100 L 70 100' },
    { char: '2', name: 'Numeral 2', category: 'numeral', width: 70, svgPath: 'M 25 40 C 25 20, 75 20, 75 45 C 75 65, 25 85, 25 100 L 80 100' },
    { char: '3', name: 'Numeral 3', category: 'numeral', width: 70, svgPath: 'M 25 25 L 75 25 L 45 55 C 70 55, 80 75, 65 95 C 45 105, 25 90, 25 90' },
    { char: '4', name: 'Numeral 4', category: 'numeral', width: 70, svgPath: 'M 60 15 L 20 65 L 75 65 M 60 15 L 60 100' },
    { char: '5', name: 'Numeral 5', category: 'numeral', width: 70, svgPath: 'M 75 20 L 30 20 L 25 50 C 45 40, 75 45, 75 75 C 75 100, 30 100, 25 85' },
    { char: '6', name: 'Numeral 6', category: 'numeral', width: 70, svgPath: 'M 70 30 C 50 15, 25 35, 25 65 C 25 90, 70 90, 70 65 C 70 45, 30 45, 25 65' },
    { char: '7', name: 'Numeral 7', category: 'numeral', width: 70, svgPath: 'M 20 20 L 80 20 L 40 100 M 35 60 L 65 60' },
    { char: '8', name: 'Numeral 8', category: 'numeral', width: 70, svgPath: 'M 50 15 C 30 15, 30 50, 50 50 C 70 50, 70 15, 50 15 Z M 50 50 C 25 50, 25 100, 50 100 C 75 100, 75 50, 50 50 Z' },
    { char: '9', name: 'Numeral 9', category: 'numeral', width: 70, svgPath: 'M 75 50 C 70 30, 30 30, 30 50 C 30 70, 75 70, 75 50 Z M 75 50 L 55 100' },
    { char: 'I', name: 'Serifed I', category: 'uppercase', width: 45, svgPath: 'M 25 15 L 75 15 M 50 15 L 50 105 M 25 105 L 75 105' },
    { char: 'µ', name: 'Micro Symbol', category: 'symbol', width: 70, svgPath: 'M 25 45 L 25 115 M 25 80 C 25 95, 65 95, 65 80 L 65 45' },
    { char: '±', name: 'Plus-Minus', category: 'symbol', width: 65, svgPath: 'M 25 35 L 75 35 M 50 10 L 50 60 M 25 80 L 75 80' },
    { char: '%', name: 'Percent Symbol', category: 'symbol', width: 80, svgPath: 'M 25 30 A 8 8 0 1 1 35 30 M 75 20 L 25 90 M 65 80 A 8 8 0 1 1 75 80' }
  ];

  updateText(event: Event) {
    const input = event.target as HTMLInputElement;
    this.previewText.set(input.value);
  }

  appendChar(char: string) {
    this.previewText.update(text => text + char);
  }

  getGlyphPath(char: string): string {
    const upper = char.toUpperCase();
    const glyph = this.glyphCatalog.find(g => g.char === char || g.char === upper);
    if (glyph) return glyph.svgPath;
    
    const code = char.charCodeAt(0);
    const p1 = (code % 30) + 15;
    const p2 = ((code * 7) % 40) + 45;
    const p3 = ((code * 13) % 40) + 50;
    return `M 20 ${p1} L ${p2} ${p1} L ${p2 - 10} 95 M 20 ${p2} L ${p3} ${p2}`;
  }
}

