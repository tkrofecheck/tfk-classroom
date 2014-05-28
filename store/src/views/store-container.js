
App.views.StoreContainer = Backbone.View.extend({
	className: "store-container-view",
	template: Handlebars.templates["store-container.tmpl"],

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
    
	events: {
	  "click .signin > div"        : "display_loginDialog"
  },
  
  initialize: function() {
		console.log("App.views.StoreContainer.initialize()");
		var that = this,
		    render;
		
		this.$el.addClass("scrollable");
		
		$(window).on("resize orientationchange", function() {
      that.render();
    });
    
    this._debounce_render = _.throttle(_.bind(this.render, this, $.noop), 500);
		App.api.libraryService.updatedSignal.add(this._debounce_render);
		
		render = _.bind(this.render, this, $.noop);
    render = _.partial(_.delay, render, 50);
    render = _.debounce(render, 200);
    
    //Update views when subscription receipt is available or when user signs into LUCIE
    App.api.authenticationService.userAuthenticationChangedSignal.add(render);
	},
	
	render: function(cb) {
	  console.log("App.views.StoreContainer.render()");
	  
	  var that = this,
	      touted_issue = _.head(this.get_visible()),
	      cover_img = "http://edge.adobe-dcfs.com/ddp/issueServer/issues/" + touted_issue.id + "/libraryPreview/portrait/",
	      slides = settings.slides,
	      cb, cx;
	      
	  cb = cb || $.noop;
	  
	  cx = {
	    settings: settings,
	    slides: this.cached,
	    cover_img: cover_img
	  };
    
    this.$el.html(this.template(cx));
    if (settings.IS_STORE_SHOW_CHROME) {
      this.$("#left_rail").css("top","47px");
      this.$("#right_rail").css("top","47px");
    } else {
      this.$("#left_rail").css("top","0px");
      this.$("#right_rail").css("top","0px");
    }
    
    setTimeout(function() {
      that.setup_sidescroller("tutorial");
    });
    
    cb();
    return this;
	},
	
	get_visible: function() {
    // This is intended to be the primary method of getting the folios
    //    - first item is the touted issue (always)
    if (this.cached) return this.cached;

    var folios = App.api.libraryService.folioMap.sort();

    folios.sort(this.sortDatesDescending);
    
    this.cached = folios;
    return folios;
  },
  
  display_loginDialog: function(e) {
    console.log("App.views.StoreContainer.display_loginDialog()");
    e.stopPropagation();
    
    if (!App.api.authenticationService.isUserAuthenticated) {
      var that = this,
          loginDialog;
      
      loginDialog = ($(e.currentTarget).hasClass("teacher")) ? new App.views.dialogs.TeacherLoginDialog() : new App.views.dialogs.LoginDialog();
      
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
  
  sortDatesDescending: function (a, b) {
    if (a.publicationDate < b.publicationDate)
      return 1;
    else if (a.publicationDate > b.publicationDate)
      return -1;
    else
      return 0;
  },
  
  setup_sidescroller: function(elementId) {
    var $main_gallery = document.getElementById(elementId);

    gallery = new libBanner.SlideshowGallery($main_gallery);
    gallery.enableTouch().slideEvery(5000);
  }
});