import { ClinicalFineTuningOrchestratorService } from './clinical-fine-tuning-orchestrator.service';

describe('ClinicalFineTuningOrchestratorService Suite', () => {
  let service: ClinicalFineTuningOrchestratorService;

  beforeEach(() => {
    service = new ClinicalFineTuningOrchestratorService();
  });

  it('should initialize with all 15 clinical and domain fine-tuning paradigms', () => {
    expect(service).toBeTruthy();
    expect(service.totalParadigms()).toBe(15);
    expect(service.paradigms().length).toBe(15);
  });

  it('should have default selected paradigm as dpo_epistemic_grounding', () => {
    expect(service.selectedParadigmId()).toBe('dpo_epistemic_grounding');
    expect(service.activeParadigm().name).toContain('DPO Epistemic Grounding');
    expect(service.activeParadigm().defaultTrainer).toBe('DPO');
  });

  it('should support dynamic precondition sentinel paradigm', () => {
    service.selectParadigm('dynamic_precondition_guard');
    expect(service.selectedParadigmId()).toBe('dynamic_precondition_guard');
    expect(service.activeParadigm().name).toContain('Dynamic Precondition Sentinel');
    expect(service.activeParadigm().category).toBe('Epistemic & Safety');
    expect(service.activeParadigm().defaultTrainer).toBe('DPO');
    expect(service.activeParadigm().sampleOutput).toContain('PRECONDITION_BREACHED_INVALIDATED');
  });

  it('should support CARS eliminative reasoning and anti-distractor guard paradigm', () => {
    service.selectParadigm('cars_distractor_elimination');
    expect(service.selectedParadigmId()).toBe('cars_distractor_elimination');
    expect(service.activeParadigm().name).toContain('CARS Eliminative Reasoning');
    expect(service.activeParadigm().category).toBe('Epistemic & Safety');
    expect(service.activeParadigm().defaultTrainer).toBe('DPO');
    expect(service.activeParadigm().sampleOutput).toContain('trapAudit');
    expect(service.activeParadigm().sampleOutput).toContain('ABSENCE_OF_EVIDENCE_IS_NOT_EVIDENCE_OF_ABSENCE');
  });

  it('should support aeromedical evacuation corridor and altitude hypoxia titration paradigm', () => {
    service.selectParadigm('aeromedical_evacuation_airway');
    expect(service.selectedParadigmId()).toBe('aeromedical_evacuation_airway');
    expect(service.activeParadigm().name).toContain('Aeromedical Evacuation Corridor');
    expect(service.activeParadigm().category).toBe('Specialty CDS');
    expect(service.activeParadigm().defaultTrainer).toBe('SFT');
    expect(service.activeParadigm().sampleOutput).toContain('reserveMarginMultiplier');
    expect(service.activeParadigm().sampleOutput).toContain('boylesLawGasExpansionPct');
  });

  it('should support pediatric complex care EPSDT prior authorization paradigm', () => {
    service.selectParadigm('pediatric_complex_epsdt');
    expect(service.selectedParadigmId()).toBe('pediatric_complex_epsdt');
    expect(service.activeParadigm().name).toContain('Pediatric Complex Care');
    expect(service.activeParadigm().category).toBe('Specialty CDS');
    expect(service.activeParadigm().sampleOutput).toContain('42 U.S.C. § 1396d(r)(5)');
    expect(service.activeParadigm().sampleOutput).toContain('T1000');
  });

  it('should support pocketgull.com SEO medical journalism paradigm', () => {
    service.selectParadigm('seo_medical_journalism');
    expect(service.selectedParadigmId()).toBe('seo_medical_journalism');
    expect(service.activeParadigm().targetDomain).toBe('pocketgull.com');
    expect(service.activeParadigm().category).toBe('Medical Journalism');
  });

  it('should support pocketgull.app live multimodal voice consult paradigm', () => {
    service.selectParadigm('voice_multimodal_live');
    expect(service.selectedParadigmId()).toBe('voice_multimodal_live');
    expect(service.activeParadigm().targetDomain).toBe('pocketgull.app');
    expect(service.activeParadigm().quantizationTarget).toContain('Q4_K_M');
  });

  it('should generate valid CLI command for training with appropriate flags', () => {
    const dpoCmd = service.generateCliCommand('dpo_epistemic_grounding');
    expect(dpoCmd).toContain('--paradigm dpo_epistemic_grounding');
    expect(dpoCmd).toContain('--trainer_type dpo');

    const edgeCmd = service.generateCliCommand('ambient_scribe_soap');
    expect(edgeCmd).toContain('--paradigm ambient_scribe_soap');
    expect(edgeCmd).toContain('--export_gguf q4_k_m');

    const carsCmd = service.generateCliCommand('cars_distractor_elimination');
    expect(carsCmd).toContain('--paradigm cars_distractor_elimination');
    expect(carsCmd).toContain('--trainer_type dpo');
  });

  it('should generate valid Vertex AI Model Garden upload, deploy, and model card manifests', () => {
    const uploadCmd = service.generateVertexModelGardenUploadCommand('pharmacogenomics_pgx');
    expect(uploadCmd).toContain('gcloud ai models upload');
    expect(uploadCmd).toContain('--project=gen-lang-client-0540208645');
    expect(uploadCmd).toContain('pocketgull-pharmacogenomics-pgx-gemma3-lora');

    const deployCmd = service.generateVertexEndpointDeployCommand('pharmacogenomics_pgx');
    expect(deployCmd).toContain('gcloud ai endpoints deploy-model');
    expect(deployCmd).toContain('--min-replica-count=0');

    const modelCard = service.generateVertexModelCardYaml('pharmacogenomics_pgx');
    expect(modelCard).toContain('GEARARTS / PocketGull Clinical Intelligence');
    expect(modelCard).toContain('zenodo_doi: "10.5281/zenodo.20647514"');
    expect(modelCard).toContain('npi: "1487569752"');
  });

  it('should export valid Gemini SFT dataset JSONL conforming to Vertex AI schema', () => {
    const sftJsonl = service.exportGeminiSftDatasetJsonl();
    const lines = sftJsonl.split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBe(15);

    const firstRecord = JSON.parse(lines[0]);
    expect(firstRecord.contents).toBeDefined();
    expect(firstRecord.contents.length).toBe(2);
    expect(firstRecord.contents[0].role).toBe('user');
    expect(firstRecord.contents[1].role).toBe('model');
    expect(firstRecord.contents[0].parts[0].text).toContain('[PARADIGM: DPO_EPISTEMIC_GROUNDING]');
  });

  it('should export valid Hugging Face DPO dataset JSONL with prompt, chosen, and rejected pairs', () => {
    const dpoJsonl = service.exportHuggingFaceDpoDatasetJsonl();
    const lines = dpoJsonl.split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBeGreaterThan(0);

    lines.forEach(line => {
      const rec = JSON.parse(line);
      expect(rec.prompt).toBeTruthy();
      expect(rec.chosen).toBeTruthy();
      expect(rec.rejected).toBeTruthy();
    });
  });
});
