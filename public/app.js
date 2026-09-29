let activePolicy = null;
let totalDowntime = 0;
let allowedDowntime = 0;

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('tab-active');
    btn.classList.add('tab-inactive');
  });
  
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('tab-active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.remove('tab-inactive');
}

// Data Loading
async function loadData() {
  try {
    const [polRes, incRes, clmRes] = await Promise.all([
      fetch('/api/policies'), fetch('/api/incidents'), fetch('/api/claims')
    ]);
    
    const policies = await polRes.json();
    const incidents = await incRes.json();
    const claims = await clmRes.json();

    activePolicy = policies.length > 0 ? policies[0] : null;

    calculateMetrics(policies, incidents, claims);
    renderTelemetry(policies, incidents);
    renderClaims(claims);
  } catch (err) {
    console.error("Error loading data:", err);
  }
}

function calculateMetrics(policies, incidents, claims) {
  // Financial Impact: 1 min downtime = $150 credit approx
  const CREDIT_PER_MIN = 150;
  
  let approvedDowntime = claims
    .filter(c => c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.totalDowntime, 0);
    
  const recoveredCapital = approvedDowntime * CREDIT_PER_MIN;
  document.getElementById('metric-capital').innerText = `$${recoveredCapital.toLocaleString()}`;

  // SLA Compliance
  totalDowntime = incidents.reduce((sum, i) => sum + (i.durationMinutes || 0), 0);
  if (activePolicy) {
    const target = activePolicy.availabilityTarget;
    const fraction = 1 - (target / 100);
    allowedDowntime = (30 * 24 * 60) * fraction;
    
    // If downtime > allowed, compliance dips below the target
    let compliance = target;
    if (totalDowntime > allowedDowntime) {
      const extraDowntimeRatio = (totalDowntime - allowedDowntime) / (30 * 24 * 60);
      compliance = Math.max(0, target - (extraDowntimeRatio * 100));
    }
    
    document.getElementById('metric-compliance').innerText = `${compliance.toFixed(3)}%`;
    document.getElementById('metric-compliance').parentElement.querySelector('span:last-child').innerText = `Target: ${target}%`;
  } else {
    document.getElementById('metric-compliance').innerText = `N/A`;
  }

  // Audits
  const activeAudits = claims.filter(c => c.status === 'GENERATED').length;
  document.getElementById('metric-audits').innerText = activeAudits;
  
  // Update Tracker text
  document.getElementById('downtime-tracker').innerText = `${totalDowntime.toFixed(1)} / ${activePolicy ? allowedDowntime.toFixed(1) : 0} mins tracked`;
}

function renderTelemetry(policies, incidents) {
  const pList = document.getElementById('telemetry-policies');
  if (policies.length === 0) {
    pList.innerHTML = `<div class="text-xs text-neutral-500 italic">No tracking vectors established.</div>`;
  } else {
    pList.innerHTML = policies.map(p => `
      <div class="bg-black/50 border border-white/10 rounded-lg p-4">
        <div class="flex justify-between items-start mb-2">
          <div class="font-medium text-white">${p.serviceName}</div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">ACTIVE</span>
        </div>
        <div class="text-xs text-neutral-400 flex flex-col gap-1">
          <div class="flex justify-between"><span>Vendor</span><span class="text-neutral-200">${p.vendor}</span></div>
          <div class="flex justify-between"><span>Target</span><span class="text-neutral-200">${p.availabilityTarget}%</span></div>
          <div class="flex justify-between"><span>Period</span><span class="text-neutral-200">${p.measurementPeriod}</span></div>
        </div>
      </div>
    `).join('');
  }

  const iList = document.getElementById('telemetry-incidents');
  if (incidents.length === 0) {
    iList.innerHTML = `<tr><td colspan="4" class="px-5 py-8 text-center text-xs text-neutral-500 italic">No telemetry anomalies detected.</td></tr>`;
  } else {
    iList.innerHTML = incidents.map(i => `
      <tr class="hover:bg-white/[0.02] transition-colors">
        <td class="px-5 py-3 text-neutral-300 font-mono text-xs">${new Date(i.startTime).toISOString().replace('T', ' ').substring(0, 19)}</td>
        <td class="px-5 py-3 text-red-400 font-medium">${i.durationMinutes}m</td>
        <td class="px-5 py-3 text-neutral-400">${i.evidenceSource}</td>
        <td class="px-5 py-3">
          <span class="px-2 py-1 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-white/10">RECORDED</span>
        </td>
      </tr>
    `).join('');
  }
}

