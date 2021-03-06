
App.views.Library = Backbone.View.extend({
  className: "library-view",
  template: Handlebars.templates["library.tmpl"],
  events: {

  },
  initialize: function() {
    console.log("App.views.Library.initialize()");
    var that = this;

    this.library_chrome_view = new App.views.LibraryChrome();
    this.library_banner_view = new App.views.LibraryBanner();
    this.library_issues_view = new App.views.LibraryIssues();
  },
  render: function(cb) {
    cb = cb || $.noop;
    var that = this,
        cx = {};
    
    // Do not render library (chrome, banner, issues) unless user is authenticated.
    if (!App.api.authenticationService.isUserAuthenticated) {
      return;
    }
    
    this.$el.html(this.template(cx));
    async.parallel([
      function(cb) {
        cb = _.partial(cb, null);
        that.library_chrome_view.render(cb).$el.appendTo(that.el);
      },
      function(cb) {
        cb = _.partial(cb, null);
        that.library_banner_view.render(cb).$el.appendTo(that.el);
      },
      function(cb) {
        cb = _.partial(cb, null);
        that.library_issues_view.render(cb).$el.appendTo(that.el);
      }
    ], cb);
    return this;
  },
  animate: function(cb) {
    var that = this,
        cb = cb || $.noop;
    async.parallel([
        function(cb) { that.library_chrome_view.animate(cb) },
        function(cb) { that.library_banner_view.animate(cb) },
        function(cb) { that.library_issues_view.animate(cb) }
    ], cb);
  }
});
