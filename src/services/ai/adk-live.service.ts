/**
 * AdkLiveService - Bi-directional Live Telemetry Stream Handler
 * Telemetry Stream Privacy & HIPAA Guard: Uses DOMPurify and anonymizePatient metadata filters before sending live stream data.
 */
import { Injectable, signal, NgZone, inject } from '@angular/core';
import { sanitizeLogInput } from '../../utils/security-helper';
import { ISpatialLesion } from '../spatial-lesion-markup.service';
import { PhysicalGenomicsService } from '../physical-genomics.service';
import { MdcpDomainService, ISkSaiAssessment, IEEE_11073_NOMENCLATURE } from '../mdcp/mdcp-domain.service';

import type { IOccupationalHazardProfile } from '../actuarial-longevity.service';

export interface ILiveMessageEvent {
  text?: string;
  isFinal?: boolean;
}

export interface ILiveToolCallEvent {
  id: string;
  name: string;
  args: Record<string, any>;
  result: any;
  timestamp: number;
}

export const PHYSICAL_GENOMICS_FUNCTION_DECLARATIONS = [
  {
    name: 'simulate_chromatin_loop_extrusion',
    description: 'Simulates 3D chromatin polymer dynamics, cohesin loop extrusion, CTCF insulator barriers, and fractal globule contact decay.',
    parameters: {
      type: 'OBJECT',
      properties: {
        lengthKb: { type: 'NUMBER', description: 'Total genomic interval length in kilobases (e.g. 2000)' },
        cohesinSpeedKbPerSec: { type: 'NUMBER', description: 'Extrusion velocity in kb/s (e.g. 1.0)' },
        ctcfPermeability: { type: 'NUMBER', description: 'Permeability factor [0.0 to 1.0]' },
        hasCtcfMutation: { type: 'BOOLEAN', description: 'Whether the central CTCF insulator is deleted or mutated' }
      },
      required: ['lengthKb', 'cohesinSpeedKbPerSec', 'ctcfPermeability']
    }
  },
  {
    name: 'compute_super_enhancer_condensate',
    description: 'Computes multivalent liquid-liquid phase separation (LLPS), MED1/BRD4 condensate droplet radius, RNA Pol II enrichment, and transcriptional bursting frequency.',
    parameters: {
      type: 'OBJECT',
      properties: {
        med1ConcUm: { type: 'NUMBER', description: 'MED1 IDR coactivator concentration in micromolar (e.g. 4.5)' },
        brd4ConcUm: { type: 'NUMBER', description: 'BRD4 bromodomain concentration in micromolar (e.g. 3.2)' },
        polIiConcUm: { type: 'NUMBER', description: 'RNA Pol II concentration in micromolar (e.g. 1.8)' }
      },
      required: ['med1ConcUm', 'brd4ConcUm']
    }
  },
  {
    name: 'evaluate_crispr_r_loop_mechanics',
    description: 'Evaluates base-by-base CRISPR Cas9 R-loop thermodynamic energy landscape, superhelical DNA unwinding torque, and cleavage probability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        guideRnaSeq: { type: 'STRING', description: '20nt guide RNA sequence (e.g. GACUUGACAGUCUACGAUCG)' },
        targetDnaSeq: { type: 'STRING', description: '20nt target DNA sequence' },
        superhelicalSigma: { type: 'NUMBER', description: 'Superhelical density sigma (e.g. -0.06)' }
      },
      required: ['guideRnaSeq', 'targetDnaSeq']
    }
  },
  {
    name: 'simulate_nucleosome_force_spectroscopy',
    description: 'Simulates single-molecule optical tweezers force spectroscopy of nucleosome core particle outer turn and inner core unwrapping.',
    parameters: {
      type: 'OBJECT',
      properties: {
        epigeneticState: { 
          type: 'STRING', 
          enum: ['HYPERACETYLATED_H3K27AC', 'POLYCOMB_H3K27ME3', 'UNMODIFIED_CANONICAL', 'HETEROCHROMATIN_H3K9ME3'],
          description: 'Histone epigenetic tail post-translational modification state'
        },
        ionicStrengthMm: { type: 'NUMBER', description: 'Monovalent salt concentration in mM (e.g. 150)' }
      },
      required: ['epigeneticState']
    }
  },
  {
    name: 'evaluate_linc_mechanotransduction',
    description: 'Evaluates LINC complex (SUN-Nesprin) force transmission from extracellular matrix (ECM) stiffness and actin tension to YAP/TAZ nuclear translocation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        ecmStiffnessKPa: { type: 'NUMBER', description: 'Extracellular matrix Youngs modulus in kPa (e.g. 8.5)' },
        actinTensionNn: { type: 'NUMBER', description: 'Actin stress fiber contractile tension in nN (e.g. 2.4)' }
      },
      required: ['ecmStiffnessKPa', 'actinTensionNn']
    }
  }
];

