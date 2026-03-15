import { runChainAgent } from '../agents/chain-agent.js';
import { runExecutionAgent } from '../agents/execution-agent.js';
import { runIntelAgent } from '../agents/intel-agent.js';
import { runReviewAgent } from '../agents/review-agent.js';
import { runRiskAgent } from '../agents/risk-agent.js';
import { runStrategyAgent } from '../agents/strategy-agent.js';
import { buildBacktestPreview, buildExecutionSimulator, buildSignalScore } from './analytics.js';
import { getMarketSnapshot } from './okx.js';
import { decideTone, detectAsset, riskLevel, side } from './mission-utils.js';

export async function buildMissionPlan({ mission, mode = 'alpha' }) {
  const asset = detectAsset(mission);
  const snapshot = await getMarketSnapshot(asset);
  const tones = decideTone(mode, snapshot);
  const bias = side(snapshot);
  const risk = riskLevel(snapshot);
  const signalScore = buildSignalScore({ snapshot, bias, risk, mode });
  const backtest = buildBacktestPreview({ snapshot, bias });
  const simulator = buildExecutionSimulator({ snapshot, bias, risk, signalScore, backtest });

  const context = { mission, mode, asset, snapshot, tones, bias, risk, signalScore, backtest, simulator };
  const intel = runIntelAgent(context);
  const chain = runChainAgent(context);
  const strategy = runStrategyAgent({ ...context, intel, chain });
  const riskAgent = runRiskAgent({ ...context, intel, chain, strategy });
  const executionAgent = runExecutionAgent({ ...context, intel, chain, strategy, riskAgent });
  const review = runReviewAgent({ ...context, intel, chain, strategy, riskAgent, executionAgent });

  return {
    mission,
    mode,
    asset,
    tones,
    bias,
    risk,
    snapshot,
    signalScore,
    backtest,
    simulator,
    stageOutputs: {
      intel,
      chain,
      strategy,
      risk: riskAgent,
      exec: executionAgent,
      review
    },
    intel: intel.text,
    flow: chain.text,
    strategy: strategy.text,
    riskText: riskAgent.text,
    execution: executionAgent.execution,
    executionBridge: executionAgent.bridge,
    conclusionHtml: review.conclusionHtml,
    conclusionText: review.conclusionText,
    heroSubtitle: review.heroSubtitle
  };
}
