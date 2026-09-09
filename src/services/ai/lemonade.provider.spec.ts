import { TestBed } from '@angular/core/testing';
import { LemonadeProvider, RECOMMENDED_LEMONADE_MODELS } from './lemonade.provider';

describe('LemonadeProvider', () => {
  let provider: LemonadeProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LemonadeProvider]
    });
    provider = TestBed.inject(LemonadeProvider);
  });

  it('1. Initializes with Gemma 3 4B GGUF as default edge model on AMD Radeon hardware', () => {
    expect(provider.selectedModelId()).toBe('Gemma-3-4b-it-GGUF');
    expect(provider.activeHardware()).toContain('AMD Radeon RX 6650 XT');
    expect(provider.tokensPerSecond()).toBeGreaterThanOrEqual(75);
    expect(provider.availableModels().length).toBeGreaterThanOrEqual(4);
  });

  it('2. Provides initial greeting referencing Gemma 3 multimodal and zero cloud egress', async () => {
    const greeting = await provider.getInitialGreeting('prompt');
    expect(greeting).toContain('Gemma 3 4B Multimodal');
    expect(greeting).toContain('Zero Cloud Egress');
    expect(greeting).toContain('AMD Radeon');
  });

  it('3. Successfully updates model and estimated VRAM footprint', () => {
    provider.setModel('Llama-3.2-3B-Instruct-GGUF');
    expect(provider.selectedModelId()).toBe('Llama-3.2-3B-Instruct-GGUF');
    expect(provider.estimatedVramUsageMb()).toBe(2100);

    provider.setModel('Gemma-3-4b-it-GGUF');
    expect(provider.selectedModelId()).toBe('Gemma-3-4b-it-GGUF');
    expect(provider.estimatedVramUsageMb()).toBe(3340);
  });

  it('4. Synthesizes knowledge citing local Radeon hardware and Low risk of bias', async () => {
    const result = await provider.synthesizeKnowledge('Patient query');
    expect(result.source).toBe('LOCAL_LEMONADE_RADEON');
    expect(result.cochraneRiskOfBias).toBe('LOW');
    expect(result.falsifiabilityPValue).toBeLessThan(0.05);
  });

  it('5. Dispatches multimodal image analysis with Care Principles & ISMP rules', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: 'Wound shows granulation tissue without acute cellulitis.' } }
        ]
      })
    } as any);

    const result = await provider.analyzeImage('tinyBase64ImageString', 'Lower extremity ulcer');
    expect(result).toContain('granulation tissue');

    expect(fetchSpy).toHaveBeenCalled();
    const callArgs = fetchSpy.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.model).toBe('Gemma-3-4b-it-GGUF');
    expect(body.messages[0].content[0].text).toContain('diagnostic preconditions');
    expect(body.messages[0].content[0].text).toContain('CARS Distractor Elimination');
    expect(body.messages[0].content[0].text).toContain('ISMP rules');
    expect(body.messages[0].content[1].type).toBe('image_url');

    fetchSpy.mockRestore();
  });

  it('6. Streams report with injected Care Principles guardrails in systemInstruction', async () => {
    const mockSSE = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Clinical plan:"}}]}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      body: mockSSE
    } as any);

    const chunks: string[] = [];
    for await (const chunk of provider.generateReportStream$('Vitals: BP 138/88', 'Cardiovascular', 'Default instruction')) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('Clinical plan:');
    const callArgs = fetchSpy.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    const systemPrompt = body.messages[0].content;
    expect(systemPrompt).toContain('DYNAMIC PRECONDITION SENTINEL');
    expect(systemPrompt).toContain('CARS DISTRACTOR ELIMINATION');
    expect(systemPrompt).toContain('ISMP & FDA HIGH-ALERT MEDICATION SAFETY');

    fetchSpy.mockRestore();
  });
});
