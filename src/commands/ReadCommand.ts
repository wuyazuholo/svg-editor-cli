import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class ReadCommand extends Command {
  readonly name = 'read';
  readonly usage = 'read <file.svg>';
  execute(args: readonly Token[], session: EditorSession): string[] {
    Values.arity(args, 1);
    return session.read(args[0]!.value);
  }
}
