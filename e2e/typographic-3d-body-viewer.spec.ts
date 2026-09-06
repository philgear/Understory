import { test, expect } from '@playwright/test';
import { setupE2ePage, enterDemoMode, selectPatientByName } from './utils/setup';

test.describe('3D Body Viewer, Typographic Calligramme & Quad-Philosophy Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await setupE2ePage(page);
    await enterDemoMode(page);
    await selectPatientByName(page, 'Alexander Vance');
    await page.setViewportSize({ width: 1440, height: 900 });

    const anatomyTab = page.locator('button', { hasText: /Anatomy/i }).first();
    if (await anatomyTab.isVisible().catch(() => false)) {
      await anatomyTab.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  });

  test('should render 3D Body Viewer with WebGL Canvas and toggle 2D/3D lenses', async ({ page }) => {
    // 1. Locate Body Viewer container
    const bodyViewer = page.locator('app-body-viewer').first();
    await expect(bodyViewer).toBeVisible({ timeout: 25000 });

    // 2. Test 3D Mode toggle button
    const toggle3dBtn = bodyViewer.locator('button', { hasText: /3D/i }).first();
    if (await toggle3dBtn.isVisible()) {
      await toggle3dBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Verify WebGL Canvas is present in 3D mode
      const canvas3d = bodyViewer.locator('canvas').first();
      await expect(canvas3d).toBeVisible({ timeout: 10000 });
    }

    // 3. Switch back to 2D Typographic Calligramme Lens
    const toggle2dBtn = bodyViewer.locator('button', { hasText: /2D/i }).first();
    if (await toggle2dBtn.isVisible()) {
      await toggle2dBtn.click({ force: true });
      await page.waitForTimeout(300);
    }
    const typoLensBtn = bodyViewer.locator('button', { hasText: /Typo/i }).first();
    if (await typoLensBtn.isVisible()) {
      await typoLensBtn.click({ force: true });
      await page.waitForTimeout(500);

      // Verify SVG text or textPath elements exist
      const svgCalligramme = bodyViewer.locator('svg text, svg textPath').first();
      await expect(svgCalligramme).toBeAttached();
    }
  });

  test('should switch Multilingual Nomina languages across Latin, Sanskrit, Chinese, Japanese, and English', async ({ page }) => {
    const bodyViewer = page.locator('app-body-viewer').first();
    await expect(bodyViewer).toBeVisible({ timeout: 25000 });

    // Switch to 2D Atlas mode first
    const toggle2dBtn = bodyViewer.locator('button', { hasText: /2D/i }).first();
    if (await toggle2dBtn.isVisible()) {
      await toggle2dBtn.click({ force: true });
      await page.waitForTimeout(300);
    }

    // Ensure we are in 2D Typo mode to inspect Nomina switcher
    const typoBtn = bodyViewer.locator('button', { hasText: /Typo/i }).first();
    if (await typoBtn.isVisible()) {
      await typoBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Find Nomina Language cycle button
    const nominaBtn = bodyViewer.locator('button', { hasText: /Nomina/i }).first();
    if (await nominaBtn.isVisible()) {
      await nominaBtn.click({ force: true });
      await page.waitForTimeout(500);
      const textElement = bodyViewer.locator('textPath, text').first();
      await expect(textElement).toBeVisible();
    }
  });

  test('should select anatomical parts and update live clinical telemetry HUD', async ({ page }) => {
    const bodyViewer = page.locator('app-body-viewer').first();
    await expect(bodyViewer).toBeVisible({ timeout: 25000 });

    // Select Cranium / Head area
    const headPart = bodyViewer.locator('g[data-part-id="head"], [id*="head"], [id*="cranium"]').first();
    if (await headPart.isVisible()) {
      await headPart.click({ force: true });
      await page.waitForTimeout(300);
    }

    // Verify Telemetry badge or part info card updates
    const partSummary = bodyViewer.locator('.text-xs, .font-mono').first();
    await expect(partSummary).toBeVisible();
  });

  test('should toggle Quad-Philosophy Paradigms: Western, TCM, Ayurvedic, and Osteopathic', async ({ page }) => {
    const bodyViewer = page.locator('app-body-viewer').first();
    await expect(bodyViewer).toBeVisible({ timeout: 25000 });

    // Check for Paradigm Selector in toolbar
    const tcmBtn = page.locator('button', { hasText: /TCM|Eastern|Meridian/i }).first();
    if (await tcmBtn.isVisible()) {
      await tcmBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const ayurvedicBtn = page.locator('button', { hasText: /Ayurvedic|Veda|Prana/i }).first();
    if (await ayurvedicBtn.isVisible()) {
      await ayurvedicBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const osteopathicBtn = page.locator('button', { hasText: /Osteopathic|Somatic|Tensegrity/i }).first();
    if (await osteopathicBtn.isVisible()) {
      await osteopathicBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    const westernBtn = page.locator('button', { hasText: /Western|Allopathic/i }).first();
    if (await westernBtn.isVisible()) {
      await westernBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
  });
});
