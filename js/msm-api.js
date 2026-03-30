(function () {
  function msmApiUrl(apiPath) {
    var base =
      typeof window !== 'undefined' && window.MSM_API_BASE
        ? String(window.MSM_API_BASE).replace(/\/$/, '')
        : '';
    if (!apiPath.startsWith('/')) apiPath = '/' + apiPath;
    return base + apiPath;
  }

  function msmAdminHeadersJson() {
    return {
      'Content-Type': 'application/json',
      'X-Admin-Key': (typeof window !== 'undefined' && window.MSM_ADMIN_KEY) || '',
    };
  }

  function msmAdminHeaders() {
    return {
      'X-Admin-Key': (typeof window !== 'undefined' && window.MSM_ADMIN_KEY) || '',
    };
  }

  /** Fetch JSON and throw Error with server message when !ok (for dashboard API calls). */
  function msmFetchJson(url, options) {
    return fetch(url, options).then(function (r) {
      return r.text().then(function (text) {
        var j = {};
        try {
          j = text ? JSON.parse(text) : {};
        } catch (e) {}
        if (!r.ok) {
          var msg = (j && j.error) || text || 'HTTP ' + r.status;
          throw new Error(msg);
        }
        return j;
      });
    });
  }

  window.msmApiUrl = msmApiUrl;
  window.msmAdminHeadersJson = msmAdminHeadersJson;
  window.msmAdminHeaders = msmAdminHeaders;
  window.msmFetchJson = msmFetchJson;
})();
