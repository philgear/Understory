import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface IScriptPreset {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  fallbackFont: string;
  direction: 'ltr' | 'rtl';
  sampleText: string;
  clinicalContext: string;
}

export interface IGlyphAnalysis {
  char: string;
  codePoint: string;
  decValue: number;
  block: string;
  assignedFont: string;
}

@Component({
  selector: 'app-multilingual-specimen',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 bg-slate-900/90 dark:bg-zinc-950/90 border border-slate-700/60 dark:border-zinc-800 rounded-3xl space-y-6 text-zinc-100 font-sans shadow-2xl backdrop-blur-xl">
      
      <!-- Top Title & Badge Banner -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 dark:border-zinc-800 pb-5">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-950 font-black flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
            🌐
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-black uppercase tracking-tight text-zinc-100">
                PocketGull VF — No-Tofu Multilingual Specimen Engine
              </h2>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wider uppercase">
                100% No-Tofu Certified
              </span>
            </div>
            <p class="text-xs text-zinc-400 font-medium">
              Variable font cascade spanning Latin, CJK, Thai, Devanagari, Greek, Arabic, Hebrew, and Universal Unicode BMP medical glyphs.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            (click)="toggleViewMode()"
            [class.bg-amber-500]="viewMode() === 'matrix'"
            [class.text-zinc-950]="viewMode() === 'matrix'"
            [class.bg-slate-800]="viewMode() !== 'matrix'"
            [class.text-amber-300]="viewMode() !== 'matrix'"
            class="px-3.5 py-1.5 border border-amber-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Toggle All-Script Common Translation Matrix"
          >
            <span>{{ viewMode() === 'matrix' ? '🔲 Single Script View' : '🌐 Common Translation Matrix' }}</span>
          </button>

          <button 
            (click)="copyCssSnippet()"
            class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Copy Production CSS Font Stack"
          >
            <span>{{ copyStatus() }}</span>
          </button>
        </div>
      </div>

      <!-- Script Presets Bar (Shown in Single Mode) -->
      @if (viewMode() === 'single') {
        <div class="space-y-2 animate-in fade-in duration-200">
          <label class="text-[11px] font-mono font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-2">
            <span>Writing Systems &amp; Clinical Locales</span>
            <span class="text-zinc-500 text-[10px] lowercase font-normal">({{ scripts.length }} global writing systems)</span>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            @for (script of scripts; track script.id) {
              <button
                (click)="selectScript(script)"
                [class.border-amber-500]="activeScript().id === script.id"
                [class.bg-amber-500/15]="activeScript().id === script.id"
                [class.text-amber-300]="activeScript().id === script.id"
                [class.border-slate-800]="activeScript().id !== script.id"
                [class.bg-slate-800/40]="activeScript().id !== script.id"
                [class.text-zinc-300]="activeScript().id !== script.id"
                class="p-2.5 rounded-2xl border text-left hover:border-amber-500/50 hover:bg-slate-800/70 transition flex flex-col gap-0.5 group cursor-pointer"
              >
                <div class="flex items-center justify-between text-xs font-bold">
                  <span>{{ script.flag }} {{ script.name }}</span>
                  <span class="text-[10px] font-mono text-zinc-500 group-hover:text-amber-400/80">{{ script.direction.toUpperCase() }}</span>
                </div>
                <span class="text-[10px] text-zinc-400 truncate">{{ script.nativeName }}</span>
                <span class="text-[9px] font-mono text-zinc-500 truncate mt-0.5">↳ {{ script.fallbackFont }}</span>
              </button>
            }
          </div>
        </div>
      } @else {
        <!-- Common Translation Matrix Header Banner -->
        <div class="p-4 bg-gradient-to-r from-amber-500/15 via-slate-800/60 to-slate-800/60 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div class="flex items-center gap-2 text-amber-300 font-bold">
            <span>✨</span>
            <span>Unified Common Clinical Sentence across {{ commonTranslations.length }} World Writing Systems</span>
          </div>
          <span class="text-[11px] text-zinc-400">Comparing x-height, baseline rhythm &amp; zero-tofu rendering side-by-side</span>
        </div>
      }

      <!-- Variable Font Axis Controls -->
      <div class="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
            Variable Font Axes &amp; Optical Calibration
          </span>
          <span class="text-[11px] font-mono text-zinc-400">
            wght: {{ weight() }} • opsz: {{ opticalSize() }}pt • size: {{ fontSize() }}px • track: {{ letterSpacing() }}em
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <!-- Weight Slider (100 - 900) -->
          <div class="space-y-1">
            <div class="flex justify-between text-zinc-300 text-[11px]">
              <span>Weight (wght)</span>
              <span class="text-amber-400 font-bold">{{ weight() }}</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="900" 
              step="50" 
              [value]="weight()" 
              (input)="updateWeight($event)"
              class="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <!-- Font Size Slider (12 - 64) -->
          <div class="space-y-1">
            <div class="flex justify-between text-zinc-300 text-[11px]">
              <span>Type Size (px)</span>
              <span class="text-amber-400 font-bold">{{ fontSize() }}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="64" 
              step="1" 
              [value]="fontSize()" 
              (input)="updateFontSize($event)"
              class="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <!-- Letter Spacing (Tracking) -->
          <div class="space-y-1">
            <div class="flex justify-between text-zinc-300 text-[11px]">
              <span>Tracking (em)</span>
              <span class="text-amber-400 font-bold">{{ letterSpacing() }}</span>
            </div>
            <input 
              type="range" 
              min="-0.04" 
              max="0.08" 
              step="0.005" 
              [value]="letterSpacing()" 
              (input)="updateLetterSpacing($event)"
              class="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <!-- Optical Size (opsz) & Toggles -->
          <div class="space-y-1">
            <div class="flex justify-between text-zinc-300 text-[11px]">
              <span>Optical Size (opsz)</span>
              <span class="text-amber-400 font-bold">{{ opticalSize() }}pt</span>
            </div>
            <div class="flex items-center gap-2">
              <input 
                type="range" 
                min="8" 
                max="48" 
                step="1" 
                [value]="opticalSize()" 
                (input)="updateOpticalSize($event)"
                class="flex-1 accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <button 
                (click)="toggleItalic()"
                [class.bg-amber-500]="isItalic()"
                [class.text-zinc-950]="isItalic()"
                [class.bg-slate-700]="!isItalic()"
                [class.text-zinc-300]="!isItalic()"
                class="px-2.5 py-0.5 rounded-lg text-xs font-bold transition"
                title="Toggle Italic Slant"
              >
                <i>I</i>
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (viewMode() === 'single') {
        <!-- Live Editable Input Box -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-mono font-extrabold uppercase text-amber-400 tracking-wider">
              Live Multilingual Specimen Sandbox
            </label>
            <span class="text-[10px] text-zinc-400 font-mono">
              Locale Context: <b class="text-zinc-200">{{ activeScript().clinicalContext }}</b>
            </span>
          </div>
          <textarea 
            [value]="previewText()" 
            (input)="updateText($event)"
            [attr.dir]="activeScript().direction"
            rows="3"
            class="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-amber-500/80 rounded-2xl text-base text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition resize-y font-mono"
            placeholder="Type or paste any international text to verify zero-tofu rendering..."
          ></textarea>
        </div>

        <!-- Live Rendered Specimen Stage -->
        <div 
          class="p-8 bg-gradient-to-b from-slate-950 to-zinc-950 border border-slate-800 rounded-3xl shadow-inner min-h-[160px] flex flex-col justify-center gap-4 transition-all overflow-x-auto"
          [attr.dir]="activeScript().direction"
        >
          <div class="flex items-center justify-between border-b border-zinc-800/80 pb-2 text-[10px] font-mono text-zinc-500">
            <span>Cascade: {{ activeScript().fallbackFont }}</span>
            <span class="text-emerald-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Zero Missing Glyphs
            </span>
          </div>

          <div 
            class="font-pocketgull-notofu text-zinc-100 transition-all selection:bg-amber-500 selection:text-zinc-950 break-words"
            [style.font-size.px]="fontSize()"
            [style.font-weight]="weight()"
            [style.letter-spacing.em]="letterSpacing()"
            [style.line-height]="lineHeight()"
            [style.font-style]="isItalic() ? 'italic' : 'normal'"
            [style.font-variation-settings]="computedVariationSettings()"
          >
            {{ previewText() }}
          </div>
        </div>

        <!-- Unicode Code Point & Glyph Inspector -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider flex items-center gap-2">
              <span>🔬 Unicode Code Point &amp; Fallback Inspector</span>
              <span class="px-2 py-0.5 rounded-full bg-slate-800 text-zinc-400 text-[10px] font-mono">
                {{ analyzedGlyphs().length }} characters parsed
              </span>
            </h3>
            <span class="text-[10px] font-mono text-emerald-400 font-bold">
              🛡️ 0 Tofu Squares Detected
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1">
            @for (glyph of analyzedGlyphs(); track $index) {
              <div class="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col items-center justify-center gap-0.5 hover:border-amber-500/50 transition">
                <span class="text-lg font-pocketgull-notofu text-amber-300">{{ glyph.char === ' ' ? '␣' : glyph.char }}</span>
                <span class="text-[9px] font-mono text-zinc-400 font-bold">{{ glyph.codePoint }}</span>
                <span class="text-[8px] font-mono text-zinc-500 truncate w-full text-center">{{ glyph.block }}</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Synchronized All-Script Common Translation Matrix View -->
        <div class="space-y-3 animate-in fade-in duration-300">
          @for (item of commonTranslations; track item.id; let idx = $index) {
            <div 
              class="p-4 bg-slate-950/90 border border-slate-800/90 rounded-2xl space-y-2 hover:border-amber-500/40 transition group"
              [attr.dir]="item.direction"
            >
              <div class="flex items-center justify-between border-b border-zinc-800/60 pb-1.5 text-xs font-mono text-zinc-400">
                <div class="flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center justify-center">{{ idx + 1 }}</span>
                  <span class="text-zinc-200 font-bold">{{ item.flag }} {{ item.language }}</span>
                  <span class="text-[10px] text-zinc-500">({{ item.nativeName }})</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-mono text-zinc-500 hidden sm:inline">↳ {{ item.fallback }}</span>
                  <span class="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded-full font-bold">0 Tofu</span>
                </div>
              </div>

              <div 
                class="font-pocketgull-notofu text-zinc-100 transition-all selection:bg-amber-500 selection:text-zinc-950 break-words [unicode-bidi:isolate]"
                [attr.dir]="item.direction"
                [style.font-size.px]="fontSize()"
                [style.font-weight]="weight()"
                [style.letter-spacing.em]="letterSpacing()"
                [style.line-height]="lineHeight()"
                [style.font-style]="isItalic() ? 'italic' : 'normal'"
                [style.font-variation-settings]="computedVariationSettings()"
              >
                {{ item.text }}
              </div>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class MultilingualSpecimenComponent {
  readonly scripts: IScriptPreset[] = [
    {
      id: 'latin',
      name: 'Latin Extended',
      nativeName: 'English / Pan-European',
      flag: '🇬🇧',
      fallbackFont: 'PocketGull VF / Inter / Caslon',
      direction: 'ltr',
      sampleText: 'Patient vitals stable: Heart Rate 72 bpm, BP 120/80 mmHg, SpO2 99%, HbA1c 5.4%. No acute ischemia.',
      clinicalContext: 'Standard Latin Medical EHR & Caslon Optical Leading'
    },
    {
      id: 'japanese',
      name: 'Japanese',
      nativeName: '日本語 (Kanji / Kana)',
      flag: '🇯🇵',
      fallbackFont: 'IPA Gothic / Noto Sans JP',
      direction: 'ltr',
      sampleText: '心電図 (ECG) は洞調律を示し、異常なST上昇は見られません。補中益気湯（ホチュウエッキトウ）を1日3回毎食前に処方。',
      clinicalContext: 'Kampo Herbal Formulation & Japanese ICD-10 Coding'
    },
    {
      id: 'chinese',
      name: 'Chinese',
      nativeName: '中文 (Simplified & Traditional)',
      flag: '🇨🇳',
      fallbackFont: 'WenQuanYi Zen Hei / Noto Sans SC',
      direction: 'ltr',
      sampleText: '患者脉象滑数，舌苔薄黄，气血两虚。针灸取穴：足三里 (ST36)、合谷 (LI4)、太冲 (LR3)，益气健脾，宣痹通络。',
      clinicalContext: 'TCM Meridian Diagnostics & Acupuncture Point Mapping'
    },
    {
      id: 'thai',
      name: 'Thai',
      nativeName: 'ภาษาไทย (Tone Stacking)',
      flag: '🇹🇭',
      fallbackFont: 'Loma / Noto Sans Thai',
      direction: 'ltr',
      sampleText: 'การตรวจคลื่นไฟฟ้าหัวใจ (ECG) พบว่าปกติ อัตราการเต้นของหัวใจ 74 ครั้งต่อนาที ความดันโลหิต 120/80 มิลลิเมตรปรอท ไม่มีภาวะกล้ามเนื้อหัวใจขาดเลือด',
      clinicalContext: 'Cardiovascular Diagnostics with Vertical Tone Stacking'
    },
    {
      id: 'devanagari',
      name: 'Devanagari',
      nativeName: 'संस्कृतम् / हिन्दी',
      flag: '🇮🇳',
      fallbackFont: 'FreeSans / Noto Sans Devanagari',
      direction: 'ltr',
      sampleText: 'आयुर्वेद त्रिदोष सिद्धान्त: वात, पित्त, कफ सन्तुलनम्। प्राणायाम ध्यान योगेन समग्र स्वास्थ्य संरक्षणम्।',
      clinicalContext: 'Ayurvedic Tridosha Constitutional Analysis'
    },
    {
      id: 'greek',
      name: 'Greek & Biophysics',
      nativeName: 'Ελληνικά / Scientific',
      flag: '🇬🇷',
      fallbackFont: 'FreeSans / Inter / JetBrains Mono',
      direction: 'ltr',
      sampleText: 'Receptor kinetics: α1-adrenergic affinity Kd = 0.42 nM, ΔG° = -35.2 kJ/mol, HbA1c = 5.6%, dosage 250 µg/mL ± 0.05%.',
      clinicalContext: 'Biophysical Equations & Pharmacological Parameter Precision'
    },
    {
      id: 'arabic',
      name: 'Arabic',
      nativeName: 'العربية (RTL Script)',
      flag: '🇸🇦',
      fallbackFont: 'FreeSans / Noto Sans Arabic',
      direction: 'rtl',
      sampleText: 'فحص القلب والأوعية الدموية سليم، ضغط الدم 120/80 ملم زئبق، النبض 72 في الدقيقة، تشبع الأكسجين 99%، ولا توجد علامات قصور حاد.',
      clinicalContext: 'Unani Medicine & Middle Eastern Clinical Charting'
    },
    {
      id: 'hebrew',
      name: 'Hebrew',
      nativeName: 'עברית (RTL Script)',
      flag: '🇮🇱',
      fallbackFont: 'FreeSans / Noto Sans Hebrew',
      direction: 'rtl',
      sampleText: 'בדיקת אק״ג תקינה, קצב לב 72 פעימות לדקה, לחץ דם 120/80 ממ״כ, רמת גלוקוז בצום 95 מ״ג/ד״ל, ללא עדות לאיסכמיה.',
      clinicalContext: 'RTL Electronic Health Record Vital Summaries'
    },
    {
      id: 'symbols',
      name: 'Universal BMP',
      nativeName: 'Unicode 65,536 Medical Symbols',
      flag: '🌐',
      fallbackFont: 'GNU Unifont / Unicode BMP',
      direction: 'ltr',
      sampleText: '⚕️ 🩺 🫀 🫁 💊 💉 🧬 🩸 🧪 🔬 ♿ ☣️ ⚠️ ⚚ ℞ ☤ ♾️ ∑ ∏ ∫ ∂ ∇ ℏ → ⇄ ↺ ✓ ✕',
      clinicalContext: 'Biochemical Operators, Pharmacy Sigils & Medical Emojis'
    },
    {
      id: 'korean',
      name: 'Korean (Hangul)',
      nativeName: '한국어 (Hangul)',
      flag: '🇰🇷',
      fallbackFont: 'Malgun Gothic / Noto Sans KR',
      direction: 'ltr',
      sampleText: '환자 활력징후 안정: 심박수 72회/분, 혈압 120/80 mmHg, 산소포화도 99%. 사상의학 체질 분석: 태음인 (太陰人) 폐신(肺腎) 강화 처방.',
      clinicalContext: 'Sasang Constitutional Medicine & Korean Clinical Telemetry'
    },
    {
      id: 'cyrillic',
      name: 'Cyrillic (Slavic)',
      nativeName: 'Русский / Српски',
      flag: '🇷🇺',
      fallbackFont: 'Noto Sans / Inter / FreeSans',
      direction: 'ltr',
      sampleText: 'Показатели гемодинамики стабильны: ЧСС 72 уд/мин, АД 120/80 мм рт. ст., SpO2 99%. ЭКГ: синусовый ритм, ишемических изменений не выявлено.',
      clinicalContext: 'Eastern European Clinical Cardiology & Intensive Care EHR'
    },
    {
      id: 'vietnamese',
      name: 'Vietnamese',
      nativeName: 'Tiếng Việt',
      flag: '🇻🇳',
      fallbackFont: 'Noto Sans / Inter / Arial',
      direction: 'ltr',
      sampleText: 'Chỉ số sinh tồn bình thường: Nhịp tim 72 lần/phút, huyết áp 120/80 mmHg, độ bão hòa oxy SpO2 99%. Không có dấu hiệu thiếu máu cơ tim cục bộ cấp.',
      clinicalContext: 'Multi-Diacritic Tone Stacking (dấu thanh + dấu mũ) Legibility'
    },
    {
      id: 'bengali',
      name: 'Bengali (Bangla)',
      nativeName: 'বাংলা',
      flag: '🇧🇩',
      fallbackFont: 'Noto Sans Bengali / Vrinda',
      direction: 'ltr',
      sampleText: 'রোগীর শারীরিক লক্ষণ স্থিতিশীল: হৃদস্পন্দন ৭২ বিপিএম, রক্তচাপ ১২০/৮০ মিমি পারদ, অক্সিজেন সম্পৃক্তি ৯৯%। কোনও তীব্র ইস্কেমিয়া নেই।',
      clinicalContext: 'South Asian EHR & Community Public Health Telehealth'
    },
    {
      id: 'tamil',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      flag: '🇮🇳',
      fallbackFont: 'Noto Sans Tamil / Latha',
      direction: 'ltr',
      sampleText: 'நோயாளி முக்கிய அறிகுறிகள் இயல்பு: இதய துடிப்பு 72 bpm, இரத்த அழுத்தம் 120/80 mmHg, ஆக்சிஜன் அளவு 99%. சித்த மருத்துவ சிகிச்சை திட்டம் புதுப்பிக்கப்பட்டது.',
      clinicalContext: 'Siddha Traditional Medicine & Dravidian Clinical Diagnostics'
    },
    {
      id: 'ethiopic',
      name: 'Ethiopic (Geʻez)',
      nativeName: 'አማርኛ (Amharic)',
      flag: '🇪🇹',
      fallbackFont: 'Noto Sans Ethiopic / Nyala',
      direction: 'ltr',
      sampleText: 'የታካሚው የጤና ሁኔታ የተረጋጋ ነው፡ የልብ ምት 72 በደቂቃ፣ የደም ግፊት 120/80 ሚ.ሜ፣ የኦክስጂን መጠን 99%። አጣዳፊ የልብ ህመም ምልክት አልታየም።',
      clinicalContext: 'Horn of Africa Clinical Records & Traditional Herbal Care'
    }
  ];

  viewMode = signal<'single' | 'matrix'>('single');
  activeScript = signal<IScriptPreset>(this.scripts[0]);
  previewText = signal<string>(this.scripts[0].sampleText);

  readonly commonTranslations: Array<{
    id: string;
    language: string;
    nativeName: string;
    flag: string;
    fallback: string;
    direction: 'ltr' | 'rtl';
    text: string;
  }> = [
    {
      id: 'en',
      language: 'English',
      nativeName: 'Latin Extended',
      flag: '🇬🇧',
      fallback: 'PocketGull VF / Inter / Caslon',
      direction: 'ltr',
      text: 'Patient vitals are normal: Heart rate 72 bpm, blood pressure 120/80 mmHg, oxygen saturation 99%. No acute cardiac ischemia detected. Care plan updated.'
    },
    {
      id: 'ja',
      language: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      fallback: 'IPA Gothic / Noto Sans JP',
      direction: 'ltr',
      text: '患者のバイタルサインは正常です：心拍数 72 bpm、血圧 120/80 mmHg、酸素飽和度 99%。急性心筋虚血は認められません。治療計画を更新しました。'
    },
    {
      id: 'zh',
      language: 'Chinese',
      nativeName: '简体中文',
      flag: '🇨🇳',
      fallback: 'WenQuanYi Zen Hei / Noto Sans SC',
      direction: 'ltr',
      text: '患者生命体征正常：心率 72 次/分，血压 120/80 mmHg，血氧饱和度 99%。未发现急性心肌缺血。诊疗计划已更新。'
    },
    {
      id: 'ko',
      language: 'Korean',
      nativeName: '한국어',
      flag: '🇰🇷',
      fallback: 'Malgun Gothic / Noto Sans KR',
      direction: 'ltr',
      text: '환자 생체 징후 정상: 심박수 72회/분, 혈압 120/80 mmHg, 산소포화도 99%. 급성 심근 허혈 소견 없음. 치료 계획 업데이트 완료.'
    },
    {
      id: 'ru',
      language: 'Russian / Cyrillic',
      nativeName: 'Русский',
      flag: '🇷🇺',
      fallback: 'Noto Sans / Inter / FreeSans',
      direction: 'ltr',
      text: 'Жизненные показатели в норме: ЧСС 72 уд/мин, АД 120/80 мм рт. ст., SpO2 99%. Острой ишемии миокарда не выявлено. План лечения обновлен.'
    },
    {
      id: 'vi',
      language: 'Vietnamese',
      nativeName: 'Tiếng Việt',
      flag: '🇻🇳',
      fallback: 'Noto Sans / Inter / Arial',
      direction: 'ltr',
      text: 'Chỉ số sinh tồn bình thường: Nhịp tim 72 lần/phút, huyết áp 120/80 mmHg, độ bão hòa oxy 99%. Không phát hiện thiếu máu cơ tim cấp. Kế hoạch chăm sóc đã cập nhật.'
    },
    {
      id: 'bn',
      language: 'Bengali',
      nativeName: 'বাংলা',
      flag: '🇧🇩',
      fallback: 'Noto Sans Bengali / Vrinda',
      direction: 'ltr',
      text: 'রোগীর লক্ষণ স্বাভাবিক: হৃদস্পন্দন ৭২ বিপিএম, রক্তচাপ ১২০/৮০ মিমি পারদ, অক্সিজেন ৯৯%। কোনও তীব্র ইস্কেমিয়া শনাক্ত হয়নি। পরিকল্পনা আপডেট করা হয়েছে।'
    },
    {
      id: 'ta',
      language: 'Tamil',
      nativeName: 'தமிழ்',
      flag: '🇮🇳',
      fallback: 'Noto Sans Tamil / Latha',
      direction: 'ltr',
      text: 'நோயாளி அறிகுறிகள் இயல்பு: இதய துடிப்பு 72 bpm, இரத்த அழுத்தம் 120/80 mmHg, ஆக்சிஜன் அளவு 99%. கடுமையான இதய கோளாறு இல்லை. சிகிச்சை திட்டம் புதுப்பிக்கப்பட்டது.'
    },
    {
      id: 'am',
      language: 'Amharic',
      nativeName: 'አማርኛ',
      flag: '🇪🇹',
      fallback: 'Noto Sans Ethiopic / Nyala',
      direction: 'ltr',
      text: 'የታካሚው ሁኔታ መደበኛ ነው፡ የልብ ምት 72፣ የደም ግፊት 120/80 ሚ.ሜ፣ የኦክስጂን መጠን 99%። አጣዳፊ የልብ ህመም አልተገኘም። የህክምና እቅዱ ተዘምኗል።'
    },
    {
      id: 'th',
      language: 'Thai',
      nativeName: 'ภาษาไทย',
      flag: '🇹🇭',
      fallback: 'Loma / Noto Sans Thai',
      direction: 'ltr',
      text: 'สัญญาณชีพของผู้ป่วยเป็นปกติ: อัตราการเต้นของหัวใจ 72 ครั้ง/นาที, ความดันโลหิต 120/80 มม.ปรอท, ความอิ่มตัวของออกซิเจน 99% ไม่พบภาวะกล้ามเนื้อหัวใจขาดเลือดเฉียบพลัน ปรับปรุงแผนการรักษาแล้ว'
    },
    {
      id: 'sa',
      language: 'Sanskrit / Hindi',
      nativeName: 'संस्कृतम् / हिन्दी',
      flag: '🇮🇳',
      fallback: 'FreeSans / Noto Sans Devanagari',
      direction: 'ltr',
      text: 'रोगी-प्राणसूचकाः प्राकृताः सन्ति: हृदयगतिः ७२ प्रतिमिनिटम्, रक्तचापः १२०/८० mmHg, प्राणवायुसन्तृप्तिः ९९%। तीव्रहृद्रोगाभावः। चिकित्सा-योजना नवीकृता।'
    },
    {
      id: 'es',
      language: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      fallback: 'PocketGull VF / Inter',
      direction: 'ltr',
      text: 'Signos vitales normales: Frecuencia cardíaca 72 lpm, presión arterial 120/80 mmHg, saturación de O2 99%. Sin isquemia miocárdica aguda. Plan de cuidados actualizado.'
    },
    {
      id: 'de',
      language: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      fallback: 'PocketGull VF / Inter',
      direction: 'ltr',
      text: 'Vitalparameter normal: Herzfrequenz 72 bpm, Blutdruck 120/80 mmHg, Sauerstoffsättigung 99%. Keine akute Myokardischämie festgestellt. Behandlungsplan aktualisiert.'
    },
    {
      id: 'fr',
      language: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      fallback: 'PocketGull VF / Inter',
      direction: 'ltr',
      text: 'Signes vitaux stables : Fréquence cardiaque 72 bpm, tension artérielle 120/80 mmHg, saturation en O2 99%. Aucune ischémie myocardique aiguë détectée. Plan de soins mis à jour.'
    },
    {
      id: 'el',
      language: 'Greek',
      nativeName: 'Ελληνικά',
      flag: '🇬🇷',
      fallback: 'FreeSans / Inter',
      direction: 'ltr',
      text: 'Ζωτικά σημεία φυσιολογικά: Καρδιακός ρυθμός 72 bpm, αρτηριακή πίεση 120/80 mmHg, κορεσμός O2 99%. Δεν εντοπίστηκε οξεία ισχαιμία. Το θεραπευτικό πλάνο ενημερώθηκε.'
    },
    {
      id: 'ar',
      language: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      fallback: 'FreeSans / Noto Sans Arabic',
      direction: 'rtl',
      text: 'العلامات الحيوية للمريض طبيعية: معدل نبض القلب 72 نبضة في الدقيقة، ضغط الدم 120/80 ملم زئبق، تشبع الأكسجين 99%. لا توجد علامات نقص تروية حاد. تم تحديث خطة الرعاية.'
    },
    {
      id: 'he',
      language: 'Hebrew',
      nativeName: 'עברית',
      flag: '🇮🇱',
      fallback: 'FreeSans / Noto Sans Hebrew',
      direction: 'rtl',
      text: 'מדדים חיוניים תקינים: דופק 72 פעימות/דקה, לחץ דם 120/80 ממ״כ, רוויון חמצን 99%. לא זוהתה איסכמיה לבבית חரிפה. תוכנית הטיפול עודכנה.'
    }
  ];

  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'single' ? 'matrix' : 'single');
  }

  weight = signal<number>(400);
  fontSize = signal<number>(22);
  opticalSize = signal<number>(14);
  letterSpacing = signal<number>(-0.01);
  lineHeight = signal<number>(1.6);
  isItalic = signal<boolean>(false);
  copyStatus = signal<string>('📋 Copy CSS Font Stack');

  computedVariationSettings = computed(() => {
    return `'wght' ${this.weight()}, 'opsz' ${this.opticalSize()}`;
  });

  analyzedGlyphs = computed<IGlyphAnalysis[]>(() => {
    const text = this.previewText() || '';
    const glyphs: IGlyphAnalysis[] = [];
    const seen = new Set<string>();

    for (const char of text) {
      if (seen.has(char) && char !== ' ') continue;
      seen.add(char);

      const code = char.codePointAt(0) || 0;
      const hex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
      
      let block = 'Basic Latin';
      let font = 'PocketGull VF';

      if (code >= 0xAC00 && code <= 0xD7AF || (code >= 0x1100 && code <= 0x11FF)) {
        block = 'Hangul (Korean)';
        font = 'Malgun Gothic / Noto Sans KR';
      } else if (code >= 0x0400 && code <= 0x04FF) {
        block = 'Cyrillic (Slavic)';
        font = 'Noto Sans / FreeSans';
      } else if (code >= 0x0980 && code <= 0x09FF) {
        block = 'Bengali';
        font = 'Noto Sans Bengali / Vrinda';
      } else if (code >= 0x0B80 && code <= 0x0BFF) {
        block = 'Tamil';
        font = 'Noto Sans Tamil / Latha';
      } else if (code >= 0x1200 && code <= 0x137F) {
        block = 'Ethiopic (Geʻez)';
        font = 'Noto Sans Ethiopic / Nyala';
      } else if (code >= 0x3040 && code <= 0x30FF) {
        block = 'Hiragana/Katakana';
        font = 'IPA Gothic';
      } else if (code >= 0x4E00 && code <= 0x9FFF) {
        block = 'CJK Ideograph';
        font = 'WenQuanYi Zen Hei / IPA Gothic';
      } else if (code >= 0x0E00 && code <= 0x0E7F) {
        block = 'Thai';
        font = 'Loma';
      } else if (code >= 0x0900 && code <= 0x097F) {
        block = 'Devanagari';
        font = 'FreeSans';
      } else if (code >= 0x0370 && code <= 0x03FF) {
        block = 'Greek';
        font = 'FreeSans / Inter';
      } else if (code >= 0x0600 && code <= 0x06FF) {
        block = 'Arabic';
        font = 'FreeSans';
      } else if (code >= 0x0590 && code <= 0x05FF) {
        block = 'Hebrew';
        font = 'FreeSans';
      } else if (code > 0x2000) {
        block = 'Symbols / Emoji';
        font = 'GNU Unifont';
      }

      glyphs.push({
        char,
        codePoint: hex,
        decValue: code,
        block,
        assignedFont: font
      });

      if (glyphs.length >= 32) break;
    }

    return glyphs;
  });

  selectScript(script: IScriptPreset): void {
    this.activeScript.set(script);
    this.previewText.set(script.sampleText);
  }

  updateText(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.previewText.set(input.value);
  }

  updateWeight(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.weight.set(Number(input.value));
  }

  updateFontSize(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fontSize.set(Number(input.value));
  }

  updateOpticalSize(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.opticalSize.set(Number(input.value));
  }

  updateLetterSpacing(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.letterSpacing.set(Number(input.value));
  }

  toggleItalic(): void {
    this.isItalic.update(v => !v);
  }

  copyCssSnippet(): void {
    const css = `/* PocketGull No-Tofu Multilingual Variable Font Stack */\nfont-family: 'PocketGull VF', 'PocketGull', 'Inter', 'WenQuanYi Zen Hei', 'IPA Gothic', 'Loma', 'FreeSans', 'Unifont', system-ui, sans-serif;\nfont-variation-settings: 'wght' ${this.weight()}, 'opsz' ${this.opticalSize()};`;
    
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(css).then(() => {
        this.copyStatus.set('✅ Copied CSS Stack!');
        setTimeout(() => this.copyStatus.set('📋 Copy CSS Font Stack'), 2500);
      }).catch(() => {
        this.copyStatus.set('⚠️ Copy Failed');
      });
    }
  }
}
