
App.views.LibraryBanner = Backbone.View.extend({
  className: "library-banner-view",
  template: Handlebars.templates["library-banner.tmpl"],
  
  // Whether or not a subscription is active.
  isSubscriptionActive: false,
  
  previewDialog: null,
  
  subscribeDialog: null,
    
  events: {
    "click .slide"       : "banner_tap",
    "click #show-more"   : "showMore_clickHandler"
  },
  
  initialize: function() {
    console.log("App.views.LibraryBanner.initialize()");
    var that = this;
    
    this._debounce_render = _.throttle(_.bind(this.render, this, $.noop), 500);
    
    App.library.listenTo(App.grade, "refresh:banner", function() {
      that._debounce_render();
    });
    
    $(window).on("resize orientationchange", function() {
      that._debounce_render();
    }); 
  },
  
  render: function(cb) {
    console.log("App.views.LibraryBanner.render()");
    cb = cb || $.noop;
    
    var that = this, cx;
    
    cx = {
      settings: settings
    };
    
    this.$el.html(this.template(cx));
    
    setTimeout(function() {
      that.setup_sidescroller("libBanner");
    });
    
    cb();
    return this;
  },
  
  banner_tap: function(e) {
    console.log("App.views.LibraryBanner.banner_tap()");
    
    App.omni.event("lb_banner_taps");
    
    var element = $(e.currentTarget);
    
    if (element.hasClass("subscribe")) {
      console.log("Banner tap - subscribe");
      new App.dialogs.Subscribe();
    } else if (element.hasClass("link")) {
      console.log("Banner tap - " + settings.BANNER_TARGET_URL + " - this will only work with an R30 app or higher");
      App.api.dialogService.open(settings.BANNER_TARGET_URL);
    } else if (element.hasClass("signin")) {
      if (element.hasClass("teacher")) {
        this.display_loginDialog(e, true);
      } else {
        this.display_loginDialog(e, false);
      }
    } else {
      console.log("Banner tap - no action");
    }
    return false;
  },
  
  setup_sidescroller: function(elementId) {
    var $main_gallery = document.getElementById(elementId);

    gallery = new libBanner.SlideshowGallery($main_gallery);
    gallery.enableTouch().slideEvery(5000);
  },
});