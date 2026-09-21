/* PAYDAY AJ — app.js
   Booking form: one picker routes to one branch. Fields come from the client
   brief (Q32) — he selected these and only these. Do not add fields without
   asking him; he named a form-heavy site as the one he can't stand.

   TO GO LIVE: paste the Apps Script web app /exec URL into ENDPOINT below.
   While ENDPOINT is empty the form shows the Instagram fallback instead of
   pretending to send. */

var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyGuUeAZTs9mt1sGX_2qr_QVcEsmSxS7ziypPD2IQn_mXD-Ft2eK3ej5wARK_vyDZgV/exec';

(function () {
  'use strict';

  var BRANCHES = ['show', 'feature', 'shoot', 'press'];

  var picker = document.querySelector('.picker');
  var form = document.getElementById('bookform');
  var sentOk = document.getElementById('sent-ok');
  var sentFallback = document.getElementById('sent');
  if (!picker || !form) return;

  function show(branch) {
    BRANCHES.forEach(function (b) {
      var fs = document.getElementById('fs-' + b);
      if (!fs) return;
      var on = (b === branch);
      fs.hidden = !on;
      // Disabling matters as much as hiding: a hidden `required` field still
      // blocks submit, and the browser can't focus it to say why — the button
      // just does nothing. Disabled fieldsets skip validation and stay out of
      // FormData.
      fs.disabled = !on;
    });
    picker.querySelectorAll('button').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.branch === branch));
    });
    var field = document.getElementById('requestType');
    if (field) field.value = branch;
  }

  picker.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-branch]');
    if (btn) show(btn.dataset.branch);
  });

  function reveal(el) {
    form.hidden = true;
    el.hidden = false;
    el.setAttribute('tabindex', '-1');
    el.focus();
    el.scrollIntoView({ block: 'center' });
  }

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      // Only send fields from the branch that's actually showing.
      var field = form.elements[k];
      if (field && field.closest && field.closest('fieldset[hidden]')) return;
      data[k] = v;
    });
    return data;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    if (!ENDPOINT) { reveal(sentFallback); return; }

    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    // A plain-string body keeps this a CORS-simple request — no preflight,
    // which Apps Script web apps don't answer.
    fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(collect()) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error('rejected');
        var idEl = document.getElementById('sent-id');
        if (idEl && res.id) idEl.textContent = res.id;
        reveal(sentOk);
      })
      .catch(function () {
        reveal(sentFallback);
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
  });

  show('show');
})();

/* ================================================================
   Nav — transparent over the hero, solid once you scroll
   ================================================================ */
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  function onScroll() {
    nav.classList.toggle('stuck', window.scrollY > 40);
  }
  // The observer-based version further down does this without listening
  // to every scroll event; this one only covers browsers without it.
  if (!('IntersectionObserver' in window)) addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ================================================================
   Hero — a muted, looping video behind the type
   Picks one of the IDs in data-shuffle at random on each load, so the
   page doesn't open the same way twice. The still image underneath is
   the fallback: it shows while the video buffers and stays put if the
   browser refuses autoplay.
   ================================================================ */
(function () {
  var bg = document.querySelector('.hero-bg[data-shuffle]');
  var slot = document.getElementById('hero-video');
  if (!bg || !slot) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ids = bg.dataset.shuffle.split(',').map(function (s) { return s.trim(); })
              .filter(Boolean);
  if (!ids.length) return;
  var id = ids[Math.floor(Math.random() * ids.length)];

  function start() {
    var src = 'https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&mute=1&loop=1&playlist=' + id +
      '&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3';
    var f = document.createElement('iframe');
    f.src = src;
    f.title = '';
    f.setAttribute('frameborder', '0');
    f.setAttribute('tabindex', '-1');
    f.allow = 'autoplay; encrypted-media';
    slot.appendChild(f);
    // Fade in once it has had a moment to actually start.
    setTimeout(function () { slot.classList.add('on'); }, 900);
  }

  // Wait for the rest of the page so the video never delays first paint.
  if (document.readyState === 'complete') setTimeout(start, 400);
  else addEventListener('load', function () { setTimeout(start, 400); });
})();

/* ================================================================
   Video cards — thumbnail until clicked, then it plays in the box
   Loading four iframes up front would cost megabytes before anyone
   presses anything, so each card stays a picture until it's wanted.
   To add a video: copy a card in index.html and change data-yt,
   the two image URLs, and the title.
   ================================================================ */
