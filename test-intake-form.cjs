const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');

    // Capture console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

    const fs = require('fs');
    console.log("Waiting for the body viewer...");
    await new Promise(r => setTimeout(r, 2000));

    // Inject API key to bypass modal
    await page.evaluate(() => {
        localStorage.setItem('gemini_api_key', 'test_key_123');
    });
    await page.reload();
    await new Promise(r => setTimeout(r, 2000));

    // Click 2D mode to bypass 3D canvas
    console.log("Switching to 2D mode...");
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn2d = buttons.find(b => b.title === '2D View');
        if (btn2d) btn2d.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log("Trying to click on 'head' body part SVG...");
    try {
        await page.click('#regions-2d-front path');
    } catch (e) {
        console.log("Could not click body part: " + e.message);
    }

    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: 'screenshot.png' });

    const html = await page.evaluate(() => {
        const form = document.querySelector('app-intake-form');
        return form ? form.innerHTML : "No app-intake-form found";
    });
    console.log("app-intake-form HTML:", html);

    await browser.close();

    await browser.close();
})();
