let currentRun = null;
let currentScreen = null;
let manifestData = null;
let runsList = [];
let evaluations = {};
let activeFlow = 'all';

async function init() {
  await loadRuns();
  setupEventListeners();
}

async function loadRuns() {
  try {
    const res = await fetch('/api/runs');
    if (!res.ok) throw new Error('Failed to load runs');
    runsList = await res.json();
    populateRunSelector(runsList);
    if (runsList.length > 0) {
      await selectRun(runsList[runsList.length - 1]);
    }
  } catch (err) {
    console.error('Error loading runs:', err);
    // Fallback: try loading /outputs/latest/manifest.json directly if static
    try {
      const direct = await fetch('/outputs/latest/manifest.json');
      if (direct.ok) {
        manifestData = await direct.json();
        renderScreens();
      }
    } catch (e) {
      console.warn('Fallback failed:', e);
    }
  }
}

function populateRunSelector(runs) {
  const select = document.getElementById('run-select');
  select.innerHTML = '';
  runs.forEach(runId => {
    const opt = document.createElement('option');
    opt.value = runId;
    opt.textContent = runId;
    select.appendChild(opt);
  });
}

async function selectRun(runId) {
  currentRun = runId;
  const res = await fetch(`/api/runs/${runId}`);
  if (!res.ok) return;
  manifestData = await res.json();
  await loadEvaluations(runId);
  renderScreens();
}

async function loadEvaluations(runId) {
  try {
    const res = await fetch(`/api/feedback?runId=${runId}`);
    if (res.ok) {
      const data = await res.json();
      evaluations = {};
      data.forEach(e => {
        evaluations[e.screenId] = e;
      });
      updateEvaluationCount();
    }
  } catch (err) {
    console.warn('Could not load feedback:', err);
  }
}

function updateEvaluationCount() {
  const total = manifestData?.screenshots?.length || 0;
  const done = Object.keys(evaluations).length;
  document.getElementById('eval-count').textContent = done;
  document.getElementById('total-count').textContent = total;
}

function renderScreens() {
  const listEl = document.getElementById('screen-list');
  listEl.innerHTML = '';

  if (!manifestData || !manifestData.screenshots) return;

  const filtered = manifestData.screenshots.filter(s => {
    if (activeFlow === 'all') return true;
    if (activeFlow === 'operations') return s.flow.toLowerCase().includes('operations');
    if (activeFlow === 'crm') return s.flow.toLowerCase().includes('crm') || s.flow.toLowerCase().includes('conversations');
    if (activeFlow === 'customer') return s.flow.toLowerCase().includes('customer');
    if (activeFlow === 'stickers') return s.flow.toLowerCase().includes('stickers');
    return true;
  });

  document.getElementById('screen-count-badge').textContent = filtered.length;

  filtered.forEach(screen => {
    const item = document.createElement('div');
    item.className = `screen-item ${currentScreen?.id === screen.id ? 'active' : ''}`;
    const imgUrl = `/outputs/runs/${manifestData.runId}/${screen.filename}`;
    const isEvaluated = Boolean(evaluations[screen.id]);

    item.innerHTML = `
      <img class="screen-thumb" src="${imgUrl}" alt="${screen.title}" />
      <div class="screen-item-info">
        <div class="screen-item-title">${screen.title}</div>
        <div class="screen-item-meta">
          <span>${screen.viewport?.name || 'desktop'}</span>
          ${isEvaluated ? '<span style="color:#10b981;">✓ Evaluated</span>' : ''}
        </div>
      </div>
    `;

    item.addEventListener('click', () => selectScreen(screen));
    listEl.appendChild(item);
  });

  if (filtered.length > 0 && !currentScreen) {
    selectScreen(filtered[0]);
  }
}

function selectScreen(screen) {
  currentScreen = screen;
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('active-screen-view').style.display = 'flex';

  document.getElementById('screen-title').textContent = screen.title;
  document.getElementById('screen-flow').textContent = screen.flow;
  document.getElementById('screen-viewport').textContent = `${screen.viewport?.width}x${screen.viewport?.height} (${screen.viewport?.name})`;
  document.getElementById('screen-id').textContent = screen.id;

  const imgUrl = `/outputs/runs/${manifestData.runId}/${screen.filename}`;
  document.getElementById('current-screenshot').src = imgUrl;
  document.getElementById('open-full-btn').href = imgUrl;

  // Highlight active in sidebar
  document.querySelectorAll('.screen-item').forEach(el => el.classList.remove('active'));
  renderScreens();

  // Load existing evaluation data if present
  populateEvaluationForm(screen.id);
}

function populateEvaluationForm(screenId) {
  const existing = evaluations[screenId];
  const dimensions = ['look', 'feel', 'behavior', 'experience'];

  dimensions.forEach(dim => {
    const stars = document.querySelectorAll(`.rating-stars[data-field="${dim}"] button`);
    const rating = existing?.scores?.[dim] || 0;
    stars.forEach(btn => {
      const val = parseInt(btn.dataset.val, 10);
      btn.classList.toggle('selected', val <= rating);
    });

    const comment = existing?.dimensions?.[dim]?.comments || '';
    document.getElementById(`feedback-${dim}`).value = comment;
  });

  document.getElementById('eval-summary').value = existing?.summary || '';
  document.getElementById('save-status').textContent = existing ? 'Saved' : '';
}

function setupEventListeners() {
  document.getElementById('run-select').addEventListener('change', e => {
    selectRun(e.target.value);
  });

  document.querySelectorAll('.flow-nav .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.flow-nav .nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFlow = btn.dataset.flow;
      renderScreens();
    });
  });

  // Star ratings
  document.querySelectorAll('.rating-stars button').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.rating-stars');
      const val = parseInt(btn.dataset.val, 10);
      container.querySelectorAll('button').forEach(b => {
        const bVal = parseInt(b.dataset.val, 10);
        b.classList.toggle('selected', bVal <= val);
      });
      container.dataset.selectedRating = val;
    });
  });

  // Save form
  document.getElementById('evaluation-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentScreen || !manifestData) return;

    const payload = {
      runId: manifestData.runId,
      screenId: currentScreen.id,
      reviewer: 'Lars (Founder/Product Lead)',
      look: {
        rating: getRating('look'),
        comments: document.getElementById('feedback-look').value,
      },
      feel: {
        rating: getRating('feel'),
        comments: document.getElementById('feedback-feel').value,
      },
      behavior: {
        rating: getRating('behavior'),
        comments: document.getElementById('feedback-behavior').value,
      },
      experience: {
        rating: getRating('experience'),
        comments: document.getElementById('feedback-experience').value,
      },
      summary: document.getElementById('eval-summary').value,
    };

    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Saving...';

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        evaluations[currentScreen.id] = saved;
        statusEl.textContent = '✓ Saved successfully!';
        updateEvaluationCount();
        renderScreens();
        setTimeout(() => {
          statusEl.textContent = '';
        }, 3000);
      } else {
        statusEl.textContent = 'Failed to save';
      }
    } catch (err) {
      console.error('Save error:', err);
      statusEl.textContent = 'Error saving';
    }
  });

  // Export summary
  document.getElementById('export-summary-btn').addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(evaluations, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `evaluations-${manifestData?.runId || 'latest'}.json`);
    dl.click();
  });
}

function getRating(field) {
  const container = document.querySelector(`.rating-stars[data-field="${field}"]`);
  const selected = container.querySelectorAll('button.selected');
  return selected.length;
}

document.addEventListener('DOMContentLoaded', init);
