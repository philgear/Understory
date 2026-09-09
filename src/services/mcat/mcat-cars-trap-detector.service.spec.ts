import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { McatCarsTrapDetectorService } from './mcat-cars-trap-detector.service';

describe('McatCarsTrapDetectorService', () => {
  let service: McatCarsTrapDetectorService;

  beforeEach(() => {
    service = new McatCarsTrapDetectorService();
  });

  it('1. should initialize the CARS trap detector service', () => {
    expect(service).toBeTruthy();
  });

  it('2. should classify rhetorical author tones accurately', () => {
    const criticalPassage = 'The prevailing economic paradigm is deeply flawed and its empirical assumptions are naive and erroneous. The framework consistently fails to account for labor exploitation.';
    const tone1 = service.analyzeAuthorTone(criticalPassage);
    expect(tone1.tone).toBe('CRITICAL_SKEPTICAL');
    expect(tone1.matchedKeywords).toContain('flawed');
    expect(tone1.matchedKeywords).toContain('erroneous');

    const laudatoryPassage = 'Virginia Woolf’s prose represents a remarkable triumph of modernist literature. Her exceptional narrative rhythm produces an admirable and brilliant exploration of human consciousness.';
    const tone2 = service.analyzeAuthorTone(laudatoryPassage);
    expect(tone2.tone).toBe('LAUDATORY_ADMIRING');
    expect(tone2.matchedKeywords).toContain('remarkable');
    expect(tone2.matchedKeywords).toContain('triumph');
  });

  it('3. should categorize question stems into the 3 AAMC CARS categories', () => {
    expect(service.categorizeQuestionStem('Which of the following, if true, would most weaken the author’s primary thesis?'))
      .toBe('REASONING_BEYOND_THE_TEXT');

    expect(service.categorizeQuestionStem('The author’s argument regarding architecture relies on which of the following unstated assumptions?'))
      .toBe('REASONING_WITHIN_THE_TEXT');

    expect(service.categorizeQuestionStem('According to the passage, the primary purpose of the third paragraph is to:'))
      .toBe('FOUNDATIONS_OF_COMPREHENSION');
  });

  it('4. should flag extreme scope trap words (always, never, completely)', () => {
    const audit = service.auditSingleChoice(
      'The author believes that technological modernization is always detrimental to local agrarian communities.',
      'Technological modernization often disrupts agrarian economies, though some communities have adapted successfully.',
      'AMBIVALENT_BALANCED'
    );
    expect(audit.trapType).toBe('EXTREME_SCOPE');
    expect(audit.riskScore).toBeGreaterThanOrEqual(90);
    expect(audit.detectedKeywords).toContain('always');
    expect(audit.tip).toContain('Eliminate options using');
  });

  it('5. should flag out-of-scope distractors and recommend defensible grounded choices', () => {
    const passage = `The Renaissance revival of classical antiquity transformed Florentine civic architecture. Architects emphasized mathematical proportion and symmetry rather than medieval verticality.`;
    const question = `Which of the following best characterizes the shift in Florentine architecture discussed in the passage?`;
    const choices = [
      { label: 'A', text: 'It completely eradicated all religious symbolism across Italian cathedrals.' }, // EXTREME
      { label: 'B', text: 'It was driven by Marxist dialectical class struggles between the proletariat and guild masters.' }, // OUT OF SCOPE
      { label: 'C', text: 'It marked a transition toward geometric symmetry and balanced mathematical proportions.' }, // DEFENSIBLE
      { label: 'D', text: 'It made medieval verticality the mandatory structural principle of civic monuments.' } // POLARITY INVERSION
    ];

    const result = service.auditPassageAndChoices(passage, question, choices);
    expect(result.auditedChoices[0].trapType).toBe('EXTREME_SCOPE');
    expect(result.auditedChoices[1].trapType).toBe('OUT_OF_SCOPE');
    expect(result.auditedChoices[2].trapType).toBe('NONE_DEFENSIBLE');
    expect(result.auditedChoices[2].isDefensible).toBe(true);
    expect(result.recommendedChoiceLabel).toBe('C');
  });
});
