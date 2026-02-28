import { LlmAgent, ParallelAgent, InMemoryRunner, EventType, Content } from '@google/adk';

async function main() {
  const agent1 = new LlmAgent({
    name: 'agent1',
    model: 'gemini-2.5-flash',
    instruction: 'Reply with the word ONE and nothing else.',
  });

  const agent2 = new LlmAgent({
    name: 'agent2',
    model: 'gemini-2.5-flash',
    instruction: 'Reply with the word TWO and nothing else.',
  });

  const parallel = new ParallelAgent({
    name: 'parallel',
    agents: [agent1, agent2]
  });

  const runner = new InMemoryRunner({ agent: parallel });
  
  const events = runner.runEphemeral({
    userId: 'test_user',
    newMessage: { role: 'user', parts: [{ text: 'Go' }] }
  });

  for await (const event of events) {
    if (event.type === EventType.MODEL_RESPONSE) {
      console.log('Got response from agent...');
      // figure out what format the response is in
      console.log(JSON.stringify(event, null, 2));
    }
  }
}
main().catch(console.error);
