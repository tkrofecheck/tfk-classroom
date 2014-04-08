/**
 * Displays a folio in the grid.
 */
App.views.folioItems.FolioItemView = Backbone.View.extend({
	tagName:  "div",
	
	className: "folio-item-view",
	
	template: Handlebars.templates["folioitem.tmpl"],
	
	events: {
	  "click #buy-button"        : "buyButton_clickHandler",
	  "tap #update-dialog #yes"  : "yes_updateFolio",
	  "tap #update-dialog #no"   : "no_updateDialogHandler"
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
	
	// Whether or not a preview is downloading.
	isPreviewDownloading: false,
	
	initialize: function() {			
		console.log("App.views.folioItems.FolioItemView.initialize()");
	},
	
	render: function() {
		var that = this,
		    cx = {},
		    json = this.model.toJSON();

    this.FolioStates = App.api.libraryService.folioStates;
    
		cx = {
		  model: json,
		  price: (json.state == this.FolioStates.PURCHASABLE) ? json.price : 'Download'
		};
		
		this.$el.html(this.template(cx));
		
		var that = this;
		
		var $folioThumb = this.$(".folio-thumb");
		
		this.$buyButton = this.$("#buy-button");

		//Get a reference to the original folio object.
		if (App._using_adobe_api) {
		  this.folio = App.api.libraryService.folioMap.internal[this.model.attributes.id];
		} else {
		  this.folio = App.api.libraryService.folioMap[this.model.attributes.id];
		}
		
		// Set a delay to load the preview image in case this renderer has
		// already been removed from the DOM. This will be the case when
		// multiple folios are added within the same frame from the API causing
		// some folios to be added and then removed immediately.
		setTimeout(function(){
		  that.loadPreviewImage();
	  }, 100);
		
		this.updateView();

		// Add a handler to listen for updates.
		this.folio.updatedSignal.add(this.updatedSignalHandler, this);

		// Determine if the folio was in the middle of downloading.
		// If the folio is downloading then find the paused transaction and resume.
		if (this.folio.state == this.FolioStates.DOWNLOADING) {
			var transactions = this.folio.currentTransactions;
			var len = transactions.length;
			for (var i = 0; i < len; i++) {
				var transaction = transactions[i];
				if (transaction.state == App.api.transactionManager.transactionStates.PAUSED) {
					transaction.resume();
					break;
				}
			}
		}
		
		$folioThumb.load(function() { that.folioThumbLoadedHandler(); });
		
		$folioThumb.on("click", function(e) {
      if (App._using_adobe_api) {
        if (that.folio.isUpdatable) {
          that.displayUpdateDialog();
        } else if (that.folio.state > that.FolioStates.PURCHASABLE && that.folio.hasSections) {
          that.$el.trigger("displaySectionsClicked", [that.model]);
        } else if (App._using_adobe_api && that.folio.isViewable) {
          that.folio.view();
        } else if (that.folio.state != that.FolioStates.DOWNLOADING) {
          $(e.currentTarget).trigger("folioThumbClicked", [that.folio, "folioThumb" + json.productId.replace(/\./g,"")]);
        }
      } else {
        $(e.currentTarget).trigger("folioThumbClicked", [json, "folioThumb" + json.productId.replace(/\./g,"")]);
      }
    });
		
		$folioThumb.attr("id", "folioThumb" + json.productId.replace(/\./g,""));
		
		if (this.model.get("hasSections")) {
			this.$el.append("<div id='folio-section-shadow'></div>");
		}
		
		return this;
	},
	
	clear: function() {
		this.$el.off();
		this.$buyButton.off();
		this.folio.updatedSignal.remove(this.updatedSignalHandler, this);
	},
	
	loadPreviewImage: function() {
		if (this.el.parentElement) {
			var transaction = this.folio.getPreviewImage(135, 180, true);
			transaction.completedSignal.addOnce(this.getPreviewImageHandler, this);
		}
	},
	
	getPreviewImageHandler: function(transaction) {
		var that = this;
		
		if (transaction.state == App.api.transactionManager.transactionStates.FINISHED && transaction.previewImageURL != null) {
			//this.$(".folio-thumb").attr("src", transaction.previewImageURL);
			//console.log(transaction);
		} else if (transaction.previewImageURL == null) { // Sometimes previewImageURL is null so attempt another reload.
			setTimeout(function() {
				var transaction = that.folio.getPreviewImage(135, 180, true);
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
		if (properties.indexOf("isViewable") > -1 && this.folio.isViewable) {
			this.enableBuyButton(true);
			
			if (this.downloadButtonWasClicked && settings.IS_AUTO_OPEN_DOWNLOADED_FOLIO) {
				this.folio.view();
		  }
		}

		if ((properties.indexOf("state") > -1 || properties.indexOf("currentTransactions") > -1)
		    && this.folio.currentTransactions.length > 0) {
			this.trackTransaction();
		}
	},
	
	// Updates the view with the proper labels, buttons and download status.
	updateView: function() {
		var label = "";
		this.setStateLabel("");
		this.$buyButton.removeClass("cloud-icon");
		
		switch (this.folio.state) {
			case this.FolioStates.INVALID:
				label = "Error";
				break;
			case this.FolioStates.UNAVAILABLE:
				label = "Error";
				break;
			case this.FolioStates.PURCHASABLE:
				label = this.folio.price;
				
				// This is triggered during a preview download so make sure the button is only visible if a preview download is not happening.
				if (!this.isPreviewDownloading)
					this.$buyButton.show();
				break;
			case this.FolioStates.ENTITLED:
				this.showDownloadStatus(false);
				this.enableBuyButton(true);
				
				if (this.folio.entitlementType == App.api.receiptService.entitlementTypes.FREE)
					label = "FREE";
				else
					this.$buyButton.addClass("cloud-icon");
				
				this.$buyButton.show();
				break;
			case this.FolioStates.DOWNLOADING:
				if (!this.folio.isViewable)
					this.enableBuyButton(false);
				
				this.showDownloadStatus(true);
				
				if (!this.currentDownloadTransaction || (this.currentDownloadTransaction && this.currentDownloadTransaction.progress == 0)) {
					this.setDownloadPercent(0);
					this.setStateLabel("Waiting...");
				}
				
				label = "View";
				break;
			case this.FolioStates.INSTALLED:
				this.showDownloadStatus(false);
				label = "View";
				
				this.$buyButton.hide();
				
				break;
			case this.FolioStates.PURCHASING:
				this.$buyButton.hide();
				this.setStateLabel("Purchasing...");
				if (this.$('#purchasing-spinner').length > 0) {
				  // exists - do not create more than one spinner
				} else {
				  // create spinner
				  $("<div id='purchasing-spinner' class='spinner'></div>").appendTo(this.$(".text"));
    
          this.spinner = new Spinner(App.spinnerOpts).spin();
          this.$("#purchasing-spinner").html(this.spinner.el);
				}				
				break;
			case this.FolioStates.EXTRACTING:
			case this.FolioStates.EXTRACTABLE:
				label = "View";
				break;
		}
		
		this.$buyButton.html(label);
	},
	
	setStateLabel: function(value) {
		if (value != "") {
			this.$(".magazine-title, .folio-number").hide();
			this.$(".state").show();
		} else {
			this.$(".magazine-title, .folio-number").show();
			this.$(".state").hide();
			
			//problem removing spinner when purchase cancelled from preview dialog - try again
			if (this.$('#purchasing-spinner').length > 0) {
			  this.spinner.stop();
        this.$("#purchasing-spinner").remove();
			}
		}
		
		this.$(".state").html(value);
	},

	trackTransaction: function() {
		if (this.isTrackingTransaction)
			return;
			
		var transaction;
		for (var i = 0; i < this.folio.currentTransactions.length; i++) {
	        transaction = this.folio.currentTransactions[i];
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
			  transactionType != "ViewTransaction" &&
			  transactionType != "PreviewTransaction") {
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
		
		console.log(transactionType);
		
		if (transactionType == "DownloadTransaction" || transactionType == "UpdateTransaction" || transactionType == "PreviewTransaction") {
			transaction.stateChangedSignal.add(this.download_stateChangedSignalHandler, this);
			transaction.progressSignal.add(this.download_progressSignalHandler, this);
			transaction.completedSignal.add(this.download_completedSignalHandler, this);
			this.currentDownloadTransaction = transaction;
			
			if (transactionType == "PreviewTransaction") {
				this.isPreviewDownloading = true;
				this.showDownloadStatus(true);
				
				if (transaction.progress == 0) {
					this.setDownloadPercent(0);
					this.setStateLabel("Waiting...");
				}
				
				this.downloadButtonWasClicked = true;
			}
		} else {
			// Add a callback for the transaction.
			transaction.completedSignal.addOnce(function() {
				this.isTrackingTransaction = false;
			}, this);
		}
	},
	
	// Handler for when a user clicks the buy button.
	buyButton_clickHandler: function() {
		if (App._using_adobe_api) {
			if (!this.folio.isCompatible) {
				alert("Please update your app to view this issue.");
				return;
			}
			
			var state = this.folio.state;
			
			if (state == this.FolioStates.PURCHASABLE) {
				console.log("buy folio");
				this.purchase();
			} else if (this.folio.isUpdatable) {
				console.log("update folio?");
				this.displayUpdateDialog();
			} else if (state > this.FolioStates.PURCHASABLE && this.folio.hasSections) {
				this.$el.trigger("displaySectionsClicked", [this.model]);
			} else if (this.folio.isViewable) {
				console.log("view folio");
				this.folio.view();
			} else if (state == this.FolioStates.ENTITLED) {
				if (this.isBuyButtonEnabled) {
					console.log("download folio");
					this.folio.download();
				}
			}
			
			this.downloadButtonWasClicked = true;
		} else {
			if (this.model.get("hasSections")) {
				this.$el.trigger("displaySectionsClicked", [this.model]);
			}
		}
	},
	
	// Changes the opacity of the buyButton to give an enabled or disabled state.
	enableBuyButton: function(value) {
		this.$buyButton.css("opacity", value ? 1 : .6);
		
		this.isBuyButtonEnabled = value;
	},
	
	// Purchases the folio.
	purchase: function() {
		var transaction = this.folio.purchase();
		    
		transaction.completedSignal.addOnce(function(transaction) {
			this.spinner.stop();
			this.$("#purchasing-spinner").remove();
			
			if (transaction.state == App.api.transactionManager.transactionStates.FINISHED) {
				this.isTrackingTransaction = false;
			} else if (transaction.state == App.api.transactionManager.transactionStates.FAILED) {
				alert("Sorry, unable to purchase");
			}
			
			this.updateView();
		}, this);
	},
	
	// Displays the dialog for confirmation of whether or not to update the folio.
	displayUpdateDialog: function() {
		var that = this,
		    desc = "An updated version of " + this.folio.title + " is available. Do you want to download this update now?",
		    html = "".concat("<div id='update-dialog-modal-background' class='modal-background-grey'>", // Make the dialog modal.
          		             "<div id='update-dialog' class='dialog'>",
          		               "<p id='description'>" + desc + "</p>",
          		               "<div class='text-link' id='no'>No</div><div class='text-link' id='yes'>Yes</div>",
          		             "</div>",
          		           "</div>");

		this.updateDialog = $(html);
		
		this.updateDialog.appendTo("body");
		
		$("#update-dialog").addClass("pop");
		$("#update-dialog-modal-background").css({"display" : "inline"});
	},
	
	// Handler for the "Yes" button of the update dialog.
	yes_updateFolio: function() {
		this.downloadButtonWasClicked = true;
		this.updateDialog.remove();
		this.folio.update();
	},
	
	// Handler for the "No" button of the update dialog.
	no_updateDialogHandler: function() {
		this.updateDialog.remove();
		
		if (this.folio.hasSections)
			this.$el.trigger("displaySectionsClicked", [this.model]);
		else
			this.folio.view();
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
					alert("Unable to download folio: " + transaction.error.code + ".");
			} else {
				alert("Unable to download folio.");
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
		} else if (transaction.state == App.api.transactionManager.transactionStates.INITIALIZED) {
			this.setStateLabel("Waiting...");
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

		// For preview transactions the INSTALLED state is not triggered so hide downloadStatus here.
		this.showDownloadStatus(false);
			
		this.isTrackingTransaction = false;
	},
	
	// Displays/Hides the download/update progress bar.
	showDownloadStatus: function(value) {
		if (value) {
			if (!this.$downloadStatus) {
				var that = this,
				    html = "".concat("<div class='download-status'>",
				                       "<div class='progress-track'><div class='progress-bar' /></div>",
				                     "</div>");
				
				this.$downloadStatus = $(html);
				this.$el.append(this.$downloadStatus);
				
				html = "<div id='toggle-download-button' class='cancel-download-button'></div>";
				this.$cancelDownloadButton = $(html);
				this.$el.append(this.$cancelDownloadButton);
				
				this.$cancelDownloadButton.on("click", function() {
					that.toggleDownload();
				});
				
				if (this.folio && this.folio.hasSections) {
					this.$downloadStatus.on("click", function(){
						that.$el.trigger("displaySectionsClicked", [that.model]);
					});
				}
				
				this.$buyButton.hide();
			}
		} else {
			if (this.$downloadStatus) {
				this.$downloadStatus.off();
				this.$downloadStatus.remove();
				this.$downloadStatus = null;
				
				this.$cancelDownloadButton.off("click");
				this.$cancelDownloadButton.remove();
				this.$cancelDownloadButton = null;
			}
		}
	},
	
	// Handler for when a user clicks cancel download button.
	toggleDownload: function() {
		if (!this.currentDownloadTransaction)
			return;
		
		if (this.currentDownloadTransaction.state == App.api.transactionManager.transactionStates.ACTIVE) {
			this.isPreviewDownloading = false;
			this.currentDownloadTransaction.cancel();
			
			// This should be handled in updateView() but the state is not
			// properly updated for previews so need to explicitly do it here.
			this.showDownloadStatus(false);
		} else {
			this.currentDownloadTransaction.resume();
		}
	},
	
	// Sets the download progress bar.
	setDownloadPercent: function(value) {
		value *= .01;
		
		// Figure out if landscape or portrait.
		var maxWidth = window.innerWidth > window.innerHeight ? 300 : 216; // Max width of track.
		this.$(".progress-bar").css("width", Math.min(maxWidth * value, maxWidth));
	}
});