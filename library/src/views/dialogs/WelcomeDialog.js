
App.views.Welcome = Backbone.View.extend({
  className: "modal-background",
  template: Handlebars.templates['dialog-welcome.tmpl'],
  events: {
    "click a": function(evt) { evt.preventDefault(); },
    "click .sign-in-btn": "getLoginType",
    "click .learnmore": "goto_learnmore_tab"
  },
  initialize: function() {
    console.log("App.views.Welcome.initialize()");
    var that = this;
    
    this.$el.addClass("black");
    
    this.render(function() {
      that.$el.appendTo("body"); 
      that.open();
    });
  },
  render: function(cb) {
    console.log("App.views.Welcome.render()");
    
    cb = cb || $.noop;
    var that = this;
    
    this.$el.html(
      this.template(
        { settings : settings }
      )
    );    
    
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
  goto_learnmore_tab: function(e) {
    console.log("Leaving Library... Switching to tab: Learn More");
    
    App.api.configurationService.gotoState("Help");
  }
});
