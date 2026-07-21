<script lang="ts">
  import { wsConnected, sendRpc } from '$lib/stores/connection'

  let screenshot = $state('')
  let ir = $state<any>(null)
  let error = $state('')
  let loading = $state(true)

  async function refresh() {
    loading = true
    error = ''
    try {
      const result = await sendRpc('screenshot')
      screenshot = result.screenshot || ''
      ir = await sendRpc('explain')
    } catch (e: any) {
      error = e.message || 'Failed to load viewport'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    if ($wsConnected) {
      refresh()
    }
  })
</script>

<div class="viewport">
  <div class="header">
    <h2>Live Viewport</h2>
    <button onclick={refresh} disabled={loading}>
      {loading ? 'Loading...' : 'Refresh'}
    </button>
  </div>

  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <div class="viewport-container">
    {#if screenshot}
      <img src="data:image/png;base64,{screenshot}" alt="viewport" class="screenshot" />
    {:else if !loading}
      <div class="empty">No screenshot available. Start a browser session first.</div>
    {/if}

    {#if ir}
      <div class="ir-overlay">
        {#if ir.page?.sections}
          {#each ir.page.sections as section}
            <div class="section-label" style="left: {section.components?.[0]?.position?.x ?? 0}px; top: {section.components?.[0]?.position?.y ?? 0}px">
              {section.label}
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .header h2 {
    font-size: 1.5rem;
  }

  .header button {
    padding: 0.4rem 0.8rem;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .header button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-banner {
    padding: 0.75rem 1rem;
    background: rgba(248, 81, 73, 0.15);
    border: 1px solid var(--accent-red);
    border-radius: 6px;
    color: var(--accent-red);
    margin-bottom: 1rem;
  }

  .viewport-container {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-surface);
  }

  .screenshot {
    width: 100%;
    display: block;
  }

  .ir-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .section-label {
    position: absolute;
    background: rgba(88, 166, 255, 0.15);
    border: 1px solid var(--accent);
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.7rem;
    color: var(--accent);
    white-space: nowrap;
  }

  .empty {
    padding: 4rem;
    text-align: center;
    color: var(--text-muted);
  }
</style>
