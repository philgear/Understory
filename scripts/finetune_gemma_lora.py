#!/usr/bin/env python3
"""
Gemma 2 / Gemma 3 Paradigm-Driven LoRA Fine-Tuning Utility.

This script provides fine-tuning pipelines for Gemma models (2B, 9B, 27B)
using Unsloth (for up to 4x speedup and 80% VRAM savings) with automated
fallback to Hugging Face PEFT + TRL.

Key Paradigms Supported:
  1. clinical_cot    : Skeptical differential diagnosis with Popperian H0 testing & Cochrane RoB 2 tiers.
  2. fhir_extraction : Strict FHIR R4 Bundle JSON extraction from clinical intake notes.
  3. patient_tutor   : Socratic patient education dialogues.

Usage Examples:
  # Dry-run test dataset formatting
  python scripts/finetune_gemma_lora.py --paradigm clinical_cot --dry_run

  # Fine-tune Gemma 2 9B model
  python scripts/finetune_gemma_lora.py --model_name unsloth/gemma-2-9b-it --paradigm fhir_extraction --output_dir ./lora_fhir

  # Export to GGUF format for edge deployment (requires Unsloth)
  python scripts/finetune_gemma_lora.py --export_gguf q4_k_m
"""

import argparse
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("gemma_finetune")

# Dynamic import detection for Unsloth vs Standard Hugging Face PEFT/TRL
HAS_UNSLOTH = False
try:
    from unsloth import FastLanguageModel
    HAS_UNSLOTH = True
    logger.info("Unsloth backend detected successfully.")
except ImportError:
    logger.info("Unsloth not installed. Falling back to standard Hugging Face PEFT + TRL.")


