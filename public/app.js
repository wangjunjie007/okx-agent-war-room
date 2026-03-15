import { createMissionRun, fetchReplay, fetchRun, fetchRuns } from './js/api.js';
import { AGENTS } from './js/constants.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const agentGrid = document.getElementById('agentGrid');
const logList = document.getElementById('logList');
const missionGrid = document.getElementById('missionGrid');
const bubbleStream = document.getElementById('bubbleStream');
const commandInput = document.getElementById('commandInput');
const runBtn = document.getElementById('runBtn');
const demoBtn = document.getElementById('demoBtn');
const missionState = document.getElementById('missionState');
const missionId = document.getElementById('missionId');
const logMeta = document.getElementById('logMeta');
const busProgress = document.getElementById('busProgress');
const riskProgress = document.getElementById('riskProgress');
const execChip = document.getElementById('execChip');
const riskChip = document.getElementById('riskChip');
const busText = document.getElementById('busText');
const riskText = document.getElementById('riskText');
const intentChip = document.getElementById('intentChip');
const conclusionChip = document.getElementById('conclusionChip');
const negotiationState = document.getElementById('negotiationState');
const negotiationSub = document.getElementById('negotiationSub');
const approvalState = document.getElementById('approvalState');
const approvalSub = document.getElementById('approvalSub');
const signalState = document.getElementById('signalState');
const signalSub = document.getElementById('signalSub');
const approvalStamp = document.getElementById('approvalStamp');
const bridgeChip = document.getElementById('bridgeChip');
const bridgeSummary = document.getElementById('bridgeSummary');
const archiveList = document.getElementById('archiveList');
const heroSubtitle = document.getElementById('heroSubtitle');

let intentText = null;
let conclusionText = null;
let activeRun = 0;
let currentRunId = null;
let renderedEventCount = 0;
let autoLoop = null;

init();

function init() {
  renderAgents();
  seedLogs();
  bindEvents();
  refreshArchive();
}

function bindEvents() {
  runBtn.addEventListener('click', startMission);
  demoBtn.addEventListener('click', toggleDemo);
  archiveList?.addEventListener('click', async (event) => {
    const row = event.target.closest('[data-run-id]');
    if (!row) return;
    const runId = row.dataset.runId;
    await replayArchivedRun(runId);
  });
}

function renderAgents() {
  agentGrid.innerHTML = '';
  for (const agent of AGENTS) {
    const el = document.createElement('div');
    el.className = 'agent-card';
    el.id = `agent-${agent.key}`;
    el.dataset.key = agent.key;
    el.innerHTML = `
      <div class="agent-bubble" id="speech-${agent.key}"></div>
      <div class="agent-top">
        <div>
          <div class="role-name">${agent.role}</div>
          <div class="role-title">${agent.title}</div>
        </div>
        <div class="badge" id="badge-${agent.key}">Standby</div>
      </div>
      <div class="agent-visual">
        <div class="avatar-stage">
          <div class="avatar">
            <div class="avatar-head">
              <div class="avatar-hair"></div>
              <div class="avatar-headset"></div>
              <div class="avatar-face">
                <div class="eyes"><i></i><i></i></div>
                <div class="mouth"></div>
              </div>
            </div>
            <div class="avatar-shoulder"></div>
            <div class="avatar-torso"></div>
            <div class="avatar-glyph">${agent.avatar}</div>
          </div>
        </div>
        <div>
          <div class="agent-status">
            <span id="status-${agent.key}">等待新任务</span>
            <strong id="pct-${agent.key}">0%</strong>
          </div>
          <div class="progress"><i id="bar-${agent.key}" style="width:0%; background: linear-gradient(90deg, ${agent.color}, var(--okx));"></i></div>
          <div class="agent-note" id="note-${agent.key}">${agent.note}</div>
        </div>
      </div>
    `;
    agentGrid.appendChild(el);
  }
}

