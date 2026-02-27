import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Load GEMINI_API_KEY from environment
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY is not set in environment.');
    process.exit(1);
}

const genAI = new GoogleGenAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function verify(scenario) {
    const prompt = `
    You are a Medical Auditor AI. Verify the REPORT SECTION against the SOURCE TRANSCRIPT.
    
    SOURCE TRANSCRIPT:
    ${scenario.transcript}
    
    REPORT SECTION [${scenario.report.title}]:
    ${scenario.report.content}
    
    Return a JSON object:
    {
      "status": "verified" | "warning" | "error",
      "issues": [
        {
          "severity": "low" | "medium" | "high",
          "message": "Description",
          "claim": "The exact substring from the report that is problematic"
        }
      ]
    }
    Return ONLY the JSON.
  `;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        // Handle SDK version differences (response.text() vs response.text)
        const response = result.response;
        const text = typeof response.text === 'function' ? response.text() : response.text;
        return JSON.parse(text);
    } catch (e) {
        console.error(`Error verifying scenario ${scenario.id}:`, e.message);
        return null;
    }
}

async function runSuite() {
    const goldSet = JSON.parse(fs.readFileSync('./src/tests/gold-set.json', 'utf8'));
    console.log(`\n--- Running Gold Set Verification (${goldSet.length} scenarios) ---\n`);

    let passed = 0;
    for (const scenario of goldSet) {
        console.log(`[Testing] ${scenario.id}: ${scenario.description}`);
        const actual = await verify(scenario);

        if (!actual) {
            console.log(`  [FAIL] AI generation failed.\n`);
            continue;
        }

        const statusMatch = actual.status === scenario.expected.status;
        const issuesCountMatch = actual.issues.length === scenario.expected.issues.length;

        if (statusMatch) {
            console.log(`  [PASS] Status matched: ${actual.status}`);
            passed++;
        } else {
            console.log(`  [FAIL] Status mismatch. Expected: ${scenario.expected.status}, Actual: ${actual.status}`);
            console.log(`  Issues found:`, JSON.stringify(actual.issues, null, 2));
        }
        console.log('---');
    }

    console.log(`\nSuite complete. Passed ${passed}/${goldSet.length} scenarios.`);
}

runSuite();
