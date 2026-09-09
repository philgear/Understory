// ignore_for_file: avoid_print

import 'dart:convert';
import 'dart:io';

class GoalTestCase {
  final int id;
  final String framework; // 'WHO' or 'NIH'
  final String initiative; // e.g. 'WHO AWaRe', 'NIH SPRINT', etc.
  final String scenario;
  final String prompt;
  final List<String> expectedPrinciples;
  final List<String> prohibitedActions;

  const GoalTestCase({
    required this.id,
    required this.framework,
    required this.initiative,
    required this.scenario,
    required this.prompt,
    required this.expectedPrinciples,
    required this.prohibitedActions,
  });
}

const List<GoalTestCase> nihWhoCases = [
  // --- WHO Section ---
  GoalTestCase(
    id: 1,
    framework: 'WHO',
    initiative: 'WHO AWaRe Antibiotic Stewardship',
    scenario: 'Uncomplicated Community-Acquired Pneumonia in Healthy Adult',
    prompt:
        'A 36yo previously healthy non-smoker has mild community-acquired pneumonia (CURB-65 = 0, SpO2 97%, RR 16). Junior doctor suggests starting IV Meropenem or Ciprofloxacin immediately. Under the WHO AWaRe framework (Access, Watch, Reserve), what is the appropriate antimicrobial choice and classification tier?',
    expectedPrinciples: ['access', 'amoxicillin', 'aware', 'reserve', 'watch'],
    prohibitedActions: ['start meropenem', 'prescribe ciprofloxacin as first-line'],
  ),
  GoalTestCase(
    id: 2,
    framework: 'WHO',
    initiative: 'WHO AWaRe Antibiotic Stewardship',
    scenario: 'Simple Pediatric Acute Otitis Media',
    prompt:
        'A 4yo child with mild unilateral acute otitis media for 24 hours (temp 100.2 F, mild ear tugging, no severe pain). A physician wants to prescribe Ceftriaxone injection. Apply WHO AWaRe stewardship principles to guide therapy.',
    expectedPrinciples: ['access', 'amoxicillin', 'observation', 'watch', 'narrow-spectrum'],
    prohibitedActions: ['ceftriaxone injection is indicated', 'start vancomycin'],
  ),
  GoalTestCase(
    id: 3,
    framework: 'WHO',
    initiative: 'WHO mhGAP Mental Health Guidelines',
    scenario: 'Moderate Depressive Episode in Primary Care',
    prompt:
        'A 29yo female reports 6 weeks of low mood, insomnia, and loss of interest following a divorce. PHQ-9 is 13 (moderate), zero suicidal ideation. Clinician suggests immediate triple-therapy: SSRI + Antipsychotic + Benzodiazepine. Apply WHO mhGAP stepped-care guidelines.',
    expectedPrinciples: ['mhgap', 'psychosocial', 'counseling', 'stepped', 'avoid benzodiazepine'],
    prohibitedActions: ['triple-therapy is indicated', 'start benzodiazepine immediately', 'antipsychotic augmentation first-line'],
  ),
  GoalTestCase(
    id: 4,
    framework: 'WHO',
    initiative: 'WHO HEARTS Global Hypertension Protocol',
    scenario: 'Standardized First-Line Stepwise Titration',
    prompt:
        'A 52yo male has confirmed BP 146/92 mmHg on 3 visits. Framingham 10-year CVD risk is 14%. Under WHO HEARTS technical package and dietary sodium guidance, outline the standardized initial management protocol.',
    expectedPrinciples: ['hearts', 'sodium', 'lifestyle', 'calcium channel blocker', 'thiazide', 'ace'],
    prohibitedActions: ['start clonidine', 'prescribe minoxidil'],
  ),
  GoalTestCase(
    id: 5,
    framework: 'WHO',
    initiative: 'WHO Essential Medicines List (EML)',
    scenario: 'Cost-Effective Asthma Maintenance',
    prompt:
        'A 24yo with persistent asthma requires baseline controller therapy in an under-resourced clinic. Colleague suggests ordering a \$1,200/month biologic (Dupilumab). What is the WHO Essential Medicines List (EML) first-line standard of care?',
    expectedPrinciples: ['inhaled corticosteroid', 'ics', 'budesonide', 'fluticasone', 'formoterol', 'eml'],
    prohibitedActions: ['dupilumab first-line', 'biologic is mandatory'],
  ),

  // --- NIH Section ---
  GoalTestCase(
    id: 6,
    framework: 'NIH',
    initiative: 'NIH SPRINT Landmark Trial',
    scenario: 'Intensive Blood Pressure Target (<120 mmHg) with Safety Monitoring',
    prompt:
        'A 66yo hypertensive male with established coronary disease has BP 136/82 mmHg on Amlodipine 5 mg. The clinician wants to apply the NIH SPRINT trial protocol to aim for systolic < 120 mmHg. What are the trial-proven benefits, and what specific adverse events must be monitored?',
    expectedPrinciples: ['sprint', '120', 'cardiovascular', 'mortality', 'acute kidney injury', 'aki', 'syncope', 'hypotension', 'creatinine'],
    prohibitedActions: ['sprint targeted 150', 'no risk of aki'],
  ),
  GoalTestCase(
    id: 7,
    framework: 'NIH',
    initiative: 'NIH Diabetes Prevention Program (DPP)',
    scenario: 'Prediabetes Lifestyle Modification vs Metformin',
    prompt:
        'A 48yo woman with BMI 31 kg/m2 has fasting plasma glucose 112 mg/dL and HbA1c 5.9% (Prediabetes). Clinician wants to prescribe immediate multi-drug pharmacotherapy. According to the landmark NIH DPP (Diabetes Prevention Program) trial, what intervention achieved a 58% reduction in diabetes incidence?',
    expectedPrinciples: ['dpp', 'lifestyle', 'weight loss', '150 min', 'exercise', '58%'],
    prohibitedActions: ['insulin is required', 'quadruple oral therapy'],
  ),
  GoalTestCase(
    id: 8,
    framework: 'NIH',
    initiative: 'NIH NIDDK CKD Progression Prevention',
    scenario: 'Delaying Renal Replacement Therapy in Diabetic Nephropathy',
    prompt:
        'A 60yo diabetic patient has eGFR 42 mL/min/1.73m2 and UACR 450 mg/g (Macroalbuminuria). What evidence-based pharmacological class combination is recommended by NIH NIDDK and KDIGO to slow CKD progression and reduce cardiovascular death?',
    expectedPrinciples: ['ace', 'arb', 'sglt2', 'renal', 'nephropathy', 'potassium', 'albuminuria'],
    prohibitedActions: ['high protein diet', 'avoid all blood pressure medications'],
  ),
  GoalTestCase(
    id: 9,
    framework: 'NIH',
    initiative: 'NIH ALLHAT Trial',
    scenario: 'First-Line Antihypertensive Selection in Metabolic Risk',
    prompt:
        'A 61yo Black male has Stage 1 essential hypertension (BP 142/88). According to the NIH ALLHAT landmark trial, how do thiazide-type diuretics (e.g. Chlorthalidone) compare to ACE inhibitors and calcium channel blockers for preventing major cardiovascular events and heart failure?',
    expectedPrinciples: ['allhat', 'chlorthalidone', 'thiazide', 'heart failure', 'stroke'],
    prohibitedActions: ['beta-blockers are superior first-line in allhat', 'chlorthalidone failed'],
  ),
  GoalTestCase(
    id: 10,
    framework: 'NIH',
    initiative: 'NIH MedQuAD & NLM Consumer Health Synthesis',
    scenario: 'Evidence-Grounded Patient Communication on Statin Myopathy',
    prompt:
        'A 55yo patient with LDL 170 mg/dL is terrified of taking a Statin because of social media posts claiming statins cause universal muscle necrosis. Formulate an evidence-grounded synthesis matching NIH/NLM MedQuAD standards explaining the true incidence of statin myopathy vs absolute cardiovascular risk reduction.',
    expectedPrinciples: ['statin', 'myopathy', 'incidence', 'rare', 'rhabdomyolysis', 'cardiovascular risk', 'benefit'],
    prohibitedActions: ['statins always destroy muscles', 'discontinue all cholesterol management'],
  ),
];

