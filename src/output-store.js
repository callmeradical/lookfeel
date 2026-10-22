import fs from 'node:fs';
import path from 'node:path';

export class OutputStore {
  constructor(baseDir = path.resolve(process.cwd(), 'outputs')) {
    this.baseDir = baseDir;
    this.runsDir = path.join(baseDir, 'runs');
    this.latestDir = path.join(baseDir, 'latest');
    this.feedbackDir = path.join(baseDir, 'feedback');
  }

  ensureDirs() {
    for (const dir of [this.baseDir, this.runsDir, this.latestDir, this.feedbackDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  initRun(runId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}`, metadata = {}) {
    this.ensureDirs();
    const runPath = path.join(this.runsDir, runId);
    if (!fs.existsSync(runPath)) {
      fs.mkdirSync(runPath, { recursive: true });
    }

    const manifest = {
      runId,
      timestamp: new Date().toISOString(),
      metadata,
      screenshots: []
    };

    fs.writeFileSync(path.join(runPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
    return { runId, runPath, manifest };
  }

  saveScreenshot(runId, filename, buffer, metadata = {}) {
    this.ensureDirs();
    const runPath = path.join(this.runsDir, runId);
    if (!fs.existsSync(runPath)) {
      this.initRun(runId);
    }

    const filePath = path.join(runPath, filename);
    fs.writeFileSync(filePath, buffer);

    // Mirror to latest
    const latestPath = path.join(this.latestDir, filename);
    fs.writeFileSync(latestPath, buffer);

    const manifestPath = path.join(runPath, 'manifest.json');
    let manifest = { runId, timestamp: new Date().toISOString(), screenshots: [] };
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch {
        // fallback to empty
      }
    }

    manifest.screenshots = manifest.screenshots.filter((s) => s.filename !== filename);
    manifest.screenshots.push({
      filename,
      ...metadata,
      capturedAt: new Date().toISOString()
    });

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(this.latestDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    return { filePath, latestPath };
  }

  listRuns() {
    this.ensureDirs();
    if (!fs.existsSync(this.runsDir)) return [];
    return fs
      .readdirSync(this.runsDir)
      .filter((file) => fs.statSync(path.join(this.runsDir, file)).isDirectory())
      .sort()
      .reverse();
  }

  getRun(runId) {
    this.ensureDirs();
    const targetDir = runId === 'latest' ? this.latestDir : path.join(this.runsDir, runId);
    if (!fs.existsSync(targetDir)) return null;

    const manifestPath = path.join(targetDir, 'manifest.json');
    let manifest = { runId, screenshots: [] };
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch {}
    }

    const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.png') || f.endsWith('.jpg'));
    return { runId, dir: targetDir, manifest, files };
  }
}
