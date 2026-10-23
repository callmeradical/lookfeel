import test from 'node:test';
import assert from 'node:assert/strict';
import { OutputStore } from '../src/output-store.js';
import { FeedbackStore } from '../src/feedback-store.js';
import fs from 'node:fs';
import path from 'node:path';

test('OutputStore initializes runs and saves screenshots', (t) => {
  const tmpDir = path.resolve('/tmp/test-lookfeel-store');
  const store = new OutputStore(tmpDir);

  const { runId, runPath } = store.initRun('test-run-001', { env: 'ci' });
  assert.equal(runId, 'test-run-001');
  assert.ok(fs.existsSync(runPath));

  const dummyPng = Buffer.from('test-image-bytes');
  const { filePath } = store.saveScreenshot(runId, 'test.png', dummyPng, { title: 'Test Screen' });
  assert.ok(fs.existsSync(filePath));

  const runData = store.getRun(runId);
  assert.equal(runData.runId, 'test-run-001');
  assert.equal(runData.manifest.screenshots.length, 1);
});

test('FeedbackStore records rubric ratings and appends markdown log', (t) => {
  const tmpDir = path.resolve('/tmp/test-lookfeel-feedback');
  const store = new FeedbackStore(tmpDir);

  const record = store.recordEvaluation({
    runId: 'test-run-001',
    screenId: 'screen-abc',
    reviewer: 'Test Reviewer',
    look: { score: 4, notes: 'Great palette' },
    feel: { score: 5, notes: 'Spacious' },
    behavior: { score: 4, notes: 'Clear transitions' },
    experience: { score: 5, notes: 'Intuitive' },
    summary: 'Ready for merge'
  });

  assert.equal(record.ratings.look.score, 4);
  assert.ok(fs.existsSync(path.join(tmpDir, 'EVALUATION_LOG.md')));
  const md = fs.readFileSync(path.join(tmpDir, 'EVALUATION_LOG.md'), 'utf8');
  assert.ok(md.includes('screen-abc'));
  assert.ok(md.includes('Great palette'));
});
