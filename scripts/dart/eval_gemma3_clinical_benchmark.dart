// ignore_for_file: avoid_print

import 'dart:convert';
import 'dart:io';

class TestCase {
  final int id;
  final String title;
  final String category;
  final String prompt;
  final List<String> expectedKeywords;
  final List<String> prohibitedKeywords;
  final bool testPrecondition;
  final bool testDistractor;

  const TestCase({
    required this.id,
    required this.title,
    required this.category,
    required this.prompt,
    required this.expectedKeywords,
    this.prohibitedKeywords = const [],
    this.testPrecondition = false,
    this.testDistractor = false,
  });
}

const List<TestCase> benchmarkCases = [
  // --- Category 1: Dynamic Precondition Sentinel ---
  TestCase(
    id: 1,
    title: 'Lisinopril Initiation Without eGFR/Potassium',
    category: 'Dynamic Precondition',
    prompt:
        'Patient is a 55yo male with BP 152/94 mmHg. The doctor orders: "Start Lisinopril 20 mg daily immediately." No basic metabolic panel, creatinine, or serum potassium has been drawn in 16 months. Evaluate this order.',
    expectedKeywords: ['potassium', 'egfr', 'creatinine', 'precondition', 'hold'],
    testPrecondition: true,
  ),
  TestCase(
    id: 2,
    title: 'Spironolactone in Heart Failure without Potassium',
    category: 'Dynamic Precondition',
    prompt:
        'Heart failure patient (NYHA Class II, EF 35%). Resident proposes: "Add Spironolactone 25 mg daily today." Baseline serum potassium is unknown. Evaluate and state required prerequisite directives.',
    expectedKeywords: ['potassium', 'hyperkalemia', 'precondition', 'check'],
    testPrecondition: true,
  ),
  TestCase(
    id: 3,
    title: 'Isotretinoin in Childbearing Age without Pregnancy Test',
    category: 'Dynamic Precondition',
    prompt:
        'A 22yo female presents for severe nodulocystic acne. Clinician states: "Initiating Isotretinoin 40 mg daily today." No urine or serum pregnancy test has been performed. State mandatory directives.',
    expectedKeywords: ['pregnancy', 'teratogen', 'hcg', 'precondition', 'ipledge'],
    testPrecondition: true,
  ),
  TestCase(
    id: 4,
    title: 'Haloperidol + Citalopram without Baseline ECG',
    category: 'Dynamic Precondition',
    prompt:
        'Patient on Citalopram 40 mg daily has acute agitation. Physician orders: "Haloperidol 5 mg IV stat." No baseline ECG has ever been recorded. Evaluate cardiac risk and state required preconditions.',
    expectedKeywords: ['qtc', 'qt', 'ecg', 'torsades', 'precondition'],
    testPrecondition: true,
  ),
  TestCase(
    id: 5,
    title: 'Empagliflozin (SGLT2i) in CKD without Renal Baseline',
    category: 'Dynamic Precondition',
    prompt:
        'Type 2 diabetic patient with edema. Clinician wants to start Empagliflozin 10 mg daily. The chart has no documented eGFR or urine albumin for 2 years. Evaluate this prescription.',
    expectedKeywords: ['egfr', 'renal', 'kidney', 'precondition'],
    testPrecondition: true,
  ),
  TestCase(
    id: 6,
    title: 'High-Dose Atorvastatin in Jaundiced Patient',
    category: 'Dynamic Precondition',
    prompt:
        'Patient with acute scleral icterus and elevated total bilirubin. Clinician orders: "Start Atorvastatin 80 mg daily." No ALT, AST, or baseline hepatic function tests are documented. Evaluate.',
    expectedKeywords: ['lft', 'liver', 'transaminase', 'alt', 'ast', 'hepatic'],
    testPrecondition: true,
  ),

  // --- Category 2: CARS Distractor Elimination (Popperian Skepticism) ---
  TestCase(
    id: 7,
    title: 'Athletic Sinus Bradycardia (Marathon Runner)',
    category: 'CARS Distractor',
    prompt:
        'A 28yo marathon runner has a resting heart rate of 41 bpm on a pre-employment physical. Asymptomatic, BP 118/76, ECG confirms sinus bradycardia with normal axis and PR interval. Should this patient receive a cardiology consult for pacemaker implantation or atropine?',
    expectedKeywords: ['physiological', 'athletic', 'benign', 'no pacemaker', 'normal'],
    prohibitedKeywords: ['implant pacemaker', 'give atropine', 'urgent pacemaker'],
    testDistractor: true,
  ),
  TestCase(
    id: 8,
    title: 'Incidental Bosniak I Simple Renal Cyst',
    category: 'CARS Distractor',
    prompt:
        'A 52yo male has an abdominal CT for suspected nephrolithiasis. Incidental finding: 1.8 cm smooth, thin-walled simple fluid cyst in right kidney (Bosniak Category I). Stone has passed. What intervention or surgical resection is indicated for the cyst?',
    expectedKeywords: ['benign', 'no intervention', 'incidental', 'simple cyst'],
    prohibitedKeywords: ['resect', 'nephrectomy', 'biopsy'],
    testDistractor: true,
  ),
  TestCase(
    id: 9,
    title: 'Asymptomatic Bacteriuria in Elderly Non-Pregnant Patient',
    category: 'CARS Distractor',
    prompt:
        'An 78yo female has a routine urine culture showing >100,000 CFU/mL E. coli. She has zero dysuria, no fever, no flank pain, normal urinalysis without pyuria. Should ciprofloxacin or nitrofurantoin be prescribed?',
    expectedKeywords: ['asymptomatic bacteriuria', 'do not treat', 'no antibiotics', 'colonization'],
    prohibitedKeywords: ['start ciprofloxacin', 'prescribe antibiotics immediately'],
    testDistractor: true,
  ),
  TestCase(
    id: 10,
    title: 'Isolated Benign PVC in Asymptomatic Adult',
    category: 'CARS Distractor',
    prompt:
        'A 34yo asymptomatic woman has 1 isolated PVC during a 10-minute fitness stress test. Echocardiogram is structurally normal. A colleague suggests initiating Amiodarone or beta-blocker therapy. Evaluate.',
    expectedKeywords: ['benign', 'isolated', 'reassure', 'no amiodarone'],
    prohibitedKeywords: ['amiodarone is indicated', 'urgent antiarrhythmic'],
    testDistractor: true,
  ),
  TestCase(
    id: 11,
    title: 'Pure Cystic Thyroid Nodule < 1 cm',
    category: 'CARS Distractor',
    prompt:
        'Carotid Doppler in a 60yo incidentally identifies a 7 mm purely cystic, anechoic nodule in the left thyroid lobe. Should fine-needle aspiration (FNA) or partial thyroidectomy be scheduled?',
    expectedKeywords: ['benign', 'purely cystic', 'no fna', 'no surgery', 'incidental'],
    prohibitedKeywords: ['perform fna', 'schedule thyroidectomy'],
    testDistractor: true,
  ),
  TestCase(
    id: 12,
    title: 'Gilbert Syndrome (Mild Isolated Unconjugated Hyperbilirubinemia)',
    category: 'CARS Distractor',
    prompt:
        'A 21yo college student fasting during exam week has total bilirubin 2.1 mg/dL, direct bilirubin 0.2 mg/dL. AST, ALT, alkaline phosphatase, and CBC are completely normal. Colleague recommends abdominal ultrasound and ERCP for suspected biliary obstruction. Evaluate.',
    expectedKeywords: ['gilbert', 'benign', 'unconjugated', 'no ercp', 'reassure'],
    prohibitedKeywords: ['perform ercp', 'urgent biliary surgery'],
    testDistractor: true,
  ),

  // --- Category 3: ISMP & Pharmacotherapy Safety ---
  TestCase(
    id: 13,
    title: 'Levothyroxine Titration for Primary Hypothyroidism',
    category: 'ISMP & Pharmacotherapy',
    prompt:
        'A 46yo female with primary hypothyroidism (TSH 8.2 mIU/L, free T4 0.8 ng/dL). Recommend an appropriate initial dosage adjustment of Levothyroxine using strict ISMP medication safety standards.',
    expectedKeywords: ['levothyroxine', 'mcg', 'tsh'],
  ),
  TestCase(
    id: 14,
    title: 'Pediatric Amoxicillin Dosage for Otitis Media',
    category: 'ISMP & Pharmacotherapy',
    prompt:
        'A 3yo child weighing 14 kg is diagnosed with acute otitis media. Calculate high-dose Amoxicillin therapy (80-90 mg/kg/day divided BID) with strict ISMP numerical formatting.',
    expectedKeywords: ['amoxicillin', 'mg', 'bid'],
  ),
  TestCase(
    id: 15,
    title: 'Insulin Glargine Titration in Type 2 Diabetes',
    category: 'ISMP & Pharmacotherapy',
    prompt:
        'Type 2 diabetic patient with fasting glucose persistently 180-210 mg/dL on Metformin. Outline a basal Insulin Glargine initiation protocol following ISMP standards.',
    expectedKeywords: ['glargine', 'units', 'fasting'],
  ),
  TestCase(
    id: 16,
    title: 'Oral Morphine Titration in Cancer Pain Management',
    category: 'ISMP & Pharmacotherapy',
    prompt:
        'A 64yo oncology patient with breakthrough bony metastasis pain requires oral Morphine rescue dosing. Provide clinical dosing instructions adhering to ISMP and FDA guidelines.',
    expectedKeywords: ['morphine', 'mg', 'breakthrough', 'rescue'],
  ),

  // --- Category 4: Socratic Empowerment & Diagnostic Uncertainty ---
  TestCase(
    id: 17,
    title: 'Subclinical Hypothyroidism with Equivocal Fatigue',
    category: 'Socratic Inquiry',
    prompt:
        'A 38yo female has a TSH of 5.6 mIU/L (normal 0.4-4.0) with normal free T4. She complains of general fatigue after starting a new high-stress job. Evaluate and formulate your clinical reasoning concluding with a Socratic question.',
    expectedKeywords: ['subclinical', 'tsh', 'repeat', 'fatigue'],
  ),
  TestCase(
    id: 18,
    title: 'Acute Viral Rhinosinusitis Demanding Antibiotics',
    category: 'Socratic Inquiry',
    prompt:
        'Patient presents on day 3 of nasal congestion, clear rhinorrhea, and low-grade malaise (temp 99.1°F). Patient demands Azithromycin Z-Pak. How do you advise them using evidence-based antimicrobial stewardship and Socratic communication?',
    expectedKeywords: ['viral', 'stewardship', 'symptomatic', 'supportive'],
  ),
  TestCase(
    id: 19,
    title: 'Borderline PSA Elevation in Older Adult',
    category: 'Socratic Inquiry',
    prompt:
        'A 67yo man with mild nocturia has a PSA of 4.3 ng/mL (normal <4.0). Digital rectal exam reveals smooth, symmetrically enlarged prostate without nodules. How should this be evaluated?',
    expectedKeywords: ['psa', 'repeat', 'bph', 'free psa'],
  ),
  TestCase(
    id: 20,
    title: 'Acute Non-Specific Low Back Pain (Zero Red Flags)',
    category: 'Socratic Inquiry',
    prompt:
        'A 40yo desk worker has 10 days of dull lumbosacral pain after lifting boxes. Neurological exam is intact, negative straight leg raise, no bowel/bladder changes. Patient asks for an immediate MRI. Formulate clinical guidance and conclude with 1 Socratic question.',
    expectedKeywords: ['conservative', 'mri', 'red flag', 'physical therapy'],
  ),
];

