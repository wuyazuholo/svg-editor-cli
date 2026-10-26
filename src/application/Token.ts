export class Token {
  private readonly tokenValue: string;
  private readonly wasQuoted: boolean;
  constructor(value: string, quoted = false) { this.tokenValue = value; this.wasQuoted = quoted; }
  get value(): string { return this.tokenValue; }
  get quoted(): boolean { return this.wasQuoted; }
}