function ensureCommsNarrative() {
  const processBubble = document.createElement('div');
  processBubble.className = 'bubble left strategy system-note process';
  processBubble.id = 'intentBubble';
  processBubble.innerHTML = `<div class="bubble-inner"><div class="bubble-head">工作过程</div><div class="bubble-copy" id="intentText"></div></div>`;

  const resultBubble = document.createElement('div');
  resultBubble.className = 'bubble left review system-note result';
  resultBubble.id = 'conclusionBubble';
  resultBubble.innerHTML = `<div class="bubble-inner"><div class="bubble-head">结果摘要</div><div class="bubble-copy" id="conclusionText"></div></div>`;

  bubbleStream.appendChild(processBubble);
  bubbleStream.appendChild(resultBubble);
  intentText = document.getElementById('intentText');
  conclusionText = document.getElementById('conclusionText');
}

function seedLogs() {
  logList.innerHTML = '';
  bubbleStream.innerHTML = '';
  pushLog('系统', '作战室已就绪，等待新指令。');
  pushBubble('系统广播', '战区已联机，所有 Agent 处于待命状态。', 'right', 'intel');
  ensureCommsNarrative();
  intentText.textContent = '在输入框下达任务后，系统会生成多 Agent 协作叙事、执行路径与完整任务结论。';
  conclusionText.textContent = '等待多 Agent 形成结论后，在这里输出更完整的策略纪要、风险摘要和执行建议。';
  createMissionCards([
    ['情报采集', '监测 X 情绪、热点叙事、链上异动与风险线索'],
    ['策略编排', '把市场信号压缩为可执行的战术意图'],
    ['风控仲裁', '限制风险敞口，模拟审核执行阈值'],
    ['执行协同', '通过 OKX Agent Trade Kit 作为执行中枢做视觉演示']
  ]);
  bridgeSummary.innerHTML = 'Execution Bridge 将在任务生成后展示执行路由、护栏与触发条件。';
  bridgeChip.textContent = 'Idle';
  scrollComms(true);
}

function createMissionCards(items) {
  missionGrid.innerHTML = items.map((item, idx) => `
    <div class="mission-card">
      <div class="mission-top">
        <div class="mission-title">${idx + 1}. ${item[0]}</div>
        <div class="chip">Phase ${idx + 1}</div>
      </div>
      <div class="mission-meta">${item[1]}</div>
    </div>
  `).join('');
}

function pushLog(actor, content) {
  const item = document.createElement('div');
  item.className = 'log-item';
  item.innerHTML = `
    <div class="meta"><span>${actor}</span><span>${new Date().toLocaleTimeString('zh-CN', { hour12: false })}</span></div>
    <div class="content">${content}</div>
  `;
  logList.appendChild(item);
  while (logList.children.length > 12) logList.removeChild(logList.firstChild);
  logList.scrollTop = logList.scrollHeight;
}

function pushBubble(actor, content, side = 'left', theme = 'intel') {
  const item = document.createElement('div');
  item.className = `bubble ${side} ${theme}`;
  item.innerHTML = `<div class="bubble-inner"><div class="bubble-head">${actor}</div><div class="bubble-copy">${content}</div></div>`;
  bubbleStream.appendChild(item);
  trimComms();
  scrollComms(true);
}

function scrollComms(force = false) {
  requestAnimationFrame(() => {
    const nearBottom = bubbleStream.scrollHeight - bubbleStream.scrollTop - bubbleStream.clientHeight < 120;
    if (force || nearBottom) {
      bubbleStream.scrollTop = bubbleStream.scrollHeight;
    }
  });
}

function trimComms() {
  while (bubbleStream.children.length > 14) {
    const removable = [...bubbleStream.children].find(el => !el.classList.contains('system-note'));
    bubbleStream.removeChild(removable || bubbleStream.firstChild);
  }
}

