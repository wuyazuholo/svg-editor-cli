export class SvgElement {
  private readonly tagName: string;
  private readonly properties: Readonly<Record<string, string>>;
  private readonly nodes: SvgElement[] = [];
  private body = '';
  constructor(tag: string, attributes: Record<string, string>) {
    this.tagName = tag;
    this.properties = { ...attributes };
  }
  get tag(): string { return this.tagName; }
  get attributes(): Readonly<Record<string, string>> { return { ...this.properties }; }
  get text(): string { return this.body; }
  children(): readonly SvgElement[] { return [...this.nodes]; }
  add(child: SvgElement): void { this.nodes.push(child); }
  append(text: string): void { this.body += text; }
  descendants(): readonly SvgElement[] { return [this, ...this.nodes.flatMap(child => child.descendants())]; }
}
