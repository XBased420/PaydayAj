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
