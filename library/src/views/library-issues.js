
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
  
  subscribeDialog: null,
  
  filter: null,
    
	events: {
	  "click .slide"             : "banner_tap",
    "click #show-more"         : "showMore_clickHandler",
    "change #grid-drop-down"   : "grid_dropDownChangeHandler"
  },
  
  initialize: function(options) {
		console.log("App.views.LibraryIssues.initialize()");
		var that = this;
		
		this.foliosPerPage = settings.num_folios_displayed;
    
    this._debounce_render = _.throttle(_.bind(this.render, this, $.noop), 500);
    App.api.libraryService.updatedSignal.add(this._debounce_render);
    
    this.$el.addClass("scrollable");
	},
	
	render: function(cb) {
	  console.log("App.views.LibraryIssues.render()");
	  cb = cb || $.noop;
	  
	  var that = this, cx;

	  cx = {
	    settings: settings
	  };
    
    $("body").remove("#grid-drop-down");
    
    this.$el.html(this.template(cx));
    
    App.$grid = this.$("#grid");
    this.showMore = this.$("#show-more");
    
    window.setTimeout(function() { that.updateLibrarySpinner(); return; }, 0);
    
    var transaction = App.api.libraryService.updateLibrary();
    transaction.completedSignal.addOnce(function() {
      that.updateLibraryHandler();
    }, this);
    
    this.$("#grid-drop-down").dropDown({verticalGap: -20, className: "grid-drop-down-menu", menuWidth: 170, triangleMarginLeft: 70});
    
    var glClass = (localStorage.getItem("gradeLevel")) ? localStorage.getItem("gradeLevel") : localStorage.getItem("lastGradeLevel");

    switch (glClass) {
      case "k1":
        this.$("#grid-drop-down").prepend("Editions K-1");
        break;
      case "22":
        this.$("#grid-drop-down").prepend("Editions 2");
        break;
      case "34":
        this.$("#grid-drop-down").prepend("Editions 3-4");
        break;
      case "56":
        this.$("#grid-drop-down").prepend("Editions 5-6");
        break;
      default:
        this.$("#grid-drop-down").prepend("All Editions");
        break;
    }
    
    this.$("#grid-drop-down").append("<span class='arrow-up'></span><span class='arrow-down'></span>");
    
    if (App.userType == "student"){
      this.$("#grade-selector").hide();
    }
    
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
	  
	  App.$headerTitle.html(settings.IS_UPDATING_TEXT);
    
    window.spinner = new Spinner(App.spinnerOpts).spin();
    $(window.spinner.el).insertBefore("#header #title span").css({'top':'23px','left':spinnerLeft});
	},
	
	updateLibraryHandler: function() {
    console.log("App.views.LibraryIssues.updateLibraryHandler()");
    
    var that = this,
        filterRegEx,
        folioGradeLevel,
        folioUserType;
        
    if (localStorage.getItem("gradeLevel")) {
      this.filter = localStorage.getItem("gradeLevel");
      
      if (this.filter != "all") {
        filterRegEx = new RegExp(this.filter, 'gi');
      } else {
        filterRegEx = null;
      }
    }

		// Remove the div that contains the "updating library" message.
		window.spinner.stop();
		$("#header #title .spinner").remove();
		App.$headerTitle.html(settings.IS_HEADER_TEXT);
    
    //Having multiple dropdowns, we need to specify a number for each via 'menuNumber' for events to be bound correctly
    //$("#header-drop-down-filter").dropDown({verticalGap: -20, menuWidth: 130, menuNumber: 1});
		
		//$("#header-drop-down").dropDown({verticalGap: -20, menuWidth: 230, menuNumber: 2});
		

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
    
    // filter list based on dropdown in chrome
    this.folios = _.filter(list, function(folio) {      
      folioUserType = folio.productId.split(".")[4]; // should be 'student' or 'teacher'
      folioGradeLevel = folio.productId.split(".")[5]; // should be 2 char grade level [k1, 22, 34, 56]
      
      if (folioUserType == "student" && App.userType == "student") {
        // Return all student folios in good download/view state (or everything in TEST_MODE)
        if (settings.TEST_MODE || (!folio.isPurchasable && (folio.isDownloadable || folio.isViewable))) {
          return true;
        }
      } else if (folioUserType == "teacher" && App.userType == "teacher") {
        // Return 'all' teacher folios in good download/view state (or everything in TEST_MODE)
        if (settings.TEST_MODE || (!folio.isPurchasable && (folio.isDownloadable || folio.isViewable))) {
          if (that.filter == 'all') {
            return true;
          } else { // Return 'selected grade' teacher folios in good download/view state
            this.retVal = folioGradeLevel.match(filterRegEx);
            
            if (!this.retVal) console.log("Do not display: " + folio.productId);
            
            return this.retVal;
          }
        }
      } else { // folio product Id has incorrect format
        console.log("Do not display: " + folio.productId);
      }
    });
      
    // If the latest folio is not purchasable then the user is entitled to it.
    // If true then do not display the subscription button.
    if (this.folios.length > 0) {
      //console.log("filtered folios",this.folios);
      
      var latestFolio = this.folios[0];
      this.userOwnsLatestFolio = !(latestFolio.state == App.api.libraryService.folioStates.PURCHASABLE ||
                                   latestFolio.state == App.api.libraryService.folioStates.UNAVAILABLE ||
                                   latestFolio.state == App.api.libraryService.folioStates.INVALID);
    } else if (!App.isOnline) { // Folio list is empty and user is not online.
      $("#loading").html("Please connect to the internet to download issues.");
      return;
    } else {
      $("#loading").html("There are currently no issues to download.");
      return;
    }

    $("body")
      .off("subscribeButtonClicked")
      .on("subscribeButtonClicked", function(e){
      that.display_subscribeDialog(e);
    });
    $("body")
      .off("folioThumbClicked")
      .on("folioThumbClicked", function(e, folio, elementId){      
      that.display_previewDialog(e, folio, elementId);
    });
    $("body")
      .off("displaySectionsClicked")
      .on("displaySectionsClicked", function(e, folio){
      that.displaySectionsView(folio);
    });

    // The collection creates a clone of the folio objects so addFolios() passes a reference to the object.
    // Since the folios are not on a server we don't need to load anything so pass the folios to the constructor.
    var showFoliosInt = window.setInterval(function() {
      if (that.folios) {
        //if (!App.libraryCollection) { //commented out in order for new collection be built from filtered list of folios
          App.libraryCollection = new App.model.LibraryCollection(that.folios);
        //}
        
        if (App.libraryCollection) {
          window.clearInterval(showFoliosInt);
          console.log("interval cleared");
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
    }, 200);
	},
	
  addFolios: function() {		
		var startIndex, endIndex, folioThumbTS, view, el;
		
		if (App.libraryCollection.length > 0) {
			$("#loading").remove();
		} else {
			return;
		}
			
		startIndex = this.getNumFoliosVisible();
		endIndex = Math.min(startIndex + this.foliosPerPage, App.libraryCollection.length);
		folioThumbTS = (+new Date());
		for (var i = startIndex; i < endIndex; i++) {
			// When using the DPS api this is a clone of the original folio.
			var folio = App.libraryCollection.at(i);
			// Testing on the desktop so create the path to the image.
			if (!App._using_adobe_api && folio.attributes.libraryPreviewUrl) {
				//folio.attributes.libraryPreviewUrl +=  "/portrait";
				//alert(0 + " - " + folio.attributes.libraryPreviewUrl);
		  } else {
		    folio.attributes.libraryPreviewUrl = "http://edge.adobe-dcfs.com/ddp/issueServer/issues/" + folio.attributes["id"] + "/libraryPreview/portrait" /*+ "/" + App.folioThumbTimestamp*/;
		    //alert(1 + " - " + folio.attributes.libraryPreviewUrl);
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
	
	grid_dropDownChangeHandler: function(e) {
    console.log("App.views.LibraryChrome.grid_dropDownChangeHandler");
    
    e.stopPropagation();
    
    App.stopPreview = true; // prevent preview dialog from bubbling
    var selectedId = $(e.target).dropDown("getSelectedId");
    
    var that = this;
    
    if (localStorage.getItem("gradeLevel")) {
      localStorage.setItem("lastGradeLevel", localStorage.getItem("gradeLevel"));
    }
    
    $.each(App.gradeLevels, function( index, value ) {
      if (index == selectedId) {
        console.log("index:" + index + "\nselectedId:" + selectedId);
        if (value !== localStorage.getItem("lastGradeLevel")) {
          localStorage.setItem("gradeLevel", value);
          $(".modal-background-grey").each(function() {
            $(this).remove();
          });
        }
      }
    });
      
    var transaction = App.api.libraryService.updateLibrary();
    transaction.completedSignal.addOnce(function() {
      that.updateLibraryHandler();
      setTimeout(that._debounce_render,0);
    }, this);
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
    
    if (App.stopPreview) {
      App.stopPreview = false;
      return;
    }
    
    var that = this;
    
    if (!this.previewDialog) {
      this.previewDialog = new App.views.dialogs.PreviewDialog({model: folio});
      this.$el.append(this.previewDialog.render().el);
      this.previewDialog.setImageProperties($(e.target), elementId);
      
      this.previewDialog.$el.off("previewDialogClosed").on("previewDialogClosed", function() {
        that.previewDialog = null;
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
  
  display_subscribeDialog: function(e) {
    console.log("App.views.LibraryIssues.display_subscribeDialog()");
    e.stopPropagation();
    
    if (!this.subscribeDialog) {
      this.subscribeDialog = new App.views.dialogs.SubscribeDialog();

      var that = this;
      this.subscribeDialog.$el.off("subscribeDialogClosed").on("subscribeDialogClosed", function() {
        that.subscribeDialog = null;
      });
    }
  },
  
  display_loginDialog: function(e, userType) {
    console.log("App.views.LibraryIssues.display_loginDialog()");
    e.stopPropagation();
    
    if (!App.api.authenticationService.isUserAuthenticated) {
      var that = this,
          loginDialog;
      
      loginDialog = (userType) ? new App.views.dialogs.TeacherLoginDialog() : new App.views.dialogs.StudentLoginDialog();
      
      var loginScrollPosition = $(window).scrollTop();
      
      // Triggered from the dialog when a login is successful.
      loginDialog.$el.on("loginSuccess", function() {
        that.loginBtn.html(settings.LBL_SIGN_OUT);
        $(window).scrollTop(loginScrollPosition); // set the scroll position back to what it was.
      });
    } else {
      App.api.authenticationService.logout();
      
      this.loginBtn.html(settings.LBL_SIGN_IN);
    }
  },
  
  showMore_clickHandler: function(e) {
    console.log("App.views.LibraryIssues.showMore_clickHandler()");
    e.stopPropagation();
    this.addFolios();
  },
  
  banner_tap: function(e) {
    console.log("App.views.LibraryIssues.banner_tap()");
    
    var element = $(e.currentTarget);
    
    if (element.hasClass("subscribe")) {
      console.log("Banner tap - subscribe");
      new App.dialogs.Subscribe();
    } else if (element.hasClass("link")) {
      console.log("Banner tap - " + settings.BANNER_TARGET_URL + " - this will only work with an R28 app or higher");
      App.api.dialogService.open(settings.BANNER_TARGET_URL);
    } else if (element.hasClass("signin")) {
      if (element.hasClass("teacher")) {
        this.display_loginDialog(e, true);
      } else {
        this.display_loginDialog(e, false);
      }
    } else {
      console.log("Banner tap - no action");
    }
    return false;
  },
  
  setup_sidescroller: function(elementId) {
    var $main_gallery = document.getElementById(elementId);

    gallery = new libBanner.SlideshowGallery($main_gallery);
    gallery.enableTouch().slideEvery(5000);
  }
});