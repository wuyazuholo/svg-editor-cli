import sax from 'sax';
import type { QualifiedTag } from 'sax';
import { SvgElement } from './SvgElement.ts';
import { Values } from '../domain/Values.ts';

export class SvgXmlReader {
  parse(xml: string): SvgElement {
    Values.text(xml);
    const parser = sax.parser(true, { xmlns: true });
    const stack: SvgElement[] = [];
    let root: SvgElement | undefined;
    parser.ondoctype = () => { throw new Error('DOCTYPE is not supported'); };
    parser.onerror = () => { throw new Error('malformed XML'); };
    parser.onopentag = raw => {
      const node = raw as QualifiedTag;
      if (node.uri && node.uri !== 'http://www.w3.org/2000/svg') throw new Error('unsupported XML namespace');
      const attrs: Record<string, string> = Object.create(null) as Record<string, string>;
      for (const attr of Object.values(node.attributes)) {
        if (attr.uri === 'http://www.w3.org/2000/xmlns/') continue;
        if (attr.uri) throw new Error(`unsupported namespaced attribute: ${attr.name}`);
        attrs[attr.local] = attr.value;
      }
      const element = new SvgElement(node.local, attrs);
      if (stack.length) stack.at(-1)!.add(element);
      else {
        if (root) throw new Error('multiple SVG roots');
        root = element;
      }
      stack.push(element);
    };
    parser.onclosetag = () => { stack.pop(); };
    parser.ontext = text => {
      if (stack.length) stack.at(-1)!.append(text);
      else if (text.trim()) throw new Error('text outside SVG root');
    };
    parser.oncdata = text => {
      if (!stack.length) throw new Error('CDATA outside SVG root');
      stack.at(-1)!.append(text);
    };
    parser.write(xml).close();
    if (!root || root.tag !== 'svg') throw new Error('expected svg root');
    return root;
  }
}
