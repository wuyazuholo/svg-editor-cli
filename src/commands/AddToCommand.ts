import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class AddToCommand extends EditingCommand {
  readonly name = 'addto';
  readonly usage = 'addto <gid> <id>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 2);
    const parent = document.container(args[0]!.value);
    const shape = document.find(args[1]!.value);
    parent.add(shape);
    return [`${shape.tag}#${shape.id} added to g#${parent.id}`];
  }
}
