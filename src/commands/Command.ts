import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';

export abstract class Command {
  abstract readonly name: string;
  abstract readonly usage: string;
  abstract execute(args: readonly Token[], session: EditorSession): string[];
  protected values(args: readonly Token[]): string[] { return args.map(token => token.value); }
}
