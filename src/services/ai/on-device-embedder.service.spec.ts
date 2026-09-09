import { OnDeviceEmbedderService } from './on-device-embedder.service';

describe('OnDeviceEmbedderService', () => {
  let service: OnDeviceEmbedderService;

  beforeEach(() => {
    service = new OnDeviceEmbedderService();
  });

  it('1. Computes deterministic fallback vector when native API is absent', async () => {
    const vec1 = await service.computeEmbedding('Cardiovascular arrhythmia palpitations');
    expect(vec1).toBeInstanceOf(Float32Array);
    expect(vec1.length).toBe(256);

    // Magnitude should be normalized to ~1.0
    let norm = 0;
    for (let i = 0; i < vec1.length; i++) {
      norm += vec1[i] * vec1[i];
    }
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 3);
  });

  it('2. Computes accurate cosine similarity for identical and orthogonal inputs', async () => {
    const vecA = new Float32Array([1, 0, 0]);
    const vecB = new Float32Array([1, 0, 0]);
    const vecC = new Float32Array([0, 1, 0]);

    expect(service.cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 4);
    expect(service.cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 4);
  });

  it('3. Finds top semantic matches correctly among clinical candidates', async () => {
    const candidates = [
      { id: 'I48.91', text: 'Unspecified atrial fibrillation' },
      { id: 'J45.909', text: 'Unspecified asthma uncomplicated' },
      { id: 'M54.5', text: 'Low back pain lumbar spine' }
    ];

    const results = await service.findTopMatches('Atrial fibrillation heart flutter', candidates, 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('I48.91');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('4. Handles empty candidates gracefully', async () => {
    const results = await service.findTopMatches('Headache', [], 5);
    expect(results).toEqual([]);
  });

  it('5. Computes BM25 lexical score correctly for clinical terms', () => {
    const queryTokens = ['pediatric', 'waiver', 'mdcp'];
    const docTokens = ['pediatric', 'waiver', 'program', 'form', '2603', 'mdcp'];
    const docFreq = new Map<string, number>([['pediatric', 1], ['waiver', 1], ['mdcp', 1]]);
    const score = service.computeBm25Score(queryTokens, docTokens, 6, 1, docFreq);
    expect(score).toBeGreaterThan(0);
  });

  it('6. Performs hybrid BM25 + dense RRF reranking accurately', async () => {
    const candidates = [
      { id: 'CAND_1', text: 'Pediatric MDCP waiver authorization Form 2603 PDN hours' },
      { id: 'CAND_2', text: 'Adult lumbar spine radiculopathy nerve compression' },
      { id: 'CAND_3', text: 'Cardiac telemetry arrhythmia atrial flutter' }
    ];

    const results = await service.findTopHybridMatches('MDCP pediatric waiver', candidates, 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('CAND_1');
    expect(results[0].hybridRrfScore).toBeGreaterThan(results[1].hybridRrfScore);
    expect(results[0].denseRank).toBe(1);
    expect(results[0].bm25Rank).toBe(1);
  });

  it('7. Quantizes Float32 vectors to Int8 (75% memory drop) and dequantizes accurately', () => {
    const original = new Float32Array([0.8, -0.4, 0.0, 0.25, -0.95]);
    const quantized = service.quantizeToInt8(original);

    expect(quantized.data).toBeInstanceOf(Int8Array);
    expect(quantized.data.byteLength).toBe(5); // 5 bytes vs 20 bytes Float32
    expect(quantized.scale).toBeCloseTo(0.95, 2);

    const dequantized = service.dequantizeFromInt8(quantized);
    for (let i = 0; i < original.length; i++) {
      expect(dequantized[i]).toBeCloseTo(original[i], 1);
    }
  });

  it('8. Computes quantized cosine similarity in integer space with high fidelity', () => {
    const vecA = new Float32Array([0.6, 0.8, 0.0]);
    const vecB = new Float32Array([0.6, 0.8, 0.0]);
    const vecC = new Float32Array([0.0, 0.0, 1.0]);

    const qA = service.quantizeToInt8(vecA);
    const qB = service.quantizeToInt8(vecB);
    const qC = service.quantizeToInt8(vecC);

    const simIdentical = service.quantizedCosineSimilarity(qA, qB);
    const simOrthogonal = service.quantizedCosineSimilarity(qA, qC);

    expect(simIdentical).toBeCloseTo(1.0, 2);
    expect(simOrthogonal).toBeCloseTo(0.0, 2);
  });
});
