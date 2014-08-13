//Pulled from API Wrapper (to get lucie data - didn't need everything)
//Dependencies: AdobeAPI, jQuery

adobeDPS.authenticationService.get_lucie_data = function() {
  return this._get_lucie_data.d;
};
adobeDPS.authenticationService._get_lucie_data = function _get_lucie_data() {
  var d = new $.Deferred(),
      auth = this;

  _get_lucie_data.d = d;

  if (!auth.isUserAuthenticated) {
    auth.lucie_data = null;
    auth.lucie_subscriber = {id: null, type: 'dsc', is_active: false};
    d.resolve(auth.lucie_subscriber);
    return;
  }

  lucieApi._default_api_args.appVersion = adobeDPS.configurationService.applicationVersion;
  lucieApi._default_api_args.uuid = adobeDPS.deviceService.deviceId;
  lucieApi._default_api_args.appId = adobeDPS.configurationService.applicationID;
  lucieApi._default_api_args.authToken = auth.token;

  lucieApi.entitlements(function(data) {
    auth.lucie_data = data;
    auth.lucie_subscriber = {
      id: $("subscriberId", data).text(),
      type: $("subscriberType", data).text(),
      is_active: $("subscriberIsActive", data).text() == "Y",
      bundleId: $("bundleId", data).text() /* probably not needed, but including just in case */
    };
    d.resolve(auth.lucie_subscriber);
  }).error(function() {
    auth.logout();
    auth.lucie_data = null;
    auth.lucie_subscriber = {id: null, type: 'dsc', is_active: false};
    d.resolve(auth.lucie_subscriber);
  });
};

// keep the lucie data up to date
adobeDPS.authenticationService._get_lucie_data();