import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    // Pixel 2 Watch or small mobile size
    await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4200');
    
    // Wait for angular to load
    await page.waitForSelector('app-root', { timeout: 10000 });
    
    // Check scroll sizes
    const scrollInfo = await page.evaluate(() => {
        return {
            bodyScrollHeight: document.body.scrollHeight,
            bodyClientHeight: document.body.clientHeight,
            htmlScrollHeight: document.documentElement.scrollHeight,
            htmlClientHeight: document.documentElement.clientHeight,
            windowInnerHeight: window.innerHeight,
            appRootScrollHeight: document.querySelector('app-root').scrollHeight,
            appRootClientHeight: document.querySelector('app-root').clientHeight,
            firstDivScrollHeight: document.querySelector('app-root > div').scrollHeight,
            firstDivClientHeight: document.querySelector('app-root > div').clientHeight,
            overflowY: getComputedStyle(document.body).overflowY,
            htmlOverflowY: getComputedStyle(document.documentElement).overflowY
        };
    });
    console.log(JSON.stringify(scrollInfo, null, 2));
    
    await browser.close();
})();
