import { g as getContext, a as attr_class, s as store_get, u as unsubscribe_stores } from "../../chunks/index2.js";
import { w as wsConnected } from "../../chunks/connection.js";
import { e as escape_html } from "../../chunks/attributes.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils2.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children } = $$props;
    $$renderer2.push(`<div class="app svelte-12qhfyh"><nav class="sidebar svelte-12qhfyh"><div class="logo svelte-12qhfyh"><h1 class="svelte-12qhfyh">BIR</h1> <span class="subtitle svelte-12qhfyh">Dashboard</span></div> <div class="nav-links svelte-12qhfyh"><a href="/"${attr_class("svelte-12qhfyh", void 0, {
      "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/"
    })}>Overview</a> <a href="/viewport"${attr_class("svelte-12qhfyh", void 0, {
      "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/viewport"
    })}>Viewport</a> <a href="/events"${attr_class("svelte-12qhfyh", void 0, {
      "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/events"
    })}>Events</a> <a href="/flows"${attr_class("svelte-12qhfyh", void 0, {
      "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/flows"
    })}>Flows</a> <a href="/knowledge"${attr_class("svelte-12qhfyh", void 0, {
      "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/knowledge"
    })}>Knowledge</a> <a href="/planner"${attr_class("svelte-12qhfyh", void 0, {
      "active": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/planner"
    })}>Planner</a></div> <div class="status-bar svelte-12qhfyh"><span${attr_class("status-dot svelte-12qhfyh", void 0, {
      "connected": store_get($$store_subs ??= {}, "$wsConnected", wsConnected)
    })}></span> <span class="status-text svelte-12qhfyh">${escape_html(store_get($$store_subs ??= {}, "$wsConnected", wsConnected) ? "Connected" : "Disconnected")}</span></div></nav> <main class="content svelte-12qhfyh">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
