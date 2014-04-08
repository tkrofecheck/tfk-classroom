/**
 * Displays the login dialog that includes two links, "Forgot Password" and "Sign in".
 */
App.views.dialogs.LoginDialog = Backbone.View.extend({
	tagName:  "div",
	
	className: "modal-background-grey",
	
	template: Handlebars.templates["dialog-login.tmpl"],
	
	events: {
		"click"                   : "clickHandler",
		"click #close"            : "cancel_clickHandler",
		"click #submit"           : "submit_clickHandler",
		"click #forgot-password"  : "forgotPassword_clickHandler",
		"click #create-account"   : "createAccount_clickHandler"
	},
	
	initialize: function() {
		console.log("App.views.dialogs.LoginDialog.initialize()");
		this.render().$el.appendTo("body");
    this.open();
	},
	
	render: function() {
		console.log("App.views.dialogs.LoginDialog.render()");
		var that = this,
		    cx = {};
		
		cx = {
		  settings: settings
		};
		
		this.$el.html(this.template(cx));

		return this;
	},
	
	open: function() {
	  this.$("#login").addClass("pop");
	},
	
	clickHandler: function(e) {
		e.stopPropagation();
		//preview-dialog-content-container
		var clientX = e.clientX;
		var clientY = e.clientY;
		var $login = this.$("#login");
		var offset = $login.offset();
		if (clientX < offset.left ||
		    clientX > offset.left + $login.width() ||
		    clientY < offset.top ||
		    clientY > offset.top + $login.height()) {
			  this.close();
		}
	},
	
	submit_clickHandler: function(e) {
		e.stopPropagation();
		
		var that = this,
		    $username = this.$("#username"),
		    $password = this.$("#password"),
		    $error = this.$("#login .error");
		
		$error.html("");
		
		var scrollPosition = $(window).scrollTop();
		
		// Make sure username and password are not blank.
		if ($username.val() == "" || $password.val() == "") {
			if ($username.val() == "")
				$error.html("Please enter your username.");
			else if ($password.val() == "")
				$error.html("Please enter a valid password.");
		} else {
			// Login using the authenticationService.
			var transaction = App.api.authenticationService.login($username.val(), $password.val());
			transaction.completedSignal.addOnce(function(transaction) {
			  $(window).scrollTop(scrollPosition); // set the scroll position back to what it was.
			  
				var transactionStates = App.api.transactionManager.transactionStates;
				if (transaction.state == transactionStates.FAILED) {
					$error.html("Authentication Failed.");
				} else if (transaction.state == transactionStates.FINISHED){
					console.log("Authentication Successful!");
					// If a user is signing into direct entitlement it is recommended
					// to cancel any transactions on the folio using the code below
					// so the entire folio is downloaded when a user views it. This
					// will be the case if a preview download is occurring while
					// signing into direct entitlement.
					for (var uuid in App.api.libraryService.folioMap.internal) {
						var folio = App.api.libraryService.folioMap.internal[uuid];
						if (folio.isPurchasable) {
							var transaction = folio.currentStateChangingTransaction();
							if (transaction != null && transaction.isCancelable) {
								transaction.cancel();
							}
						}
					}
					
					that.$el.trigger("loginSuccess");
					that.close();
				}
			}, this);
		}
	},
	
	forgotPassword_clickHandler: function(e) {
	  e.stopPropagation();
	  App.api.dialogService.open(settings.FORGOT_PASSWORD_URL);
	},
	
	createAccount_clickHandler: function(e) {
    e.stopPropagation();
    App.api.dialogService.open(settings.CREATE_ACCOUNT_URL);
  },
	
	cancel_clickHandler: function(e) {
	  e.stopPropagation();
	  this.close();
	},
	
	close: function() {
		this.$el.remove();
	},
	
	// Handler for when a user chooses to restore purchases.
	restore_clickHandler: function(e) {
		e.stopPropagation();
		App.api.receiptService.restorePurchases();
		this.close();
	}
});
