# lookfeel 🎨

> **Visual evaluation, screenshot testing, and annotation harness for frontend developers and agentic coding loops.**

`lookfeel` is an open-source testing and critique tool designed for humans and AI coding agents pairing on frontend applications. It automates capturing high-resolution retina screenshots across desktop and mobile viewports, organizes them into timestamped runs, and serves an interactive visual evaluation studio for structured UX review.

---

## ⚡ Why lookfeel?

When AI agents build frontends, unit tests and DOM assertions are not enough:
- **Visual bugs** (cramped spacing, bad wrapping, invisible buttons, color clashes) slip past Jest/Vitest.
- **Agentic loops need feedback**: Coding agents need structured critique logs across specific dimensions to know *what* to fix.
- **Git bloat prevention**: Raw screenshots bloat git repositories. `lookfeel` keeps timestamped runs local while persisting structured review ratings and markdown critique in `EVALUATION_LOG.md`.

---

## 📐 Multidimensional Evaluation Rubric

Every screen is evaluated on a standardized 1–5 scale across four core dimensions:

1. 🎨 **Look (Visual Design & Aesthetic)**: Hierarchy, color consistency, typography, readability, and contrast.
2. ✨ **Feel (Layout, Polish & Spacing)**: Whitespace, breathing room, grid alignment, and responsive flow.
3. ⚡ **Behavior (State, Affordance & Transitions)**: Interactive affordances, active/hover states, loading cues, and error handling.
4. 🎯 **Experience (Intuitiveness & Cognitive Flow)**: Cognitive load, task completion friction, user confidence, and agent transparency.

---

## 🚀 Quick Start

### 1. Installation

```bash
npm install -D lookfeel playwright
```

### 2. Configure Your Screens (`lookfeel.config.json`)

```json
{
  "outputDir": "./outputs",
  "screens": [
    {
      "id": "landing-desktop",
      "title": "Marketing Landing (Desktop)",
      "url": "http://localhost:3000",
      "viewport": { "width": 1440, "height": 900 }
    },
    {
      "id": "landing-mobile",
      "title": "Marketing Landing (Mobile)",
      "url": "http://localhost:3000",
      "viewport": { "width": 390, "height": 844 }
    },
    {
      "id": "dashboard-active",
      "title": "User Dashboard (Desktop)",
      "url": "http://localhost:3000/dashboard",
      "waitSelector": "#main-chart",
      "viewport": { "width": 1440, "height": 900 }
    }
  ]
}
```

### 3. Capture Screenshots

```bash
npx lookfeel capture
```

Outputs are automatically saved into timestamped runs (`outputs/runs/run-<timestamp>/`) and mirrored to `outputs/latest/`.

### 4. Open the Review Studio

```bash
npx lookfeel review
```

Open [http://localhost:8802](http://localhost:8802) to inspect screens side-by-side, submit ratings, and add critique notes.

---

## 🤖 Using in Agentic Coding Loops (Builder ⇄ Critic)

You can plug `lookfeel` into multi-agent workflows (e.g. Antigravity, Claude Engineer, AutoDev):

1. **Builder Agent** edits code and runs dev server.
2. **Test Runner** calls `lookfeel capture`.
3. **Critic Agent** reads `outputs/latest/manifest.json` and evaluates the images (or human inspects via `lookfeel review`).
4. Critic logs findings into `outputs/feedback/EVALUATION_LOG.md`.
5. Builder consumes the log and executes targeted visual remediation.

---

## 📦 Programmatic API

```javascript
import { captureScreens, startViewerServer } from 'lookfeel';

// Programmatic capture with custom page actions
await captureScreens([
  {
    id: 'login-modal',
    url: 'http://localhost:3000',
    action: async (page) => {
      await page.click('button#login');
      await page.waitForSelector('.modal');
    }
  }
], { outputDir: './outputs' });

// Start reviewer server
startViewerServer({ port: 8802, outputDir: './outputs' });
```

---

## 📄 License

MIT © Lars Cromley
