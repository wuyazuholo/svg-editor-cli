import { Shape } from './Shape.ts';
import { Values } from './Values.ts';

export class GroupShape extends Shape {
  readonly tag = 'g';
  private readonly members: Shape[] = [];
  configure(args: readonly string[]): void { Values.arity(args, 0); }
  override children(): readonly Shape[] { return [...this.members]; }
  override descendants(): readonly Shape[] { return [this, ...this.members.flatMap(child => child.descendants())]; }
  override find(id: string): Shape | undefined {
    return super.find(id) ?? this.members.map(child => child.find(id)).find(Boolean);
  }

  add(child: Shape, index = this.members.length): void {
    if (child === this || child.descendants().includes(this)) {
      throw new Error(`cannot group a container into its own descendant: ${child.id}`);
    }
    if (index < 0 || index > this.members.length) throw new Error('invalid child position');
    child.parent?.remove(child);
    this.members.splice(Math.min(index, this.members.length), 0, child);
    child.attach(this);
  }

  remove(child: Shape): number {
    const index = this.members.indexOf(child);
    if (index < 0) throw new Error(`no such child: ${child.id}`);
    this.members.splice(index, 1);
    child.attach(null);
    return index;
  }

  move(dx: number, dy: number): void { for (const child of this.members) child.move(dx, dy); }
  scale(factor: number): void {
    Values.positive(factor, 'scale factor');
    for (const child of this.members) child.scale(factor);
  }
  clone(): GroupShape {
    const copy = new GroupShape(this.id);
    this.copyAppearance(copy);
    for (const child of this.members) copy.add(child.clone());
    return copy;
  }
}
