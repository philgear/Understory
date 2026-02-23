const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
        defaultViewport: { width: 1440, height: 900 }
    });
    
    // Connect to the same dev server URL used by playwright
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
        if (msg.type() === 'error') {
            console.error('PAGE ERROR', msg.text());
        }
    });
    
    page.on('pageerror', err => {
        console.error('PAGE UNCAUGHT ERROR', err.message);
    });

    console.log("Navigating...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    
    console.log("Waiting for app to load...");
    await page.waitForSelector('app-root');
    
    console.log("Finding and clicking the Voice Assistant button...");
    const btnHandle = await page.evaluateHandle(() => {
       const btns = Array.from(document.querySelectorAll('button'));
       return btns.find(b => b.textContent && b.textContent.includes('Voice Assistant'));
    });
    
    if (btnHandle) {
       console.log("Clicking button...");
       await btnHandle.click();
       // wait for a bit
       await new Promise(r => setTimeout(r, 1000));
       
       console.log("Checking DOM state...");
       const info = await page.evaluate(() => {
          const isAgentActive = document.querySelector('app-voice-assistant') !== null;
          const rootEl = document.querySelector('app-root');
          const isRow = rootEl && rootEl.innerHTML.includes('flex-row');
          const isCol = rootEl && rootEl.innerHTML.includes('flex-col');
          
          let rightCol = null;
          const flexRows = Array.from(document.querySelectorAll('.flex-row'));
          
          const summary = document.querySelector('app-medical-summary');
          const summaryParent = summary ? summary.parentElement : null;
          
          const analysis = document.querySelector('app-analysis-container');
          const analysisParent = analysis ? analysis.parentElement : null;
          
          return {
             agentActiveVisible: isAgentActive,
             hasFlexRow: isRow,
             hasFlexCol: isCol,
             summaryParentClasses: summaryParent ? summaryParent.className : null,
             summaryParentStyles: summaryParent ? summaryParent.style.cssText : null,
             analysisParentClasses: analysisParent ? analysisParent.className : null,
             analysisParentStyles: analysisParent ? analysisParent.style.cssText : null
          };
       });
       console.log("DOM INFO:", info);
       
       await page.screenshot({ path: 'after_click_diag.png' });
    } else {
       console.log("Button not found! Are we sure it's enabled?");
    }
    
    await browser.close();
})();
