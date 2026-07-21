<script lang="ts">
  import { wsConnected, sendRpc } from '$lib/stores/connection'

  let status = $state<any>(null)
  let loading = $state(true)

  $effect(() => {
    if ($wsConnected) {
      loading = true
      sendRpc('status')
        .then((res) => {
          status = res
        })
        .catch(() => {
          status = { error: 'Daemon not available' }
        })
        .finally(() => {
          loading = false
        })
    } else {
      loading = true
      status = null
    }
  })
</script>

<div class="overview">
  <div class="page-title">
    <h2>Overview</h2>
    <p class="desc">System status and quick navigation for BrowserIR Runtime</p>
  </div>

  <div class="cards">
    <div class="card">
      <div class="card-header">
        <h3>Connection</h3>
        <div class="icon-bubble" class:connected={$wsConnected}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20v-8"/><path d="M6 12a6 6 0 0 1 12 0"/><path d="M3 9a9 9 0 0 1 18 0"/></svg>
        </div>
      </div>
      <div class="card-value" class:connected={$wsConnected}>
        {$wsConnected ? 'Connected' : 'Disconnected'}
      </div>
      <span class="card-meta">WebSocket status</span>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Daemon Engine</h3>
        <div class="icon-bubble" class:success={status && !status.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
      </div>
      <div class="card-value">
        {#if loading}
          <span class="muted">Checking...</span>
        {:else if status?.error}
          <span class="error">Offline</span>
        {:else}
          <span class="success">Running</span>
        {/if}
      </div>
      <span class="card-meta">RPC daemon process</span>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Sessions</h3>
        <div class="icon-bubble">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/></svg>
        </div>
      </div>
      <div class="card-value">
        {status?.sessions?.length ?? 0}
      </div>
      <span class="card-meta">Active sessions</span>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Pages Seen</h3>
        <div class="icon-bubble">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
        </div>
      </div>
      <div class="card-value">
        {status?.pagesSeen ?? 0}
      </div>
      <span class="card-meta">Analyzed URLs</span>
    </div>
  </div>

  <div class="quick-actions">
    <h3>Quick Actions</h3>
    <div class="actions">
      <a href="/viewport" class="action-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/></svg>
        <span>View Page Viewport</span>
      </a>
      <a href="/events" class="action-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
        <span>Realtime Event Feed</span>
      </a>
      <a href="/flows" class="action-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/></svg>
        <span>Detected User Flows</span>
      </a>
      <a href="/knowledge" class="action-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
        <span>Knowledge Graph</span>
      </a>
    </div>
  </div>
</div>

<style>
  .page-title {
    margin-bottom: 1.75rem;
  }

  .page-title h2 {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .desc {
    color: var(--text-muted);
    font-size: 0.925rem;
    margin-top: 0.2rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2.25rem;
  }

  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .card h3 {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .icon-bubble {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--bg-hover);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-bubble.connected, .icon-bubble.success {
    background: var(--accent-green-bg);
    color: var(--accent-green);
  }

  .card-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text);
    line-height: 1.2;
  }

  .card-value.connected {
    color: var(--accent-green);
  }

  .card-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.35rem;
    display: block;
  }

  .success {
    color: var(--accent-green);
  }

  .error {
    color: var(--accent-red);
  }

  .muted {
    color: var(--text-muted);
  }

  .quick-actions h3 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.25rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-size: 0.925rem;
    font-weight: 600;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--bg-surface);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }
</style>
