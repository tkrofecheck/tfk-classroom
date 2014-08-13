
App.views.LibraryChrome = Backbone.View.extend({
  className: "library-chrome-view",
  template: Handlebars.templates["library-chrome.tmpl"],
  
  logoutTimeout: null,
  logoutInterval: null,
  
  events: {
    "click #print-subscriber-login"   : "display_loginDialog",
    
    "change #header-drop-down"        : "header_dropDownChangeHandler"
  },
  
  initialize: function() {
    console.log("App.views.LibraryChrome.initialize()");
    
    var that = this;
    
    this._debounce_render = _.throttle(_.bind(this.render, this, $.noop), 500);
    
    if (!localStorage.getItem("autoLogout")) {
      localStorage.setItem("autoLogout", "false");
    }
    
    App.autoLogout.isEnabled = (localStorage.getItem("autoLogout")=="true") ? true : false;
    
    $("body").on("subscriptionPurchased", function() {// Triggered from the dialog when a purchase is successful.
      that.$("#subscribe").css("display", "none");
      $("body").off("subscriptionPurchased");
    });
    
    App.library.listenTo(App.library, "menu-close", this._debounce_render);

    // User interaction detected, cancel countdown and remove from screen
    App.library.listenTo(App.autosignout, "cancel", function() {
      that.resetLogoutCountdown(true);
    });
    
    App.library.listenTo(App.autosignout, "logout", this.logout_and_archive);
    
    $("body").on("change", "#auto-signout", function(e, isOn) {
      that.autoSignout_changeHandler(e, isOn);
    });
    
    $("body").on("change", "#auto-archive", function(e, isOn) {
      that.autoArchive_changeHandler(e, isOn);
    });
  },
  
  render: function(cb) {
    console.log("App.views.LibraryChrome.render()");
    var that = this, loginLbl, model, cx;
    cb = cb || $.noop;
    
    this.resetLogoutCountdown(true);
    
    // Determine the login label for the drop down menu.
    loginLbl = App.api.authenticationService.isUserAuthenticated ? settings.LBL_SIGN_OUT : settings.LBL_SIGN_IN;
    
    model = {
      loginLbl: App.api.authenticationService.isUserAuthenticated,
      autoarchive_support: /*App.api.settingsService.autoArchive.isSupported*/ false,
      autoarchive_enabled: /*App.api.settingsService.autoArchive.isEnabled*/ false,
      autosignout_support: App.autoLogout.isSupported,
      autosignout_enabled: App.autoLogout.isEnabled
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
    
    if (App.userType == "student"){
      this.$("#header-drop-down").hide();
    }
    
    cb();
    
    return this;
  },

  // Handler for the drop down menu.
  header_dropDownChangeHandler: function(e) {   
    console.log("App.views.LibraryChrome.header_dropDownChangeHandler()");
    
    App.omni.event("lb_settings_taps");
    
    e.stopPropagation();
    
    var selectedLabel = $(e.target).dropDown("getSelectedLabel"),
        selectedId = $(e.target).dropDown("getSelectedId");
    if (selectedLabel == settings.LBL_RESTORE_ALL_PURCHASES) {  // Display the restore dialog.
      App.omni.event("lb_restore_taps");
      this.display_restorePurchasesDialog();
    } else if (selectedLabel == settings.LBL_REMOVE_ISSUES_FROM_IPAD) {
      App.omni.event("lb_remove_taps");
      this.display_archiveIssueView();
    } else if (selectedLabel == settings.LBL_RATE_THIS_APP) {
      App.omni.event("lb_rateus_taps");
      this.redirect($("#" + selectedId).data("src"));
    }
  },
  
  display_archiveIssueView: function(e) {
    console.log("App.views.LibraryChrome.display_archiveIssueView()");
    
    new App.views.archive.ArchiveView({model: App.libraryCollection});
    
    // Need to remove the grid so it is not scrollable in the background.
    App.$grid.hide();
    
    // get the current scroll position
    var scrollPosition = $(window).scrollTop();

    App.library.listenTo(App.archive, "view:closed", function() {
      // set the scroll position back to what it was.
      $(window).scrollTop(scrollPosition);
      
      // Display the grid again
      App.$grid.show();
    });
  },

  display_loginDialog: function(e) {
    console.log("App.views.LibraryChrome.display_loginDialog()");
    e.stopPropagation();
    
    var that = this;
    
    $("#print-subscriber-login .spinner").addClass("show-small-spinner");
    
    if (!App.api.authenticationService.isUserAuthenticated) {
      new App.views.dialogs.StudentLoginDialog();
      
      var scrollPosition = $(window).scrollTop();
      
      // Triggered from the dialog when a login is successful.
      loginDialog.$el.on("loginSuccess", function() {
        that.loginBtn.html(settings.LBL_SIGN_OUT);
        $(window).scrollTop(loginScrollPosition); // set the scroll position back to what it was.
        
        loginDialog.$el.off("loginSuccess");
        $("#print-subscriber-login .spinner").removeClass("show-small-spinner");
      });
    } else {
      this.logout_and_archive();
    }
  },
  
  setHeaderWidth: function() {      
    // Need to explicitly set the width otherwise it doesn't always update if width=100% in css.
    this.$("#header").width($(window).width());
  },
  
  autoArchive_changeHandler: function(e, isOn) {
    console.log("App.views.LibraryChrome.autoArchive_changeHandler()");
    e.stopPropagation();
    
    App.omni.event("lb_autoarchive_taps");
    
    App.api.settingsService.autoArchive.toggle(isOn);
  },
  
  // Handler for when a user changes the auto archive setting.
  autoSignout_changeHandler: function(e, isOn) {
    console.log("App.views.LibraryChrome.autoSignout_changeHandler()");
    e.stopPropagation();

    App.omni.event("lb_autosignout_taps");
    
    App.autoLogout.isEnabled = isOn;
    localStorage.setItem("autoLogout", isOn);
    
    this.resetLogoutCountdown(isOn);
  },
  
  check_isAutoSignoutEnabled: function() {
    var that = this,
        timer = 1000 * (settings.TIME_BEFORE_SIGNOUT_COUNTDOWN_SECONDS + .5);

    if (!App.autoLogout.isEnabled || !App.api.authenticationService.isUserAuthenticated) {
      this.resetLogoutCountdown(false);
    } else {
      console.log("logout timeout created, continue...");
      this.logoutTimeout = setTimeout(function() {
        that.startLogoutCountdown();
      }, timer); // display prompt if no activity detected in time-delay-defined
    }
  },
  
  startLogoutCountdown: function() {
    var that = this;

    if (!App.api.authenticationService.isUserAuthenticated) {
      console.log("User not authenticated. Do not show autosignout dialog.");
      this.resetLogoutCountdown(false);
      return;
    }
    
    if ($("#logout-countdown-dialog").length == 0) {
      console.log("display countdown dialog");
      new App.views.dialogs.LogoutCountdown();
    } else {
      this.resetLogoutCountdown(true);
    }
  },
  
  resetLogoutCountdown: function(do_check) {
    var that = this;
    
    console.log("clear logout timeout");
    clearTimeout(this.logoutTimeout);
    
    if (do_check) {
      setTimeout(function() {
        console.log("continue to check");
        that.check_isAutoSignoutEnabled();
      }, 1000);
    }
  },
  
  logout_and_archive: function() {
    var that = this;

    // Clear autosignout countdown timeout
    console.log("clear logout timeout");
    clearTimeout(this.logoutTimeout);
    
    console.log("continue to archive & logout");
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
    
    // filter list based on dropdown in chrome
    this.foliosToArchive = _.filter(list, function(folio) {      
      return (folio.isArchivable || folio.isViewable);
    });
    
    if (this.foliosToArchive.length > 0) {
      this.$el.unbind("click"); //disable closing dialog by tapping modal - must dismiss itself
      
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
      localStorage.removeItem("userType");
      localStorage.removeItem("lucieCacheEntitlements");
      localStorage.removeItem("lucieCacheAuthToken");
     
      console.log("Logged out!");
    }, 1000);
  },
  
  redirect: function(url) {
    window.location.href = url;
  }
});