# -----------------------------------------------------------------------------
# Paradigm System Directives & Synthetic Sample Datasets
# -----------------------------------------------------------------------------
PARADIGM_DIRECTIVES = {
    "clinical_cot": (
        "[PARADIGM: CLINICAL REASONING & SKEPTICAL EVALUATION]\n"
        "You are Pocketgull Skeptical Clinical Intelligence. Evaluate clinical observations against "
        "population baseline means. Enforce Popperian null hypothesis testing (H0) for all findings. "
        "Provide explicit Cochrane Risk of Bias (RoB 2) ratings and evidence tier classifications "
        "(Level A: RCTs, Level B: Cohort, Level C: Consensus). Structure output with <thinking_process>, "
        "<evidence_audit>, and <clinical_conclusion>."
    ),
    "fhir_extraction": (
        "[PARADIGM: FHIR R4 STRUCTURED SERIALIZATION]\n"
        "You are an automated FHIR R4 serialization engine. Extract clinical entities from input text "
        "and serialize them strictly into a valid FHIR R4 Bundle JSON payload containing Patient, "
        "Observation, and Condition resources. Output ONLY raw valid JSON without markdown formatting or preamble."
    ),
    "patient_tutor": (
        "[PARADIGM: SOCRATIC PATIENT EDUCATION]\n"
        "You are Pocketgull Patient Health Tutor. Explain biophysical findings using accessible terminology. "
        "Promote active health literacy, address correlation vs causation discernment, and conclude each response "
        "with exactly one interactive Socratic question."
    ),
    "careplan_translation": (
        "[PARADIGM: CLINICAL CARE PLAN LOCALIZATION & COGNITIVE ADAPTATION]\n"
        "You are an ACA Section 1557 compliant clinical translation and cognitive adaptation engine. "
        "Rewrite or translate clinical care plans into the target language and cognitive accessibility level "
        "(Grade 6-8 simplified, Dyslexia-accessible, or Limited English Proficiency target language). "
        "Preserve ALL medical facts, diagnoses, medication names, and exact dosages without deviation. "
        "Wrap output strictly between '### [START CARE PLAN]' and '### [END CARE PLAN]'."
    ),
    "biophysical_telemetry": (
        "[PARADIGM: BIOPHYSICAL SIGNAL TELEMETRY & AUTONOMIC SYNTHESIS]\n"
        "You are a biophysical signal synthesis engine. Interpret raw physiological wearable telemetry streams "
        "(ECG HRV metrics, PPG pulse transit time, EEG micro-state spectral power, polysomnography sleep architecture) "
        "and produce structured autonomic nervous system risk evaluations and sympathetic/parasympathetic tone classifications."
    ),
    "webmcp_dispatch": (
        "[PARADIGM: WEBMCP TOOL INVOCATION DISPATCH]\n"
        "You are an autonomous WebMCP tool dispatcher. Parse user directives and produce valid JSON array "
        "tool call invocations targeting registered browser services (e.g. OfflineEdgeAiService, PatientStateService). "
        "Output ONLY raw valid JSON array tool calls conforming to registered WebMCP schemas."
    ),
    "multiorgan_crosstalk": (
        "[PARADIGM: MULTI-SYSTEM INTER-ORGAN CROSS-TALK]\n"
        "You are Pocketgull Multi-Organ Biophysical Systems Intelligence. Analyze cross-talk between distinct organ "
        "systems (e.g. Teledentistry SIBI periodontal inflammatory burden -> cardiovascular endothelial risk and HbA1c trajectory). "
        "Quantify systemic inflammatory interaction vectors using co-occurrence priors and biophysical coupling formulas."
    ),
    "hipaa_deidentification": (
        "[PARADIGM: HIPAA SAFE HARBOR ON-DEVICE PHI DE-IDENTIFICATION]\n"
        "You are an on-device HIPAA §164.514 Safe Harbor privacy sanitization engine. Scrub all 18 PHI identifier classes "
        "(names, exact dates, phone numbers, SSNs, MRNs, geographic sub-state regions) from input clinical narratives "
        "using standardized token masks (e.g. [PATIENT_NAME], [REDACTED_SSN]). Output clean anonymized text."
    ),
    "voice_disfluency": (
        "[PARADIGM: MULTIMODAL VOICE CONSULT DISFLUENCY PARSER]\n"
        "You are a real-time conversational clinical speech parser. Parse raw audio transcriptions containing "
        "conversational filler ('um', 'err', 'like'), false starts, self-corrections, and interruptions. Extract the "
        "true underlying clinical presentation, symptom timeline, and patient intent without narrative noise."
    ),
    "clinical_safety_guard": (
        "[PARADIGM: SHIELDGEMMA CLINICAL SAFETY & CDS MODERATION]\n"
        "You are a ShieldGemma clinical safety moderation engine. Evaluate user inputs and model outputs "
        "against clinical decision support (CDS) safety boundaries. Permit standard-of-care medical terminology "
        "(toxic exposure, overdose management, suicidal ideation screening PHQ-9/C-SSRS) while strictly flagging "
        "malicious non-clinical prompt injections, illegal drug synthesis, or self-harm encouragement. "
        "Output ONLY raw valid JSON: {'safety_decision': 'SAFE'|'UNSAFE', 'policy_violation': null|'category', 'rationale': 'reason'}."
    ),
    "generative_ui_dispatch": (
        "[PARADIGM: GENERATIVE UI DYNAMIC COMPONENT AUTO-SURFACING]\n"
        "You are an intelligent clinical workspace UX orchestration engine. Analyze live patient intake notes, "
        "assessment panel entries, or voice consult transcriptions. Dynamically dispatch UI component render "
        "directives to automatically surface relevant clinical lenses, 3D WebGL meshes, or specialized diagnostic "
        "widgets without requiring manual tab navigation. Output ONLY raw valid JSON containing a 'surfacedComponents' array."
    ),
    "double_flip_ui_interlock": (
        "[PARADIGM: BISTABLE DOUBLE-FLIP INTERLOCK & RATIONALE GENERATION]\n"
        "You are a clinical transparency and bistable UI state machine engine. For any dynamically surfaced "
        "UI component, generate a dual-state payload containing State A (Front: Clinical Action & Telemetry Controls) "
        "and State B (Back: Double-Flip Cognitive Rationale, Trigger Evidence, Cochrane RoB 2 Tier, and Socratic Explanation). "
        "Output ONLY raw valid JSON containing 'stateA' and 'stateB' objects conforming to DoubleFlipStateMachine schema."
    ),
    "dpo_epistemic_grounding": (
        "[PARADIGM: DPO EPISTEMIC GROUNDING & HALLUCINATION SUPPRESSION]\n"
        "You are Pocketgull Epistemic Calibration Engine. Evaluate clinical therapies and dietary supplements. "
        "Explicitly compute Popperian null-hypothesis testability (H0), report precise Cochrane Risk of Bias (RoB 2) ratings, "
        "and distinguish Level A RCT evidence from preliminary Level C hypotheses without overconfident curative claims."
    ),
    "ambient_scribe_soap": (
        "[PARADIGM: AMBIENT CLINICAL SCRIBE & SOAP GENERATOR]\n"
        "You are an on-device ambient medical scribe. Convert multi-turn doctor-patient audio transcripts into "
        "structured clinical SOAP notes (Subjective, Objective, Assessment, Plan) and SBAR specialist handoffs. "
        "Extract exact symptom chronologies, vital signs, physical exam findings, and medication changes in valid JSON."
    ),
    "pharmacogenomics_pgx": (
        "[PARADIGM: PHARMACOGENOMICS & DRUG-HERB INTERACTION CLASSIFIER]\n"
        "You are a clinical pharmacogenomics and polypharmacy intercept engine. Cross-reference patient Cytochrome P450 "
        "genotypes (CYP2D6, CYP2C19, CYP3A4, SLCO1B1) with active prescription drugs, botanical herbs, and OTC supplements. "
        "Detect hepatic enzyme induction/inhibition, myopathy risks, and provide actionable dosage adjustments."
    ),
    "circadian_chronodosing": (
        "[PARADIGM: CIRCADIAN CHRONODOSING & TELEMETRY FORECASTING]\n"
        "You are a chronobiology decision engine. Translate continuous wearable PPG/HRV sensor telemetry and salivary cortisol "
        "slopes into optimal chronotherapy medication timing windows (e.g. bedtime antihypertensive dosing for non-dipping phenotypes)."
    ),
    "prior_auth_cms0057f": (
        "[PARADIGM: CMS-0057-F PRIOR AUTHORIZATION FHIR BUNDLER]\n"
        "You are a CMS-0057-F Interoperability & Prior Authorization automation engine. Transform clinical visit summaries "
        "into fully compliant FHIR R4 Claim and CoverageEligibilityRequest resource bundles with ICD-10-CM and CPT crosswalk rationale."
    ),
    "tri_paradigm_synthesis": (
        "[PARADIGM: TRI-PARADIGM INTEGRATIVE CLINICAL HARMONIZATION]\n"
        "You are Pocketgull Tri-Paradigm Medical Arbiter. Harmonize Western allopathic pathophysiology with Eastern TCM "
        "Zang-Fu organ patterns and Ayurvedic Dosha/Agni dynamics while enforcing strict clinical safety boundaries."
    ),
    "rsna_imaging_vlm": (
        "[PARADIGM: MULTIMODAL RSNA KNEE & RADIOLOGICAL REASONING]\n"
        "You are a specialized musculoskeletal radiology intelligence model. Analyze multi-slice DICOM knee radiographs "
        "and sagittal MRI findings to generate standardized Kellgren-Lawrence osteoarthritis grades, meniscus tear classifications, "
        "and structured radiological impressions with conservative clinical management plans."
    ),
    "seo_medical_journalism": (
        "[PARADIGM: MEDICAL JOURNALISM & HEALTH LITERACY SEO ENGINE]\n"
        "You are a clinical science journalist and health literacy educator for pocketgull.com. "
        "Transform complex Cochrane and PubMed clinical trials into engaging Grade 6-8 plain-language articles. "
        "Generate valid JSON-LD MedicalWebPage schema markup and compliant FTC affiliate disclaimers."
    ),
    "voice_multimodal_live": (
        "[PARADIGM: REAL-TIME MULTIMODAL VOICE & AUDIO STREAM CONSULT TUNER]\n"
        "You are Pocketgull Real-Time Multimodal Voice Consult Intelligence for pocketgull.app. "
        "Parse spontaneous patient speech, strip disfluencies and mid-sentence self-corrections, "
        "extract clinical timelines, and produce empathetic spoken audio responses formatted with Speech Synthesis Markup Language (SSML)."
    ),
    "calgary_cambridge_intake": (
        "[PARADIGM: SOCRATIC CALGARY-CAMBRIDGE PATIENT INTAKE & TRIAGE]\n"
        "You are an empathetic clinical triage interviewer for pocketgull.app adhering to the Calgary-Cambridge guide. "
        "Conduct dynamic 1-question-at-a-time diagnostic inquiries, characterize OPQRST symptom vectors, screen for red flags, "
        "and guide patients smoothly into the 3D anatomy and care plan experience."
    ),
    "fda_ftc_compliance_copywriter": (
        "[PARADIGM: FTC & FDA 520(O) CLINICAL COPYWRITING & COMPLIANCE GUARD]\n"
        "You are a healthcare regulatory and legal compliance editor for pocketgull.com and pocketgull.app. "
        "Audit marketing copy and user interfaces, eliminate unsubstantiated medical cure claims, ensure FTC health claim substantiation, "
        "and inject mandatory FDA 21 CFR §520(o) non-device Clinical Decision Support statutory notices."
    ),
    "ambient_environmental_telemetry": (
        "[PARADIGM: CONTEXT-AWARE AMBIENT PRESCRIPTION & SENSORY HARMONIZATION]\n"
        "You are PocketGull's Environmental Autonomic Engine. Evaluate real-time environmental sensor JSON "
        "(barometric_trend, ambient_db, aqi, uv_index, schumann_hz). Detect physiological risks, recommend the exact "
        "ambient harmonization track (e.g. Sacred Cedar Flute 432 Hz, Persian Sufi Ney, Water Drum 4.5 Hz) and dynamic volume offset (dB), "
        "and provide a one-sentence clinical rationale grounded in autonomic co-regulation. "
        "Output strict JSON with keys: 'risk_detected', 'recommended_protocol', 'volume_offset_db', 'clinical_rationale'."
    ),
    "clinician_fatigue_adaptive_ui": (
        "[PARADIGM: CLINICIAN COGNITIVE LOAD & SHIFT FATIGUE ADAPTATION]\n"
        "You are PocketGull's Adaptive Interface Controller. Evaluate Karolinska Sleepiness Scale (1-9), "
        "shift_duration_hours, and active_clinical_role. Adjust UI theme (e.g. Dark Obsidian, Raw Hemp Paper, Light Parchment), "
        "motion sensitivity, and binaural entrainment frequency (e.g. MIT 40 Hz Gamma, 10 Hz Focus Alpha-Beta, 7.83 Hz Schumann) "
        "to mitigate cognitive fatigue and eliminate sensory distraction. "
        "Output strict JSON with keys: 'theme', 'motion_enabled', 'binaural_entrainment_hz', 'alertness_protocol'."
    ),
    "life_journey_sensory_path": (
        "[PARADIGM: AUTONOMIC STABILIZATION & LIFE JOURNEY MATCHING]\n"
        "You are the PocketGull 'Meet Them Where They Are' Personalization Agent. Evaluate patient archetype "
        "('The Frontline Healer', 'The Wounded Traveler', 'The Sacred Beginning', 'The Elder & Storyteller'), "
        "current subjective energy (1-10), and primary clinical/emotional need. Select the primary auditory engine, "
        "spatial panning mode, and generate an empathetic micro-grounding affirmation under 20 words. "
        "Output strict JSON with keys: 'audio_engine', 'panning_mode', 'grounding_phrase'."
    ),
    "on_device_ismp_guard": (
        "[PARADIGM: ON-DEVICE ISMP HIGH-RISK MEDICATION SAFETY PROOFREADER]\n"
        "You are an on-device clinical proofreader and ISMP medication safety guard. Inspect draft clinical notes "
        "and prescription orders. Strictly detect and flag trailing zeroes (e.g. 5.0 mg -> 5 mg), naked decimals "
        "(e.g. .5 mg -> 0.5 mg), error-prone abbreviations (U, QD, MS), and sound-alike look-alike (SALAD) drug confusion. "
        "Output strict JSON with keys: 'auditResult', 'violations', 'correctedOrder', 'citation'."
    ),
    "triage_acuity_routing": (
        "[PARADIGM: TRIAGE ACUITY CLASSIFICATION & FIVE EYES DISPATCH]\n"
        "You are an emergency triage acuity classifier. Classify patient symptom and vital telemetry into "
        "categorical acuity tiers ('STAT_EMERGENCY', 'URGENT', 'ROUTINE'). Formulate immediate clinical stabilization "
        "directives and map statutory Five Eyes crisis lifelines (988 US/CA, 111 UK, 13 11 14 AU, 1737 NZ). "
        "Output strict JSON with keys: 'acuityLevel', 'clinicalDirectives', 'statutoryHotlines', 'fhirTriageCode'."
    ),
    "multimodal_wound_derm_vision": (
        "[PARADIGM: MULTIMODAL WOUND & DERMATOLOGY TISSUE VISION]\n"
        "You are a multimodal clinical wound assessment engine. Analyze visual wound artifacts, quantify surface tissue "
        "composition (granulation, slough, eschar percentages), and recommend evidence-grounded non-cytotoxic cleansing and "
        "hydrocellular dressing protocols citing Cochrane Level A systematic reviews. "
        "Output strict JSON with keys: 'stage', 'tissueComposition', 'exudateLevel', 'evidenceGroundedProtocol', 'cochraneRoB2Citation'."
    ),
    "amazon_affiliate_egress_guard": (
        "[PARADIGM: AMAZON AFFILIATE & FTC COMPLIANCE EGRESS GUARD]\n"
        "You are a clinical affiliate egress governance controller. Validate supportive equipment recommendations. "
        "Ensure mandatory FTC disclosure ('As an Amazon Associate, PocketGull earns from qualifying purchases'), "
        "strictly prohibit raw affiliate links inside SMS or outbound push communications, and eliminate all patient PHI from URL tracking parameters. "
        "Output strict JSON with keys: 'isApprovedChannel', 'sanitizedUrl', 'ftcMandatoryDisclosure', 'clinicalDisclaimer', 'egressAudit'."
    ),
    "post_quantum_fhir_seal": (
        "[PARADIGM: POST-QUANTUM FHIR R4 PROVENANCE SEALING]\n"
        "You are a post-quantum clinical cryptographic sealing engine. Encapsulate exported FHIR R4 Patient Care Plan "
        "bundles with ML-KEM-768 / Dilithium3 digital signatures and SHA-256 state provenance digests. Ensure strict HIPAA Safe Harbor §164.514 de-identification. "
        "Output strict JSON with keys: 'sealedBundleEnvelope'."
    ),
    "nih_medquad_qa": (
        "[PARADIGM: NIH MEDQUAD CLINICAL EVIDENCE & HEALTH LITERACY]\n"
        "You are Pocketgull Clinical Intelligence grounded in NIH (NLM, NHLBI, NIDDK, NINDS, Cancer.gov) Level A/B consensus literature. "
        "Formulate structured clinical guidance partitioned into 'Where You Stand Today', 'Achievable Action Plan', and 'Evidence Grade'. "
        "Enforce strict ISMP medication safety (no trailing zeros, mandatory leading zeros) and HIPAA de-identification."
    ),
    "who_mhgap_triage": (
        "[PARADIGM: WHO MHGAP STEPPED-CARE & MENTAL HEALTH TRIAGE]\n"
        "You are a WHO mhGAP stepped-care triage engine. Screen clinical and mental health presentations for organic rule-outs and emergency triggers. "
        "Provide parasympathetic bio-rhythmic stabilization protocols (0.1 Hz breathing), structured non-pharmacological interventions, and evidence-grounded pharmacotherapy guardrails."
    ),
    "nih_clinicaltrials_protocol": (
        "[PARADIGM: NIH CLINICALTRIALS.GOV PROTOCOL SYNTHESIS]\n"
        "You are a clinical trials protocol analyzer. Extract structured study architecture, inclusion/exclusion eligibility criteria, and primary/secondary endpoints "
        "from ClinicalTrials.gov NCT study protocols. Output valid structured JSON conforming to standardized trial schema."
    ),
    "dynamic_precondition_guard": (
        "[PARADIGM: DYNAMIC PRECONDITION SENTINEL & VITAL BOUNDARY BOUNDING]\n"
        "You are PocketGull Dynamic Precondition Sentinel. Enforce explicit physiological precondition boundaries "
        "(min/max SpO2, HR, SBP, DBP, altitude) on all clinical orders. Immediately invalidate stale recommendations "
        "and command emergency clinical contingencies whenever real-time patient telemetry drifts beyond safe bounds. "
        "Output strict JSON with keys: 'contractStatus', 'breachReason', 'immediateAction', 'clinicalContingency', 'auditAttestation'."
    ),
    "cars_distractor_elimination": (
        "[PARADIGM: CARS CRITICAL REASONING & DISTRACTOR ELIMINATION]\n"
        "You are PocketGull CARS Skeptical Eliminative Reasoning Engine. Evaluate complex diagnostic and therapeutic dilemmas. "
        "Strictly identify and reject extreme scope words (always, never, conclusively), shallow keyword matching lures, "
        "and reversed polarities. Do not rely on rule-out tests in high pre-test probability settings. "
        "Output strict JSON with keys: 'trapAudit', 'clinicalConclusion', 'carsSafetyFlag'."
    ),
    "aeromedical_evacuation_airway": (
        "[PARADIGM: AEROMEDICAL TRANSPORT & ALTITUDE HYPOXIA TITRATION]\n"
        "You are PocketGull Aeromedical Transport Intelligence. Calculate inter-island flight durations, mandatory "
        "2.0x safety reserve oxygen cylinder capacity, and altitude biophysical adjustments (Boyle's law gas expansion "
        "and Dalton's law ambient PaO2 drop). Formulate CMS emergency prior-authorization waiver citations and HCPCS codes (A0430, A0435). "
        "Output strict JSON with keys: 'corridorCalculations', 'altitudeBiophysics', 'billingAndRegulatory'."
    ),
    "pediatric_complex_epsdt": (
        "[PARADIGM: PEDIATRIC COMPLEX CARE & EPSDT STATUTORY PRIOR AUTHORIZATION]\n"
        "You are PocketGull Pediatric Complex Care & EPSDT Prior Authorization Advocate. Draft statutory medical necessity "
        "justifications under federal EPSDT doctrine (42 U.S.C. § 1396d(r)(5)) for continuous skilled private duty nursing (T1000). "
        "Overturn administrative custodial care denials by documenting life-threatening tracheostomy, ventilator, and enteral dependencies. "
        "Output strict JSON with keys: 'statutoryMandate', 'clinicalJustification', 'hcpcsCoding', 'appealAction'."
    ),
}

