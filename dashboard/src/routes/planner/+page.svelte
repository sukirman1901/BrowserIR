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
    <h2>Plan Editor</h2>
  </div>

  <div class="create-form">
    <h3>Create New Plan</h3>
    <div class="form-row">
      <input
        type="text"
        placeholder="Goal (e.g., Login to GitHub)"
        bind:value={goal}
      />
      <input
        type="text"
        placeholder="Domain (e.g., github.com)"
        bind:value={domain}
      />
      <button onclick={createPlan} disabled={creating || !goal || !domain}>
        {creating ? 'Creating...' : 'Create Plan'}
      </button>
    </div>
  </div>

  <div class="plans-list">
    <h3>Plans</h3>
    {#if plans.length === 0}
      <div class="empty">No plans yet. Create one above.</div>
    {:else}
      {#each plans as plan}
        <div class="plan-card">
          <div class="plan-header">
            <span class="plan-status" class:completed={plan.status === 'completed'} class:pending={plan.status === 'pending'}>
              {plan.status || 'created'}
            </span>
            <span class="plan-goal">{plan.goal}</span>
            <button onclick={() => executePlan(plan.id)} disabled={loading}>
              Execute
            </button>
          </div>
          {#if plan.steps}
            <div class="steps">
              {#each plan.steps as step, i}
                <div class="step">
                  <span class="step-num">{i + 1}</span>
                  <span>{step.action}</span>
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
    margin-bottom: 1.5rem;
  }

  .header h2 {
    font-size: 1.5rem;
  }

  .create-form {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .create-form h3 {
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }

  .form-row {
    display: flex;
    gap: 0.5rem;
  }

  .form-row input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 0.9rem;
  }

  .form-row button {
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
  }

  .form-row button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .plans-list h3 {
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }

  .plan-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
  }

  .plan-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .plan-status {
    padding: 0.15rem 0.5rem;
    background: var(--accent-yellow);
    color: var(--bg);
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .plan-status.completed {
    background: var(--accent-green);
  }

  .plan-goal {
    flex: 1;
    font-weight: 500;
  }

  .plan-header button {
    padding: 0.3rem 0.6rem;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .plan-header button:disabled {
    opacity: 0.5;
  }

  .steps {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
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

  .step-target {
    color: var(--text-muted);
    font-family: monospace;
    font-size: 0.8rem;
  }

  .empty {
    padding: 2rem;
    text-align: center;
    color: var(--text-muted);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
</style>
