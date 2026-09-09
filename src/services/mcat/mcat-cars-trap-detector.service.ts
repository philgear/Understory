import { Injectable } from '@angular/core';

export type CarsTrapType =
  | 'EXTREME_SCOPE'
  | 'KEYWORD_TRAP'
  | 'OUT_OF_SCOPE'
  | 'POLARITY_INVERSION'
  | 'FAULTY_GENERALIZATION'
  | 'NONE_DEFENSIBLE';

export type AuthorTone =
  | 'CRITICAL_SKEPTICAL'
  | 'LAUDATORY_ADMIRING'
  | 'AMBIVALENT_BALANCED'
  | 'DETACHED_OBJECTIVE'
  | 'DIDACTIC_INSTRUCTIVE'
  | 'SARDONIC_IRONIC';

export type CarsQuestionCategory =
  | 'FOUNDATIONS_OF_COMPREHENSION'
  | 'REASONING_WITHIN_THE_TEXT'
  | 'REASONING_BEYOND_THE_TEXT';

export interface IAuditedChoice {
  label: string;
  text: string;
  trapType: CarsTrapType;
  trapRiskScorePercent: number; // 0% = safe/defensible, 100% = clear trap
  isDefensible: boolean;
  detectedKeywords: string[];
  vulnerabilityExplanation: string;
  aamcEliminationTip: string;
}

export interface ICarsPassageAuditResult {
  passageWordCount: number;
  authorTone: AuthorTone;
  toneConfidence: number; // 0.0 - 1.0
  toneKeywordsFound: string[];
  questionCategory: CarsQuestionCategory;
  auditedChoices: IAuditedChoice[];
  recommendedChoiceLabel: string;
  rhetoricalSummary: string;
}

const EXTREME_WORDS = [
  'always', 'never', 'only', 'all', 'solely', 'impossible', 'completely',
  'must', 'exclusively', 'every', 'none', 'entirely', 'undeniably', 'invariably'
];

const TONE_LEXICONS: Record<AuthorTone, string[]> = {
  CRITICAL_SKEPTICAL: [
    'flawed', 'questionable', 'erroneous', 'doubtful', 'problematic',
    'overstated', 'unwarranted', 'misleading', 'naive', 'shortcoming', 'fails'
  ],
  LAUDATORY_ADMIRING: [
    'remarkable', 'brilliant', 'triumph', 'masterpiece', 'profound',
    'visionary', 'exceptional', 'ingenious', 'admirable', 'virtuoso'
  ],
  AMBIVALENT_BALANCED: [
    'however', 'on the other hand', 'paradoxically', 'dual', 'competing',
    'nuanced', 'yet', 'mixed', 'tradeoff', 'reconcile', 'tension'
  ],
  DETACHED_OBJECTIVE: [
    'data', 'observed', 'chronicles', 'historical', 'documents',
    'indicated', 'records', 'empirical', 'evidence suggests', 'described'
  ],
  DIDACTIC_INSTRUCTIVE: [
    'one should', 'essential', 'fundamental', 'imperative', 'we must',
    'teaches', 'lesson', 'vital', 'proper', 'principle'
  ],
  SARDONIC_IRONIC: [
    'ironically', 'amusingly', 'absurd', 'pretension', 'ridiculous',
    'mockery', 'folly', 'farce', 'curiously'
  ]
};

