import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SvgCodec } from '../src/io/SvgCodec.ts';
import { NodeDocumentStore } from '../src/io/NodeDocumentStore.ts';
import { TestEditor } from './TestEditor.ts';

test('course external SVG receives rect1 and retains seven elements', () => {
  const xml = readFileSync(new URL('../examples/other.svg', import.meta.url), 'utf8');
  const decoded = new SvgCodec().decode(xml);
  assert.equal(decoded.document.count, 7);
  assert.deepEqual(decoded.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
});

test('missing ids reserve all explicit ids before assignment, including later siblings', () => {
  const result = new SvgCodec().decode('<svg><rect/><g><rect id="rect1"/><g/></g><rect/></svg>');
  assert.deepEqual(result.warnings, ['warning: assigned id rect2 to unnamed <rect>',
    'warning: assigned id g1 to unnamed <g>', 'warning: assigned id g2 to unnamed <g>',
    'warning: assigned id rect3 to unnamed <rect>']);
  assert.equal(result.document.count, 5);
});

test('all six types, Unicode, XML entities and empty text survive save/read/save exactly', () => {
  const e = new TestEditor().setup('init 123.5 456.25', 'create g scene',
    'create rect r 1 2 3 4 red in scene', 'create circle c 3 4 5 in scene',
    'create ellipse e 3 4 5 6 in scene', 'create line l 0 1 2 3 black in scene',
    'create text t 0 0 "中文 & < >" in scene', 'create text empty 0 0 "" in scene');
  const codec = new SvgCodec();
  const before = e.snapshot();
  const decoded = codec.decode(before);
  assert.equal(codec.encode(decoded.document), before);
  assert.equal(decoded.document.find('t').content(), '中文 & < >');
  assert.deepEqual(decoded.warnings, []);
});

test('nested translate/scale normalize in SVG order; text typography and stroke render scale are retained', () => {
  const result = new SvgCodec().decode('<svg width="400" height="200"><g id="g" transform="translate(60,40)" stroke="black" stroke-width="2"><g id="n" transform="translate(200,0) scale(0.8)"><rect id="r" width="120" height="60"/><text id="t" x="60" y="38" text-anchor="middle" font-size="16">End</text></g></g></svg>');
  const attrs = result.document.find('r').attributes();
  assert.equal(attrs.x, '260');
  assert.equal(attrs.y, '40');
  assert.equal(attrs.width, '96');
  assert.equal(attrs['stroke-width'], '1.6');
  assert.equal(result.document.find('t').attributes()['font-size'], '12.8');
  const codec = new SvgCodec();
  const first = codec.encode(result.document);
  assert.equal(codec.encode(codec.decode(first).document), first);
});

test('read preserves group fill inheritance without copying fill onto children', () => {
  const result = new SvgCodec().decode('<svg><g id="g" fill="red"><rect id="r" width="1" height="1"/></g></svg>');
  assert.equal(result.document.find('r').attributes().fill, undefined);
  result.document.find('g').set('fill', 'blue');
  assert.match(new SvgCodec().encode(result.document), /g id="g" fill="blue"/);
});

test('unknown composite metadata degrades to a normal editable group with a warning', () => {
  const result = new SvgCodec().decode('<svg><g id="box" data-kind="box"><rect id="r"/></g></svg>');
  assert.deepEqual(result.warnings, ['warning: treating data-kind=box as ordinary g']);
  result.document.find('box').move(10, 20);
  assert.equal(result.document.find('r').attributes().x, '10');
});

test('CDATA, escaped whitespace and quote attributes survive XML serialization', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<svg><text id="t"><![CDATA[a<&\n中文]]></text><rect id="r" fill="a&quot;b"/></svg>');
  const again = codec.decode(codec.encode(result.document));
  assert.equal(again.document.find('t').content(), 'a<&\n中文');
  assert.equal(again.document.find('r').attributes().fill, 'a"b');
});

for (const [label, xml] of [
  ['duplicate id', '<svg><g id="same"><rect id="same"/></g></svg>'],
  ['empty id', '<svg><rect id=""/></svg>'],
  ['malformed XML', '<svg><rect></svg>'],
  ['extra roots', '<svg/><svg/>'],
  ['unsupported shape', '<svg><path id="p" d="M0 0"/></svg>'],
  ['unsupported attribute', '<svg><rect id="r" onclick="x"/></svg>'],
  ['DTD', '<!DOCTYPE svg [<!ENTITY x "abc">]><svg/>'],
  ['invalid namespace', '<svg xmlns="https://example.org"/>'],
  ['invalid root', '<g/>'],
  ['unsupported viewBox', '<svg width="400" height="200" viewBox="10 0 400 200"/>'],
  ['rotation', '<svg><g transform="rotate(10)"/></svg>'],
  ['nonuniform scale', '<svg><g transform="scale(2,3)"/></svg>'],
  ['unexpected children', '<svg><rect><circle/></rect></svg>'],
  ['non-SVG text', '<svg>stray</svg>'],
  ['nonfinite coordinate', '<svg><circle cx="1e999"/></svg>'],
  ['control character', '<svg><text id="t">\u0001</text></svg>'],
] as const) {
  test(`reject ${label}; failed read preserves state and undo`, () => {
    const e = new TestEditor().setup('init', 'create g previous');
    const before = e.snapshot();
    e.file('bad.svg', xml);
    assert.match(e.run('read bad.svg')[0]!, /^error:/);
    assert.equal(e.snapshot(), before);
    e.ok('undo');
    assert.equal(e.session.document.count, 0);
  });
}

test('real filesystem read/write, read errors and write errors preserve existing files and clean temporary files', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-test-'));
  try {
    const store = new NodeDocumentStore();
    const e = new TestEditor().setup('init', 'create text t 1 2 "file test"');
    const path = join(directory, 'document with spaces.svg');
    store.write(path, e.session.document);
    assert.equal(store.read(path).document.find('t').content(), 'file test');
    assert.throws(() => store.read(join(directory, 'absent.svg')), /cannot read file:/);
    assert.throws(() => store.write(join(directory, 'missing', 'x.svg'), e.session.document), /cannot write file:/);
    const contents = readFileSync(path, 'utf8');
    assert.throws(() => store.write(directory, e.session.document), /cannot write file:/);
    assert.equal(readFileSync(path, 'utf8'), contents);
    assert.deepEqual(readdirSync(directory), ['document with spaces.svg']);
    writeFileSync(path, '<svg><unclosed>');
    assert.throws(() => store.read(path), /invalid SVG:/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
