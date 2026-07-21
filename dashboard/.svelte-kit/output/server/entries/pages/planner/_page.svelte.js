import { a4 as ensure_array_like, a as attr_class } from "../../../chunks/index2.js";
import { b as attr, e as escape_html } from "../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let goal = "";
    let domain = "";
    let plans = [];
    let loading = false;
    $$renderer2.push(`<div class="planner-page"><div class="header svelte-izsfqr"><h2 class="svelte-izsfqr">Plan Editor</h2></div> <div class="create-form svelte-izsfqr"><h3 class="svelte-izsfqr">Create New Plan</h3> <div class="form-row svelte-izsfqr"><input type="text" placeholder="Goal (e.g., Login to GitHub)"${attr("value", goal)} class="svelte-izsfqr"/> <input type="text" placeholder="Domain (e.g., github.com)"${attr("value", domain)} class="svelte-izsfqr"/> <button${attr("disabled", !goal, true)} class="svelte-izsfqr">${escape_html("Create Plan")}</button></div></div> <div class="plans-list svelte-izsfqr"><h3 class="svelte-izsfqr">Plans</h3> `);
    if (plans.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty svelte-izsfqr">No plans yet. Create one above.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(plans);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let plan = each_array[$$index_1];
        $$renderer2.push(`<div class="plan-card svelte-izsfqr"><div class="plan-header svelte-izsfqr"><span${attr_class("plan-status svelte-izsfqr", void 0, {
          "completed": plan.status === "completed",
          "pending": plan.status === "pending"
        })}>${escape_html(plan.status || "created")}</span> <span class="plan-goal svelte-izsfqr">${escape_html(plan.goal)}</span> <button${attr("disabled", loading, true)} class="svelte-izsfqr">Execute</button></div> `);
        if (plan.steps) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="steps svelte-izsfqr"><!--[-->`);
          const each_array_1 = ensure_array_like(plan.steps);
          for (let i = 0, $$length2 = each_array_1.length; i < $$length2; i++) {
            let step = each_array_1[i];
            $$renderer2.push(`<div class="step svelte-izsfqr"><span class="step-num svelte-izsfqr">${escape_html(i + 1)}</span> <span>${escape_html(step.action)}</span> <span class="step-target svelte-izsfqr">${escape_html(step.target || "")}</span></div>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
