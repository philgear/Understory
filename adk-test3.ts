import { LlmAgent, InMemoryRunner, EventType, Content } from '@google/adk';

async function main() {
    const agent1 = new LlmAgent({
        name: 'agent1',
        model: 'gemini-2.5-flash',
        instruction: 'Reply with the word ONE and nothing else.',
    });

    const runner = new InMemoryRunner({ agent: agent1 });

    const events = runner.runEphemeral({
        userId: 'test_user',
        newMessage: { role: 'user', parts: [{ text: 'Go' }] }
    });

    for await (const event of events) {
        console.log('Got event of type: ', event.type);
        if (event.type === EventType.MODEL_RESPONSE) {
            console.log('Response content:', JSON.stringify(event.content, null, 2));
        }
    }
}
main().catch(console.error);
