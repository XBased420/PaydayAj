/* PAYDAY AJ — app.js
   Booking form: one picker routes to one branch. Fields come from the client
   brief (Q32) — he selected these and only these. Do not add fields without
   asking him; he named a form-heavy site as the one he can't stand.

   PHASE 4 TODO: replace handleSubmit() with a POST to the Apps Script web app
   once the booking inbox exists. Until then the form shows the fallback panel. */

(function () {
  'use strict';

  var BRANCHES = ['show', 'feature', 'shoot', 'press'];

  var picker = document.querySelector('.picker');
  var form = document.getElementById('bookform');
  var sent = document.getElementById('sent');
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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.hidden = true;
    if (sent) {
      sent.hidden = false;
      sent.setAttribute('tabindex', '-1');
      sent.focus();
      sent.scrollIntoView({ block: 'center' });
    }
  });

  show('show');
})();
