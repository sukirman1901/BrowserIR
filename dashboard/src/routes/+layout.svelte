<script>
  import '../app.css'
  import { wsConnected } from '$lib/stores/connection'
  import { connect } from '$lib/stores/connection'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'

  let { children } = $props()

  onMount(() => connect())
</script>

<div class="app">
  <nav class="sidebar">
    <div class="logo">
      <h1>BIR</h1>
      <span class="subtitle">Dashboard</span>
    </div>

    <div class="nav-links">
      <a href="/" class:active={$page.url.pathname === '/'}>Overview</a>
      <a href="/viewport" class:active={$page.url.pathname === '/viewport'}>Viewport</a>
      <a href="/events" class:active={$page.url.pathname === '/events'}>Events</a>
      <a href="/flows" class:active={$page.url.pathname === '/flows'}>Flows</a>
      <a href="/knowledge" class:active={$page.url.pathname === '/knowledge'}>Knowledge</a>
      <a href="/planner" class:active={$page.url.pathname === '/planner'}>Planner</a>
    </div>

    <div class="status-bar">
      <span class="status-dot" class:connected={$wsConnected}></span>
      <span class="status-text">{$wsConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  </nav>

  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  .app {
    display: flex;
    min-height: 100vh;
  }

  .sidebar {
    width: 220px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
  }

  .logo {
    padding: 0 1rem 1rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1rem;
  }

  .logo h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
  }

  .subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 0.5rem;
    flex: 1;
  }

  .nav-links a {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    color: var(--text-muted);
    font-size: 0.9rem;
    transition: all 0.15s;
  }

  .nav-links a:hover {
    background: var(--bg-hover);
    color: var(--text);
    text-decoration: none;
  }

  .nav-links a.active {
    background: var(--bg-hover);
    color: var(--accent);
    font-weight: 500;
  }

  .status-bar {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent-red);
  }

  .status-dot.connected {
    background: var(--accent-green);
    box-shadow: 0 0 6px var(--accent-green);
  }

  .status-text {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .content {
    margin-left: 220px;
    flex: 1;
    padding: 1.5rem 2rem;
  }
</style>
