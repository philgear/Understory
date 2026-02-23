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
    await new Promise(r => setTimeout(r, 4000));
    
    // Set api key to bypass modal if any
    await page.evaluate(() => { localStorage.setItem('gemini_api_key', 'test'); });
    await page.reload();
    await new Promise(r => setTimeout(r, 4000));

    // Try to get state
    const info = await page.evaluate(() => {
        try {
            const root = document.querySelector('app-root');
            const comp = window.ng.getComponent(root);
            const state = comp.state;
            
            // force change
            state.selectPart('head');
            state.isLiveAgentActive.set(false);

            // trigger change detection!
            const cdr = comp.cdr || window.ng.getInjector(root).get(window.ng.coreTokens.ChangeDetectorRef);
            if (cdr) cdr.detectChanges();
            
            return {
                part: state.selectedPartId(),
                agent: state.isLiveAgentActive(),
                viewerMode: state.bodyViewerMode()
            };
        } catch(e) { return e.message; }
    });
    console.log("State Info:", info);

    await new Promise(r => setTimeout(r, 1000));

    const formHtml = await page.evaluate(() => {
        const form = document.querySelector('app-intake-form');
        return form ? "FOUND FORM" : "No form found";
    });
    console.log("Check for app-intake-form element:", formHtml);

    fs.writeFileSync('dom-ng.html', await page.content());
    await page.screenshot({ path: 'test-ng-state.png' });

    await browser.close();
})();
