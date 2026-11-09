/* GotSpotKe – app screens and interactions (plain JavaScript, no build step). */
(function () {
  'use strict';

  var D = window.GSK_DATA;
  var I18N = window.GSK_I18N;
  var E = window.GSK_ENGINE;

  var $screen = document.getElementById('screen');
  var $detailBar = document.getElementById('detailBar');
  var $tabbar = document.getElementById('tabbar');
  var $layer = document.getElementById('layer');
  var $themeColor = document.getElementById('themeColor');

  var prefs = E.loadPrefs();
  var live = E.loadLive();
  E.saveLive(live);

  var ui = {
    tab: 'home', detailId: null, fromApp: false,
    query: '', editMine: false, lineTab: 'KG', about: '',
    sheet: null, toast: null, banner: null
  };
  var lastRouteKey = '';
  var toastTimer = null;
  var installPrompt = null;
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  /* ---------- helpers ---------- */
  function T() { return I18N[prefs.lang] || I18N.en; }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isDark() { return prefs.dark === null ? !!(darkQuery && darkQuery.matches) : !!prefs.dark; }
  function save() { E.savePrefs(prefs); }
  function fmt(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }
  function nowMins() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function rel(ts) {
    var t = T(), s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 10) return t.justNow;
    if (s < 60) return t.secAgo(s);
    return t.minAgo(Math.floor(s / 60));
  }
  function num(n) { return Number(n).toLocaleString('en-MY'); }

  var ICON = {
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    bookmark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12V21l-6-4-6 4z"/></svg>',
    bookmarkLg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12V21l-6-4-6 4z"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    nav: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8z"/></svg>',
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 004 0"/></svg>',
    chevron: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    external: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></svg>'
  };
  var TAB_ICONS = {
    home: 'M4 10.5L12 4l8 6.5V20h-5.5v-5.5h-5V20H4z',
    lines: 'M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z M9 4v13.5 M15 6.5V20',
    alerts: 'M6 16V11a6 6 0 0112 0v5l1.5 2h-15z M10 20.5a2 2 0 004 0',
    me: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4.5 20.5a7.5 7.5 0 0115 0'
  };

  /* ---------- station view model ---------- */
  function vm(id) {
    var t = T(), s = D.byId[id], l = live.stations[id];
    var free = s.capacity - l.occupied;
    var key = E.statusKey(free, s.capacity);
    var asPct = prefs.showAs === 'percent';
    var pctFree = Math.round((free / s.capacity) * 100);
    return {
      s: s, id: id, name: s.name, free: free, key: key, status: t[key],
      big: asPct ? pctFree + '%' : String(free),
      bigLabel: asPct ? t.pctFree : t.spotsFree(free),
      pctFull: Math.round((l.occupied / s.capacity) * 100),
      occupied: l.occupied, updatedAt: l.updatedAt,
      saved: prefs.favs.indexOf(id) >= 0,
      alert: prefs.alerts[id] || null
    };
  }
  function chipsHTML(s, withLine) {
    var t = T();
    return s.codes.map(function (c) {
      var label = withLine ? c[1] + ' · ' + (c[0] === 'KG' ? t.lineKG : t.linePY) : c[1];
      return '<span class="chip ' + c[0] + '">' + esc(label) + '</span>';
    }).join('');
  }
  function relSpan(ts, kind) {
    var t = T();
    var text = kind === 'updated' ? t.updated(rel(ts)) : rel(ts);
    return '<span data-ts="' + ts + '" data-kind="' + kind + '">' + esc(text) + '</span>';
  }

  /* ---------- HOME ---------- */
  function homeHTML() {
    var t = T();
    var h = new Date().getHours();
    var greeting = h < 12 ? t.gMorning : (h < 19 ? t.gAfternoon : t.gEvening);
    var mine = prefs.favs.map(vm);
    var withSpace = mine.filter(function (v) { return v.free > 0; }).length;
    var summary;
    if (!mine.length) summary = t.sumNone;
    else if (withSpace === mine.length) summary = mine.length === 1 ? t.sumOne : t.sumAll(mine.length);
    else if (withSpace === 0) summary = t.sumZero;
    else summary = t.sumSome(withSpace, mine.length);
    var latest = 0;
    D.stations.forEach(function (s) { latest = Math.max(latest, live.stations[s.id].updatedAt); });

    return '<div class="page">' +
      '<div class="topbar">' +
        '<div class="brand"><span class="logo" aria-hidden="true">P</span><span class="brand-name">GotSpotKe</span></div>' +
        '<span class="live-pill"><span class="dot"></span>' + esc(t.live) + ' · ' + relSpan(latest, 'plain') + '</span>' +
      '</div>' +
      '<div><h1 class="h1">' + esc(greeting) + '</h1><p class="lede">' + esc(summary) + '</p></div>' +
      '<label class="search">' + ICON.search +
        '<span class="sr-only">' + esc(t.searchAria) + '</span>' +
        '<input id="search" type="search" inputmode="search" autocomplete="off" enterkeyhint="search" placeholder="' + esc(t.search) + '" value="' + esc(ui.query) + '">' +
        (ui.query ? '<button class="icon-btn" type="button" data-act="clear-search" aria-label="' + esc(t.clearSearch) + '">' + ICON.x + '</button>' : '') +
      '</label>' +
      '<div id="homeLists" class="section" style="gap:18px">' + homeListsHTML() + '</div>' +
      '<p class="footnote">' + esc(t.sample) + '</p>' +
    '</div>';
  }

  function homeListsHTML() {
    var t = T();
    var q = ui.query.trim().toLowerCase();
    var out = '';

    if (!q) {
      var mine = prefs.favs.map(vm);
      out += '<section class="section">' +
        '<div class="section-head"><h2 class="section-title">' + esc(t.myStations) + '</h2>' +
        (mine.length ? '<button class="link-btn" type="button" data-act="edit-mine">' + esc(ui.editMine ? t.done : t.edit) + '</button>' : '') +
        '</div>';
      if (!mine.length) {
        out += '<div class="empty">' + ICON.bookmarkLg + '<span>' + esc(t.mineEmpty) + '</span></div>';
      }
      mine.forEach(function (v) {
        if (ui.editMine) {
          out += '<div class="card edit-row"><span>' + esc(v.name) + '</span>' +
            '<button class="remove-btn" type="button" data-act="save" data-id="' + v.id + '">' + esc(t.remove) + '</button></div>';
        } else {
          out += '<button class="card mine" type="button" data-act="open" data-id="' + v.id + '">' +
            '<span class="mine-top">' +
              '<span class="mine-left"><span class="chips">' + chipsHTML(v.s) + '</span><span class="mine-name">' + esc(v.name) + '</span></span>' +
              '<span class="mine-num"><span class="big c-' + v.key + '">' + esc(v.big) + '</span><span class="big-label">' + esc(v.bigLabel) + '</span></span>' +
            '</span>' +
            '<span class="bar"><span class="bg-' + v.key + '" style="width:' + v.pctFull + '%"></span></span>' +
            '<span class="mine-foot"><strong class="i-' + v.key + '">' + esc(v.status) + '</strong>' +
              '<span>' + (v.alert && v.alert.on ? esc(t.alertUnder(v.alert.level)) : '') + '</span></span>' +
          '</button>';
        }
      });
      out += '</section>';
    }

    var list = D.stations.filter(function (s) { return !q || s.name.toLowerCase().indexOf(q) >= 0; }).map(function (s) { return vm(s.id); });
    out += '<section class="section">' +
      '<div class="section-head"><h2 class="section-title">' + esc(q ? t.results : t.allStations) + '</h2>' +
      '<span class="count">' + esc(t.stationsN(list.length)) + '</span></div>';
    if (!list.length) {
      out += '<div class="empty" style="justify-content:center;text-align:center">' + esc(t.noMatch) + '</div>';
    } else {
      out += '<div class="card list">' + list.map(function (v) {
        var c = v.s.codes[0];
        return '<div class="row">' +
          '<button class="row-main" type="button" data-act="open" data-id="' + v.id + '">' +
            '<span class="chip ' + c[0] + ' row-code">' + esc(c[1]) + '</span>' +
            '<span class="row-text"><span class="row-name">' + esc(v.name) + '</span><span class="row-status i-' + v.key + '">' + esc(v.status) + '</span></span>' +
            '<span class="row-num"><b class="c-' + v.key + '">' + esc(v.big) + '</b><small>' + esc(t.free) + '</small></span>' +
          '</button>' +
          '<button class="bm-btn" type="button" data-act="save" data-id="' + v.id + '" aria-pressed="' + v.saved + '" aria-label="' + esc(v.saved ? t.unsaveAria(v.name) : t.saveAria(v.name)) + '">' + ICON.bookmark + '</button>' +
        '</div>';
      }).join('') + '</div>';
    }
    out += '</section>';
    return out;
  }

  /* ---------- LINES ---------- */
  function linesHTML() {
    var t = T();
    var line = ui.lineTab;
    var color = line === 'KG' ? D.lines.KG.color : D.lines.PY.color;
    var rows = D.order[line].map(function (id) {
      var v = vm(id);
      var code = (v.s.codes.filter(function (c) { return c[0] === line; })[0] || v.s.codes[0])[1];
      if (v.s.codes.length > 1) code += ' · ' + t.interchange;
      return '<button class="stop" type="button" data-act="open" data-id="' + id + '">' +
        '<span class="rail" aria-hidden="true"><i class="top"></i><i class="bottom"></i><b></b></span>' +
        '<span class="stop-text"><span class="stop-code">' + esc(code) + '</span><span class="stop-name">' + esc(v.name) + '</span>' +
          '<span class="stop-status i-' + v.key + '">' + esc(v.status) + '</span></span>' +
        '<span class="stop-num"><b class="c-' + v.key + '">' + esc(v.big) + '</b><small>' + esc(t.free) + '</small></span>' +
      '</button>';
    }).join('');
    var seg = ['KG', 'PY'].map(function (k) {
      return '<button type="button" data-act="line" data-v="' + k + '" aria-pressed="' + (line === k) + '">' +
        '<span class="ldot" style="background:' + D.lines[k].color + '"></span>' + esc(D.lines[k].short) + '</button>';
    }).join('');
    return '<div class="page">' +
      '<div><h1 class="h1">' + esc(t.tabLines) + '</h1><p class="lede">' + esc(t.linesSub) + '</p></div>' +
      '<div class="seg">' + seg + '</div>' +
      '<div class="card line-list" style="--line:' + color + '">' + rows + '</div>' +
      '<p class="lede" style="margin:0;font-size:12px">' + esc(t.linesTap) + '</p>' +
    '</div>';
  }

  /* ---------- ALERTS ---------- */
  function alertsHTML() {
    var t = T();
    var ids = Object.keys(prefs.alerts).filter(function (id) { return !!D.byId[id]; });
    var cards = ids.map(function (id) {
      var v = vm(id), a = prefs.alerts[id];
      return '<div class="card alert-card">' +
        '<button class="alert-main" type="button" data-act="open" data-id="' + id + '">' +
          '<b>' + esc(v.name) + '</b><span>' + esc(t.rule(a.level)) + '</span>' +
          '<small class="i-' + v.key + '">' + esc(t.nowFree(v.free, v.status)) + '</small>' +
        '</button>' +
        '<button class="link-btn" type="button" data-act="alert-edit" data-id="' + id + '">' + esc(t.edit) + '</button>' +
        '<button class="switch" type="button" role="switch" data-act="alert-toggle" data-id="' + id + '" aria-checked="' + !!a.on + '" aria-label="' + esc(t.alertAria(v.name)) + '"></button>' +
      '</div>';
    }).join('');
    var hist = prefs.history.map(function (h) {
      var text = h.kind === 'full' ? t.histFull(h.name) : t.histLow(h.n, h.name);
      var when = (h.day === 'today' ? t.today : t.yesterday) + ', ' + fmt(h.mins);
      return '<div class="hist">' + ICON.bell + '<div><b>' + esc(text) + '</b><small>' + esc(when) + '</small></div></div>';
    }).join('');

    return '<div class="page">' +
      '<div><h1 class="h1">' + esc(t.tabAlerts) + '</h1><p class="lede">' + esc(t.alertsSub) + '</p></div>' +
      '<section class="section"><h2 class="section-title">' + esc(t.yourAlerts) + '</h2>' +
        (ids.length ? cards : '<div class="empty">' + esc(t.noAlerts) + '</div>') +
        '<div class="card alert-card"><span class="set-label" style="padding:4px 0"><b>' + esc(t.morningCheck) + '</b><span>' + esc(t.morningSubAlerts) + '</span></span>' +
        '<button class="switch" type="button" role="switch" data-act="morning" aria-checked="' + !!prefs.morning + '" aria-label="' + esc(t.morningCheck) + '"></button></div>' +
      '</section>' +
      '<section class="section">' +
        '<div class="section-head"><h2 class="section-title">' + esc(t.recent) + '</h2>' +
        (prefs.history.length ? '<button class="link-btn" type="button" data-act="clear-history">' + esc(t.clear) + '</button>' : '') + '</div>' +
        (prefs.history.length ? '<div class="history">' + hist + '</div>' : '<p class="lede" style="margin:0">' + esc(t.nothing) + '</p>') +
      '</section>' +
    '</div>';
  }

  /* ---------- ME ---------- */
  function segHTML(act, options, current) {
    return options.map(function (o) {
      return '<button type="button" data-act="' + act + '" data-v="' + o.v + '" aria-pressed="' + (String(current) === String(o.v)) + '">' + esc(o.label) + '</button>';
    }).join('');
  }
  function standalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }

  function meHTML() {
    var t = T();
    var installRow = '';
    if (!standalone()) {
      installRow = '<section class="section"><div class="card settings"><div class="set inline">' +
        '<span class="set-label"><b>' + esc(t.installTitle) + '</b><span>' + esc(installPrompt ? t.installSub : t.installHow) + '</span></span>' +
        (installPrompt ? '<button class="pill-btn" type="button" data-act="install">' + esc(t.installBtn) + '</button>' : '') +
      '</div></div></section>';
    }
    return '<div class="page">' +
      '<h1 class="h1">' + esc(t.tabMe) + '</h1>' +
      installRow +
      '<section class="section"><h2 class="section-title">' + esc(t.settings) + '</h2>' +
        '<div class="card settings">' +
          '<div class="set"><b style="font-size:15px;font-weight:600">' + esc(t.language) + '</b>' +
            '<div class="seg sm">' + segHTML('lang', [{ v: 'en', label: 'English' }, { v: 'ms', label: 'Bahasa Melayu (Malaysia)' }], prefs.lang) + '</div></div>' +
          '<div class="set inline"><span class="set-label"><b>' + esc(t.darkMode) + '</b><span>' + esc(t.darkSub) + '</span></span>' +
            '<button class="switch" type="button" role="switch" data-act="dark" aria-checked="' + isDark() + '" aria-label="' + esc(t.darkMode) + '"></button></div>' +
          '<div class="set"><span class="set-label"><b>' + esc(t.defLevel) + '</b><span>' + esc(t.defLevelSub) + '</span></span>' +
            '<div class="seg sm">' + segHTML('level', [{ v: 10, label: '10' }, { v: 20, label: '20' }, { v: 50, label: '50' }], prefs.defaultLevel) + '</div></div>' +
          '<div class="set"><b style="font-size:15px;font-weight:600">' + esc(t.showAs) + '</b>' +
            '<div class="seg sm">' + segHTML('show', [{ v: 'spots', label: t.spots }, { v: 'percent', label: t.percent }], prefs.showAs) + '</div></div>' +
          '<div class="set inline"><span class="set-label"><b>' + esc(t.morningCheck) + '</b><span>' + esc(t.morningSub) + '</span></span>' +
            '<button class="switch" type="button" role="switch" data-act="morning" aria-checked="' + !!prefs.morning + '" aria-label="' + esc(t.morningCheck) + '"></button></div>' +
        '</div>' +
      '</section>' +
      '<section class="section"><h2 class="section-title">' + esc(t.about) + '</h2>' +
        '<div class="card settings" style="overflow:hidden">' +
          '<button class="ghost-btn" type="button" data-act="about" data-v="how" aria-expanded="' + (ui.about === 'how') + '">' + esc(t.howTitle) + ICON.chevron + '</button>' +
          (ui.about === 'how' ? '<p class="expand">' + esc(t.howText) + '</p>' : '') +
          '<button class="ghost-btn" type="button" data-act="about" data-v="proto" aria-expanded="' + (ui.about === 'proto') + '">' + esc(t.protoTitle) + ICON.chevron + '</button>' +
          (ui.about === 'proto' ? '<p class="expand">' + esc(t.protoText) + '</p>' : '') +
        '</div>' +
      '</section>' +
      '<section class="section"><h2 class="section-title">' + esc(t.demoTools) + '</h2>' +
        '<div class="card settings" style="overflow:hidden">' +
          '<div class="set inline"><span class="set-label"><b>' + esc(t.liveSim) + '</b><span>' + esc(t.liveSimSub) + '</span></span>' +
            '<button class="switch" type="button" role="switch" data-act="live-sim" aria-checked="' + !!prefs.liveSim + '" aria-label="' + esc(t.liveSim) + '"></button></div>' +
          '<a class="ghost-btn" href="simulator.html" target="_blank" rel="noopener">' + esc(t.openSim) + ICON.external + '</a>' +
          '<button class="ghost-btn danger" type="button" data-act="reset-demo">' + esc(t.resetDemo) + '</button>' +
        '</div>' +
      '</section>' +
      '<p class="footnote">' + esc(t.version) + '</p>' +
    '</div>';
  }

  /* ---------- STATION DETAIL ---------- */
  function chartHTML(s) {
    var nowH = new Date().getHours(), out = '';
    for (var h = 6; h <= 20; h++) {
      var tm = h * 60, p;
      if (s.fullBy) {
        if (tm <= s.fullBy) p = 0.08 + 0.92 * (tm - 360) / Math.max(1, s.fullBy - 360);
        else if (h <= 17) p = 1;
        else p = 1 - (h - 17) * 0.22;
      } else {
        if (h <= 10) p = 0.08 + 0.67 * (h - 6) / 4;
        else if (h <= 17) p = 0.75;
        else p = 0.75 - (h - 17) * 0.15;
      }
      p = Math.max(0.06, Math.min(1, p));
      out += '<span class="' + (h === nowH ? 'now' : '') + '" style="height:' + Math.round(p * 50) + 'px"></span>';
    }
    return out;
  }

  function backLabel() {
    var t = T();
    return { home: t.tabHome, lines: t.tabLines, alerts: t.tabAlerts, me: t.tabMe }[ui.tab] || t.back;
  }

  function detailHTML(id) {
    var t = T(), v = vm(id), s = v.s;
    var fee = s.fee === 'mrt' ? t.fee : (s.fee === 'flat11' ? t.feeFlat : t.feeOp);
    return '<div class="page">' +
      '<div class="detail-top">' +
        '<button class="back-btn" type="button" data-act="back">' + ICON.back + esc(backLabel()) + '</button>' +
        '<button class="save-btn" type="button" data-act="save" data-id="' + id + '" aria-pressed="' + v.saved + '">' + ICON.bookmark + esc(v.saved ? t.saved : t.save) + '</button>' +
      '</div>' +
      '<div class="section" style="gap:8px">' +
        '<div class="chips">' + chipsHTML(s, true) + '</div>' +
        '<h1 class="station-name">' + esc(v.name) + '</h1>' +
        '<span class="meta">' + relSpan(v.updatedAt, 'updated') + '</span>' +
      '</div>' +
      '<div class="card hero">' +
        '<div class="hero-top">' +
          '<div><div class="hero-num c-' + v.key + '">' + esc(v.big) + '</div><div class="hero-label">' + esc(v.bigLabel) + '</div></div>' +
          '<span class="badge t-' + v.key + '">' + esc(v.status) + '</span>' +
        '</div>' +
        '<span class="bar lg"><span class="bg-' + v.key + '" style="width:' + v.pctFull + '%"></span></span>' +
        '<div class="stats">' +
          '<div><span>' + esc(t.totalBays) + '</span><b>' + num(s.capacity) + '</b></div>' +
          '<div><span>' + esc(t.carsInside) + '</span><b>' + num(v.occupied) + '</b></div>' +
          '<div><span>' + esc(t.fullPct) + '</span><b>' + v.pctFull + '%</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="card predict">' +
        '<div><b>' + esc(s.fullBy ? t.usuallyFull(fmt(s.fullBy)) : t.rarely) + '</b>' +
        '<p>' + esc(s.fullBy ? t.tipBy(fmt(s.fullBy - 15)) : t.tipSpace) + '</p></div>' +
        '<div class="chart" aria-hidden="true">' + chartHTML(s) + '</div>' +
        '<div class="chart-axis" aria-hidden="true"><span>6am</span><span>12pm</span><span>8pm</span></div>' +
      '</div>' +
      '<div class="info">' +
        '<span><strong>' + esc(t.feeL) + '</strong> ' + esc(fee) + '</span>' +
        '<span><strong>' + esc(t.payL) + '</strong> ' + esc(t.pay) + '</span>' +
        (s.unverified ? '<span class="note">' + esc(t.unverifiedNote) + '</span>' : '') +
      '</div>' +
    '</div>';
  }

  function detailBarHTML(id) {
    var t = T(), v = vm(id);
    var maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.name + ' MRT park and ride');
    var on = v.alert && v.alert.on;
    return '<div class="detail-bar">' +
      '<a class="cta primary" href="' + esc(maps) + '" target="_blank" rel="noopener">' + ICON.nav + esc(t.navigate) + '</a>' +
      '<button class="cta' + (on ? ' on' : '') + '" type="button" data-act="alert-edit" data-id="' + id + '">' + ICON.bell + esc(on ? t.alertOn(v.alert.level) : t.alertMe) + '</button>' +
    '</div>';
  }

  /* ---------- TAB BAR & LAYER ---------- */
  function tabbarHTML() {
    var t = T();
    var labels = { home: t.tabHome, lines: t.tabLines, alerts: t.tabAlerts, me: t.tabMe };
    return ['home', 'lines', 'alerts', 'me'].map(function (k) {
      var on = ui.tab === k;
      var badge = k === 'alerts' && prefs.unread > 0 ? '<span class="badge-n">' + prefs.unread + '</span>' : '';
      return '<button class="tab" type="button" data-act="tab" data-v="' + k + '"' + (on ? ' aria-current="page"' : '') + '>' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + TAB_ICONS[k] + '"/></svg>' +
        esc(labels[k]) + badge + '</button>';
    }).join('');
  }

  function layerHTML() {
    var t = T(), out = '';
    if (ui.banner) {
      var b = ui.banner;
      out += '<div class="banner" role="alert"><span class="logo" aria-hidden="true">P</span>' +
        '<span class="banner-text"><b>' + esc(b.kind === 'full' ? t.histFull(b.name) : t.histLow(b.n, b.name)) + '</b><small>' + esc(t.bannerSub(b.level)) + '</small></span>' +
        '<button class="view" type="button" data-act="banner-view">' + esc(t.view) + '</button>' +
        '<button class="x" type="button" data-act="banner-close" aria-label="' + esc(t.dismiss) + '">' + ICON.x + '</button></div>';
    }
    if (ui.toast) {
      var f = t[ui.toast.key];
      var msg = typeof f === 'function' ? f(ui.toast.arg) : f;
      out += '<div class="toast" role="status"><span>' + esc(msg) + '</span>' +
        (ui.toast.undoId ? '<button type="button" data-act="undo">' + esc(t.undo) + '</button>' : '') + '</div>';
    }
    if (ui.sheet) {
      var v = vm(ui.sheet.id);
      var has = !!prefs.alerts[ui.sheet.id];
      out += '<div class="sheet-wrap">' +
        '<button class="sheet-backdrop" type="button" data-act="sheet-close" aria-label="' + esc(t.close) + '"></button>' +
        '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">' +
          '<span class="handle" aria-hidden="true"></span>' +
          '<div><h2 id="sheetTitle">' + esc(t.sheetTitle(v.name)) + '</h2><p>' + esc(t.sheetSub) + '</p></div>' +
          '<div class="levels">' + [10, 20, 50].map(function (l) {
            return '<button type="button" data-act="sheet-level" data-v="' + l + '" aria-pressed="' + (ui.sheet.level === l) + '">' + l + '</button>';
          }).join('') + '</div>' +
          '<span class="sheet-now">' + esc(t.rightNow(v.free, v.status.toLowerCase())) + '</span>' +
          '<div class="sheet-actions">' +
            '<button class="cta' + (has ? ' danger' : '') + '" type="button" data-act="sheet-secondary">' + esc(has ? t.removeAlert : t.cancel) + '</button>' +
            '<button class="cta primary" type="button" data-act="sheet-save">' + esc(t.saveAlert) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    return out;
  }

  /* ---------- render ---------- */
  function applyTheme() {
    var dark = isDark();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if ($themeColor) $themeColor.setAttribute('content', dark ? '#0F1113' : '#F5F5F0');
    document.documentElement.lang = T().htmlLang;
  }

  function render() {
    applyTheme();
    var html;
    if (ui.detailId) html = detailHTML(ui.detailId);
    else if (ui.tab === 'lines') html = linesHTML();
    else if (ui.tab === 'alerts') html = alertsHTML();
    else if (ui.tab === 'me') html = meHTML();
    else html = homeHTML();

    var keepFocus = document.activeElement && document.activeElement.id === 'search';
    $screen.innerHTML = html;
    if (keepFocus) {
      var s = document.getElementById('search');
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }
    $detailBar.innerHTML = ui.detailId ? detailBarHTML(ui.detailId) : '';
    $tabbar.hidden = !!ui.detailId;
    $tabbar.innerHTML = tabbarHTML();
    renderLayer();
  }

  function renderLayer() {
    $layer.innerHTML = layerHTML();
    if (ui.sheet) {
      var b = $layer.querySelector('.levels [aria-pressed="true"]');
      if (b) b.focus({ preventScroll: true });
    }
  }

  /* While someone is typing in search, update only the lists so the keyboard stays open. */
  function renderHomeLists() {
    var box = document.getElementById('homeLists');
    if (!box) { render(); return; }
    box.innerHTML = homeListsHTML();
    var label = document.querySelector('.search');
    var clearBtn = label && label.querySelector('[data-act="clear-search"]');
    if (ui.query && !clearBtn && label) {
      label.insertAdjacentHTML('beforeend', '<button class="icon-btn" type="button" data-act="clear-search" aria-label="' + esc(T().clearSearch) + '">' + ICON.x + '</button>');
    } else if (!ui.query && clearBtn) {
      clearBtn.remove();
    }
  }

  /* ---------- routing (#/home, #/lines, #/alerts, #/me, #/station/<id>) ---------- */
  function onRoute() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    if (parts[0] === 'station' && D.byId[parts[1]]) {
      ui.detailId = parts[1];
    } else {
      ui.detailId = null;
      ui.fromApp = false;
      ui.tab = ['home', 'lines', 'alerts', 'me'].indexOf(parts[0]) >= 0 ? parts[0] : 'home';
    }
    ui.sheet = null;
    ui.editMine = false;
    if (!ui.detailId && ui.tab === 'alerts' && prefs.unread) { prefs.unread = 0; save(); }
    var key = ui.detailId ? 'd:' + ui.detailId : 't:' + ui.tab;
    render();
    if (key !== lastRouteKey) { $screen.scrollTop = 0; lastRouteKey = key; }
  }

  function go(hash) {
    if (location.hash === hash) onRoute();
    else location.hash = hash;
  }

  function openStation(id) {
    ui.fromApp = true;
    go('#/station/' + id);
  }

  /* ---------- live counts & alerts ---------- */
  function checkAlerts(prev, next) {
    var hit = null;
    Object.keys(prefs.alerts).forEach(function (id) {
      var a = prefs.alerts[id], s = D.byId[id];
      if (!a || !a.on || !s || !prev.stations[id] || !next.stations[id]) return;
      var before = s.capacity - prev.stations[id].occupied;
      var after = s.capacity - next.stations[id].occupied;
      if (before >= a.level && after < a.level) {
        hit = { id: id, kind: after === 0 ? 'full' : 'low', name: s.name, n: after, level: a.level };
        prefs.history.unshift({ id: 'h' + Date.now() + id, kind: hit.kind, name: s.name, n: after, day: 'today', mins: nowMins() });
        prefs.history = prefs.history.slice(0, 20);
        if (!(ui.tab === 'alerts' && !ui.detailId)) prefs.unread += 1;
        tryNotify(hit);
      }
    });
    if (hit) { ui.banner = hit; save(); }
  }

  function tryNotify(hit) {
    // Real phone notification if the user has allowed it (only works when served over https).
    try {
      if (document.visibilityState === 'visible') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      var t = T();
      new Notification('GotSpotKe', { body: hit.kind === 'full' ? t.histFull(hit.name) : t.histLow(hit.n, hit.name), icon: 'icons/icon-192.png' });
    } catch (e) { /* ignore */ }
  }

  function applyLive(next, fromOtherTab) {
    var prev = live;
    live = next;
    if (!fromOtherTab) E.saveLive(live);
    checkAlerts(prev, next);
    var typing = document.activeElement && document.activeElement.id === 'search';
    if (typing) { renderHomeLists(); renderLayer(); } else render();
  }

  window.addEventListener('storage', function (e) {
    if (e.key === E.KEY_LIVE) applyLive(E.loadLive(), true);
    if (e.key === E.KEY_PREFS) { prefs = E.loadPrefs(); render(); }
  });

  setInterval(function () {
    if (!prefs.liveSim) return;
    var s = D.stations[Math.floor(Math.random() * D.stations.length)];
    applyLive(E.gate(live, s.id, Math.random() < 0.65 ? 'in' : 'out', 1), false);
  }, 1500);

  // Keep "12s ago" labels fresh without re-drawing the screen.
  setInterval(function () {
    var t = T();
    Array.prototype.forEach.call(document.querySelectorAll('[data-ts]'), function (el) {
      var ts = Number(el.getAttribute('data-ts'));
      el.textContent = el.getAttribute('data-kind') === 'updated' ? t.updated(rel(ts)) : rel(ts);
    });
  }, 5000);

  /* ---------- toast ---------- */
  function showToast(key, arg, undoId) {
    clearTimeout(toastTimer);
    ui.toast = { key: key, arg: arg, undoId: undoId || null };
    renderLayer();
    toastTimer = setTimeout(function () { ui.toast = null; renderLayer(); }, 3000);
  }

  function toggleSave(id, quiet) {
    var i = prefs.favs.indexOf(id);
    var wasSaved = i >= 0;
    if (wasSaved) prefs.favs.splice(i, 1); else prefs.favs.push(id);
    if (!prefs.favs.length) ui.editMine = false;
    save();
    render();
    if (quiet) { clearTimeout(toastTimer); ui.toast = null; renderLayer(); }
    else showToast(wasSaved ? 'toastRemoved' : 'toastSaved', null, id);
  }

  /* ---------- actions ---------- */
  var actions = {
    tab: function (d) { go('#/' + d.v); },
    open: function (d) { openStation(d.id); },
    back: function () {
      if (ui.fromApp && window.history.length > 1) window.history.back();
      else go('#/' + ui.tab);
    },
    save: function (d) { toggleSave(d.id); },
    undo: function () { if (ui.toast && ui.toast.undoId) toggleSave(ui.toast.undoId, true); },
    'edit-mine': function () { ui.editMine = !ui.editMine; render(); },
    'clear-search': function () {
      ui.query = '';
      var s = document.getElementById('search');
      if (s) { s.value = ''; s.focus(); }
      renderHomeLists();
    },
    line: function (d) { ui.lineTab = d.v; render(); },
    'alert-toggle': function (d) { var a = prefs.alerts[d.id]; if (a) { a.on = !a.on; save(); render(); } },
    'alert-edit': function (d) {
      var a = prefs.alerts[d.id];
      ui.sheet = { id: d.id, level: a ? a.level : prefs.defaultLevel };
      renderLayer();
    },
    'sheet-level': function (d) { ui.sheet.level = Number(d.v); renderLayer(); },
    'sheet-close': function () { ui.sheet = null; renderLayer(); },
    'sheet-save': function () {
      var sh = ui.sheet;
      prefs.alerts[sh.id] = { level: sh.level, on: true };
      ui.sheet = null;
      save();
      render();
      showToast('toastAlertSet', sh.level);
      askNotificationPermission();
    },
    'sheet-secondary': function () {
      var sh = ui.sheet;
      ui.sheet = null;
      if (prefs.alerts[sh.id]) {
        delete prefs.alerts[sh.id];
        save();
        render();
        showToast('toastAlertRemoved');
      } else {
        renderLayer();
      }
    },
    'banner-view': function () { var id = ui.banner && ui.banner.id; ui.banner = null; if (id) openStation(id); else renderLayer(); },
    'banner-close': function () { ui.banner = null; renderLayer(); },
    morning: function () { prefs.morning = !prefs.morning; save(); render(); },
    'clear-history': function () { prefs.history = []; save(); render(); },
    lang: function (d) { prefs.lang = d.v; save(); render(); },
    dark: function () { prefs.dark = !isDark(); save(); render(); },
    level: function (d) { prefs.defaultLevel = Number(d.v); save(); render(); },
    show: function (d) { prefs.showAs = d.v; save(); render(); },
    about: function (d) { ui.about = ui.about === d.v ? '' : d.v; render(); },
    'live-sim': function () { prefs.liveSim = !prefs.liveSim; save(); render(); },
    'reset-demo': function () {
      var keepLang = prefs.lang, keepDark = prefs.dark;
      prefs = E.seedPrefs();
      prefs.lang = keepLang;
      prefs.dark = keepDark;
      live = E.seedLive();
      ui.banner = null;
      E.saveLive(live);
      save();
      render();
      showToast('toastReset');
    },
    install: function () {
      if (!installPrompt) return;
      installPrompt.prompt();
      installPrompt.userChoice.then(function () { installPrompt = null; render(); });
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = actions[el.getAttribute('data-act')];
    if (fn) { e.preventDefault(); fn(el.dataset, el); }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id !== 'search') return;
    ui.query = e.target.value;
    renderHomeLists();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ui.sheet) { ui.sheet = null; renderLayer(); }
  });

  function askNotificationPermission() {
    try {
      if ('Notification' in window && Notification.permission === 'default' && window.isSecureContext) {
        Notification.requestPermission();
      }
    } catch (e) { /* ignore */ }
  }

  if (darkQuery && darkQuery.addEventListener) {
    darkQuery.addEventListener('change', function () { if (prefs.dark === null) render(); });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    if (ui.tab === 'me' && !ui.detailId) render();
  });

  window.addEventListener('hashchange', onRoute);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ });
    });
  }

  onRoute();
})();
