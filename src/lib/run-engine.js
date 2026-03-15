import { AGENTS, makeAgentState } from './agents.js';
import { buildMissionPlan } from './mission-engine.js';
import { appendEvent, appendReplayFrame, appendStageRecord, createRunId, patchRun, saveRun } from './store.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function baseRun({ mission, mode }) {
  return {
    id: createRunId(),
    mission,
    mode,
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    events: [],
    stageTimeline: [],
    replayFrames: [],
    agentStates: AGENTS.map(a => ({ key: a.key, pct: 0, status: '待命', note: '', badge: 'Standby', busy: false })),
    plan: null,
    summary: null,
    executionBridge: null,
    archiveSummary: '',
    heroSubtitle: '任务初始化中…'
  };
}

function mergeAgent(run, agentState) {
  const next = run.agentStates.map(item => item.key === agentState.key ? agentState : item);
  return patchRun(run.id, { agentStates: next });
}

async function recordStage(runId, run, stage, seq) {
  const nextRun = mergeAgent(run, stage.state);
  await appendEvent(runId, { type: 'agent', ...stage.event });
  await appendStageRecord(runId, {
    seq,
    agent: stage.agent,
    actor: stage.event.actor,
    side: stage.event.side,
    theme: stage.event.theme,
    content: stage.event.content,
    agentState: stage.state,
    missionState: stage.state.status
  });
  await appendReplayFrame(runId, {
    seq,
    type: 'stage',
    stageKey: stage.agent,
    actor: stage.event.actor,
    side: stage.event.side,
    theme: stage.event.theme,
    content: stage.event.content,
    agentState: stage.state,
    missionState: stage.state.status
  });
  return nextRun;
}

export async function createAndStartRun({ mission, mode = 'alpha' }) {
  const run = saveRun(baseRun({ mission, mode }));
  runMission(run.id).catch(async (error) => {
    await appendEvent(run.id, { type: 'system', side: 'right', theme: 'review', actor: '系统广播', content: `任务执行失败：${error.message || String(error)}` });
    patchRun(run.id, { status: 'failed', error: error.message || String(error) });
  });
  return run;
}

export async function runMission(runId) {
  let run = patchRun(runId, { status: 'running' });
  await appendEvent(runId, { type: 'system', side: 'right', theme: 'intel', actor: '系统广播', content: '战区已联机，开始建立本轮任务上下文。' });
  const plan = await buildMissionPlan({ mission: run.mission, mode: run.mode });
  run = patchRun(runId, {
    plan,
    summary: {
      asset: plan.asset,
      mode: plan.mode,
      riskText: plan.riskText,
      execution: plan.execution,
      bridgeStatus: plan.executionBridge?.status || 'Watching',
      signalScore: plan.signalScore,
      backtest: plan.backtest
    },
    executionBridge: plan.executionBridge,
    archiveSummary: `${plan.asset} · ${plan.bias} · Score ${plan.signalScore?.total || 0} · ${plan.executionBridge?.status || 'Watching'}`,
    heroSubtitle: plan.heroSubtitle
  });

  const outputs = plan.stageOutputs;
  const stages = [
    {
      agent: 'intel',
      state: makeAgentState('intel', 20, '解析叙事信号', outputs.intel.note),
      event: { actor: '情报总监 → OKX CORE', side: 'left', theme: 'intel', content: outputs.intel.text }
    },
    {
      agent: 'chain',
      state: makeAgentState('chain', 36, '链上/流量侦察', outputs.chain.note, 'Scanning'),
      event: { actor: '链上侦察官', side: 'left', theme: 'chain', content: outputs.chain.text }
    },
    {
      agent: 'strategy',
      state: makeAgentState('strategy', 54, '生成作战方案', outputs.strategy.note, 'Thinking'),
      event: { actor: '策略指挥官', side: 'right', theme: 'strategy', content: outputs.strategy.text }
    },
    {
      agent: 'risk',
      state: makeAgentState('risk', 70, '风险审议中', outputs.risk.note, 'Reviewing'),
      event: { actor: '风控总监', side: 'right', theme: 'risk', content: outputs.risk.text }
    },
    {
      agent: 'exec',
      state: makeAgentState('exec', 84, '编排执行总线', outputs.exec.note, 'Executing'),
      event: { actor: '执行官', side: 'right', theme: 'exec', content: outputs.exec.text }
    },
    {
      agent: 'review',
      state: makeAgentState('review', 94, '生成最终纪要', '提炼最终结论、任务 replay、评分与回测概览。', 'Reviewing'),
      event: { actor: '复盘官', side: 'left', theme: 'review', content: outputs.review.text }
    }
  ];

  for (const [index, stage] of stages.entries()) {
    run = await recordStage(runId, run, stage, index + 1);
    await sleep(360);
  }

  run = patchRun(runId, {
    status: 'completed',
    conclusionHtml: plan.conclusionHtml,
    conclusionText: plan.conclusionText
  });

  const completedStates = run.agentStates.map(item => ({ ...item, pct: 100, status: '协同完成', badge: 'Synced', busy: false }));
  patchRun(runId, { agentStates: completedStates });
  await appendEvent(runId, { type: 'system', actor: '系统广播', side: 'right', theme: 'review', content: '最终结论已生成，任务闭环完成。' });
  await appendReplayFrame(runId, {
    seq: stages.length + 1,
    type: 'result',
    stageKey: 'review',
    actor: '系统广播',
    side: 'right',
    theme: 'review',
    content: '最终结论已生成，任务闭环完成。',
    missionState: '战备完成'
  });
}
