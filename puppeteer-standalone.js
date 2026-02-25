import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText || 'Unknown error');
    });

    console.log("Navigating to http://localhost:4200/");
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle0', timeout: 15000 });
    
    console.log("Waiting 3 seconds...");
    await new Promise(r => setTimeout(r, 3000));
    
    await browser.close();
    console.log("Done.");
  } catch (err) {
    console.error("Puppeteer script failed:", err.message);
  }
})();
