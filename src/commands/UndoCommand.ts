import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class UndoCommand extends Command {
  readonly name = 'undo';
  readonly usage = 'undo';
  execute(args: readonly Token[], session: EditorSession): string[] {
    Values.arity(args, 0);
    return [session.undo()];
  }
}
