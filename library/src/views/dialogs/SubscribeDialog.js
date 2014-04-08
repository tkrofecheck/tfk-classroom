/**
 * Displays the subscribe dialog
 */
App.views.dialogs.SubscribeDialog = Backbone.View.extend({
	tagName:  "div",
	
	className: "modal-background-grey",
	
	template: Handlebars.templates["dialog-subscribe.tmpl"],
	
	events: {
		"click"                    : "clickHandler",
		"click #cancel"            : "cancel_clickHandler",
		"click .subscribe-button"  : "subscribe_clickHandler" // The handler for the individual subscription buttons.
	},

	initialize: function() {
		console.log("App.views.dialogs.SubscribeDialog.initialize()");
		this.render().$el.appendTo("body");
    this.open();
	},
	
	render: function() {
	  console.log("App.views.dialogs.SubscribeDialog.render()");
	  
		this.$el.html(this.template({
		  subscriptions: _(App.api.receiptService.availableSubscriptions).values()
		}));
		
		return this;
	},
	
	open: function(e) {
    this.$("#subscribe-dialog").addClass("pop");
  },
  
	clickHandler: function(e) {
		e.stopPropagation();
		//preview-dialog-content-container
		var clientX = e.clientX;
		var clientY = e.clientY;
		var $dialog = this.$el.find(".dialog");
		var offset = $dialog.offset();
		if (clientX < offset.left ||
		    clientX > offset.left + $dialog.width() ||
		    clientY < offset.top ||
		    clientY > offset.top + $dialog.height()) {
			this.close();
		}
	},

	close: function(e) {
		console.log("App.views.dialogs.SubscribeDialog.close");
		this.$el.trigger("subscribeDialogClosed");
		this.$el.remove();
	},
	
	cancel_clickHandler: function(e) {
	  e.stopPropagation();
	  this.close();
	},
	
	// Handles clicks from any of the subscription buttons.
	subscribe_clickHandler: function(e) {
		e.stopPropagation();
		var windowWidth = $(window).width(),
        spinnerLeft = "410px";
  
    if (windowWidth <= 768) {
      spinnerLeft = "260px";
    }
      
    App.$headerTitle.html("Purchasing Subscription...");
		window.spinner = new Spinner(App.spinnerOpts).spin();
    $(window.spinner.el).insertBefore("#header #title span").css({'top':'23px','left':spinnerLeft});
		
		if (App._using_adobe_api) {
			// The product id is set to the id of the element so get a reference to it.
			var productId = $(e.currentTarget).attr("id");
			
			var transaction = App.api.receiptService.availableSubscriptions[productId].purchase();
			transaction.completedSignal.addOnce(function(transaction) {
				if (transaction.state == App.api.transactionManager.transactionStates.FINISHED) {
					$("body").trigger("subscriptionPurchased"); // Need to trigger from the body since this.$el is no longer in the dom.
				}
				window.spinner.stop();
        $("#header #title .spinner").remove();
        App.$headerTitle.html("Library");
			});
		}
		this.close();
	}
});
