import { GeometryShape } from './GeometryShape.ts';

export class CircleShape extends GeometryShape {
  readonly tag = 'circle';
  constructor(id: string) { super(id, { cx: 0, cy: 0, r: 0 }, 'fill'); }
  move(dx: number, dy: number): void { this.shift('cx', 'cy', dx, dy); }
  clone(): CircleShape { const copy = new CircleShape(this.id); this.copyGeometry(copy); return copy; }
}
