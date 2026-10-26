import { Token } from '../application/Token.ts';

export class Lexer {
  tokenize(line: string): Token[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: Token[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/u.test(line[index]!)) { index++; continue; }
      let value = '';
      const quoted = line[index] === '"';
      if (quoted) {
        index++;
        let closed = false;
        while (index < line.length) {
          const char = line[index++]!;
          if (char === '"') { closed = true; break; }
          if (char === '\\' && ['"', '\\'].includes(line[index] ?? '')) value += line[index++]!;
          else value += char;
        }
        if (!closed) throw new Error('unterminated double quote');
        if (index < line.length && !/\s/u.test(line[index]!)) throw new Error('expected space after closing quote');
      } else {
        while (index < line.length && !/\s/u.test(line[index]!)) {
          if (line[index] === '"') throw new Error('quote must start a parameter');
          value += line[index++];
        }
      }
      tokens.push(new Token(value, quoted));
    }
    return tokens;
  }
}
