import { w as writable } from "./index.js";
const wsConnected = writable(false);
const wsEvents = writable([]);
export {
  wsEvents as a,
  wsConnected as w
};
