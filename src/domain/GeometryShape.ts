import { Shape } from './Shape.ts';
import { Values } from './Values.ts';

export abstract class GeometryShape extends Shape {
  private readonly geometry: Map<string, number>;
  private readonly paint: 'fill' | 'stroke' | undefined;
  private static readonly sizes = new Set(['width', 'height', 'r', 'rx', 'ry']);

  constructor(id: string, defaults: Record<string, number>, paint?: 'fill' | 'stroke') {
    super(id);
    this.geometry = new Map(Object.entries(defaults));
    this.paint = paint;
  }

  configure(args: readonly string[]): void {
    Values.arity(args, this.geometry.size, this.geometry.size + (this.paint ? 1 : 0));
    [...this.geometry.keys()].forEach((key, i) => this.set(key, args[i]!));
    if (this.paint && args.length > this.geometry.size) this.set(this.paint, args.at(-1)!);
  }

  override set(attribute: string, value: string): void {
    if (!this.geometry.has(attribute)) return super.set(attribute, value);
    const number = Values.number(value, attribute);
    if (GeometryShape.sizes.has(attribute)) Values.nonnegative(number, attribute);
    this.geometry.set(attribute, number);
  }

  override attributes(): Readonly<Record<string, string>> {
    return { ...super.attributes(), ...Object.fromEntries([...this.geometry].map(([k, v]) => [k, String(v)])) };
  }

  override scale(factor: number): void {
    Values.positive(factor, 'scale factor');
    for (const [key, value] of this.geometry) {
      const scaled = value * factor;
      if (!Number.isFinite(scaled)) throw new Error('geometry overflow');
      this.geometry.set(key, scaled);
    }
  }

  protected shift(x: string, y: string, dx: number, dy: number): void {
    const nx = this.geometry.get(x)! + dx;
    const ny = this.geometry.get(y)! + dy;
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) throw new Error('geometry overflow');
    this.geometry.set(x, nx);
    this.geometry.set(y, ny);
  }

  protected copyGeometry(target: GeometryShape): void {
    for (const [key, value] of this.geometry) target.set(key, String(value));
    this.copyAppearance(target);
  }
}
