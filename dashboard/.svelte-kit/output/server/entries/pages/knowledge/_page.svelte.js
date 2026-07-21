import { b as attr } from "../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let searchQuery = "";
    $$renderer2.push(`<div class="knowledge-page"><div class="header svelte-u7nvcr"><h2 class="svelte-u7nvcr">Knowledge Graph</h2> <div class="search svelte-u7nvcr"><input type="text" placeholder="Search nodes..."${attr("value", searchQuery)} class="svelte-u7nvcr"/> <button class="svelte-u7nvcr">Search</button></div></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="loading svelte-u7nvcr">Loading knowledge graph...</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
