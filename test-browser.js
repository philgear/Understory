import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
  });

  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });

  if (errors.length > 0) {
    console.log('Found errors:', errors);
    process.exit(1);
  } else {
    console.log('No console errors found. App loaded successfully!');
    process.exit(0);
  }
  await browser.close();
})();
