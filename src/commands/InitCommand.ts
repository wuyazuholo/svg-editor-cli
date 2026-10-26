import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class InitCommand extends Command {
  readonly name = 'init';
  readonly usage = 'init [w] [h]';
  execute(args: readonly Token[], session: EditorSession): string[] {
    Values.arity(args, 0, 2);
    const width = args[0] ? Values.number(args[0].value, 'canvas width') : 800;
    const height = args[1] ? Values.number(args[1].value, 'canvas height') : 600;
    session.init(width, height);
    return [`canvas ${width}x${height} created`];
  }
}
