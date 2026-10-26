import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class DeleteCommand extends EditingCommand {
  readonly name = 'delete';
  readonly usage = 'delete <id>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 1);
    const shape = document.find(args[0]!.value);
    document.delete(shape.id);
    return [`${shape.tag}#${shape.id} deleted`];
  }
}
