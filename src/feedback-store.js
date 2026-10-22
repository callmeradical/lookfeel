import fs from 'node:fs';
import path from 'node:path';

export class FeedbackStore {
  constructor(feedbackDir = path.resolve(process.cwd(), 'outputs/feedback')) {
    this.feedbackDir = feedbackDir;
  }

  ensureDir() {
    if (!fs.existsSync(this.feedbackDir)) {
      fs.mkdirSync(this.feedbackDir, { recursive: true });
    }
  }

  recordEvaluation({
    runId,
    screenId,
    reviewer = 'Developer / Evaluator',
    look = {},
    feel = {},
    behavior = {},
    experience = {},
    summary = ''
  }) {
    this.ensureDir();
    const timestamp = new Date().toISOString();
    const record = {
      runId,
      screenId,
      reviewer,
      timestamp,
      ratings: {
        look: { score: look.score ?? 0, notes: look.notes || '' },
        feel: { score: feel.score ?? 0, notes: feel.notes || '' },
        behavior: { score: behavior.score ?? 0, notes: behavior.notes || '' },
        experience: { score: experience.score ?? 0, notes: experience.notes || '' }
      },
      summary
    };

    const filename = `eval-${screenId}-${timestamp.replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(path.join(this.feedbackDir, filename), JSON.stringify(record, null, 2));

    this.appendMarkdownLog(record);
    return record;
  }

  appendMarkdownLog(record) {
    const logPath = path.join(this.feedbackDir, 'EVALUATION_LOG.md');
    const md = `
### Evaluation: ${record.screenId} (${record.timestamp})
- **Run ID**: \`${record.runId}\`
- **Reviewer**: ${record.reviewer}
- **Ratings (1-5)**:
  - 🎨 **Look**: ${record.ratings.look.score}/5 — ${record.ratings.look.notes || 'No comment'}
  - ✨ **Feel**: ${record.ratings.feel.score}/5 — ${record.ratings.feel.notes || 'No comment'}
  - ⚡ **Behavior**: ${record.ratings.behavior.score}/5 — ${record.ratings.behavior.notes || 'No comment'}
  - 🎯 **Experience**: ${record.ratings.experience.score}/5 — ${record.ratings.experience.notes || 'No comment'}
- **Summary**: ${record.summary || 'None'}

---
`;
    fs.appendFileSync(logPath, md, 'utf8');
  }

  listEvaluations(filterScreenId = null) {
    this.ensureDir();
    if (!fs.existsSync(this.feedbackDir)) return [];
    const files = fs.readdirSync(this.feedbackDir).filter((f) => f.startsWith('eval-') && f.endsWith('.json'));

    const records = [];
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.feedbackDir, file), 'utf8'));
        if (!filterScreenId || data.screenId === filterScreenId) {
          records.push(data);
        }
      } catch {}
    }

    return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}
