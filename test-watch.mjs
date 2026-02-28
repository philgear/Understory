import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    // Pixel Watch 2 size
    await page.setViewport({ width: 384, height: 384, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4200');

    // Wait for angular to load
    await page.waitForSelector('app-root', { timeout: 10000 });

    const width = await page.evaluate(() => window.innerWidth);
    const height = await page.evaluate(() => window.innerHeight);
    const displaySM = await page.evaluate(() => getComputedStyle(document.querySelector('.hidden.sm\\:block') || document.body).display);
    
    console.log({ width, height, displaySM });

    await browser.close();
})();
