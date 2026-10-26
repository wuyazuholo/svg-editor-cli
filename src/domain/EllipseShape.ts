import { GeometryShape } from './GeometryShape.ts';

export class EllipseShape extends GeometryShape {
  readonly tag = 'ellipse';
  constructor(id: string) { super(id, { cx: 0, cy: 0, rx: 0, ry: 0 }, 'fill'); }
  move(dx: number, dy: number): void { this.shift('cx', 'cy', dx, dy); }
  clone(): EllipseShape { const copy = new EllipseShape(this.id); this.copyGeometry(copy); return copy; }
}
