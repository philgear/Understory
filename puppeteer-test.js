const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const content = await page.content();
  if (content.includes('process is not defined')) {
    console.error('Data failed to load.');
    process.exit(1);
  }
  console.log('App loaded without ReferenceError.');
  await browser.close();
})();
