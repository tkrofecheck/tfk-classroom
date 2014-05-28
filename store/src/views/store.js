
App.views.Store = Backbone.View.extend({
  className: "store-view",
  template: Handlebars.templates["store.tmpl"],
  events: {

  },
  initialize: function() {
    console.log("App.views.Store.initialize()");
    var that = this;
        
    this.store_chrome_view = new App.views.StoreChrome();
    this.store_container_view = new App.views.StoreContainer();
  },
  render: function(cb) {
    cb = cb || $.noop;
    var that = this,
        cx = {};
    this.$el.html(this.template(cx));
    if (settings.IS_STORE_SHOW_CHROME) {
      async.parallel([
        function(cb) {
          cb = _.partial(cb, null);
          that.store_chrome_view.render(cb).$el.appendTo(that.el);
        },
        function(cb) {
          cb = _.partial(cb, null);
          that.store_container_view.render(cb).$el.appendTo(that.el);
        }
      ], cb);
    } else {
      that.store_container_view.render(cb).$el.appendTo(that.el);
    }
    return this;
  },
  animate: function(cb) {
    var that = this,
        cb = cb || $.noop;
    if (settings.IS_STORE_SHOW_CHROME) {
      async.parallel([
          function(cb) { that.store_chrome_view.animate(cb); },
          function(cb) { that.store_container_view.animate(cb); }
      ], cb);
    } else {
      that.store_container_view.animate(cb);
    }
  }
});