SAMPLE_DATASETS = {
    "clinical_cot": [
        {
            "input": "Female (34y), presenting with acute resting tachycardia (98 bpm, Baseline: 72 bpm) and mild exertion dyspnea. Recent mild viral illness 10 days ago.",
            "output": (
                "<thinking_process>\n"
                "1. H0 Hypothesis: Resting HR elevation is transient viral post-sequelae without structural myocarditis.\n"
                "2. p-value calculation against age-matched baseline yields p = 0.012 (reject H0 for normal resting variation).\n"
                "3. Differential: Post-viral autonomic dysfunction vs acute viral myocarditis vs thyroiditis.\n"
                "</thinking_process>\n"
                "<evidence_audit>\n"
                "- Finding: Resting Tachycardia (98 bpm)\n"
                "- Evidence Tier: Level B (Cohort studies on post-viral autonomic modulation)\n"
                "- Risk of Bias: Low\n"
                "</evidence_audit>\n"
                "<clinical_conclusion>\n"
                "Recommended Next Steps: High-sensitivity Troponin T, 12-lead ECG, orthostatic vitals check. Monitor for chest pain."
            ),
        },
        {
            "input": "Male (58y), fasting blood glucose 138 mg/dL (Baseline: 104 mg/dL), HbA1c 6.8%. History of hypertension.",
            "output": (
                "<thinking_process>\n"
                "1. H0 Hypothesis: Blood glucose elevation represents acute acute-phase stress response rather than persistent metabolic shift.\n"
                "2. HbA1c of 6.8% (p < 0.001) refutes H0 of acute stress; confirms persistent glycemic dysregulation.\n"
                "</thinking_process>\n"
                "<evidence_audit>\n"
                "- Finding: Elevated HbA1c (6.8%)\n"
                "- Evidence Tier: Level A (ADA Clinical Practice Guidelines)\n"
                "- Risk of Bias: Very Low\n"
                "</evidence_audit>\n"
                "<clinical_conclusion>\n"
                "Diagnostic Classification: Type 2 Diabetes Mellitus. Initiate lifestyle modification evaluation and renal function panel."
            ),
        },
    ],
    "fhir_extraction": [
        {
            "input": "Patient Jane Doe, 34yo female. Vitals: Heart Rate 98 bpm, Blood Pressure 120/80 mmHg. Symptom: Acute Tachycardia.",
            "output": json.dumps(
                {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": [
                        {
                            "resource": {
                                "resourceType": "Patient",
                                "id": "p-34f",
                                "gender": "female",
                                "birthDate": "1992-05-15",
                            }
                        },
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "status": "final",
                                "code": {
                                    "coding": [
                                        {
                                            "system": "http://loinc.org",
                                            "code": "8867-4",
                                            "display": "Heart rate",
                                        }
                                    ]
                                },
                                "valueQuantity": {
                                    "value": 98,
                                    "unit": "beats/min",
                                    "system": "http://unitsofmeasure.org",
                                    "code": "/min",
                                },
                            }
                        },
                    ],
                },
                indent=2,
            ),
        }
    ],
    "patient_tutor": [
        {
            "input": "Why is my heart rate higher than normal today after having a cold last week?",
            "output": (
                "When your body fights off a cold virus, your immune system releases natural signals called cytokines. "
                "These signals, along with mild dehydration, cause your heart to pump slightly faster to deliver nutrients "
                "and repair immune tissues throughout your body.\n\n"
                "Would you like to check how your resting heart rate today compares to your usual average when you feel fully healthy?"
            ),
        }
    ],
    "careplan_translation": [
        {
            "input": (
                "TARGET: Spanish (Simplified Cognitive Grade 6)\n"
                "ORIGINAL CARE PLAN:\n"
                "Patient exhibits acute essential hypertension (systolic BP 148 mmHg, diastolic BP 92 mmHg). "
                "Initiate Lisinopril 10mg PO daily. Monitor renal function panel (BUN/Creatinine) in 14 days."
            ),
            "output": (
                "### [START CARE PLAN]\n"
                "**Plan de Cuidado Personalizado**\n\n"
                "- **Diagnóstico**: Presión arterial alta (hipertensión arterial) con lecturas de 148/92 mmHg.\n"
                "- **Medicamento**: Tome **Lisinopril 10mg** por vía oral una vez al día.\n"
                "- **Próximo Paso**: Análisis de sangre para revisar la función de sus riñones en 14 días.\n"
                "### [END CARE PLAN]"
            ),
        }
    ],
    "biophysical_telemetry": [
        {
            "input": "ECG RMSSD: 18ms (Baseline: 42ms), PPG Pulse Transit Time: 140ms, EEG Alpha/Beta power ratio: 0.65. Rest duration: 6.2 hrs.",
            "output": (
                "<autonomic_evaluation>\n"
                "- Sympathetic Tone: Hyper-reactive (Elevated cardiac autonomic arousal)\n"
                "- Parasympathetic Vagal Tone: Suppressed (RMSSD < 20ms threshold, p = 0.008)\n"
                "- Biophysical Risk Score: High Vagal Withdrawal (Score: 7.8/10)\n"
                "- Classification: Acute Allostatic Stress Modulation\n"
                "</autonomic_evaluation>"
            ),
        }
    ],
    "webmcp_dispatch": [
        {
            "input": "Client telemetry indicates resting tachycardia (98 bpm). Dispatch local WebMCP offline edge assessment and update patient state.",
            "output": json.dumps(
                [
                    {
                        "tool": "OfflineEdgeAiService.runEdgeInference",
                        "args": {"metric": "heart_rate", "value": 98, "acuity": "moderate"},
                    },
                    {
                        "tool": "PatientStateService.updateVitals",
                        "args": {"heartRate": 98, "status": "flagged_tachycardia"},
                    },
                ],
                indent=2,
            ),
        }
    ],
    "multiorgan_crosstalk": [
        {
            "input": "Teledentistry FDI odontogram: generalized Periodontal Probing Depth PPD 5mm, SIBI index 7.2/10. Metabolic panel: Fasting Glucose 126 mg/dL.",
            "output": (
                "<crosstalk_analysis>\n"
                "- Primary System Interaction: Oral-Metabolic-Cardiovascular Axis\n"
                "- Inflammatory Coupling Vector: SIBI score 7.2 indicates high systemic TNF-alpha/IL-6 oral shedding\n"
                "- Cross-Talk Impact: Periodontal systemic burden increases 24-month T2D progression probability by 34% (p = 0.003)\n"
                "- Actionable Target: Co-manage periodontal SRP therapy alongside glycemic stabilization to lower SIBI index < 3.0\n"
                "</crosstalk_analysis>"
            ),
        }
    ],
    "hipaa_deidentification": [
        {
            "input": "Patient Robert Vance (DOB: 04/12/1968, SSN: 999-12-3456, Phone: 555-0199, MRN: #849201) residing in Seattle, WA 98101 was evaluated.",
            "output": "Patient [PATIENT_NAME] (DOB: [DATE_AGE_GT89], SSN: [REDACTED_SSN], Phone: [PHONE_NUMBER], MRN: [REDACTED_MRN]) residing in [LOCATION_CITY], [LOCATION_STATE] [ZIP_PREFIX] was evaluated.",
        }
    ],
    "voice_disfluency": [
        {
            "input": "Um, so... like, my left chest felt tight—wait, no, I mean my upper stomach right after dinner... like a sharp burning feeling for maybe 20 minutes.",
            "output": (
                "<clinical_intent_extraction>\n"
                "- Chief Complaint: Acute postprandial retrosternal/epigastric burning discomfort\n"
                "- Location: Upper epigastrium (self-corrected from left chest)\n"
                "- Duration: Approximately 20 minutes\n"
                "- Disfluencies Scrubbed: Removed 4 filler words ('um', 'so', 'like') and 1 speech self-correction ('left chest' -> 'upper stomach')\n"
                "</clinical_intent_extraction>"
            ),
        }
    ],
    "clinical_safety_guard": [
        {
            "input": "PROMPT EVALUATION: Patient presents with acute acetaminophen overdose (>10g ingestion). Evaluate emergency N-acetylcysteine (NAC) protocol.",
            "output": json.dumps(
                {
                    "safety_decision": "SAFE",
                    "policy_violation": None,
                    "rationale": "Standard-of-care medical emergency triage and toxic exposure management. Permitted under Clinical CDS safety policy.",
                },
                indent=2,
            ),
        }
    ],
    "generative_ui_dispatch": [
        {
            "input": "ASSESSMENT PANEL ENTRY: Patient reports 3-day history of localized severe pain in FDI tooth 36 (lower left first molar), sensitivity to hot/cold, and fasting glucose 132 mg/dL.",
            "output": json.dumps(
                {
                    "surfacedComponents": [
                        {
                            "componentId": "TeledentistryOdontogramComponent",
                            "priority": "high",
                            "reason": "Active dental pain reported on FDI Tooth 36 (lower left first molar)",
                            "props": {"activeFdiTooth": 36, "surfaceRisk": "occlusal_caries"},
                        },
                        {
                            "componentId": "BodyMeshFactoryComponent",
                            "priority": "medium",
                            "reason": "Surfacing 3D mandible bone PBR mesh for spatial pain localization",
                            "props": {"focusRegion": "mandible_left", "pbrStain": "inflammatory_hyperemia"},
                        },
                    ]
                },
                indent=2,
            ),
        }
    ],
    "double_flip_ui_interlock": [
        {
            "input": "SURFACED COMPONENT: TeledentistryOdontogramComponent (FDI Tooth 36, PPD 5mm, SIBI 7.2, Fasting Glucose 132 mg/dL)",
            "output": json.dumps(
                {
                    "componentId": "TeledentistryOdontogramComponent",
                    "stateA": {
                        "viewTitle": "State A: Clinician Control Panel (High-Density Medical Terms)",
                        "activeFdiTooth": 36,
                        "ppdMm": 5.0,
                        "sibiIndex": 7.2,
                        "clinicalDifferential": "Generalized Periodontitis with Systemic Inflammatory Burden (SIBI 7.2)",
                        "actionButtons": ["Initiate Periodontal SRP Protocol", "Export FHIR Observation"],
                    },
                    "stateB": {
                        "viewTitle": "State B: Patient Education Lens (Double-Flip Patient-Facing View)",
                        "plainLanguageDiagnosis": "Deep gum pocket around your back left tooth with mild swelling that can affect your blood sugar.",
                        "biophysicalAnalogy": "Think of healthy gums like a sealed door. When gum pockets get deeper than 4mm, microscopic bacteria can slip through into your bloodstream, making your body work harder to manage daily glucose levels.",
                        "socraticInquiry": "Would you like to see how caring for this tooth can help keep your morning blood sugar numbers more stable?",
                        "section1557Multilingual": {"spanish": "Bolsillo de encía profundo alrededor de su diente posterior izquierdo...", "readingGradeLevel": "Grade 6.2"},
                        "patientActionPlan": ["Brush twice daily with soft bristles", "Rinse with antimicrobial mouthwash", "Schedule 2-week follow-up"],
                    },
                },
                indent=2,
            ),
        }
    ],
    "dpo_epistemic_grounding": [
        {
            "input": json.dumps({"supplement": "Curcumin (Bio-enhanced)", "indication": "Knee Osteoarthritis", "dosageMg": 1000}, indent=2),
            "output": json.dumps({
                "evidenceTier": "Level B (Cohort / Small RCTs)",
                "nullHypothesisH0": "Curcumin 1000mg produces no statistically significant WOMAC score reduction compared to placebo at 12 weeks.",
                "pValue": 0.038,
                "isFalsified": True,
                "cochraneRiskOfBias": {"overall": "Some Concerns", "commercialFundingBias": "Moderate"},
                "recommendation": "Adjunctive supportive therapy. Does not replace physical therapy or weight management.",
                "primaryCitation": "Cochrane Database Syst Rev (PMID: 33150652)"
            }, indent=2),
            "chosen": "Curcumin demonstrates modest adjunctive pain reduction (p = 0.038 against H0), supported by Cochrane review (PMID: 33150652, Level B). Recommend as supportive therapy.",
            "rejected": "Curcumin is an FDA-approved miracle cure that permanently heals cartilage tears and completely eliminates arthritis."
        }
    ],
    "ambient_scribe_soap": [
        {
            "input": "Doctor: 'Good morning Mr. Davis.' Patient: 'I have had a dry cough for 3 weeks since starting my blood pressure pill.' Doctor: 'BP is 138/84, lungs clear. Switching from Lisinopril 20mg to Losartan 50mg.'",
            "output": json.dumps({
                "soapNote": {
                    "subjective": "64yo male with 3-week dry cough following Lisinopril initiation.",
                    "objective": "BP 138/84 mmHg, lungs clear bilaterally.",
                    "assessment": "ACEi-induced bradykinin cough.",
                    "plan": "1. Discontinue Lisinopril 20mg.\n2. Start Losartan 50mg.\n3. Recheck BMP in 3 weeks."
                }
            }, indent=2),
            "chosen": "Structured SOAP note detailing ACE-inhibitor cough mechanism, switch to Losartan, and 3-week follow-up.",
            "rejected": "Prescribe cough syrup and continue Lisinopril."
        }
    ],
    "pharmacogenomics_pgx": [
        {
            "input": json.dumps({
                "genotype": {"cyp2d6": "*4/*4 (Poor Metabolizer)", "slco1b1": "521T>C"},
                "medications": ["Simvastatin 40mg", "Metoprolol 50mg"],
                "botanicals": ["St. John's Wort 300mg"]
            }, indent=2),
            "output": json.dumps({
                "criticalAlerts": [
                    {
                        "type": "CONTRAINDICATION_INTERCEPT",
                        "agents": ["St. John's Wort", "Simvastatin"],
                        "mechanism": "Potent CYP3A4 induction reduces statin efficacy.",
                        "action": "Discontinue St. John's Wort."
                    },
                    {
                        "type": "PGX_DOSE_ADJUSTMENT",
                        "gene": "CYP2D6 *4/*4",
                        "drug": "Metoprolol",
                        "action": "Reduce dose 50% or switch to Atenolol."
                    }
                ],
                "riskScore": "CRITICAL"
            }, indent=2),
            "chosen": "Detects St. John's Wort CYP3A4 induction and CYP2D6 poor-metabolizer Metoprolol accumulation with dosage adjustments.",
            "rejected": "No interactions found."
        }
    ],
    "circadian_chronodosing": [
        {
            "input": json.dumps({
                "hrvRmssdMs": 24,
                "nocturnalBpDippingPct": 4.2,
                "currentMeds": [{"name": "Amlodipine 5mg", "currentTiming": "08:00 AM"}]
            }, indent=2),
            "output": json.dumps({
                "circadianPhenotype": "Non-Dipper Hypertensive",
                "chronotherapyOptimization": {
                    "recommendation": "Shift Amlodipine administration from 08:00 AM to 09:30 PM (Bedtime Dosing).",
                    "rationale": "Hygia Chronotherapy Trial demonstrates bedtime dosing converts non-dippers to dippers [PMID: 31640833]."
                }
            }, indent=2),
            "chosen": "Recommends bedtime administration shift for non-dipping hypertensive phenotype based on Hygia trial.",
            "rejected": "Keep morning administration."
        }
    ],
    "prior_auth_cms0057f": [
        {
            "input": json.dumps({
                "patientId": "pat_98231",
                "diagnosis": "Severe Eczema refractory to topical steroids",
                "requestedMedication": "Dupilumab 300mg SQ q2w"
            }, indent=2),
            "output": json.dumps({
                "resourceType": "Bundle",
                "type": "collection",
                "entry": [{"resource": {"resourceType": "Claim", "use": "preauthorization", "diagnosis": [{"sequence": 1, "diagnosisCodeableConcept": {"coding": [{"code": "L20.84"}]}}]}}]
            }, indent=2),
            "chosen": "Generates valid CMS-0057-F FHIR R4 Claim preauthorization bundle with ICD-10 L20.84.",
            "rejected": "Outputs non-standard text letter without FHIR schema."
        }
    ],
    "tri_paradigm_synthesis": [
        {
            "input": json.dumps({
                "westernDiagnosis": "Metabolic Syndrome (Fasting Glucose 118 mg/dL)",
                "tongueObservation": "Pale swollen tongue with greasy white coating",
                "doshaAssessment": "Kapha-Pitta aggravation with impaired Agni"
            }, indent=2),
            "output": json.dumps({
                "westernPathophysiology": "Hepatic de novo lipogenesis and insulin resistance.",
                "easternTcmPattern": "Spleen Qi Deficiency with Phlegm-Damp Accumulation (Tan Shi).",
                "ayurvedicEnergetics": "Mandagni generating Ama obstructing Meda Dhatu.",
                "integratedProtocol": {"pharmacotherapy": "Metformin 500mg ER", "herbalFormulation": "Er Chen Tang + Triphala"}
            }, indent=2),
            "chosen": "Cross-paradigm integration mapping insulin resistance to Spleen Dampness and Kapha-Ama.",
            "rejected": "Unsubstantiated claims without clinical safety bounds."
        }
    ],
    "rsna_imaging_vlm": [
        {
            "input": json.dumps({
                "modality": "DICOM Knee Radiograph + Sagittal PD MRI",
                "findings": "Medial joint space narrowing, subchondral sclerosis, 3mm osteophyte, medial meniscus grade 2 cleavage tear."
            }, indent=2),
            "output": json.dumps({
                "kellgrenLawrenceGrade": "Grade 3 (Moderate Osteoarthritis)",
                "radiologicalImpression": "1. Moderate medial compartment knee osteoarthritis (KL Grade 3).\n2. Non-displaced intrasubstance medial meniscus posterior horn degeneration.",
                "clinicalRecommendation": "Conservative physical therapy and unloader bracing."
            }, indent=2),
            "chosen": "Kellgren-Lawrence Grade 3 impression with conservative physical therapy recommendation.",
            "rejected": "Recommends emergency total knee replacement."
        }
    ],
    "seo_medical_journalism": [
        {
            "input": json.dumps({"studyTopic": "Zone 2 Cardio and Mitochondrial Biogenesis", "sourceCitations": ["San-Millán I. Cell Metab 2018 (PMID: 29909271)"]}, indent=2),
            "output": json.dumps({
                "articleTitle": "The Power of Zone 2 Cardio: How Easy Exercise Turbocharges Your Cellular Energy",
                "slug": "zone-2-cardio-mitochondrial-health",
                "fleschKincaidGradeLevel": 7.2,
                "metaDescription": "Discover how 45 minutes of easy Zone 2 cardio trains your mitochondria to burn fat efficiently.",
                "ftcDisclaimer": "As an Amazon Associate, PocketGull earns from qualifying purchases."
            }, indent=2),
            "chosen": "Grade 7.2 plain-language article with structured JSON-LD MedicalWebPage metadata and compliant FTC disclaimers for pocketgull.com.",
            "rejected": "Dense academic jargon or unverified miracle fitness claims."
        }
    ],
    "voice_multimodal_live": [
        {
            "input": "Patient audio transcript: 'Um, hi doctor... so like, I have had this, uh, sharp pain under my right ribs for two days, and wait—it actually started Sunday night after pizza, and it kind of travels to my shoulder blade.'",
            "output": json.dumps({
                "extractedClinicalFacts": {"chiefComplaint": "RUQ pain", "duration": "2 days post-fatty meal", "radiation": "Right scapula"},
                "spokenResponseSsml": "<speak>I hear you clearly. <break time='300ms'/> Because this pattern can point to your gallbladder, <emphasis level='moderate'>have you noticed any nausea or fever?</emphasis></speak>"
            }, indent=2),
            "chosen": "Strips speech disfluencies, extracts biliary colic chronology, and responds with natural SSML audio tags for streaming live consult in pocketgull.app.",
            "rejected": "Robotic wall of text without acoustic pacing or empathy."
        }
    ],
    "calgary_cambridge_intake": [
        {
            "input": json.dumps({"currentDialogTurn": 2, "patientLastMessage": "I have had a dull headache in the back of my head for 4 days."}, indent=2),
            "output": json.dumps({
                "opqrstState": {"onset": "4 days ago", "quality": "Dull ache", "radiation": "Occipital"},
                "nextSocraticQuestion": "On a scale from 1 to 10, how intense is this dull ache, and does it feel tighter when looking down at screens?"
            }, indent=2),
            "chosen": "Progressive 1-question Socratic inquiry characterizing tension headache vs cervical strain while screening red flags.",
            "rejected": "Asks 15 overwhelming questions at once."
        }
    ],
    "fda_ftc_compliance_copywriter": [
        {
            "input": "Draft Marketing Copy: 'PocketGull is an AI doctor app that instantly cures chronic fatigue and permanently stops joint degeneration.'",
            "output": json.dumps({
                "complianceStatus": "VIOLATIONS_NEUTRALIZED",
                "remediatedCompliantCopy": "PocketGull provides evidence-grounded Clinical Decision Support and care plan strategies alongside your physician.",
                "statutoryDisclaimer": "PocketGull is an epistemological clinical intelligence platform conforming to FDA 21 CFR §520(o) non-device CDS standards."
            }, indent=2),
            "chosen": "Rewrites misleading health marketing into FTC-substantiated statements with explicit FDA 21 CFR §520(o) CDS notices.",
            "rejected": "Approves illegal curative claims."
        }
    ],
    "ambient_environmental_telemetry": [
        {
            "input": json.dumps({
                "barometric_trend": "rapid_drop (998.4 hPa)",
                "ambient_db": 54.2,
                "aqi": 42,
                "uv_index": 3.1,
                "schumann_hz": 7.83
            }, indent=2),
            "output": json.dumps({
                "risk_detected": "Rapid barometric pressure drop triggering cranial vascular headache & parasympathetic withdrawal",
                "recommended_protocol": "Sacred Cedar Flute 432 Hz",
                "volume_offset_db": -2.5,
                "clinical_rationale": "432 Hz acoustic flute harmonics lower sympathetic vascular tone and stabilize cranial blood flow during barometric depressions."
            }, indent=2),
            "chosen": "Detects rapid barometric drop risk, prescribes 432 Hz flute harmonics with negative dB offset, and provides autonomic rationale.",
            "rejected": "Ignores barometric pressure and blasts loud white noise."
        }
    ],
    "clinician_fatigue_adaptive_ui": [
        {
            "input": json.dumps({
                "karolinska_sleepiness_scale": 8,
                "shift_duration_hours": 12.5,
                "active_clinical_role": "Attending Emergency Physician"
            }, indent=2),
            "output": json.dumps({
                "theme": "Dark Obsidian",
                "motion_enabled": False,
                "binaural_entrainment_hz": 40.0,
                "alertness_protocol": "STAT shift fatigue mitigation: high-contrast dark obsidian surface, zero UI motion jitter, and pulsed 40 Hz gamma acoustic stimulation."
            }, indent=2),
            "chosen": "Switches to Dark Obsidian theme, disables motion jitter, and activates 40 Hz gamma entrainment for high KSS fatigue.",
            "rejected": "Leaves bright flashing animations on and plays sleep-inducing delta waves during emergency shift."
        }
    ],
    "life_journey_sensory_path": [
        {
            "input": json.dumps({
                "patient_archetype": "The Frontline Healer",
                "current_subjective_energy": 3,
                "primary_need": "Burnout recovery and somatic decompression"
            }, indent=2),
            "output": json.dumps({
                "audio_engine": "Bilateral EMDR Panning at 8 Hz with Purr Harmonics",
                "panning_mode": "Bilateral 8 Hz Sinusoidal",
                "grounding_phrase": "You have held space for others; now let the stillness hold and restore you."
            }, indent=2),
            "chosen": "Selects Bilateral EMDR 8 Hz engine with gentle affirmation matching Frontline Healer burnout state.",
            "rejected": "Assigns aggressive upbeat rock track to exhausted clinician."
        }
    ],
    "nih_medquad_qa": [
        {
            "input": "What are the evidence-based lifestyle modifications and first-line pharmacological recommendations for Stage 1 Hypertension according to NIH / ACC / AHA guidelines?",
            "output": (
                "[CLINICAL DIRECTIVE CONTEXT: NIH NHLBI & ACC/AHA Guideline Consensus]\n\n"
                "**Where You Stand Today (Diagnostic Criteria)**\n"
                "- Stage 1 Hypertension is defined as systolic blood pressure 130–139 mmHg or diastolic 80–89 mmHg.\n\n"
                "**30-Day & 90-Day Trajectory Roadmap**\n"
                "1. Dietary sodium restriction (<2300 mg/day; optimal <1500 mg/day).\n"
                "2. DASH diet pattern with 3500-5000 mg/day dietary potassium.\n"
                "3. Aerobic exercise 150 min/week moderate intensity.\n"
                "4. First-line pharmacotherapy if ASCVD risk >= 10% (Chlorthalidone 12.5 mg or Amlodipine 5 mg PO daily).\n\n"
                "*Evidence Grade: Level A (SPRINT Trial, PMID: 26551272).*"
            ),
            "chosen": "Provides structured NIH NHLBI DASH sodium thresholds, 150 min aerobic conditioning targets, and ASCVD risk stratification triggers.",
            "rejected": "Recommends untested herbal mega-dosing to cure all hypertension overnight."
        }
    ],
    "who_mhgap_triage": [
        {
            "input": "How does the WHO mhGAP Intervention Guide triage and structure stepped-care management for adults presenting with moderate-to-severe depressive episodes?",
            "output": (
                "[CLINICAL DIRECTIVE CONTEXT: WHO mhGAP Clinical Intervention Protocol]\n\n"
                "**Where You Stand Today (Triage Stratification)**\n"
                "- Mild Symptoms: Psychoeducation, sleep hygiene, and problem-solving counseling (do NOT initiate routine antidepressants).\n"
                "- Moderate/Severe Episode (>= 2 weeks core symptoms):\n"
                "  1. Structured brief psychological interventions (CBT or IPT).\n"
                "  2. First-line SSRI pharmacotherapy (Fluoxetine 20 mg or Sertraline 50 mg PO daily).\n\n"
                "**Where You're Going (Monitoring Horizon)**\n"
                "- Advise patient of 2-4 week therapeutic latency.\n"
                "- Maintain treatment >= 9-12 months following remission to prevent relapse.\n\n"
                "*Evidence Grade: Level A (WHO mhGAP Guideline Module Depression).*"
            ),
            "chosen": "Grounds depression stepped-care in WHO mhGAP protocol, reserving SSRIs for moderate/severe episodes with CBT and 9-12 month maintenance.",
            "rejected": "Immediately prescribes polypharmacy sedatives without psychosocial counseling or follow-up."
        }
    ],
    "nih_clinicaltrials_protocol": [
        {
            "input": json.dumps({"nctId": "NCT04280788", "phase": "Phase 3", "disease": "Metastatic Non-Small Cell Lung Cancer"}, indent=2),
            "output": json.dumps({
                "protocolSchema": {
                    "nctId": "NCT04280788",
                    "studyDesign": "Quadruple-Blind Randomized Controlled Trial",
                    "inclusionCriteria": ["Histologically confirmed NSCLC", "ECOG 0-1", "Adequate hematologic/renal function"],
                    "exclusionCriteria": ["Active untreated CNS metastases", "Prior target inhibitor within 28 days"],
                    "primaryOutcome": "Progression-Free Survival (PFS) at 12 months",
                    "secondaryOutcomes": ["Overall Survival (OS)", "Objective Response Rate (ORR)"]
                },
                "evidenceGrade": "Level A (NIH Registry Standard)"
            }, indent=2),
            "chosen": "Synthesizes standardized NCT schema, inclusion/exclusion bounds, and primary endpoints.",
            "rejected": "Extracts unstructured text without schema validation or safety exclusion criteria."
        }
    ],
    "dynamic_precondition_guard": [
        {
            "input": json.dumps({
                "patient": "Homo Sapiens (Pediatric, Complex Tracheostomy, 4y)",
                "activeRecommendation": "Wean supplemental oxygen by 0.5 L/min q30min toward room air",
                "telemetryShift": {
                    "previousVitals": {"heartRate": 98, "bloodPressure": "96/60", "spO2": 97, "respiratoryRate": 22},
                    "currentVitals": {"heartRate": 144, "bloodPressure": "80/46", "spO2": 88, "respiratoryRate": 40}
                }
            }, indent=2),
            "output": json.dumps({
                "contractStatus": "PRECONDITION_BREACHED_INVALIDATED",
                "breachReason": "Acute vital telemetry drift: SpO2 dropped to 88% (Safe threshold >= 92%), Heart Rate surged to 144 bpm (Safe threshold 80-125 bpm).",
                "immediateAction": "HALT_WEANING_IMMEDIATELY",
                "clinicalContingency": [
                    "Re-escalate FiO2 to 40% immediately.",
                    "Perform sterile inline tracheostomy suctioning to rule out acute mucus plug obstruction.",
                    "Verify breath sounds bilaterally; prepare bag-valve-mask with tracheostomy adapter.",
                    "STAT bedside respiratory therapy and attending physician notification."
                ],
                "auditAttestation": "SHA-256 state seal verified, previous weaning contract retired."
            }, indent=2),
            "chosen": "Recognizes SpO2 88% and HR 144 breach, immediately invalidates the scheduled oxygen weaning contract, commands FiO2 re-escalation, and orders emergency sterile inline suctioning.",
            "rejected": "Continues with scheduled oxygen weaning down to room air despite SpO2 dropping to 88% and respiratory rate spiking to 40."
        }
    ],
    "cars_distractor_elimination": [
        {
            "input": json.dumps({
                "presentation": "62yo female with acute dyspnea, pleuritic right-sided chest pain, tachycardia (HR 118), and right lower extremity swelling. Wells Score: 6.0 (High Probability for Pulmonary Embolism). Bedside D-Dimer: 420 ng/mL (Normal Reference < 500 ng/mL).",
                "distractorPrompt": "Since the D-Dimer is below the standard 500 ng/mL cutoff, does this conclusively rule out pulmonary embolism?"
            }, indent=2),
            "output": json.dumps({
                "trapAudit": {
                    "distractorIdentified": "Keyword decoy trap (Normal D-dimer in high pre-test probability patient)",
                    "eliminationReason": "Per PIOPED II and ACEP guidelines, D-dimer has high sensitivity only in low or intermediate probability cases. In high pre-test probability (Wells > 4), a negative D-dimer NEVER rules out PE due to unacceptable false negative rates."
                },
                "clinicalConclusion": "High clinical suspicion for acute pulmonary embolism. Proceed immediately to STAT Computed Tomography Pulmonary Angiography (CTPA) or V/Q scan if renal/contrast contraindicated.",
                "carsSafetyFlag": "DO_NOT_RELY_ON_RULE_OUT_TESTS_IN_HIGH_PRETEST_PROBABILITY"
            }, indent=2),
            "chosen": "Identifies high pre-test Wells score (6.0), rejects the normal D-dimer decoy trap, and orders STAT CTPA with consideration of empiric anticoagulation.",
            "rejected": "Concludes that because D-dimer is under 500 ng/mL, pulmonary embolism is 100% ruled out, and discharges patient with muscle relaxants."
        }
    ],
    "aeromedical_evacuation_airway": [
        {
            "input": json.dumps({
                "corridor": "PGSN (Saipan International Airport, MP) -> PHNL (Honolulu International, HI)",
                "statuteMiles": 3786,
                "nauticalMiles": 3290,
                "patient": "Pediatric Tracheostomy (Ventilator Dependent)",
                "ventilatorSettings": {"fio2": 0.45, "minuteVentilationLpm": 6.0, "peepCmH2O": 6},
                "aircraftCabinAltitudeFt": 8000
            }, indent=2),
            "output": json.dumps({
                "corridorCalculations": {
                    "estimatedFlightHours": 7.6,
                    "baselineOxygenLiters": 5540,
                    "safetyReserveMultiplier": 2.0,
                    "totalRequiredOxygenLiters": 11080,
                    "cylinderManifest": "3x Jumbo M-Cylinders (3,450L each) + 2x Portable E-Cylinders (680L each) for ground-to-air transition"
                },
                "altitudeBiophysics": {
                    "boylesLawGasExpansionPct": 33.0,
                    "daltonsLawPaO2DropPct": 25.0,
                    "hypoxiaCompensationDirective": "Cabin pressure altitude of 8,000 ft reduces ambient PaO2. Titrate FiO2 from 0.45 to 0.55 to maintain SpO2 >= 94%.",
                    "cuffManagementDirective": "Deflate air in tracheostomy cuff and inflate with sterile water/saline to eliminate Boyle expansion tracheal ischemia."
                },
                "billingAndRegulatory": {
                    "hcpcsCodes": ["A0430 (Ambulance service, conventional air transport, fly, one way)", "A0435 (Fixed wing air mileage, per statute mile)"],
                    "emergencyTransportWaiver": "CMS Emergency Aeromedical Transport Waiver § 410.40(c) applies - Zero pre-authorization delay permitted for emergent tertiary pediatric transfer."
                }
            }, indent=2),
            "chosen": "Calculates 7.6-hour flight duration, applies mandatory 2.0x oxygen safety margin (11,080L), compensates for Dalton altitude hypoxia (FiO2 0.55), substitutes tracheostomy cuff air with saline for Boyle expansion, and formats CMS A0430/A0435 billing codes.",
            "rejected": "Plans transport with single oxygen cylinder without reserve margin and fails to adjust ventilator FiO2 or cuff pressure for 8,000 ft cabin altitude."
        }
    ],
    "pediatric_complex_epsdt": [
        {
            "input": json.dumps({
                "patientArchetype": "Homo Sapiens (Pediatric, Spastic Quadriplegia, C1-C2 Instability, Tracheostomy, 5y)",
                "requestedService": "Private Duty Nursing (PDN) 112 hours/week (16 hours/day x 7 days) HCPCS T1000",
                "denialRationale": "Medicaid managed care organization claims services are 'custodial in nature' and can be provided by family caregiver.",
                "recentClinicalIncidents": [
                    "Nocturnal desaturation to 72% secondary to deep mucus plug requiring sterile inline suctioning and emergency ambu bagging",
                    "Accidental tracheostomy decannulation during sleep safely replaced by skilled nurse"
                ]
            }, indent=2),
            "output": json.dumps({
                "statutoryMandate": "42 U.S.C. § 1396d(r)(5) (Omnibus Budget Reconciliation Act of 1989) mandates that state Medicaid programs provide all EPSDT services necessary to correct or ameliorate physical and mental conditions in individuals under age 21, regardless of whether such services are covered under the state plan.",
                "clinicalJustification": "Continuous skilled nursing is medically indispensable. Tracheostomy occlusion or decannulation in a non-verbal child with quadriplegia constitutes an immediate threat to life causing irreversible hypoxic brain death within 3-4 minutes. Assessment, sterile suctioning, mechanical ventilator management, and emergency re-cannulation require licensed nursing judgment (RN/LPN) under state Nurse Practice Acts and cannot legally be categorized as custodial care.",
                "hcpcsCoding": {"code": "T1000", "modifier": "U1 (Pediatric Complex)", "units": 112},
                "appealAction": "STAT Expedited External Administrative Appeal and Judicial Injunction notice under 42 CFR § 438.410."
            }, indent=2),
            "chosen": "Cites mandatory federal EPSDT statute (42 U.S.C. § 1396d(r)(5)), disproves custodial care assertion with documented life-threatening mucus plug incidents, and demands 112 hours/week skilled nursing coverage.",
            "rejected": "Agrees to reduce nursing hours to zero based on managed care denial and advises single parent to provide 24/7 ICU-level suctioning alone."
        }
    ],
}


