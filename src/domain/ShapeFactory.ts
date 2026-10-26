import { Shape } from './Shape.ts';
import { RectShape } from './RectShape.ts';
import { CircleShape } from './CircleShape.ts';
import { EllipseShape } from './EllipseShape.ts';
import { LineShape } from './LineShape.ts';
import { TextShape } from './TextShape.ts';
import { GroupShape } from './GroupShape.ts';
import { Values } from './Values.ts';

export class ShapeFactory {
  // Phase-one type dispatch point; future ShapeProvider registration belongs here.
  private readonly types = new Map<string, new (id: string) => Shape>([
    ['rect', RectShape], ['circle', CircleShape], ['ellipse', EllipseShape],
    ['line', LineShape], ['text', TextShape], ['g', GroupShape],
  ]);

  empty(type: string, id: string): Shape {
    Values.id(id);
    const Constructor = this.types.get(type);
    if (!Constructor) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return new Constructor(id);
  }

  create(type: string, id: string, args: readonly string[]): Shape {
    const shape = this.empty(type, id);
    shape.configure(args);
    return shape;
  }
}
