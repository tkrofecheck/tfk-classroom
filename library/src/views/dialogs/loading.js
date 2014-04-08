
App.views.dialogs.Loading = Backbone.View.extend({
  className: "modal-background",
  template: Handlebars.templates['loading.tmpl'],
  events: {
  },
  initialize: function(show_on_create) {
    console.log("App.dialogs.Loading.initialize()");
    if (show_on_create !== false) {
      this.render().$el.appendTo("body");
      this.open();
    }
  },
  render: function() {
    console.log("App.dialogs.Loading.render()");
    this.$el.html(this.template({
      settings: settings
    }));
    return this;
  },
  open: function() {
    console.log("App.dialogs.Loading.open()");
    this.$(".loading-overlay").addClass("pop");
  }
});

App.loading = function(is_loading) {
  if (App.loading._val == is_loading) return;
  App.loading._val = is_loading;
  
  if (!is_loading) {
    if (App.loading._view) App.loading._view.remove();
  }
  else App.loading._view = new App.views.dialogs.Loading();
}
