import { Command } from './Command.ts';
import type { EditorSession } from '../application/EditorSession.ts';
import type { Token } from '../application/Token.ts';
import { Values } from '../domain/Values.ts';

export class CanvasCommand extends Command {
  readonly name = 'canvas';
  readonly usage = 'canvas [w h]';
  execute(args: readonly Token[], session: EditorSession): string[] {
    void session.document;
    if (args.length !== 0) {
      Values.arity(args, 2);
      session.resize(Values.number(args[0]!.value, 'canvas width'), Values.number(args[1]!.value, 'canvas height'));
    }
    return [`canvas ${session.document.width}x${session.document.height}`];
  }
}
