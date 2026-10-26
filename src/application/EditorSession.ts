import { SvgDocument } from '../domain/SvgDocument.ts';
import { History } from './History.ts';
import type { DocumentStore } from './DocumentStore.ts';
import type { ReversibleEdit } from './ReversibleEdit.ts';

export class EditorSession {
  private current: SvgDocument | null = null;
  private path: string | undefined;
  private readonly history = new History();
  private readonly store: DocumentStore;

  constructor(store: DocumentStore) { this.store = store; }
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }

  init(width: number, height: number): void {
    const candidate = new SvgDocument(width, height);
    this.current = candidate;
    this.path = undefined;
    this.history.barrier();
  }

  read(path: string): string[] {
    const result = this.store.read(path);
    this.current = result.document;
    this.path = path;
    this.history.barrier();
    return [...result.warnings, `read ${path} (${result.document.count} elements)`];
  }

  save(path?: string): string {
    const document = this.document;
    const target = path ?? this.path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    this.store.write(target, document);
    this.path = target;
    this.history.barrier();
    return `saved to ${target} (${document.count} elements)`;
  }

  resize(width: number, height: number): void {
    this.document.resize(width, height);
    this.history.barrier();
  }

  commit(document: SvgDocument, edit: ReversibleEdit): void {
    this.current = document;
    this.history.record(edit);
  }

  undo(): string {
    void this.document;
    const result = this.history.undo();
    this.current = result.document;
    return result.message;
  }

  redo(): string {
    void this.document;
    const result = this.history.redo();
    this.current = result.document;
    return result.message;
  }
}
