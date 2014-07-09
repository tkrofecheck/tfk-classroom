
App.views.LibraryChrome = Backbone.View.extend({
  className: "library-chrome-view",
  template: Handlebars.templates["library-chrome.tmpl"],
  
  logoutTimeout: null,
  logoutInterval: null,
  subscribeDialog: null,
  stopDropDown: false,
  
  events: {
    "click #print-subscriber-login"   : "display_loginDialog",
    "click #subscribe"                : "display_subscribeDialog",
    "click #go-to-store"              : "redirect_store",
    
    "change #header-drop-down"        : "header_dropDownChangeHandler"
  },
  
  initialize: function() {
    console.log("App.views.LibraryChrome.initialize()");
    
    var that = this;
    
    $("body").on("subscriptionPurchased", function() {// Triggered from the dialog when a purchase is successful.
      that.$("#subscribe").css("display", "none");
      $("body").off("subscriptionPurchased");
    });
    
    this._debounce_render = _.throttle(_.bind(this.render, this, $.noop), 500);
    
    App.grade.on("level:updated", function() { // this is needed to redraw the menu (Dropdown.js is buggy - provided by Adobe)
      that._debounce_render();
      return false;
    });
    
    App.autosignout.on("autosignout:toggle-complete", function() { // this is needed to redraw the menu in order for the flip-switch to display appropriately
      that._debounce_render();
      return false;
    });
    
    $("body").on("change", "#auto-signout", function(e, isOn) {
      that.autoSignout_changeHandler(e, isOn);
    });
    
    $("body").on("change", "#auto-archive", function(e, isOn) {
      that.autoArchive_changeHandler(e, isOn);
    });
    
    
    if (localStorage.autoSignout) {
      App.autoSignout.isEnabled = (localStorage.autoSignout=="true") ? true : false;
    }
    
    this.toggle_autoSignout();

    App.api.authenticationService.updatedSignal.add(this._debounce_render);
    App.api.authenticationService.userAuthenticationChangedSignal.add(this._debounce_render);
  },
  
  render: function(cb) {
    console.log("App.views.LibraryChrome.render()");
    var that = this, loginLbl, model, cx;
    cb = cb || $.noop;
    
    // Determine the login label for the drop down menu.
    loginLbl = App.api.authenticationService.isUserAuthenticated ? settings.LBL_SIGN_OUT : settings.LBL_SIGN_IN;
    
    model = {
      loginLbl: loginLbl,
      autoarchive_support: /*App.api.settingsService.autoArchive.isSupported*/ false,
      autoarchive_enabled: /*App.api.settingsService.autoArchive.isEnabled*/ false,
      autosignout_support: App.autoSignout.isSupported,
      autosignout_enabled: App.autoSignout.isEnabled
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
    
    this.$("#header-drop-down").dropDown({verticalGap: -20, className: "drop-down-menu", menuWidth: 250});
    
    cb();
    
    return this;
  },

  // Handler for the drop down menu.
  header_dropDownChangeHandler: function(e) {   
    console.log("App.views.LibraryChrome.header_dropDownChangeHandler()");
    
    e.stopPropagation();
    
    var selectedLabel = $(e.target).dropDown("getSelectedLabel");
    if (selectedLabel == settings.LBL_RESTORE_ALL_PURCHASES) {  // Display the restore dialog.
      this.display_restorePurchasesDialog();
    } else if (selectedLabel == settings.LBL_REMOVE_ISSUES_FROM_IPAD) {
      this.display_archiveIssueView();
    } else { // filter folios by grade
      this.display_gradeLevelDialog();
    }
  },

  display_gradeLevelDialog: function(e) {
    console.log("App.views.LibraryChrome.display_gradeLevelDialog");
    
    var that = this;
    
    var gradeLevelDialog = new App.views.dialogs.GradeLevelDialog();
    gradeLevelDialog.$el.off("gradeSelected").on("gradeSelected", function(e, transaction) {
      var gradeScrollPosition = $(window).scrollTop();
      
      // Triggered from the dialog when a grade selected.
      gradeLevelDialog.$el.off("gradeSelectionSuccess").on("gradeSelectionSuccess", function() {
        $(window).scrollTop(gradeScrollPosition); // set the scroll position back to what it was.
      });
    });
  },
  
  display_restorePurchasesDialog: function(e) {
    console.log("App.views.LibraryChrome.display_restorePurchasesDialog()");
    
    var that = this;
    
    var restoreDialog = new App.views.dialogs.RestoreDialog();
    
    restoreDialog.$el.off("restorePurchasesStarted").on("restorePurchasesStarted", function(e, transaction) {
      var windowWidth = $(window).width(),
          spinnerLeft = "410px";
    
      if (windowWidth <= 768) {
        spinnerLeft = "280px";
      }
      restoreDialog.$el.off("restorePurchasesStarted");

      App.$headerTitle.text("Restoring Purchases...");

      window.spinner = new Spinner(App.spinnerOpts).spin();
      $(window.spinner.el).insertBefore("#header #title span").css({'top':'23px','left':spinnerLeft});
    
      transaction.completedSignal.addOnce(function() {
        window.spinner.stop();
        $("#header #title .spinner").remove();
        App.$headerTitle.html(settings.IS_HEADER_TEXT);
      }, this);
    });
  },
  
  display_archiveIssueView: function(e) {
    console.log("App.views.LibraryChrome.display_archiveIssueView()");
    
    var archiveView = new App.views.archive.ArchiveView({model: App.libraryCollection});
    
    // Need to remove the grid so it is not scrollable in the background.
    var previewScrollPosition = $(window).scrollTop(); // get the current scroll position
    App.$grid.hide();
    
    archiveView.$el.off("archiveViewClosed").on("archiveViewClosed", function() {
      $(window).scrollTop(previewScrollPosition); // set the scroll position back to what it was.
      App.$grid.show();
      
      archiveView.$el.off("archiveViewClosed");
    });
  },

  display_loginDialog: function(e) {
    console.log("App.views.LibraryChrome.display_loginDialog()");
    e.stopPropagation();
    
    if (!App.api.authenticationService.isUserAuthenticated) {
      var that = this,
          loginDialog = new App.views.dialogs.LoginDialog();
      
      var loginScrollPosition = $(window).scrollTop();
      
      // Triggered from the dialog when a login is successful.
      loginDialog.$el.off("loginSuccess").on("loginSuccess", function() {
        that.loginBtn.html(settings.LBL_SIGN_OUT);
        $(window).scrollTop(loginScrollPosition); // set the scroll position back to what it was.
      });
    } else {
      App.api.authenticationService.logout();
      App.api.authenticationService.isUserAuthenticated = false;
      this.endLogoutCountdown();
      
      this.loginBtn.html(settings.LBL_SIGN_IN);
    }
  },

  display_subscribeDialog: function(e) {
    console.log("App.views.LibraryChrome.display_subscribeDialog()");
    e.stopPropagation();
    
    if (!this.subscribeDialog) {
      this.subscribeDialog = new App.views.dialogs.SubscribeDialog();

      var that = this;
      this.subscribeDialog.$el.off("subscribeDialogClosed").on("subscribeDialogClosed", function() {
        that.subscribeDialog = null;
      });
    }
  },
  
  setHeaderWidth: function() {      
    // Need to explicitly set the width otherwise it doesn't always update if width=100% in css.
    this.$("#header").width($(window).width());
  },

  startLogoutCountdownPrompt: function(){
    var that = this;
    
    if (this.logoutTimeout || this.$("#logout-countdown-dialog").length > 0) {
      return;
    } else {
      this.logoutTimeout = window.setTimeout(function() {
        var logoutDialog = new App.views.dialogs.LogoutCountdown();
        
        logoutDialog.$el.off("autoLogoutCancel").on("autoLogoutCancel", function() {
          that.endLogoutCountdown();
        });
        
        logoutDialog.$el.off("signout:true").on("signout:true", function() {
          $("#print-subscriber-login").html(settings.LBL_SIGN_IN);
        });
      }, 10000); // display prompt if no activity detected in time-delay-defined
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
  
  toggle_autoSignout: function() {
    var that = this;
    
    App.autosignout.trigger("autosignout:toggled");
    
    if (App.autoSignout.isEnabled) {
      this.logoutInterval = setInterval(function() {
        if (App.api.authenticationService.isUserAuthenticated) {
          if (!that.logoutTimeout) {
            setTimeout(function() { that.startLogoutCountdownPrompt(); });
          }
        } else {
          that.endLogoutCountdown();
        }
      }); //while authenticated - set interval to check if auto-logout countdown has already started, or should be started
    } else {
      this.endLogoutCountdown();
      window.clearInterval(this.logoutInterval);
      this.logoutInterval = null;
    }
  },
  
  // Handler for when a user changes the auto archive setting.
  autoSignout_changeHandler: function(e, isOn) {
    console.log("App.views.LibraryChrome.autoSignout_changeHandler()");
    e.stopPropagation();
    
    localStorage.autoSignout = App.autoSignout.isEnabled = isOn;
    
    this.toggle_autoSignout();
  },
  
  autoArchive_changeHandler: function(e, isOn) {
    console.log("App.views.LibraryChrome.autoArchive_changeHandler()");
    e.stopPropagation();
    
    App.api.settingsService.autoArchive.toggle(isOn);
  },
  
  redirect_store: function() {
    window.location.href = "http://ecom-dev01-app.usdlls2.savvis.net:10500/appstorefronts/tim/classroom/-TK-store-deploy/index.html?v=" + (+new Date);
  }
});