def format_gemma_prompt(system_directive: str, user_input: str, model_response: str = "") -> str:
    """Format prompt using Gemma's control token chat template.

    Args:
        system_directive: Paradigm system instructions.
        user_input: User presentation or input payload.
        model_response: Expected model generation target (for training).

    Returns:
        Formatted prompt string adhering to Gemma control token standards.
    """
    formatted = (
        f"<start_of_turn>user\n"
        f"{system_directive.strip()}\n\n"
        f"INPUT:\n{user_input.strip()}<end_of_turn>\n"
        f"<start_of_turn>model\n"
    )
    if model_response:
        formatted += f"{model_response.strip()}<end_of_turn>\n"
    return formatted


def load_dataset_for_paradigm(paradigm: str, custom_path: Optional[str] = None) -> List[Dict[str, str]]:
    """Load or generate training formatted samples for the specified paradigm.

    Args:
        paradigm: Key identifying the target clinical paradigm.
        custom_path: Optional file path to a JSON lines dataset file.

    Returns:
        List of formatted prompt dictionary objects containing a 'text' field.
    """
    directive = PARADIGM_DIRECTIVES.get(paradigm, PARADIGM_DIRECTIVES["clinical_cot"])
    raw_samples = []

    if custom_path:
        path_to_try = os.path.expanduser(custom_path.strip().strip('"').strip("'"))
        if not os.path.exists(path_to_try) and len(path_to_try) > 2 and path_to_try[1] == ':':
            drive = path_to_try[0].lower()
            rest = path_to_try[2:].replace('\\', '/')
            path_to_try = f"/mnt/{drive}{rest}"

        if os.path.exists(path_to_try):
            logger.info(f"Loading custom dataset from {path_to_try}")
            with open(path_to_try, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        raw_samples.append(json.loads(line))
        else:
            logger.warning(f"Custom path '{custom_path}' not found. Falling back to synthetic samples.")
            raw_samples = SAMPLE_DATASETS.get(paradigm, SAMPLE_DATASETS["clinical_cot"])
    else:
        logger.info(f"Using pre-packaged synthetic dataset samples for paradigm '{paradigm}'")
        raw_samples = SAMPLE_DATASETS.get(paradigm, SAMPLE_DATASETS["clinical_cot"])

    formatted_samples = []
    for sample in raw_samples:
        if "text" in sample:
            formatted_samples.append({"text": sample["text"]})
        elif "chosen" in sample and "rejected" in sample:
            prompt = (sample.get("prompt") or sample.get("input") or "").strip()
            chosen = sample.get("chosen", "").strip()
            rejected = sample.get("rejected", "").strip()
            formatted_prompt = format_gemma_prompt(system_directive=directive, user_input=prompt)
            formatted_samples.append({
                "prompt": formatted_prompt,
                "chosen": f"{chosen}<end_of_turn>\n",
                "rejected": f"{rejected}<end_of_turn>\n",
                "text": format_gemma_prompt(
                    system_directive=directive,
                    user_input=prompt,
                    model_response=chosen or sample.get("output", ""),
                ),
            })
        elif "input" in sample:
            instr = sample.get("instruction", "").strip()
            inp = sample.get("input", "").strip()
            combined_input = f"{instr}\n\n{inp}".strip() if instr else inp
            text = format_gemma_prompt(
                system_directive=directive,
                user_input=combined_input,
                model_response=sample.get("output", ""),
            )
            formatted_samples.append({"text": text})

    return formatted_samples


# -----------------------------------------------------------------------------
# Unsloth Fine-Tuning Execution Engine
# -----------------------------------------------------------------------------
def train_with_unsloth(args: argparse.Namespace, dataset_samples: List[Dict[str, str]]) -> None:
    """Execute LoRA fine-tuning using Unsloth FastLanguageModel."""
    from datasets import Dataset
    from trl import SFTTrainer
    from transformers import TrainingArguments

    logger.info(f"Initializing Unsloth FastLanguageModel: {args.model_name}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model_name,
        max_seq_length=args.max_seq_length,
        dtype=None,  # Auto detection (float16 / bfloat16)
        load_in_4bit=True,
    )

    # Configure target modules to protect against catastrophic forgetting
    is_gemma_3_or_4 = any(tag in args.model_name.lower() for tag in ["gemma-3", "gemma-4", "gemma3", "gemma4"])
    if args.peft_mode == "attention_only":
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]
        if is_gemma_3_or_4:
            logger.info(f"🛡️ [Gemma 3/4 PEFT Anti-Forgetting Guard] Targeting {args.model_name} Attention Projections (MLP and Vision backbones 100% frozen to preserve biomedical knowledge).")
        else:
            logger.info("🛡️ [PEFT Anti-Forgetting Guard] Targeting Attention Projections only (MLP layers 100% frozen to preserve factual knowledge).")
    else:
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
        logger.info(f"Configuring all linear projection layers for LoRA on {args.model_name}.")

    logger.info(f"Configuring LoRA PEFT model (r={args.r}, alpha={args.alpha}, dropout={args.lora_dropout}, max_seq={args.max_seq_length})...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.r,
        lora_alpha=args.alpha,
        lora_dropout=args.lora_dropout,
        target_modules=target_modules,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )

    # Dataset train / validation split to monitor overfitting
    full_dataset = Dataset.from_list(dataset_samples)
    if args.val_split > 0 and len(dataset_samples) >= 4:
        split_data = full_dataset.train_test_split(test_size=args.val_split, seed=3407)
        train_dataset = split_data["train"]
        eval_dataset = split_data["test"]
        logger.info(f"📊 Dataset partitioned: {len(train_dataset)} train samples, {len(eval_dataset)} validation samples.")
    else:
        train_dataset = full_dataset
        eval_dataset = None

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        dataset_num_proc=2,
        packing=False,
        args=TrainingArguments(
            per_device_train_batch_size=args.batch_size,
            gradient_accumulation_steps=args.grad_accum,
            warmup_steps=5,
            max_steps=args.max_steps if args.max_steps > 0 else len(train_dataset) * args.epochs,
            learning_rate=args.lr,
            weight_decay=args.weight_decay,
            fp16=not FastLanguageModel.is_bfloat16_supported(),
            bf16=FastLanguageModel.is_bfloat16_supported(),
            logging_steps=1,
            eval_strategy="steps" if eval_dataset else "no",
            eval_steps=5 if eval_dataset else None,
            output_dir=args.output_dir,
            optim="adamw_8bit",
            seed=3407,
        ),
    )

    logger.info("Starting LoRA fine-tuning with Unsloth...")
    trainer_stats = trainer.train()
    logger.info(f"Training complete. Loss stats: {trainer_stats}")

    logger.info(f"Saving fine-tuned LoRA weights to {args.output_dir}")
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    if args.export_gguf:
        logger.info(f"Exporting model to GGUF format: quantization={args.export_gguf}")
        model.save_pretrained_gguf(args.output_dir, tokenizer, quantization_method=args.export_gguf)
        logger.info("GGUF export successfully finished.")


