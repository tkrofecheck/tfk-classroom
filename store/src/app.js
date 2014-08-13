/* global DEBUG, REPL, Backbone, App, settings, TcmOmni, EMStart, EMSetEventQueueCallback, EMForceFlush */
/* Dependencies:
 *  - tcm_devtools (jquery, backbone -> underscore, settings)
 *  - backbone (underscore, jquery)
 *  - underscore
 *  - settings ({brand}.js -> settings_loader.js)
 *  - tcm_omniture
 *  - ema-*.js
 */
(function() {
  window.App = {
    model: {},
    views: {
      archive: {},
      dialogs: {},
      folioItems: {},
      section: {}
    },
    
    $headerTitle: null,
    isOnline: null,
    libraryCollection: null,
    $grid: null, // Displays the 'library' grid of folios.
    $sectionsgrid: null, // Displays the 'sections' grid of folios.
    $archivegrid: null, // Displays the 'archive' grid of folios.
    folioThumbTimestamp: (+new Date()),

    spinnerOpts: {
      lines: 13, // The number of lines to draw
      length: 3, // The length of each line
      width: 2, // The line thickness
      radius: 6, // The radius of the inner circle
      corners: 0, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: 'auto', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    },
    
    autoSignout: {
      isSupported: true,
      isEnabled: false,
    },
    
    // Omniture Helper functions
    omni: {
      pageview: function(page_name) {
        this.dps_event("samples|pageview|"+page_name, page_name);
        return TcmOmni.pageview.apply(TcmOmni, arguments);
      },
      event: function(evt_name) {
        this.dps_event(evt_name);
        return TcmOmni.event.apply(TcmOmni, arguments);
      },
      dps_event: function(evt_name, page_name) {
        if (page_name !== undefined) page_name = "samples|"+page_name;
        else page_name = TcmOmni.get_pagename();

        // get the currently running AB tets if the AB testing
        // framework is loaded
        var ab_tests = window.AB ? AB.omnitureString() : '';

        App.api.analyticsService.trackCustomEvent("customEvent3", {
          customVariable3: evt_name,
          customVariable4: page_name,
          customVariable7: ab_tests
        });
      }
    },
    
    debug: {
      launch_repl: function() {
        if (!DEBUG) return;
        var repl = new REPL();
        repl.render().$el.appendTo("body");
        setTimeout(function() { repl.start() }, 200);
      },
      reload: function() {
        window.location.reload(true);
      }
    }
  };
})();
