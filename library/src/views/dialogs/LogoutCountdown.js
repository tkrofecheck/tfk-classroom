
App.views.dialogs.LogoutCountdown = Backbone.View.extend({
  tagName:  "div",
  
  className: "modal-background-grey",
  
  template: Handlebars.templates['dialog-logout-countdown.tmpl'],
  
  // An Array of folio product ids that the user has selected to archive.
  foliosToArchive: null,
  
  events: {
    "click"            : "clickHandler",
    "click #signout"   : "logOut",
    "click #cancel"    : "cancel"
  },
  initialize: function(opts) {
    console.log("App.views.dialogs.LogoutCountdown.initialize");
    
    var that = this;
    
    this.render().$el.appendTo("body");
    this.open();
  },
  render: function() {
    console.log("App.views.dialogs.LogoutCountdown.render");
    
    var that = this,
        cx = { settings: settings };
    
    this.$el.html(this.template(cx));
    
    this.beginCountdown();
    
    return this;
  },
  clickHandler: function(e) {
    e.stopPropagation();
    console.log("touch detected: remove logout countdown");
    
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
        
    shortly.setSeconds(shortly.getSeconds() + (settings.SIGNOUT_COUNTDOWN_SECONDS + .5));
    this.$('#counter').countdown('option', {until: shortly});
    
    this.$('#counter').countdown({
      until: shortly,
      onExpiry: function() { that.logOut(); },
      onTick: watchCountdown
    });
    
    function watchCountdown(periods) {
      if (+periods[5] > 0) {
        $("#monitor").text(periods[5] + " min. " + periods[6] + " sec. ");
      } else {
        $("#monitor").text(periods[6] + " sec. ");
      }
    }
  },
  open: function() {
    this.$("#logout-countdown-dialog").addClass("pop");
  },  
  cancel: function() {
    $('#counter').countdown('destroy');
    
    App.autosignout.trigger("cancel");
    this.$el.remove(); //remove dialog from screen
  },
  logOut: function() {
    App.autosignout.trigger("logout");
    this.$el.remove(); //remove dialog from screen
  }
});