# -----------------------------------------------------------------------------
# Fallback Hugging Face PEFT + TRL Execution Engine
# -----------------------------------------------------------------------------
def train_with_huggingface(args: argparse.Namespace, dataset_samples: List[Dict[str, str]]) -> None:
    """Execute LoRA fine-tuning using standard Hugging Face PEFT + TRL."""
    try:
        import torch
        from datasets import Dataset
        from peft import LoraConfig, get_peft_model
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
        from trl import SFTConfig, SFTTrainer
    except ImportError as e:
        logger.error(f"Missing required Hugging Face dependency: {e}")
        logger.error("Install dependencies via: pip install torch transformers peft trl datasets bitsandbytes")
        sys.exit(1)

    logger.info(f"Initializing model for fine-tuning: {args.model_name}")
    import os
    os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
    
    use_cuda = torch.cuda.is_available()
    logger.info(f"Compute Backend Detected: {'CUDA/ROCm GPU' if use_cuda else 'Multi-Core CPU (Intel i7)'}")

    if use_cuda:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16,
        )
        model = AutoModelForCausalLM.from_pretrained(
            args.model_name,
            quantization_config=bnb_config,
            device_map="auto",
            low_cpu_mem_usage=True,
        )
    else:
        # Load in bfloat16 on CPU to cut memory from 11GB down to 3GB
        model = AutoModelForCausalLM.from_pretrained(
            args.model_name,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
        )

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Target module selection to prevent catastrophic forgetting
    if args.peft_mode == "attention_only":
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]
        logger.info("🛡️ [PEFT Anti-Forgetting Guard] Freezing MLP layers (targeting Q/K/V/O attention matrices only).")
    else:
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]

    peft_config = LoraConfig(
        r=args.r,
        lora_alpha=args.alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=target_modules,
    )

    model = get_peft_model(model, peft_config)
    if use_cuda and hasattr(model, "gradient_checkpointing_enable"):
        model.gradient_checkpointing_enable()

    full_dataset = Dataset.from_list(dataset_samples)
    if args.val_split > 0 and len(dataset_samples) >= 4:
        split_data = full_dataset.train_test_split(test_size=args.val_split, seed=3407)
        train_dataset = split_data["train"]
        eval_dataset = split_data["test"]
        logger.info(f"📊 Dataset split: {len(train_dataset)} training rows, {len(eval_dataset)} validation rows.")
    else:
        train_dataset = full_dataset
        eval_dataset = None

    effective_grad_accum = min(args.grad_accum, max(1, len(train_dataset)))

    training_args = SFTConfig(
        dataset_text_field="text",
        max_length=args.max_seq_length,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=effective_grad_accum,
        warmup_steps=1,
        max_steps=args.max_steps if args.max_steps > 0 else len(train_dataset) * args.epochs,
        learning_rate=args.lr,
        weight_decay=args.weight_decay,
        fp16=use_cuda,
        bf16=not use_cuda,
        use_cpu=not use_cuda,
        logging_steps=1,
        eval_strategy="steps" if eval_dataset else "no",
        eval_steps=5 if eval_dataset else None,
        output_dir=args.output_dir,
        gradient_checkpointing=use_cuda,
        optim="paged_adamw_8bit" if use_cuda else "adamw_torch",
        dataloader_pin_memory=False,
        max_grad_norm=0.3,
    )

    from transformers import TrainerCallback
    import time
    import gc

    class ThermalCooldownCallback(TrainerCallback):
        """Inserts intermittent cooling breaks during long-running training runs."""
        def __init__(self, cooldown_seconds: int = 45, step_frequency: int = 15):
            self.cooldown_seconds = cooldown_seconds
            self.step_frequency = step_frequency

        def on_step_end(self, args, state, control, **kwargs):
            if state.global_step > 0 and state.global_step % self.step_frequency == 0:
                logger.info(f"🌬️ [Thermal Cooldown] Step {state.global_step}: Pausing for {self.cooldown_seconds}s to cool CPU/GPU cores & flush cache...")
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                time.sleep(self.cooldown_seconds)
                logger.info("⚡ [Thermal Cooldown] Cooldown complete. Resuming training with fresh thermal headroom.")

        def on_epoch_end(self, args, state, control, **kwargs):
            logger.info(f"🌬️ [Thermal Cooldown] Epoch complete: Pausing for {self.cooldown_seconds * 2}s inter-epoch thermal rest...")
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            time.sleep(self.cooldown_seconds * 2)
            logger.info("⚡ [Thermal Cooldown] Inter-epoch cooling complete. Resuming next epoch.")

    cooldown_cb = ThermalCooldownCallback(
        cooldown_seconds=args.cooldown_seconds,
        step_frequency=args.cooldown_steps
    )

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        args=training_args,
        callbacks=[cooldown_cb] if args.cooldown_seconds > 0 else None,
    )

    logger.info(f"Starting LoRA fine-tuning (Accumulation: {effective_grad_accum}, Device: {'GPU' if use_cuda else 'CPU'}, Thermal Breaks: {args.cooldown_seconds}s every {args.cooldown_steps} steps)...")
    trainer.train()

    logger.info(f"Saving fine-tuned LoRA adapter to {args.output_dir}")
    model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    logger.info("✅ Fine-tuning completed successfully and adapter weights saved.")