(function () {
  document.querySelectorAll('.vid[data-yt]').forEach(function (card) {
    var btn = card.querySelector('.vthumb');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (card.classList.contains('playing')) return;
      var id = card.dataset.yt;
      // On a phone the tile is thumbnail-sized; hand off to the YouTube app,
      // which plays full screen, instead of a tiny player inside the bill.
      if (matchMedia('(max-width: 699px)').matches) {
        window.open('https://youtu.be/' + id, '_blank', 'noopener');
        return;
      }
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
      f.title = card.querySelector('h3').textContent;
      f.setAttribute('frameborder', '0');
      f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      btn._thumb = btn.innerHTML;          // kept so the bill stack can put it back
      btn.innerHTML = '';
      btn.appendChild(f);
      card.classList.add('playing');
    });
  });
})();

/* ================================================================
   Background player — shuffle, one tap to start
   Browsers have blocked autoplay-with-sound since 2018, so nothing
   here tries to sneak audio past the visitor. The bar is always
   visible and one tap from playing; after that it keeps going as
   they scroll and rolls into the next track on its own.

   Volume opens at 65% and remembers whatever they set it to.
   Playing a video card pauses the music so the two never fight.

   To add a track: drop the mp3 in assets/audio/ and add an entry to
   data-tracks on #player in index.html.
   ================================================================ */
