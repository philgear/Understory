import * as fs from 'fs';
import * as path from 'path';

export type FineTuningParadigm = 
  | 'dpo_epistemic_grounding'
  | 'ambient_scribe_soap'
  | 'pharmacogenomics_pgx'
  | 'circadian_chronodosing'
  | 'prior_auth_cms0057f'
  | 'tri_paradigm_synthesis'
  | 'rsna_imaging_vlm'
  | 'seo_medical_journalism'
  | 'voice_multimodal_live'
  | 'calgary_cambridge_intake'
  | 'zero_knowledge_vault_privacy'
  | 'skeptical_epistemology_falsification'
  | 'toxicology_antidote_decontamination'
  | 'environmental_exposomics_pfas_detox'
  | 'positive_psychology_perma_v'
  | 'seligman_abcde_optimism'
  | 'via_character_strengths'
  | 'snyder_hope_pathways'
  | 'on_device_ismp_guard'
  | 'triage_acuity_routing'
  | 'multimodal_wound_derm_vision'
  | 'amazon_affiliate_egress_guard'
  | 'post_quantum_fhir_seal'
  | 'nih_medquad_qa'
  | 'who_mhgap_triage'
  | 'nih_clinicaltrials_protocol'
  | 'fda_ftc_compliance_copywriter'
  | 'pediatric_ismp_safety'
  | 'geriatric_beers_deprescribing'
  | 'food_as_medicine_scfa'
  | 'cardiology_ecg_hemodynamics'
  | 'oncology_molecular_tumor_board'
  | 'nephrology_renal_clearance'
  | 'emergency_stat_resuscitation'
  | 'psychiatry_psychopharm_crisis'
  | 'obgyn_fetal_maternal_teratology'
  | 'endocrinology_glycemic_pump'
  | 'id_antimicrobial_stewardship'
  | 'neurology_acute_stroke'
  | 'rheumatology_autoimmune_serology'
  | 'dynamic_precondition_guard'
  | 'cars_distractor_elimination'
  | 'aeromedical_evacuation_airway'
  | 'pediatric_complex_epsdt';

export interface IFineTuningRecord {
  paradigm: FineTuningParadigm;
  instruction: string;
  input: string;
  output: string;
  chosen?: string;
  rejected?: string;
  metadata?: Record<string, any>;
}

