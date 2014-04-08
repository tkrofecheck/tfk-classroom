/**
 * Displays the restore dialog.
 */
App.views.dialogs.RestoreDialog = Backbone.View.extend({
	tagName:  "div",
	
	className: "modal-background-grey",
	
	template: Handlebars.templates["dialog-restore.tmpl"],
	
	events: {
		//"click"            : "clickHandler",
		"click #noThanks"  : "close",
		"click #restore"   : "restore_clickHandler"
	},
	
	initialize: function() {
		console.log("App.views.dialogs.RestoreDialog.initialize()");
		this.render().$el.appendTo("body");
    this.open();
	},
	
	render: function() {
		console.log("App.views.dialogs.RestoreDialog.render()");
		
		var that = this;
		
		this.$el.html(this.template());
		
		return this;
	},
	
	open: function(e) {
    this.$("#restore-dialog").addClass("pop");
  },
  
  clickHandler: function(e) {    
    e.stopPropagation();
    console.log("App.views.dialogs.RestoreDialog.clickHandler");
    
    //preview-dialog-content-container
    var clientX = e.clientX;
    var clientY = e.clientY;
    var $dialog = this.$("#restore-dialog");
    var offset = $dialog.offset();
    if (clientX < offset.left ||
        clientX > offset.left + $dialog.width() ||
        clientY < offset.top ||
        clientY > offset.top + $dialog.height()) {
      this.close();
    }
  },
	
	close: function() {
		console.log("App.views.dialogs.RestoreDialog.close");
		this.$el.remove();
	},
  
	// Handler for when a user chooses to restore purchases.
	restore_clickHandler: function(e) {
		console.log("App.views.dialogs.RestoreDialog.restore_clickHandler");
		
		var transaction = App.api.receiptService.restorePurchases();
		this.$el.trigger("restorePurchasesStarted", [transaction]);
		this.close();
	}
});
