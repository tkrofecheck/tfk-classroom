
App.views.Welcome = Backbone.View.extend({
  className: "modal-background-black",
  template: Handlebars.templates['welcome.tmpl'],
  events: {
    "click .sign-in-btn": "getLoginType",
    "click .learnmore": "open_slideshow",
    "click .samples": "goto_samples_tab"
  },
  initialize: function() {
    console.log("App.views.Welcome.initialize()");
    var that = this;
    
    this.render(function() {
      that.$el.appendTo("body"); 
      that.open();
    });
  },
  render: function(cb) {
    console.log("App.views.Welcome.render()");
    
    cb = cb || $.noop;
    var that = this, cx;
    
    if (App.api.authenticationService.isUserAuthenticated) { // Do not show welcome if user is logged in
      return;
    }
    
    cx = { settings : settings };
    
    this.$el.html(this.template(cx));    
    
    cb();
    return this;
  },
  open: function() {
    this.$(".dialog").addClass("pop");
  },
  close: function(e) {
    console.log("App.views.Welcome.close()");
    this.$el.remove();
  },
  getLoginType: function(e) {
    console.log("App.views.Welcome.getLoginType()");
    var element = $(e.currentTarget);
    
    if (element.hasClass("teacher")) {
      this.display_loginDialog(e, true);
      console.log("teacher");
    } else {
      this.display_loginDialog(e, false);
      console.log("student");
    }
  },
  display_loginDialog: function(e, userType) {
    console.log("App.views.Welcome.display_loginDialog()");
    e.stopPropagation();

    if (userType) {
      App.omni.event("lb_teacher_login_taps");
    } else {
      App.omni.event("lb_student_login_taps");
    }
    
    if (!App.api.authenticationService.isUserAuthenticated) {
      var that = this,
          loginDialog;
      
      loginDialog = (userType) ? new App.views.dialogs.TeacherLoginDialog() : new App.views.dialogs.StudentLoginDialog();
      
      var loginScrollPosition = $(window).scrollTop();
      
      // Triggered from the dialog when a login is successful.
      loginDialog.$el.on("loginSuccess", function() {
        that.loginBtn.html(settings.LBL_SIGN_OUT);
        $(window).scrollTop(loginScrollPosition); // set the scroll position back to what it was.
        that.close();
      });
    } else {
      console.log("Attempt logout");
      App.api.authenticationService.logout();
      
      this.loginBtn.html(settings.LBL_SIGN_IN);
    }
  },
  open_slideshow: function(e) {
    console.log("Starting slideshow");
    
    e.preventDefault();
    e.stopPropagation();
    
    App.omni.event("lb_learnmore_taps");
    
    var that = this,
        slideshowScrollPosition = $(window).scrollTop(),
        slideshowDialog = new App.views.dialogs.SlideshowDialog();
    
    slideshowDialog.$el.on("closeSlideshow", function() {
      $(window).scrollTop(slideshowScrollPosition); // set the scroll position back to what it was.
    });
  },
  
  goto_samples_tab: function(e) {
    console.log("Leaving Library... Switching to tab: Samples");
    
    e.preventDefault();
    App.omni.event("lb_samples_taps");
    
    App.api.configurationService.gotoState("Samples");
  }
});
