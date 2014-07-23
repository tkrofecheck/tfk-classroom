/**
 * Displays the login dialog that includes two links, "Forgot Password" and "Sign in".
 */
App.views.dialogs.SlideshowDialog = Backbone.View.extend({
	tagName:  "div",
	
	className: "modal-background-grey",
	
	template: Handlebars.templates["dialog-slideshow.tmpl"],
	
	events: {
		//"click"                   : "clickHandler",
		"click .close"            : "close",
		"click .samples"          : "goto_home_tab"
	},
	
	initialize: function() {
		console.log("App.views.dialogs.SlideshowDialog.initialize()");
		
		var that = this;
		
		this.render().$el.appendTo("body");
    this.open();
	},
	
	render: function(e) {
		console.log("App.views.dialogs.SlideshowDialog.render()");
		var that = this,
        touted_issue = _.head(this.get_visible()),
        cover_img = "http://edge.adobe-dcfs.com/ddp/issueServer/issues/" + touted_issue.id + "/libraryPreview/portrait/",
        slides = settings.slides,
        cb, cx;
		
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
      that.setup_sidescroller(".slideshow");
    });
    
		return this;
	},
	
	open: function() {
	  this.$(".dialog").addClass("pop");
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
  },
  
	clickHandler: function(e) {
		console.log("clickHandler");
		e.stopPropagation();
		//preview-dialog-content-container
		var clientX = e.clientX;
		var clientY = e.clientY;
		var $tutorial = this.$("#tutorial");
		var offset = $tutorial.offset();
		if (clientX < offset.left ||
		    clientX > offset.left + $tutorial.width() ||
		    clientY < offset.top ||
		    clientY > offset.top + $tutorial.height()) {
			  this.close();
		}
	},
	
	goto_home_tab: function(e) {
    console.log("Leaving Library... Switching to tab: Home");
    
    e.preventDefault();
    App.api.configurationService.gotoState("Home");
  },
  
	close: function() {
		console.log("close");
		this.$el.trigger("closeSlideshow");
		this.$el.remove();
	}
});
