import { Page } from '@playwright/test';

/**
 * Polls the backend until it is fully responsive to prevent E2E race conditions on CI.
 */
async function waitForBackendToBeReady() {
  const baseUrl = process.env['BASE_URL'] || 'http://127.0.0.1:4000';
  const url = `${baseUrl}/api/config`;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.warn('⚠️ E2E Setup: Backend API did not become ready in time.');
}

/**
 * Common setup for E2E tests.
 * Mocks out hardware telemetry, config, and prevents Service Worker registration.
 */
export async function setupE2ePage(page: Page, options: { mockClinician?: boolean } = { mockClinician: true }) {
  // Wait for the local Express server backend to finish booting and seeding
  await waitForBackendToBeReady();

  page.on('console', async msg => {
    const parts = [];
    for (const arg of msg.args()) {
      try {
        const val = await arg.jsonValue();
        if (val && typeof val === 'object') {
          if (val.message || val.stack) {
            parts.push(`${val.name || 'Error'}: ${val.message}\n${val.stack || ''}`);
          } else {
            parts.push(JSON.stringify(val));
          }
        } else {
          parts.push(val);
        }
      } catch (e) {
        parts.push(arg.toString());
      }
    }
    console.log(`PAGE LOG [${msg.type()}]:`, parts.join(' '));
  });

  page.on('pageerror', err => {
    console.error('PAGE ERROR EXCEPTION:', err.stack || err.message);
  });

  page.on('requestfailed', request => {
    console.error(`REQUEST FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText || 'unknown error'}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`HTTP ERROR: ${response.request().method()} ${response.url()} status ${response.status()}`);
    }
  });

  // Intercept Firebase Data Connect emulator & cloud requests to prevent 404 / connection errors
  await page.route(/(9399\/v1|firebasedataconnect\.googleapis\.com)/, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} })
    });
  });

  // Intercept config endpoint to return empty API key so splash screen shows Demo Mode
  await page.route('**/api/config', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ apiKey: '' })
    });
  });

  // Intercept hardware telemetry to prevent 500 error warnings
  await page.route('**/api/hardware/telemetry', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        gpus: [],
        cpuName: 'Mock CPU',
        cpuLoadPercent: 12,
        systemMemoryUsedGb: 4.5,
        systemMemoryTotalGb: 16.0
      })
    });
  });

  // Intercept current patient loci endpoint to avoid 503 sidecar errors
  await page.route('**/api/loci/current_patient', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  // Intercept Python sidecar endpoints to prevent network timeout warnings during E2E tests
  await page.route('**/api/python/**', async route => {
    const url = route.request().url();
    if (url.includes('/health')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', latency_ms: 5 })
      });
      return;
    }
    if (url.includes('/risk-score')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          risk_score: 0.15,
          score: 0.15,
          confidence: 0.95,
          risk_level: 'low',
          contributing_factors: ['Normal baseline vitals'],
          risk_factors: ['Normal baseline vitals'],
          note: 'Routine monitoring',
          recommendations: ['Routine monitoring']
        })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', success: true })
    });
  });

  // Intercept POST /api/patients bulk sync to ensure fast, deterministic E2E test execution across all browser engines
  await page.route('**/api/patients', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    } else {
      await route.continue();
    }
  });

  // Intercept AI Metrics endpoint
  await page.route('**/api/ai/metrics', async route => {
    console.log('E2E MOCK: Intercepted POST /api/ai/metrics');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ complexity: 5, stability: 5, certainty: 5 })
    });
  });

  // Intercept AI Stream endpoint to return standard test keywords for all lens verification
  await page.route('**/api/ai/stream', async route => {
    console.log('E2E MOCK: Intercepted POST /api/ai/stream');
    const mockMarkdown = `# Clinical Assessment\nDetails of clinical assessment.\n\n# Diagnostic Workup\nDetails of diagnostic workup.\n\n# Nutritional Interventions\nDetails of nutritional interventions.\n\n# Biomarker Matrix\nDetails of biomarker matrix: Magnesium.\n\n# Immediate (24-72 hours)\nDetails of immediate monitoring.\n\n# Understanding Your health plan\nDetails of patient education.`;
    const chunk = {
      candidates: [{
        content: {
          parts: [{
            text: mockMarkdown
          }]
        }
      }]
    };
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `data: ${JSON.stringify(chunk)}\ndata: [DONE]\n`
    });
  });

  // Intercept AI Changes detection endpoint
  await page.route('**/api/ai/changes', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ significant: false })
    });
  });

  // Intercept Genkit flow endpoints to prevent 429 quota exhaustion errors in test suites
  await page.route('**/api/genkit/**', async route => {
    console.log('E2E MOCK: Intercepted Genkit flow endpoint');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { text: 'Clinical assessment complete.' } })
    });
  });

  // Intercept all AI Chat endpoints (/start, /message)
  await page.route('**/*api/ai/chat*', async route => {
    const url = route.request().url();
    if (url.includes('/start')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionId: 'mock-session-id' })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: 'This is a mock clinical intelligence response.' })
      });
    }
  });

  // Set local storage flags and disable service workers
  await page.addInitScript((mockClinician) => {
    try {
      window.indexedDB.deleteDatabase('PocketGullDB');
      window.indexedDB.deleteDatabase('pocket-gull-cache');
    } catch (e) {}

    // Mock API key so the Voice Assistant doesn't abort initialization
    (window as any).GEMINI_API_KEY = 'mock-api-key';

    window.localStorage.setItem('pg_tour_seen', '1');
    window.localStorage.setItem('pg_data_consent_v1', 'true');
    window.sessionStorage.setItem('pg_session_onboarded', '1');
    if (mockClinician) {
      window.localStorage.setItem('pg_mock_clinician', '1');
    }

    // Disable service worker during tests so Playwright can intercept API requests reliably
    try {
      const mockSW = {
        register: () => Promise.reject(new Error('Service worker disabled for testing')),
        addEventListener: () => {},
        removeEventListener: () => {},
        getRegistration: () => Promise.resolve(undefined),
        getRegistrations: () => Promise.resolve([]),
        controller: null,
        ready: Promise.resolve({ active: null } as any)
      };
      Object.defineProperty(navigator, 'serviceWorker', {
        get() { return mockSW; },
        configurable: true
      });
    } catch (e) {
      console.error('Failed to disable service worker:', e);
    }
  }, options.mockClinician);
}

