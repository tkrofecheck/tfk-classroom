
App.views.StoreChrome = Backbone.View.extend({
  className: "store-chrome-view",
  template: Handlebars.templates["store-chrome.tmpl"],
  
  events: {
    "click #go-to-library"            : "goto_library_tab"
  },
  
  initialize: function() {
    console.log("App.views.StoreChrome.initialize()");
    var that = this;

    this._debounce_render = _.throttle(_.bind(this.render, this, $.noop), 500);
    
    App.autosignout.on("autosignout:toggle-complete", function() { // this is needed to redraw the menu in order for the flip-switch to display appropriately
      that._debounce_render();
      return false;
    });
    
    if (localStorage.autoSignout) {
      App.autoSignout.isEnabled = (localStorage.autoSignout=="true") ? true : false;
    }
  },
  
  render: function(cb) {
    console.log("App.views.StoreChrome.render()");
    var that = this, loginLbl, model, cx;
    cb = cb || $.noop;
    
    // Determine the login label for the drop down menu.
    //loginLbl = App.api.authenticationService.isUserAuthenticated ? settings.LBL_SIGN_OUT: settings.LBL_SIGN_IN;
    
    loginLbl = settings.LBL_SIGN_OUT;
    model = {
      loginLbl: loginLbl
    };
    
    cx = {
      DEBUG:DEBUG,
      model:model,
      settings:settings
    };
    
    this.$el.html(this.template(cx));
    
    App.$headerTitle = this.$("#header #title span");
    this.loginBtn = this.$("#print-subscriber-login");
    
    $(window).on("resize", function(){
      that.setHeaderWidth();
    });
    
    //setTimeout(function() { that.startLogoutCountdown();}, 100);
    
    cb();
    return this;
  },

  display_loginDialog: function(e) {
    console.log("App.views.StoreChrome.display_loginDialog()");
    e.stopPropagation();
    
    var that = this;
    
    if (!App.api.authenticationService.isUserAuthenticated) {
      var loginDialog = new App.views.dialogs.LoginDialog();
      
      var loginScrollPosition = $(window).scrollTop();
      
      // Triggered from the dialog when a login is successful.
      loginDialog.$el.on("loginSuccess", function() {
        that.loginBtn.html(settings.LBL_SIGN_OUT);
        $(window).scrollTop(loginScrollPosition); // set the scroll position back to what it was.
      });
    } else {
      App.api.authenticationService.logout();
      
      this.loginBtn.html(settings.LBL_SIGN_IN);
    }
  },
  startLogoutCountdownPrompt: function(){
    var that = this,
        timer = null;
    
    timer = 1000 * (settings.TIME_BEFORE_SIGNOUT_COUNTDOWN_SECONDS + .5);
    
    if (this.logoutTimeout || this.$("#logout-countdown-dialog").length > 0) {
      return;
    } else {
      this.logoutTimeout = window.setTimeout(function() {
        var logoutDialog = new App.views.dialogs.LogoutCountdown();
        
        logoutDialog.$el.on("autoLogoutCancel", function() {
          that.endLogoutCountdown();
          logoutDialog.$el.off("autoLogoutCancel");
        });
        
        logoutDialog.$el.on("signout:true", function() {
          if (DEBUG) {
            App.api.authenticationService.isUserAuthenticated = false; // be sure to set this to false for desktop testing
          }
          $("#print-subscriber-login").html(settings.LBL_SIGN_IN);
          logoutDialog.$el.off("signout:true");
        });
      }, timer); // display prompt if no activity detected in time-delay-defined
    }
  },
  
  endLogoutCountdown: function() {
    //remove logout counter
    if (this.logoutTimeout) {
      console.log("clear logout timeout");
      clearTimeout(this.logoutTimeout);
      this.logoutTimeout = null;
    }
  },
  
  removeAllIssues: function() {
    var that = this;

    this.foliosToArchive = [];
    
    // Sort the folios descending.
    var list = App.api.libraryService.folioMap.sort(function (a, b) {
      if (a.publicationDate < b.publicationDate) {
        return 1;
      } else if (a.publicationDate > b.publicationDate) {
        return -1;
      } else {
        return 0;
      }
    });
    
    console.log("list of folios:", list);
    
    // filter list based on dropdown in chrome
    this.foliosToArchive = _.filter(list, function(folio) {      
      return (folio.isArchivable || folio.isViewable);
    });
    
    if (this.foliosToArchive.length > 0) {
      console.log("folios to archive: ", this.foliosToArchive);
      
      this.$el.unbind("click"); //disable closing dialog by tapping modal - must dismiss itsel
      
      if (App._using_adobe_api) {
        $.each(this.foliosToArchive, function(index, element) {
          //console.log("element:" + element + ", index:" + index + "productID:", element.productId);
          var folio = App.api.libraryService.folioMap.getByProductId(element.productId);
          
          folio.archive();
          console.log("folio archived", folio);
        });
      }
    } else {
      console.log("no folios to archive");
    }
    setTimeout(function() {
      App.api.authenticationService.logout();
      if (DEBUG) {
        App.api.authenticationService.isUserAuthenticated = false; // desktop testing purposes
      }
      that.loginBtn.html(settings.LBL_SIGN_IN);
      console.log("Logged out!");
    }, 1000);
  },
  
  setHeaderWidth: function() {      
    // Need to explicitly set the width otherwise it doesn't always update if width=100% in css.
    this.$("#header").width($(window).width());
  },
  
  goto_library_tab: function() {
    console.log("Leaving Samples... Switching to tab: Library");
    
    App.api.configurationService.gotoState("library");
  }
});

