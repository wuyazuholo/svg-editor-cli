import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class SetCommand extends EditingCommand {
  readonly name = 'set';
  readonly usage = 'set <id> <attr> <value>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 3);
    const [id, attribute, value] = this.values(args);
    const shape = document.find(id!);
    shape.set(attribute!, value!);
    return [`${shape.tag}#${id} updated: ${attribute}=${JSON.stringify(value)}`];
  }
}