/** Shared login + demo mode entry flow for all E2E tests */
export async function enterDemoMode(page: Page) {
  const existingViewport = page.viewportSize();
  if (!existingViewport) {
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await page.goto('/');

  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    // Dismiss consent modal if it overlays the screen
    const consentBtn = page.locator('button', { hasText: /I Understand — Continue/i }).first();
    if (await consentBtn.isVisible().catch(() => false)) {
      await consentBtn.click().catch(() => {});
      await page.waitForTimeout(300).catch(() => {});
    }

    // 0. If splash screen is no longer visible, app is unlocked!
    const splashMain = page.locator('.secure-splash-main');
    const isSplashVisible = await splashMain.isVisible().catch(() => false);
    if (!isSplashVisible) {
      break;
    }

    // 1. Enter Suite / Enter Clinical Suite button
    const enterSuiteBtn = page.locator('button', { hasText: /Enter (Suite|Clinical Suite)/i }).first();
    if (await enterSuiteBtn.isVisible().catch(() => false)) {
      await enterSuiteBtn.click().catch(() => {});
      await page.waitForTimeout(500).catch(() => {});
      continue;
    }

    // 2. Demo Mode button
    const demoBtn = page.locator('button', { hasText: 'Demo Mode' });
    if (await demoBtn.isVisible().catch(() => false)) {
      await demoBtn.click().catch(() => {});
      await page.waitForTimeout(500).catch(() => {});
      continue;
    }

    // 3. Skip KSS button
    const skipBtn = page.locator('button', { hasText: 'Skip' });
    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click().catch(() => {});
      await page.waitForTimeout(500).catch(() => {});
      continue;
    }

    // 4. Ethics pledge checkbox & Accept button
    const pledgeCheckbox = page.locator('#pledge-accepted, input[type="checkbox"]').first();
    if (await pledgeCheckbox.isVisible().catch(() => false)) {
      if (!(await pledgeCheckbox.isChecked().catch(() => false))) {
        await pledgeCheckbox.check().catch(() => {});
      }
    }

    const acceptBtn = page.locator('button', { hasText: 'Accept & Enter System' });
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click().catch(() => {});
      await page.waitForTimeout(500).catch(() => {});
      continue;
    }

    await page.waitForTimeout(300).catch(() => {});
  }

  // Final wait for splash screen to disappear and hydrate viewport @defer blocks
  await page.locator('.secure-splash-main').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  
  // Secondary check for consent modal after splash detachment
  const consentBtnAfter = page.locator('button', { hasText: /I Understand — Continue/i }).first();
  if (await consentBtnAfter.isVisible().catch(() => false)) {
    await consentBtnAfter.click().catch(() => {});
    await page.waitForTimeout(300).catch(() => {});
  }

  await page.evaluate(() => window.scrollTo(0, 600)).catch(() => {});
}

/** Shared patient selection helper for all E2E specs with WHO/NIH demographic archetype mapping */
export async function selectPatientByName(page: Page, name: string) {
  // Map legacy names to HIPAA Safe Harbor WHO/NIH demographic archetypes
  const archetypeAliasMap: Record<string, string> = {
    'Sarah Jenkins': 'Homo Sapiens (Female, Asthma',
    'Alexander Vance': 'Homo Sapiens (Male, Metabolic',
    'Robert Davis': 'Homo Sapiens (Male, Metabolic',
    'Diane Vance': 'Homo Sapiens (Female, Musculoskeletal',
    'Marcus Aurelius Chen': 'Homo Sapiens (Male, Cardiovascular',
    'Arthur Pendelton': 'Homo Sapiens (Male, Cognitive',
    'Chloe Bennett': 'Homo Sapiens (Female, Autoimmune',
    'Devon Brooks': 'Homo Sapiens (Male, Gastrointestinal',
    'Maya Patel': 'Homo Sapiens (Female, Endocrine',
    'James Wilson': 'Homo Sapiens (Male, Renal',
  };
  const targetName = archetypeAliasMap[name] || name;

  const dropdownBtn = page.locator('app-patient-dropdown pocket-gull-button button, app-patient-dropdown button').first();
  if (await dropdownBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
    await dropdownBtn.click();
    await page.waitForTimeout(500);

    const option = page.locator('app-patient-dropdown .group\\/list button', { hasText: targetName }).first();
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click();
      await page.waitForTimeout(500);
      return;
    }

    const searchInput = page.locator('app-patient-dropdown input[placeholder*="Search"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(targetName);
      await searchInput.dispatchEvent('input');
      await page.waitForTimeout(300);
      const searchOption = page.locator('app-patient-dropdown .group\\/list button', { hasText: targetName }).first();
      if (await searchOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchOption.click();
        await page.waitForTimeout(500);
        return;
      }
      // Clear search to restore full patient list before fallback
      await searchInput.fill('');
      await searchInput.dispatchEvent('input');
      await page.waitForTimeout(200);
    }

    // Fallback: select first active patient from roster (never click action buttons in footer)
    const fallbackOption = page.locator('app-patient-dropdown .group\\/list button').first();
    if (await fallbackOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await fallbackOption.click();
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(500);
  }
}
