
App.views.LibraryChrome = Backbone.View.extend({
  className: "library-chrome-view",
  template: Handlebars.templates["library-chrome.tmpl"],
  
  logoutTimeout: null,
  logoutInterval: null,
  subscribeDialog: null,
  
  events: {
    "click #print-subscriber-login"   : "display_loginDialog",
    "click #subscribe"                : "display_subscribeDialog",
    "click #go-to-store"              : "redirect_store",
    
    "change #header-drop-down"        : "header_dropDownChangeHandler"
  },
  
  initialize: function() {
    console.log("App.views.LibraryChrome.initialize()");
    
    var that = this;
    
    this._debounce_render = _.throttle(_.bind(this.render, this, $.noop), 500);
    
    App.autoSignout.isEnabled = (localStorage.getItem("autoSignout")=="true") ? true : false;
    
    $("body").on("subscriptionPurchased", function() {// Triggered from the dialog when a purchase is successful.
      that.$("#subscribe").css("display", "none");
      $("body").off("subscriptionPurchased");
    });
    
    App.library.listenTo(App.autosignout, "toggled", this._debounce_render);

    // User interaction detected, cancel countdown and remove from screen
    App.library.listenTo(App.autosignout, "cancel", this.endLogoutCountdown);
    
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
    
    this.check_isAutoSignoutEnabled();
    
    // Determine the login label for the drop down menu.
    loginLbl = App.api.authenticationService.isUserAuthenticated ? settings.LBL_SIGN_OUT : settings.LBL_SIGN_IN;
    
    model = {
      loginLbl: App.api.authenticationService.isUserAuthenticated,
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
    
    if (App.userType == "student"){
      this.$("#header-drop-down").hide();
    }
    
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
      this.endLogoutCountdown();
      this.logout_and_archive();
    }
  },

  display_subscribeDialog: function(e) {
    console.log("App.views.LibraryChrome.display_subscribeDialog()");
    e.stopPropagation();
    
    if (!this.subscribeDialog) {
      this.subscribeDialog = new App.views.dialogs.SubscribeDialog();

      var that = this;
      this.subscribeDialog.$el.on("subscribeDialogClosed", function() {
        that.subscribeDialog = null;
        
        that.subscribeDialog.$el.off("subscribeDialogClosed")
      });
    }
  },
  
  setHeaderWidth: function() {      
    // Need to explicitly set the width otherwise it doesn't always update if width=100% in css.
    this.$("#header").width($(window).width());
  },

  // Handler for when a user changes the auto archive setting.
  autoSignout_changeHandler: function(e, isOn) {
    console.log("App.views.LibraryChrome.autoSignout_changeHandler()");
    e.stopPropagation();

    App.autoSignout.isEnabled = isOn;
    localStorage.setItem("autoSignout", isOn);
  },
  
  check_isAutoSignoutEnabled: function() {
    var that = this;
    
    if (!App.autoSignout.isEnabled) {
      clearInterval(this.logoutInterval);
      return;
    }
    
    
    
    this.logoutInterval = setInterval(function() {
      if ($("#logout-countdown-dialog").length == 0) {
        console.log("countdown not displayed, continue...");
        if (App.api.authenticationService.isUserAuthenticated) {
          console.log("user logged in, continue...");
          if (that.logoutTimeout == null) {
            console.log("logout timeout is null, continue...");
            that.startLogoutCountdown();
          }
        } else {
          console.log("user not logged in, end.");
          clearInterval(that.logoutInterval);
          that.endLogoutCountdown();
        }
      } else {
        console.log("countdown displayed, do not continue...");
      }
    }, 1000);
  },
  
  startLogoutCountdown: function() {
    var that = this,
        timer = 1000 * (settings.TIME_BEFORE_SIGNOUT_COUNTDOWN_SECONDS + .5);
    
    this.logoutTimeout = setTimeout(function() {
      console.log("logout timeout created, continue...");
      new App.views.dialogs.LogoutCountdown();
      that.endLogoutCountdown();
    }, timer); // display prompt if no activity detected in time-delay-defined
  },
  
  endLogoutCountdown: function() {
    //remove logout counter
    clearTimeout(this.logoutTimeout);
    this.logoutTimeout = null;
    console.log("clear logout timeout");
  },
  
  autoArchive_changeHandler: function(e, isOn) {
    console.log("App.views.LibraryChrome.autoArchive_changeHandler()");
    e.stopPropagation();
    
    App.api.settingsService.autoArchive.toggle(isOn);
  },
  
  logout_and_archive: function() {
    var that = this;

    // Clear autosignout countdown interval and timeout
    clearInterval(this.logoutInterval);
      
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
     
      console.log("Logged out!");
    }, 1000);
  },
});

