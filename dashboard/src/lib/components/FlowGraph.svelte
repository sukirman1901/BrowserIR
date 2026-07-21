<script lang="ts">
  let { flows = [] } = $props<{ flows?: any[] }>()
</script>

<div class="flow-graph">
  {#if flows.length === 0}
    <div class="empty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/></svg>
      <p>No user flows detected yet. Interact with pages to capture multi-step flows.</p>
    </div>
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
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
  }

  .flow-card h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.85rem;
    color: var(--text);
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 0.85rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.45rem 0.75rem;
    background: var(--bg-muted);
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .step-num {
    width: 22px;
    height: 22px;
    background: var(--accent);
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.725rem;
    font-weight: 700;
  }

  .step-action {
    font-weight: 600;
    color: var(--text);
  }

  .step-target {
    color: var(--text-muted);
    font-family: monospace;
    font-size: 0.8rem;
  }

  .meta {
    display: flex;
    gap: 1.25rem;
    font-size: 0.775rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .empty {
    padding: 4rem 2rem;
    text-align: center;
    color: var(--text-muted);
    background: var(--bg-surface);
    border: 1px dashed var(--border-strong);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
</style>