# -----------------------------------------------------------------------------
# DPO / ORPO Preference Training Engine (Epistemic Grounding & Safety)
# -----------------------------------------------------------------------------
def train_dpo_with_huggingface(args: argparse.Namespace, dataset_samples: List[Dict[str, str]]) -> None:
    """Execute DPO (Direct Preference Optimization) fine-tuning using Hugging Face TRL."""
    try:
        import torch
        from datasets import Dataset
        from peft import LoraConfig, get_peft_model
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
        from trl import DPOConfig, DPOTrainer
    except ImportError as e:
        logger.error(f"Missing required DPO dependency: {e}")
        logger.error("Install dependencies via: pip install torch transformers peft trl datasets bitsandbytes")
        sys.exit(1)

    logger.info(f"Initializing model for DPO Preference Tuning: {args.model_name}")
    use_cuda = torch.cuda.is_available()
    logger.info(f"Compute Backend Detected: {'CUDA/ROCm GPU' if use_cuda else 'Multi-Core CPU (Intel i7)'}")

    if use_cuda:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16,
        )
        model = AutoModelForCausalLM.from_pretrained(
            args.model_name,
            quantization_config=bnb_config,
            device_map="auto",
            low_cpu_mem_usage=True,
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            args.model_name,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
        )

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Target modules for PEFT anti-forgetting guard
    if args.peft_mode == "attention_only":
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]
        logger.info("🛡️ [DPO PEFT Anti-Forgetting Guard] Freezing MLP layers (Q/K/V/O attention matrices only).")
    else:
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]

    peft_config = LoraConfig(
        r=args.r,
        lora_alpha=args.alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=target_modules,
    )

    full_dataset = Dataset.from_list(dataset_samples)
    if args.val_split > 0 and len(dataset_samples) >= 4:
        split_data = full_dataset.train_test_split(test_size=args.val_split, seed=3407)
        train_dataset = split_data["train"]
        eval_dataset = split_data["test"]
        logger.info(f"📊 DPO dataset split: {len(train_dataset)} train pairs, {len(eval_dataset)} validation pairs.")
    else:
        train_dataset = full_dataset
        eval_dataset = None

    effective_grad_accum = min(args.grad_accum, max(1, len(train_dataset)))

    dpo_args = DPOConfig(
        beta=args.dpo_beta,
        max_length=args.max_seq_length,
        max_prompt_length=args.max_seq_length // 2,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=effective_grad_accum,
        warmup_steps=1,
        max_steps=args.max_steps if args.max_steps > 0 else len(train_dataset) * args.epochs,
        learning_rate=args.lr,
        weight_decay=args.weight_decay,
        fp16=use_cuda,
        bf16=not use_cuda,
        logging_steps=1,
        eval_strategy="steps" if eval_dataset else "no",
        eval_steps=5 if eval_dataset else None,
        output_dir=args.output_dir,
        gradient_checkpointing=use_cuda,
        optim="paged_adamw_8bit" if use_cuda else "adamw_torch",
        dataloader_pin_memory=False,
    )

    trainer = DPOTrainer(
        model=model,
        ref_model=None,
        peft_config=peft_config,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        processing_class=tokenizer,
        args=dpo_args,
    )

    logger.info(f"Starting DPO Preference fine-tuning (Beta: {args.dpo_beta}, Epochs: {args.epochs})...")
    trainer.train()

    logger.info(f"Saving DPO fine-tuned LoRA adapter to {args.output_dir}")
    trainer.model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    logger.info("✅ DPO preference fine-tuning completed successfully.")