function renderClaims(claims) {
  const cList = document.getElementById('claims-feed');
  if (claims.length === 0) {
    cList.innerHTML = `
      <div class="glass-card rounded-xl border border-white/10 p-10 flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
          <svg class="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <div class="text-sm font-medium text-white">Inbox Empty</div>
        <div class="text-xs text-neutral-500 mt-1">Awaiting autonomous breach detection.</div>
      </div>
    `;
  } else {
    cList.innerHTML = claims.map(c => {
      const isApproved = c.status === 'APPROVED';
      const isRejected = c.status === 'REJECTED';
      
      let badge = `<span class="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PENDING SUBMISSION</span>`;
      if (isApproved) badge = `<span class="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">VENDOR APPROVED</span>`;
      if (isRejected) badge = `<span class="px-2 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">VENDOR REJECTED</span>`;

      return `
      <div class="glass-card rounded-xl border border-white/10 overflow-hidden flex flex-col">
        <div class="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
          <div class="flex items-center gap-3">
            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            <span class="text-xs font-mono text-neutral-500">${c.id.split('-')[0]}...</span>
          </div>
          ${badge}
        </div>
        <div class="p-5">
          <div class="text-xs text-neutral-400 mb-3 flex gap-4">
            <div><span class="block text-[10px] uppercase tracking-wider text-neutral-500">Breach Size</span><span class="text-white">${c.totalDowntime} mins</span></div>
            <div><span class="block text-[10px] uppercase tracking-wider text-neutral-500">Generated</span><span class="text-white">${new Date(c.createdAt).toLocaleTimeString()}</span></div>
          </div>
          <pre class="text-xs font-mono text-neutral-300 bg-black/60 p-4 rounded-md border border-white/10 max-h-60 overflow-y-auto mb-4 whitespace-pre-wrap">${c.claimPackage}</pre>
          
          ${c.status === 'GENERATED' ? `
            <button onclick="submitClaim('${c.id}')" class="w-full bg-white text-black hover:bg-neutral-200 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Execute Autonomous Vendor Negotiation
            </button>
          ` : `
            <div class="text-xs text-neutral-400 bg-white/5 p-3 rounded-md border border-white/10 flex items-start gap-2">
              <svg class="w-4 h-4 mt-0.5 shrink-0 ${isApproved ? 'text-emerald-400' : 'text-red-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isApproved ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"></path></svg>
              <span>Vendor response logged and negotiation concluded. Credits applied to ledger.</span>
            </div>
          `}
        </div>
      </div>
    `}).join('');
  }
}

// Toast
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').innerText = msg;
  const icon = document.getElementById('toast-icon');
  
  if (isError) {
    icon.className = 'text-red-400';
    icon.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  } else {
    icon.className = 'text-emerald-400';
    icon.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
  }

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

// Actions
async function resetDemo() {
  await fetch('/api/reset', { method: 'POST' });
  document.getElementById('contractText').value = '';
  showToast('Environment state reset successfully.');
  loadData();
}

async function extractContract() {
  const btn = document.getElementById('extractBtn');
  const text = document.getElementById('contractText').value;
  if (!text) return showToast('Input telemetry required.', true);
  
  btn.innerHTML = '<span class="animate-pulse">Processing vector...</span>';
  btn.disabled = true;

  const res = await fetch('/api/extract-policy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractText: text })
  });

  btn.innerHTML = 'Process Contract';
  btn.disabled = false;

  if (res.ok) {
    document.getElementById('contractText').value = '';
    showToast('SLA terms extracted and tracking vector initiated.');
    loadData();
  } else {
    showToast('Extraction failed. Verify GEMINI_API_KEY.', true);
  }
}

async function injectOutage() {
  if (!activePolicy) return showToast('Missing SLA tracking vector.', true);
  
  const date = new Date();
  await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceName: activePolicy.serviceName,
      startTime: new Date(date.getTime() - 15 * 60000).toISOString(),
      endTime: date.toISOString(),
      evidenceSource: 'Datadog Alert: High Latency'
    })
  });
  
  showToast('Anomaly injected into memory vault.');
  setTimeout(loadData, 500);
}

async function submitClaim(claimId) {
  const res = await fetch('/api/vendor/submit-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimId })
  });
  const data = await res.json();
  showToast(`Vendor: ${data.vendorMessage}`, !data.success);
  loadData();
}

// Init
loadData();
