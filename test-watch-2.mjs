import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 384, height: 384, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4200');

    await page.waitForSelector('app-root', { timeout: 10000 });

    const width = await page.evaluate(() => window.innerWidth);
    const text = await page.evaluate(() => document.body.innerText);
    
    console.log("Width:", width);
    // console.log("Text:", text.substring(0, 100));

    await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/cf589702-fb13-41f6-9d40-c8f1c2ee2079/pixel_watch_test_3.png' });

    await browser.close();
})();
