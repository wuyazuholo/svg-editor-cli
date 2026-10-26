import type { SvgDocument } from '../domain/SvgDocument.ts';

export interface ReversibleEdit {
  readonly name: string;
  before(): SvgDocument;
  after(): SvgDocument;
}
