
App.views.LibraryIssues = Backbone.View.extend({
	className: "library-issues-view",
	template: Handlebars.templates["library-issues.tmpl"],

	// Stores the FolioItemView instances.
  folioItemViewArray: [],
  
  showMore: null,
  
  folios: null,
  
  // The number of folios to add for each page.
  foliosPerPage: null,
  
  // Whether or not the user owns the most recent folio.
  userOwnsLatestFolio: false,
  
  // Whether or not a subscription is active.
  isSubscriptionActive: false,
  
  previewDialog: null,
    
	events: {
	  "tap #banner"        : "banner_tap",
    "click #show-more"   : "showMore_clickHandler"
  },
  
  initialize: function() {
		console.log("App.views.LibraryIssues.initialize()");
		this.$el.addClass("scrollable");
		this.foliosPerPage = settings.num_folios_displayed;
	},
	
	render: function(cb) {
	  console.log("App.views.LibraryIssues.render()");
	  cb = cb || $.noop;
	  
	  var that = this, cx;
	  
	  cx = {
	    settings: settings
	  };
    
    this.$el.html(this.template(cx));
    
    App.$grid = this.$("#grid");
    this.showMore = this.$("#show-more");
    
    setTimeout(function() { that.updateLibrarySpinner(); }, 0);
    
    $(window).on("resize", function(){
      that.setGridHeight();
    });
    
    var transaction = App.api.libraryService.updateLibrary();
    transaction.completedSignal.addOnce(function() {
      that.updateLibraryHandler();
    }, this);
    
    cb();
    return this;
	},
	
	updateLibrarySpinner: function() {
	  var that = this,
	      windowWidth = $(window).width(),
	      spinnerLeft = "425px";
	  
	  if (windowWidth <= 768) {
	    spinnerLeft = "295px";
	  }
	  
	  App.$headerTitle.text("Updating Library...");
    
    window.spinner = new Spinner(App.spinnerOpts).spin();
    $(window.spinner.el).insertBefore("#header #title span").css({'top':'23px','left':spinnerLeft});
	},
	
	updateLibraryHandler: function() {
    console.log("App.views.LibraryIssues.updateLibraryHandler()");
    var that = this;
		
		// Remove the div that contains the "updating library" message.
		window.spinner.stop();
		$("#header #title .spinner").remove();
		App.$headerTitle.html("Library");

		$("#header-drop-down").dropDown({verticalGap: -20});

    App.isOnline = App.api.deviceService.isOnline;
    
    this.folios = [];
    
    // Sort the folios descending.
    var list = App.api.libraryService.folioMap.sort(function (a, b) {
      if (a.publicationDate < b.publicationDate) {
        return 1;
      } else if (a.publicationDate > b.publicationDate) {
        return -1;
      } else {
        return 0;
      }
    });
   
    // list is an associative array so put them in a regular array.
    for (var i in list) {
      var folio = list[i];
      if (App.isOnline) { // User is online so display all the folios.
        this.folios.push(folio);
      } else {      // User is offline so only display the installed folios.
        if (folio.state == App.api.libraryService.folioStates.INSTALLED)
          this.folios.push(folio);
      }
    }
      
    // If the latest folio is not purchasable then the user is entitled to it.
    // If true then do not display the subscription button.
    if (this.folios.length > 0) {
      var latestFolio = this.folios[0];
      this.userOwnsLatestFolio = !(latestFolio.state == App.api.libraryService.folioStates.PURCHASABLE ||
                                   latestFolio.state == App.api.libraryService.folioStates.UNAVAILABLE ||
                                   latestFolio.state == App.api.libraryService.folioStates.INVALID);
    } else if (!App.isOnline) { // Folio list is empty and user is not online.
      //$("#loading").html("Please connect to the internet to download issues.");
      return;
    }

    $("body").on("subscriptionPurchased", function() {// Triggered from the dialog when a purchase is successful.
      this.$("#subscribe").css("display", "none");
      $("body").off("subscriptionPurchased");
    });
    $("body").on("folioThumbClicked", function(e, folio, elementId){
      that.display_previewDialog(e, folio, elementId);
    });
    $("body").on("displaySectionsClicked", function(e, folio){
      that.displaySectionsView(folio);
    });

    // The collection creates a clone of the folio objects so addFolios() passes a reference to the object.
    // Since the folios are not on a server we don't need to load anything so pass the folios to the constructor.
    window.showFoliosInt = window.setInterval(function() {
      if (that.folios) {
        if (!App.libraryCollection) {
          App.libraryCollection = new App.model.LibraryCollection(that.folios);
        }
        
        if (App.libraryCollection) {
          window.clearInterval(window.showFoliosInt);
          // Add the folios which are currently available. On the first launch this
          // does not guarentee that all folios are immediately available. The callback
          // below for folioMap.addedSignal will handle folios which are added after
          // startup. Added does not mean, pushed from folio producer, rather they
          // are folios that the viewer becomes aware of after startup.
          that.addFolios();
          
          // Add a listener for when new folios are added.
          App.api.libraryService.folioMap.addedSignal.add(function(folios) {
            for (var i = 0; i < folios.length; i++) {
              that.addFolio(folios[i]);
            }
          }, this);
          return;
        }
      }
    }, 0);
	},
	
  addFolios: function() {		
		var startIndex, endIndex, view, el;
		
		if (App.libraryCollection.length > 0) {
			$("#loading").remove();
		} else {
			return;
		}
			
		startIndex = this.getNumFoliosVisible();
		endIndex = Math.min(startIndex + this.foliosPerPage, App.libraryCollection.length);
		for (var i = startIndex; i < endIndex; i++) {
			// When using the DPS api this is a clone of the original folio.
			var folio = App.libraryCollection.at(i);
			// Testing on the desktop so create the path to the image.
			if (!App._using_adobe_api) {
			  if (folio.attributes.libraryPreviewUrl) {
				  folio.attributes.libraryPreviewUrl +=  "/portrait";
				} else {
				  folio.attributes.libraryPreviewUrl = "http://edge.adobe-dcfs.com/ddp/issueServer/issues/" + folio.attributes["id"] + "/libraryPreview/portrait";
				}
		  } else {
		    folio.attributes.libraryPreviewUrl = "http://edge.adobe-dcfs.com/ddp/issueServer/issues/" + folio.attributes["id"] + "/libraryPreview/portrait"
		  }
				
			view = new App.views.folioItems.FolioItemView({model: folio});
			el = view.render().el;
			App.$grid.append(el);
			
			this.folioItemViewArray.push(view);
			//console.log(folio);
		}
		
		this.setGridHeight();
	},

	getNumFoliosVisible: function() {
		return App.$grid.children().length;
	},
	
	// This will be triggered when folios are added through the API.
	addFolio: function(folio) {
		this.$("#loading").remove();
		
		var len = this.folios.length;
		// Find the insert index. Folios are sorted by publicationDate with the most recent first.
		for (var i = 0; i < len; i++) {
			if (folio.publicationDate >= this.folios[i].publicationDate)
				break;
		}
		
		// Add the folio to the collection.
		App.libraryCollection.add(folio, {at: i});
		
		// Add the folio to the folios.
		this.folios.splice(i, 0, folio);
		
		// Figure out if the user has or is entitled to the latest folio or has a subscription covering today's date.
		// If the latest folio is not purchasable then the user is entitled to it.
		// If true then do not display the subscription button or tile.
		if (this.folios.length > 0) {
			var latestFolio = this.folios[0];
			this.userOwnsLatestFolio = !(latestFolio.state == App.api.libraryService.folioStates.PURCHASABLE ||
			                             latestFolio.state == App.api.libraryService.folioStates.UNAVAILABLE ||
			                             latestFolio.state == App.api.libraryService.folioStates.INVALID);
		}
		this.userOwnsLatestFolio = true;

		// Figure out if this folio should be dispayed.
		// Folios can be added in any order so see if this folio is within the range of publication
		// dates of the folios that are currently displayed.
		var numFoliosDisplayed = this.getNumFoliosVisible();
		var endIndex = Math.max(this.foliosPerPage, numFoliosDisplayed);
		if (i < endIndex) {
			var view;
			// See more button is visible so remove the last folio view before inserting a new one.
			if (numFoliosDisplayed >= this.foliosPerPage) {
				$("#grid div.folio-item-view:last-child").remove();
				 view = this.folioItemViewArray.pop();
				 view.clear();
			}
				
			view = new App.views.folioItems.FolioItemView({model: App.libraryCollection.at(i)});
			var el = view.render().el;
			
			if (numFoliosDisplayed == 0)
				App.$grid.append(el);
			else
				$("#grid div.folio-item-view").eq(i).before(el);
				
			this.folioItemViewArray.splice(i, 0, view);
		}
		
		// Hide the subscribe button.
		if (this.userOwnsLatestFolio) {
			$("#subscribe").hide();
		} else {
			$("#subscribe").show();
	  }
		
		this.setGridHeight();
	},
	
	setGridHeight: function() {
		var that = this,
		    windowWidth = $(window).width(),
		    windowHeight = $(window).height();
    
		// Need to explicitly set the width otherwise it doesn't always update if width=100% in css.
		var numFoliosDisplayed = this.getNumFoliosVisible();
		App.$grid.css({
		  "height" : Math.ceil(numFoliosDisplayed / 3) * (windowWidth > windowHeight ? 285 : 367)
		});
		this.showMore.css({
		  "display" : (numFoliosDisplayed < App.libraryCollection.length) ? "block" : "none"
		});
	},
	
	displaySectionsView: function(folio) {
    console.log("App.views.LibraryChrome.displaySectionsView()");
    
    var sectionsView = new App.views.section.SectionsView({model: folio});
    $("body").append(sectionsView.render().el);
    
    // Need to remove the 'library' grid so it is not scrollable in the background.
    var previewScrollPosition = $(window).scrollTop(); // get the current scroll position
    App.$grid.hide();
    
    sectionsView.$el.on("sectionsViewClosed", function() {
      $(window).scrollTop(previewScrollPosition); // set the scroll position back to what it was.
      App.$grid.show();
      
      sectionsView.$el.off("sectionsViewClosed");
    });
  },
	
	display_previewDialog: function(e, folio, elementId) {
    console.log("App.views.LibraryIssues.display_previewDialog()");
    e.preventDefault();
    
    if (!this.previewDialog) {
      this.previewDialog = new App.views.dialogs.PreviewDialog({model: folio});
      this.$el.append(this.previewDialog.render().el);
      this.previewDialog.setImageProperties($(e.target), elementId);
      
      this.previewDialog.$el.on("previewDialogClosed", function() {
        this.previewDialog = null;
      });
      // Only show the subscribe button if testing on the desktop or
      // if the user doesn't own the latest folio and does not have an active subscription.
      //if ((!this.userOwnsLatestFolio && !this.isSubscriptionActive) && folio == this.folios[0]) {
        // Only show the subscribe button for the most recent.
        //previewDialog.showSubscribeButton();
      //}
      
      // Only show the preview button if testing on the desktop.
      // Otherwise the preview button visibility is determined in PreviewDialog.
      //if (!App._using_adobe_api) {
        //previewDialog.showPreviewButton();
      //}
    } else {
      this.previewDialog = null;
      return false;
    }
  },
  
  showMore_clickHandler: function(e) {
    console.log("App.views.LibraryIssues.showMore_clickHandler()");
    e.stopPropagation();
    this.addFolios();
  },
  
  banner_tap: function() {
    console.log("App.views.LibraryIssues.banner_tap()");
    
    if (settings.store_banners_type == "subscribe") {
      console.log("Banner tap - subscribe");
      new App.dialogs.Subscribe();
    } else if (settings.store_banners_type == "link") {
      console.log("Banner tap - " + settings.BANNER_TARGET_URL + " - this will only work with an R28 app or higher");
      App.api.dialogService.open(settings.BANNER_TARGET_URL);
    } else {
      console.log("Banner tap - no action");
    }
    return false;
  }
});