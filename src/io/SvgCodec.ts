import { SvgDocument } from '../domain/SvgDocument.ts';
import { GroupShape } from '../domain/GroupShape.ts';
import { ShapeFactory } from '../domain/ShapeFactory.ts';
import type { Shape } from '../domain/Shape.ts';
import { Values } from '../domain/Values.ts';
import type { SvgElement } from './SvgElement.ts';
import { SvgXmlReader } from './SvgXmlReader.ts';
import { Transform } from './Transform.ts';

export class SvgCodec {
  private readonly factory = new ShapeFactory();
  decode(xml: string): { document: SvgDocument; warnings: string[] } {
    const root = new SvgXmlReader().parse(xml);
    const attrs = root.attributes;
    const width = Values.number(attrs.width ?? '800', 'canvas width');
    const height = Values.number(attrs.height ?? '600', 'canvas height');
    const document = new SvgDocument(width, height);
    for (const key of Object.keys(attrs)) {
      if (!['width', 'height', 'viewBox', 'version', 'id'].includes(key)) throw new Error(`unsupported svg attribute: ${key}`);
    }
    if (attrs.viewBox) {
      const viewBox = attrs.viewBox.trim().split(/[\s,]+/).map(value => Values.number(value, 'viewBox'));
      if (viewBox.length !== 4 || viewBox[0] !== 0 || viewBox[1] !== 0 || viewBox[2] !== width || viewBox[3] !== height) {
        throw new Error('viewBox must match 0 0 width height');
      }
    }
    if (root.text.trim()) throw new Error('unexpected text inside svg');
    const elements = root.children().flatMap(child => child.descendants());
    const reserved = new Set<string>();
    for (const element of elements) {
      const id = element.attributes.id;
      if (id === undefined) continue;
      Values.id(id);
      if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
      reserved.add(id);
    }
    const warnings: string[] = [];
    const ids = new Map<SvgElement, string>();
    const counters = new Map<string, number>();
    for (const element of elements) {
      let id = element.attributes.id;
      if (id === undefined) {
        let n = counters.get(element.tag) ?? 0;
        do { id = `${element.tag}${++n}`; } while (reserved.has(id));
        counters.set(element.tag, n);
        reserved.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${element.tag}>`);
      }
      ids.set(element, id);
    }
    for (const element of root.children()) {
      document.insert(this.readShape(element, ids, new Transform(), {}, warnings));
    }
    return { document, warnings };
  }

  encode(document: SvgDocument): string {
    return ['<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">`,
      ...document.root.children().map(shape => this.writeShape(shape, 1)), '</svg>', ''].join('\n');
  }

  private readShape(element: SvgElement, ids: Map<SvgElement, string>, inheritedTransform: Transform,
    inheritedPaint: Readonly<Record<string, string>>, warnings: string[]): Shape {
    const attrs = element.attributes;
    const shape = this.factory.empty(element.tag, ids.get(element)!);
    const transform = inheritedTransform.combine(Transform.parse(attrs.transform));
    const paint: Record<string, string> = { ...inheritedPaint };
    for (const key of ['fill', 'stroke', 'stroke-width']) if (attrs[key] !== undefined) paint[key] = attrs[key]!;
    for (const [key, value] of Object.entries(attrs)) {
      if (['id', 'transform'].includes(key)) continue;
      if (key === 'data-kind' && shape instanceof GroupShape) {
        warnings.push(`warning: treating data-kind=${value} as ordinary g`);
        continue;
      }
      shape.readAttribute(key, value);
    }
    if (shape instanceof GroupShape) {
      if (element.text.trim()) throw new Error('unexpected text inside g');
      for (const child of element.children()) shape.add(this.readShape(child, ids, transform, paint, warnings));
    } else {
      if (element.children().length) throw new Error(`children are not supported inside ${shape.tag}`);
      if (shape.content() !== null) shape.set('text', element.text);
      else if (element.text.trim()) throw new Error(`unexpected text inside ${shape.tag}`);
      shape.scale(transform.scale);
      shape.move(transform.x, transform.y);
      // Keep fill/stroke inheritance. Only flatten scaled stroke widths when necessary.
      if (transform.scale !== 1 && paint['stroke-width'] !== undefined) {
        shape.set('stroke-width', String(Values.number(paint['stroke-width'], 'stroke-width') * transform.scale));
      }
      const fontSize = shape.attributes()['font-size'];
      if (fontSize !== undefined) shape.readAttribute('font-size', String(Values.number(fontSize) * transform.scale));
    }
    return shape;
  }

  private writeShape(shape: Shape, depth: number): string {
    const padding = '  '.repeat(depth);
    const attrs = Object.entries(shape.attributes()).map(([key, value]) => `${key}="${this.escape(value)}"`).join(' ');
    if (shape instanceof GroupShape && shape.children().length) {
      return [`${padding}<${shape.tag} ${attrs}>`, ...shape.children().map(child => this.writeShape(child, depth + 1)),
        `${padding}</${shape.tag}>`].join('\n');
    }
    // Text elements are always paired, including the empty-text case.
    const content = shape.content();
    if (content !== null) return `${padding}<${shape.tag} ${attrs}>${this.escape(content)}</${shape.tag}>`;
    return `${padding}<${shape.tag} ${attrs}/>`;
  }

  private escape(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&apos;').replaceAll('\r', '&#13;')
      .replaceAll('\n', '&#10;').replaceAll('\t', '&#9;');
  }
}
