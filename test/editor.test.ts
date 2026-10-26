import test from 'node:test';
import assert from 'node:assert/strict';
import { TestEditor } from './TestEditor.ts';

test('help and comments work before a document exists; all 19 commands are listed', () => {
  const e = new TestEditor();
  assert.equal(e.ok('help').slice(0, 19).length, 19);
  assert.deepEqual(e.run('  # comment'), []);
  assert.deepEqual(e.run('  '), []);
  for (const command of ['tree', 'show x', 'create g x', 'move x 1 2', 'canvas', 'undo', 'redo', 'save x.svg']) {
    e.error(command, "no document. use 'init' or 'read' first");
  }
});

test('six types, optional paint defaults, case-sensitive ids and text with spaces', () => {
  const e = new TestEditor().setup('init', 'create rect r 1 2 3 4', 'create circle R 5 6 7 red',
    'create ellipse e 1 2 3 4 blue', 'create line l 1 2 3 4 black', 'create text t 5 6 "Hello world"', 'create g g');
  assert.equal(e.session.document.count, 6);
  assert.equal(e.attributes('r').fill, undefined);
  assert.equal(e.attributes('R').fill, 'red');
  assert.equal(e.session.document.find('t').content(), 'Hello world');
  e.error('create box b 0 0 2 2 "title"', 'unknown shape type: box (is the plugin loaded?)');
  e.error('create rect r 0 0 1 1', 'id already exists: r');
});

test('quoted text in/empty/escapes cannot be confused with parent suffix or comments', () => {
  const e = new TestEditor().setup('init', 'create g scene', 'create text a 0 0 "in"',
    'create text b 0 0 "" in scene', 'create text c 0 0 "a \\"quote\\" & <标签>"',
    'create rect r 0 0 1 1 #abcdef');
  assert.equal(e.session.document.find('a').content(), 'in');
  assert.equal(e.session.document.find('b').content(), '');
  assert.equal(e.session.document.find('c').content(), 'a "quote" & <标签>');
  assert.equal(e.attributes('r').fill, '#abcdef');
  e.error('set a text "unterminated', 'unterminated double quote');
});

test('create in reports missing or non-container destinations without changing state', () => {
  const e = new TestEditor().setup('init', 'create rect r 0 0 1 1');
  const before = e.snapshot();
  e.error('create g x in missing', 'no such container: missing');
  e.error('create g x in r', 'not a container: r');
  assert.equal(e.snapshot(), before);
});

test('move and scale apply uniformly to every descendant and every geometric field', () => {
  const e = new TestEditor().setup('init', 'create g outer', 'create g inner in outer',
    'create rect r 1 2 3 4 in inner', 'create circle c 1 2 3 in outer',
    'create ellipse e 1 2 3 4 in outer', 'create line l 1 2 3 4 in outer', 'create text t 1 2 "hi" in outer');
  e.ok('move outer 10 20');
  e.ok('scale outer 2');
  assert.deepEqual(e.attributes('r'), { id: 'r', x: '22', y: '44', width: '6', height: '8' });
  assert.equal(e.attributes('c').r, '6');
  assert.equal(e.attributes('e').ry, '8');
  assert.equal(e.attributes('l').x2, '26');
  assert.equal(e.attributes('l').y2, '48');
  assert.equal(e.attributes('t').x, '22');
  e.error('scale outer 0', 'scale factor must be positive');
  e.error('scale outer -2', 'scale factor must be positive');
});

test('set permits geometry/appearance/text, rejects cross-type and unknown fields', () => {
  const e = new TestEditor().setup('init', 'create g g', 'create rect r 1 2 3 4 in g', 'create text t 1 2 "x"');
  e.setup('set r width 8.5', 'set r stroke-width 2', 'set g fill blue', 'set t text "中文 & symbols"');
  assert.equal(e.attributes('r').width, '8.5');
  assert.equal(e.attributes('g').fill, 'blue');
  e.error('set r r 2', 'unknown attribute: r');
  e.error('set r id other', 'unknown attribute: id');
  e.error('set r width -1', 'width must be nonnegative');
  e.error('set r stroke-width -1', 'stroke-width must be nonnegative');
});

test('group preserves original order despite reversed arguments; a whole group is one undo unit', () => {
  const e = new TestEditor().setup('init', 'create g parent', 'create g left in parent',
    'create rect a 0 0 1 1 in left', 'create circle b 0 0 1 in left', 'create g right in parent',
    'create text c 0 0 "c" in right');
  const before = e.snapshot();
  e.ok('group merged c b a');
  assert.deepEqual(e.children('merged'), ['a', 'b', 'c']);
  assert.deepEqual(e.children(), ['parent', 'merged']);
  e.ok('undo');
  assert.equal(e.snapshot(), before);
  e.ok('redo');
  assert.deepEqual(e.children('merged'), ['a', 'b', 'c']);
});

test('group of siblings occupies first selected position; ungroup promotes in place', () => {
  const e = new TestEditor().setup('init', 'create g outer', 'create rect a 0 0 1 1 in outer',
    'create rect b 0 0 1 1 in outer', 'create rect c 0 0 1 1 in outer', 'group inner c a');
  assert.deepEqual(e.children('outer'), ['inner', 'b']);
  assert.deepEqual(e.children('inner'), ['a', 'c']);
  e.ok('ungroup inner');
  assert.deepEqual(e.children('outer'), ['a', 'c', 'b']);
  e.ok('undo');
  assert.deepEqual(e.children('outer'), ['inner', 'b']);
  e.error('ungroup outer', 'cannot ungroup top-level container: outer');
});

