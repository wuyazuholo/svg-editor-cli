import type { ReversibleEdit } from './ReversibleEdit.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';

export class History {
  private readonly past: ReversibleEdit[] = [];
  private readonly future: ReversibleEdit[] = [];
  private blocked = false;

  record(edit: ReversibleEdit): void {
    this.past.push(edit);
    this.future.length = 0;
    this.blocked = false;
  }

  barrier(): void {
    this.past.length = 0;
    this.future.length = 0;
    this.blocked = true;
  }

  undo(): { document: SvgDocument; message: string } {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const edit = this.past.at(-1);
    if (!edit) throw new Error('nothing to undo');
    const document = edit.before();
    this.past.pop();
    this.future.push(edit);
    return { document, message: `${edit.name} undone; previous document restored` };
  }

  redo(): { document: SvgDocument; message: string } {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const edit = this.future.at(-1);
    if (!edit) throw new Error('nothing to redo');
    const document = edit.after();
    this.future.pop();
    this.past.push(edit);
    return { document, message: `${edit.name} redone; edited document restored` };
  }
}
