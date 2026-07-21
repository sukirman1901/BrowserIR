import { a as attr_class, s as store_get, u as unsubscribe_stores } from "../../chunks/index2.js";
import { w as wsConnected } from "../../chunks/connection.js";
import { e as escape_html } from "../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<div class="overview svelte-1uha8ag"><h2 class="svelte-1uha8ag">Overview</h2> <div class="cards svelte-1uha8ag"><div class="card svelte-1uha8ag"><h3 class="svelte-1uha8ag">Connection</h3> <div${attr_class("card-value svelte-1uha8ag", void 0, {
      "connected": store_get($$store_subs ??= {}, "$wsConnected", wsConnected)
    })}>${escape_html(store_get($$store_subs ??= {}, "$wsConnected", wsConnected) ? "Connected" : "Disconnected")}</div></div> <div class="card svelte-1uha8ag"><h3 class="svelte-1uha8ag">Daemon</h3> <div class="card-value svelte-1uha8ag">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`Checking...`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="card svelte-1uha8ag"><h3 class="svelte-1uha8ag">Sessions</h3> <div class="card-value svelte-1uha8ag">${escape_html(0)}</div></div> <div class="card svelte-1uha8ag"><h3 class="svelte-1uha8ag">Pages Seen</h3> <div class="card-value svelte-1uha8ag">${escape_html(0)}</div></div></div> <div class="quick-actions svelte-1uha8ag"><h3 class="svelte-1uha8ag">Quick Actions</h3> <div class="actions svelte-1uha8ag"><a href="/viewport" class="action-btn svelte-1uha8ag">View Page</a> <a href="/events" class="action-btn svelte-1uha8ag">Event Feed</a> <a href="/flows" class="action-btn svelte-1uha8ag">Detected Flows</a> <a href="/knowledge" class="action-btn svelte-1uha8ag">Knowledge Graph</a></div></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
