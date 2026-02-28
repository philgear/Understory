import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ 
            headless: 'new', 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--window-size=286,286'
            ],
            defaultViewport: {
                width: 286,
                height: 286,
                isMobile: true,
                hasTouch: true
            }
        });
        const page = await browser.newPage();
        await page.goto('http://localhost:4200');

        await page.waitForSelector('app-root', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 2000));

        const overflows = await page.evaluate(() => {
            const bodyWidth = document.body.scrollWidth;
            const windowWidth = window.innerWidth;
            const bodyHeight = document.body.scrollHeight;
            const windowHeight = window.innerHeight;

            function findOverflowingElements() {
                const arr = Array.from(document.querySelectorAll('*'));
                const overflowing = [];
                for (const el of arr) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > window.innerWidth) {
                        overflowing.push({ tag: el.tagName, class: el.className, width: rect.width });
                    }
                }
                return overflowing;
            }

            return { bodyWidth, windowWidth, bodyHeight, windowHeight, overflowing: findOverflowingElements() };
        });
        console.log(JSON.stringify(overflows, null, 2));

        await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/cf589702-fb13-41f6-9d40-c8f1c2ee2079/pixel_watch_overflow_check.png' });

        await browser.close();
    } catch (e) {
        console.error("Error:", e);
    }
})();