function setDramaState({ negotiation, negotiationHint, approval, approvalHint, signal, signalHint }) {
  if (negotiation) negotiationState.textContent = negotiation;
  if (negotiationHint) negotiationSub.textContent = negotiationHint;
  if (approval) approvalState.textContent = approval;
  if (approvalHint) approvalSub.textContent = approvalHint;
  if (signal) signalState.textContent = signal;
  if (signalHint) signalSub.textContent = signalHint;
}

function triggerApprovalStamp(text = 'APPROVED') {
  approvalStamp.textContent = text;
  approvalStamp.classList.remove('show');
  void approvalStamp.offsetWidth;
  approvalStamp.classList.add('show');
}

function setAgentState(key, { badge, status, pct, note, busy }) {
  const cardEl = document.getElementById(`agent-${key}`);
  const badgeEl = document.getElementById(`badge-${key}`);
  const statusEl = document.getElementById(`status-${key}`);
  const pctEl = document.getElementById(`pct-${key}`);
  const barEl = document.getElementById(`bar-${key}`);
  const noteEl = document.getElementById(`note-${key}`);
  if (!cardEl) return;
  if (badge) badgeEl.textContent = badge;
  if (status) statusEl.textContent = status;
  if (typeof pct === 'number') {
    pctEl.textContent = `${pct}%`;
    barEl.style.width = `${pct}%`;
  }
  if (note) noteEl.textContent = note;
  const isBusy = typeof busy === 'boolean' ? busy : pct > 0 && pct < 100;
  cardEl.classList.toggle('active-card', isBusy);
  cardEl.classList.toggle('busy', isBusy);
}

function renderBridge(bridge) {
  if (!bridge) {
    bridgeChip.textContent = 'Idle';
    bridgeSummary.innerHTML = 'Execution Bridge 将在任务生成后展示执行路由、护栏与触发条件。';
    return;
  }
  bridgeChip.textContent = bridge.status || 'Live';
  const routes = (bridge.routes || []).map(item => `<li><strong>${item.title}</strong> · ${item.detail}</li>`).join('');
  const guardrails = (bridge.guardrails || []).map(item => `<li>${item}</li>`).join('');
  const triggers = (bridge.triggers || []).map(item => `<li>${item}</li>`).join('');
  bridgeSummary.innerHTML = `
    <div class="bridge-block"><strong>${bridge.summary}</strong></div>
    <div class="bridge-block"><span>Routes</span><ul>${routes}</ul></div>
    <div class="bridge-block"><span>Guardrails</span><ul>${guardrails}</ul></div>
    <div class="bridge-block"><span>Triggers</span><ul>${triggers}</ul></div>
  `;
}

function resetBoard() {
  AGENTS.forEach(agent => setAgentState(agent.key, { badge: 'Standby', status: '等待新任务', pct: 0, note: agent.note, busy: false }));
  missionState.textContent = '待命';
  logMeta.textContent = '等待指令';
  execChip.textContent = 'Idle';
  riskChip.textContent = 'Stable';
  intentChip.textContent = 'Awaiting';
  conclusionChip.textContent = 'Pending';
  busProgress.style.width = '4%';
  riskProgress.style.width = '12%';
  busText.textContent = '等待来自策略与风控 Agent 的共识信号。';
  riskText.textContent = '当前无激活任务，风险边界处于空闲监测状态。';
  intentText.textContent = '在输入框下达任务后，系统会生成多 Agent 协作叙事、执行路径与完整任务结论。';
  conclusionText.textContent = '等待多 Agent 形成结论后，在这里输出更完整的策略纪要、风险摘要和执行建议。';
  heroSubtitle.textContent = '以 OKX Agent Trade Kit 为执行中枢，整合情报、策略、风控、执行与复盘多个角色。你只需下达一条指令，作战室便会自动进入协同推演状态。';
  setDramaState({
    negotiation: '待命',
    negotiationHint: '尚未进入多 Agent 协商',
    approval: '未授权',
    approvalHint: '等待风控批准',
    signal: 'LOW',
    signalHint: '指挥总线空闲'
  });
  renderBridge(null);
  approvalStamp.classList.remove('show');
}

