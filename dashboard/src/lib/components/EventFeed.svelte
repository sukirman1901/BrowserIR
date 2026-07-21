<script lang="ts">
  import { wsEvents } from '$lib/stores/connection'

  let filterType = $state('')

  let filteredEvents = $derived(
    filterType
      ? $wsEvents.filter((e: any) => e.type === filterType)
      : $wsEvents
  )

  const eventTypes = $derived(
    [...new Set($wsEvents.map((e: any) => e.type))].sort()
  )
</script>

<div class="event-feed">
  <div class="header">
    <div>
      <h2>Realtime Event Feed</h2>
      <p class="subtitle-text">Live event stream captured from active browser sessions</p>
    </div>
    <div class="controls">
      <select bind:value={filterType}>
        <option value="">All event types</option>
        {#each eventTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
      <span class="count-badge">{filteredEvents.length} events</span>
    </div>
  </div>

  <div class="events-list">
    {#each filteredEvents as event, i (i)}
      <div class="event-item {event.type || 'unknown'}">
        <span class="type-badge {event.type || 'unknown'}">{event.type || 'event'}</span>
        <span class="target-text">{event.selector || event.ref || event.url || '-'}</span>
        <span class="time-text">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '-'}</span>
      </div>
    {:else}
      <div class="empty-card">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
        <p>No events recorded yet. Waiting for browser events...</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1.5rem;
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

  .controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .controls select {
    padding: 0.45rem 0.75rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }

  .count-badge {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--bg-hover);
    padding: 0.3rem 0.65rem;
    border-radius: 6px;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 75vh;
    overflow-y: auto;
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 0.875rem;
    box-shadow: var(--shadow-sm);
  }

  .type-badge {
    padding: 0.2rem 0.6rem;
    background: var(--accent-light);
    color: var(--accent);
    border-radius: 6px;
    font-size: 0.725rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    min-width: 75px;
    text-align: center;
  }

  .type-badge.click {
    background: var(--accent-green-bg);
    color: var(--accent-green);
  }

  .type-badge.navigate {
    background: var(--accent-purple-bg);
    color: var(--accent-purple);
  }

  .type-badge.input {
    background: var(--accent-yellow-bg);
    color: var(--accent-yellow);
  }

  .target-text {
    flex: 1;
    color: var(--text);
    font-family: monospace;
    font-size: 0.825rem;
    word-break: break-all;
  }

  .time-text {
    color: var(--text-muted);
    font-size: 0.775rem;
    font-weight: 500;
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
