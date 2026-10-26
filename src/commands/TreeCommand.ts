import { Command } from './Command.ts';
import { TreeFormatter } from './TreeFormatter.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class TreeCommand extends Command {
  readonly name = 'tree';
  readonly usage = 'tree [id]';
  execute(args: readonly Token[], session: EditorSession): string[] {
    const document = session.document;
    Values.arity(args, 0, 1);
    const formatter = new TreeFormatter();
    return args[0] ? formatter.shape(document.find(args[0].value)) : formatter.document(document);
  }
}
