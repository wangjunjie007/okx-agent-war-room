import { AGENTS, makeAgentState } from './agents.js';
import { buildMissionPlan } from './mission-engine.js';
import { appendEvent, createRunId, patchRun, saveRun } from './store.js';

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
    agentStates: AGENTS.map(a => ({ key: a.key, pct: 0, status: '待命', note: '', badge: 'Standby', busy: false })),
    plan: null,
    summary: null,
    heroSubtitle: '任务初始化中…'
  };
}

function updateAgent(runId, agentState) {
  return patchRun(runId, {
    agentStates: AGENTS.map(a => a.key === agentState.key ? agentState : undefined)
  });
}

function mergeAgent(run, agentState) {
  const next = run.agentStates.map(item => item.key === agentState.key ? agentState : item);
  return patchRun(run.id, { agentStates: next });
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
      execution: plan.execution
    },
    heroSubtitle: `以 OKX Agent Trade Kit 为执行中枢，当前聚焦 ${plan.asset} 实时任务：现价 ${Number(plan.snapshot.last).toFixed(2)}，24h ${Number(plan.snapshot.change24hPct).toFixed(2)}%，波动率代理 ${Number(plan.snapshot.volatilityPct).toFixed(2)}%。`
  });

  const stages = [
    {
      agent: 'intel',
      state: makeAgentState('intel', 20, '解析叙事信号', `识别任务关键词并抽取 ${plan.tones.join(' / ')}。`),
      event: { actor: '情报总监 → OKX CORE', side: 'left', theme: 'intel', content: plan.intel }
    },
    {
      agent: 'chain',
      state: makeAgentState('chain', 34, '链上/流量侦察', '跟踪盘口流量、深度与异动代理信号。', 'Scanning'),
      event: { actor: '链上侦察官', side: 'left', theme: 'chain', content: plan.flow }
    },
    {
      agent: 'strategy',
      state: makeAgentState('strategy', 52, '生成作战方案', '把情报层与流量层压缩成执行路径。', 'Thinking'),
      event: { actor: '策略指挥官', side: 'right', theme: 'strategy', content: plan.strategy }
    },
    {
      agent: 'risk',
      state: makeAgentState('risk', 68, '风险审议中', '审查执行阈值、仓位节奏与退出条件。', 'Reviewing'),
      event: { actor: '风控总监', side: 'right', theme: 'risk', content: plan.riskText }
    },
    {
      agent: 'exec',
      state: makeAgentState('exec', 82, '编排执行总线', `建立 ${plan.execution[0]} / ${plan.execution[2]} / ${plan.execution[3]} 的执行路径。`, 'Executing'),
      event: { actor: '执行官', side: 'right', theme: 'exec', content: `已接收共识，开始组织执行总线：${plan.execution.join('；')}` }
    },
    {
      agent: 'review',
      state: makeAgentState('review', 92, '生成最终纪要', '提炼最终结论与下一步强化条件。', 'Reviewing'),
      event: { actor: '复盘官', side: 'left', theme: 'review', content: '正在把多 Agent 共识压缩为最终结果摘要。' }
    }
  ];

  for (const stage of stages) {
    run = mergeAgent(run, stage.state);
    await appendEvent(runId, { type: 'agent', ...stage.event });
    await sleep(450);
  }

  run = patchRun(runId, {
    status: 'completed',
    conclusionHtml: plan.conclusionHtml,
    conclusionText: plan.conclusionHtml.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')
  });

  const completedStates = run.agentStates.map(item => ({ ...item, pct: 100, status: '协同完成', badge: 'Synced', busy: false }));
  patchRun(runId, { agentStates: completedStates });
  await appendEvent(runId, { type: 'system', actor: '系统广播', side: 'right', theme: 'review', content: '最终结论已生成，任务闭环完成。' });
}