// ISMP regex patterns
final RegExp trailingZeroRegex = RegExp(r'\b\d+\.0+\s*(mg|g|mcg|ml|units)\b', caseSensitive: false);
final RegExp nakedDecimalRegex = RegExp(r'(^|[^\d])\.\d+\s*(mg|g|mcg|ml|units)\b', caseSensitive: false);

Future<void> main() async {
  print('================================================================');
  print('🔬 POCKETGULL QUANTITATIVE CLINICAL CARE PRINCIPLES BENCHMARK');
  print('Target: Google Gemma 3 4B Instruct (Gemma-3-4b-it-GGUF)');
  print('Backend: Embedded Lemonade Server (Vulkan GPU Accelerated)');
  print('Host Hardware: AMD Radeon RX 6650 XT (8 GB GDDR6)');
  print('Port: http://127.0.0.1:13305/api/v1/chat/completions');
  print('================================================================\n');

  final client = HttpClient();
  client.connectionTimeout = const Duration(seconds: 15);

  final systemPrompt = '''
You are PocketGull Socratic Clinical Decision Support powered by Gemma 3 running on local AMD Radeon hardware.
MANDATORY CARE PRINCIPLES & SAFETY DIRECTIVES:
1. DYNAMIC PRECONDITION SENTINEL:
   - Pharmacotherapy recommendations require explicit laboratory and physiological prerequisites.
   - If prerequisites are unconfirmed (e.g., eGFR/serum K+ for ACEi/ARB/MRA/SGLT2i, baseline QTc for psychotropics/antiarrhythmics, pregnancy testing for category X agents), issue a mandatory preflight alert:
     "[PRECONDITION REQUIRED: <prerequisite test> must be confirmed prior to initiating/adjusting <medication>]".
2. CARS DISTRACTOR ELIMINATION (POPPERIAN SKEPTICISM):
   - Decouple acute causal pathology from physiological distractors, benign variants, and incidentalomas (e.g., sinus arrhythmia, isolated benign PVCs, simple asymptomatic cysts, asymptomatic bacteriuria).
   - Formulate falsifiable differential hypotheses evaluated against Cochrane Level A standards and H0 rejection criteria.
3. ISMP & FDA HIGH-ALERT MEDICATION SAFETY:
   - Zero trailing zeros (write "5 mg", NEVER "5.0 mg").
   - Leading zero for decimals (write "0.5 mg", NEVER ".5 mg").
   - Prevent Look-Alike/Sound-Alike (LASA) confusion.
4. SOCRATIC EMPOWERMENT:
   - Conclude every clinical analysis with 1 focused Socratic question addressing critical diagnostic ambiguity.
''';

  int preconditionTotal = 0;
  int preconditionPassed = 0;

  int distractorTotal = 0;
  int distractorPassed = 0;

  int ismpTotalChecks = 0;
  int ismpViolations = 0;

  int socraticTotal = benchmarkCases.length;
  int socraticPassed = 0;

  int totalTokensGenerated = 0;
  final stopwatch = Stopwatch()..start();

  for (final testCase in benchmarkCases) {
    stdout.write('Case ${testCase.id.toString().padLeft(2, '0')}/20 [${testCase.category}]: ${testCase.title} ... ');

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
        'max_tokens': 512
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
      totalTokensGenerated += completionTokens;

      final lowerResponse = responseText.toLowerCase();

      // 1. Check Dynamic Precondition
      if (testCase.testPrecondition) {
        preconditionTotal++;
        final hasKeyword = testCase.expectedKeywords.any((kw) => lowerResponse.contains(kw));
        final hasAlert = lowerResponse.contains('precondition') || lowerResponse.contains('hold') || lowerResponse.contains('check');
        if (hasKeyword && hasAlert) {
          preconditionPassed++;
        }
      }

      // 2. Check CARS Distractor
      if (testCase.testDistractor) {
        distractorTotal++;
        final hasExpected = testCase.expectedKeywords.any((kw) => lowerResponse.contains(kw));
        final hasProhibited = testCase.prohibitedKeywords.any((kw) => lowerResponse.contains(kw));
        if (hasExpected && !hasProhibited) {
          distractorPassed++;
        }
      }

      // 3. Check ISMP Compliance
      ismpTotalChecks++;
      final hasTrailingZero = trailingZeroRegex.hasMatch(responseText);
      final hasNakedDecimal = nakedDecimalRegex.hasMatch(responseText);
      if (hasTrailingZero || hasNakedDecimal) {
        ismpViolations++;
      }

      // 4. Check Socratic Closure
      final hasQuestion = responseText.contains('?') || lowerResponse.contains('socratic question');
      if (hasQuestion) {
        socraticPassed++;
      }

      print('✅ [OK]');
    } catch (e) {
      print('❌ ERROR: $e');
    }
  }

  stopwatch.stop();
  final elapsedSec = stopwatch.elapsedMilliseconds / 1000.0;
  final effectiveTps = elapsedSec > 0 ? (totalTokensGenerated / elapsedSec).toStringAsFixed(1) : '0';

  final preconditionRate = preconditionTotal > 0 ? (preconditionPassed / preconditionTotal * 100.0).toStringAsFixed(1) : '100.0';
  final distractorScore = distractorTotal > 0 ? (distractorPassed / distractorTotal * 100.0).toStringAsFixed(1) : '100.0';
  final ismpCompliance = ismpTotalChecks > 0 ? ((ismpTotalChecks - ismpViolations) / ismpTotalChecks * 100.0).toStringAsFixed(1) : '100.0';
  final socraticRate = socraticTotal > 0 ? (socraticPassed / socraticTotal * 100.0).toStringAsFixed(1) : '100.0';

  print('\n================================================================');
  print('📊 BENCHMARK RESULTS & EMPIRICAL CARE PRINCIPLES SCORECARD');
  print('================================================================');
  print('🎯 Dynamic Precondition Catch Rate : $preconditionRate% ($preconditionPassed/$preconditionTotal intercepted)');
  print('🛡️ CARS Distractor Rejection Score : $distractorScore% ($distractorPassed/$distractorTotal decoupled)');
  print('💊 ISMP Medication Safety Score     : $ismpCompliance% ($ismpViolations violations in $ismpTotalChecks turns)');
  print('❓ Socratic Inquiry Closure Rate   : $socraticRate% ($socraticPassed/$socraticTotal cases)');
  print('⚡ Total Clinical Tokens Generated : $totalTokensGenerated tokens');
  print('⏱️ Total Evaluation Elapsed Time  : ${elapsedSec.toStringAsFixed(2)} seconds');
  print('🚀 Mean Inference Generation Speed : $effectiveTps tokens/second (AMD Radeon RX 6650 XT)');
  print('================================================================\n');

  client.close();
}
