import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  console.log("Navigating to app...");
  await page.goto('http://localhost:4000/');

  console.log("Waiting for app to load...");
  await new Promise(r => setTimeout(r, 2000));

  // Find and click the demo button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text && text.includes('TRY DEMO')) {
      console.log('✅ Found DEMO button. Clicking...');
      await btn.click();
      break;
    }
  }

  console.log("Waiting for dashboard to load...");
  await new Promise(r => setTimeout(r, 2000));

  // Try to find the button to open the assistant
  console.log("Opening assistant...");
  // Actually, wait for the DOM to settle
  await new Promise(r => setTimeout(r, 1000));

  const openButton = await page.waitForSelector('button[aria-label="Toggle Live Agent"]', { timeout: 10000 }).catch(() => null);
  if (openButton) {
    console.log('✅ Found voice assistant toggle button by aria-label. Clicking...');
    await openButton.click();
  } else {
    console.error('❌ Could not find button to open voice assistant.');
    const debugScreenshotPath = '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/debug_l5_model_button_not_found.png';
    await page.screenshot({ path: debugScreenshotPath, fullPage: true });
    console.log('📸 Saved debug screenshot to ' + debugScreenshotPath);
    const buttonsHtml = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText,
        ariaLabel: b.getAttribute('aria-label'),
        title: b.title,
        className: b.className
      }));
    });
    console.log('🔍 Available buttons on page:', JSON.stringify(buttonsHtml, null, 2));
    await browser.close();
    return;
  }

  console.log("Waiting for intro typing...");
  await new Promise(r => setTimeout(r, 3000));

  console.log("Typing message...");
  const inputSelector = 'input[placeholder="Ask Pocket Gull..."]';
  await page.waitForSelector(inputSelector, { timeout: 10000 });
  await page.type(inputSelector, "Can i see a 3d model of the L5 Region?");

  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Enter');

  console.log("Waiting for AI response and 3D Model initialization...");
  await new Promise(r => setTimeout(r, 8000));

  // Take final screenshot
  const screenshotPath = '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/l5_3d_model_inference_demo.png';
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved at " + screenshotPath);

  await browser.close();
}

run().catch(console.error);
