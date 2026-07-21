import "clsx";
import { b as attr, e as escape_html } from "../../../chunks/attributes.js";
function Viewport($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = true;
    $$renderer2.push(`<div class="viewport"><div class="header svelte-10js0q2"><h2 class="svelte-10js0q2">Live Viewport</h2> <button${attr("disabled", loading, true)} class="svelte-10js0q2">${escape_html("Loading...")}</button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="viewport-container svelte-10js0q2">`);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function _page($$renderer) {
  Viewport($$renderer);
}
export {
  _page as default
};
