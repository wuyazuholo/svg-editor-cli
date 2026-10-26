import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore } from '../application/DocumentStore.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { SvgCodec } from './SvgCodec.ts';

export class NodeDocumentStore implements DocumentStore {
  private readonly codec = new SvgCodec();
  read(path: string): ReturnType<DocumentStore['read']> {
    let xml: string;
    try { xml = readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
    try { return this.codec.decode(xml); }
    catch (error) { throw new Error(`invalid SVG: ${error instanceof Error ? error.message : String(error)}`); }
  }
  write(path: string, document: SvgDocument): void {
    const xml = this.codec.encode(document);
    const temporary = join(dirname(path), `.svg-editor-${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, xml, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, path);
    } catch {
      throw new Error(`cannot write file: ${path}`);
    } finally {
      rmSync(temporary, { force: true });
    }
  }
}
