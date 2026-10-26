import type { Shape } from '../domain/Shape.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';

export class TreeFormatter {
  document(document: SvgDocument): string[] {
    return [`svg (${document.width}x${document.height})`, ...this.children(document.root)];
  }
  shape(shape: Shape): string[] { return [shape.describe(), ...this.children(shape)]; }
  private children(shape: Shape, prefix = ''): string[] {
    return shape.children().flatMap((child, index, children) => {
      const last = index === children.length - 1;
      return [`${prefix}${last ? '└── ' : '├── '}${child.describe()}`,
        ...this.children(child, `${prefix}${last ? '    ' : '│   '}`)];
    });
  }
}
