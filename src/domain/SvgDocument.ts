import { GroupShape } from './GroupShape.ts';
import type { Shape } from './Shape.ts';
import { Values } from './Values.ts';

export class SvgDocument {
  private widthValue: number;
  private heightValue: number;
  private readonly canvas = new GroupShape('');

  constructor(width = 800, height = 600) {
    this.widthValue = Values.positive(width, 'canvas width');
    this.heightValue = Values.positive(height, 'canvas height');
  }

  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }
  get root(): GroupShape { return this.canvas; }
  get count(): number { return this.canvas.descendants().length - 1; }
  has(id: string): boolean { return id !== '' && this.canvas.find(id) !== undefined; }
  find(id: string): Shape {
    const shape = id ? this.canvas.find(id) : undefined;
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  container(id: string): GroupShape {
    if (!this.has(id)) throw new Error(`no such container: ${id}`);
    const shape = this.find(id);
    if (!(shape instanceof GroupShape)) throw new Error(`not a container: ${id}`);
    return shape;
  }

  assertAvailable(id: string): void {
    Values.id(id);
    if (this.has(id)) throw new Error(`id already exists: ${id}`);
  }

  insert(shape: Shape, parent: GroupShape = this.root): void {
    const ids = new Set<string>();
    for (const node of shape.descendants()) {
      this.assertAvailable(node.id);
      if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id);
    }
    parent.add(shape);
  }

  resize(width: number, height: number): void {
    Values.positive(width, 'canvas width');
    Values.positive(height, 'canvas height');
    this.widthValue = width;
    this.heightValue = height;
  }

  group(id: string, ids: readonly string[]): void {
    this.assertAvailable(id);
    if (ids.length === 0 || new Set(ids).size !== ids.length) throw new Error('group requires distinct shape ids');
    const selected = ids.map(key => this.find(key));
    for (const ancestor of selected) {
      if (selected.some(other => other !== ancestor && ancestor.descendants().includes(other))) {
        throw new Error(`cannot group a container into its own descendant: ${ancestor.id}`);
      }
    }
    // Preserve original document order, regardless of argument order.
    const ordered = this.root.descendants().filter(node => selected.includes(node));
    const parent = ordered.every(node => node.parent === ordered[0]!.parent) ? ordered[0]!.parent! : this.root;
    const index = parent.children().indexOf(ordered[0]!);
    const group = new GroupShape(id);
    parent.add(group, index >= 0 ? index : parent.children().length);
    for (const shape of ordered) group.add(shape);
  }

  ungroup(id: string): void {
    const group = this.container(id);
    if (group.parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const parent = group.parent!;
    const index = parent.remove(group);
    group.children().forEach((child, offset) => parent.add(child, index + offset));
  }

  delete(id: string): void {
    const shape = this.find(id);
    shape.parent!.remove(shape);
  }

  reorder(id: string, front: boolean): void {
    const shape = this.find(id);
    const parent = shape.parent!;
    parent.remove(shape);
    parent.add(shape, front ? parent.children().length : 0);
  }

  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    for (const child of this.root.children()) copy.root.add(child.clone());
    return copy;
  }
}