(function () {
  'use strict';

  var bar = document.getElementById('player');
  if (!bar) return;

  var tracks;
  try { tracks = JSON.parse(bar.dataset.tracks); }
  catch (err) { bar.hidden = true; return; }
  if (!tracks || !tracks.length) { bar.hidden = true; return; }

  var toggle  = document.getElementById('ptoggle');
  var icon    = document.getElementById('picon');
  var nextBtn = document.getElementById('pnext');
  var titleEl = document.getElementById('ptitle');
  var stateEl = document.getElementById('pstate');
  var volEl   = document.getElementById('pvol');
  var eqBars  = [].slice.call(document.querySelectorAll('#peq i'));

  var PLAY  = 'M8 5v14l11-7z';
  var PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
  var KEY_VOL = 'payday.vol';
  var KEY_ON  = 'payday.playing';

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k)     { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* --- order: shuffled once per load, so it doesn't open the same way twice */
  var order = tracks.map(function (t, i) { return i; });
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  var pos = 0;

  var audio = new Audio();
  audio.preload = 'none';          // nothing downloads until they press play

  var saved = parseFloat(read(KEY_VOL));
  var vol = (saved >= 0 && saved <= 1) ? saved
          : (parseFloat(bar.dataset.volume) || 0.65);
  audio.volume = vol;
  if (volEl) {
    volEl.value = Math.round(vol * 100);
    volEl.style.setProperty('--fill', volEl.value + '%');
  }

  function load(idx) {
    var t = tracks[order[idx]];
    audio.src = t.src;
    if (titleEl) {
      titleEl.textContent = t.title;
      if (t.url) titleEl.href = t.url;
    }
  }
  load(pos);

  function setIcon(playing) {
    var path = icon && icon.querySelector('path');
    if (path) path.setAttribute('d', playing ? PAUSE : PLAY);
    if (toggle) toggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    bar.classList.toggle('on', playing);
    if (stateEl) stateEl.textContent = playing ? 'Now playing · shuffle' : 'Paused · tap to play';
  }

  function play(fromTap) {
    var p = audio.play();
    if (p && p.catch) p.catch(function () { setIcon(false); });
    // The analyser may only be built on a real user gesture — see the long
    // note on connectAnalyser below.
    if (fromTap) connectAnalyser();
  }

  audio.addEventListener('play',  function () { setIcon(true);  store(KEY_ON, '1'); });
  audio.addEventListener('pause', function () { setIcon(false); store(KEY_ON, '0'); });

  audio.addEventListener('ended', function () {
    pos = (pos + 1) % order.length;
    load(pos);
    play(false);
  });

  // A track that won't load shouldn't leave a dead button — skip past it.
  audio.addEventListener('error', function () {
    if (order.length < 2) { bar.hidden = true; return; }
    pos = (pos + 1) % order.length;
    load(pos);
  });

  if (toggle) toggle.addEventListener('click', function () {
    if (audio.paused) play(true); else audio.pause();
  });

  if (nextBtn) nextBtn.addEventListener('click', function () {
    var wasOn = !audio.paused;
    pos = (pos + 1) % order.length;
    load(pos);
    if (wasOn) play(true); else setIcon(false);
  });

  if (volEl) volEl.addEventListener('input', function () {
    var v = Number(volEl.value) / 100;
    audio.volume = v;
    volEl.style.setProperty('--fill', volEl.value + '%');
    store(KEY_VOL, String(v));
  });

  /* --- the bars, driven by the actual waveform --------------------
     Same-origin audio, so the analyser can read it. If any of this
     throws — older browser, blocked context — the CSS keyframes keep
     running and nobody notices. */
  var ctx, analyser, data, raf, tried = false;

  /* createMediaElementSource() is a ONE-WAY door: the moment it's called,
     the audio element stops going to the speakers directly and goes through
     the Web Audio graph instead. If that graph's context isn't actually
     running, the result is silence — while the element still reports itself
     as playing and the analyser hands back nothing but zeros. Flat bars and
     no sound, with no error anywhere.

     So: build the context, wait for it to genuinely reach "running", and
     only THEN reroute the audio. If it never gets there, close it and leave
     the element alone — the CSS keyframe bars take over and the music plays
     normally, which is the outcome that matters. */
  function connectAnalyser() {
    if (ctx || tried) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var c;
    try { c = new AC(); } catch (err) { tried = true; return; }

    function wire() {
      if (c.state !== 'running') { bail(); return; }
      try {
        var src = c.createMediaElementSource(audio);
        analyser = c.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        src.connect(analyser);
        analyser.connect(c.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
        ctx = c;
        bar.classList.add('live');
        tick();
        watchdog();
      } catch (err) { bail(); }
    }

    function bail() {
      tried = true;
      analyser = null;
      bar.classList.remove('live');
      try { c.close(); } catch (err) {}
    }

    if (c.state === 'running') wire();
    else if (c.resume) c.resume().then(wire, bail);
    else bail();
  }

  /* One rAF loop, running only while a track is. Each bar reads a bin from
     the low-mid range, where a rap record actually lives. */
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!analyser) return;
    if (audio.paused) {
      eqBars.forEach(function (b) { b.style.height = '26%'; });
      return;
    }
    analyser.getByteFrequencyData(data);
    for (var k = 0; k < eqBars.length; k++) {
      var v = data[k * 2 + 1] / 255;
      eqBars[k].style.height = Math.max(12, v * 100) + '%';
    }
  }

  /* A safety net, not a stopwatch. The first version of this judged the
     analyser after a flat 1.2s and kept condemning it — because with
     preload="none" the file is still downloading at that point: the element
     reports itself as playing, currentTime is stuck at 0, and of course
     every reading is zero. So this only counts a check once the audio has
     actually moved past its fade-in, and needs three dead readings in a row
     before it gives up and hands the bars back to the CSS animation. */
  function watchdog() {
    var strikes = 0, checks = 0;
    var timer = setInterval(function () {
      if (++checks > 25 || !analyser) { clearInterval(timer); return; }
      if (audio.paused || audio.currentTime < 1.8) return;   // still fading in
      var sum = 0;
      for (var n = 0; n < data.length; n++) sum += data[n];
      if (sum > 0) { clearInterval(timer); return; }         // it's alive
      if (++strikes >= 3) {
        clearInterval(timer);
        analyser = null;
        bar.classList.remove('live');
        eqBars.forEach(function (b) { b.style.height = ''; });
      }
    }, 700);
  }

  // A suspended context after a tab switch needs a nudge.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ctx && ctx.state === 'suspended') ctx.resume();
  });

  /* --- don't talk over the videos --------------------------------- */
  document.querySelectorAll('.vid[data-yt] .vthumb').forEach(function (b) {
    b.addEventListener('click', function () { if (!audio.paused) audio.pause(); });
  });

  /* --- if they were listening last visit, pick it back up ----------
     Only works when the browser already trusts this site enough to
     allow sound; otherwise the promise rejects and the bar just sits
     there paused, which is the correct outcome. */
  if (read(KEY_ON) === '1') {
    var resume = function () { play(false); };
    if (document.readyState === 'complete') setTimeout(resume, 300);
    else addEventListener('load', function () { setTimeout(resume, 300); });
  }

  setIcon(false);
})();

