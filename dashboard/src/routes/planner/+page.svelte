<script lang="ts">
  import { sendRpc } from '$lib/stores/connection'

  let goal = $state('')
  let domain = $state('')
  let plans = $state<any[]>([])
  let loading = $state(false)
  let creating = $state(false)

  async function createPlan() {
    if (!goal || !domain) return
    creating = true
    try {
      const plan = await sendRpc('planner.create', { goal, domain })
      plans = [...plans, plan]
      goal = ''
      domain = ''
    } catch (e: any) {
      alert('Failed to create plan: ' + e.message)
    } finally {
      creating = false
    }
  }

  async function executePlan(planId: string) {
    loading = true
    try {
      const result = await sendRpc('planner.execute', { planId })
      plans = plans.map(p => p.id === planId ? { ...p, ...result.plan } : p)
    } catch (e: any) {
      alert('Failed to execute plan: ' + e.message)
    } finally {
      loading = false
    }
  }
</script>

<div class="planner-page">
  <div class="header">
    <div>
      <h2>Plan Editor</h2>
      <p class="subtitle-text">Autonomous execution planner for multi-step goals</p>
    </div>
  </div>

  <div class="create-form">
    <h3>Create New Autonomous Plan</h3>
    <div class="form-row">
      <input
        type="text"
        placeholder="Goal (e.g., Search product & add to cart)"
        bind:value={goal}
      />
      <input
        type="text"
        placeholder="Domain (e.g., example.com)"
        bind:value={domain}
      />
      <button onclick={createPlan} disabled={creating || !goal || !domain}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        <span>{creating ? 'Creating...' : 'Create Plan'}</span>
      </button>
    </div>
  </div>

  <div class="plans-list">
    <h3>Execution Plans</h3>
    {#if plans.length === 0}
      <div class="empty-card">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
        <p>No plans created yet. Enter a goal and domain above to generate a plan.</p>
      </div>
    {:else}
      {#each plans as plan}
        <div class="plan-card">
          <div class="plan-header">
            <span class="plan-status" class:completed={plan.status === 'completed'} class:pending={plan.status === 'pending'}>
              {plan.status || 'created'}
            </span>
            <span class="plan-goal">{plan.goal}</span>
            <button onclick={() => executePlan(plan.id)} disabled={loading}>
              Execute Plan
            </button>
          </div>
          {#if plan.steps}
            <div class="steps">
              {#each plan.steps as step, i}
                <div class="step">
                  <span class="step-num">{i + 1}</span>
                  <span class="step-action">{step.action}</span>
                  <span class="step-target">{step.target || ''}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .header {
    margin-bottom: 1.75rem;
  }

  .header h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text);
  }

  .subtitle-text {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 0.15rem;
  }

  .create-form {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.75rem;
    box-shadow: var(--shadow-sm);
  }

  .create-form h3 {
    margin-bottom: 0.85rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text);
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .form-row input {
    flex: 1;
    min-width: 200px;
    padding: 0.6rem 0.85rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 0.9rem;
  }

  .form-row button {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.15rem;
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
    box-shadow: var(--shadow-sm);
    transition: background 0.15s ease;
  }

  .form-row button:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .form-row button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .plans-list h3 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
  }

  .plan-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: var(--shadow-sm);
  }

  .plan-header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .plan-status {
    padding: 0.25rem 0.65rem;
    background: var(--accent-yellow-bg);
    color: var(--accent-yellow);
    border-radius: 6px;
    font-size: 0.725rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .plan-status.completed {
    background: var(--accent-green-bg);
    color: var(--accent-green);
  }

  .plan-goal {
    flex: 1;
    font-weight: 700;
    font-size: 1rem;
    color: var(--text);
  }

  .plan-header button {
    padding: 0.45rem 0.85rem;
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .plan-header button:disabled {
    opacity: 0.5;
  }

  .steps {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
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

  .empty-card {
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
