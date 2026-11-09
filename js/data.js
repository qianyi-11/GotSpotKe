/* GotSpotKe – station data
 * Bay totals: MRT Corp Park 'N' Ride pages and public station info (checked Nov 2026).
 * "occupied" and "fullBy" are SAMPLE values for the prototype.
 * fee: 'mrt'    = RM4.30 per entry for MRT riders (same Touch 'n Go card)
 *      'op'     = set by a third-party car park operator
 *      'flat11' = RM11 flat per entry
 */
(function () {
  'use strict';

  var S = function (id, name, codes, capacity, occupied, fullBy, fee, unverified) {
    return {
      id: id, name: name, codes: codes, capacity: capacity,
      seedOccupied: occupied, fullBy: fullBy, fee: fee, unverified: !!unverified
    };
  };

  var stations = [
    // Kajang Line
    S('kwd', 'Kwasa Damansara', [['KG', 'KG04'], ['PY', 'PY01']], 500, 462, 470, 'op'),
    S('kws', 'Kwasa Sentral', [['KG', 'KG05']], 500, 298, 550, 'op'),
    S('bu', 'Bandar Utama', [['KG', 'KG09']], 500, 500, 450, 'op'),
    S('ttdi', 'Taman Tun Dr Ismail', [['KG', 'KG10']], 25, 25, 420, 'flat11'),
    S('phd', 'Phileo Damansara', [['KG', 'KG12']], 517, 431, 500, 'mrt'),
    S('pbd', 'Pusat Bandar Damansara', [['KG', 'KG13']], 580, 541, 480, 'op'),
    S('mlr', 'Maluri', [['KG', 'KG22']], 253, 253, 440, 'mrt'),
    S('tmd', 'Taman Midah', [['KG', 'KG24']], 1355, 1122, 510, 'mrt'),
    S('tsx', 'Taman Suntex', [['KG', 'KG27']], 82, 79, 435, 'mrt'),
    S('sry', 'Sri Raya', [['KG', 'KG28']], 220, 140, 540, 'op'),
    S('bth', 'Bandar Tun Hussein Onn', [['KG', 'KG29']], 313, 288, 485, 'mrt'),
    S('bkd', 'Bukit Dukung', [['KG', 'KG31']], 353, 186, 570, 'mrt'),
    S('sgj', 'Sungai Jernih', [['KG', 'KG33']], 1260, 902, 525, 'mrt'),
    S('kjg', 'Kajang', [['KG', 'KG35']], 1180, 760, null, 'op'),
    // Putrajaya Line
    S('sgb', 'Sungai Buloh', [['PY', 'PY04']], 1236, 1190, 460, 'mrt'),
    S('sdb', 'Sri Damansara Barat', [['PY', 'PY06']], 414, 371, 495, 'mrt'),
    S('sds', 'Sri Damansara Sentral', [['PY', 'PY07']], 125, 125, 455, 'mrt'),
    S('sdt', 'Sri Damansara Timur', [['PY', 'PY08']], 143, 120, 470, 'mrt'),
    S('mpr', 'Metro Prima', [['PY', 'PY09']], 207, 160, 505, 'mrt'),
    S('kpb', 'Kepong Baru', [['PY', 'PY10']], 25, 24, 430, 'op'),
    S('jjg', 'Jinjang', [['PY', 'PY11']], 239, 222, 475, 'mrt'),
    S('kbt', 'Kampung Batu', [['PY', 'PY13']], 200, 150, 520, 'op', true),
    S('ktm', 'Kentonmen', [['PY', 'PY14']], 165, 101, 530, 'mrt'),
    S('kch', 'Kuchai', [['PY', 'PY27']], 262, 240, 480, 'mrt'),
    S('tne', 'Taman Naga Emas', [['PY', 'PY28']], 136, 136, 450, 'mrt'),
    S('sbs', 'Sungai Besi', [['PY', 'PY29']], 75, 70, 445, 'mrt'),
    S('sru', 'Serdang Raya Utara', [['PY', 'PY31']], 243, 150, 545, 'mrt'),
    S('srs', 'Serdang Raya Selatan', [['PY', 'PY32']], 343, 205, 555, 'mrt'),
    S('upm', 'UPM', [['PY', 'PY34']], 641, 380, 600, 'mrt'),
    S('teq', 'Taman Equine', [['PY', 'PY36']], 352, 300, 515, 'mrt'),
    S('cyu', 'Cyberjaya Utara', [['PY', 'PY39']], 228, 120, 580, 'mrt'),
    S('pjs', 'Putrajaya Sentral', [['PY', 'PY41']], 1000, 540, null, 'mrt')
  ];

  var byId = {};
  stations.forEach(function (s) { byId[s.id] = s; });

  window.GSK_DATA = {
    stations: stations,
    byId: byId,
    order: {
      KG: ['kwd', 'kws', 'bu', 'ttdi', 'phd', 'pbd', 'mlr', 'tmd', 'tsx', 'sry', 'bth', 'bkd', 'sgj', 'kjg'],
      PY: ['kwd', 'sgb', 'sdb', 'sds', 'sdt', 'mpr', 'kpb', 'jjg', 'kbt', 'ktm', 'kch', 'tne', 'sbs', 'sru', 'srs', 'upm', 'teq', 'cyu', 'pjs']
    },
    lines: {
      KG: { short: 'Kajang', color: '#047857' },
      PY: { short: 'Putrajaya', color: '#E0AE00' }
    }
  };
})();
