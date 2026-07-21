<script lang="ts">
  import { wsConnected, sendRpc } from '$lib/stores/connection'

  let nodes = $state<any[]>([])
  let searchQuery = $state('')
  let loading = $state(true)

  $effect(() => {
    if ($wsConnected) {
      loading = true
      sendRpc('knowledge.search', { query: '' })
        .then((result) => {
          nodes = result?.nodes || []
        })
        .catch(() => {
          nodes = []
        })
        .finally(() => {
          loading = false
        })
    } else {
      loading = true
      nodes = []
    }
  })

  async function search() {
    loading = true
    try {
      const result = await sendRpc('knowledge.search', { query: searchQuery })
      nodes = result || []
    } catch {
      nodes = []
    } finally {
      loading = false
    }
  }
</script>

<div class="knowledge-page">
  <div class="header">
    <div>
      <h2>Knowledge Graph</h2>
      <p class="subtitle-text">Graph representations and learned semantic entities</p>
    </div>
    <div class="search">
      <input
        type="text"
        placeholder="Search nodes by label..."
        bind:value={searchQuery}
        onkeydown={(e) => e.key === 'Enter' && search()}
      />
      <button onclick={search}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span>Search</span>
      </button>
    </div>
  </div>

  {#if loading}
    <div class="loading">Loading knowledge graph...</div>
  {:else if nodes.length === 0}
    <div class="empty-card">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><line x1="2" x2="22" y1="12" y2="12"/></svg>
      <p>No knowledge nodes found. Start browsing to build knowledge entries.</p>
    </div>
  {:else}
    <div class="graph">
      {#each nodes as node}
        <div class="node-card">
          <div class="node-type">{node.type}</div>
          <div class="node-label">{node.label}</div>
          {#if node.properties}
            <div class="node-props">
              {#each Object.entries(node.properties) as [key, value]}
                <div class="prop">
                  <span class="prop-key">{key}:</span>
                  <span class="prop-value">{value}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
    gap: 1rem;
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

  .search {
    display: flex;
    gap: 0.5rem;
  }

  .search input {
    padding: 0.5rem 0.85rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 0.875rem;
    width: 260px;
    box-shadow: var(--shadow-sm);
  }

  .search button {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    box-shadow: var(--shadow-sm);
    transition: background 0.15s ease;
  }

  .search button:hover {
    background: var(--accent-hover);
  }

  .graph {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .node-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
  }

  .node-type {
    font-size: 0.725rem;
    color: var(--accent-purple);
    background: var(--accent-purple-bg);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    display: inline-block;
    margin-bottom: 0.5rem;
  }

  .node-label {
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--text);
    margin-bottom: 0.75rem;
  }

  .node-props {
    font-size: 0.825rem;
    background: var(--bg-muted);
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
  }

  .prop {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 3px;
  }

  .prop-key {
    color: var(--text-muted);
    font-weight: 500;
  }

  .prop-value {
    color: var(--text);
    font-weight: 600;
  }

  .loading {
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
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
