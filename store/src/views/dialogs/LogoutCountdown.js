
App.views.dialogs.LogoutCountdown = Backbone.View.extend({
  tagName:  "div",
  
  className: "modal-background-grey",
  
  template: Handlebars.templates['dialog-logout-countdown.tmpl'],
  
  events: {
    "click"            : "clickHandler",
    "click #signout"   : "logOut",
    "click #cancel"    : "cancel"
  },
  initialize: function(opts) {
    console.log("App.views.dialogs.LogoutCountdown.initialize()");
    
    var that = this;
    
    this.render().$el.appendTo("body");
    this.open();
    
    $(window).on("touchmove scroll orientationchange resize", function() {      
      if ($("#counter").length > 0 ) {
        console.log("cancel and remove logout countdown");
        that.cancel();
      }
    });
  },
  render: function() {
    console.log("App.views.dialogs.LogoutCountdown.render()");
    
    var that = this,
        cx = { settings: settings };
    
    this.$el.html(this.template(cx));
    
    this.beginCountdown();
    
    return this;
  },
  clickHandler: function(e) {
    e.stopPropagation();
    //preview-dialog-content-container
    var clientX = e.clientX;
    var clientY = e.clientY;
    var $logout = this.$("#logout-countdown-dialog");
    var offset = $logout.offset();
    if (clientX < offset.left ||
        clientX > offset.left + $logout.width() ||
        clientY < offset.top ||
        clientY > offset.top + $logout.height()) {
        this.cancel();
    }
  },
  beginCountdown: function() {
    var that = this,
        shortly = new Date();
        
    shortly.setSeconds(shortly.getSeconds() + 90.5);
    this.$('#counter').countdown('option', {until: shortly});
    
    this.$('#counter').countdown({
      until: shortly,
      onExpiry: function() { that.logOut(); },
      onTick: watchCountdown
    });
    
    function watchCountdown(periods) {
      $("#monitor").text(periods[5] + " min. " + periods[6] + " sec. ");
    }
  },
  logOut: function() {
    console.log("Logged out!");
    App.api.authenticationService.logout();
    this.remove();
  },
  open: function() {
    console.log("App.views.dialogs.LogoutCountdown.open()");
    this.$("#logout-countdown-dialog").addClass("pop");

    //this.omni_pv = App.omni.pageview("subscribe", "event1");
  },  
  cancel: function() {
    //App.omni.event("error_cancel");
    this.$el.trigger("autoLogoutCancel");
    $('#counter').countdown('destroy');
    this.remove();
  }
});
