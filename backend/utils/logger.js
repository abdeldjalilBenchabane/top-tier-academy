// Debug logging for the route handlers.
//
// The routes carried ~370 unconditional console.log calls: every admin
// dashboard load, every course fetch, every purchase printed several lines to
// pm2's stdout. That is the same habit that grew tth-backend-out.log to 2.1 GB
// (see backend/db.js for the other half of it), and it buries the lines that
// actually matter — the errors — in noise.
//
// These calls are not deleted, because they are genuinely useful when
// something is being debugged. They are switched off instead:
//
//     LOG_DEBUG=true    in backend/.env, then `pm2 restart tth-backend`
//
// console.error and console.warn are deliberately NOT routed through here.
// An error must always reach the log, whatever the debug setting is.
//
// The flag is read on every call rather than once at import time. ES module
// imports all execute before the body of server.js, where dotenv.config() sits
// at line 46 — so reading process.env when this file loads would depend on
// which module happened to call dotenv.config() first. Reading it per call
// costs one property lookup and cannot be wrong.

export const isDebugLogging = () => process.env.LOG_DEBUG === 'true';

export const debugLog = (...args) => {
  if (process.env.LOG_DEBUG === 'true') console.log(...args);
};

export default debugLog;
