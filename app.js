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
  addEventListener('scroll', onScroll, { passive: true });
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
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
      f.title = card.querySelector('h3').textContent;
      f.setAttribute('frameborder', '0');
      f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
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