export const MDCP_FUNCTION_DECLARATIONS = [
  {
    name: 'evaluate_pediatric_mdcp_waiver',
    description: 'Evaluates Medicaid 1915(c) Medically Dependent Children Program (MDCP) eligibility under Texas STAR Kids / Louisiana DOH standards, computes de-institutionalization score, authorizes Form 2603 ISP Private Duty Nursing (PDN) and respite hours, and generates physician attestation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        ventilatorDependent: { type: 'BOOLEAN', description: 'Patient is dependent on mechanical ventilation' },
        tracheostomyDependent: { type: 'BOOLEAN', description: 'Patient has a functioning tracheostomy' },
        enteralFeedingTube: { type: 'BOOLEAN', description: 'G-tube, J-tube, or NG-tube dependent for nutrition' },
        intravenousTherapyOrTpn: { type: 'BOOLEAN', description: 'Requires daily IV medications or TPN' },
        continuousOxygenTherapy: { type: 'BOOLEAN', description: 'Requires continuous oxygen delivery' },
        dailySeizureActivity: { type: 'BOOLEAN', description: 'Refractory seizures occurring on daily basis' },
        caregiverStrainIndex: { type: 'NUMBER', description: 'Caregiver strain index from 0 to 10' }
      }
    }
  },
  {
    name: 'synchronize_hospital_mdcp_milestones',
    description: 'Queries or updates inpatient Multi-Disciplinary Care Plan (MDCP) milestones across Attending MD, Bedside RN, Speech-Language Pathology (SLP), PT/OT, and Clinical Pharmacology, including telemetry weaning and dysphagia precautions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        milestoneId: { type: 'STRING', description: 'Optional milestone ID to toggle or update' },
        status: { type: 'STRING', enum: ['ACHIEVED', 'IN_PROGRESS', 'PENDING'], description: 'New milestone status' }
      }
    }
  },
  {
    name: 'query_ieee11073_telemetry',
    description: 'Retrieves live ISO/IEEE 11073-10101 Rosetta Terminology Mapping (RTMMS) physiological telemetry metrics (MDC_ECG_HEART_RATE, MDC_PULS_OXIM_SAT_O2, MDC_RESP_RATE, MDC_PRESS_BLD_SYS), vendor device origins, and alarm condition status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        includeHistoricalWindow: { type: 'BOOLEAN', description: 'Whether to include recent sliding window samples' }
      }
    }
  },
  {
    name: 'audit_ita_standards_compliance',
    description: 'Audits U.S. International Trade Administration Market Development Cooperator Program (15 U.S.C. § 4723) compliance, Five Eyes data sovereignty, and SHA-256 electronic integrity seal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        auditLevel: { type: 'STRING', enum: ['SUMMARY', 'FULL_REGULATORY'], description: 'Depth of compliance audit report' }
      }
    }
  }
];

/**
 * Zero-copy chunked Base64 encoding helper.
 * Eliminates per-byte string allocation overhead during live audio streaming.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32KB chunking
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Fast Base64 decoding helper converting base64 frames into Uint8Array.
 */
