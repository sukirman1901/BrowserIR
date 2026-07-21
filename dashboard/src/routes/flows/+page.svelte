<script lang="ts">
  import FlowGraph from '$lib/components/FlowGraph.svelte'
  import { wsConnected, sendRpc } from '$lib/stores/connection'

  let flows = $state<any[]>([])
  let loading = $state(true)

  $effect(() => {
    if ($wsConnected) {
      loading = true
      sendRpc('flow.list', { domain: '' })
        .then((result) => {
          flows = result || []
        })
        .catch(() => {
          flows = []
        })
        .finally(() => {
          loading = false
        })
    } else {
      loading = true
      flows = []
    }
  })
</script>

<div class="flows-page">
  <div class="header">
    <h2>Detected Flows</h2>
  </div>

  {#if loading}
    <div class="loading">Loading flows...</div>
  {:else}
    <FlowGraph {flows} />
  {/if}
</div>

<style>
  .header {
    margin-bottom: 1.5rem;
  }

  .header h2 {
    font-size: 1.5rem;
  }

  .loading {
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
  }
</style>
