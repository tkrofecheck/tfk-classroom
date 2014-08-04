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
    
    stopPreview: false,
    $headerTitle: null,
    isOnline: null,
    libraryCollection: null,
    $grid: null, // Displays the 'library' grid of folios.
    $sectionsgrid: null, // Displays the 'sections' grid of folios.
    $archivegrid: null, // Displays the 'archive' grid of folios.
    folioThumbTimestamp: (+new Date()),
    gradeLevel: null,
    
    // grade levels that will appear in productIds, change value to match on here if product Id format changes   
    gradeLevels: {
      0: "all",
      1: "k1",
      2: "22",
      3: "34",
      4: "56"
    },
    
    userType: null,

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
    
    preloader : null,
    grade : null,
    autosignout : null,
    library : null,
    
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
