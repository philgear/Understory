const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 4000));
    
    await page.evaluate(() => { localStorage.setItem('gemini_api_key', 'test'); });
    await page.reload();
    await new Promise(r => setTimeout(r, 4000));

    // CLICK DEBUG BUTTON
    console.log("Clicking debug button...");
    await page.click('#debug-btn');

    await new Promise(r => setTimeout(r, 2000));

    const formHtml = await page.evaluate(() => {
        const form = document.querySelector('app-intake-form');
        return form ? "FOUND FORM" : "No form found";
    });
    console.log("Check for app-intake-form element:", formHtml);

    fs.writeFileSync('dom-debug.html', await page.content());
    await page.screenshot({ path: 'test-debug-btn.png' });

    await browser.close();
})();
