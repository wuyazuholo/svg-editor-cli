import { GeometryShape } from './GeometryShape.ts';
import { Values } from './Values.ts';

export class TextShape extends GeometryShape {
  readonly tag = 'text';
  private text = '';
  constructor(id: string) { super(id, { x: 0, y: 0 }); }
  override configure(args: readonly string[]): void {
    Values.arity(args, 3);
    super.configure(args.slice(0, 2));
    this.set('text', args[2]!);
  }
  override set(attribute: string, value: string): void {
    if (attribute !== 'text') return super.set(attribute, value);
    Values.text(value);
    this.text = value;
  }
  override content(): string { return this.text; }
  override describe(): string { return `${super.describe()} ${JSON.stringify(this.text)}`; }
  move(dx: number, dy: number): void { this.shift('x', 'y', dx, dy); }
  clone(): TextShape {
    const copy = new TextShape(this.id);
    this.copyGeometry(copy);
    copy.set('text', this.text);
    return copy;
  }
}
