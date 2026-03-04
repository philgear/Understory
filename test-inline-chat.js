import puppeteer from 'puppeteer';
import path from 'path';

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  console.log("Navigating to app...");
  await page.goto('http://localhost:4000/analysis');
  
  // Wait for loading to finish
  console.log("Waiting for analysis to load...");
  await page.waitForSelector('.summary-node-content', { timeout: 10000 }).catch(() => console.log("Timeout waiting for content"));
  await page.waitForTimeout(2000);

  // Take a screenshot of the initial state
  await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/inline_chat_test_0_initial.png' });

  // 1. Open an inline chat on a paragraph node
  console.log("Opening inline chat on a node...");
  
  // Find a node that we can hover and click the agent button on
  const nodes = await page.$$('.node-wrapper');
  if (nodes.length > 0) {
    const firstNode = nodes[0];
    await firstNode.hover();
    await page.waitForTimeout(500);
    
    // The "Ask Agent" button has ClinicalIcons.EvidenceFocus
    const askButtons = await firstNode.$$('pocket-gall-button');
    // We assume it's the 3rd button based on the template structure
    if (askButtons.length >= 3) {
      await askButtons[2].click();
      console.log("Clicked 'Ask Agent' button on node");
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/inline_chat_test_1_opened.png' });
    
    // Type something in the inline input
    console.log("Typing in inline chat...");
    await page.type('.inline-input', 'Can you explain this finding in more detail?');
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/inline_chat_test_2_typed.png' });
    
    // Click send
    const sendButton = await page.$('.inline-send');
    if (sendButton) {
      await sendButton.click();
      console.log("Sent message to inline agent");
    }
    
    await page.waitForTimeout(3000); // Wait for response
    await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/inline_chat_test_3_response.png' });
    
    // Close the inline chat by clicking the cancel/clear button (should be the third button again)
    console.log("Closing inline chat to save context...");
    const askButtonsClose = await page.$$('.node-wrapper:nth-child(1) pocket-gall-button');
    if (askButtonsClose.length >= 3) {
       await askButtonsClose[2].click();
       console.log("Closed inline chat");
    }
    await page.waitForTimeout(1000);
    
    // 2. Open full screen chat to verify context is included
    console.log("Opening full screen chat...");
    const fullscreenButton = await page.$('.voice-chat-fab, button[aria-label="Agent assistant"]');
    if (fullscreenButton) {
        await fullscreenButton.click();
        console.log("Clicked full screen chat button");
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/inline_chat_test_4_fullscreen.png' });
        
        // Find the input and send a message relying on context
        const mainInput = await page.$('.vc-input');
        if (mainInput) {
            await page.type('.vc-input', 'Regarding what we just discussed about the first finding, what options are there?');
            await page.waitForTimeout(500);
            
            const mainSend = await page.$('.vc-send-btn');
            if (mainSend) {
                await mainSend.click();
                console.log("Sent message to main agent relying on node context");
                await page.waitForTimeout(4000); // Wait for response
                await page.screenshot({ path: '/home/phil/.gemini/antigravity/brain/0e69cd69-aa0d-4f57-942b-eaf236ef8534/inline_chat_test_5_fullscreen_response.png' });
            }
        } else {
            console.log("Could not find main chat input.");
        }
    } else {
        console.log("Could not find full screen chat button.");
    }

  } else {
    console.log("No nodes found to test with.");
  }
  
  await browser.close();
  console.log("Done.");
}

run().catch(console.error);
