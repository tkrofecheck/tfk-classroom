
App.views.Main = Backbone.View.extend({
  el: "body",
  template: Handlebars.templates["main.tmpl"],
  events: {
    "tap .launch-repl": "launch_repl",
    "tap .reload-page": "reload_page"
  },
  initialize: function() {
    console.log("App.views.Main.initialize()");
    var that = this;

    App.api.authenticationService.updatedSignal.add(function() {
      App.api.libraryService.updateLibrary();
    });

    this.store_view = new App.views.Store;

    this.$el.hammer();
    if (typeof localStorage.app_view_count == "undefined") {
      localStorage.app_view_count = 0;
    }
    
    this.subview = this.store_view;
    localStorage.app_view_count = +localStorage.app_view_count + 1;
  },
  render: function(cb) {
    var that = this;
    this.$el.html(this.template({DEBUG:DEBUG}));

    this.subview.render(function() {
      that.subview.$el.appendTo(that.el);
    });
  },
  launch_repl: function() {
    App.debug.launch_repl();
  },
  reload_page: function() {
    App.debug.reload();
  }
});