function applyRunPresentation(run) {
  if (run.heroSubtitle) heroSubtitle.textContent = run.heroSubtitle;
  if (run.mission) intentText.textContent = `当前作战任务：${run.mission}`;
  if (run.plan?.execution?.length) busText.textContent = run.plan.execution.join('；');
  if (run.plan?.riskText) riskText.textContent = run.plan.riskText;
  if (run.plan?.executionBridge) renderBridge(run.plan.executionBridge);
  if (run.conclusionHtml) conclusionText.innerHTML = run.conclusionHtml;
  const states = run.agentStates || [];
  states.forEach(state => setAgentState(state.key, state));
  const avgPct = states.length ? states.reduce((acc, item) => acc + Number(item.pct || 0), 0) / states.length : 0;
  busProgress.style.width = `${Math.max(4, Math.min(100, avgPct))}%`;
  riskProgress.style.width = `${Math.max(12, Math.min(100, avgPct * 0.92))}%`;
  if (run.status === 'completed') {
    missionState.textContent = '战备完成';
    logMeta.textContent = '本轮任务已完成';
    execChip.textContent = 'Ready';
    riskChip.textContent = 'Stable';
    intentChip.textContent = 'Delivered';
    conclusionChip.textContent = 'Ready';
    setDramaState({
      negotiation: '完成',
      negotiationHint: '全部 Agent 已完成本轮作战协同',
      approval: '归档',
      approvalHint: '本轮授权已封存入作战日志',
      signal: 'LOW',
      signalHint: '战区恢复待命状态'
    });
  } else {
    setDramaState({
      negotiation: '推演中',
      negotiationHint: '多 Agent 正在交换情报并更新任务上下文',
      approval: '审议中',
      approvalHint: '等待风险层完成权限审核',
      signal: avgPct > 60 ? 'HIGH' : avgPct > 20 ? 'MED' : 'LOW',
      signalHint: avgPct > 60 ? '执行总线持续占用中' : '作战链路逐步升温'
    });
  }
}

function renderRunEvents(run) {
  const events = run.events || [];
  for (const event of events.slice(renderedEventCount)) {
    pushBubble(event.actor || '系统', event.content || '', event.side || 'left', event.theme || 'intel');
  }
  renderedEventCount = events.length;
}

async function watchMissionRun(runId, ticket) {
  while (ticket === activeRun && currentRunId === runId) {
    const run = await fetchRun(runId);
    renderRunEvents(run);
    applyRunPresentation(run);
    if (run.plan?.executionBridge?.status && run.plan.executionBridge.status !== 'Watching') {
      triggerApprovalStamp(run.plan.executionBridge.status.toUpperCase());
    }
    if (run.status === 'completed' || run.status === 'failed') break;
    await sleep(700);
  }
  await refreshArchive();
}

async function startMission() {
  activeRun += 1;
  const ticket = activeRun;
  const mission = commandInput.value.trim() || '监测市场并生成低风险执行方案';
  const mode = document.getElementById('presetMode').value;
  resetBoard();
  missionId.textContent = `WAR-${String(Date.now()).slice(-3)}`;
  missionState.textContent = '执行中';
  logMeta.textContent = '多 Agent 正在协同作战';
  execChip.textContent = 'Routing';
  riskChip.textContent = 'Armed';
  intentChip.textContent = mode.toUpperCase();
  conclusionChip.textContent = 'Building';
  intentText.textContent = `当前作战任务：${mission}`;
  conclusionText.textContent = '多 Agent 正在收集情报、推演方案、审核风控，并准备形成完整的作战结论。';
  createMissionCards([
    ['信号拆解', `解析指令意图：${mission}`],
    ['跨 Agent 协同', '情报、链上、策略、风控、执行、复盘模块同步工作'],
    ['执行桥接', 'Execution Bridge 生成路由、护栏与回放帧'],
    ['任务归档', '支持 recent runs + replay 回放']
  ]);
  pushLog('指挥官', `已下达任务：${mission}`);
  renderedEventCount = 0;
  AGENTS.forEach(agent => setAgentState(agent.key, { badge: 'Queued', status: '任务排队中', pct: 2, note: agent.note }));
  busProgress.style.width = '10%';
  riskProgress.style.width = '24%';

  try {
    const run = await createMissionRun(mission, mode);
    if (ticket !== activeRun) return;
    currentRunId = run.id;
    missionId.textContent = run.id.replace('run_', 'WAR-').slice(-11).toUpperCase();
    await watchMissionRun(run.id, ticket);
  } catch (error) {
    pushLog('系统', `任务启动失败：${error.message || error}`);
    pushBubble('系统广播', `任务启动失败：${error.message || error}`, 'right', 'review');
  }
}

