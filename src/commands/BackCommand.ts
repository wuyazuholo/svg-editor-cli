import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class BackCommand extends EditingCommand {
  readonly name = 'back';
  readonly usage = 'back <id>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 1);
    document.reorder(args[0]!.value, false);
    return [`${args[0]!.value} moved to back of siblings`];
  }
}
