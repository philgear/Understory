import { AnalysisLens } from './services/clinical-intelligence.service';

/**
 * Pre-baked clinical analysis for the demo patient: Sarah Jenkins.
 * Displayed in Demo Mode without requiring an API key call.
 *
 * NOTE: All special Unicode characters (<=, >=, ->, emoji, em/en dashes) are replaced
 * with ASCII equivalents to ensure correct rendering in the jsPDF export pipeline.
 */
export const DEMO_ANALYSIS_REPORT: Partial<Record<AnalysisLens, string>> = {
    'Summary Overview': `### Clinical Assessment
Sarah Jenkins is a 42-year-old female presenting with chronic lower back pain (L4-L5 radiculopathy), opioid use disorder in sustained remission, and co-morbid depression. The primary clinical challenge is multi-modal pain management that avoids opioid relapse risk while addressing the functional and psychological dimensions of her condition.

### Priority List
- **Opioid Relapse Prevention**: Highest-risk factor; pain management strategy must explicitly exclude opioid analgesics.
- **Chronic L4-L5 Radiculopathy**: Constant aching with left gluteal radiation, pain level 7/10. Worsens with prolonged standing.
- **Co-morbid Depression**: Active depression compounds pain tolerance and functional recovery; concurrent psychiatric management is essential.
- **Functional Deconditioning**: Pain-avoidance behavior likely contributing to progressive deconditioning.

### Plan of Care
- **Immediate**: Refer to a pain management specialist with expertise in non-opioid modalities. Initiate NSAID trial (e.g., naproxen 500mg BID with food) if no contraindications.
- **Short-Term**: Enroll in a structured physical therapy program focused on lumbar stabilization and McKenzie method exercises. Initiate CBT-based pain management (8-12 sessions).
- **Ongoing**: Maintain psychiatric follow-up for depression management. Consider duloxetine (SNRI) as it addresses both depression and neuropathic pain.

| Intervention | Target | Frequency |
|---|---|---|
| Physical Therapy | Lumbar stabilization | 2-3x/week x 8 weeks |
| CBT (Pain-focused) | Catastrophizing, coping | Weekly x 12 weeks |
| Duloxetine (discuss) | Depression + pain | Daily (psych-guided) |
| NSAID (naproxen) | Acute pain relief | BID with food, reassess at 4 weeks |

### Goals
- **Short-term (2 weeks)**: Pain VAS score reduction from 7/10 to <=5/10. PT program initiated.
- **Long-term (3 months)**: Functional ADL capacity restored to baseline. Sustained opioid abstinence maintained. PHQ-9 score reduced by >=5 points.

### References (UKRIO Compliant)
- **Dowell, D. et al.** (2022). *CDC Clinical Practice Guideline for Prescribing Opioids for Pain*. MMWR, 71(3), 1-95. DOI: [10.15585/mmwr.rr7103a1](https://doi.org/10.15585/mmwr.rr7103a1). Peer-Reviewed.`,

    'Functional Protocols': `### Diagnostic Workup
| Test | Rationale | Priority |
|---|---|---|
| Updated MRI lumbar spine | Confirm L4-L5 disc status, nerve root compression | High |
| PHQ-9 (depression screen) | Baseline severity score for treatment tracking | High |
| Basic metabolic panel | Pre-NSAID renal/hepatic safety check | Medium |
| DXA bone scan | Rule out osteoporosis contributing to pain | Low |

### Nutrition & Lifestyle
- **Anti-inflammatory diet**: Increase omega-3 fatty acid intake (oily fish, flaxseed). Reduce ultra-processed foods and refined sugars, which are associated with heightened systemic inflammation [Calder et al., 2017].
- **Maintain healthy weight**: Current BMI within normal range; avoid weight gain as it increases lumbar load.
- **Sleep hygiene**: Depression and pain both disrupt sleep architecture. Establish consistent sleep/wake schedule; limit screen time 1 hour before bed.
- **Alcohol avoidance**: Given OUD history, minimize all substance use including alcohol (CNS depressant with low relapse threshold overlap).
- **Standing workstation or ergonomic assessment**: Reduce time in provocative posture at work.

### Supplementation
| Supplement | Dose | Frequency | Rationale |
|---|---|---|---|
| Magnesium glycinate | 300-400mg | Nightly | Muscle relaxation, sleep support |
| Vitamin D3 + K2 | 2000 IU D3 / 100mcg K2 | Daily with fat | Bone health, pain modulation |
| Omega-3 (EPA/DHA) | 2g EPA+DHA | Daily with meal | Anti-inflammatory support |

### Movement & Rehabilitation
- **McKenzie Method (extension-biased exercises)**: Highly effective for L4-L5 disc pathology with peripheral symptoms. Begin with supervised sessions; transition to home program.
- **Core stabilization (McGill Big Three)**: Bird-dog, curl-up, side plank. Target deep spinal stabilizers without compressive loading.
- **Aquatherapy**: Low-impact option for acute flare periods; reduces joint load while maintaining cardiovascular function.
- **Avoid**: High-impact activities, heavy deadlifts, and prolonged flexion-dominant postures until PT-cleared.

### Mind-Body
- **Mindfulness-Based Stress Reduction (MBSR)**: 8-week structured program shown to reduce pain catastrophizing and improve depression scores in chronic pain populations.
- **Diaphragmatic breathing**: Activates parasympathetic nervous system, reducing pain perception threshold.`,

    'Monitoring & Follow-up': `### Immediate (24-72 hours)
- Confirm PT referral appointment scheduled within 1 week.
- Obtain baseline PHQ-9 depression score and document in chart.
- Verify no active opioid prescriptions from other providers (prescription drug monitoring check).
- Review NSAID for GI contraindications; prescribe PPI co-therapy if indicated.

### Short-Term (Week 1-2)
- PT intake session completed; home exercise program assigned.
- First CBT session scheduled.
- Follow-up call at Week 2 to assess NSAID tolerability and pain VAS score.
- Psychiatry/prescriber consultation for duloxetine initiation if patient amenable.

### Ongoing (Month 1-3)
| Parameter | Target | Frequency | Escalation Trigger |
|---|---|---|---|
| Pain VAS | <=5/10 | Monthly | Pain escalation >8/10 or new neurological symptoms |
| PHQ-9 Score | Reduction >=5 pts | Monthly | Score >15 or suicidal ideation -> urgent referral |
| PT Adherence | >=80% sessions attended | Bi-weekly check | <50% adherence -> reassess barriers |
| Opioid Abstinence | Sustained remission | Each visit | Any opioid use -> addiction medicine consult |
| Functional ADLs | Able to stand >20 min | Monthly | No improvement -> pain specialist referral |

### Red Flags
> WARNING: **Seek Immediate Clinical Attention if:**
> - New or worsening bilateral leg weakness or numbness
> - Bowel or bladder dysfunction (cauda equina syndrome)
> - Pain VAS 9-10/10 unresponsive to current regimen
> - Patient reports opioid cravings or use
> - PHQ-9 >=20 or active suicidal ideation`,

    'Patient Education': `### Understanding Your Condition
Your lower back pain is coming from the area between two vertebrae called L4 and L5, where a disc may be pressing on a nerve that runs down into your left leg and buttock. This is common and very manageable with the right combination of movement, mental health support, and non-opioid treatments.

### What Was Found
- **Chronic lower back pain (L4-L5 region)**: A persistent ache in your lower back that radiates into your left glute, rated 7 out of 10. It gets worse when you stand for long periods.
- **Opioid Use Disorder (in remission)**: You are doing great staying off opioids. Your care plan is specifically designed to manage pain without medications that could put your recovery at risk.
- **Depression**: Depression and chronic pain are closely linked - each makes the other worse. Treating both together gives you the best results.

### Current Plan
- **Physical Therapy**: You will work with a physical therapist on specific exercises to strengthen the muscles that support your spine, which takes pressure off the nerve.
- **Cognitive Behavioral Therapy (CBT)**: A type of talking therapy that helps change thought patterns around pain. Research shows it significantly reduces pain intensity and improves daily function.
- **Anti-inflammatory support**: Dietary changes and possibly a short course of anti-inflammatory medication to calm down the pain signals.
- **Duloxetine (to discuss with your care team)**: A medication that can help with both depression and nerve pain at the same time.

### Important Notes
> Note: **Please be aware of the following:**
> - Avoid lifting heavy objects or bending forward repeatedly until your physical therapist clears you.
> - If you develop weakness in both legs, or have trouble controlling your bladder or bowels, go to the emergency room immediately.
> - Your opioid-free status is a major health achievement. Let your care team know immediately if you experience cravings - this is not a failure, it is clinical information that helps us help you.`
};
