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
    <h2>Knowledge Graph</h2>
    <div class="search">
      <input
        type="text"
        placeholder="Search nodes..."
        bind:value={searchQuery}
        onkeydown={(e) => e.key === 'Enter' && search()}
      />
      <button onclick={search}>Search</button>
    </div>
  </div>

  {#if loading}
    <div class="loading">Loading knowledge graph...</div>
  {:else if nodes.length === 0}
    <div class="empty">No knowledge nodes found. Start browsing to build knowledge.</div>
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
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header h2 {
    font-size: 1.5rem;
  }

  .search {
    display: flex;
    gap: 0.5rem;
  }

  .search input {
    padding: 0.4rem 0.75rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 0.9rem;
    width: 250px;
  }

  .search button {
    padding: 0.4rem 0.8rem;
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .graph {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .node-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }

  .node-type {
    font-size: 0.7rem;
    color: var(--accent-purple);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .node-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .node-props {
    font-size: 0.8rem;
  }

  .prop {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 2px;
  }

  .prop-key {
    color: var(--text-muted);
  }

  .prop-value {
    color: var(--text);
  }

  .loading, .empty {
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
  }
</style>
