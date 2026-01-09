/**
 * Display current active users using Plausible Analytics API.
 * Requires `data-plausible-domain` and `data-plausible-api-key`
 * attributes on the script tag loading this file.
 */
(function() {
  if (window.__userStatsLoaded) return;
  window.__userStatsLoaded = true;

  function createBox(count) {
    var box = document.createElement('div');
    box.className = 'user-stats';
    box.id = 'user-stats';
    box.textContent = 'Current active users: ';
    var span = document.createElement('span');
    span.id = 'user-count';
    span.textContent = count;
    box.appendChild(span);
    document.body.appendChild(box);
  }

  function updateCount(domain, apiKey) {
    var url = 'https://plausible.io/api/v1/stats/realtime/visitors?site_id=' + encodeURIComponent(domain);
    fetch(url, { headers: { Authorization: 'Bearer ' + apiKey } })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        var count = data && data.results ? data.results : 0;
        var box = document.getElementById('user-stats');
        if (!box) createBox(count);
        else document.getElementById('user-count').textContent = count;
      })
      .catch(function() {
        var box = document.getElementById('user-stats');
        if (box) box.style.display = 'none';
      });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var script = document.querySelector('script[data-plausible-domain]');
    if (!script) return;
    var domain = script.dataset.plausibleDomain;
    var apiKey = script.dataset.plausibleApiKey;
    if (!domain || !apiKey) return;
    updateCount(domain, apiKey);
  });
})();
