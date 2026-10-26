import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class SaveCommand extends Command {
  readonly name = 'save';
  readonly usage = 'save [file.svg]';
  execute(args: readonly Token[], session: EditorSession): string[] {
    Values.arity(args, 0, 1);
    return [session.save(args[0]?.value)];
  }
}
