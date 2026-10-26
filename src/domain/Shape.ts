import type { GroupShape } from './GroupShape.ts';
import { Values } from './Values.ts';

export abstract class Shape {
  private readonly identifier: string;
  private owner: GroupShape | null = null;
  private readonly appearance = new Map<string, string>();
  abstract readonly tag: string;

  constructor(id: string) {
    // An empty id is used only by the internal canvas root.
    if (id !== '') Values.id(id);
    Values.text(id);
    this.identifier = id;
  }

  get id(): string { return this.identifier; }
  get parent(): GroupShape | null { return this.owner; }

  attach(parent: GroupShape | null): void {
    this.owner = parent;
  }

  set(attribute: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      throw new Error(`unknown attribute: ${attribute}`);
    }
    Values.text(value);
    if (attribute === 'stroke-width') Values.nonnegative(Values.number(value, attribute), attribute);
    this.appearance.set(attribute, value);
  }

  attributes(): Readonly<Record<string, string>> {
    return { id: this.id, ...Object.fromEntries(this.appearance) };
  }

  content(): string { return ''; }
  children(): readonly Shape[] { return []; }
  find(id: string): Shape | undefined { return this.id === id ? this : undefined; }
  descendants(): readonly Shape[] { return [this]; }
  abstract configure(args: readonly string[]): void;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;

  describe(): string {
    const details = Object.entries(this.attributes()).filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key}=${value}`).join(' ');
    return `${this.tag}#${this.id}${details ? `  ${details}` : ''}`;
  }

  protected copyAppearance(target: Shape): void {
    for (const [key, value] of this.appearance) target.set(key, value);
  }
}
