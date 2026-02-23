const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');
    // Let initialization finish
    await new Promise(r => setTimeout(r, 3000));
    
    // Set api key to bypass modal if any
    await page.evaluate(() => { localStorage.setItem('gemini_api_key', 'test'); });
    await page.reload();
    await new Promise(r => setTimeout(r, 3000));

    // Check state before any clicks
    const preState = await page.evaluate(() => {
        const s = window.patientState;
        if (!s) return null;
        return {
            selectedPartId: s.selectedPartId(),
            isLiveAgentActive: s.isLiveAgentActive()
        };
    });
    console.log("Pre-click state:", preState);

    // Turn off live agent just in case
    await page.evaluate(() => {
        if (window.patientState) {
            window.patientState.isLiveAgentActive.set(false);
            window.patientState.selectPart('head');
        }
    });

    await new Promise(r => setTimeout(r, 1000));

    const postState = await page.evaluate(() => {
        const s = window.patientState;
        if (!s) return null;
        return {
            selectedPartId: s.selectedPartId(),
            isLiveAgentActive: s.isLiveAgentActive()
        };
    });
    console.log("Post-trigger state:", postState);

    const formHtml = await page.evaluate(() => {
        const form = document.querySelector('app-intake-form');
        return form ? "FOUND FORM" : "No form found";
    });
    console.log("Check for app-intake-form element:", formHtml);

    fs.writeFileSync('dom-check.html', await page.content());
    await page.screenshot({ path: 'test-check-state.png' });

    await browser.close();
})();
