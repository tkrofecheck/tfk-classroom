/**
 * Displays a folio in the archive grid.
 */
App.views.archive.ArchiveFolioItemView = Backbone.View.extend({
	tagName:  "div",
	
	className: "folio-item-view",
	
	template: Handlebars.templates["archive-folioitem.tmpl"],
	
	events: {
	  "tap .archive-folio-thumb-container"  : "folioThumb_clickHandler",
	  "tap .archive-view-selected"          : "folioThumb_clickHandler"
	},
	
	// A reference to the original folio since the collection uses a cloned copy.
	folio: null,
	
	selected: false,
	
	$selectedBorder: null,
	
	initialize: function() {

	},
	
	render: function() {
		var that = this,
		    cx = {};

		cx = {
		  model: this.model,
		  cover_img: "http://edge.adobe-dcfs.com/ddp/issueServer/issues/" + this.model.id + "/libraryPreview/portrait/" + (+new Date())
		};
		
		this.$el.html(this.template(cx));

		var $folioThumb = this.$(".folio-thumb");
    
		//Get a reference to the original folio object.
    if (App._using_adobe_api) {
      this.folio = App.api.libraryService.folioMap.internal[this.model.id];
    } else {
      this.folio = App.api.libraryService.folioMap[this.model.id];
    }
		
		// Set a delay to load the preview image in case this renderer has
		// already been removed from the DOM. This will be the case when
		// multiple folios are added within the same frame from the API causing
		// some folios to be added and then removed immediately.
		setTimeout(function(){ that.loadPreviewImage() }, 100);
		
		$folioThumb.load(function() { that.folioThumbLoadedHandler() });

		return this;
	},
	
	folioThumb_clickHandler: function(e) {
		e.preventDefault();
		
		this.setSelected(!this.selected); // Toggle the selected state.
		
		this.$el.trigger("folioArchiveChanged", [this.selected, this.model.productId]);
	},
	
	clear: function() {
		this.$el.off();
	},
	
	loadPreviewImage: function() {
		if (this.el.parentElement) {
			var transaction = this.folio.getPreviewImage(135, 180, true);
			transaction.completedSignal.addOnce(this.getPreviewImageHandler, this);
		}
	},
	
	getPreviewImageHandler: function(transaction) {
		if (transaction.state == App.api.transactionManager.transactionStates.FINISHED && transaction.previewImageURL != null) {
			//this.$(".folio-thumb").attr("src", transaction.previewImageURL);
			console.log(transaction);
		} else if (transaction.previewImageURL == null) { // Sometimes previewImageURL is null so attempt another reload.
			var that = this;
			setTimeout(function() {
				var transaction = that.folio.getPreviewImage(135, 180, true);
				transaction.completedSignal.addOnce(that.getPreviewImageHandler, that);
			}, 200);
		}
	},
	
	folioThumbLoadedHandler: function() {
		this.$(".folio-thumb").css({"visibility" : "visible"});
	},
	
	setSelected: function(value) {
		var that = this;
		
		if (value) {
			if (!this.$selectedBorder) {
				var html = "".concat("<div class='archive-view-selected'>",
				                       "<div class='archive-view-selected-check-icon-container'>",
				                         "<div class='archive-view-selected-check-icon'></div>",
				                       "</div>",
				                     "</div>");
				
				this.$selectedBorder = $(html);
				this.$selectedBorder.appendTo(this.$el);
				
				this.$selectedBorder.on("click", function() {
					that.folioThumb_clickHandler();
				});
			}
		} else {
			if (this.$selectedBorder) {
				this.$selectedBorder.remove();
				this.$selectedBorder.off();
				this.$selectedBorder = null;
			}
		}
		
		this.selected = value;
	}
});
