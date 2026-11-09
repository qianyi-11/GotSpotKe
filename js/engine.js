/* GotSpotKe – shared logic: counting, status rules, saved data.
 * Used by both the app (index.html) and the barrier simulator (simulator.html).
 * Both pages share data through localStorage, so the simulator in one tab
 * updates the app in another tab instantly.
 */
(function () {
  'use strict';

  var D = window.GSK_DATA;
  var KEY_LIVE = 'gsk.live.v1';
  var KEY_PREFS = 'gsk.prefs.v1';

  function readJSON(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeJSON(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: keep in memory */ }
  }

  /* ---------- clock (real date, demo time of day) ---------- */
  function now() {
    var d = new Date();
    if (D.mockTime) {
      var hm = D.mockTime.split(':');
      d.setHours(Number(hm[0]), Number(hm[1]), 0, 0);
    }
    return d;
  }
  function startOfDay(d) { var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x.getTime(); }

  /* ---------- live car park counts ---------- */
  function seedLive() {
    var now = Date.now();
    var st = {};
    D.stations.forEach(function (s, i) {
      st[s.id] = { occupied: s.seedOccupied, updatedAt: now - ((i * 7919) % 50) * 1000 };
    });
    return { stations: st, log: [], seq: 0 };
  }

  function loadLive() {
    var l = readJSON(KEY_LIVE);
    if (!l || !l.stations) return seedLive();
    // add any station missing from older saved data
    D.stations.forEach(function (s) {
      if (!l.stations[s.id]) l.stations[s.id] = { occupied: s.seedOccupied, updatedAt: Date.now() };
    });
    if (!l.log) l.log = [];
    if (!l.seq) l.seq = 0;
    return l;
  }

  function saveLive(l) { writeJSON(KEY_LIVE, l); }

  function clock() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  /* A car scans in (kind 'in', takes a spot) or out (kind 'out', gives one back). */
  function gate(live, id, kind, n) {
    var s = D.byId[id];
    if (!s) return live;
    var next = { stations: Object.assign({}, live.stations), log: live.log.slice(), seq: live.seq || 0 };
    var cur = Object.assign({}, next.stations[id]);
    var moved = 0, blocked = false;
    for (var i = 0; i < n; i++) {
      if (kind === 'in') {
        if (cur.occupied >= s.capacity) { blocked = true; break; }
        cur.occupied += 1;
      } else {
        if (cur.occupied <= 0) { blocked = true; break; }
        cur.occupied -= 1;
      }
      moved += 1;
    }
    var t = clock();
    if (moved > 0) {
      cur.updatedAt = Date.now();
      next.seq += 1;
      next.log.unshift({ id: next.seq, time: t, station: id, kind: kind, n: moved, free: s.capacity - cur.occupied });
    }
    if (blocked && kind === 'in') {
      next.seq += 1;
      next.log.unshift({ id: next.seq, time: t, station: id, kind: 'blocked', n: 0, free: 0 });
    }
    next.log = next.log.slice(0, 40);
    next.stations[id] = cur;
    return next;
  }

  /* ---------- status rule ----------
   * Count-based: 30 or fewer free = Few left.
   * Small car parks (under 100 bays): 10 or fewer free = Few left.
   */
  function statusKey(free, capacity) {
    if (free <= 0) return 'full';
    var fewAt = capacity < 100 ? 10 : 30;
    return free <= fewAt ? 'few' : 'available';
  }

  /* ---------- user preferences ---------- */
  function seedPrefs() {
    return {
      lang: (navigator.language || '').toLowerCase().indexOf('ms') === 0 ? 'ms' : 'en',
      dark: null,              // null = follow the phone's setting
      showAs: 'spots',
      defaultLevel: 20,
      morning: true,
      favs: ['kwd', 'sgb'],
      alerts: { kwd: { level: 20, on: true }, sgb: { level: 50, on: false } },
      history: seedHistory(),
      unread: 0
    };
  }

  function seedHistory() {
    var yesterday = startOfDay(now()) - 86400000;
    return [
      { id: 'h0', kind: 'full', name: 'Sungai Buloh', n: 0, ts: yesterday + 461 * 60000 },
      { id: 'h1', kind: 'low', name: 'Kwasa Damansara', n: 15, ts: yesterday + 458 * 60000 }
    ];
  }

  function loadPrefs() {
    var p = readJSON(KEY_PREFS);
    var base = seedPrefs();
    if (!p) return base;
    Object.keys(base).forEach(function (k) { if (p[k] === undefined) p[k] = base[k]; });
    p.favs = p.favs.filter(function (id) { return !!D.byId[id]; });
    // older saved history used day/mins: convert it to a real timestamp
    p.history = (p.history || []).map(function (h) {
      if (h.ts) return h;
      var day = startOfDay(now()) - (h.day === 'today' ? 0 : 86400000);
      return { id: h.id, kind: h.kind, name: h.name, n: h.n, ts: day + (h.mins || 0) * 60000 };
    });
    delete p.liveSim;
    return p;
  }

  function savePrefs(p) { writeJSON(KEY_PREFS, p); }

  window.GSK_ENGINE = {
    KEY_LIVE: KEY_LIVE,
    now: now,
    startOfDay: startOfDay,
    KEY_PREFS: KEY_PREFS,
    seedLive: seedLive,
    loadLive: loadLive,
    saveLive: saveLive,
    gate: gate,
    statusKey: statusKey,
    seedPrefs: seedPrefs,
    loadPrefs: loadPrefs,
    savePrefs: savePrefs
  };
})();
