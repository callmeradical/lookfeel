document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('inspect-modal');
  const modalClose = document.getElementById('modal-close');
  const modalDismiss = document.getElementById('modal-btn-dismiss');
  const modalApprove = document.getElementById('modal-btn-approve');
  const inspectBtns = document.querySelectorAll('.btn-inspect');
  const triggerAnomalyBtn = document.getElementById('btn-trigger-anomaly');
  const logStream = document.getElementById('log-stream');

  // Modal interactions
  inspectBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const agentName = row.querySelector('.agent-name').textContent;
      document.getElementById('modal-agent-name').textContent = `Inspect: ${agentName}`;
      modal.classList.remove('hidden');
    });
  });

  const closeModal = () => modal.classList.add('hidden');
  modalClose.addEventListener('click', closeModal);
  modalDismiss.addEventListener('click', closeModal);

  modalApprove.addEventListener('click', () => {
    alert('Patch approved and promoted to production registry!');
    closeModal();
  });

  // Chaos event interaction
  if (triggerAnomalyBtn) {
    triggerAnomalyBtn.addEventListener('click', () => {
      const now = new Date().toTimeString().split(' ')[0];
      const newLog = document.createElement('div');
      newLog.className = 'log-item warn';
      newLog.innerHTML = `
        <span class="log-time">${now}</span>
        <span class="log-tag tag-warn">ANOMALY</span>
        <span class="log-msg">Chaos injected: Synthetic token drop rate exceeded 15% on edge gateway</span>
      `;
      logStream.prepend(newLog);
    });
  }
});
