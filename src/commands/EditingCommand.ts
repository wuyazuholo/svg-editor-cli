import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { ReversibleEdit } from '../application/ReversibleEdit.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';

export abstract class EditingCommand extends Command implements ReversibleEdit {
  private previous: SvgDocument | undefined;
  private next: SvgDocument | undefined;
  execute(args: readonly Token[], session: EditorSession): string[] {
    const previous = session.document.clone();
    const candidate = previous.clone();
    const result = this.apply(candidate, args);
    this.previous = previous;
    this.next = candidate.clone();
    session.commit(candidate, this);
    return result;
  }
  before(): SvgDocument {
    if (!this.previous) throw new Error('command has not executed');
    return this.previous.clone();
  }
  after(): SvgDocument {
    if (!this.next) throw new Error('command has not executed');
    return this.next.clone();
  }
  protected abstract apply(document: SvgDocument, args: readonly Token[]): string[];
}
