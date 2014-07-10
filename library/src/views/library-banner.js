
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
    
    App.grade.on("level:updated", function() {
      console.log("grade level updated - fix banner");
      that._debounce_render();
    });
    
    $(window).on("resize orientationchange", function() {
      that._debounce_render();
    });
    
    App.api.authenticationService.updatedSignal.add(this._debounce_render);
    App.api.authenticationService.userAuthenticationChangedSignal.add(this._debounce_render);
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
  
  display_previewDialog: function(e, folio, elementId) {
    console.log("App.views.LibraryBanner.display_previewDialog()");
    e.preventDefault();
    
    if (!this.previewDialog) {
      this.previewDialog = new App.views.dialogs.PreviewDialog({model: folio});
      this.$el.append(this.previewDialog.render().el);
      this.previewDialog.setImageProperties($(e.target), elementId);
      
      this.previewDialog.$el.off("previewDialogClosed").on("previewDialogClosed", function() {
        this.previewDialog = null;
      });
      // Only show the subscribe button if testing on the desktop or
      // if the user doesn't own the latest folio and does not have an active subscription.
      //if ((!this.userOwnsLatestFolio && !this.isSubscriptionActive) && folio == this.folios[0]) {
        // Only show the subscribe button for the most recent.
        //previewDialog.showSubscribeButton();
      //}
      
      // Only show the preview button if testing on the desktop.
      // Otherwise the preview button visibility is determined in PreviewDialog.
      //if (!App._using_adobe_api) {
        //previewDialog.showPreviewButton();
      //}
    } else {
      this.previewDialog = null;
      return false;
    }
  },
  
  display_subscribeDialog: function(e) {
    console.log("App.views.LibraryBanner.display_subscribeDialog()");
    e.stopPropagation();
    
    if (!this.subscribeDialog) {
      this.subscribeDialog = new App.views.dialogs.SubscribeDialog();

      var that = this;
      this.subscribeDialog.$el.off("subscribeDialogClosed").on("subscribeDialogClosed", function() {
        that.subscribeDialog = null;
      });
    }
  },
  
  display_loginDialog: function(e, userType) {
    console.log("App.views.LibraryBanner.display_loginDialog()");
    e.stopPropagation();
    
    if (!App.api.authenticationService.isUserAuthenticated) {
      var that = this,
          loginDialog;
      
      loginDialog = (userType) ? new App.views.dialogs.TeacherLoginDialog() : new App.views.dialogs.LoginDialog();
      
      var loginScrollPosition = $(window).scrollTop();
      
      // Triggered from the dialog when a login is successful.
      loginDialog.$el.off("loginSuccess").on("loginSuccess", function() {
        that.loginBtn.html(settings.LBL_SIGN_OUT);
        $(window).scrollTop(loginScrollPosition); // set the scroll position back to what it was.
      });
    } else {
      App.api.authenticationService.logout();
      
      this.loginBtn.html(settings.LBL_SIGN_IN);
    }
  },
  
  banner_tap: function(e) {
    console.log("App.views.LibraryBanner.banner_tap()");
    
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
  }
});