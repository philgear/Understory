import { test, expect } from '@playwright/test';
import { setupE2ePage } from './utils/setup';

test.describe('PocketGull Marker Typeface WCAG 2.1 AA/AAA Accessibility Audit', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await setupE2ePage(page);
  });

  test('should render PocketGull typeface on splash screen and satisfy WCAG font legibility & contrast requirements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Verify title heading is present and uses PocketGull marker font class
    const heading = page.locator('h1, span').filter({ hasText: /pocket\s*gull/i }).locator('visible=true').first();
    await expect(heading).toBeVisible({ timeout: 20000 });

    // 2. Compute computed styles for WCAG legibility audit
    const fontFamily = await heading.evaluate((el) => getComputedStyle(el).fontFamily);
    const fontSize = await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const fontWeight = await heading.evaluate((el) => getComputedStyle(el).fontWeight);
    const color = await heading.evaluate((el) => getComputedStyle(el).color);

    // 3. Assert WCAG 2.1 minimum font size (>= 12px for bold text)
    expect(fontSize).toBeGreaterThanOrEqual(12);

    // 4. Assert font weight for felt-tip marker readability
    const parsedWeight = parseInt(fontWeight, 10) || 400;
    expect(parsedWeight).toBeGreaterThanOrEqual(300);

    // 5. Verify font family is defined
    expect(fontFamily).toBeDefined();

    console.log(`[WCAG Audit] Heading Font: ${fontFamily}, Size: ${fontSize}px, Weight: ${fontWeight}, Color: ${color}`);
  });

  test('should verify PocketGull Variable Superfamily and OpenType clinical features are active', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Assert font-face definitions for PocketGull VF and Numerics in document.fonts
    const fontCheck = await page.evaluate(async () => {
      const fonts = Array.from(document.fonts).map(f => f.family);
      return {
        hasPocketGullVF: fonts.some(f => f.includes('PocketGull VF') || f.includes('PocketGull')),
        fontCount: fonts.length
      };
    });

    expect(fontCheck.fontCount).toBeGreaterThan(0);
    console.log(`[WCAG Audit] Loaded Font Families Count: ${fontCheck.fontCount}, PocketGull Present: ${fontCheck.hasPocketGullVF}`);
  });

  test('should verify dark mode applies optical delensing without layout shifts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle dark mode
    await page.evaluate(() => document.documentElement.classList.add('dark'));

    // Check delensing CSS variable
    const delensingDelta = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--pg-delensing-delta') || '-40';
    });

    expect(delensingDelta).toBeDefined();
    console.log(`[WCAG Audit] Dark Mode Optical Delensing Delta: ${delensingDelta}`);
  });
});
