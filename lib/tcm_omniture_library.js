/* DEPENDENCIES
 *  - AdobeLibraryAPI.js (note: must wait for initializationComplete)
 *  - s_code.js (-> settings/{title}.js, settings/settings_loader.js)
 *  - moment.js
 *  - underscore.js
 *
 *  Note: this library doesn't depend on app.js, so you shouldn't use 
 *    App.api._____ method of calling the API methods. This was intentional
 *    so that we can use this lib on other pages besides the storefront.
 */
(function(root) {
  var omni = s,
      config = {};

  function cache(key, getter) {
    if (cache[key] === undefined) cache[key] = getter();
    return cache[key];
  };

  root.setup = function(cfg) {
    _.extend(config, cfg);
  }
  root.set_pagename = function(page_name) {
    var prev_pagename = config.pageName;
    root.setup({
      pageName: page_name,
    });
    return prev_pagename;
  }
  root.get_pagename = function() { return config.pageName }

  var subscriber = {id:'', type: 'dsc'};
  root.set_subscriber = function(id, type) {
    subscriber.id = id;
    subscriber.type = type;
  }
  function get_context_data_to_track() {
    var isLoggedOn = adobeDPS.authenticationService.isUserAuthenticated,
        today = moment(), // moment.js
        halfHour = (today.minutes() >= 30) ? "30" : "00",
        orientation = (window.orientation == 0 || window.orientation == 180) ? 'portrait' : 'landscape',
        visitor_id = cache('visitor_id', function() { 
          return md5(adobeDPS.deviceService.deviceId);
        }),
        timestamp = today.format('MM/DD/YYYY-hh:[' + halfHour + ']A'),
        device = adobeDPS.deviceService.deviceName.toLowerCase(),
        subscriber_type = subscriber.type,
        subscriber_id = subscriber.id;
      
    return _.extend({
      timestamp: today.unix(),
      
      visitorID: visitor_id,
      eVar3: visitor_id,

      prop3: "D=User Agent",
      prop10: device+" dps",

      prop16: "library",
      eVar24: "library",

      prop18: orientation,
      prop19: "online",
        
      prop26: subscriber_type,
      eVar26: subscriber_type,

      prop34: 'ab_test_off',
      eVar34: 'ab_test_off',

      prop29: subscriber_id,
      eVar29: subscriber_id,
      
      prop36: "library",
      eVar36: "library",

      eVar30: today.format("dddd").toLowerCase(),

      prop7: timestamp,
      eVar31: timestamp,

      eVar32: (today.day() == 0 || today.day() == 6) ? "weekend" : "weekday"
    }, config);
  }

  root._omniture_track = function(data_obj) {
    try {
      _.extend(omni, get_context_data_to_track());

      omni.prop35 = omni.eVar35 = "pageview";

      _.extend(omni, data_obj);
      omni.t();
    }
    catch (e) {
      console.log('ERROR in TcmOmni._omniture_track', e);
    } 
  }

  root._omniture_track_link = function(data_obj) {
    try {
      var keys;
      _.extend(omni, get_context_data_to_track());

      if (!data_obj.events) data_obj.events = "event45";
      data_obj.eVar44 = omni.pageName;

      // NOTE: Any manipulation of data_obj must happen before this:
      keys = _.keys(data_obj);
        
      omni.linkTrackVars = keys.join(',') + ',prop3,prop7,prop10,prop16,prop18,prop19,prop26,prop29,prop34,prop35,prop36,eVar3,eVar24,eVar26,eVar29,eVar30,eVar31,eVar32,eVar34,eVar35,eVar36,eVar44,events';
      omni.linkTrackEvents = data_obj.events;
      omni.prop35 = omni.eVar35 = "user action";

      _.extend(omni, data_obj);
      omni.tl(this, 'o', (omni.events == 'event44') ? 'splash occurences' : 'user action');
        
      _.each(keys, function(key) {
        omni[key] = null; 
      })
    }
    catch (e) {
      console.log('ERROR in TcmOmni._omniture_track', e);
    }
  }

  root.pageview = function(page_name, events, set_name) {
    set_name = (set_name===undefined) ? true : set_name;

    var prev_pagename,
        ret = {},
        pageName = "library|" + page_name;

    if (set_name) ret.prev = root.set_pagename(pageName);
    
    root._omniture_track({
      pageName: pageName,
      prop8: page_name,
      eVar28: page_name,
      events: events
    });
    return ret;
  }
  root.lucieflow_pageview = function(page_name, events) {
    root._omniture_track({
      pageName: "library|" + page_name,
      prop8: page_name,
      eVar28: page_name,
      eVar33: page_name,
      events: events
    });
    return {};
  }
  root.event = function(evt_name, evt_meta) {
    data = {
      prop45: evt_name,
      eVar45: evt_name
    }
    if (evt_meta !== undefined) {
      data.eVar1 = data.eVar2 = evt_meta;
    }
    root._omniture_track_link(data);
    return {};
  }

  root._logging = function(level, id, description) {
    level = (level || "LOG").toUpperCase();
    id = (id || "GENERAL").toUpperCase();
    description = description ? (":" + description) : "";

    root._omniture_track_link({
      events: "event75",
      eVar75: level+":"+id+description,
      prop35: undefined,
      eVar35: undefined
    });
  }
  root.log = function(id, desc) { root._logging("LOG", id, desc) };
  root.error = function(id, desc) { root._logging("ERR", id, desc) };

})(window.TcmOmni={});
