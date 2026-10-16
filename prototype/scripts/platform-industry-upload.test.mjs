import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pages/knowledge-config/platformIndustryUpload.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const rules = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

assert.deepEqual(rules.PLATFORM_UPLOAD_BOARDS, ['document', 'faq', 'structured']);
assert.equal(rules.PLATFORM_UPLOAD_ACCEPT.document.includes('.pdf'), true);
for (const extension of ['.jpg', '.jpeg', '.png']) {
  assert.equal(rules.PLATFORM_UPLOAD_ACCEPT.document.split(',').includes(extension), true, `文档知识应支持 ${extension} 图片`);
}
assert.equal(rules.PLATFORM_UPLOAD_ACCEPT.faq.includes('.jsonl'), true);
assert.equal(rules.PLATFORM_UPLOAD_ACCEPT.structured.includes('.xlsx'), true);
assert.equal(rules.PLATFORM_UPLOAD_ACCEPT.structured.includes('.pdf'), false);
const createPage = readFileSync(new URL('../src/pages/knowledge-config/KnowledgeCreatePage.tsx', import.meta.url), 'utf8');
assert.match(createPage, /accept=\{PLATFORM_UPLOAD_ACCEPT\[board as keyof typeof PLATFORM_UPLOAD_ACCEPT\]\}/);
assert.match(createPage, /JPG\/JPEG、PNG（图片将进行 OCR）/);
const platformPage = readFileSync(new URL('../src/pages/N14-IndustryKnowledgePlatformPage.tsx', import.meta.url), 'utf8');
assert.match(platformPage, /版本文件 \*<\/span><Input type="file" accept="[^"]*\.jpg,\.jpeg,\.png"/);
console.log('平台行业知识上传板块及文件格式：通过');
