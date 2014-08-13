
App.views.Main = Backbone.View.extend({
  el: "body",
  template: Handlebars.templates["main.tmpl"],
  events: {
    "tap .launch-repl": "launch_repl",
    "tap .reload-page": "reload_page"
  },
  initialize: function() {
    console.log("App.views.Main.initialize()");
    var that = this,
        intervalId,
        render;

    render = _.bind(this.render, this, $.noop);
    render = _.partial(_.delay, render, 50);
    render = _.debounce(render, 200);

    App.api.authenticationService.userAuthenticationChangedSignal.add(render);

    if (typeof localStorage.getItem("app_view_count")=="undefined") {
      localStorage.setItem("app_view_count", 0);
    }
    
    localStorage.setItem("app_view_count", +localStorage.getItem("app_view_count")+1);
  },
  render: function(cb) {
    var that = this;
    
    this.$el.hammer();
    
    this.$el.html(this.template({DEBUG:DEBUG}));
        
    if (!App.api.authenticationService.isUserAuthenticated) {
      App.omni.pageview("welcome", "event1,event43,event44");
      App.userType = null;
      new App.views.Welcome;
    } else {
      App.omni.pageview("main", "event1,event43");
      this.library_view = new App.views.Library;

      App.api.libraryService.updateLibrary();
      
      this.library_view.render(function() {
        that.library_view.$el.appendTo(that.el);
      });
    }
  },
  
  launch_repl: function() {
    App.debug.launch_repl();
  },
  reload_page: function() {
    App.debug.reload();
  }
});

