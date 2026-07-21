import "clsx";
import { a4 as ensure_array_like, a as attr_class, a5 as stringify, a3 as derived, s as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as wsEvents } from "../../../chunks/connection.js";
import { e as escape_html } from "../../../chunks/attributes.js";
function EventFeed($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let filterType = "";
    let filteredEvents = derived(() => store_get($$store_subs ??= {}, "$wsEvents", wsEvents));
    const eventTypes = derived(() => [
      ...new Set(store_get($$store_subs ??= {}, "$wsEvents", wsEvents).map((e) => e.type))
    ].sort());
    $$renderer2.push(`<div class="event-feed"><div class="header svelte-ne64jc"><h2 class="svelte-ne64jc">Event Feed</h2> <div class="controls svelte-ne64jc">`);
    $$renderer2.select(
      { value: filterType, class: "" },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`All types`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(eventTypes());
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let type = each_array[$$index];
          $$renderer3.option({ value: type }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(type)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-ne64jc"
    );
    $$renderer2.push(` <span class="count svelte-ne64jc">${escape_html(filteredEvents().length)} events</span></div></div> <div class="events-list svelte-ne64jc">`);
    const each_array_1 = ensure_array_like(filteredEvents());
    if (each_array_1.length !== 0) {
      $$renderer2.push("<!--[-->");
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        let event = each_array_1[i];
        $$renderer2.push(`<div${attr_class(`event ${stringify(event.type || "unknown")}`, "svelte-ne64jc")}><span class="type-badge svelte-ne64jc">${escape_html(event.type || "?")}</span> <span class="target svelte-ne64jc">${escape_html(event.selector || event.ref || "-")}</span> <span class="time svelte-ne64jc">${escape_html(event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : "-")}</span></div>`);
      }
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="empty svelte-ne64jc">No events yet. Waiting for daemon events...</div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _page($$renderer) {
  EventFeed($$renderer);
}
export {
  _page as default
};
