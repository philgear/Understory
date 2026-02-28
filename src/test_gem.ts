import { GoogleGenAI } from '@google/genai';

async function run() {
    try {
        console.log("Creating AI instance...");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'fake-key' });
        console.log("Creating chat...");
        const chat = await ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: "You are a test agent",
                temperature: 0.1
            }
        });
        console.log("Chat created!");
        process.exit(0);
    } catch (e) {
        console.error("Error!", e);
        process.exit(1);
    }
}
run();
