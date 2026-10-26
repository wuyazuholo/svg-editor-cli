import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class HelpCommand extends Command {
  readonly name = 'help';
  readonly usage = 'help';
  private readonly usages: () => string[];
  constructor(usages: () => string[]) { super(); this.usages = usages; }
  execute(args: readonly Token[], _session: EditorSession): string[] {
    Values.arity(args, 0);
    return [...this.usages(), '', 'create parameters:',
      '  rect <id> <x> <y> <w> <h> [fill]', '  circle <id> <cx> <cy> <r> [fill]',
      '  ellipse <id> <cx> <cy> <rx> <ry> [fill]', '  line <id> <x1> <y1> <x2> <y2> [stroke]',
      '  text <id> <x> <y> "content"', '  g <id>',
      'Every create supports [in <containerId>].',
      'set: fill, stroke, stroke-width; type geometry; text content via text.',
      'Comments begin with # at the start of a line. Quit with Ctrl-D (EOF).'];
  }
}
