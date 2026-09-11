/* PAYDAY AJ — app.js
   Booking form: one picker routes to one branch. Fields come from the client
   brief (Q32) — he selected these and only these. Do not add fields without
   asking him; he named a form-heavy site as the one he can't stand.

   TO GO LIVE: paste the Apps Script web app /exec URL into ENDPOINT below.
   While ENDPOINT is empty the form shows the Instagram fallback instead of
   pretending to send. */

var ENDPOINT = '';

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
      if (fs) fs.hidden = b !== branch;
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
