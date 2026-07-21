<script>
  let { flows = [] } = $props()
</script>

<div class="flow-graph">
  {#if flows.length === 0}
    <div class="empty">No flows detected yet.</div>
  {:else}
    {#each flows as flow}
      <div class="flow-card">
        <h3>{flow.name || 'Unnamed Flow'}</h3>
        <div class="steps">
          {#each flow.steps || [] as step, i}
            <div class="step">
              <span class="step-num">{i + 1}</span>
              <span class="step-action">{step.action}</span>
              <span class="step-target">{step.target || ''}</span>
            </div>
          {/each}
        </div>
        <div class="meta">
          <span>Confidence: {((flow.confidence || 0) * 100).toFixed(0)}%</span>
          <span>{flow.steps?.length ?? 0} steps</span>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .flow-graph {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .flow-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }

  .flow-card h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 0.75rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    background: var(--bg);
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .step-num {
    width: 20px;
    height: 20px;
    background: var(--accent);
    color: var(--bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .step-action {
    font-weight: 500;
  }

  .step-target {
    color: var(--text-muted);
    font-family: monospace;
    font-size: 0.8rem;
  }

  .meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .empty {
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
  }
</style>
