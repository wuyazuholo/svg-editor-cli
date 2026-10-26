import { EditingCommand } from './EditingCommand.ts';
import type { Token } from '../application/Token.ts';
import type { SvgDocument } from '../domain/SvgDocument.ts';
import { ShapeFactory } from '../domain/ShapeFactory.ts';
import { Values } from '../domain/Values.ts';

export class CreateCommand extends EditingCommand {
  readonly name = 'create';
  readonly usage = 'create <type> <id> [params...] [in <containerId>]';
  protected apply(document: SvgDocument, args: readonly Token[]): string[] {
    Values.arity(args, 2, Number.MAX_SAFE_INTEGER);
    const values = this.values(args);
    let parent = document.root;
    if (args.length >= 4 && args.at(-2)!.value === 'in' && !args.at(-2)!.quoted) {
      parent = document.container(values.at(-1)!);
      values.splice(-2);
    }
    const [type, id, ...params] = values;
    document.assertAvailable(id!);
    const shape = new ShapeFactory().create(type!, id!, params);
    document.insert(shape, parent);
    return [`${shape.tag}#${shape.id} created${parent === document.root ? '' : ` in g#${parent.id}`}`];
  }
}
