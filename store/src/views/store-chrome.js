
App.views.StoreChrome = Backbone.View.extend({
  className: "store-chrome-view",
  template: Handlebars.templates["store-chrome.tmpl"],
  
  logoutTimeout: null,
  logoutInterval: null,
  subscribeDialog: null,
  stopDropDown: false,
  
  events: {
    "click #print-subscriber-login"   : "display_loginDialog",
    "click #go-to-library"            : "redirect_library"
  },
  
  initialize: function() {
    console.log("App.views.LibraryChrome.initialize()");
    var that = this,
        render;
    
    $(window).on("click touchmove orientationchange resize scroll", function() {      
      that.endLogoutCountdown();
    });
    
    this.logoutInterval = setInterval(function() {
      if (App.api.authenticationService.isUserAuthenticated) {
        if (!that.logoutTimeout) {
          setTimeout(function() { that.startLogoutCountdownPrompt(); });
        }
      }
    }); //while authenticated - set interval to check if auto-logout countdown has already started, or should be started
    
    render = _.bind(this.render, this, $.noop);
    render = _.partial(_.delay, render, 50);
    render = _.debounce(render, 200);
    
    //Update views when subscription receipt is available or when user signs into LUCIE
    App.api.authenticationService.userAuthenticationChangedSignal.add(render);
  },
  
  render: function(cb) {
    console.log("App.views.LibraryChrome.render()");
    var that = this, loginLbl, model, cx;
    cb = cb || $.noop;
    
    // Determine the login label for the drop down menu.
    loginLbl = App.api.authenticationService.isUserAuthenticated ? settings.LBL_SIGN_OUT: settings.LBL_SIGN_IN;
    
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
    console.log("App.views.LibraryChrome.display_loginDialog()");
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
    var that = this;
    
    if (this.logoutTimeout || this.$("#logout-countdown-dialog").length > 0) {
      return;
    } else {
      this.logoutTimeout = window.setTimeout(function() {
        var logoutDialog = new App.views.dialogs.LogoutCountdown();
        
        logoutDialog.$el.on("autoLogoutCancel", function() {
          that.endLogoutCountdown();
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
  
  setHeaderWidth: function() {      
    // Need to explicitly set the width otherwise it doesn't always update if width=100% in css.
    this.$("#header").width($(window).width());
  },
  
  redirect_library: function() {
    window.location.href = "http://ecom-dev01-app.usdlls2.savvis.net:10500/appstorefronts/tim/classroom/-TK-library-deploy/index.html?v=" + (+new Date);
  }
});

