<script lang="ts">
  import '../app.css'
  import { wsConnected, connect } from '$lib/stores/connection'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'

  let { children } = $props()
  let mobileOpen = $state(false)

  onMount(() => connect())

  function toggleMobile() {
    mobileOpen = !mobileOpen
  }

  function closeMobile() {
    mobileOpen = false
  }
</script>

<!-- Mobile Top Header Bar -->
<header class="mobile-header">
  <div class="mobile-brand">
    <span class="logo-title">BrowserIR</span>
  </div>
  
  <div class="mobile-actions">
    <span class="status-pill" class:connected={$wsConnected}>
      {$wsConnected ? 'Connected' : 'Offline'}
    </span>
    <button class="hamburger-btn" onclick={toggleMobile} aria-label="Toggle navigation menu">
      {#if mobileOpen}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      {:else}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      {/if}
    </button>
  </div>
</header>

<!-- Mobile Overlay Backdrop -->
{#if mobileOpen}
  <button class="backdrop" onclick={closeMobile} aria-label="Close menu"></button>
{/if}

<div class="app">
  <nav class="sidebar" class:open={mobileOpen}>
    <div class="logo">
      <h1>BrowserIR</h1>
    </div>

    <div class="nav-links">
      <a href="/" class:active={$page.url.pathname === '/'} onclick={closeMobile}>
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        <span>Overview</span>
      </a>
      <a href="/viewport" class:active={$page.url.pathname === '/viewport'} onclick={closeMobile}>
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
        <span>Viewport</span>
      </a>
      <a href="/events" class:active={$page.url.pathname === '/events'} onclick={closeMobile}>
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
        <span>Events</span>
      </a>
      <a href="/flows" class:active={$page.url.pathname === '/flows'} onclick={closeMobile}>
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/></svg>
        <span>Flows</span>
      </a>
      <a href="/knowledge" class:active={$page.url.pathname === '/knowledge'} onclick={closeMobile}>
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><line x1="2" x2="22" y1="12" y2="12"/></svg>
        <span>Knowledge</span>
      </a>
      <a href="/planner" class:active={$page.url.pathname === '/planner'} onclick={closeMobile}>
        <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
        <span>Planner</span>
      </a>
    </div>

    <div class="status-bar">
      <span class="status-dot" class:connected={$wsConnected}></span>
      <span class="status-text">{$wsConnected ? 'Daemon Connected' : 'Daemon Offline'}</span>
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

  /* Mobile Top Bar */
  .mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    padding: 0 1.25rem;
    align-items: center;
    justify-content: space-between;
    z-index: 40;
    box-shadow: var(--shadow-sm);
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .hamburger-btn {
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }

  .hamburger-btn:hover {
    background: var(--bg-hover);
  }

  .status-pill {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    background: var(--accent-red-bg);
    color: var(--accent-red);
  }

  .status-pill.connected {
    background: var(--accent-green-bg);
    color: var(--accent-green);
  }

  /* Backdrop Overlay */
  .backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(2px);
    z-index: 45;
    border: none;
  }

  /* Sidebar styling */
  .sidebar {
    width: 240px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 1.25rem 0;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
    box-shadow: var(--shadow-sm);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .logo {
    padding: 0 1.25rem 1.25rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1rem;
  }

  .logo h1 {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.025em;
  }

  .logo-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.025em;
  }

  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 0.75rem;
    flex: 1;
  }

  .nav-links a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 0.925rem;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .nav-icon {
    color: var(--text-muted);
    transition: color 0.15s ease;
  }

  .nav-links a:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .nav-links a:hover .nav-icon {
    color: var(--accent);
  }

  .nav-links a.active {
    background: var(--accent-light);
    color: var(--accent);
    font-weight: 600;
  }

  .nav-links a.active .nav-icon {
    color: var(--accent);
  }

  .status-bar {
    padding: 0.85rem 1.25rem;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--bg);
    margin: 0 0.75rem;
    border-radius: 8px;
  }

  .status-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--accent-red);
  }

  .status-dot.connected {
    background: var(--accent-green);
    box-shadow: 0 0 8px rgba(22, 163, 74, 0.4);
  }

  .status-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .content {
    margin-left: 240px;
    flex: 1;
    padding: 2rem 2.5rem;
    max-width: 1400px;
    transition: margin-left 0.25s ease;
  }

  /* Responsive Mobile Layout Breakpoint */
  @media (max-width: 768px) {
    .mobile-header {
      display: flex;
    }

    .backdrop {
      display: block;
    }

    .sidebar {
      transform: translateX(-100%);
      top: 60px;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .content {
      margin-left: 0;
      padding: 1.25rem;
      margin-top: 60px;
    }
  }
</style>
