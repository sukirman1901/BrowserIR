<script>
  import { wsEvents } from '$lib/stores/connection'

  let filterType = $state('')

  let filteredEvents = $derived(
    filterType
      ? $wsEvents.filter(e => e.type === filterType)
      : $wsEvents
  )

  const eventTypes = $derived(
    [...new Set($wsEvents.map(e => e.type))].sort()
  )
</script>

<div class="event-feed">
  <div class="header">
    <h2>Event Feed</h2>
    <div class="controls">
      <select bind:value={filterType}>
        <option value="">All types</option>
        {#each eventTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
      <span class="count">{filteredEvents.length} events</span>
    </div>
  </div>

  <div class="events-list">
    {#each filteredEvents as event, i (i)}
      <div class="event {event.type || 'unknown'}">
        <span class="type-badge">{event.type || '?'}</span>
        <span class="target">{event.selector || event.ref || '-'}</span>
        <span class="time">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '-'}</span>
      </div>
    {:else}
      <div class="empty">No events yet. Waiting for daemon events...</div>
    {/each}
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

  .controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .controls select {
    padding: 0.35rem 0.5rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    font-size: 0.85rem;
  }

  .count {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .event {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.85rem;
  }

  .type-badge {
    padding: 0.1rem 0.4rem;
    background: var(--accent);
    color: var(--bg);
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    min-width: 60px;
    text-align: center;
  }

  .event.click .type-badge { background: var(--accent-green); }
  .event.navigate .type-badge { background: var(--accent-purple); }
  .event.input .type-badge { background: var(--accent-yellow); }

  .target {
    flex: 1;
    color: var(--text-muted);
    font-family: monospace;
    font-size: 0.8rem;
  }

  .time {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  .empty {
    padding: 3rem;
    text-align: center;
    color: var(--text-muted);
  }
</style>
