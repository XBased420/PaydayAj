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
      // A hidden `required` field still blocks submit, and the browser can't
      // focus it to say why — the button just does nothing. Disabled
      // fieldsets skip validation and stay out of FormData.
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
    setTimeout(function () { slot.classList.add('on'); }, 900);
  }

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
  audio.crossOrigin = 'anonymous';

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

  function play() {
    var p = audio.play();
    if (p && p.catch) p.catch(function () { setIcon(false); });
    connectAnalyser();
  }

  audio.addEventListener('play',  function () { setIcon(true);  store(KEY_ON, '1'); });
  audio.addEventListener('pause', function () { setIcon(false); store(KEY_ON, '0'); });

  audio.addEventListener('ended', function () {
    pos = (pos + 1) % order.length;
    load(pos);
    play();
  });

  // A track that won't load shouldn't leave a dead button — skip past it.
  audio.addEventListener('error', function () {
    if (order.length < 2) { bar.hidden = true; return; }
    pos = (pos + 1) % order.length;
    load(pos);
  });

  if (toggle) toggle.addEventListener('click', function () {
    if (audio.paused) play(); else audio.pause();
  });

  if (nextBtn) nextBtn.addEventListener('click', function () {
    var wasOn = !audio.paused;
    pos = (pos + 1) % order.length;
    load(pos);
    if (wasOn) play(); else setIcon(false);
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
  var ctx, analyser, data, raf;

  function connectAnalyser() {
    if (ctx || !window.AudioContext && !window.webkitAudioContext) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      var src = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      data = new Uint8Array(analyser.frequencyBinCount);
      bar.classList.add('live');
      tick();
    } catch (err) { ctx = null; }
  }

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
    var resume = function () { play(); };
    if (document.readyState === 'complete') setTimeout(resume, 300);
    else addEventListener('load', function () { setTimeout(resume, 300); });
  }

  setIcon(false);
})();