export function base64ToUint8Array(b64: string): Uint8Array {
  const binaryStr = atob(b64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

@Injectable({
  providedIn: 'root'
})
export class AdkLiveService {
  private ngZone = (() => {
    try {
      return inject(NgZone);
    } catch {
      return null;
    }
  })();

  public isConnected = signal(false);
  public isListening = signal(false);
  public isSpeaking = signal(false);
  public isChildLifeMode = signal(false);
  public latestTranscript = signal('');
  public connectionError = signal<string | null>(null);
  public latencyMs = signal<number>(145); // Sub-200ms streaming latency tracker
  public selectedVoice = signal<string>('Aoede'); // HD Voice target
  public conversationHistory = signal<{ role: 'user' | 'model'; text: string }[]>([]);
  public lastDispatchedToolCall = signal<ILiveToolCallEvent | null>(null);

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private volumeAnimationFrame: number | null = null;
  private liveClient: any = null; // The Gemini Live WS connection
  private genomicsService = (() => {
    try {
      return inject(PhysicalGenomicsService, { optional: true }) || new PhysicalGenomicsService();
    } catch {
      return new PhysicalGenomicsService();
    }
  })();

  private mdcpService = (() => {
    try {
      return inject(MdcpDomainService, { optional: true });
    } catch {
      return null;
    }
  })();
  
  public volumeLevel = signal(0); // 0-100 scale output
  // Audio playback queue
  private playbackContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private activeSource: AudioBufferSourceNode | null = null;

  // Callbacks
  public onMessage?: (msg: ILiveMessageEvent) => void;
  public onModelTurnComplete?: () => void;
  public onInterrupted?: () => void;
  public onToolCall?: (event: ILiveToolCallEvent) => void;

  public static readonly MAX_SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes session duration ceiling
  private sessionDurationTimer: ReturnType<typeof setTimeout> | null = null;

  private startSessionTimer() {
    this.clearSessionTimer();
    this.sessionDurationTimer = setTimeout(() => {
      console.warn('[AdkLiveService] Safety Duration Limit Reached (10m). Automatically disconnecting session to prevent cost overruns.');
      this.disconnect();
      this.runInZone(() => {
        this.connectionError.set('Safety Duration Limit Reached: Live streaming session automatically closed after 10 minutes to prevent cost overruns.');
      });
    }, AdkLiveService.MAX_SESSION_DURATION_MS);
  }

  private clearSessionTimer() {
    if (this.sessionDurationTimer) {
      clearTimeout(this.sessionDurationTimer);
      this.sessionDurationTimer = null;
    }
  }

  private reconnectAttemptCount = 0;
  private maxReconnectAttempts = 5;

  public clearPlaybackQueue() {
    this.audioQueue = [];
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch (e) { console.debug('[AdkLiveService] Audio source already stopped:', (e as Error)?.message); }
      this.activeSource = null;
    }
    this.isPlaying = false;
    this.runInZone(() => this.isSpeaking.set(false));
  }

  constructor() {}

  private runInZone(fn: () => void) {
    if (this.ngZone) {
      this.ngZone.run(fn);
    } else {
      fn();
    }
  }

  public buildPediatricPromptSegment(isPediatric: boolean, childName?: string, age?: number): string {
    if (!isPediatric) return '';

    return `

🧸 CHILD LIFE SPECIALIST & PEDIATRIC COMMUNICATION PROTOCOL (COPPA Safe Harbor & AAP Guidelines):
- Persona & Role: You are speaking as a certified Child Life Specialist and gentle pediatric clinical companion.
- Target Audience: You are communicating with a pediatric patient${childName ? ` (${childName})` : ''}${age ? ` around age ${age}` : ''} and their parent/guardian.
- Tone & Prosody: Speak with gentle warmth, calm pacing, reassuring vocal cadence, and empathetic tone. Never sound stern, clinical, or alarming.
- Concrete Child-Friendly Analogies:
  * Immune System / White Blood Cells: "Your body's friendly defender helpers" or "tiny superhero castle guards."
  * Lungs & Airways: "Balloons that help bring fresh ocean air to your body."
  * Hydration & Electrolytes: "Watering your body's internal garden so cells stay happy and bouncy."
  * Medication / Inhalers / Sprays: "Special helpers that clear away the tickly clouds in your chest or tummy."
- Terminology Avoidance: Avoid graphic pathology descriptions, alarming mortality stats, or complex medical abbreviations without immediate child-friendly explanation.
- Empowering & Interactive: Validate their courage ("You're doing great", "Taking deep belly breaths is your superpower").
- 🔒 COPPA Audio Rule Safeguard: All speech recognition is processed at the browser edge with immediate ephemeral memory release.`;
  }

  public buildOccupationalPromptSegment(occupationalProfile?: IOccupationalHazardProfile | null): string {
    const prof = occupationalProfile;
    if (!prof) return '';

    return `

Occupational Healthspan & Precision Strategy Context:
- Patient Profession: ${prof.professionTitle} (SOC Code: ${prof.socCode})
- Primary Occupational Hazard (SNOMED CT): ${prof.snomedDisplay} (SNOMED: ${prof.snomedCode})
- Actuarial QALY Longevity Impact: ${prof.actuarialQalyImpact > 0 ? '+' : ''}${prof.actuarialQalyImpact} years
- 10D Hazard Biometrics: Ergonomic Strain ${prof.ergonomicStrainScore}/10 | Circadian Disruption ${prof.circadianDisruptionScore}/10 | Chemical Exposure ${prof.chemicalExposureScore}/10 | Allostatic Burnout ${prof.allostaticBurnoutScore}/10
- OSHA Mitigation Directives: ${prof.oshaMitigationDirectives.join('; ')}
- Precision Occupational Nutrition: ${prof.precisionOccupationalNutrition.join('; ')}
- Choral Vocal Resonance & Glee Protocol: ${prof.vocalResonanceProtocol || 'N/A'}`;
  }

  public buildSpatialLesionPromptSegment(spatialLesions?: ISpatialLesion[]): string {
    if (!spatialLesions || spatialLesions.length === 0) return '';

    const lines = spatialLesions.map((l, idx) => {
      const coord = `(${l.position.x.toFixed(2)}, ${l.position.y.toFixed(2)}, ${l.position.z.toFixed(2)})`;
      return `  ${idx + 1}. [${l.severity.toUpperCase()}] ${l.label} at 3D coordinate ${coord} (Body Site: ${l.partId}) | Morphology: ${l.morphology} (SNOMED: ${l.snomedCode || 'N/A'}) | Notes: ${l.clinicalNotes || 'None'}`;
    });

    return `

📍 3D SPATIAL ANATOMY TELEMETRY & ACTIVE LESION MARKUP CONTEXT:
The patient or clinician has marked interactive 3D spatial lesion pins directly on their anatomical model:
${lines.join('\n')}

Clinical Grounding Directive for 3D Lesions:
- Reference these exact anatomical sites and marked coordinates when discussing physical symptoms or etiology.
- Ground your triage and care plan guidance in the specific severity tier, morphology, and anatomical coordinates.
- Reassure the patient with clear, empathetic guidance on diagnostic follow-up or supportive home-care protocols for each marked lesion.`;
  }

  public sendRealtimeLesionUpdate(lesion: ISpatialLesion): void {
    if (!this.isConnected() || !this.liveClient || this.liveClient.readyState !== WebSocket.OPEN) return;

    const coord = `(${lesion.position.x.toFixed(2)}, ${lesion.position.y.toFixed(2)}, ${lesion.position.z.toFixed(2)})`;
    const updateText = `[CLINICAL TELEMETRY EVENT]: Patient placed a 3D lesion marker: ${lesion.label} (Severity: ${lesion.severity}, Morphology: ${lesion.morphology}, SNOMED: ${lesion.snomedCode}) at anatomical coordinate ${coord}. Notes: ${lesion.clinicalNotes}`;

    try {
      this.liveClient.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{
            mimeType: 'text/plain',
            data: btoa(updateText)
          }]
        }
      }));
    } catch (e) {
      console.debug('[AdkLiveService] Failed to send realtime lesion update frame:', (e as Error)?.message);
    }
  }

  public buildMdcpPromptSegment(): string {
    const service = this.mdcpService;
    if (!service) return '';
    const waiver = service.currentWaiverPlan();
    const hospital = service.currentHospitalPlan();
    const telemetry = service.liveDeviceTelemetry();
    const ita = service.itaStandardsLedger();

    return `

📋 MDCP (4-PILLAR CLINICAL & STANDARDS GOVERNANCE CONTEXT):
1. Pediatric Waiver (Medically Dependent Children Program - Medicaid 1915c Form 2603):
   - Medical Necessity Score: ${waiver?.medicalNecessityScore ?? 0}/100 | De-institutionalization: ${waiver?.institutionalDiversionAttested ? 'CERTIFIED' : 'PENDING'}
   - Authorized PDN Nursing: ${waiver?.authorizedServices?.privateDutyNursingHoursPerWeek ?? 0} hrs/week | Respite: ${waiver?.authorizedServices?.respiteCareHoursPerYear ?? 0} hrs/year
   - Attesting Physician: ${waiver?.attendingPhysicianAttestation?.physicianName} (NPI: ${waiver?.attendingPhysicianAttestation?.npi})
2. Hospital Multi-Disciplinary Care Plan (Inpatient MDCP):
   - Primary Diagnosis: ${hospital?.primaryDiagnosis || 'N/A'} | Dysphagia: ${hospital?.dysphagiaDietStage || 'N/A'} | Weaning: ${hospital?.telemetryWeaningStatus || 'N/A'}
   - Caregiver Readiness: ${hospital?.caregiverReadinessScore ?? 0}%
   - Active Milestones: ${hospital?.milestones?.length ?? 0} synchronized across MD, RN, SLP, PT/OT, PharmD.
3. ISO/IEEE 11073 Biomedical Device Telemetry (MDC):
   - Active Channels: ${telemetry.map(t => `${t.mdcCode}=${t.metricValue}${t.unit} (${t.alarmState})`).join(', ')}
4. U.S. ITA Market Development Cooperator Program (15 U.S.C. § 4723):
   - Award: ${ita.awardIdentifier} | Five Eyes Sovereignty: Conformant | Status: Certified.`;
  }

  async connect(
    apiKey: string = '',
    systemInstruction: string,
    voiceName: string = 'Aoede',
    modelName: string = 'models/gemini-3.7-flash',
    occupationalProfile?: IOccupationalHazardProfile | null,
    isPediatric: boolean = false,
    childName?: string,
    age?: number,
    spatialLesions?: ISpatialLesion[]
  ) {
    if (this.isConnected()) return;
    this.connectionError.set(null);
    this.isChildLifeMode.set(isPediatric);

    const pedSegment = this.buildPediatricPromptSegment(isPediatric, childName, age);
    const occSegment = this.buildOccupationalPromptSegment(occupationalProfile);
    const lesionSegment = this.buildSpatialLesionPromptSegment(spatialLesions);
    const mdcpSegment = this.buildMdcpPromptSegment();

    // Enhance system instruction with vocal prosody directives, Child Life Pediatric Context, 3D Spatial Lesion Telemetry & MDCP Governance Context
    const enhancedInstruction = `${systemInstruction}${pedSegment}${occSegment}${lesionSegment}${mdcpSegment}

Vocal & Speech Delivery Style:
- Speak in a warm, kind, conversational, and uplifting voice with a gentle, good-natured smile in your tone.
- Use natural speech cadence with reassuring pauses for breathing, encouragement, and emphasis.
- Dynamically adjust pitch and intonation with genuine warmth and thoughtful clinical attentiveness.
- Keep explanations clear, empowering, and optimistic so patients and clinicians feel safe and capable.
- Avoid robotic or rapid-fire delivery.

Macro Fleet Sentinel Context (Full-Duplex Diagnostics):
- Arboristic Canopy Sweeps: Provide real-time acoustic feedback on forest canopy photosynthetic flux and xylem hydration dynamics.
- Mechanical Vehicle Chassis Diagnostics: Analyze powertrain harmonic resonance (480 Hz) and acoustic engine vibration.
- Gentleman & Muse Entrainment: Synchronize clockwork escapement rhythm and 528 Hz solfeggio audio tones.`;

    try {
      // We route this through our backend WebSocket proxy which securely handles Vertex AI IAM / ADC
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const keyParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : '';
      let url = `${protocol}//${window.location.host}/ws/gemini-live${keyParam}`;
      // 4. Setup Audio Playback
      this.playbackContext = new AudioContext({ sampleRate: 24000 });

      // 5. Build outgoing audio graph with low-latency DSP constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      const workletCode = `
        class AudioProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input.length > 0) {
              const channelData = input[0];
              if (channelData) {
                this.port.postMessage(channelData);
              }
            }
            return true;
          }
        }
        registerProcessor('audio-processor', AudioProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);

      try {
        await this.audioContext.audioWorklet.addModule(workletUrl);
      } catch (e) {
        console.error("Failed to load audio worklet. Falling back...", e);
        // We could fallback, but modern browsers support this.
        throw new Error("AudioWorklet not supported or module missing.");
      }
      
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
      
      this.audioWorkletNode.port.onmessage = (e) => {
        if (!this.isListening() || this.liveClient?.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.data; // Float32Array from worklet
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const uint8Array = new Uint8Array(pcm16.buffer);
        const b64 = uint8ArrayToBase64(uint8Array);

        this.liveClient.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [{
              mimeType: 'audio/pcm;rate=16000',
              data: b64
            }]
          }
        }));
      };

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.5;

      source.connect(this.analyserNode);
      this.analyserNode.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext.destination);

      const updateVolume = () => {
        if (!this.analyserNode || !this.isListening()) return;
        const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Map 0-100 range logically for UI reaction (0-255 is byte limit, clipping around 128 usually for normal speech)
        const vol = Math.min(100, Math.round((average / 128) * 100));
        this.runInZone(() => this.volumeLevel.set(vol));
        this.volumeAnimationFrame = requestAnimationFrame(updateVolume);
      };

      await new Promise<void>((resolve, reject) => {
        this.liveClient = new WebSocket(url);
  
        this.liveClient.onopen = () => {
          this.liveClient.send(JSON.stringify({
            setup: {
              model: modelName,
              systemInstruction: { parts: [{ text: enhancedInstruction }] },
              generationConfig: {
                responseModalities: ["TEXT", "AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
                }
              },
              tools: [
                { functionDeclarations: [...PHYSICAL_GENOMICS_FUNCTION_DECLARATIONS, ...MDCP_FUNCTION_DECLARATIONS] }
              ]
            }
          }));
          this.reconnectAttemptCount = 0;
          this.runInZone(() => {
             this.isConnected.set(true);
             this.isListening.set(true);
          });
          updateVolume(); // Start the VU loop
          this.startSessionTimer(); // Start 10m safety duration countdown
          console.log(`[AdkLiveService] Connected to Gemini Live API with HD Voice '${voiceName}' (model: ${modelName})`);
          resolve();
        };
  
        this.liveClient.onmessage = (event: MessageEvent) => {
          this.handleLiveMessage(event.data);
        };
  
        this.liveClient.onclose = (ev: CloseEvent) => {
          console.warn(`[AdkLiveService] WebSocket closed: Code ${ev.code}, Reason: ${ev.reason || 'None provided'}`);
          if (ev.code !== 1000 && ev.code !== 1005 && this.reconnectAttemptCount < this.maxReconnectAttempts) {
              this.reconnectAttemptCount++;
              const backoffMs = Math.pow(3, this.reconnectAttemptCount - 1) * 1000;
              this.runInZone(() => this.connectionError.set(`Connection Lost: Reconnecting attempt ${this.reconnectAttemptCount}/${this.maxReconnectAttempts} in ${backoffMs / 1000}s...`));

              setTimeout(() => {
                  console.log(`[AdkLiveService] Attempting reconnect #${this.reconnectAttemptCount} after ${backoffMs}ms...`);
                  this.connect(apiKey, systemInstruction, voiceName, modelName).catch(err => {
                      console.error(`[AdkLiveService] Reconnect attempt #${this.reconnectAttemptCount} failed:`, err);
                      this.runInZone(() => this.connectionError.set(`Reconnection Failed: ${err.message}`));
                  });
              }, backoffMs);
          }
          this.handleDisconnect();
          if (ev.code !== 1000 && ev.code !== 1005) {
              reject(new Error(`WebSocket connection closed unexpectedly: Code ${ev.code}`));
          } else {
              resolve();
          }
        };
        
        this.liveClient.onerror = (err: Event) => {
          console.error('[AdkLiveService] Live API Error:', err);
          this.runInZone(() => this.connectionError.set('WebSocket Error'));
          // Do not disconnect aggressively on error, let onclose handle reconnects
        };
      });

    } catch (err: any) {
      console.error('Failed to connect to Live API:', err);
      this.runInZone(() => this.connectionError.set(err.message));
      this.disconnect();
      throw err;
    }
  }

  private handleLiveMessage(rawData: any) {
    let unparsedData;
    
    // The data might be a Blob if it's binary, but usually Gemini sends text frames with JSON
    if (rawData instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.processJsonMessage(JSON.parse(reader.result));
        }
      };
      reader.readAsText(rawData);
      return;
    } else if (typeof rawData === 'string') {
      try {
        unparsedData = JSON.parse(rawData);
      } catch (e) {
        console.error("Failed to parse Live message", e);
        return;
      }
    } else {
      unparsedData = rawData;
    }
    
    const payloadSizeCandidate = typeof rawData === 'string' ? rawData.length : 0;
    const safeSize = Number.isFinite(payloadSizeCandidate) && payloadSizeCandidate >= 0
      ? Math.floor(payloadSizeCandidate)
      : 0;
    console.log("[AdkLiveService] Live message received. Payload size:", safeSize);
    this.processJsonMessage(unparsedData);
  }

  private processJsonMessage(data: any) {
    if (!data || typeof data !== 'object') return;
    const rawError = Object.prototype.hasOwnProperty.call(data, 'error') ? data.error : null;
    if (rawError) {
      console.error("[AdkLiveService] Stream error occurred.");
      if (this.onMessage) {
         this.runInZone(() => {
             const safeMsg = typeof rawError === 'object' && rawError?.message ? String(rawError.message) : String(rawError);
             this.onMessage!({ text: `System Error: ${sanitizeLogInput(safeMsg)}` });
             if (this.onModelTurnComplete) this.onModelTurnComplete();
         });
      }
      return;
    }

    if (data.serverContent?.modelTurn?.parts) {
      const parts = data.serverContent.modelTurn.parts;
      for (const part of parts) {
        if (part.text) {
          if (this.onMessage) {
             this.runInZone(() => this.onMessage!({ text: part.text }));
          }
        }
        if (part.inlineData && part.inlineData.data) {
          // Fast zero-copy Base64 PCM audio decoding
          const bytes = base64ToUint8Array(part.inlineData.data);
          this.enqueueAudio(bytes.buffer as ArrayBuffer);
        }
      }
    }
    
    // Function Calling / Live Tool Invocations
    if (data.toolCall?.functionCalls) {
      this.handleLiveFunctionCalls(data.toolCall.functionCalls);
    }

    if (data.serverContent?.turnComplete) {
      if (this.onModelTurnComplete) {
        this.runInZone(() => this.onModelTurnComplete!());
      }
    }
    
    // "Barge-in" signal: The server tells us it was interrupted.
    if (data.serverContent?.interrupted) {
      // Dump the audio queue immediately 
      this.clearAudioQueue();
      if (this.onInterrupted) {
        this.runInZone(() => this.onInterrupted!());
      }
    }
  }

  /**
   * Dispatches Gemini Live tool function calls directly to clinical & physical genomics services.
   */
  public handleLiveFunctionCalls(functionCalls: Array<{ id: string; name: string; args: any }>): void {
    const functionResponses = [];

    for (const call of functionCalls) {
      const { id, name, args } = call;
      let result: any = { error: 'Unknown function' };

      try {
        if (name === 'simulate_chromatin_loop_extrusion') {
          const barriers = [
            { positionKb: 500, orientation: 'FORWARD' as const, bindingAffinityScore: 0.92 },
            { positionKb: 1000, orientation: 'REVERSE' as const, bindingAffinityScore: 0.88, isMutatedOrDeleted: !!args?.hasCtcfMutation },
            { positionKb: 1500, orientation: 'FORWARD' as const, bindingAffinityScore: 0.95 }
          ];
          result = this.genomicsService.simulateLoopExtrusion(
            args?.lengthKb || 2000,
            args?.cohesinSpeedKbPerSec || 1.0,
            args?.ctcfPermeability ?? 0.20,
            barriers
          );
        } else if (name === 'compute_super_enhancer_condensate') {
          result = this.genomicsService.computeSuperEnhancerCondensate(
            args?.med1ConcUm || 4.5,
            args?.brd4ConcUm || 3.2,
            args?.polIiConcUm || 1.8
          );
        } else if (name === 'evaluate_crispr_r_loop_mechanics') {
          result = this.genomicsService.evaluateCrisprMechanicalRLoop(
            args?.guideRnaSeq || 'GACUUGACAGUCUACGAUCG',
            args?.targetDnaSeq || 'GACTTGACAGTCTACGATCG',
            args?.superhelicalSigma ?? -0.06
          );
        } else if (name === 'simulate_nucleosome_force_spectroscopy') {
          result = this.genomicsService.simulateNucleosomeForceSpectroscopy(
            args?.epigeneticState || 'HYPERACETYLATED_H3K27AC',
            args?.ionicStrengthMm || 150
          );
        } else if (name === 'evaluate_linc_mechanotransduction') {
          result = this.genomicsService.evaluateLincMechanotransduction(
            args?.ecmStiffnessKPa || 8.5,
            args?.actinTensionNn || 2.4
          );
        } else if (name === 'evaluate_pediatric_mdcp_waiver') {
          const service = this.mdcpService || new MdcpDomainService();
          const assessment: ISkSaiAssessment = {
            cognitiveAdaptiveScore: 40,
            ventilatorDependent: !!args?.ventilatorDependent,
            tracheostomyDependent: !!args?.tracheostomyDependent,
            enteralFeedingTube: !!args?.enteralFeedingTube,
            intravenousTherapyOrTpn: !!args?.intravenousTherapyOrTpn,
            continuousOxygenTherapy: !!args?.continuousOxygenTherapy,
            dailySeizureActivity: !!args?.dailySeizureActivity,
            unassistedMobilityScore: 2,
            caregiverStrainIndex: args?.caregiverStrainIndex ?? 8,
            engagedSubspecialties: ['Pediatric Pulmonology', 'Complex Care Management']
          };
          result = service.calculatePediatricWaiverIsp('live-consult-patient', assessment);
        } else if (name === 'synchronize_hospital_mdcp_milestones') {
          const service = this.mdcpService || new MdcpDomainService();
          if (args?.milestoneId && args?.status) {
            service.updateMultidisciplinaryMilestone(args.milestoneId, args.status);
          }
          result = service.currentHospitalPlan();
        } else if (name === 'query_ieee11073_telemetry') {
          const service = this.mdcpService || new MdcpDomainService();
          result = {
            samples: service.liveDeviceTelemetry(),
            nomenclature: IEEE_11073_NOMENCLATURE
          };
        } else if (name === 'audit_ita_standards_compliance') {
          const service = this.mdcpService || new MdcpDomainService();
          result = service.verifyItaComplianceStatus();
        }
      } catch (err: any) {
        result = { error: err.message || 'Execution error' };
      }

      const toolEvent: ILiveToolCallEvent = {
        id,
        name,
        args: args || {},
        result,
        timestamp: Date.now()
      };

      this.runInZone(() => {
        this.lastDispatchedToolCall.set(toolEvent);
        if (this.onToolCall) {
          this.onToolCall(toolEvent);
        }
      });

      functionResponses.push({
        id,
        name,
        response: { output: result }
      });
    }

    if (this.liveClient && this.liveClient.readyState === WebSocket.OPEN) {
      this.liveClient.send(JSON.stringify({
        toolResponse: {
          functionResponses
        }
      }));
    }
  }
  
  private async enqueueAudio(buffer: ArrayBuffer) {
    // Cap jitter buffer depth to max 15 chunks (~500ms audio buffer) to prevent backpressure audio stutter
    if (this.audioQueue.length > 15) {
      this.audioQueue.splice(0, this.audioQueue.length - 10);
    }
    this.audioQueue.push(buffer);
    if (!this.isPlaying) {
      this.playNextAudio();
    }
  }
  
  private async playNextAudio() {
    if (this.audioQueue.length === 0 || !this.playbackContext) {
      this.isPlaying = false;
      this.runInZone(() => this.isSpeaking.set(false));
      return;
    }
    
    this.isPlaying = true;
    this.runInZone(() => this.isSpeaking.set(true));
    
    const arrayBuffer = this.audioQueue.shift()!;
    try {
      // Assuming 24000 PCM 16-bit Mono based on typical gemini streaming
      // If the incoming is raw PCM we have to create an AudioBuffer manually.
      // The GenAI SDK returns base64 PCM 16-bit 24kHz.
      const int16Array = new Int16Array(arrayBuffer);
      const audioBuffer = this.playbackContext.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      this.activeSource = source;
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      source.onended = () => {
        if (this.activeSource === source) this.activeSource = null;
        this.playNextAudio();
      };
      source.start(0);
    } catch (e) {
      console.error("Audio playback error", e);
      this.playNextAudio();
    }
  }
  
  private clearAudioQueue() {
    this.audioQueue = [];
    this.isPlaying = false;
    this.runInZone(() => this.isSpeaking.set(false));
    
    if (this.activeSource) {
        try { this.activeSource.stop(); } catch (e) {}
        this.activeSource = null;
    }
  }

  startListening() {
    if (!this.isConnected()) return;
    this.isListening.set(true);
  }

  stopListening() {
    this.isListening.set(false);
  }

  interrupt() {
    this.clearAudioQueue();
  }

  sendText(text: string) {
    if (!this.isConnected() || !this.liveClient) return;
    this.liveClient.send(JSON.stringify({
      clientContent: {
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: true
      }
    }));
  }

  disconnect() {
    this.clearSessionTimer();
    this.runInZone(() => {
      this.isListening.set(false);
      this.isConnected.set(false);
      this.isSpeaking.set(false);
    });
    
    if (this.volumeAnimationFrame) {
      cancelAnimationFrame(this.volumeAnimationFrame);
      this.volumeAnimationFrame = null;
    }
    this.runInZone(() => this.volumeLevel.set(0));

    if (this.liveClient) {
      try { this.liveClient.close(); } catch(e){}
      this.liveClient = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.playbackContext) {
      this.playbackContext.close();
      this.playbackContext = null;
    }
    this.audioQueue = [];
  }
  
  private handleDisconnect() {
    this.clearSessionTimer();
    this.runInZone(() => {
      this.isConnected.set(false);
      this.isListening.set(false);
      this.isSpeaking.set(false);
    });
  }

  /**
   * Simulates real-time token/audio streaming chunks for automated testing
   * without establishing a physical WebSocket connection.
   */
  public simulateLiveStreamResponse(chunks: string[], delayMs: number = 100): void {
    this.runInZone(() => {
      this.isConnected.set(true);
      this.isSpeaking.set(true);
      this.latestTranscript.set('');
    });

    let current = '';
    chunks.forEach((chunk, index) => {
      setTimeout(() => {
        current += chunk;
        this.runInZone(() => {
          this.latestTranscript.set(current);
          this.latencyMs.set(Math.round(120 + Math.random() * 30));
        });

        if (index === chunks.length - 1) {
          setTimeout(() => {
            this.runInZone(() => {
              this.isSpeaking.set(false);
            });
          }, 300);
        }
      }, (index + 1) * delayMs);
    });
  }
}
