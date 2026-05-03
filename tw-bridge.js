// Phase 3.5 — the one line on the ALIVE side that closes the eye/hand loop.
//
// Training Wheels (https://github.com/eliskcage/training-wheels) exposes
// window.tw_subscribeShapeStream from its v3/bridge/aliveBridge.js. Every
// shape selected in TW arrives here as the same alphabet ALIVE was trained
// on (square / triangle / circle / diamond + L1 colour palette). No OCR.
// No DOM scraping. Same vocabulary on both sides of the eye.
//
// The wrapper around the one line is load-order tolerance plus a queueing
// default for window.alive.perceive, so this file is safe to load before
// the real perceive handler is wired. Real perception swaps in by
// replacing window.alive.perceive — no changes to this bridge.

(function () {
  window.alive = window.alive || {};
  window.alive.perceive = window.alive.perceive || function (steps) {
    (window.alive._perceiveQueue = window.alive._perceiveQueue || []).push({ steps: steps, t: Date.now() });
  };

  var go = function () {
    if (typeof window.tw_subscribeShapeStream !== 'function') return false;
    // The one line of intent.
    window.tw_subscribeShapeStream(function (snapshot) { window.alive.perceive(snapshot.steps); });
    return true;
  };

  if (go()) return;
  var tries = 0;
  var id = setInterval(function () { if (go() || ++tries > 100) clearInterval(id); }, 50);
})();
