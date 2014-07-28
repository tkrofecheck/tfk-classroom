
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
    console.log("App.views.dialogs.LogoutCountdown.initialize()");
    
    var that = this;
    
    this.render().$el.appendTo("body");
    this.open();
    
    $(window).on("touchmove scroll", function() {      
      if ($("#counter").length > 0 ) {
        console.log("cancel and remove logout countdown");
        that.cancel();
      }
    });
    
    App.autosignout.off("autosignout:toggled").on("autosignout:toggled", function() {
      that.cancel();
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
        
    shortly.setSeconds(shortly.getSeconds() + (settings.SIGNOUT_COUNTDOWN_SECONDS + .5));
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
    this.removeAllIssues(); // continue to logout after archiving
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
      
      this.$el.unbind("click"); //disable closing dialog by tapping modal - must dismiss itself
      this.$("#title").html("Removing all downloaded issues.");
      this.$("#counter").remove();
      this.$("#monitor").html("Please wait...");
      this.$("#signout").remove();
      this.$("#cancel").remove();
      
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
      that.$el.trigger("signout:true");
      that.remove(); //remove dialog from screen
    }, 1000);
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
