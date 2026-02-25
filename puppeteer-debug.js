import puppeteer from 'puppeteer';

(async () => {
  try {
    // Try to connect to the existing Chrome instance listening on 9222
    const browserURL = 'http://127.0.0.1:9222';
    console.log(`Connecting to browser at ${browserURL}...`);

    const browser = await puppeteer.connect({ browserURL });
    const pages = await browser.pages();

    // Find the page matching localhost:4200 or open a new one
    let targetPage = pages.find(p => p.url().includes('localhost:4200'));
    if (!targetPage) {
      console.log("Existing page not found, opening new one...");
      targetPage = await browser.newPage();
    } else {
      console.log("Attached to existing page:", targetPage.url());
    }

    // Capture console output
    targetPage.on('console', msg => console.log('PAGE LOG:', msg.text()));
    targetPage.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    targetPage.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText || 'Unknown error');
    });

    console.log("Navigating to http://localhost:4200/");
    await targetPage.goto('http://localhost:4200/', { waitUntil: 'load', timeout: 15000 });

    console.log("Waiting 3 seconds...");
    await new Promise(r => setTimeout(r, 3000));

    browser.disconnect();
    console.log("Done.");
  } catch (err) {
    console.error("Puppeteer connection failed:", err.message);
  }
})();
