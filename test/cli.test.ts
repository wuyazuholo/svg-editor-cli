import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SvgCodec } from '../src/io/SvgCodec.ts';

const entry = fileURLToPath(new URL('../src/cli/main.ts', import.meta.url));

test('real CLI replays course flowchart from stdin and produces a readable SVG with eight elements', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-cli-flow-'));
  try {
    const input = readFileSync(new URL('../examples/flowchart.commands', import.meta.url), 'utf8');
    const result = spawnSync(process.execPath, [entry], { input, cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /g#node2 moved by \(0,100\)/);
    assert.match(result.stdout, /move undone/);
    assert.match(result.stdout, /saved to flowchart.svg \(8 elements\)/);
    const document = new SvgCodec().decode(readFileSync(join(directory, 'flowchart.svg'), 'utf8')).document;
    assert.equal(document.count, 8);
    assert.equal(document.find('process').attributes().y, '100');
    assert.equal(document.find('process-label').content(), '处理数据 v2');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CLI continues after errors, keeps each error on one line and returns nonzero for failed scripts', () => {
  const result = spawnSync(process.execPath, [entry], {
    input: 'tree\ninit\ncreate g g\nmove missing 1 2\ntree\n', encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /error: no document\. use 'init' or 'read' first\ncanvas 800x600 created/);
  assert.match(result.stdout, /error: no such shape: missing\nsvg \(800x600\)\n└── g#g/);
});
