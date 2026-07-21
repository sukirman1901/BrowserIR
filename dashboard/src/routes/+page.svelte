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
  <h2>Overview</h2>

  <div class="cards">
    <div class="card">
      <h3>Connection</h3>
      <div class="card-value" class:connected={$wsConnected}>
        {$wsConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>

    <div class="card">
      <h3>Daemon</h3>
      <div class="card-value">
        {#if loading}
          Checking...
        {:else if status?.error}
          <span class="error">Offline</span>
        {:else}
          <span class="success">Running</span>
        {/if}
      </div>
    </div>

    <div class="card">
      <h3>Sessions</h3>
      <div class="card-value">
        {status?.sessions?.length ?? 0}
      </div>
    </div>

    <div class="card">
      <h3>Pages Seen</h3>
      <div class="card-value">
        {status?.pagesSeen ?? 0}
      </div>
    </div>
  </div>

  <div class="quick-actions">
    <h3>Quick Actions</h3>
    <div class="actions">
      <a href="/viewport" class="action-btn">View Page</a>
      <a href="/events" class="action-btn">Event Feed</a>
      <a href="/flows" class="action-btn">Detected Flows</a>
      <a href="/knowledge" class="action-btn">Knowledge Graph</a>
    </div>
  </div>
</div>

<style>
  .overview h2 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .card h3 {
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .card-value {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .card-value.connected {
    color: var(--accent-green);
  }

  .success {
    color: var(--accent-green);
  }

  .error {
    color: var(--accent-red);
  }

  .quick-actions h3 {
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 0.5rem 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 0.9rem;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: var(--bg-hover);
    border-color: var(--accent);
    text-decoration: none;
  }
</style>
