
App.views.LibraryChrome = Backbone.View.extend({
  className: "library-chrome-view",
  template: Handlebars.templates["library-chrome.tmpl"],
  
  subscribeDialog: null,
  stopDropDown: false,
  
  events: {
    "click #print-subscriber-login"   : "display_loginDialog",
    "click #subscribe"                : "display_subscribeDialog",
    
    "change #header-drop-down"        : "header_dropDownChangeHandler",
    "change #header-drop-down-filter" : "header_dropDownChangeHandler",
    "change #auto-archive"            : "autoArchive_changeHandler"
  },
  
  initialize: function() {
    console.log("App.views.LibraryChrome.initialize()");
    
    $("body").on("subscriptionPurchased", function() {// Triggered from the dialog when a purchase is successful.
      that.$("#subscribe").css("display", "none");
      $("body").off("subscriptionPurchased");
    });
  },
  
  render: function(cb) {
    console.log("App.views.LibraryChrome.render()");
    var that = this, loginLbl, model, cx;
    cb = cb || $.noop;
    
    // Determine the login label for the drop down menu.
    loginLbl = App.api.authenticationService.isUserAuthenticated ? settings.LBL_SIGN_OUT: settings.LBL_SIGN_IN;
    
    model = {
      loginLbl: loginLbl,
      autoarchive_support: App.api.settingsService.autoArchive.isSupported,
      autoarchive_enabled: App.api.settingsService.autoArchive.isEnabled
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
    
    cb();
    return this;
  },
  
  // Handler for the drop down menu.
  header_dropDownChangeHandler: function(e) {   
    console.log("App.views.LibraryChrome.header_dropDownChangeHandler()");
    
    var selectedLabel = $(e.target).dropDown("getSelectedLabel");
    if (selectedLabel == settings.LBL_RESTORE_ALL_PURCHASES) {  // Display the restore dialog.
      this.display_restorePurchasesDialog();
    } else if (selectedLabel == settings.LBL_REMOVE_ISSUES_FROM_IPAD) {
      this.display_archiveIssueView();
    } else { // filter folios by grade
      var grade = $(e.target).dropDown("getSelectedIndex");
      $(e.target).addClass("dropdown-check");
      console.log(selectedLabel + ", index:" + grade);
    }
  },

  display_restorePurchasesDialog: function(e) {
    console.log("App.views.LibraryChrome.display_restorePurchasesDialog()");
    
    var that = this;
    
    var restoreDialog = new App.views.dialogs.RestoreDialog();
    
    restoreDialog.$el.on("restorePurchasesStarted", function(e, transaction) {
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
        App.$headerTitle.html("Library");
      }, this);
    });
  },
  
  display_archiveIssueView: function(e) {
    console.log("App.views.LibraryChrome.display_archiveIssueView()");
    
    var archiveView = new App.views.archive.ArchiveView({model: App.libraryCollection});
    
    // Need to remove the grid so it is not scrollable in the background.
    var previewScrollPosition = $(window).scrollTop(); // get the current scroll position
    App.$grid.hide();
    
    archiveView.$el.on("archiveViewClosed", function() {
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
      loginDialog.$el.on("loginSuccess", function() {
        that.loginBtn.html(settings.LBL_SIGN_OUT);
        $(window).scrollTop(loginScrollPosition); // set the scroll position back to what it was.
      });
    } else {
      App.api.authenticationService.logout();
      
      this.loginBtn.html(settings.LBL_SIGN_IN);
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
      });
    }
  },
  
  setHeaderWidth: function() {      
    // Need to explicitly set the width otherwise it doesn't always update if width=100% in css.
    this.$("#header").width($(window).width());
  },

  // Handler for when a user changes the auto archive setting.
  autoArchive_changeHandler: function(e, isOn) {
    console.log("App.views.LibraryChrome.autoArchive_changeHandler()");
    e.stopPropagation();
    
    App.api.settingsService.autoArchive.toggle(isOn);
  }
});

