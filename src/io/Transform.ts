import { Values } from '../domain/Values.ts';

export class Transform {
  private readonly zoom: number;
  private readonly offsetX: number;
  private readonly offsetY: number;
  constructor(scale = 1, x = 0, y = 0) {
    this.zoom = Values.positive(scale, 'transform scale');
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('transform overflow');
    this.offsetX = x;
    this.offsetY = y;
  }
  get scale(): number { return this.zoom; }
  get x(): number { return this.offsetX; }
  get y(): number { return this.offsetY; }
  combine(local: Transform): Transform {
    return new Transform(this.zoom * local.zoom, this.offsetX + this.zoom * local.offsetX,
      this.offsetY + this.zoom * local.offsetY);
  }
  static parse(source = ''): Transform {
    let result = new Transform();
    let rest = source.trim();
    while (rest) {
      const match = /^(translate|scale)\s*\(([^()]*)\)/.exec(rest);
      if (!match) throw new Error('unsupported transform; use translate and positive uniform scale');
      const raw = match[2]!.trim();
      if (!raw || /^,|,$|,\s*,/.test(raw)) throw new Error('invalid transform arguments');
      const args = raw.split(/[\s,]+/).map(value => Values.number(value, 'transform number'));
      Values.arity(args, 1, 2);
      // Transform syntax, not shape-type dispatch.
      if (match[1] === 'translate') result = result.combine(new Transform(1, args[0]!, args[1] ?? 0));
      else {
        if (args[1] !== undefined && args[1] !== args[0]) throw new Error('nonuniform scale is not supported');
        result = result.combine(new Transform(args[0]!));
      }
      rest = rest.slice(match[0].length).trimStart();
      if (rest.startsWith(',')) {
        rest = rest.slice(1).trimStart();
        if (!rest) throw new Error('invalid transform separator');
      }
    }
    return result;
  }
}
