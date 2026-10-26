import { GeometryShape } from './GeometryShape.ts';

export class LineShape extends GeometryShape {
  readonly tag = 'line';
  constructor(id: string) { super(id, { x1: 0, y1: 0, x2: 0, y2: 0 }, 'stroke'); }
  move(dx: number, dy: number): void { this.shift('x1', 'y1', dx, dy); this.shift('x2', 'y2', dx, dy); }
  clone(): LineShape { const copy = new LineShape(this.id); this.copyGeometry(copy); return copy; }
}