@Injectable({
  providedIn: 'root'
})
export class McatCarsTrapDetectorService {
  /**
   * Classifies author tone based on rhetorical cue density
   */
  public analyzeAuthorTone(passageText: string): {
    tone: AuthorTone;
    confidence: number;
    matchedKeywords: string[];
  } {
    const lower = passageText.toLowerCase();
    const scores: Record<AuthorTone, string[]> = {
      CRITICAL_SKEPTICAL: [],
      LAUDATORY_ADMIRING: [],
      AMBIVALENT_BALANCED: [],
      DETACHED_OBJECTIVE: [],
      DIDACTIC_INSTRUCTIVE: [],
      SARDONIC_IRONIC: []
    };

    let highestCount = 0;
    let dominantTone: AuthorTone = 'DETACHED_OBJECTIVE';

    for (const [tone, keywords] of Object.entries(TONE_LEXICONS) as [AuthorTone, string[]][]) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          scores[tone].push(kw);
        }
      }
      if (scores[tone].length > highestCount) {
        highestCount = scores[tone].length;
        dominantTone = tone;
      }
    }

    const confidence = highestCount > 0 ? Math.min(0.5 + highestCount * 0.1, 0.98) : 0.60;

    return {
      tone: dominantTone,
      confidence: Math.round(confidence * 100) / 100,
      matchedKeywords: scores[dominantTone]
    };
  }

  /**
   * Categorizes the CARS question stem into one of the 3 official AAMC skill categories
   */
  public categorizeQuestionStem(stem: string): CarsQuestionCategory {
    const s = stem.toLowerCase();
    if (
      s.includes('weaken') ||
      s.includes('strengthen') ||
      s.includes('suppose that') ||
      s.includes('if true') ||
      s.includes('most analogous') ||
      s.includes('apply') ||
      s.includes('new situation')
    ) {
      return 'REASONING_BEYOND_THE_TEXT';
    }

    if (
      s.includes('assumption') ||
      s.includes('author argues') ||
      s.includes('support') ||
      s.includes('evidence') ||
      s.includes('challenge') ||
      s.includes('logical') ||
      s.includes('relationship between')
    ) {
      return 'REASONING_WITHIN_THE_TEXT';
    }

    return 'FOUNDATIONS_OF_COMPREHENSION';
  }

  /**
   * Audits a single answer choice against the passage for AAMC trap heuristics
   */
  public auditSingleChoice(
    choiceText: string,
    passageText: string,
    authorTone: AuthorTone
  ): {
    trapType: CarsTrapType;
    riskScore: number;
    explanation: string;
    tip: string;
    detectedKeywords: string[];
  } {
    const choiceLower = choiceText.toLowerCase();
    const passageLower = passageText.toLowerCase();

    // 1. EXTREME_SCOPE CHECK
    const foundExtreme = EXTREME_WORDS.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(choiceLower));
    if (foundExtreme.length > 0 && authorTone !== 'DIDACTIC_INSTRUCTIVE') {
      return {
        trapType: 'EXTREME_SCOPE',
        riskScore: 92,
        explanation: `Extreme Qualifier Trap: Uses absolute wording ("${foundExtreme.join(', ')}"). The AAMC rarely rewards absolute claims unless the author explicitly uses dogmatic language.`,
        tip: 'Eliminate options using "always", "never", or "completely" when the author wrote in a nuanced or qualified tone.',
        detectedKeywords: foundExtreme
      };
    }

    // 2. POLARITY_INVERSION CHECK
    const negationWords = ['not', 'opposite', 'contrary', 'reverse', 'undermined', 'destroys'];
    const hasNegation = negationWords.some(w => choiceLower.includes(w));
    if (
      (hasNegation && authorTone === 'LAUDATORY_ADMIRING' && (choiceLower.includes('failure') || choiceLower.includes('worthless'))) ||
      (authorTone === 'CRITICAL_SKEPTICAL' && (choiceLower.includes('flawless') || choiceLower.includes('inarguable')))
    ) {
      return {
        trapType: 'POLARITY_INVERSION',
        riskScore: 95,
        explanation: `Polarity Inversion Trap: The choice flips the author's evaluative stance from positive to negative or vice-versa.`,
        tip: 'Verify whether the choice matches the positive/negative valency of the author’s primary thesis.',
        detectedKeywords: ['polarity-flip']
      };
    }

    // 3. FAULTY GENERALIZATION CHECK
    if (
      (choiceLower.includes('all cases') || choiceLower.includes('every situation') || choiceLower.includes('in general, all')) &&
      !passageLower.includes('universal')
    ) {
      return {
        trapType: 'FAULTY_GENERALIZATION',
        riskScore: 88,
        explanation: `Faulty Generalization Trap: Takes an illustrative anecdote from the passage and improperly elevates it into a universal rule.`,
        tip: 'Watch out for choices that convert a specific example into a categorical statement about the whole group.',
        detectedKeywords: ['generalization']
      };
    }

    // 4. KEYWORD TRAP CHECK
    // Check if the choice copies exact multi-word phrase from passage but with out-of-context distortion
    const choiceTokens = choiceLower.replace(/[^\w\s]/g, '').split(/\s+/).filter(t => t.length > 4);
    const matchedTokens = choiceTokens.filter(t => passageLower.includes(t));
    const tokenOverlapRatio = choiceTokens.length > 0 ? matchedTokens.length / choiceTokens.length : 0;

    if (tokenOverlapRatio >= 0.85 && choiceTokens.length >= 4) {
      // High literal keyword repetition can be an AAMC decoy if it distorts context
      const passageSentences = passageLower.split(/[.!?]+/);
      const matchingSentence = passageSentences.find(s => matchedTokens.filter(t => s.includes(t)).length >= 3);
      if (matchingSentence && !matchingSentence.includes('therefore') && choiceLower.includes('therefore')) {
        return {
          trapType: 'KEYWORD_TRAP',
          riskScore: 85,
          explanation: `Keyword Decoy Trap: Copies exact words from the passage ("${matchedTokens.slice(0, 3).join(', ')}"), but imposes an unstated causal link ("therefore").`,
          tip: 'Do not pick an answer simply because it uses words lifted verbatim from the text; confirm the logical relationship.',
          detectedKeywords: matchedTokens.slice(0, 4)
        };
      }
    }

    // 5. OUT_OF_SCOPE CHECK
    // Check if the choice introduces foreign concepts not in passage
    const matchedRootTokens = choiceTokens.filter(t => passageLower.includes(t.slice(0, Math.min(t.length, 5))));
    const nonPassageTokens = choiceTokens.filter(t => !passageLower.includes(t.slice(0, Math.min(t.length, 5))));
    const rootOverlapRatio = choiceTokens.length > 0 ? matchedRootTokens.length / choiceTokens.length : 0;

    if (nonPassageTokens.length >= 3 && rootOverlapRatio < 0.25 && matchedRootTokens.length < 2) {
      return {
        trapType: 'OUT_OF_SCOPE',
        riskScore: 80,
        explanation: `Out of Scope Trap: Introduces foreign concepts ("${nonPassageTokens.slice(0, 3).join(', ')}") never discussed or supported by the author.`,
        tip: 'If an answer requires assuming outside information that the passage never mentions, eliminate it.',
        detectedKeywords: nonPassageTokens.slice(0, 3)
      };
    }

    // 6. DEFENSIBLE ANSWER
    return {
      trapType: 'NONE_DEFENSIBLE',
      riskScore: 12,
      explanation: 'Defensible / Grounded: Uses measured, defensible phrasing closely tethered to the author’s scope without absolute qualifiers.',
      tip: 'Strong candidate: Maintains the author’s level of certainty and directly answers the question stem.',
      detectedKeywords: matchedTokens.slice(0, 3)
    };
  }

  /**
   * End-to-end CARS Passage & Question Auditor
   */
  public auditPassageAndChoices(
    passageText: string,
    questionStem: string,
    choices: Array<{ label: string; text: string }>
  ): ICarsPassageAuditResult {
    const toneResult = this.analyzeAuthorTone(passageText);
    const category = this.categorizeQuestionStem(questionStem);

    const audited: IAuditedChoice[] = [];
    let bestChoiceLabel = choices[0]?.label || 'A';
    let lowestRisk = 100;

    for (const c of choices) {
      const audit = this.auditSingleChoice(c.text, passageText, toneResult.tone);
      const isDefensible = audit.trapType === 'NONE_DEFENSIBLE';

      audited.push({
        label: c.label,
        text: c.text,
        trapType: audit.trapType,
        trapRiskScorePercent: audit.riskScore,
        isDefensible,
        detectedKeywords: audit.detectedKeywords,
        vulnerabilityExplanation: audit.explanation,
        aamcEliminationTip: audit.tip
      });

      if (audit.riskScore < lowestRisk) {
        lowestRisk = audit.riskScore;
        bestChoiceLabel = c.label;
      }
    }

    const words = passageText.trim().split(/\s+/).length;

    return {
      passageWordCount: words,
      authorTone: toneResult.tone,
      toneConfidence: toneResult.confidence,
      toneKeywordsFound: toneResult.matchedKeywords,
      questionCategory: category,
      auditedChoices: audited,
      recommendedChoiceLabel: bestChoiceLabel,
      rhetoricalSummary: `The author adopts a predominantly ${toneResult.tone.replace('_', ' ')} posture. The question belongs to "${category.replace(/_/g, ' ')}". Distractor analysis identified ${audited.filter(a => !a.isDefensible).length} high-risk trap options.`
    };
  }
}