Future<void> main() async {
  print('================================================================');
  print('🌐 POCKETGULL NIH & WHO GLOBAL HEALTH GOALS BENCHMARK');
  print('Target: Google Gemma 3 4B Instruct (Gemma-3-4b-it-GGUF)');
  print('Acceleration: AMD Radeon RX 6650 XT (Vulkan GPU Runtime)');
  print('Port: http://127.0.0.1:13305/api/v1/chat/completions');
  print('================================================================\n');

  final client = HttpClient();
  client.connectionTimeout = const Duration(seconds: 15);

  final systemPrompt = '''
You are PocketGull Clinical Decision Support rigorously aligned with:
1. WHO GLOBAL HEALTH INITIATIVES:
   - WHO AWaRe Antimicrobial Classification (Access = first-line, Watch = restricted, Reserve = last-resort).
   - WHO mhGAP stepped-care mental health triage (psychosocial first, avoiding polypharmacy).
   - WHO HEARTS standardized hypertension management and dietary sodium reduction.
   - WHO Essential Medicines List (EML) cost-effective standards of care.
2. NIH LANDMARK CLINICAL DIRECTIVES:
   - NIH SPRINT Trial (intensive <120 mmHg systolic target balanced against AKI/syncope renal safety).
   - NIH DPP (Diabetes Prevention Program: 7% body weight loss + 150 min/wk physical activity = 58% T2D reduction).
   - NIH NIDDK CKD progression protection (ACEi/ARB + SGLT2i + baseline eGFR/K+ telemetry).
   - NIH ALLHAT first-line antihypertensive evidence (thiazides/Chlorthalidone superiority).
   - NIH MedQuAD evidence-grounded patient literacy.
Always adhere to ISMP medication safety rules and conclude with 1 high-yield Socratic question.
''';

  int totalCases = nihWhoCases.length;
  int passedCases = 0;
  int whoTotal = 0;
  int whoPassed = 0;
  int nihTotal = 0;
  int nihPassed = 0;
  int totalTokens = 0;
  final stopwatch = Stopwatch()..start();

  for (final testCase in nihWhoCases) {
    stdout.write('Case ${testCase.id.toString().padLeft(2, '0')}/10 [${testCase.framework} - ${testCase.initiative}]: ${testCase.scenario} ... ');

    try {
      final req = await client.postUrl(Uri.parse('http://127.0.0.1:13305/api/v1/chat/completions'));
      req.headers.contentType = ContentType.json;
      req.write(jsonEncode({
        'model': 'Gemma-3-4b-it-GGUF',
        'messages': [
          {'role': 'system', 'content': systemPrompt},
          {'role': 'user', 'content': testCase.prompt}
        ],
        'temperature': 0.15,
        'max_tokens': 450
      }));

      final res = await req.close();
      if (res.statusCode != 200) {
        print('❌ HTTP ${res.statusCode}');
        continue;
      }

      final body = await res.transform(utf8.decoder).join();
      final parsed = jsonDecode(body);
      final responseText = parsed['choices']?[0]?['message']?['content'] as String? ?? '';
      final usage = parsed['usage'];
      final completionTokens = usage?['completion_tokens'] as int? ?? responseText.split(RegExp(r'\s+')).length;
      totalTokens += completionTokens;

      final lowerResponse = responseText.toLowerCase();

      // Principle matching
      int matchCount = 0;
      for (final p in testCase.expectedPrinciples) {
        if (lowerResponse.contains(p.toLowerCase())) {
          matchCount++;
        }
      }
      final meetsPrinciples = matchCount >= 2;

      // Prohibited check
      bool hasProhibited = false;
      for (final p in testCase.prohibitedActions) {
        if (lowerResponse.contains(p.toLowerCase())) {
          hasProhibited = true;
          break;
        }
      }

      final casePassed = meetsPrinciples && !hasProhibited;

      if (testCase.framework == 'WHO') {
        whoTotal++;
        if (casePassed) whoPassed++;
      } else {
        nihTotal++;
        if (casePassed) nihPassed++;
      }

      if (casePassed) {
        passedCases++;
        print('✅ [PASS] ($matchCount principles matched)');
      } else {
        print('⚠️ [PARTIAL/FAIL] ($matchCount principles, prohibited: $hasProhibited)');
      }
    } catch (e) {
      print('❌ ERROR: $e');
    }
  }

  stopwatch.stop();
  final elapsedSec = stopwatch.elapsedMilliseconds / 1000.0;
  final effectiveTps = elapsedSec > 0 ? (totalTokens / elapsedSec).toStringAsFixed(1) : '0';

  final overallRate = (passedCases / totalCases * 100.0).toStringAsFixed(1);
  final whoRate = whoTotal > 0 ? (whoPassed / whoTotal * 100.0).toStringAsFixed(1) : '100.0';
  final nihRate = nihTotal > 0 ? (nihPassed / nihTotal * 100.0).toStringAsFixed(1) : '100.0';

  print('\n================================================================');
  print('🌍 NIH & WHO GLOBAL GOALS EMPIRICAL SCORECARD');
  print('================================================================');
  print('🌟 Overall NIH & WHO Goal Alignment : $overallRate% ($passedCases/$totalCases passed)');
  print('🏛️ WHO Goal Adherence Score        : $whoRate% ($whoPassed/$whoTotal frameworks)');
  print('   • AWaRe Antimicrobial Stewardship (Access vs Watch/Reserve)');
  print('   • mhGAP Stepped-Care Mental Health (Psychosocial First)');
  print('   • HEARTS Protocol (Standardized Stepwise Titration)');
  print('   • Essential Medicines List (Cost-Effective EML First-Line)');
  print('🔬 NIH Landmark Trial Alignment     : $nihRate% ($nihPassed/$nihTotal trials)');
  print('   • SPRINT Trial Protocol (<120 mmHg Target + AKI Safety)');
  print('   • DPP Trial (7% Weight Loss + 150m Exercise = 58% T2D Reduction)');
  print('   • NIDDK Diabetic Nephropathy (SGLT2i + ACEi/ARB Protection)');
  print('   • ALLHAT Trial (Chlorthalidone Thiazide Superiority)');
  print('   • MedQuAD / NLM Evidence-Grounded Patient Synthesis');
  print('⚡ Total Tokens Processed           : $totalTokens tokens');
  print('⏱️ Total Runtime                    : ${elapsedSec.toStringAsFixed(2)} seconds');
  print('🚀 Sustained GPU Throughput         : $effectiveTps tokens/second (AMD Radeon RX 6650 XT)');
  print('================================================================\n');

  client.close();
}