function renderArchive(runs) {
  if (!archiveList) return;
  if (!runs.length) {
    archiveList.innerHTML = '<div class="archive-empty">暂无归档 run</div>';
    return;
  }
  archiveList.innerHTML = runs.map(run => `
    <div class="archive-item" data-run-id="${run.id}">
      <div class="archive-top">
        <strong>${run.archiveSummary || run.mission || run.id}</strong>
        <span class="archive-chip">${run.status}</span>
      </div>
      <div class="archive-meta">${run.mission || '未命名任务'}</div>
      <div class="archive-meta small">${new Date(run.updatedAt || run.createdAt).toLocaleString('zh-CN', { hour12: false })} · 点击回放</div>
    </div>
  `).join('');
}

async function refreshArchive() {
  try {
    const runs = await fetchRuns(8);
    renderArchive(runs);
  } catch (error) {
    archiveList.innerHTML = `<div class="archive-empty">归档读取失败：${error.message || error}</div>`;
  }
}

async function replayArchivedRun(runId) {
  activeRun += 1;
  currentRunId = null;
  renderedEventCount = 0;
  resetBoard();
  missionState.textContent = '回放中';
  logMeta.textContent = '正在回放历史 run';
  missionId.textContent = runId.replace('run_', 'RPL-').slice(-11).toUpperCase();
  pushLog('系统', `开始回放 ${runId}`);

  const replay = await fetchReplay(runId);
  const run = await fetchRun(runId);
  applyRunPresentation({ ...run, conclusionHtml: '' });
  conclusionText.textContent = '正在按 stage timeline 回放任务…';
  renderedEventCount = 0;

  for (const frame of replay.frames || []) {
    if (frame.agentState?.key) setAgentState(frame.agentState.key, frame.agentState);
    if (frame.content) pushBubble(frame.actor || '系统', frame.content, frame.side || 'left', frame.theme || 'intel');
    if (frame.missionState) missionState.textContent = frame.type === 'result' ? '战备完成' : '回放中';
    await sleep(frame.type === 'result' ? 180 : 260);
  }

  applyRunPresentation(run);
  conclusionText.innerHTML = replay.conclusionHtml || run.conclusionHtml || '该 run 未记录结论摘要。';
  pushLog('系统', `回放完成：${runId}`);
}

function toggleDemo() {
  if (autoLoop) {
    clearInterval(autoLoop);
    autoLoop = null;
    demoBtn.textContent = '◎';
    demoBtn.title = '切换循环模式';
    pushLog('系统', '循环演示已暂停。');
    return;
  }
  demoBtn.textContent = '■';
  demoBtn.title = '停止循环';
  const presets = [
    '监控 BTC 情绪与期权波动，生成低风险波段执行计划。',
    '追踪 ETH 叙事与链上资金流，形成多阶段进攻方案。',
    '监控 SOL 结构变化，输出条件触发与回撤保护方案。'
  ];
  let idx = 0;
  commandInput.value = presets[idx];
  startMission();
  autoLoop = setInterval(() => {
    idx = (idx + 1) % presets.length;
    commandInput.value = presets[idx];
    startMission();
  }, 20000);
}
