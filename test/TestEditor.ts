import assert from 'node:assert/strict';
import { EditorSession } from '../src/application/EditorSession.ts';
import { CommandEngine } from '../src/cli/CommandEngine.ts';
import { SvgCodec } from '../src/io/SvgCodec.ts';
import type { DocumentStore } from '../src/application/DocumentStore.ts';
import type { SvgDocument } from '../src/domain/SvgDocument.ts';

export class TestEditor implements DocumentStore {
  readonly session = new EditorSession(this);
  readonly engine = new CommandEngine(this.session);
  private readonly files = new Map<string, string>();
  failWrites = false;

  run(line: string): string[] { return this.engine.execute(line); }
  ok(line: string): string[] {
    const output = this.run(line);
    assert.ok(!output.some(value => value.startsWith('error:')), `${line}: ${output.join('\n')}`);
    return output;
  }
  error(line: string, expected: string): void { assert.deepEqual(this.run(line), [`error: ${expected}`]); }
  setup(...lines: string[]): this { for (const line of lines) this.ok(line); return this; }
  snapshot(): string { return new SvgCodec().encode(this.session.document); }
  attributes(id: string): Readonly<Record<string, string>> { return this.session.document.find(id).attributes(); }
  children(id?: string): string[] {
    return (id ? this.session.document.find(id) : this.session.document.root).children().map(shape => shape.id);
  }
  file(path: string, contents: string): void { this.files.set(path, contents); }
  read(path: string): ReturnType<DocumentStore['read']> {
    const xml = this.files.get(path);
    if (xml === undefined) throw new Error(`cannot read file: ${path}`);
    return new SvgCodec().decode(xml);
  }
  write(path: string, document: SvgDocument): void {
    if (this.failWrites) throw new Error(`cannot write file: ${path}`);
    this.files.set(path, new SvgCodec().encode(document));
  }
}
