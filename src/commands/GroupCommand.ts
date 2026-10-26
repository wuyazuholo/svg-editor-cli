import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { Values } from '../domain/Values.ts';

export class GroupCommand extends EditingCommand {
  readonly name = 'group';
  readonly usage = 'group <newGid> <id1> <id2>...';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 2, Number.MAX_SAFE_INTEGER);
    const [id, ...members] = this.values(args);
    document.group(id!, members);
    return [`g#${id} created with ${members.length} children`];
  }
}