/* ================================================================
   Scroll reveals
   The .rise class starts an element invisible, so it is added by JS
   and only when IntersectionObserver exists — with scripting off, or
   on a browser too old for the observer, every element stays plainly
   visible instead of disappearing forever. Reduced-motion opts out
   before anything is tagged.
   ================================================================ */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Deliberately not the hero: it's above the fold, and fading in the
  // headline on load is the cheapest-looking effect on the internet.
  var targets = document.querySelectorAll(
    'section .sechead, .vid, .press > div, .about > div, ' +
    '.film, .photostack, .bookgrid > *, .album > *'
  );
  targets = [].filter.call(targets, function (el) { return !el.closest('.bill'); });
  if (!targets.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('seen');
      io.unobserve(e.target);      // once seen, stop paying for it
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  targets.forEach(function (el) {
    el.classList.add('rise');
    io.observe(el);
  });
})();

/* ================================================================
   Nav state without a scroll listener
   A sentinel at the top of the page tells us when the hero's first
   64px have left the viewport. Same result as listening to scroll,
   but the work happens off the main thread instead of on every
   single scroll event.
   ================================================================ */
(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  if (!nav || !('IntersectionObserver' in window)) return;   // scroll handler above still covers this

  var mark = document.createElement('div');
  mark.setAttribute('aria-hidden', 'true');
  mark.style.cssText = 'position:absolute;top:40px;left:0;width:1px;height:1px;pointer-events:none';
  document.body.appendChild(mark);

  new IntersectionObserver(function (e) {
    nav.classList.toggle('stuck', !e[0].isIntersecting);
  }).observe(mark);
})();

/* ================================================================
   Park the money when nobody's looking at it
   The falling bills are a paint animation — cheap, but not free, and
   there is no reason to pay for it while someone is reading the
   booking form eight screens down. Once the hero leaves the viewport
   the animation is parked; it resumes the moment it comes back.
   ================================================================ */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  if (!hero || !('IntersectionObserver' in window)) return;
  if (!document.querySelector('.rain')) return;

  new IntersectionObserver(function (e) {
    document.documentElement.classList.toggle('rain-off', !e[0].isIntersecting);
  }, { threshold: 0 }).observe(hero);
})();


/* ================================================================
   Bill stack — thumbing through hundreds
   Every section after booking is a bill in one pinned stack. Each
   360px of scroll thumbs the top bill off: its corner peels up and
   folds over (showing the back of the note), then the whole bill
   lifts over its top edge and is gone, and the stack slides up.

   Works on phones too: the phone layouts in styles.css are built to
   fit one card, and fit() below scales a bill's contents down a touch
   if a short screen still can't hold them. The only fallback — plain
   sections, no pinning — is for people who've asked their device to
   reduce motion.
   ================================================================ */
