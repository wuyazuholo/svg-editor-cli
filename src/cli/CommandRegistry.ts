import type { Command } from '../commands/Command.ts';
import { CreateCommand } from '../commands/CreateCommand.ts';
import { DeleteCommand } from '../commands/DeleteCommand.ts';
import { MoveCommand } from '../commands/MoveCommand.ts';
import { ScaleCommand } from '../commands/ScaleCommand.ts';
import { SetCommand } from '../commands/SetCommand.ts';
import { GroupCommand } from '../commands/GroupCommand.ts';
import { UngroupCommand } from '../commands/UngroupCommand.ts';
import { AddToCommand } from '../commands/AddToCommand.ts';
import { FrontCommand } from '../commands/FrontCommand.ts';
import { BackCommand } from '../commands/BackCommand.ts';
import { InitCommand } from '../commands/InitCommand.ts';
import { ReadCommand } from '../commands/ReadCommand.ts';
import { SaveCommand } from '../commands/SaveCommand.ts';
import { CanvasCommand } from '../commands/CanvasCommand.ts';
import { UndoCommand } from '../commands/UndoCommand.ts';
import { RedoCommand } from '../commands/RedoCommand.ts';
import { TreeCommand } from '../commands/TreeCommand.ts';
import { ShowCommand } from '../commands/ShowCommand.ts';
import { HelpCommand } from '../commands/HelpCommand.ts';

export class CommandRegistry {
  // Phase-one command-name dispatch point; constructs a fresh Command per invocation.
  private readonly commands = new Map<string, () => Command>();
  constructor() {
    const constructors = [InitCommand, ReadCommand, SaveCommand, CanvasCommand, CreateCommand,
      DeleteCommand, MoveCommand, ScaleCommand, SetCommand, GroupCommand, UngroupCommand,
      AddToCommand, FrontCommand, BackCommand, TreeCommand, ShowCommand, UndoCommand, RedoCommand];
    for (const Constructor of constructors) this.commands.set(new Constructor().name, () => new Constructor());
    this.commands.set('help', () => new HelpCommand(() => this.usages()));
  }
  create(name: string): Command {
    const create = this.commands.get(name);
    if (!create) throw new Error(`unknown command: ${name}`);
    return create();
  }
  usages(): string[] { return [...this.commands.values()].map(create => create().usage); }
}
