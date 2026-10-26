import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class ScaleCommand extends EditingCommand {
  readonly name = 'scale';
  readonly usage = 'scale <id> <factor>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 2);
    const shape = document.find(args[0]!.value);
    const factor = Values.number(args[1]!.value, 'scale factor');
    Values.positive(factor, 'scale factor');
    shape.scale(factor);
    return [`${shape.tag}#${shape.id} scaled by ${factor}`];
  }
}
