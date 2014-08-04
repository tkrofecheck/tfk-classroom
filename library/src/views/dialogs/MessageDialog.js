/**
 * Displays the message dialog (replacement for alert boxes)
 */
App.views.dialogs.Message = Backbone.View.extend({
  className: "modal-background-grey",
  
  template: Handlebars.templates['dialog-message.tmpl'],
  
  events: {
    "click #okay": "onOK"
  },
  
  initialize: function(opts) {
    console.log("App.views.dialogs.Message.initialize()");
    this.title = opts.title;
    this.message = opts.message;

    if (opts.show_on_create !== false) {
      this.render().$el.appendTo("body");
      this.open();
    }
  },
  
  render: function() {
    console.log("App.views.dialogs.Message.render()");
    
    var cx = {
      title: this.title,
      message: this.message
    };
    
    this.$el.html(this.template(cx));
    
    return this;
  },
  
  open: function() {
    console.log("App.views.dialogs.Message.open()");
    this.$("#message-dialog").addClass("pop");
  },
  
  onOK: function() {
    this.remove();
  },
  
  remove: function() {
    Backbone.View.prototype.remove.apply(this, arguments);
  }
});
