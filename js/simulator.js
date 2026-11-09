/* GotSpotKe – barrier simulator for demos. Writes to the same saved data as the app. */
(function () {
  'use strict';

  var D = window.GSK_DATA;
  var E = window.GSK_ENGINE;

  var live = E.loadLive();
  var $station = document.getElementById('station');
  var $formula = document.getElementById('formula');
  var $barrier = document.getElementById('barrier');
  var $log = document.getElementById('log');
  var $auto = document.getElementById('auto');
  var $autoLabel = document.getElementById('autoLabel');
  var auto = false;

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  $station.innerHTML = D.stations.map(function (s) {
    return '<option value="' + s.id + '">' + esc(s.codes[0][1] + ' · ' + s.name) + '</option>';
  }).join('');
  $station.value = 'kwd';

  function render() {
    var s = D.byId[$station.value];
    var occ = live.stations[s.id].occupied;
    var free = s.capacity - occ;
    var key = E.statusKey(free, s.capacity);
    $formula.textContent = s.capacity.toLocaleString('en-MY') + ' − ' + occ.toLocaleString('en-MY') + ' = ' + free.toLocaleString('en-MY');
    $barrier.className = 'badge ' + key;
    $barrier.textContent = free > 0 ? 'Barrier open · ' + (key === 'few' ? 'Few left' : 'Available') : 'Barrier closed · Full';

    if (!live.log.length) {
      $log.innerHTML = '<p class="muted">No scans yet. Tip: Kwasa Damansara has an alert at 20 in the app. Press Morning rush to trigger it.</p>';
      return;
    }
    $log.innerHTML = live.log.slice(0, 12).map(function (e) {
      var name = D.byId[e.station] ? D.byId[e.station].name : e.station;
      var label, color;
      if (e.kind === 'in') { label = e.n > 1 ? e.n + ' cars in · −' + e.n : 'Scan in · −1'; color = '#C2410C'; }
      else if (e.kind === 'out') { label = e.n > 1 ? e.n + ' cars out · +' + e.n : 'Scan out · +1'; color = '#15803D'; }
      else { label = 'Barrier stays shut: full'; color = '#B91C1C'; }
      return '<div class="entry"><i style="background:' + color + '"></i><span>' + esc(e.time) + '</span><b>' + esc(name) + '</b><span class="lbl">' + esc(label) + '</span><em>' + e.free + ' free</em></div>';
    }).join('');
  }

  function scan(kind, n, id) {
    live = E.gate(E.loadLive(), id || $station.value, kind, n);
    E.saveLive(live);
    render();
  }

  document.querySelectorAll('.act').forEach(function (b) {
    b.addEventListener('click', function () { scan(b.getAttribute('data-kind'), Number(b.getAttribute('data-n'))); });
  });
  $station.addEventListener('change', render);

  $auto.addEventListener('click', function () {
    auto = !auto;
    $auto.classList.toggle('on', auto);
    $auto.setAttribute('aria-pressed', String(auto));
    $autoLabel.textContent = auto ? 'Auto traffic on' : 'Auto traffic';
  });
  setInterval(function () {
    if (!auto) return;
    var s = D.stations[Math.floor(Math.random() * D.stations.length)];
    scan(Math.random() < 0.7 ? 'in' : 'out', 1, s.id);
  }, 900);

  document.getElementById('reset').addEventListener('click', function () {
    live = E.seedLive();
    E.saveLive(live);
    render();
  });

  window.addEventListener('storage', function (e) {
    if (e.key === E.KEY_LIVE) { live = E.loadLive(); render(); }
  });

  render();
})();