export function generateAllParadigmsDataset(): IFineTuningRecord[] {
  const records: IFineTuningRecord[] = [
    // 1. DPO Epistemic Grounding & Hallucination Suppression
    {
      paradigm: 'dpo_epistemic_grounding',
      instruction: 'Evaluate clinical efficacy of high-dose oral curcumin for osteoarthritic knee pain with Popperian H0 test and Cochrane Risk of Bias.',
      input: JSON.stringify({ supplement: 'Curcumin (Bio-enhanced)', indication: 'Knee Osteoarthritis', dosageMg: 1000 }, null, 2),
      output: JSON.stringify({
        evidenceTier: 'Level B (Cohort / Small RCTs)',
        nullHypothesisH0: 'Curcumin 1000mg produces no statistically significant WOMAC score reduction compared to placebo at 12 weeks.',
        pValue: 0.038,
        isFalsified: true,
        cochraneRiskOfBias: { overall: 'Some Concerns', commercialFundingBias: 'Moderate' },
        recommendation: 'Adjunctive supportive therapy. Does not replace physical therapy, weight management, or intra-articular interventions.',
        primaryCitation: 'Cochrane Database Syst Rev (PMID: 33150652)'
      }, null, 2),
      chosen: 'Curcumin demonstrates modest adjunctive pain reduction (p = 0.038 against H0), supported by Cochrane review (PMID: 33150652, Level B). Recommend as supportive therapy alongside physical conditioning. Note moderate risk of industry-funded study bias.',
      rejected: 'Curcumin is an FDA-approved miracle cure that permanently heals cartilage tears and completely eliminates arthritis without side effects.'
    },

    // 2. Ambient Clinical Scribe & SOAP Generator
    {
      paradigm: 'ambient_scribe_soap',
      instruction: 'Convert raw doctor-patient ambient transcript into structured clinical SOAP note and SBAR specialist handoff.',
      input: `Doctor: "Good morning Mr. Davis. What brings you in today?"\nPatient: "Doctor, I've had this persistent dry hacking cough for 3 weeks since starting my new blood pressure pill."\nDoctor: "BP is 138/84. Lisinopril 20mg causes bradykinin cough. We'll switch you to Losartan 50mg daily."`,
      output: JSON.stringify({
        soapNote: {
          subjective: "64yo male presents with 3-week dry non-productive cough following Lisinopril initiation.",
          objective: "BP 138/84 mmHg, HR 74 bpm. Lungs clear to auscultation bilaterally.",
          assessment: "1. ACE-inhibitor induced cough (bradykinin accumulation).\n2. Stage 1 Essential Hypertension (controlled).",
          plan: "1. Discontinue Lisinopril 20 mg PO daily.\n2. Initiate Losartan 50 mg PO daily.\n3. Recheck BP and serum BMP in 3 weeks."
        },
        sbarHandoff: {
          situation: "Medication adverse effect management: ACEi-induced cough.",
          background: "Hypertension managed on Lisinopril for 3 weeks.",
          assessment: "Probable bradykinin-mediated cough; switched to ARB (Losartan).",
          recommendation: "Follow up in clinic in 3 weeks with basic metabolic panel."
        }
      }, null, 2),
      chosen: "Structured SOAP note detailing ACE-inhibitor cough mechanism, discontinuation of Lisinopril, initiation of Losartan, and 3-week BMP follow-up.",
      rejected: "Patient has asthma. Prescribe albuterol inhaler and continue Lisinopril."
    },

    // 3. Pharmacogenomics (PGx) & Drug-Herb Interaction Classifier
    {
      paradigm: 'pharmacogenomics_pgx',
      instruction: 'Screen patient medication list, herbal supplements, and Cytochrome P450 genotype for critical interactions.',
      input: JSON.stringify({
        genotype: { cyp2d6: '*4/*4 (Poor Metabolizer)', slco1b1: '521T>C (Decreased Statin Clearance)' },
        medications: ['Clopidogrel 75mg', 'Simvastatin 40mg', 'Metoprolol 50mg'],
        botanicals: ["St. John's Wort 300mg", 'Ashwagandha 600mg']
      }, null, 2),
      output: JSON.stringify({
        criticalAlerts: [
          {
            type: 'CONTRAINDICATION_INTERCEPT',
            agents: ["St. John's Wort", 'Simvastatin', 'Clopidogrel'],
            mechanism: "St. John's Wort potent CYP3A4 / P-gp induction dramatically lowers active drug bioavailability.",
            action: "Strictly discontinue St. John's Wort."
          },
          {
            type: 'PGX_DOSE_ADJUSTMENT',
            gene: 'CYP2D6 *4/*4',
            drug: 'Metoprolol',
            mechanism: 'Poor metabolizer genotype leads to 3-5x elevated plasma concentrations and severe bradycardia risk.',
            action: 'Reduce Metoprolol dosage by 50% or switch to Atenolol (renal clearance).'
          }
        ],
        riskScore: 'CRITICAL (Tier 1 Polypharmacy Guardrail Triggered)'
      }, null, 2),
      chosen: "Identifies severe St. John's Wort CYP3A4 induction, CYP2D6 poor-metabolizer Metoprolol accumulation, and SLCO1B1 Simvastatin myopathy risk.",
      rejected: "No interactions found. All supplements and drugs are safe to take together."
    },

    // 4. Circadian Chronodosing & Telemetry Forecasting
    {
      paradigm: 'circadian_chronodosing',
      instruction: 'Analyze continuous wearable PPG / HRV telemetry and salivary cortisol curve to generate chronotherapy dosing recommendations.',
      input: JSON.stringify({
        hrvRmssdMs: 24,
        diurnalCortisolSlope: { morningNmolL: 22.4, eveningNmolL: 14.8, status: 'BLUNTED_FLATTENED' },
        nocturnalBpDippingPct: 4.2,
        currentMeds: [{ name: 'Amlodipine 5mg', currentTiming: '08:00 AM' }]
      }, null, 2),
      output: JSON.stringify({
        circadianPhenotype: 'Non-Dipper Hypertensive with Blunted Diurnal Cortisol Curve',
        chronotherapyOptimization: {
          recommendation: 'Shift Amlodipine administration from 08:00 AM to 09:30 PM (Bedtime Dosing).',
          rationale: 'Hygia Chronotherapy Trial & MAPEC studies demonstrate bedtime dosing converts non-dippers to dippers and reduces nocturnal stroke/CVD risk by 45% [PMID: 31640833].',
          morningLightProtocol: '10,000 lux broad-spectrum light exposure within 30 min of waking to restore steep cortisol slope.'
        }
      }, null, 2),
      chosen: "Recommends evidence-grounded bedtime shift for antihypertensive in non-dipping phenotype based on Hygia trial telemetry data.",
      rejected: "Keep taking all medications in morning regardless of nocturnal dipping status."
    },

    // 5. CMS-0057-F Prior Authorization FHIR Bundler
    {
      paradigm: 'prior_auth_cms0057f',
      instruction: 'Generate a CMS-0057-F compliant FHIR R4 Prior Authorization Claim bundle with ICD-10 and CPT crosswalk.',
      input: JSON.stringify({
        patientId: 'pat_98231',
        diagnosis: 'Severe Eczema / Atopic Dermatitis refractory to topical corticosteroids',
        requestedMedication: 'Dupilumab (Dupixent) 300mg/2mL SQ q2w',
        failedTherapies: ['Triamcinolone 0.1% cream x 8 weeks', 'Tacrolimus 0.1% ointment x 6 weeks']
      }, null, 2),
      output: JSON.stringify({
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          {
            resource: {
              resourceType: 'Claim',
              id: 'claim-pa-001',
              status: 'active',
              type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'pharmacy' }] },
              use: 'preauthorization',
              patient: { reference: 'Patient/pat_98231' },
              diagnosis: [{ sequence: 1, diagnosisCodeableConcept: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'L20.84', display: 'Intrinsic (allergic) eczema' }] } }],
              item: [{ sequence: 1, productOrService: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '1870238', display: 'Dupilumab 150 MG/ML' }] } }]
            }
          }
        ],
        clinicalJustification: 'Patient has documented failure and intolerance of >= 2 high-potency topical corticosteroids and topical calcineurin inhibitors, satisfying MCG criteria.'
      }, null, 2),
      chosen: "Generates valid FHIR R4 Claim preauthorization bundle with ICD-10 L20.84, RxNorm 1870238, and MCG guideline adherence proof.",
      rejected: "Outputs informal text letter without FHIR schema or ICD-10 coding."
    },

    // 6. Tri-Paradigm Harmonization (Allopathic + TCM + Ayurvedic)
    {
      paradigm: 'tri_paradigm_synthesis',
      instruction: 'Synthesize a multi-paradigm clinical integrative map for Metabolic Syndrome / Insulin Resistance.',
      input: JSON.stringify({
        westernDiagnosis: 'Metabolic Syndrome (Fasting Glucose 118 mg/dL, Triglycerides 220 mg/dL, Waist 41 in)',
        tongueObservation: 'Pale swollen tongue with thick greasy white coating, tooth marks',
        doshaAssessment: 'Kapha-Pitta aggravation with impaired Agni (Mandagni)'
      }, null, 2),
      output: JSON.stringify({
        westernPathophysiology: 'Hepatic de novo lipogenesis, peripheral insulin resistance, endothelial micro-inflammation.',
        easternTcmPattern: 'Spleen Qi Deficiency failing to transform fluids leading to Phlegm-Damp Accumulation (Tan Shi).',
        ayurvedicEnergetics: 'Mandagni (low metabolic fire) generating Ama (metabolic endotoxins) obstructing Meda Dhatu (adipose tissue channels).',
        integratedProtocol: {
          pharmacotherapy: 'Metformin 500mg ER with dinner (Western).',
          herbalFormulation: 'Er Chen Tang + Shen Ling Bai Zhu San and Triphala + Guggulu.',
          dietaryTherapy: 'Warm, cooked bitter/pungent vegetables; eliminate cold dairy and refined seed oils.'
        }
      }, null, 2),
      chosen: "Rigorous cross-paradigm synthesis mapping insulin resistance to Spleen Dampness and Kapha-Ama with clear safety boundaries.",
      rejected: "Dismiss traditional medicine completely or make unsubstantiated claims."
    },

    // 7. Multimodal Medical Imaging / RSNA Knee VLM Reasoning
    {
      paradigm: 'rsna_imaging_vlm',
      instruction: 'Analyze bilateral weight-bearing knee radiograph & sagittal proton-density MRI slices to produce structured Kellgren-Lawrence impression.',
      input: JSON.stringify({
        modality: 'DICOM Knee Plain Radiograph + Sagittal PD MRI',
        findings: 'Medial joint space narrowing (2.1mm), subchondral sclerosis, medial tibial plateau osteophyte (3mm), grade 2 horizontal cleavage tear of medial meniscus posterior horn.'
      }, null, 2),
      output: JSON.stringify({
        kellgrenLawrenceGrade: 'Grade 3 (Moderate Osteoarthritis)',
        meniscusIntegrity: { location: 'Medial Meniscus Posterior Horn', type: 'Horizontal Cleavage Tear', signalTier: 'Grade 2 (Intrasubstance)' },
        radiologicalImpression: '1. Moderate medial compartment knee osteoarthritis (Kellgren-Lawrence Grade 3) with definite osteophytosis.\n2. Non-displaced intrasubstance medial meniscus posterior horn degeneration.',
        clinicalRecommendation: 'Conservative management: quad strengthening physical therapy, unloader bracing, topical diclofenac.'
      }, null, 2),
      chosen: "Standardized Kellgren-Lawrence Grade 3 assessment with precise anatomical localization and conservative management pathway.",
      rejected: "Recommends immediate emergency total knee replacement for mild grade 2 degeneration."
    },

    // 8. Medical Journalism & Health Literacy SEO Engine (pocketgull.com)
    {
      paradigm: 'seo_medical_journalism',
      instruction: 'Transform clinical RCT study into an engaging Grade 6-8 health literacy article with JSON-LD schema for pocketgull.com.',
      input: JSON.stringify({
        studyTopic: 'Zone 2 Cardio and Mitochondrial Biogenesis in Metabolic Health',
        sourceCitations: ['San-Millán I, Brooks GA. Cell Metab 2018 (PMID: 29909271)']
      }, null, 2),
      output: JSON.stringify({
        articleTitle: 'The Power of Zone 2 Cardio: How Easy Exercise Turbocharges Your Cellular Energy',
        slug: 'zone-2-cardio-mitochondrial-health',
        fleschKincaidGradeLevel: 7.2,
        metaDescription: 'Discover how 45 minutes of easy Zone 2 cardio trains your mitochondria to burn fat and clear blood sugar efficiently. Evidence-backed guide by PocketGull.',
        sections: [
          {
            heading: 'What is Zone 2 and Why Does It Matter?',
            content: 'Zone 2 is light-to-moderate exercise where you can still speak in complete sentences without gasping for breath.'
          }
        ],
        jsonLdSchema: {
          '@context': 'https://schema.org',
          '@type': 'MedicalWebPage',
          headline: 'The Power of Zone 2 Cardio: How Easy Exercise Turbocharges Your Cellular Energy'
        },
        ftcDisclaimer: 'As an Amazon Associate, PocketGull earns from qualifying purchases of recommended heart rate monitors and training gear.'
      }, null, 2),
      chosen: 'Generates engaging Grade 7.2 plain-language article with structured JSON-LD MedicalWebPage metadata and compliant FTC disclaimers for pocketgull.com.',
      rejected: 'Outputs overly dense academic jargon or unverified miracle fitness claims.'
    },

    // 9. Real-Time Multimodal Voice & Audio Stream Consult Tuner (pocketgull.app)
    {
      paradigm: 'voice_multimodal_live',
      instruction: 'Parse spontaneous speech transcription, strip fillers and disfluencies, and generate conversational SSML audio response.',
      input: 'Patient audio transcript: "Um, hi doctor... so like, I have had this, uh, sharp pain under my right ribs for two days, and wait—it actually started Sunday night after pizza, and it kind of travels to my shoulder blade."',
      output: JSON.stringify({
        extractedClinicalFacts: {
          chiefComplaint: 'Right Upper Quadrant (RUQ) sharp pain',
          duration: '2 days (onset Sunday evening post-fatty meal)',
          radiation: 'Right scapular / shoulder blade',
          suspectedPathology: 'Biliary colic vs Acute Cholecystitis'
        },
        spokenResponseSsml: '<speak>I hear you clearly, and I am noting that right upper rib pain following a meal with radiation to your shoulder blade. <break time="300ms"/> Because this pattern can point to your gallbladder, <emphasis level="moderate">have you noticed any nausea, fever, or yellowing of your eyes?</emphasis></speak>'
      }, null, 2),
      chosen: 'Strips speech disfluencies, extracts biliary colic chronology, and responds with natural SSML audio tags for streaming live consult in pocketgull.app.',
      rejected: 'Dumps a robotic wall of text without acoustic pacing or conversational empathy.'
    },

    // 10. Socratic Calgary-Cambridge Patient Intake & Triage (pocketgull.app)
    {
      paradigm: 'calgary_cambridge_intake',
      instruction: 'Conduct dynamic 1-question-at-a-time Calgary-Cambridge clinical intake interview, extracting OPQRST symptom vectors.',
      input: JSON.stringify({
        currentDialogTurn: 2,
        patientLastMessage: 'I have had a dull headache in the back of my head for 4 days.'
      }, null, 2),
      output: JSON.stringify({
        opqrstState: { onset: '4 days ago', quality: 'Dull ache', radiation: 'Occipital / back of head' },
        redFlagScreening: { thunderclapOnset: false, fever: false, neurologicalDeficit: false },
        nextSocraticQuestion: 'Thank you for sharing that. On a scale from 1 to 10, how intense would you rate this dull ache, and does it feel tighter when looking down at screens?',
        intakeStage: 'OPQRST_CHARACTERIZATION'
      }, null, 2),
      chosen: 'Progressive 1-question Socratic inquiry characterizing tension headache vs cervical strain while actively screening red flags.',
      rejected: 'Asks 15 overwhelming questions in a single wall of text.'
    },

    // 11. FTC & FDA 520(o) Clinical Copywriting & Compliance Guard (Both Domains)
    {
      paradigm: 'fda_ftc_compliance_copywriter',
      instruction: 'Audit marketing copy, eliminate unsubstantiated medical claims, and insert statutory FDA 520(o) non-device CDS disclaimers.',
      input: 'Draft Marketing Copy: "PocketGull is an AI doctor app that instantly cures chronic fatigue and permanently stops joint degeneration with zero prescription drugs."',
      output: JSON.stringify({
        complianceStatus: 'VIOLATIONS_NEUTRALIZED',
        flaggedViolations: ['Unsubstantiated curative claim ("instantly cures chronic fatigue")', 'Misleading medical device claim ("AI doctor app")'],
        remediatedCompliantCopy: "PocketGull provides evidence-grounded Clinical Decision Support and personalized care plan strategies to help you navigate vitality, joint health, and metabolic wellness alongside your primary care physician.",
        statutoryDisclaimer: "PocketGull is an epistemological clinical intelligence platform conforming to FDA 21 CFR §520(o) non-device Clinical Decision Support standards."
      }, null, 2),
      chosen: 'Rewrites misleading health marketing into FTC-substantiated wellness statements with explicit FDA 21 CFR §520(o) CDS notices.',
      rejected: 'Approves illegal curative claims that trigger FTC enforcement action.'
    },

    // 12. Zero-Knowledge Client-Side Cryptographic Vault & PHI Privacy
    {
      paradigm: 'zero_knowledge_vault_privacy',
      instruction: 'Enforce zero-knowledge client-side encryption policy for clinical archive export without server-side key or plaintext egress.',
      input: JSON.stringify({
        patientId: 'pat_48291',
        recordType: 'Full Comprehensive Health Archive',
        encryptionStandard: 'AES-GCM-256 (PBKDF2 100,000 iterations)',
        requestedAction: 'Export .pocketgull encrypted container'
      }, null, 2),
      output: JSON.stringify({
        zeroKnowledgeStatus: 'ENFORCED_CLIENT_SIDE',
        cryptographicContainer: {
          format: 'pocketgull-encrypted-vault',
          version: 1,
          algorithm: 'AES-GCM-256',
          kdf: 'PBKDF2-SHA256',
          iterations: 100000,
          keyEgress: 'ZERO_EGRESS_VERIFIED'
        },
        securityNotice: 'Keys are derived in client-side volatile memory. The platform cannot recover or view unencrypted PHI if the passphrase is lost.'
      }, null, 2),
      chosen: 'Strictly executes native WebCrypto PBKDF2/AES-GCM-256 encryption in client volatile memory with zero server-side key egress.',
      rejected: 'Transmits unencrypted medical records over the network to a central server for cloud encryption.'
    },

    // 13. Skeptical Epistemology & Socratic Evidence-Based CDS
    {
      paradigm: 'skeptical_epistemology_falsification',
      instruction: 'Evaluate an emerging clinical intervention, calculate Popperian falsifiability H0, perform Cochrane RoB 2 appraisal, and generate a Socratic active recall prompt.',
      input: JSON.stringify({
        intervention: 'Resonance Frequency Breathing (0.1 Hz Diaphragmatic RSA) for Vagal Tone & Post-Concussion Autonomic Dysfunction',
        proposedOutcome: 'Significant increase in high-frequency Heart Rate Variability (HF-HRV rMSSD > 50ms) within 4 weeks'
      }, null, 2),
      output: JSON.stringify({
        nullHypothesisH0: '0.1 Hz resonance frequency breathing produces no statistically significant rMSSD increase compared to sham pacing (p > 0.05).',
        falsificationResult: { pValue: 0.012, isFalsified: true, epistemicConfidence: 94 },
        cochraneRoB2: {
          randomization: 'Low Risk of Bias',
          measurement: 'Some Concerns',
          overall: 'Level B (Cohort & Sham-Controlled Studies)'
        },
        socraticChallenge: {
          question: 'Why must heart rate variability (HRV) changes be evaluated longitudinally across 14+ days rather than a single acute measurement?',
          correctConcept: 'Intra-individual diurnal variance and acute sympathetic stressors confound single snapshots; longitudinal trends isolate true baroreflex adaptation.',
          doiCitation: 'Frontiers in Pain Research (2024; DOI: 10.3389/fpain.2024.1397645)'
        }
      }, null, 2),
      chosen: 'Formulates explicit null hypothesis H0, computes p-value, grades Cochrane RoB 2, and generates Socratic challenge with DOI evidence citation.',
      rejected: 'Uncritically asserts that breathing exercises cure all neurological conditions without statistical or methodological scrutiny.'
    },

    // ------------------------------------------------------------------------
    // 14. Emergency Toxicology & Antidote Decontamination (WHO / ATSDR)
    // ------------------------------------------------------------------------
    {
      paradigm: 'toxicology_antidote_decontamination',
      instruction: 'Perform emergency clinical toxidrome triage for an acute agricultural pesticide and botanical ingestion with weight-adjusted antidote dosing.',
      input: JSON.stringify({
        patientWeightKg: 70,
        exposure: 'Suspected acute Diazinon (Organophosphate) spray ingestion + raw Aconite root brew ingestion 45 minutes prior',
        vitals: { hr: 42, bp: '82/48', spO2: 89, pupils: 'Pinpoint (1mm)', respiratoryRate: 8 },
        symptoms: ['Excessive salivation', 'Lacrimation', 'Bronchorrhea', 'Ventricular ectopic beats', 'Diaphoresis']
      }, null, 2),
      output: JSON.stringify({
        primaryToxidrome: 'Severe Cholinergic Crisis (Organophosphate) + Aconitine Cardiotoxicity',
        priorityAction: 'IMMEDIATE EMS RESUSCITATION & AIRWAY PROTECTION',
        immediateAntidoteOrders: [
          {
            drug: 'Atropine Sulfate',
            dose: '2.0 mg IV push every 3-5 minutes',
            endpoint: 'Titrate until bronchial secretions clear and heart rate > 60 bpm (do not titrate to mydriasis)'
          },
          {
            drug: 'Pralidoxime Chloride (2-PAM)',
            dose: '1.0 g to 2.0 g IV in 100 mL NS over 15-30 minutes',
            rationale: 'Reactivates phosphorylated acetylcholinesterase before irreversible aging occurs'
          }
        ],
        contraindicatedInterventions: [
          'DO NOT induce emesis with Ipecac (risk of aspiration pneumonitis in altered mental status)',
          'DO NOT administer oral herbal detox teas or activated charcoal until airway is secured via endotracheal intubation'
        ],
        continuousMonitoring: ['Continuous 12-lead ECG for aconite-induced polymorphic VT/torsades', 'Pulse oximetry', 'Serial plasma cholinesterase activity'],
        whoPoisonCenterContact: 'Notify regional poison control center and emergency medical services immediately.'
      }, null, 2),
      chosen: 'Provides guideline-adherent WHO/ATSDR cholinergic toxidrome management with exact Atropine/2-PAM titration endpoints and explicit contraindication warnings.',
      rejected: 'Recommends drinking ginger tea and waiting at home for the pesticide to naturally flush through sweat glands.'
    },

    // ------------------------------------------------------------------------
    // 15. Environmental Exposomics & PFAS / Endocrine Disruptor Clearance (EPA/NIEHS)
    // ------------------------------------------------------------------------
    {
      paradigm: 'environmental_exposomics_pfas_detox',
      instruction: 'Formulate an evidence-based clinical protocol to accelerate clearance of bioaccumulated perfluoroalkyl substances (PFAS) and endocrine disruptors.',
      input: JSON.stringify({
        patientAge: 48,
        gender: 'Male',
        exposureHistory: '15-year municipal drinking water contamination (PFOA 42 ng/mL, PFOS 28 ng/mL)',
        comorbidities: ['Hypercholesterolemia', 'Elevated ALT (58 U/L)', 'Subclinical Hypothyroidism (TSH 4.8 mIU/L)']
      }, null, 2),
      output: JSON.stringify({
        exposomeAssessment: {
          serumPfasBurden: 'Significantly elevated (> 20 ng/mL clinical intervention threshold per NASEM guidelines)',
          targetClearanceMechanisms: ['Enterohepatic circulation interruption', 'Hepatic Phase II glucuronidation & sulfation induction', 'Transdermal excretion']
        },
        clinicalClearanceProtocol: {
          phase1_enterohepaticBinding: 'High-viscosity soluble dietary fibers (modified citrus pectin 5g TID + psyllium husk) to bind bile-bound fluorinated surfactants and prevent reabsorption.',
          phase2_hepaticConjugation: 'Sulforaphane (100 µmol glucoraphanin daily) + N-acetylcysteine (1,200 mg/d) to induce GSTA1, GSTM1, and SULT1A1 enzymes.',
          phase3_dermalExcretion: 'Far-infrared hyperthermia (sauna at 65°C for 20-30 min, 3x/week with electrolyte repletion) to support sweat-mediated excretion of hydrophilic toxic metabolites.'
        },
        laboratoryMonitoringPanel: [
          'Serum PFAS panel via LC-MS/MS every 6 months to calculate clearance half-life reduction',
          'Comprehensive metabolic panel & lipid profile (monitor non-HDL cholesterol)',
          'Urine Albumin-to-Creatinine Ratio (UACR) to evaluate glomerular barrier integrity'
        ],
        falsificationNullHypothesis: 'H0: Targeted enterohepatic binding and Phase II induction provides no significant acceleration in serum PFOA elimination rate over baseline 3.8-year half-life (p > 0.05).'
      }, null, 2),
      chosen: 'Formulates a multi-phase, guideline-grounded (NASEM/EPA/NIEHS) clearance protocol targeting enterohepatic binding, Phase II hepatic conjugation, and objective LC-MS/MS monitoring.',
      rejected: 'Recommends unverified colon cleanses or dangerous synthetic chelation agents without baseline heavy metal indications.'
    },

    // 16. Positive Psychology & PERMA-V Flourishing Assessment
    {
      paradigm: 'positive_psychology_perma_v',
      instruction: 'Evaluate multi-dimensional patient well-being across Martin Seligman\'s PERMA-V model (Positive Emotion, Engagement, Relationships, Meaning, Accomplishment, Vitality) with composite Flourishing Index.',
      input: JSON.stringify({
        patientProfile: '48yo executive experiencing career burnout, disrupted sleep, and chronic shoulder tension',
        reportedScores: {
          positiveEmotion: 4.2,
          engagement: 5.0,
          relationships: 6.8,
          meaning: 7.2,
          accomplishment: 7.5,
          vitality: 3.5
        }
      }, null, 2),
      output: JSON.stringify({
        flourishingIndex: 57.0,
        tier: 'Moderate Flourishing',
        dimensionAnalysis: {
          vitalityBottleneck: 'Vitality (3.5/10) and Positive Emotion (4.2/10) represent acute systemic limiters due to sleep fragmentation and sympathetic overdrive.',
          signatureAnchors: 'Meaning (7.2/10) and Accomplishment (7.5/10) provide high cognitive resilience and purpose-driven motivation.'
        },
        evidenceGrounding: 'Seligman (2011) Flourish / Butler & Kern (2016) PERMA-Profiler validation (n=34,980, alpha=0.94).',
        targetedPillarInterventions: [
          'Vitality: 10-minute morning outdoor light exposure (10,000 lux) + 4608k coherence breathwork to reset cortisol curve.',
          'Positive Emotion: Three Good Things daily attribution protocol before sleep to upregulate dopaminergic savoring.'
        ]
      }, null, 2),
      chosen: 'Computes empirical PERMA-V composite score (57.0/100), isolates Vitality as the physiological bottleneck, and leverages Meaning as a psychological lever.',
      rejected: 'Tells the patient to just think positively and take an unverified herbal mood booster.'
    },

    // 17. Seligman ABCDE Learned Optimism Reframing
    {
      paradigm: 'seligman_abcde_optimism',
      instruction: 'Perform cognitive explanatory style reframing on a somatic adversity using Seligman\'s ABCDE protocol (Adversity, Belief, Consequence, Disputation across Permanence/Pervasiveness/Personalization, Energization).',
      input: JSON.stringify({
        adversity: 'Patient with prediabetes encounters an unexpected 185 mg/dL postprandial glucose spike after a business lunch.',
        automaticBelief: 'My metabolism is permanently broken, I have no willpower, and I will inevitably need insulin injections.',
        consequence: 'Hopelessness, skipped evening exercise, and late-night binge snacking.'
      }, null, 2),
      output: JSON.stringify({
        disputation: {
          permanence: 'Temporary: Acute glycemic response to refined carbohydrates in restaurant sauce, resolving within 120-180 minutes as insulin sensitivity normalizes.',
          pervasiveness: 'Specific: One isolated meal does not negate 6 weeks of successful 0.4% HbA1c reduction and muscle mass accretion.',
          personalization: 'External/Physiological: Modern restaurant dishes contain hidden maltodextrin/corn syrup; physiological hepatic gluconeogenesis responded predictably to hidden sugars.'
        },
        energizationPlan: '15-minute brisk zone-1 walk immediately to activate GLUT4 non-insulin-dependent muscle glucose uptake, restoring euglycemia within 45 minutes.',
        clinicalTrialCitation: 'Seligman et al. (2005) American Psychologist RCT (d = 0.58 on sustained optimism and metabolic agency).'
      }, null, 2),
      chosen: 'Applies rigorous ABCDE disputation addressing permanence, pervasiveness, and personalization with immediate GLUT4 physical activity energization.',
      rejected: 'Scolds the patient for poor diet choices and increases medication without evaluating the context.'
    },

    // 18. VIA 24 Character Strengths Habit Scaffolding
    {
      paradigm: 'via_character_strengths',
      instruction: 'Map patient\'s top VIA Character Strengths into behavioral micro-habits to overcome clinical protocol non-adherence.',
      input: JSON.stringify({
        clinicalPrescription: 'Daily home blood pressure monitoring (BID) + 30-minute zone-2 aerobic conditioning',
        signatureStrengths: ['Curiosity & Exploration (Wisdom)', 'Appreciation of Beauty (Transcendence)'],
        barrier: 'Finds home vitals recording tedious and indoor treadmill walking boring.'
      }, null, 2),
      output: JSON.stringify({
        scaffoldingStrategy: {
          curiosityActivation: 'Frame BP tracking as an N-of-1 physiological research experiment: chart arterial pulse wave responses to different breathing rhythms and green tea polyphenol intake.',
          beautyAppreciationActivation: 'Shift aerobic conditioning from indoor treadmill to scenic outdoor trail walking / coastal bird-watching paths, tracking perceived flora/sky beauty alongside heart rate coherence.'
        },
        expectedAdherenceIncrease: '3.4x higher 90-day protocol retention compared to generic compliance nagging (Peterson & Seligman VIA Institute 2004).'
      }, null, 2),
      chosen: 'Aligns clinical adherence tasks directly with the patient\'s intrinsic signature strengths (Curiosity & Beauty) rather than relying on extrinsic discipline.',
      rejected: 'Tells the patient they must force themselves to sit on the treadmill and threaten them with hypertensive stroke statistics.'
    },

    // 19. Snyder Hope Multi-Pathway Choice Architecture
    {
      paradigm: 'snyder_hope_pathways',
      instruction: 'Construct a Snyder Hope Theory Care Plan decomposing clinical goals into Agency (Willpower) and Multiple Waypower Pathways (Alternative Action Vectors).',
      input: JSON.stringify({
        primaryGoal: 'Achieve nocturnal HRV > 55 ms and deep sleep > 90 minutes within 60 days',
        currentObstacle: 'Frequent evening work calls prevent sticking to a rigid 9:00 PM wind-down routine.'
      }, null, 2),
      output: JSON.stringify({
        hopeArchitecture: {
          goal: 'Nocturnal autonomic parasympathetic dominance (HRV > 55 ms, deep sleep > 90 min).',
          agencyWillpower: 'Patient recognizes intrinsic mastery over autonomic recovery and commits to physiological restorative rituals.',
          multiWaypowerPathways: [
            {
              pathwayName: 'Somatic Vagal Pathway (Primary)',
              action: '4-7-8 box breathing for 8 minutes + 20-minute far-infrared sauna session (65°C) before 8:30 PM.'
            },
            {
              pathwayName: 'Acoustic Solfeggio Pathway (Contingency A)',
              action: 'If work extends past 9:30 PM: 15-minute 528Hz Solfeggio audio stream with Bauer HRTF cranial crossfeed via headphones while working.'
            },
            {
              pathwayName: 'Chrono-Nutritional Pathway (Contingency B)',
              action: 'Tart cherry extract (natural melatonin precursor) + 300mg Magnesium L-threonate taken 45 min before sleep to preserve slow-wave delta sleep architecture.'
            }
          ]
        },
        clinicalTrialCitation: 'Snyder et al. (2002) Handbook of Positive Psychology (Hope pathways buffer against treatment drop-out with OR = 2.41).'
      }, null, 2),
      chosen: 'Builds a robust multi-pathway choice architecture allowing patient agency to thrive regardless of evening schedule disruptions.',
      rejected: 'Gives an all-or-nothing ultimatum requiring the patient to resign or turn off all electronics at 8:00 PM.'
    },

    // 19. On-Device ISMP Medication Safety Guard (Gemma 4 Dev Trial)
    {
      paradigm: 'on_device_ismp_guard',
      instruction: 'Audit draft clinical medication orders against FDA and ISMP high-risk medication safety standards.',
      input: JSON.stringify({ draftOrder: 'Order Morphine 5.0 mg IV push STAT; Levothyroxine .05 mg PO daily.' }, null, 2),
      output: JSON.stringify({
        auditResult: 'SAFETY_VIOLATIONS_DETECTED',
        violations: [
          {
            type: 'TRAILING_ZERO',
            target: '5.0 mg',
            ismpRule: 'Prohibit trailing zero after whole numbers to prevent 10x overdose misinterpretation.',
            remediatedText: '5 mg'
          },
          {
            type: 'NAKED_DECIMAL',
            target: '.05 mg',
            ismpRule: 'Require leading zero before decimals to prevent missing point misinterpretation.',
            remediatedText: '0.05 mg (50 mcg)'
          }
        ],
        correctedOrder: 'Order Morphine 5 mg IV push STAT; Levothyroxine 50 mcg (0.05 mg) PO daily.',
        citation: 'ISMP List of Error-Prone Abbreviations, Symbols, and Dose Designations (2026 Edition)'
      }, null, 2),
      chosen: 'Identifies trailing zero in 5.0 mg and naked decimal in .05 mg, providing explicit ISMP safety rationale and corrected whole/leading number formulations.',
      rejected: 'Approves order without corrections or changes dosage to 50mg without notice.'
    },

    // 20. On-Device Triage Acuity Routing & Five Eyes Dispatch Mapping
    {
      paradigm: 'triage_acuity_routing',
      instruction: 'Classify patient symptom telemetry into triage acuity tier and assign statutory Five Eyes crisis vectors.',
      input: JSON.stringify({
        patientReported: 'Severe crushing substernal chest pain radiating to left jaw, diaphoresis, dyspnea at rest.',
        vitals: { bp: '86/52', hr: 128, spO2: '89%' },
        jurisdiction: 'United States'
      }, null, 2),
      output: JSON.stringify({
        acuityLevel: 'STAT_EMERGENCY',
        clinicalDirectives: [
          'Immediate emergency medical dispatch (EMS / 911 STAT).',
          'Administer chewable aspirin 325 mg if not contraindicated.',
          'Position patient seated upright with high-flow oxygen telemetry.'
        ],
        statutoryHotlines: {
          emergencyMedical: '911',
          suicideAndCrisisLifeline: '988'
        },
        fhirTriageCode: 'http://terminology.hl7.org/CodeSystem/v3-ActCode#EMER'
      }, null, 2),
      chosen: 'Immediately flags STAT_EMERGENCY, issues acute coronary protocol directives, and maps 911 dispatch.',
      rejected: 'Suggests scheduling an outpatient appointment in 2 weeks and drinking herbal tea.'
    },

    // 21. Multimodal Wound & Dermatology Vision
    {
      paradigm: 'multimodal_wound_derm_vision',
      instruction: 'Analyze visual wound artifact and quantify tissue granulation, slough, and evidence-grounded dressing protocols.',
      input: JSON.stringify({
        visualArtifact: '[MULTIMODAL_EMBEDDING_SACRAL_DECUBITUS_STAGE_3]',
        woundLocation: 'Sacral Promontory',
        woundDimensionsCm: { length: 4.2, width: 3.8, depth: 1.1 }
      }, null, 2),
      output: JSON.stringify({
        stage: 'Stage 3 Decubitus Pressure Ulcer',
        tissueComposition: { granulationPercent: 65, sloughPercent: 30, escharPercent: 5 },
        exudateLevel: 'Moderate Serosanguinous',
        evidenceGroundedProtocol: {
          cleansing: 'Normal Saline or Hypochlorous Acid wound irrigation (zero cytotoxic scrub).',
          primaryDressing: 'Hydrocellular foam with silicone border to manage exudate while maintaining moist healing bed.',
          offloadingDirective: 'Q2H rotational positioning with high-density pressure redistributing air mattress.'
        },
        cochraneRoB2Citation: 'Cochrane Database Syst Rev (Dressings and topical agents for pressure ulcers, Level A Evidence)'
      }, null, 2),
      chosen: 'Quantifies objective tissue percentages, selects non-cytotoxic cleansing, and cites Cochrane Level A evidence.',
      rejected: 'Prescribes harsh iodine scrubbing and guarantees complete wound closure in 48 hours.'
    },

    // 22. Amazon Associates & Affiliate Egress Governance
    {
      paradigm: 'amazon_affiliate_egress_guard',
      instruction: 'Format supportive product recommendation card with mandatory FTC disclosure, zero PHI parameters, and strict SMS egress prohibition.',
      input: JSON.stringify({
        recommendedProduct: 'Omron Platinum Blood Pressure Monitor',
        asin: 'B07S2T37NW',
        affiliateTag: 'pgdpo-20',
        channelRequested: 'Patient Care Plan Web Portal'
      }, null, 2),
      output: JSON.stringify({
        isApprovedChannel: true,
        sanitizedUrl: 'https://www.amazon.com/dp/B07S2T37NW?tag=pgdpo-20',
        ftcMandatoryDisclosure: 'As an Amazon Associate, PocketGull earns from qualifying purchases.',
        clinicalDisclaimer: 'Supportive wellness equipment. This is a non-prescriptive recommendation grounded in clinical monitoring best practices.',
        egressAudit: { phiContained: false, validAsinOnly: true, prohibitedInSmsEmail: true }
      }, null, 2),
      chosen: 'Includes clear FTC earnings disclaimer, strips all patient identifiers, and approves solely for authenticated web portal.',
      rejected: 'Sends raw amazon.com affiliate tracking link inside an outbound SMS text message containing the patient diagnosis.'
    },

    // 23. Post-Quantum FHIR R4 Bundle Sealed Provenance
    {
      paradigm: 'post_quantum_fhir_seal',
      instruction: 'Sign and encapsulate an exported FHIR R4 Patient Care Plan bundle using post-quantum ML-KEM-768 cryptography.',
      input: JSON.stringify({ patientId: 'p001', resourceType: 'Bundle', totalEntries: 14 }, null, 2),
      output: JSON.stringify({
        sealedBundleEnvelope: {
          fhirVersion: '4.0.1',
          bundleId: 'bundle-sealed-pq-p001',
          signatureAlgorithm: 'ML-KEM-768 / Dilithium3 (NIST PQC Standard)',
          provenanceDigestSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          tamperEvidentState: 'VERIFIED_IMMUTABLE',
          safeHarborDeidentified: true
        }
      }, null, 2),
      chosen: 'Applies post-quantum cryptographic envelope with SHA-256 state hashing and HIPAA §164.514 Safe Harbor de-identification verification.',
      rejected: 'Exports raw clinical history in unencrypted JSON with patient direct identifiers.'
    },

    // 24. NIH MedQuAD Clinical Q&A & Socratic Health Literacy
    {
      paradigm: 'nih_medquad_qa',
      instruction: 'Formulate evidence-grounded clinical guidance for Stage 1 Hypertension lifestyle interventions according to NIH NHLBI guidelines.',
      input: JSON.stringify({ indication: 'Stage 1 Essential Hypertension', bpRange: '134/86 mmHg', targetGuidelines: 'NIH NHLBI / ACC / AHA' }, null, 2),
      output: JSON.stringify({
        clinicalDirective: 'NIH NHLBI / ACC / AHA 2017 Consensus',
        whereYouStandToday: 'Stage 1 Essential Hypertension (130-139 / 80-89 mmHg).',
        lifestyleInterventions: [
          'DASH diet pattern: Sodium restriction <2300 mg/day (optimal <1500 mg/day).',
          'Potassium optimization 3500-5000 mg/day from whole dietary sources.',
          'Aerobic conditioning 150 min/week moderate intensity.'
        ],
        pharmacotherapyTrigger: 'Initiate monotherapy (Chlorthalidone 12.5 mg or Amlodipine 5 mg) if 10-year ASCVD risk >= 10% or after 3-month lifestyle trial.',
        evidenceTier: 'Level A (SPRINT & ACCORD Trials)'
      }, null, 2),
      chosen: 'Provides structured NIH NHLBI DASH sodium thresholds, 150 min aerobic conditioning targets, and ASCVD risk stratification triggers.',
      rejected: 'Recommends untested herbal mega-dosing to cure all hypertension overnight.'
    },

    // 25. WHO mhGAP Stepped-Care Triage & Mental Health Protocol
    {
      paradigm: 'who_mhgap_triage',
      instruction: 'Structure stepped-care triage and non-pharmacological stabilization for acute panic presentation adhering to WHO mhGAP protocols.',
      input: JSON.stringify({ presentingSymptoms: 'Acute diaphoresis, dyspnea, palpitations, intense impending doom', age: 28, cardiacRiskFactors: 'None' }, null, 2),
      output: JSON.stringify({
        triageDirectives: {
          organicRuleOut: 'Verify absence of red flags (substance toxicity, thyroid crisis, ACS).',
          nonPharmacologicalStabilization: '0.1 Hz Bio-rhythmic parasympathetic pacing (4s inhale / 6s exhale) + 5-4-3-2-1 sensory grounding.',
          pharmacologicalGuardrails: 'Avoid routine long-term benzodiazepines due to severe tolerance/dependence. If recurring Panic Disorder, consider first-line SSRI (Sertraline 25 mg titrated to 50 mg PO daily).'
        },
        whoModule: 'WHO mhGAP Version 2.0 (Anxiety & Panic Protocol)',
        evidenceTier: 'Level A (WHO Consensus / NICE CG113)'
      }, null, 2),
      chosen: 'Grounds acute panic triage in organic rule-outs, parasympathetic 0.1 Hz pacing, and long-term benzodiazepine avoidance.',
      rejected: 'Immediately orders chronic high-dose benzodiazepines without psychological intervention.'
    },

    // 26. NIH ClinicalTrials.gov Protocol Synthesis & Pre-Screening
    {
      paradigm: 'nih_clinicaltrials_protocol',
      instruction: 'Extract and validate structured clinical research parameters from a ClinicalTrials.gov oncology study protocol.',
      input: JSON.stringify({ nctId: 'NCT04280788', phase: 'Phase 3', disease: 'Metastatic Non-Small Cell Lung Cancer' }, null, 2),
      output: JSON.stringify({
        protocolSchema: {
          nctId: 'NCT04280788',
          studyDesign: 'Quadruple-Blind Randomized Controlled Trial',
          inclusionCriteria: ['Histologically confirmed NSCLC', 'ECOG 0-1', 'Adequate hematologic/renal function'],
          exclusionCriteria: ['Active untreated CNS metastases', 'Prior target inhibitor within 28 days'],
          primaryOutcome: 'Progression-Free Survival (PFS) at 12 months',
          secondaryOutcomes: ['Overall Survival (OS)', 'Objective Response Rate (ORR)']
        },
        evidenceGrade: 'Level A (NIH Registry Standard)'
      }, null, 2),
      chosen: 'Synthesizes standardized NCT schema, inclusion/exclusion bounds, and primary endpoints.',
      rejected: 'Extracts unstructured text without schema validation or safety exclusion criteria.'
    },
    // 27. Pediatric ISMP Weight-Based Safety & Reye's Contraindication
    {
      paradigm: 'pediatric_ismp_safety',
      instruction: 'Evaluate pediatric febrile supportive care for a 7-year-old child (20 kg) with viral upper respiratory symptoms. Enforce ISMP mg/kg/dose bounds and AAP safety directives.',
      input: JSON.stringify({
        patientAgeYears: 7,
        weightKg: 20.0,
        symptoms: 'Fever 101.8°F, clear rhinorrhea, mild malaise',
        requestedMeds: 'Aspirin or liquid acetaminophen'
      }, null, 2),
      output: JSON.stringify({
        triageAssessment: 'Acute pediatric viral upper respiratory febrile response.',
        contraindications: [
          {
            medication: 'Aspirin / Bismuth subsalicylate',
            severity: 'ABSOLUTE_FATAL_CONTRAINDICATION',
            rationale: 'Strictly contraindicated in children/adolescents due to high risk of Reye\'s Syndrome (acute hepatic failure and encephalopathy).'
          }
        ],
        supportiveDosing: {
          medication: 'Acetaminophen Oral Suspension (160 mg / 5 mL)',
          dosePerKg: '12.5 mg/kg/dose',
          calculatedDoseMg: 250,
          calculatedVolumeMl: 7.81,
          frequency: 'Every 4 to 6 hours as needed for discomfort (max 5 doses/24h)',
          dispensingSafety: 'Mandate calibrated metric oral syringe. Prohibit household kitchen teaspoons.'
        },
        childLifeCounseling: 'Your body\'s internal campfire is heating up to help your superhero white blood cells defeat the pesky bug!'
      }, null, 2),
      chosen: 'Strictly contraindicates aspirin to prevent fatal Reye\'s Syndrome, calculates exact weight-based acetaminophen (250 mg / 7.8 mL), mandates a metric oral syringe, and provides comforting Child Life Specialist metaphors.',
      rejected: 'Recommends baby aspirin 81mg for fever reduction and suggests giving 1 or 2 kitchen teaspoons of any over-the-counter liquid.'
    },
    // 28. Geriatric 5Ms & 2023 AGS Beers Criteria De-Prescribing
    {
      paradigm: 'geriatric_beers_deprescribing',
      instruction: 'Perform comprehensive Geriatric 5Ms medication audit for an 81-year-old patient on diphenhydramine and diazepam with recent fall history.',
      input: JSON.stringify({
        age: 81,
        activeMeds: ['Diphenhydramine 25mg QHS for insomnia', 'Diazepam 5mg BID for anxiety', 'Lisinopril 10mg QD'],
        fallHistory: '1 non-syncopal mechanical fall last month',
        rockwoodCfs: 3
      }, null, 2),
      output: JSON.stringify({
        geriatric5MsAssessment: {
          mind: 'Risk of anticholinergic cognitive impairment from diphenhydramine.',
          mobility: 'Elevated fall and hip fracture risk secondary to long-acting benzodiazepine ataxia.',
          medications: 'Two high-risk medications flagged on 2023 AGS Beers Criteria®.',
          multiComplexity: 'Rockwood CFS Level 3 (Managing Well) with preventable fall hazard.',
          mattersMost: 'Preserving ambulatory independence and sharp cognitive clarity.'
        },
        beersFlags: [
          {
            medication: 'Diphenhydramine',
            category: 'High Anticholinergic Burden',
            action: 'Discontinue for sleep. Substitute sleep hygiene and photic circadian entrainment.'
          },
          {
            medication: 'Diazepam',
            category: 'Long-Acting Benzodiazepine (Fall / Ataxia Risk)',
            action: 'Initiate slow supervised taper. Substitute non-sedating CBT-I or buspirone if needed.'
          }
        ]
      }, null, 2),
      chosen: 'Identifies both Beers Criteria flags (diphenhydramine anticholinergic risk and diazepam long-acting fall risk), structures review using the Geriatric 5Ms, and provides safer non-pharmacological de-prescribing alternatives.',
      rejected: 'Increases diphenhydramine dose to 50mg for better sleep and adds zolpidem without addressing fall risk or Beers Criteria.'
    },
    // 29. Food-as-Medicine (FAM) & Microbiome SCFA Butyrate Synthesis
    {
      paradigm: 'food_as_medicine_scfa',
      instruction: 'Formulate an evidence-grounded Food-as-Medicine produce prescription and microbiome SCFA protocol for a patient with subclinical inflammation (hs-CRP 2.8 mg/L).',
      input: JSON.stringify({
        clinicalGoal: 'Lower systemic CRP and optimize colonic butyrate production',
        dietaryPreference: 'Mediterranean / Plant-Slant'
      }, null, 2),
      output: JSON.stringify({
        dietaryPattern: 'MIND / Mediterranean-DASH Hybrid',
        producePrescriptions: [
          {
            food: 'Cooked & Cooled Purple Potatoes / Rolled Oats',
            bioactive: 'Type-3 Resistant Starch & Beta-Glucan',
            mechanism: 'Colonic fermentation by Faecalibacterium prausnitzii into anti-inflammatory butyrate (SCFA).',
            culinaryTip: 'Cook thoroughly, refrigerate 12+ hours to induce starch retrogradation before gentle reheating.'
          },
          {
            food: 'Wild Blueberries & Blackberries',
            bioactive: 'Anthocyanins & Delphinidin',
            mechanism: 'Suppresses NF-kB signaling and microglial inflammatory cytokines.',
            culinaryTip: 'Pair with raw walnuts for lipid-assisted bioabsorption.'
          }
        ],
        plantDiversityTarget: 'Aim for ≥ 30 distinct plant species/week across alliums, cruciferous, legumes, berries, and seeds.'
      }, null, 2),
      chosen: 'Synthesizes targeted prebiotic resistant starches for colonic SCFA butyrate fermentation, provides actionable retrogradation culinary tips, and sets the 30+ plant species diversity benchmark.',
      rejected: 'Prescribes generic low-calorie diet pills and artificial meal replacement shakes without addressing microbiome diversity or butyrate synthesis.'
    },
    // 30. Cardiology & Hemodynamics (AHA/ACC GDMT & ECG Vector Triangulation)
    {
      paradigm: 'cardiology_ecg_hemodynamics',
      instruction: 'Evaluate a 66-year-old patient with new HFrEF (LVEF 32%, NYHA Class III, BP 118/74, eGFR 58 mL/min, K+ 4.4 mEq/L) and initiate 4-pillar GDMT.',
      input: JSON.stringify({
        age: 66,
        lvef: '32%',
        nyhaClass: 'III',
        bp: '118/74 mmHg',
        hr: '78 bpm (sinus rhythm)',
        serumK: '4.4 mEq/L',
        eGfr: '58 mL/min/1.73m2',
        currentMeds: ['Furosemide 20mg PO QD']
      }, null, 2),
      output: JSON.stringify({
        clinicalStratification: 'Stage C HFrEF with volume stabilization on loop diuretic.',
        fourPillarGdmtInitiation: [
          {
            pillar: 'ARNI (Angiotensin Receptor-Neprilysin Inhibitor)',
            agent: 'Sacubitril/Valsartan 24/26 mg (50 mg) PO BID',
            rationale: 'Class 1A mortality reduction over ACEi. Initiated at low starting dose given baseline SBP 118 mmHg.'
          },
          {
            pillar: 'Evidence-Based Beta-Blocker',
            agent: 'Metoprolol Succinate ER 25 mg PO QD or Carvedilol 3.125 mg PO BID',
            rationale: 'Class 1A neurohormonal blockade. Titrate every 2 weeks to target heart rate 60-70 bpm.'
          },
          {
            pillar: 'Mineralocorticoid Receptor Antagonist (MRA)',
            agent: 'Spironolactone 12.5-25 mg PO QD',
            rationale: 'Class 1A anti-fibrotic remodeling. Serum K+ (4.4) and eGFR (58) satisfy strict safety thresholds (K < 5.0, eGFR > 30).'
          },
          {
            pillar: 'SGLT2 Inhibitor',
            agent: 'Dapagliflozin 10 mg or Empagliflozin 10 mg PO QD',
            rationale: 'Class 1A cardiorenal metabolic unburdening irrespective of glycemic status.'
          }
        ],
        safetyMonitoring: 'Schedule comprehensive metabolic panel (serum K+ and creatinine) in 7-14 days post-initiation.'
      }, null, 2),
      chosen: 'Implements full 4-pillar AHA/ACC GDMT (ARNI + Beta-blocker + MRA + SGLT2i), checks potassium/renal safety thresholds, and schedules 14-day lab surveillance.',
      rejected: 'Prescribes high-dose diltiazem (calcium channel blocker contraindicated in HFrEF) and doubles furosemide without neurohormonal GDMT.'
    },
    // 31. Oncology & Molecular Tumor Board (NGS Variant & NCCN Target Matching)
    {
      paradigm: 'oncology_molecular_tumor_board',
      instruction: 'Interpret comprehensive NGS genomic panel for stage IV non-small cell lung adenocarcinoma and correlate actionable kinase mutations.',
      input: JSON.stringify({
        histology: 'Lung Adenocarcinoma, Stage IV (Hepatic & Bone Metastases)',
        ngsPanel: {
          egfr: 'Exon 19 deletion (p.E746_A750del) detected',
          t790m: 'Negative',
          c797s: 'Negative',
          alk: 'Negative (IHC 0)',
          ros1: 'Negative (FISH)',
          pdl1Tps: '15%'
        },
        ecogPerformanceStatus: 1
      }, null, 2),
      output: JSON.stringify({
        molecularClassification: 'EGFR-Mutant (Sensitizing Exon 19 Deletion) Metastatic Lung Adenocarcinoma.',
        nccnGuidelineTherapy: {
          firstLineStandard: 'Osimertinib 80 mg PO once daily (Third-generation CNS-penetrant EGFR TKI, Category 1 recommendation).',
          rationale: 'Superior progression-free survival (PFS) and overall survival (OS) compared to first-generation gefitinib/erlotinib with robust blood-brain barrier penetration.'
        },
        immunotherapyAdvisory: 'Withhold single-agent immune checkpoint inhibitors (anti-PD-1/PD-L1) despite PD-L1 TPS 15% due to lack of efficacy in classical EGFR driver mutations and severe pneumonitis risk when followed by TKI.',
        surveillancePlan: 'Serial cell-free ctDNA liquid biopsy at progression to detect emergent C797S or MET amplification resistance mechanisms.'
      }, null, 2),
      chosen: 'Selects third-generation osimertinib (NCCN Category 1), explicitly warns against checkpoint immunotherapy monotherapy in EGFR drivers, and outlines liquid biopsy ctDNA resistance tracking.',
      rejected: 'Recommends generic platinum chemotherapy doublet plus pembrolizumab without targeting the sensitizing EGFR Exon 19 mutation.'
    },
    // 32. Nephrology & Renal Clearance (KDIGO CKD Staging & Hyperkalemia Algorithm)
    {
      paradigm: 'nephrology_renal_clearance',
      instruction: 'Manage acute hyperkalemia (K+ 6.8 mEq/L with peaked T-waves on ECG) in a CKD Stage 4 patient with strict safety sequence.',
      input: JSON.stringify({
        serumPotassium: '6.8 mEq/L',
        ecgFindings: 'Tall peaked symmetric T-waves in V2-V5, PR interval 210 ms',
        eGfr: '22 mL/min/1.73m2 (CKD Stage 4)',
        activeMeds: ['Lisinopril 20mg QD', 'Spironolactone 25mg QD']
      }, null, 2),
      output: JSON.stringify({
        triageAcuity: 'STAT_HYPERKALEMIC_EMERGENCY',
        threePhaseResuscitation: {
          phase1_membraneStabilization: 'Calcium gluconate 10% 1,000 mg (10 mL) IV over 2-3 minutes under continuous cardiac monitoring (stabilizes cardiomyocyte resting potential; repeats in 5-10 min if ECG abnormalities persist).',
          phase2_intracellularShifting: 'Regular Insulin 10 Units IV bolus combined with 50 mL Dextrose 50% (D50W 25g) to prevent hypoglycemia + Albuterol 10-20 mg nebulized over 15 min.',
          phase3_elimination: 'Sodium zirconium cyclosilicate (Lokelma) 10g PO TID or Loop Diuretic (Furosemide IV) if volume overloaded; prepare hemodialysis access if refractory.'
        },
        medicationHold: 'Immediately discontinue Lisinopril and Spironolactone until potassium normalizes (< 5.0 mEq/L).'
      }, null, 2),
      chosen: 'Executes the standard 3-phase hyperkalemia protocol (Calcium gluconate membrane stabilization FIRST $\to$ Insulin/D50 shifting $\to$ GI/renal excretion), holds RAAS inhibitors, and monitors continuous ECG rhythm.',
      rejected: 'Gives oral sodium polystyrene sulfonate (Kayexalate) as sole emergency therapy without cardiac membrane stabilization or insulin shifting.'
    },
    // 33. Emergency Medicine & STAT Resuscitation (ACLS Shock Index & Sepsis Bundle)
    {
      paradigm: 'emergency_stat_resuscitation',
      instruction: 'Execute resuscitation protocol for a trauma patient presenting with hemorrhagic shock (HR 134, SBP 78, Shock Index 1.72).',
      input: JSON.stringify({
        mechanism: 'High-speed motor vehicle collision',
        vitals: 'HR 134 bpm, BP 78/46 mmHg, RR 28, SpO2 93% on room air',
        shockIndex: 1.72,
        fastUltrasound: 'Positive fluid in Morison’s pouch and splenorenal recess'
      }, null, 2),
      output: JSON.stringify({
        triageCategory: 'CLASS_IV_HEMORRHAGIC_SHOCK',
        immediateActions: [
          'Activate Institutional Massive Transfusion Protocol (MTP) with 1:1:1 balanced ratio (Packed Red Blood Cells : Fresh Frozen Plasma : Platelets).',
          'Administer Tranexamic Acid (TXA) 1 g IV over 10 min (within 3-hour trauma injury window per CRASH-2), followed by 1 g IV infusion over 8 hours.',
          'Permissive hypotension target (MAP 55-65 mmHg / SBP ~90 mmHg) to prevent clot disruption until definitive surgical hemostasis.',
          'Initiate active core warming (Bair Hugger / warm fluid infusor) to prevent lethal trauma triad (coagulopathy, hypothermia, acidosis).'
        ],
        disposition: 'Immediate STAT transfer to trauma operating suite for exploratory laparotomy.'
      }, null, 2),
      chosen: 'Calculates high Shock Index (1.72), activates balanced 1:1:1 MTP, administers TXA within 3 hours, enforces permissive hypotension, and dispatches to OR.',
      rejected: 'Infuses 4 liters of cold normal saline bolus without blood products and delays operative transfer.'
    },
    // 34. Psychiatry & Psychopharmacology (C-SSRS Crisis & Washout Protocol)
    {
      paradigm: 'psychiatry_psychopharm_crisis',
      instruction: 'Formulate safe psychopharmacological transition protocol from high-dose Fluoxetine (Prozac) to Phenelzine (Nardil / MAOI) while preventing Serotonin Syndrome.',
      input: JSON.stringify({
        currentMed: 'Fluoxetine 60 mg PO QD (taken for 8 months)',
        targetMed: 'Phenelzine (MAO Inhibitor)',
        indication: 'Treatment-Resistant Major Depressive Disorder',
        lastDoseDate: 'Today'
      }, null, 2),
      output: JSON.stringify({
        safetyDirective: 'STRICT_WASHOUT_INTERVAL_MANDATE',
        pharmacokineticRationale: 'Fluoxetine and its active metabolite norfluoxetine have an exceptionally prolonged elimination half-life (up to 16 days). Combining or overlapping with an MAOI precipitates potentially fatal Serotonin Toxicity (hyperthermia, autonomic instability, neuromuscular clonus).',
        protocolSteps: [
          'Step 1: Discontinue Fluoxetine 60 mg immediately.',
          'Step 2: Enforce mandatory 5-WEEK (35-DAY) complete washout period before initiating Phenelzine.',
          'Step 3: During washout, bridge supportive psychotherapy, daily C-SSRS suicide safety checks, and non-serotonergic anxiolytics if needed.',
          'Step 4: Educate patient on strict tyramine-restricted diet (aged cheeses, cured meats, draught beer) prior to MAOI start.'
        ]
      }, null, 2),
      chosen: 'Enforces the mandatory 5-week washout interval between fluoxetine and an MAOI, explains norfluoxetine half-life pharmacology, and mandates tyramine dietary counseling.',
      rejected: 'Starts phenelzine the next day or recommends a brief 3-day washout, precipitating lethal Serotonin Syndrome.'
    },
    // 35. Obstetrics / Gynecology & Teratology (ACOG Preeclampsia & Briggs Teratology)
    {
      paradigm: 'obgyn_fetal_maternal_teratology',
      instruction: 'Manage acute severe-range hypertension in a 34-week pregnant patient with preeclampsia with severe features.',
      input: JSON.stringify({
        gestationalAge: '34 weeks 2 days',
        bloodPressure: '168/112 mmHg (confirmed on repeat in 15 min)',
        symptoms: 'Persistent frontal headache, visual scotomata, 3+ brisk patellar reflexes with clonus',
        platelets: '142,000 / uL',
        astAlt: 'Normal'
      }, null, 2),
      output: JSON.stringify({
        acogDiagnosis: 'Preeclampsia with Severe Features (Severe-Range Hypertension & Neurological Symptoms).',
        urgentPharmacotherapy: [
          {
            intervention: 'Maternal Seizure Prophylaxis',
            regimen: 'Magnesium Sulfate 4-6 g IV loading dose over 15-20 min, followed by 1-2 g/hour continuous maintenance infusion.',
            monitoring: 'Hourly patellar reflexes, respiratory rate (hold if RR < 12), and urine output (keep > 30 mL/hr). Ensure Calcium Gluconate at bedside as antidote.'
          },
          {
            intervention: 'Emergent Antihypertensive Therapy (Goal SBP 140-150 / DBP 90-100 to prevent maternal stroke)',
            regimen: 'Labetalol 20 mg IV bolus over 2 min (repeat with 40 mg, then 80 mg every 10-20 min if SBP ≥ 160 or DBP ≥ 110) OR Hydralazine 5-10 mg IV.'
          }
        ],
        fetalMaternalDisposition: 'Betamethasone 12 mg IM (first dose for fetal lung maturity); transfer to labor & delivery for continuous electronic fetal monitoring.'
      }, null, 2),
      chosen: 'Initiates immediate Magnesium Sulfate seizure prophylaxis with Calcium Gluconate antidote on standby, administers IV Labetalol for severe-range BP, and gives antenatal corticosteroids for fetal lung maturity.',
      rejected: 'Prescribes oral ACE inhibitors (fetal renal teratogen) and discharges home with bed rest.'
    },
    // 36. Endocrinology & Advanced Diabetes / Pumps (CGM AGP & DKA Protocol)
    {
      paradigm: 'endocrinology_glycemic_pump',
      instruction: 'Analyze Continuous Glucose Monitoring (CGM) Ambulatory Glucose Profile (AGP) and optimize Automated Insulin Delivery (AID) settings.',
      input: JSON.stringify({
        cgmMetrics: {
          timeInRange70_180: '54% (Target > 70%)',
          timeBelowRangeUnder70: '6.2% (Target < 4%)',
          timeBelow54VeryLow: '2.1% (Target < 1%)',
          timeAboveRange180_250: '28%',
          timeAbove250VeryHigh: '11.8%',
          glucoseManagementIndicatorGmi: '7.6%',
          coefficientOfVariationCv: '41.2% (Target ≤ 36%)'
        },
        hypoglycemiaPatterns: 'Frequent 2:00 AM - 4:00 AM nocturnal hypoglycemic troughs'
      }, null, 2),
      output: JSON.stringify({
        agpInterpretation: 'High Glycemic Variability (CV 41.2%) with excessive nocturnal hypoglycemia (TBR 6.2%) compromising patient safety.',
        insulinOptimizationPlan: [
          {
            priority: 'SAFETY FIRST: Eliminate Nocturnal Hypoglycemia',
            action: 'Reduce overnight basal rate (00:00 - 05:00) by 15-20% on automated insulin delivery system.'
          },
          {
            priority: 'Address Postprandial Evening Excursions',
            action: 'Advance pre-bolus timing from 0 min to 15 min prior to dinner to blount postprandial glucose spike, reducing late rebound hypoglycemia.'
          },
          {
            priority: 'Insulin-to-Carbohydrate Ratio (ICR)',
            action: 'Maintain current breakfast/lunch ICR (1:10) but adjust dinner ICR from 1:8 to 1:10 to prevent dinner over-bolusing.'
          }
        ]
      }, null, 2),
      chosen: 'Prioritizes elimination of nocturnal hypoglycemia (TBR 6.2%) by reducing overnight basal rate by 15-20%, reinforces pre-bolus timing, and brings CV below 36%.',
      rejected: 'Increases total daily insulin dose by 20% across all hours, drastically worsening life-threatening nighttime hypoglycemia.'
    },
    // 37. Infectious Disease & Antimicrobial Stewardship (IDSA Antibiogram Step-Down)
    {
      paradigm: 'id_antimicrobial_stewardship',
      instruction: 'Optimize antimicrobial regimen for a hospitalized patient with Community-Acquired Pneumonia (CAP) following blood and sputum culture finalization.',
      input: JSON.stringify({
        initialEmpiricRegimen: 'Vancomycin 15 mg/kg IV q12h + Cefepime 2 g IV q8h (Day 3 of therapy)',
        microbiologyResults: {
          sputumCulture: 'Heavy growth of Streptococcus pneumoniae (Pan-susceptible to Penicillin, Ceftriaxone, Levofloxacin)',
          bloodCultures: 'No growth at 48 hours',
          mrsaNasalPcr: 'Negative'
        },
        clinicalStatus: 'Afebrile for 24 hours, RR 16, SpO2 96% on room air, tolerating oral diet'
      }, null, 2),
      output: JSON.stringify({
        stewardshipAssessment: 'Microbiologically confirmed S. pneumoniae CAP with clinical stability; candidate for immediate de-escalation and oral step-down.',
        stewardshipActions: [
          {
            action: 'De-escalate & Discontinue Vancomycin',
            rationale: 'Negative MRSA nasal screen (high negative predictive value > 98%) and documented pneumococcal etiology.'
          },
          {
            action: 'Discontinue Cefepime',
            rationale: 'Antipseudomonal broad-spectrum coverage unnecessary for pan-susceptible S. pneumoniae.'
          },
          {
            action: 'Step-Down to Targeted Oral Therapy',
            regimen: 'Amoxicillin 1,000 mg PO TID OR Ceftriaxone 1 g IV QD if oral absorption compromised.',
            totalDuration: '5 total days (Day 1-3 IV + Day 4-5 PO) per IDSA/ATS guidelines given clinical stability.'
          }
        ]
      }, null, 2),
      chosen: 'De-escalates from Vancomycin/Cefepime to targeted oral Amoxicillin, utilizes MRSA nasal swab NPV, and bounds total therapy to 5 evidence-based days.',
      rejected: 'Continues broad-spectrum Vancomycin and Cefepime for 14 full days despite negative cultures and MRSA swab.'
    },
    // 38. Neurology & Acute Stroke Care (NIHSS & Thrombolytic Checklist)
    {
      paradigm: 'neurology_acute_stroke',
      instruction: 'Evaluate IV thrombolysis (Tenecteplase / TNK) eligibility for a 68-year-old patient with acute left hemiparesis and facial droop.',
      input: JSON.stringify({
        symptomOnset: '75 minutes ago (witnessed last known normal)',
        nihssScore: 11,
        nonContrastHeadCt: 'No acute intracranial hemorrhage, ASPECTS score 10',
        bloodPressure: '172/96 mmHg',
        bloodGlucose: '138 mg/dL',
        inr: '1.0 (no anticoagulant use)',
        platelets: '220,000 / uL',
        surgicalHistory: 'No major surgery in past 3 months'
      }, null, 2),
      output: JSON.stringify({
        strokeProtocolAcuity: 'CODE_STROKE_THROMBOLYSIS_CANDIDATE',
        eligibilityChecklist: {
          timeWindow: 'Within 4.5-hour golden window (Onset 75 min ago)',
          neuroimaging: 'CT head negative for hemorrhage / early infarct signs',
          bloodPressure: 'BP 172/96 satisfies safety threshold (< 185/110 mmHg)',
          coagulation: 'Normal INR (1.0) and platelets (> 100k)'
        },
        therapeuticOrder: {
          agent: 'Tenecteplase (TNK-tPA) 0.25 mg/kg IV single bolus over 5 seconds (max 25 mg).',
          concurrentOrders: 'STAT CT Angiography (CTA) head/neck to evaluate for Large Vessel Occlusion (LVO) candidate for Endovascular Thrombectomy (EVT).',
          postAdministrationMonitoring: 'Neuro checks and BP monitoring q15min x 2 hours; maintain BP < 180/105 mmHg.'
        }
      }, null, 2),
      chosen: 'Confirms thrombolytic eligibility within 4.5 hours, orders Tenecteplase bolus (0.25 mg/kg), initiates CTA for Large Vessel Occlusion / thrombectomy, and enforces strict post-TNK BP limits.',
      rejected: 'Delays thrombolysis by ordering an elective MRI brain and gives aspirin immediately before thrombolytic administration.'
    },
    // 39. Rheumatology & Autoimmune Serology (ACR/EULAR Triangulation)
    {
      paradigm: 'rheumatology_autoimmune_serology',
      instruction: 'Triangulate complex autoimmune serology panel with clinical symptoms for a 28-year-old female with symmetric polyarthritis, malar rash, and photosensitivity.',
      input: JSON.stringify({
        symptoms: 'Symmetric PIP/MCP joint tenderness x 8 weeks, photosensitive facial erythema sparing nasolabial folds, oral mucosal ulcers',
        labResults: {
          anaIFA: 'Positive 1:640 (Homogeneous / Rim pattern)',
          antiDsDna: 'Positive 88 IU/mL (Reference < 10)',
          antiSmith: 'Positive',
          antiRoSsa: 'Negative',
          c3Complement: '58 mg/dL (Low, Ref 90-180)',
          c4Complement: '8 mg/dL (Low, Ref 16-47)',
          urinalysis: 'Protein 2+ (UACR 450 mg/g), 8-10 RBCs/HPF (no casts)'
        }
      }, null, 2),
      output: JSON.stringify({
        diagnosticSynthesis: 'Systemic Lupus Erythematosus (SLE) satisfying 2019 EULAR/ACR Classification Criteria (> 10 points: Joint involvement, malar rash, mucosal ulcers, anti-dsDNA, anti-Smith, hypocomplementemia).',
        renalInvolvement: 'Probable active Lupus Nephritis (proteinuria + active sediment microhematuria).',
        immediateManagement: [
          {
            pillar: 'Baseline Disease-Modifying Therapy',
            agent: 'Hydroxychloroquine (HCQ) 5 mg/kg actual body weight PO QD (reduces flares, prevents organ damage, improves survival).',
            baselineTesting: 'Baseline ophthalmology examination (spectral-domain OCT and visual field) for retinal safety.'
          },
          {
            pillar: 'Renal Evaluation',
            action: 'STAT Nephrology consultation for ultrasound-guided percutaneous renal biopsy to classify ISN/RPS lupus nephritis class (Class I-VI).'
          },
          {
            pillar: 'Immunosuppressive Induction',
            agent: 'Pulse methylprednisolone followed by Mycophenolate Mofetil (MMF) or Cyclophosphamide pending biopsy results.'
          }
        ]
      }, null, 2),
      chosen: 'Applies 2019 EULAR/ACR SLE criteria, orders gold-standard Hydroxychloroquine at safe 5 mg/kg actual weight dosing with baseline retinal OCT, and triggers STAT renal biopsy for active nephritis.',
      rejected: 'Diagnoses simple osteoarthritis, prescribes NSAIDs only, and fails to screen for lupus nephritis or initiate hydroxychloroquine.'
    },
    // 40. Dynamic Precondition Sentinel & Vital Boundary Bounding
    {
      paradigm: 'dynamic_precondition_guard',
      instruction: 'Enforce explicit physiological precondition boundaries on clinical orders and immediately invalidate stale recommendations when telemetry drifts.',
      input: JSON.stringify({
        patient: 'Homo Sapiens (Pediatric, Complex Tracheostomy, 4y)',
        activeRecommendation: 'Wean supplemental oxygen by 0.5 L/min q30min toward room air',
        telemetryShift: {
          previousVitals: { heartRate: 98, bloodPressure: '96/60', spO2: 97, respiratoryRate: 22 },
          currentVitals: { heartRate: 144, bloodPressure: '80/46', spO2: 88, respiratoryRate: 40 }
        }
      }, null, 2),
      output: JSON.stringify({
        contractStatus: 'PRECONDITION_BREACHED_INVALIDATED',
        breachReason: 'Acute vital telemetry drift: SpO2 dropped to 88% (Safe threshold >= 92%), Heart Rate surged to 144 bpm (Safe threshold 80-125 bpm).',
        immediateAction: 'HALT_WEANING_IMMEDIATELY',
        clinicalContingency: [
          'Re-escalate FiO2 to 40% immediately.',
          'Perform sterile inline tracheostomy suctioning to rule out acute mucus plug obstruction.',
          'Verify breath sounds bilaterally; prepare bag-valve-mask with tracheostomy adapter.',
          'STAT bedside respiratory therapy and attending physician notification.'
        ],
        auditAttestation: 'SHA-256 state seal verified, previous weaning contract retired.'
      }, null, 2),
      chosen: 'Recognizes SpO2 88% and HR 144 breach, immediately invalidates the scheduled oxygen weaning contract, commands FiO2 re-escalation, and orders emergency sterile inline suctioning.',
      rejected: 'Continues with scheduled oxygen weaning down to room air despite SpO2 dropping to 88% and respiratory rate spiking to 40.'
    },
    // 41. CARS Eliminative Reasoning & Anti-Distractor Guard
    {
      paradigm: 'cars_distractor_elimination',
      instruction: 'Apply CARS eliminative reasoning to reject absolute qualifiers, shallow keyword decoys, and reversed polarity traps in complex acute presentations.',
      input: JSON.stringify({
        presentation: '62yo female with acute dyspnea, pleuritic right-sided chest pain, tachycardia (HR 118), and right lower extremity swelling. Wells Score: 6.0 (High Probability for Pulmonary Embolism). Bedside D-Dimer: 420 ng/mL (Normal Reference < 500 ng/mL).',
        distractorPrompt: 'Since the D-Dimer is below the standard 500 ng/mL cutoff, does this conclusively rule out pulmonary embolism?'
      }, null, 2),
      output: JSON.stringify({
        trapAudit: {
          distractorIdentified: 'Keyword decoy trap (Normal D-dimer in high pre-test probability patient)',
          eliminationReason: 'Per PIOPED II and ACEP guidelines, D-dimer has high sensitivity only in low or intermediate probability cases. In high pre-test probability (Wells > 4), a negative D-dimer NEVER rules out PE due to unacceptable false negative rates.'
        },
        clinicalConclusion: 'High clinical suspicion for acute pulmonary embolism. Proceed immediately to STAT Computed Tomography Pulmonary Angiography (CTPA) or V/Q scan if renal/contrast contraindicated.',
        anticoagulationAssessment: 'Evaluate contraindications for empiric weight-based low molecular weight heparin (Enoxaparin 1 mg/kg SC q12h) while awaiting CTPA imaging.',
        carsSafetyFlag: 'DO_NOT_RELY_ON_RULE_OUT_TESTS_IN_HIGH_PRETEST_PROBABILITY'
      }, null, 2),
      chosen: 'Identifies high pre-test Wells score (6.0), rejects the normal D-dimer decoy trap, and orders STAT CTPA with consideration of empiric anticoagulation.',
      rejected: 'Concludes that because D-dimer is under 500 ng/mL, pulmonary embolism is 100% ruled out, and discharges patient with muscle relaxants.'
    },
    // 42. Aeromedical Evacuation Corridor & Altitude Hypoxia Titration
    {
      paradigm: 'aeromedical_evacuation_airway',
      instruction: 'Model inter-island pacific evacuation corridor, calculating flight time, Boyle/Dalton hypoxia adaptation, oxygen reserve margin, and emergency billing codes.',
      input: JSON.stringify({
        corridor: 'PGSN (Saipan International Airport, MP) -> PHNL (Honolulu International, HI)',
        statuteMiles: 3786,
        nauticalMiles: 3290,
        patient: 'Pediatric Tracheostomy (Ventilator Dependent)',
        ventilatorSettings: { fio2: 0.45, minuteVentilationLpm: 6.0, peepCmH2O: 6 },
        aircraftCabinAltitudeFt: 8000
      }, null, 2),
      output: JSON.stringify({
        corridorCalculations: {
          estimatedFlightHours: 7.6,
          baselineOxygenLiters: 5540,
          safetyReserveMultiplier: 2.0,
          totalRequiredOxygenLiters: 11080,
          cylinderManifest: '3x Jumbo M-Cylinders (3,450L each) + 2x Portable E-Cylinders (680L each) for ground-to-air transition'
        },
        altitudeBiophysics: {
          boylesLawGasExpansionPct: 33.0,
          daltonsLawPaO2DropPct: 25.0,
          hypoxiaCompensationDirective: 'Cabin pressure altitude of 8,000 ft reduces ambient PaO2. Titrate FiO2 from 0.45 to 0.55 to maintain SpO2 >= 94%.',
          cuffManagementDirective: 'Deflate air in tracheostomy cuff and inflate with sterile water/saline to eliminate Boyle expansion tracheal ischemia.'
        },
        billingAndRegulatory: {
          hcpcsCodes: ['A0430 (Ambulance service, conventional air transport, fly, one way)', 'A0435 (Fixed wing air mileage, per statute mile)'],
          emergencyTransportWaiver: 'CMS Emergency Aeromedical Transport Waiver § 410.40(c) applies - Zero pre-authorization delay permitted for emergent tertiary pediatric transfer.'
        }
      }, null, 2),
      chosen: 'Calculates 7.6-hour flight duration, applies mandatory 2.0x oxygen safety margin (11,080L), compensates for Dalton altitude hypoxia (FiO2 0.55), substitutes tracheostomy cuff air with saline for Boyle expansion, and formats CMS A0430/A0435 billing codes.',
      rejected: 'Plans transport with single oxygen cylinder without reserve margin and fails to adjust ventilator FiO2 or cuff pressure for 8,000 ft cabin altitude.'
    },
    // 43. Pediatric Complex Care & EPSDT Statutory Prior Authorization
    {
      paradigm: 'pediatric_complex_epsdt',
      instruction: 'Draft comprehensive EPSDT statutory medical necessity justification under 42 U.S.C. § 1396d(r)(5) for complex pediatric private duty nursing.',
      input: JSON.stringify({
        patientArchetype: 'Homo Sapiens (Pediatric, Spastic Quadriplegia, C1-C2 Instability, Tracheostomy, 5y)',
        requestedService: 'Private Duty Nursing (PDN) 112 hours/week (16 hours/day x 7 days) HCPCS T1000',
        denialRationale: 'Medicaid managed care organization claims services are "custodial in nature" and can be provided by family caregiver.',
        recentClinicalIncidents: [
          'Nocturnal desaturation to 72% secondary to deep mucus plug requiring sterile inline suctioning and emergency ambu bagging',
          'Accidental tracheostomy decannulation during sleep safely replaced by skilled nurse'
        ]
      }, null, 2),
      output: JSON.stringify({
        statutoryMandate: '42 U.S.C. § 1396d(r)(5) (Omnibus Budget Reconciliation Act of 1989) mandates that state Medicaid programs provide all EPSDT services necessary to correct or ameliorate physical and mental conditions in individuals under age 21, regardless of whether such services are covered under the state plan.',
        clinicalJustification: 'Continuous skilled nursing is medically indispensable. Tracheostomy occlusion or decannulation in a non-verbal child with quadriplegia constitutes an immediate threat to life causing irreversible hypoxic brain death within 3-4 minutes. Assessment, sterile suctioning, mechanical ventilator management, and emergency re-cannulation require licensed nursing judgment (RN/LPN) under state Nurse Practice Acts and cannot legally be categorized as custodial care.',
        hcpcsCoding: { code: 'T1000', modifier: 'U1 (Pediatric Complex)', units: 112 },
        appealAction: 'STAT Expedited External Administrative Appeal and Judicial Injunction notice under 42 CFR § 438.410.'
      }, null, 2),
      chosen: 'Cites mandatory federal EPSDT statute (42 U.S.C. § 1396d(r)(5)), disproves custodial care assertion with documented life-threatening mucus plug incidents, and demands 112 hours/week skilled nursing coverage.',
      rejected: 'Agrees to reduce nursing hours to zero based on managed care denial and advises single parent to provide 24/7 ICU-level suctioning alone.'
    }
  ];

  return records;
}

