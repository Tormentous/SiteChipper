/* Shared, dependency-free history chart. Observations are never invented. */
(function (global) {
  'use strict';
  var instances = new WeakMap();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  function cssVar(key, fallback) { return getComputedStyle(document.documentElement).getPropertyValue(key).trim() || fallback; }
  function theme() { return { accent: 'var(--cb-chart-1)', green: 'var(--cb-chart-2)', red: 'var(--cb-chart-4)', text: 'var(--cb-text)', muted: 'var(--cb-muted)' }; }
  function pct(n) { return Number(n).toFixed(1).replace(/\.0$/, '') + '%'; }
  function stamp(t) { return new Date(t).toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }); }
  function normalize(input) {
    return (input || []).map(function (series, i) {
      var points = (series.points || series.data || []).map(function (p) { return {t:Number(p.t != null ? p.t : p.time),v:Number(p.v != null ? p.v : p.value)}; }).filter(function (p) { return Number.isFinite(p.t) && Number.isFinite(p.v) && Math.abs(p.t) <= 8640000000000000; }).sort(function (a,b) { return a.t-b.t; });
      // Last observation wins at a shared timestamp (e.g. simultaneous votes).
      points = points.filter(function (p,j) { return j === points.length-1 || p.t !== points[j+1].t; });
      return { id:String(series.id == null ? i : series.id),name:String(series.name || series.label || 'Choice ' + (i+1)),color:series.color,points:points };
    }).filter(function (s) { return s.points.length; });
  }
  function valueAt(points, t, step) {
    if (t < points[0].t) return null;
    var left = points[0];
    for (var i=1;i<points.length;i++) {
      var right = points[i];
      if (t < right.t) return step ? left.v : left.v + (right.v-left.v)*(t-left.t)/(right.t-left.t);
      left = right;
    }
    return left.v;
  }
  function mount(host, opts) {
    if (!host) return null;
    if (instances.has(host)) instances.get(host).destroy();
    opts = opts || {};
    var series = normalize(opts.series);
    if (!series.length) { host.innerHTML = '<p class="cb-chart-empty">No recorded votes yet. History appears after the first vote.</p>'; return null; }
    var colors = [1,2,3,4,5,6].map(function(i) { return 'var(--cb-chart-'+i+')'; });
    series.forEach(function (s,i) { s.color = typeof s.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(s.color) ? s.color : colors[i%colors.length]; });
    var allTimes = Array.from(new Set(series.flatMap(function (s) { return s.points.map(function (p) { return p.t; }); }))).sort(function(a,b) { return a-b; });
    var earliest = allTimes[0], latest = allTimes[allTimes.length-1], range = 'all', destroyed = false;
    var t0 = earliest, t1 = latest, selected = latest;
    var width = 640, height = 230, left = 8, right = 44, top = 22, bottom = 30;
    var uid = 'history-' + Math.random().toString(36).slice(2);
    host.innerHTML = '<section class="cb-history" aria-label="' + esc(opts.title || 'Vote history') + '">' +
      '<div class="cb-history-toolbar"><strong>Vote history</strong><div class="cb-history-ranges" role="group" aria-label="Time range">' + ['1h','1d','1w','all'].map(function(r) { return '<button type="button" data-range="'+r+'" aria-pressed="'+(r==='all')+'">'+r.toUpperCase()+'</button>'; }).join('') + '</div></div>' +
      '<div class="cb-history-stage"><svg viewBox="0 0 640 230" role="img" aria-labelledby="'+uid+'-title"><title id="'+uid+'-title">'+esc(opts.title || 'Recorded vote history')+'</title></svg></div>' +
      '<p class="cb-history-readout" aria-live="polite"></p><div class="cb-history-legend"></div>' +
      '<label class="cb-history-slider">Explore recorded history<input type="range" min="0" max="1000" value="1000" step="1" aria-label="Explore vote history"></label>' +
      '<details class="cb-history-data"><summary>View recorded data</summary><div class="cb-history-table"></div></details></section>';
    var root = host.firstElementChild, svg = root.querySelector('svg'), slider = root.querySelector('input'), readout = root.querySelector('.cb-history-readout'), legend = root.querySelector('.cb-history-legend');
    function x(t) { return left + (t-t0)/Math.max(1,t1-t0)*(width-left-right); }
    function y(v) { return top + (100-Math.max(0,Math.min(100,v)))/100*(height-top-bottom); }
    function draw() {
      if (destroyed) return;
      width = Math.max(260, host.clientWidth || 640);
      svg.setAttribute('viewBox','0 0 '+width+' '+height);
      var title = '<title id="'+uid+'-title">'+esc(opts.title || 'Recorded vote history')+'</title>';
      var grid = [0,25,50,75,100].map(function(v) { return '<line class="cb-history-grid" x1="'+left+'" x2="'+(width-right)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text x="'+(width-2)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v+'%</text>'; }).join('');
      var paths = series.map(function(s) {
        var points = s.points.filter(function(p) { return p.t>=t0 && p.t<=t1; });
        var prior = valueAt(s.points,t0,opts.interpolation==='step');
        if (prior != null && (!points.length || points[0].t>t0)) points.unshift({t:t0,v:prior});
        if (!points.length) return '';
        var last = points[points.length-1];
        // A horizontal extension denotes the last known value, never a synthetic rise.
        if (last.t < t1) points.push({t:t1,v:last.v});
        var d = points.map(function(p,i) { return !i ? 'M'+x(p.t)+','+y(p.v) : opts.interpolation==='step' ? 'H'+x(p.t)+'V'+y(p.v) : 'L'+x(p.t)+','+y(p.v); }).join(' ');
        return '<path d="'+d+'" fill="none" stroke="'+esc(s.color)+'" stroke-width="2.5" stroke-linejoin="round"/>' + points.filter(function(_,i) { return points.length===1 || i===points.length-1; }).map(function(p) { return '<circle cx="'+x(p.t)+'" cy="'+y(p.v)+'" r="4" fill="'+esc(s.color)+'"/>'; }).join('');
      }).join('');
      svg.innerHTML = title + grid + paths + '<line class="cb-history-cursor" x1="0" x2="0" y1="'+top+'" y2="'+(height-bottom)+'" hidden/>';
      root.querySelector('.cb-history-table').innerHTML = '<table><caption>Actual recorded observations</caption><thead><tr><th scope="col">Time</th>'+series.map(function(s) { return '<th scope="col">'+esc(s.name)+'</th>'; }).join('')+'</tr></thead><tbody>'+allTimes.filter(function(t) { return t>=t0 && t<=t1; }).map(function(t) { return '<tr><th scope="row">'+esc(stamp(t))+'</th>'+series.map(function(s) { var v=valueAt(s.points,t,opts.interpolation==='step'); return '<td>'+(v==null?'—':pct(v))+'</td>'; }).join('')+'</tr>'; }).join('')+'</tbody></table>';
      slider.disabled = earliest === latest;
      show(selected, false);
    }
    function show(t, cursor) {
      selected = Math.max(t0,Math.min(t1,t));
      var line = root.querySelector('.cb-history-cursor');
      if (line) { line.style.display = cursor ? '' : 'none'; line.removeAttribute('hidden'); line.setAttribute('x1',x(selected)); line.setAttribute('x2',x(selected)); }
      readout.textContent = stamp(selected) + (allTimes.length === 1 ? ' · First recorded observation' : '');
      var description = [];
      legend.innerHTML = series.map(function(s) { var v=valueAt(s.points,selected,opts.interpolation==='step'); var label=v==null?'Not recorded':pct(v); description.push(s.name+': '+label); return '<span><i style="background:'+esc(s.color)+'"></i>'+esc(s.name)+' <strong>'+label+'</strong></span>'; }).join('');
      slider.value = String(Math.round((selected-t0)/Math.max(1,t1-t0)*1000));
      slider.setAttribute('aria-valuetext', stamp(selected)+'. '+description.join(', '));
    }
    function reset() { show(t1,false); }
    function move(event) {
      var rect=svg.getBoundingClientRect(), local=(event.clientX-rect.left)/rect.width*width;
      var t=t0+(local-left)/(width-left-right)*(t1-t0); show(t,true);
    }
    svg.addEventListener('pointermove',move);
    svg.addEventListener('pointerdown',move);
    svg.addEventListener('pointerleave',reset);
    svg.addEventListener('pointercancel',reset);
    slider.addEventListener('input',function() { show(t0+Number(slider.value)/1000*(t1-t0),true); });
    root.querySelectorAll('[data-range]').forEach(function(btn) { btn.onclick=function() {
      range=btn.dataset.range;
      var duration={'1h':3600000,'1d':86400000,'1w':604800000}[range];
      t0=duration?Math.max(earliest,latest-duration):earliest; t1=latest; selected=t1;
      root.querySelectorAll('[data-range]').forEach(function(b) { b.setAttribute('aria-pressed',String(b===btn)); }); draw();
    }; });
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
    if (ro) ro.observe(host);
    draw();
    var instance = { refresh:draw,destroy:function() { destroyed=true; if(ro)ro.disconnect(); if(instances.get(host)===instance) { instances.delete(host); host.replaceChildren(); } } };
    instances.set(host,instance); return instance;
  }
  function seriesFromVoteHistory(history,sides) {
    return (sides || []).map(function(s) { return { id:s.id,name:s.name||s.label||s.id,color:s.color,points:(history||[]).filter(function(h) { return Number.isFinite(Number(h.t||h.time)); }).map(function(h) { return {t:Number(h.t||h.time),v:Number((h.pct||h)[s.id])||0}; }) }; });
  }
  global.CoolbradorScrubChart = { mount:mount,seriesFromVoteHistory:seriesFromVoteHistory,theme:theme };
})(typeof window !== 'undefined' ? window : this);
