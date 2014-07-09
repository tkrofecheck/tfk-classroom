/**
 * Displays a folio in the grid.
 */
App.views.section.SectionFolioItemView = Backbone.View.extend({
	tagName:  "div",
	
	className: "folio-item-view",
	
	template: Handlebars.templates["section-folioitem.tmpl"],
	
	events: {
	  "click #section-download-button"  : "downloadButton_clickHandler",
	  "click #update-dialog #no"        : "no_updateDialogHandler",
	  "click #update-dialog #yes"       : "yes_updateFolio"
	},
	
	// The dialog asking whether or not to update the folio if an update is available.
	updateDialog: null,
	
	isTrackingTransaction: false,
	
	// A reference to the current downloadTransaction. Used to pause and resume a download.
	currentDownloadTransaction: null,
	
	// A reference to the original folio since the collection uses a cloned copy.
	folio: null,
	
	isBuyButtonEnabled: true,
	
	// Flag to track whether or not the download button initiated a download.
	// If it was clicked and the folio is viewable && Config.IS_AUTO_OPEN_DOWNLOADED_FOLIO then automatically open the folio.
	// This will not be the case if a user toggled views and a download is resumed.
	downloadButtonWasClicked: false,
	
	initialize: function() {
		console.log("App.views.section.SectionFolioItemView.initialize()");
	},
	
	render: function(cb) {
		console.log("App.views.section.SectionFolioItemView.render()");
		cb = cb || $.noop;
		
		var that = this,
		    cx = {},
		    $folioThumb;
		
		this.FolioStates = App.api.libraryService.folioStates;
		
		cx = {
      model: this.model,
      cover_img: "http://edge.adobe-dcfs.com/ddp/issueServer/issues/" + this.model.id + "/libraryPreview/portrait" /*+ "/" + App.folioThumbTimestamp*/
    };
    
    this.$el.html(this.template(cx));

	  $folioThumb = this.$(".folio-thumb");

		var transaction = this.model.getPreviewImage(135, 180, true);
		transaction.completedSignal.addOnce(this.getPreviewImageHandler, this);
		
		this.updateView();
		
		// Add a handler to listen for updates.
		this.model.updatedSignal.add(this.updatedSignalHandler, this);

		// Determine if the folio was in the middle of downloading.
		// If the folio is downloading then find the paused transaction and resume.
		if (this.model.state == this.FolioStates.DOWNLOADING) {
			var transactions = this.model.currentTransactions;
			var len = transactions.length;
			for (var i = 0; i < len; i++) {
				var transaction = transactions[i];
				if (transaction.state == App.api.transactionManager.transactionStates.PAUSED) {
					transaction.resume();
					break;
				}
			}
		}
		
		$folioThumb.load(function() { that.folioThumbLoadedHandler() });
		
		$folioThumb.on("click", function(e) {
			if (that.model.isViewable)
				that.model.view();
		});
		
		this.$(".magazine-title").html(this.model.title);
		
		cb();
		return this;
	},
	
	clear: function() {
		this.$el.off();
		this.$("#section-download-button").off();
		this.model.updatedSignal.remove(this.updatedSignalHandler, this);
	},
	
	getPreviewImageHandler: function(transaction) {
		if (transaction.state == App.api.transactionManager.transactionStates.FINISHED && transaction.previewImageURL != null) {
			//this.$(".folio-thumb").attr({"src" : transaction.previewImageURL});
			//console.log(transaction);
		} else if (transaction.previewImageURL == null) { // Sometimes previewImageURL is null so attempt another reload.
			var that = this;
			setTimeout(function() {
				var transaction = that.model.getPreviewImage(135, 180, true);
				transaction.completedSignal.addOnce(that.getPreviewImageHandler, that);
			}, 200);
		}
	},
	
	folioThumbLoadedHandler: function() {
		this.$(".folio-thumb").css({"visibility" : "visible"});
	},
	
	updatedSignalHandler: function(properties) {
		this.updateView();
		
		// The buy button is disabled before downloading so if it is made viewable
		// during the download then enable it again. 
		if (properties.indexOf("isViewable") > -1 && this.model.isViewable) {
			this.enableBuyButton(true);
			
			if (this.downloadButtonWasClicked && settings.IS_AUTO_OPEN_DOWNLOADED_FOLIO)
				this.model.view();
		}

		if ((properties.indexOf("state") > -1 || properties.indexOf("currentTransactions") > -1) && this.model.currentTransactions.length > 0)
			this.trackTransaction();
	},
	
	// Updates the view with the proper labels, buttons and download status.
	updateView: function() {
		this.setStateLabel("");
		
		switch (this.model.state) {
			case this.FolioStates.ENTITLED:
				this.showDownloadStatus(false);
				this.enableBuyButton(true);
				break;
			case this.FolioStates.DOWNLOADING:
				if (!this.model.isViewable)
					this.enableBuyButton(false);
				
				this.showDownloadStatus(true);

				if (!this.currentDownloadTransaction || (this.currentDownloadTransaction && this.currentDownloadTransaction.progress == 0)) {
					this.setDownloadPercent(0);
					this.setStateLabel("Waiting...");
				}
				
				break;
			case this.FolioStates.INSTALLED:
				this.showDownloadStatus(false);
				
				this.$el.trigger("folioInstalled");
				break;
		}
		
		if (this.model.state > this.FolioStates.ENTITLED) {
			this.$("#section-download-button").hide();
		}
	},
	
	setStateLabel: function(value) {
		if (value != "") {
			this.$(".magazine-title, .folio-number").hide();
			this.$(".state").show();
		} else {
			this.$(".magazine-title, .folio-number").show();
			this.$(".state").hide();
		}
		
		this.$(".state").html(value);
	},

	trackTransaction: function() {
		if (this.isTrackingTransaction)
			return;
			
		var transaction;
		for (var i = 0; i < this.model.currentTransactions.length; i++) {
	        transaction = this.model.currentTransactions[i];
	        if (transaction.isFolioStateChangingTransaction()) {
	            // found one, so break and attach to this one
	            break;
	        } else {
	            // null out transaction since we didn't find a traceable one
	            transaction = null;
	        }
	    }
	
		if (!transaction)
			return;
		
		var transactionType = transaction.jsonClassName;
		if (transactionType != "DownloadTransaction" &&
			  transactionType != "UpdateTransaction" &&
			  transactionType != "PurchaseTransaction" &&
			  transactionType != "ArchiveTransaction" &&
			  transactionType != "ViewTransaction") {
				return;
		}

		// Check if the transaction is active yet
		if (transaction.state == App.api.transactionManager.transactionStates.INITALIZED) {
			// This transaction is not yet started, but most likely soon will
			// so setup a callback for when the transaction starts
			transaction.stateChangedSignal.addOnce(this.trackTransaction, this);
			return;
		}
		
		this.isTrackingTransaction = true;
		
		this.currentDownloadTransaction = null;
		if (transactionType == "DownloadTransaction" || transactionType == "UpdateTransaction") {
			transaction.stateChangedSignal.add(this.download_stateChangedSignalHandler, this);
			transaction.progressSignal.add(this.download_progressSignalHandler, this);
			transaction.completedSignal.add(this.download_completedSignalHandler, this);
			this.currentDownloadTransaction = transaction;
		} else {
			// Add a callback for the transaction.
			transaction.completedSignal.addOnce(function() {
				this.isTrackingTransaction = false;
			}, this)
		}
	},
	
	// Handler for when a user clicks the buy button.
	downloadButton_clickHandler: function() {
		if (App._using_adobe_api) {
			this.model.download();

			this.downloadButtonWasClicked = true;
		}
	},
	
	// Changes the opacity of the buyButton to give an enabled or disabled state.
	enableBuyButton: function(value) {
		this.$("#section-download-button").css({"opacity" : value ? 1 : .6});
		
		this.isBuyButtonEnabled = value;
	},
	
	// Displays the dialog for confirmation of whether or not to update the folio.
	displayUpdateDialog: function() {
		var desc = "An updated version of " + this.model.title + " is available. Do you want to download this update now?";
		var html = "".concat("<div id='update-dialog-modal-background' class='modal-background'>", // Make the dialog modal.
		                       "<div id='update-dialog' class='dialog'>",
		                         "<p id='description'>" + desc + "</p>",
		                         "<button id='no'>No</button><button id='yes'>Yes</button>",
		                       "</div>",
		                     "</div>");

		this.updateDialog = $(html);
		
		this.updateDialog.appendTo("body");
		
		$("#update-dialog").addClass("pop");
		$("#update-dialog-modal-background").css({"display" : "inline"});
	},
	
	// Handler for the "Yes" button of the update dialog.
	yes_updateFolio: function() {
		this.updateDialog.remove();
		this.model.update();
	},
	
	// Handler for the "No" button of the update dialog.
	no_updateDialogHandler: function() {
		this.updateDialog.remove();
		this.model.view();
	},
	
	// Downloads are automatically paused if another one is initiated so watch for changes with this callback.
	download_stateChangedSignalHandler: function(transaction) {
		if (transaction.state == App.api.transactionManager.transactionStates.FAILED) {
			if (transaction.error) {
				if (transaction.error.code == App.api.transactionManager.transactionErrorTypes.TransactionFolioNotEnoughDiskSpaceError)
					alert("You do not have enough disk space to download this issue.");
				else if (transaction.error.code == App.api.transactionManager.transactionErrorTypes.TransactionFolioIncompatibleError)
					alert("The issue you are trying to download is incompatible with this viewer. Please update your app.");
				else
					alert("Unable to download section: " + transaction.error.code + ".");
			} else {
				alert("Unable to download section.");
			}
			
			this.download_completedSignalHandler(transaction);
			this.updateView();
			this.enableBuyButton(true);
			this.setStateLabel("");
		} else if (transaction.state == App.api.transactionManager.transactionStates.PAUSED) {
			this.setStateLabel("Download Paused");
			var $downloadToggleButton = this.$("#toggle-download-button");
			$downloadToggleButton.removeClass("cancel-download-button");
			$downloadToggleButton.addClass("resume-download-button");
		} else if (transaction.state == App.api.transactionManager.transactionStates.ACTIVE) {
			this.setStateLabel("");

			var $downloadToggleButton = this.$("#toggle-download-button");
			$downloadToggleButton.removeClass("resume-download-button");
			$downloadToggleButton.addClass("cancel-download-button");
		} else {
			this.setStateLabel("");
		}
	},
	
	// Updates the progress bar for downloads and updates.
	download_progressSignalHandler: function(transaction) {
		this.setDownloadPercent(transaction.progress);
	},
	
	// Handler for when a download or update completes.
	download_completedSignalHandler: function(transaction) {
		transaction.stateChangedSignal.remove(this.download_stateChangedSignalHandler, this);
		transaction.progressSignal.remove(this.download_progressSignalHandler, this);
		transaction.completedSignal.remove(this.download_completedSignalHandler, this);
			
		this.isTrackingTransaction = false;
	},
	
	// Displays/Hides the download/update progress bar.
	showDownloadStatus: function(value) {
		if (value) {
			if (!this.$downloadStatus) {
				var html = "".concat("<div class='download-status'>",
				                       "<div class='progress-track'><div class='progress-bar' /></div>",
				                     "</div>");
				
				this.$downloadStatus = $(html);
				this.$el.append(this.$downloadStatus);
				
				html = "<div id='toggle-download-button' class='cancel-download-button'></div>";
				this.$cancelDownloadButton = $(html);
				this.$el.append(this.$cancelDownloadButton);
				
				var that = this;
				this.$cancelDownloadButton.on("click", function() {
					that.toggleDownload();
				});
				
				this.$downloadStatus.on("click", function(e) {
					if (that.model.isViewable)
						that.model.view();
				});
			}
			
			this.$("#section-download-button").hide();
		} else {
			if (this.$downloadStatus) {
				this.$downloadStatus.off();
				this.$downloadStatus.remove();
				this.$downloadStatus = null;
				
				this.$cancelDownloadButton.remove();
				this.$cancelDownloadButton = null;
				
				this.$cancelDownloadButton.off("click");
				this.$("#section-download-button").show();
			}
		}
	},
	
	// Handler for when a user clicks cancel download button.
	toggleDownload: function() {
		if (this.model.state == this.FolioStates.DOWNLOADING) {
			if (!this.currentDownloadTransaction)
				return;
			
			if (this.currentDownloadTransaction.state == App.api.transactionManager.transactionStates.ACTIVE) {
				this.currentDownloadTransaction.cancel();
			} else {
				this.currentDownloadTransaction.resume();
			}
		}
	},
	
	// Sets the download progress bar.
	setDownloadPercent: function(value) {
		value *= .01;
		
		// Figure out if landscape or portrait.
		var maxWidth = window.innerWidth > window.innerHeight ? 300 : 216; // Max width of track.
		this.$(".progress-bar").css({"width" : Math.min(maxWidth * value, maxWidth)});
	}
});