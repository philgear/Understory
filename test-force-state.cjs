const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => { localStorage.setItem('gemini_api_key', 'test'); });
    await page.reload();
    await new Promise(r => setTimeout(r, 2000));
    
    // Inject and click directly!
    const html = await page.evaluate(() => {
       // We can just grab the app component and call its methods, or dispatch a click event explicitly.
       // Angular exposes ng internally, but let's just dispatch an event on the SVG
       const btn2d = Array.from(document.querySelectorAll('button')).find(b => b.title === '2D View');
       if (btn2d) btn2d.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => {
        const path = document.querySelector('#regions-2d-front path');
        if (path) {
            // Dispatch a real click event
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            path.dispatchEvent(event);
        }
    });

    await new Promise(r => setTimeout(r, 1000));

    const formHtml = await page.evaluate(() => {
        const form = document.querySelector('app-intake-form');
        return form ? "FOUND FORM" : "No form found";
    });
    console.log("Result:", formHtml);

    // Write DOM
    fs.writeFileSync('dom-test.html', await page.content());
    await page.screenshot({ path: 'test-force-state.png' });

    await browser.close();
})();