test('ancestor grouping and addto cycles are rejected atomically', () => {
  const e = new TestEditor().setup('init', 'create g a', 'create g b in a', 'create rect c 0 0 1 1 in b');
  const before = e.snapshot();
  e.error('group bad c a', 'cannot group a container into its own descendant: a');
  e.error('addto b a', 'cannot group a container into its own descendant: a');
  e.error('addto a a', 'cannot group a container into its own descendant: a');
  e.error('group bad c c', 'group requires distinct shape ids');
  assert.equal(e.snapshot(), before);
});

test('addto appends; front/back affect siblings only; delete removes a complete subtree', () => {
  const e = new TestEditor().setup('init', 'create g outer', 'create g inner in outer',
    'create rect a 0 0 1 1 in inner', 'create rect b 0 0 1 1 in inner', 'create rect c 0 0 1 1',
    'addto inner c', 'back c');
  assert.deepEqual(e.children('inner'), ['c', 'a', 'b']);
  const backSnapshot = e.snapshot();
  e.ok('front c');
  assert.deepEqual(e.children('inner'), ['a', 'b', 'c']);
  e.ok('undo');
  assert.equal(e.snapshot(), backSnapshot);
  e.ok('redo');
  assert.deepEqual(e.children('inner'), ['a', 'b', 'c']);
  const before = e.snapshot();
  e.ok('delete inner');
  assert.equal(e.session.document.has('a'), false);
  e.ok('undo');
  assert.equal(e.snapshot(), before);
});

test('display commands do not enter history; a successful new edit clears redo', () => {
  const e = new TestEditor().setup('init', 'create rect r 1 2 3 4', 'move r 10 20', 'undo');
  e.setup('tree', 'tree r', 'show r', 'help', 'canvas', 'redo');
  assert.equal(e.attributes('r').x, '11');
  e.setup('undo', 'set r fill red');
  e.error('redo', 'nothing to redo');
});

test('failed edit does not clear redo; a partial numeric overflow rolls back all descendants', () => {
  const e = new TestEditor().setup('init', 'create g g', 'create rect r 1 2 3 4 in g',
    'create circle c 1e308 0 1 in g', 'set r fill red', 'undo');
  const before = e.snapshot();
  e.error('scale g 10', 'geometry overflow');
  assert.equal(e.snapshot(), before);
  e.ok('redo');
  assert.equal(e.attributes('r').fill, 'red');
});

for (const barrier of ['init 400 300', 'save x.svg', 'canvas 400 300', 'read source.svg']) {
  test(`successful ${barrier} blocks undo/redo until next edit`, () => {
    const e = new TestEditor().setup('init', 'create rect r 1 2 3 4');
    e.file('source.svg', e.snapshot());
    e.ok(barrier);
    e.error('undo', 'undo not allowed after io command');
    e.error('redo', 'undo not allowed after io command');
    const before = e.snapshot();
    e.setup('create g new', 'undo');
    assert.equal(e.snapshot(), before);
    e.error('undo', 'nothing to undo');
  });
}

test('failed init/read/save/canvas preserve document, filename and existing redo history', () => {
  const e = new TestEditor().setup('init', 'create rect r 1 2 3 4', 'save original.svg', 'move r 10 0', 'undo');
  const before = e.snapshot();
  e.error('init -1 2', 'canvas width must be positive');
  e.error('read absent.svg', 'cannot read file: absent.svg');
  e.error('canvas 2 -1', 'canvas height must be positive');
  e.failWrites = true;
  e.error('save failed.svg', 'cannot write file: failed.svg');
  assert.equal(e.snapshot(), before);
  e.ok('redo');
  e.failWrites = false;
  assert.match(e.ok('save')[0]!, /^saved to original.svg/);
});

test('save without source path fails clearly, init clears previous source path', () => {
  const e = new TestEditor().setup('init');
  e.error('save', 'no file path. use save <file.svg>');
  e.setup('save original.svg', 'init');
  e.error('save', 'no file path. use save <file.svg>');
});

test('tree shows nested geometry and text; show identifies parent', () => {
  const e = new TestEditor().setup('init', 'create g g', 'create circle c 10 20 5 red in g', 'create text t 0 0 "hi" in g');
  assert.match(e.ok('tree').join('\n'), /└── g#g\n    ├── circle#c.*cx=10.*cy=20.*r=5/);
  assert.match(e.ok('tree g').join('\n'), /text#t.*"hi"/);
  assert.equal(e.ok('show c')[0], 'circle#c  parent=g#g');
});

test('invalid arity/numbers/ids and lexer errors never replace the document', () => {
  const e = new TestEditor().setup('init', 'create rect r 1 2 3 4');
  const before = e.snapshot();
  for (const command of ['create rect q 1 2', 'move r NaN 1', 'move r 0x10 1',
    'create g "bad id"', 'set r x Infinity', 'canvas 3', 'front r extra',
    'set r fill "red"tail', 'create rect q 1 2 3 -1', 'nonsense']) {
    assert.ok(e.run(command)[0]!.startsWith('error:'), command);
    assert.equal(e.snapshot(), before, command);
  }
});
