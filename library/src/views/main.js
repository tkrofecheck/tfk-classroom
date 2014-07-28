
App.views.Main = Backbone.View.extend({
  el: "body",
  template: Handlebars.templates["main.tmpl"],
  events: {
    "tap .launch-repl": "launch_repl",
    "tap .reload-page": "reload_page"
  },
  initialize: function() {
    console.log("App.views.Main.initialize()");
    var that = this, render;
    
    App.api.authenticationService.updatedSignal.add(function() {
      App.api.libraryService.updateLibrary();
    });

    if (typeof localStorage.app_view_count == "undefined") {
      localStorage.app_view_count = 0;
    }
      
    render = _.bind(this.render, this, $.noop);
    render = _.partial(_.delay, render, 50);
    render = _.debounce(render, 200);
      
    App.api.authenticationService.userAuthenticationChangedSignal.add(render);
    
    localStorage.app_view_count = +localStorage.app_view_count + 1;
  },
  render: function(cb) {
    var that = this;
    
    this.library_view = new App.views.Library;
    
    this.$el.hammer();
    
    this.$el.html(this.template({DEBUG:DEBUG}));
    
    if (localStorage.getItem("assessmentPIN")) {
      App.userType = "student";
    } else if (localStorage.getItem("assessmentEmail")){
      App.userType = "teacher";
    }
    
    this.showWelcome();
    
    this.library_view.render(function() {
      that.library_view.$el.appendTo(that.el);
    });
  },
  showWelcome: function() {
    var that = this;
    if (App.api.authenticationService.isUserAuthenticated) {
      return;
    } else {
      localStorage.removeItem("assessmentPIN");
      localStorage.removeItem("assessmentEmail");
      App.userType = null;
      new App.views.Welcome;
    }
  },
  launch_repl: function() {
    App.debug.launch_repl();
  },
  reload_page: function() {
    App.debug.reload();
  }
});