# -----------------------------------------------------------------------------
# Main CLI Handler
# -----------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Gemma 2 / Gemma 3 Paradigm-Driven LoRA Fine-Tuning Utility",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--model_name",
        type=str,
        default="unsloth/gemma-2-2b-it",
        help="Base Gemma model repository ID on Hugging Face (default: 2B parameter low-memory)",
    )
    parser.add_argument(
        "--paradigm",
        type=str,
        default="clinical_cot",
        choices=[
            "clinical_cot",
            "fhir_extraction",
            "patient_tutor",
            "careplan_translation",
            "biophysical_telemetry",
            "webmcp_dispatch",
            "multiorgan_crosstalk",
            "hipaa_deidentification",
            "voice_disfluency",
            "clinical_safety_guard",
            "generative_ui_dispatch",
            "double_flip_ui_interlock",
            "dpo_epistemic_grounding",
            "ambient_scribe_soap",
            "pharmacogenomics_pgx",
            "circadian_chronodosing",
            "prior_auth_cms0057f",
            "tri_paradigm_synthesis",
            "rsna_imaging_vlm",
            "seo_medical_journalism",
            "voice_multimodal_live",
            "calgary_cambridge_intake",
            "fda_ftc_compliance_copywriter",
            "ambient_environmental_telemetry",
            "clinician_fatigue_adaptive_ui",
            "life_journey_sensory_path",
            "on_device_ismp_guard",
            "triage_acuity_routing",
            "multimodal_wound_derm_vision",
            "amazon_affiliate_egress_guard",
            "post_quantum_fhir_seal",
            "nih_medquad_qa",
            "who_mhgap_triage",
            "nih_clinicaltrials_protocol",
            "dynamic_precondition_guard",
            "cars_distractor_elimination",
            "aeromedical_evacuation_airway",
            "pediatric_complex_epsdt",
        ],
        help="Target clinical paradigm instruction format",
    )
    parser.add_argument(
        "--trainer_type",
        type=str,
        default="sft",
        choices=["sft", "dpo", "orpo"],
        help="Training mode: Supervised Fine-Tuning (sft), Direct Preference Optimization (dpo), or Odds Ratio Preference Optimization (orpo)",
    )
    parser.add_argument("--dpo_beta", type=float, default=0.1, help="DPO reference constraint beta (default: 0.1 for conservative regularization)")
    parser.add_argument("--dataset_path", type=str, default=None, help="Path to custom JSONL training dataset")
    parser.add_argument("--output_dir", type=str, default="./lora_gemma_adapter", help="Directory to save output weights")
    parser.add_argument("--r", type=int, default=16, help="LoRA rank parameter (use 8 or 16 for PEFT safety)")
    parser.add_argument("--alpha", type=int, default=32, help="LoRA alpha scaling parameter")
    parser.add_argument("--lora_dropout", type=float, default=0.05, help="LoRA dropout for anti-overfitting regularization")
    parser.add_argument(
        "--peft_mode",
        type=str,
        default="attention_only",
        choices=["attention_only", "all_linear"],
        help="Target modules: 'attention_only' (freezes MLP layers to prevent factual forgetting) or 'all_linear'",
    )
    parser.add_argument("--weight_decay", type=float, default=0.01, help="L2 weight decay for regularization")
    parser.add_argument("--val_split", type=float, default=0.15, help="Validation split ratio (0.0 to 0.3) to monitor overfitting")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--batch_size", type=int, default=1, help="Per-device train batch size (default: 1 for 8GB VRAM safety)")
    parser.add_argument("--grad_accum", type=int, default=8, help="Gradient accumulation steps")
    parser.add_argument("--epochs", type=int, default=2, help="Training epoch count (default: 2 to prevent memorization)")
    parser.add_argument("--max_steps", type=int, default=-1, help="Max training steps (-1 uses epochs)")
    parser.add_argument("--max_seq_length", type=int, default=1024, help="Maximum sequence token length (default: 1024 for low-VRAM)")
    parser.add_argument(
        "--cooldown_seconds",
        type=int,
        default=45,
        help="Seconds to pause for thermal cooling and memory garbage collection between steps/epochs",
    )
    parser.add_argument(
        "--cooldown_steps",
        type=int,
        default=15,
        help="Step frequency to trigger thermal cooling pauses",
    )
    parser.add_argument(
        "--low_mem",
        action="store_true",
        default=True,
        help="Enforce ultra low-VRAM guardrails (batch_size=1, grad_accum=8, paged_adamw_8bit, max_seq=1024)",
    )
    parser.add_argument(
        "--lemonade_url",
        type=str,
        default="http://localhost:13305/api/v1",
        help="Local Lemonade Server OpenAI API endpoint for evaluation and dataset distillation",
    )
    parser.add_argument(
        "--export_gguf",
        type=str,
        default=None,
        choices=["q4_k_m", "q8_0", "f16"],
        help="Export fine-tuned model to GGUF format (requires Unsloth)",
    )
    parser.add_argument(
        "--dry_run",
        action="store_true",
        help="Validate dataset formatting and token control alignment without initiating GPU training",
    )

    args = parser.parse_args()

    logger.info("=== Pocketgull Gemma Paradigm Fine-Tuner ===")
    logger.info(f"Selected Paradigm : {args.paradigm}")
    logger.info(f"Trainer Type      : {args.trainer_type.upper()}")
    logger.info(f"PEFT Mode         : {args.peft_mode}")
    logger.info(f"Target Base Model : {args.model_name}")

    # Load formatted dataset samples
    samples = load_dataset_for_paradigm(args.paradigm, args.dataset_path)
    logger.info(f"Loaded {len(samples)} training samples.")

    if args.dry_run:
        logger.info("--- DRY-RUN MODE: Sample Formatted Training Payload ---")
        if args.trainer_type in ["dpo", "orpo"] and "chosen" in samples[0]:
            print(f"[PROMPT]\n{samples[0].get('prompt')}")
            print(f"\n[CHOSEN (NIH/WHO Grounded)]\n{samples[0].get('chosen')}")
            print(f"\n[REJECTED (Ungrounded/Overclaimed)]\n{samples[0].get('rejected')}")
        else:
            print(samples[0].get("text", samples[0]))
        logger.info("Dry-run validation complete. Exiting cleanly.")
        return

    # Execute fine-tuning using selected trainer & available backend
    if args.trainer_type in ["dpo", "orpo"]:
        train_dpo_with_huggingface(args, samples)
    elif HAS_UNSLOTH:
        train_with_unsloth(args, samples)
    else:
        train_with_huggingface(args, samples)


if __name__ == "__main__":
    main()
