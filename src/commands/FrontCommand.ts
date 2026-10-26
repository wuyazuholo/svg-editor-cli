import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class FrontCommand extends EditingCommand {
  readonly name = 'front';
  readonly usage = 'front <id>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 1);
    document.reorder(args[0]!.value, true);
    return [`${args[0]!.value} moved to front of siblings`];
  }
}
