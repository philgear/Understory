import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new', 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=286,286'
        ],
        defaultViewport: {
            width: 286,
            height: 286,
            isMobile: true,
            hasTouch: true
        }
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:4200');

    await page.waitForSelector('app-root', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    const matchText = await page.evaluate(() => document.querySelector('.sm\\:inline')?.innerText || 'not found');
    console.log("SM hidden text:", matchText);

    await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/cf589702-fb13-41f6-9d40-c8f1c2ee2079/pixel_watch_test_286.png' });

    await browser.close();
})();
