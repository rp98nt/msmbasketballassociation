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

  window.msmApiUrl = msmApiUrl;
  window.msmAdminHeadersJson = msmAdminHeadersJson;
  window.msmAdminHeaders = msmAdminHeaders;
})();
