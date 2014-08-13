/* Dependencies:
 *  - settings ({TITLE}.js -> settings_loader.js)
 *  - jQuery
 */

window.lucieApi = {
  _default_api_args: {
    appVersion: 1,
    uuid: 1,
    appId: settings.APP_ID,

    // Must be set be user of this lib before calling the API
    authToken: undefined
  },
  call: function(endpoint, data, cb) {
    var url = settings.lucie_server_root + endpoint;
    data = $.extend({}, this._default_api_args, data);
    return $.get(url, data, cb);
  },
  entitlements: function(cb) {
    var authToken = this._default_api_args.authToken;

    if (authToken == localStorage.lucieCacheAuthToken && localStorage.lucieCacheEntitlements) {
      cb($(localStorage.lucieCacheEntitlements));
      return { error: function(){} }
    }

    return this.call("entitlements", {}, function(data) {
      localStorage.lucieCacheAuthToken = authToken;
      localStorage.lucieCacheEntitlements = (new XMLSerializer).serializeToString(data);
      cb($(data));
    });
  }
};