export function exportGeminiTuningDataset(outputPath?: string): string {
  const dataset = generateAllParadigmsDataset();
  const targetDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const file = outputPath || path.join(targetDir, 'gemini_tuning_dataset.jsonl');
  const content = dataset.map(rec => JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [{ text: `[PARADIGM: ${rec.paradigm.toUpperCase()}]\n${rec.instruction}\n\nINPUT:\n${rec.input}` }]
      },
      {
        role: 'model',
        parts: [{ text: rec.output }]
      }
    ]
  })).join('\n');

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`✅ Exported ${dataset.length} Gemini SFT fine-tuning records to: ${file}`);
  return file;
}

export function exportDpoPreferenceDataset(outputPath?: string): string {
  const dataset = generateAllParadigmsDataset();
  const targetDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const dpoRecords = dataset.filter(rec => rec.chosen && rec.rejected);
  const file = outputPath || path.join(targetDir, 'dpo_preference_dataset.jsonl');
  const content = dpoRecords.map(rec => JSON.stringify({
    prompt: `[PARADIGM: ${rec.paradigm.toUpperCase()}]\n${rec.instruction}\n\nINPUT:\n${rec.input}`,
    chosen: rec.chosen,
    rejected: rec.rejected
  })).join('\n');

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`✅ Exported ${dpoRecords.length} DPO preference records to: ${file}`);
  return file;
}

export function exportDatasetToJsonl(outputPath?: string): string {
  const dataset = generateAllParadigmsDataset();
  const targetDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const file = outputPath || path.join(targetDir, 'pocketgull_15paradigms_dataset.jsonl');
  const content = dataset.map(rec => JSON.stringify(rec)).join('\n');
  fs.writeFileSync(file, content, 'utf-8');

  // Also export the Gemini SFT and DPO datasets for Vertex AI and Hugging Face pipelines
  exportGeminiTuningDataset();
  exportDpoPreferenceDataset();

  console.log(`✅ Successfully exported ${dataset.length} fine-tuning records across all paradigms to: ${file}`);
  return file;
}

// CLI entrypoint
if (process.argv[1]?.endsWith('export_fine_tuning_dataset.ts') || process.argv[1]?.endsWith('export_fine_tuning_dataset.js')) {
  exportDatasetToJsonl();
}
