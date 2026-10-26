import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class ShowCommand extends Command {
  readonly name = 'show';
  readonly usage = 'show <id>';
  execute(args: readonly Token[], session: EditorSession): string[] {
    const document = session.document;
    Values.arity(args, 1);
    const shape = document.find(args[0]!.value);
    const parent = shape.parent === document.root ? 'svg' : `g#${shape.parent!.id}`;
    return [`${shape.tag}#${shape.id}  parent=${parent}`, ...Object.entries(shape.details())
      .filter(([key]) => key !== 'id').map(([key, value]) => `  ${key}=${value}`)];
  }
}
