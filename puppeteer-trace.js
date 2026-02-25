import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Log ALL responses including headers to see if we're missing JS content-type
    page.on('response', resp => {
        console.log(`[HTTP ${resp.status()}] ${resp.url()} | Content-Type: ${resp.headers()['content-type']}`);
    });

    console.log("Navigating to http://localhost:4200/");
    await page.goto('http://localhost:4200/', { waitUntil: 'load', timeout: 15000 });
    
    // Evaluate the document content
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    console.log("HTML DUMP (first 500 chars):", html.substring(0, 500));
    
    await browser.close();
    console.log("Done.");
  } catch (err) {
    console.error("Puppeteer script failed:", err.message);
  }
})();
