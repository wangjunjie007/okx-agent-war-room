export function buildReplayFrames(run) {
  const timeline = run?.stageTimeline || [];
  const events = run?.events || [];
  const frames = run?.replayFrames?.length
    ? run.replayFrames
    : timeline.map((stage, index) => ({
        seq: index + 1,
        ts: stage.ts,
        type: 'stage',
        stageKey: stage.agent,
        actor: stage.actor,
        side: stage.side,
        theme: stage.theme,
        content: stage.content,
        agentState: stage.agentState,
        missionState: stage.missionState,
        heroSubtitle: run.heroSubtitle || '',
        executionBridgeSummary: run.executionBridge?.summary || ''
      }));

  return {
    runId: run?.id,
    status: run?.status,
    heroSubtitle: run?.heroSubtitle || '',
    conclusionHtml: run?.conclusionHtml || '',
    frames,
    events
  };
}
