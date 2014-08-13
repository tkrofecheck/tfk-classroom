console.log("----------  STARTING APP  ----------");

if (DEBUG) {
  settings.asset_root = settings.dev_asset_root;
  window.openDatabase = function() {
    return {
      transaction: function(){},
      readTransaction: function(){}
    };
  };
}
else {
  settings.asset_root = settings.prod_asset_root;  
  //window.console = {log: $.noop}
}

window.onerror = function(err, lineNo, fileName) {
  if (DEBUG) console.log("window.onerror()", err, lineNo, fileName);
  else App.error("window.onerror", err);
};

// disable scrolling the body element (which shows the a white background 
// outside the document and just generally feels, not-very-appy
$(document)
  .on("touchmove", function(evt) { evt.preventDefault(); })
  .on("touchmove", ".scrollable", function(evt) { evt.stopPropagation(); });

App.preload();

Handlebars.registerHelper('setting', function(options) {
  return options.fn(settings);
});
Handlebars.registerHelper('ifequal', function(options) {
  var key, keys = Object.keys(options.hash);
  for (var i=keys.length; i--;) {
    key = keys[i];
    if (this[key] != options.hash[key]) {
      return options.inverse(this);
    }
  }
  return options.fn(this);
});

function t() { return +(new Date); }

$(function() {
  var start_t = t();
  console.log("dom ready - " + (t() - start_t));
  App.loading(true);
  
  if (DEBUG && typeof adobeDPS == "undefined") {
    App._raw_api = MockAPI;
    App._using_adobe_api = false;
  }
  else {
    App._raw_api = adobeDPS;
    App._using_adobe_api = true;
  }
  
  App.grade = _.extend({}, Backbone.Events);
  App.autosignout = _.extend({}, Backbone.Events);
  App.archive = _.extend({}, Backbone.Events);
  App.library = _.extend({}, Backbone.Events);
  
  // launch the app when everything has initialized / preloaded (APIs and images) 
  App._raw_api.initializationComplete.addOnce(function() {
    console.log("init complete - " + (t() - start_t));
    
    APIWrapper(App._raw_api, function(wrapped_api) {
      App.api = wrapped_api;
      Backbone.trigger("ApiReady");
      console.log("API Ready - " + (t() - start_t));

      //new App.dialogs.StraightToSample();

      // launch the app
      new App.views.Main().render(function() {
        App.loading(false);
        Backbone.trigger("AppReady");
        console.log("Main View Rendered - " + (t() - start_t));
      });
      
      // Create echo iframe and form, then submit
      //new App.views.Echo().render();

    });
  });
});

