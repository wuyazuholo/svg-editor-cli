import { GeometryShape } from './GeometryShape.ts';

export class RectShape extends GeometryShape {
  readonly tag = 'rect';
  constructor(id: string) { super(id, { x: 0, y: 0, width: 0, height: 0 }, 'fill'); }
  move(dx: number, dy: number): void { this.shift('x', 'y', dx, dy); }
  clone(): RectShape { const copy = new RectShape(this.id); this.copyGeometry(copy); return copy; }
}
