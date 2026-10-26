import { createInterface } from 'node:readline';
import { EditorSession } from '../application/EditorSession.ts';
import { NodeDocumentStore } from '../io/NodeDocumentStore.ts';
import { CommandEngine } from './CommandEngine.ts';

export class Cli {
  async run(): Promise<void> {
    const engine = new CommandEngine(new EditorSession(new NodeDocumentStore()));
    const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const lines = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive });
    if (interactive) {
      console.log("svg-editor 0.1 — type 'help' for commands");
      lines.setPrompt('svg> ');
      lines.prompt();
    }
    lines.on('SIGINT', () => lines.close());
    for await (const line of lines) {
      const result = engine.execute(line);
      for (const output of result) console.log(output);
      if (!interactive && result.some(output => output.startsWith('error:'))) process.exitCode = 1;
      if (interactive) lines.prompt();
    }
  }
}
