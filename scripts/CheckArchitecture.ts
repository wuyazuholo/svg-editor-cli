import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export class CheckArchitecture {
  private readonly root = fileURLToPath(new URL('../src/', import.meta.url));
  private readonly allowed = new Map<string, readonly string[]>([
    ['domain', ['domain']], ['application', ['application', 'domain']],
    ['commands', ['commands', 'application', 'domain']],
    ['io', ['io', 'application', 'domain']],
    ['cli', ['cli', 'commands', 'application', 'io', 'domain']],
  ]);

  run(): void {
    const files = readdirSync(this.root, { recursive: true }).filter((path): path is string => typeof path === 'string')
      .filter(path => path.endsWith('.ts'));
    let checked = 0;
    const errors: string[] = [];
    for (const path of files) {
      const layer = path.split('/')[0]!;
      const source = readFileSync(resolve(this.root, path), 'utf8');
      const classes = [...source.matchAll(/export (?:abstract )?class (\w+)/g)].map(match => match[1]!);
      if (classes.length > 1 || (classes[0] && `${classes[0]}.ts` !== basename(path))) {
        errors.push(`${path}: class name must match the filename, one class per file`);
      }
      for (const match of source.matchAll(/\bimport\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
        const target = match[1]!;
        checked++;
        if (target.startsWith('.')) {
          const targetLayer = relative(this.root, resolve(dirname(resolve(this.root, path)), target)).split('/')[0]!;
          if (!this.allowed.get(layer)?.includes(targetLayer)) errors.push(`${path}: forbidden dependency on ${target}`);
        } else if (layer !== 'cli' && layer !== 'io') errors.push(`${path}: external dependency ${target} is not allowed`);
      }
    }
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`Architecture OK: ${files.length} source files, ${checked} imports; layer rules and class filenames checked.`);
  }
}

new CheckArchitecture().run();
