export class Values {
  static number(value: string, label = 'number'): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) {
      throw new Error(`invalid ${label}: ${value}`);
    }
    const result = Number(value);
    if (!Number.isFinite(result)) throw new Error(`invalid ${label}: ${value}`);
    return result;
  }

  static nonnegative(value: number, label: string): number {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be nonnegative`);
    return value;
  }

  static positive(value: number, label: string): number {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive`);
    return value;
  }

  static arity(args: readonly unknown[], min: number, max = min): void {
    if (args.length < min || args.length > max) throw new Error('invalid arguments. use help for syntax');
  }

  static id(id: string): void {
    if (!id || /\s|[\u0000-\u001f]/u.test(id)) throw new Error(`invalid id: ${id}`);
  }

  static text(value: string): void {
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]|[\uD800-\uDFFF]/u.test(value)) {
      throw new Error('invalid XML character');
    }
  }
}
