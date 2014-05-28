/**
 * Displays the preview dialog that displays the folio cover, title, download button and preview button.
 */
App.views.dialogs.PreviewDialog = Backbone.View.extend({
	tagName:  "div",
	
	className: "modal-background-grey",
	
	template: Handlebars.templates["dialog-preview.tmpl"],
	
	events: {
		"click"                 : "clickHandler",
		"tap #preview-button"   : "onPreviewButton",
		"tap #download-button"  : "onDownloadButton",
		"tap #subscribe-button" : "onSubscribeButton"
	},
	
	// The container that holds the header and image.
	$contentContainer: null,
	
	// The id of the originating folio thumb. 
	folioThumbElementId: null,
	
	PORTRAIT_WIDTH: 488,
	PORTRAIT_HEADER_HEIGHT: 128,
	PORTRAIT_IMAGE_HEIGHT: 650,
	
	LANDSCAPE_WIDTH: 570,
	LANDSCAPE_HEADER_HEIGHT: 128,
	LANDSCAPE_IMAGE_HEIGHT: 427,
	
	initialize: function() {
		console.log("App.views.dialogs.PreviewDialog()");
		
		// Don't allow the user to scroll the background grid while this dialog is open.
		document.ontouchmove = function(e){
		  e.preventDefault();
		}
		
		var that = this;
		$(window).on("resize", function() {
			that.updateView();
		});
		
		// Triggered from the dialog when a purchase is successful.
		$("body").on("subscriptionPurchased", function() {
			scope.close();
		});
	},
	
	render: function() {
		var that = this,
    		cx = {
    		  settings: settings,
    		  model: this.model,
    		  price: (this.model.state == App.api.libraryService.folioStates.PURCHASABLE) ? this.model.price : 'Download'
    		};
		
		this.$el.html(this.template(cx));
    
		this.$contentContainer = this.$("#preview-dialog-content-container");

		if (this.model.isPurchasable && !this.model.hasSections) {
		  // Only check to see if preview is supported if this folio is purchasable and doesn't have sections.
			var transaction = this.model.verifyContentPreviewSupported(); // Check to see if this folio supports previews.
			transaction.completedSignal.addOnce(this.verifyContentPreviewSupportedHandler, this);
		}
		
		return this;
	},
	
	clickHandler: function(e) {
			//preview-dialog-content-container
			var clientX = e.clientX;
			var clientY = e.clientY;
			var offset = this.$contentContainer.offset();
			if (clientX < offset.left ||
			  clientX > offset.left + this.$contentContainer.width() ||
			  clientY < offset.top ||
			  clientY > offset.top + this.$contentContainer.height()) {
				this.close();
			}
	},
	
	verifyContentPreviewSupportedHandler: function(transaction) {
		if (transaction.state == App.api.transactionManager.transactionStates.FINISHED) {
			if (this.model.canDownloadContentPreview() || // Preview has not been downloaded yet.
				this.model.supportsContentPreview) { 	  // canDownloadContentPreview()==false but supportsContentPreview==true so preview has already been downloaded.
				this.showPreviewButton();
			}
		}
	},
	
	onDownloadButton: function(e) {
	  console.log("App.views.dialogs.PreviewDialog() download");
	  
	  e.preventDefault();
	  
	  var that = this;
    if (App._using_adobe_api) {
      if (this.model.state == App.api.libraryService.folioStates.PURCHASABLE) {
        var transaction = this.model.purchase();
        transaction.completedSignal.addOnce(function(transaction) {
          if (transaction.state == App.api.transactionManager.transactionStates.FINISHED) {
            that.model.download();
            that.close();
          }
        }, this);
      } else {
        that.model.download();
        that.close();
      }
    }
	},
	
	onPreviewButton: function(e) {
	  console.log("App.views.dialogs.PreviewDialog() preview");
	  
	  e.preventDefault();
	  
    try {
      if (this.model.canDownloadContentPreview()) {  // Preview can be downloaded.
        // Start the download.
        this.model.downloadContentPreview();
        this.close();
      } else {                    // Preview is already downloaded so view the folio.
        // Check to see if the downloaded content preview is now entitled.
        // First check if it is downloadable (only true if entitled)
        // and the folio is not updatable
        // and we do not have a download going.
        // If so, start a download because we expect one to
        // be acting on the folio if we are not done
        if (this.model.isDownloadable &&
          !this.model.isUpdatable &&
          this.model.currentStateChangingTransaction() == null) {
          // Start a new download transaction to get the rest of the folio
          this.model.download();
        }
        
        that.model.view();
      }
    } catch(e) {
      alert(e);
    }
	},
	
	onSubscribeButton: function(e) {
	  console.log("App.views.dialogs.PreviewDialog() subscribe");
    
    e.preventDefault();
    
    this.$el.trigger("subscribeButtonClicked");
	},
	
	showPreviewButton: function() {
		var $previewButton = $("<div class='grey-button button' id='preview-button'>Preview</div>");
		$previewButton.appendTo(this.$("#preview-dialog-header-button-container"));
	},
	
	setImageProperties: function($target, folioThumbElementId) {
		var that = this,
		    offset = $target.offset(),  // Position the image at the originating folio thumb cover.
		    scale;
		
		this.folioThumbElementId = folioThumbElementId;
		
		this.$("#preview-dialog-folio-cover").attr("src", $target.attr("src"));

		if (window.innerWidth > window.innerHeight) { // landscape
			scale = $target.parent().width() / this.LANDSCAPE_WIDTH; // In landscape the image is centered in a container
			this.$contentContainer.css({"-webkit-transform" : "translate(" + (offset.left - 66) + "px, " + (offset.top - $(window).scrollTop() - this.LANDSCAPE_HEADER_HEIGHT * scale - 3) + "px) scale(" + scale + ", " + scale + ")"});
		} else { // portrait
			scale = $target.width() / this.PORTRAIT_WIDTH;
			this.$contentContainer.css({"-webkit-transform" : "translate(" + (offset.left - 2) + "px, " + (offset.top - $(window).scrollTop() - this.PORTRAIT_HEADER_HEIGHT * scale - 3) + "px) scale(" + scale + ", " + scale + ")"});
		}

		this.$contentContainer.css({"-webkit-transform-origin" : "0 0"});
		
		// Flip the header so it is visible.
		this.$("#preview-dialog-header-border").css({"-webkit-transform" : "rotateX(0deg)"});
		
		
		this.$contentContainer.on("webkitTransitionEnd", function() {
			that.folioCoverOpen_transitionEndHandler();
		});
		
		// Wait one frame to animate otherwise the image will not animate from the correct spot.
		setTimeout(function() {
			that.$contentContainer.css({"-webkit-transition" : "all .4s"});
			that.updateView();
		}, 1)
	},
	
	updateView: function() {
		console.log("Updating View");
		
		var targetX, targetY;
		if (window.innerWidth > window.innerHeight) { // landscape
			targetX = Math.round((window.innerWidth - this.LANDSCAPE_WIDTH) / 2);
			targetY = Math.round((window.innerHeight - (this.LANDSCAPE_HEADER_HEIGHT + this.LANDSCAPE_IMAGE_HEIGHT)) / 2);
		} else { // portrait
			targetX = Math.round((window.innerWidth - this.PORTRAIT_WIDTH) / 2);
			targetY = Math.round((window.innerHeight - (this.PORTRAIT_HEADER_HEIGHT + this.PORTRAIT_IMAGE_HEIGHT)) / 2);
		}
		
		// Need to use translate and scale rather than x,y,width,height otherwise the animation is choppy.
		this.$contentContainer.css({"-webkit-transform" : "translate(" + targetX + "px, " + targetY + "px) scale(1, 1)"});
	},
	
	// Handler for when the image finishes expanding.
	folioCoverOpen_transitionEndHandler: function() {
		this.$contentContainer.off("webkitTransitionEnd");
		// Remove the transitions so the user does not see any animations if the device is rotated.
		this.$contentContainer.css({"-webkit-transition" : "none"});
		this.$("#preview-dialog-header-border").css({"-webkit-transition" : "none"});
	},

	close: function() {
		this.$el.trigger("previewDialogClosed");
		
		this.$("#preview-dialog-header-border").css({"-webkit-transition" : ".4s"});
		this.$("#preview-dialog-header-border").css({"-webkit-transform" : "rotateX(180deg)"});
		
		// Get a reference to the element that triggered the opening of this dialog.
		// Since the user might have rotated the device while this dialog is open this
		// ensures the dialog can close to the original element.
		var $target = $("#" + this.folioThumbElementId);
		
		var offset = $target.offset();
		this.$contentContainer.css({"-webkit-transition" : "all .4s"});
		
		var scale;
		if (window.innerWidth > window.innerHeight) { // landscape
			scale = $target.parent().width() / this.LANDSCAPE_WIDTH;
			this.$contentContainer.css({"-webkit-transform" : "translate(" + (offset.left - 66) + "px, " + (offset.top - $(window).scrollTop() - this.LANDSCAPE_HEADER_HEIGHT * scale - 3) + "px) scale(" + scale + ", " + scale + ")"});
			//this.$el.find("#preview-dialog-folio-cover-container").css("border", "none");
		} else {
			scale = $target.width() / this.PORTRAIT_WIDTH;
			this.$contentContainer.css({"-webkit-transform" : "translate(" + (offset.left - 2) + "px, " + (offset.top - $(window).scrollTop() - this.PORTRAIT_HEADER_HEIGHT * scale - 3) + "px) scale(" + scale + ", " + scale + ")"});
		}
		
		var scope = this;
		this.$contentContainer.on("webkitTransitionEnd", function() {
			scope.$el.remove();
			scope.remove();
		});
		
		document.ontouchmove = null;
	}
});
