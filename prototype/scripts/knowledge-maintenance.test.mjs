import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const load = async name => {
  const source = readFileSync(new URL('../src/pages/knowledge-config/' + name + '.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
};
const policy = await load('structuredPolicy');
const fields = [{ name: 'title', type: '单行文本' }, { name: 'image', type: '图片' }];
const result = policy.applyBatchFieldCapability(fields, ['title', 'image'], {}, 'search', true);
assert.equal(result.overrides.title.search, true);
assert.equal(result.overrides.image, undefined);
assert.equal(result.skipped, 1);
assert.deepEqual(policy.applyBatchFieldCapability(fields, [], {}, 'search', false).overrides, {});
const maintenance = await load('knowledgeMaintenance');
assert.equal(maintenance.validateReplacement('structured', { name: '参数.xls', size: 1024 }), '');
assert.notEqual(maintenance.validateReplacement('structured', { name: '参数.pdf', size: 1024 }), '');
assert.notEqual(maintenance.validateReplacement('document', { name: '空.pdf', size: 0 }), '');
assert.notEqual(maintenance.validateReplacement('document', { name: '大.pdf', size: 101 * 1024 * 1024 }), '');
assert.equal(maintenance.replacementStatus('published'), 'learning');
assert.equal(maintenance.replacementStatus('archived'), 'archived');
assert.equal(maintenance.replacementStatus('draft'), 'draft');
console.log('批量字段能力限制、重新上传校验和状态保留：通过');
