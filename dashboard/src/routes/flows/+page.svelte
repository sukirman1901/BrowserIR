<script>
  import FlowGraph from '$lib/components/FlowGraph.svelte'
  import { sendRpc } from '$lib/stores/connection'
  import { onMount } from 'svelte'

  let flows = $state([])
  let loading = $state(true)

  onMount(async () => {
    try {
      const result = await sendRpc('flow.list', { domain: '' })
      flows = result || []
    } catch {
      flows = []
    } finally {
      loading = false
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
