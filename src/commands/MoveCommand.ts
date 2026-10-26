import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class MoveCommand extends EditingCommand {
  readonly name = 'move';
  readonly usage = 'move <id> <dx> <dy>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 3);
    const shape = document.find(args[0]!.value);
    const dx = Values.number(args[1]!.value, 'dx');
    const dy = Values.number(args[2]!.value, 'dy');
    shape.move(dx, dy);
    return [`${shape.tag}#${shape.id} moved by (${dx},${dy})`];
  }
}
