import type { EditorSession } from '../application/EditorSession.ts';
import { CommandRegistry } from './CommandRegistry.ts';
import { Lexer } from './Lexer.ts';

export class CommandEngine {
  private readonly session: EditorSession;
  private readonly registry = new CommandRegistry();
  private readonly lexer = new Lexer();
  constructor(session: EditorSession) { this.session = session; }
  execute(line: string): string[] {
    try {
      const [name, ...args] = this.lexer.tokenize(line);
      if (!name) return [];
      return this.registry.create(name.value).execute(args, this.session);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`error: ${message.replace(/[\r\n]+/g, ' ')}`];
    }
  }
}