(function () {
  'use strict';

  var stack = document.querySelector('.stack');
  if (!stack) return;
  var stage = stack.querySelector('.stack-stage');
  var bills = [].slice.call(stack.querySelectorAll('.bill'));
  if (!stage || bills.length < 2) return;

  var root = document.documentElement;
  var PER = 360;                                   // px of scroll per bill
  var JIT = [0, -0.9, 1.1, -0.7, 0.8, -0.5, 0.6, -0.8];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var on = false, start = 0, W = 0, H = 0, ticking = false, top = -1, lastZone = null;

  var parts = bills.map(function (b) {
    return {
      el: b,
      front: b.querySelector('.bill-front'),
      body:  b.querySelector('.bill-body'),
      shine: b.querySelector('.bill-shine'),
      shade: b.querySelector('.bill-shade'),
      wrap:  b.querySelector('.bill-flapwrap'),
      flap:  b.querySelector('.bill-flap'),
      fshade: b.querySelector('.bill-flapshade'),
      memo: {}
    };
  });

  // Only touch the DOM when a value actually changes — most bills are
  // standing still on most frames.
  function put(part, key, el, prop, val) {
    if (part.memo[key] === val) return;
    part.memo[key] = val;
    el.style[prop] = val;
  }

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }

  /* The corner peel. The fold line cuts the bottom-right corner; the
     front is clipped along it and the cut-off triangle is mirrored
     across the line and drawn as the back of the note lying on top. */
  function peel(p) {
    if (p <= 0.001) return null;
    var a = p * W * 0.557, b = p * H * 0.758;
    var p1x = W - a, p1y = H, p2x = W, p2y = H - b;
    var dx = p2x - p1x, dy = p2y - p1y, vx = W - p1x, vy = H - p1y;
    var k = (vx * dx + vy * dy) / (dx * dx + dy * dy);
    var cx = p1x + 2 * k * dx - vx, cy = p1y + 2 * k * dy - vy;
    var mx = (p1x + p2x) / 2, my = (p1y + p2y) / 2;
    var th = Math.atan2(cx - mx, -(cy - my)), sn = Math.sin(th), cs = Math.cos(th);
    var L = Math.abs(W * sn) + Math.abs(H * cs);
    function at(x, y) { return (((x - W / 2) * sn - (y - H / 2) * cs) / L + 0.5) * 100; }
    var t0 = at(mx, my), t1 = at(cx, cy);
    function stop(f) { return (t0 + (t1 - t0) * f).toFixed(2) + '%'; }
    function pt(x, y) { return x.toFixed(1) + 'px ' + y.toFixed(1) + 'px'; }
    return {
      front: 'polygon(0px 0px, ' + pt(W, 0) + ', ' + pt(p2x, p2y) + ', ' + pt(p1x, p1y) + ', ' + pt(0, H) + ')',
      flap:  'polygon(' + pt(p1x, p1y) + ', ' + pt(p2x, p2y) + ', ' + pt(cx, cy) + ')',
      shade: 'linear-gradient(' + (th * 180 / Math.PI).toFixed(2) + 'deg, rgba(0,0,0,.62) ' + stop(0) +
             ', rgba(255,255,255,.09) ' + stop(0.28) + ', rgba(0,0,0,.04) ' + stop(0.7) +
             ', rgba(0,0,0,.38) ' + stop(1) + ')'
    };
  }

  function resetVideo(part) {
    var v = part.el.querySelector('.vid.playing');
    if (!v) return;
    var btn = v.querySelector('.vthumb');
    if (btn && btn._thumb != null) btn.innerHTML = btn._thumb;
    v.classList.remove('playing');
  }

  function frame() {
    ticking = false;
    if (!on) return;
    var t = (window.scrollY - start) / PER;
    var n = parts.length, f = [], F = 0, i;
    var zone = t < -3 ? -1 : t > n + 2 ? 1 : 0;
    if (zone !== 0 && zone === lastZone) return;
    lastZone = zone;
    for (i = 0; i < n; i++) {
      // the last bill never leaves; each other one rests briefly, then flicks
      f[i] = i < n - 1 ? ease((t - i - 0.08) / 0.84) : 0;
      F += f[i];
    }
    var newTop = Math.min(n - 1, Math.round(F));
    for (i = 0; i < n; i++) {
      var P = parts[i], fk = f[i], D = Math.max(0, i - F);
      var tf, op = '1', z, vis = 'visible', shine = '0', shade = '0', g = null, spos = 'translateX(0%)';
      if (fk >= 1 || D > 2.6) {
        vis = 'hidden'; tf = 'none'; z = '0';
        if (fk >= 1) resetVideo(P);
      } else if (fk > 0) {
        var pe = ease(fk / 0.45), r = ease((fk - 0.3) / 0.7);
        g = peel(pe);
        z = '50';
        tf = 'translate(' + (r * 70).toFixed(1) + 'px,' + (-r * 50).toFixed(1) + 'px) rotateX(' +
             (r * 96).toFixed(2) + 'deg) rotateZ(' + (-r * 9).toFixed(2) + 'deg)';
        op = (r > 0.72 ? 1 - (r - 0.72) / 0.28 : 1).toFixed(3);
        shine = Math.sin(Math.PI * r).toFixed(3);
        spos = 'translateX(' + (r * 66.7).toFixed(2) + '%)';
        shade = (r * 0.55).toFixed(3);
        if (fk > 0.5) resetVideo(P);
      } else {
        var d = Math.min(D, 2.6), step = W < 700 ? 7 : 13;
        z = String(40 - i);
        tf = 'translateY(' + (d * step).toFixed(1) + 'px) scale(' + (1 - d * 0.028).toFixed(4) +
             ') rotateZ(' + (JIT[i % JIT.length] * Math.min(d, 1)).toFixed(2) + 'deg)';
        shade = (Math.min(d, 3) * 0.2 + 0.35 * clamp(D)).toFixed(3);
      }
      put(P, 'vis', P.el, 'display', vis === 'hidden' ? 'none' : '');
      if (vis === 'hidden') continue;             // nothing else to set on a bill nobody can see
      put(P, 'z', P.el, 'zIndex', z);
      put(P, 'tf', P.el, 'transform', tf);
      put(P, 'op', P.el, 'opacity', op);
      put(P, 'sh', P.shine, 'opacity', shine);
      put(P, 'sp', P.shine, 'transform', spos);
      put(P, 'sd', P.shade, 'opacity', shade);
      put(P, 'fc', P.front, 'clipPath', g ? g.front : 'none');
      put(P, 'fw', P.wrap, 'visibility', g ? 'visible' : 'hidden');
      if (g) {
        put(P, 'fl', P.flap, 'clipPath', g.flap);
        put(P, 'fs', P.fshade, 'background', g.shade);
      }
    }
    top = newTop;
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  // Fit each bill's contents to its card. The phone layouts already fit a
  // normal phone; this only kicks in on short screens, and only shrinks.
  function fit() {
    parts.forEach(function (P) {
      var f = 1;
      P.body.style.setProperty('--fit', '1');
      for (var pass = 0; pass < 4; pass++) {
        // measure the content itself plus the bottom padding it has to
        // stay clear of — scrollHeight alone ignores that padding
        var kids = P.body.children, bottom = 0;
        for (var c = 0; c < kids.length; c++) bottom = Math.max(bottom, kids[c].offsetTop + kids[c].offsetHeight);
        var need = bottom + parseFloat(getComputedStyle(P.body).paddingBottom), have = P.body.clientHeight;
        if (need <= have + 1) break;
        f = Math.max(0.6, f * (have / need) * 0.99);
        P.body.style.setProperty('--fit', f.toFixed(4));
      }
    });
  }

  function clearStyles() {
    parts.forEach(function (P) {
      ['display', 'zIndex', 'transform', 'opacity'].forEach(function (k) { P.el.style[k] = ''; });
      P.front.style.clipPath = ''; P.wrap.style.visibility = '';
      P.body.style.opacity = ''; P.body.style.removeProperty('--fit');
      P.shine.style.opacity = ''; P.shade.style.opacity = '';
      P.memo = {};
    });
    stack.style.height = '';
  }

  function layout() {
    var want = !reduce.matches;
    if (want !== on) {
      on = want;
      root.classList.toggle('stack-on', on);
      if (!on) { clearStyles(); return; }
    }
    if (!on) return;
    var nav = document.querySelector('.nav'), player = document.getElementById('player');
    root.style.setProperty('--nav-h', (nav ? nav.offsetHeight : 64) + 'px');
    root.style.setProperty('--player-h', (player && !player.hidden ? player.offsetHeight : 0) + 'px');
    parts.forEach(function (P) { P.memo = {}; P.el.style.display = ''; });
    lastZone = null;
    W = bills[0].offsetWidth; H = bills[0].offsetHeight;
    fit();
    stack.style.height = (stage.offsetHeight + (bills.length - 1) * PER) + 'px';
    var navH = nav ? nav.offsetHeight : 64;
    start = stack.getBoundingClientRect().top + window.scrollY - navH;
    frame();
  }

  // Where to scroll so bill i is the one on top
  function spot(i) { return Math.ceil(start + i * PER + (i ? 2 : 0)); }

  // Nav links, "Watch the visuals" and any #hash that points into the
  // stack: go to the scroll position where that bill is on top.
  document.addEventListener('click', function (e) {
    if (!on) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var i = bills.findIndex(function (b) { return '#' + b.id === a.getAttribute('href'); });
    if (i < 0) return;
    e.preventDefault();
    window.scrollTo({ top: spot(i), behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + bills[i].id);
  });

  // Keyboard users tabbing into a covered bill get taken to it.
  stack.addEventListener('focusin', function (e) {
    if (!on) return;
    var i = bills.indexOf(e.target.closest('.bill'));
    if (i >= 0 && i !== top) window.scrollTo({ top: spot(i) });
  });

  var rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(layout, 120); }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  if (reduce.addEventListener) reduce.addEventListener('change', layout);

  function init() {
    layout();
    // arriving on a link like /#music
    var i = bills.findIndex(function (b) { return '#' + b.id === location.hash; });
    if (on && i >= 0) window.scrollTo({ top: spot(i) });
  }
  // this script sits at the end of <body>, so the DOM is already there:
  // lay out now, then again once images have landed
  init();
  if (document.readyState !== 'complete') addEventListener('load', layout);
  // fonts and images change heights after first layout
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
