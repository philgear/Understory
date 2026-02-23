const puppeteer = require('puppeteer-core');
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
    
    // Set api key to bypass modal
    await page.evaluate(() => { localStorage.setItem('gemini_api_key', 'test'); });
    await page.reload();
    await new Promise(r => setTimeout(r, 4000));

    console.log("Triggering change...");
    await page.evaluate(() => {
        try {
            const root = document.querySelector('app-root');
            const comp = window.ng.getComponent(root);
            
            comp.state.selectPart('head');
            comp.state.isLiveAgentActive.set(false);

            const cdr = comp.cdr || window.ng.getInjector(root).get(window.ng.coreTokens.ChangeDetectorRef);
            if (cdr) cdr.detectChanges();
        } catch(e) { console.error("INJECT ERROR:", e.message); }
    });

    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
