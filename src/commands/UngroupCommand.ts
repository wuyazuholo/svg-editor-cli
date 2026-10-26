import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class UngroupCommand extends EditingCommand {
  readonly name = 'ungroup';
  readonly usage = 'ungroup <gid>';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 1);
    const id = args[0]!.value;
    document.ungroup(id);
    return [`g#${id} ungrouped; children promoted to parent`];
  }
}
