/**
 * Displays the archivable folios in a grid.
 */
App.views.archive.ArchiveView = Backbone.View.extend({
	tagName:  "div",
	
	className: "archive-view",
	
	template: Handlebars.templates["archive.tmpl"],
	
	// An Array of folios that can be archived.
	archivableFolios: null,
	
	// An Array of folio product ids that the user has selected to archive.
	foliosToArchive: null,
	
	folioItemViews: null,
	
	$selectAllBtn: null,
	
	$removeBtn: null,
	
	events: {
		"click #close-button"		    : "close_clickHandler",
		"click #select-all-button"	: "selectAllButton_clickHandler",
		"click #remove-button"		  : "removeButton_clickHandler"
	},
	
	initialize: function() {
		console.log("App.views.archive.ArchiveView.initialize()");
		
		var that = this;
		
		this.archivableFolios = [];
		this.foliosToArchive = [];
		this.folioItemViews = [];
		
		if (App._using_adobe_api) {
			var folio;
			var len = this.model.length;
			for (var i = 0; i < len; i++) {
				var folio = App.api.libraryService.folioMap.internal[this.model.at(i).attributes.id];
				if (folio.isArchivable) {
					this.archivableFolios.push(folio);
				}
			}
		} else {
			_.each(this.model.models, function(element, index, list) {
				that.archivableFolios.push(element.attributes);
			});
		}
		
		this.render().$el.appendTo("body");
	},
	
	render: function() {
	  console.log("App.views.archive.ArchiveView.render()");
	  
	  var that = this,
	      cx = {
    	    settings: settings
    	  };
	  
		this.$el.html(this.template(cx));
		
		App.$archivegrid = this.$("#archive-grid");
		this.$selectAllBtn = this.$("#select-all-button");
		this.$removeBtn = this.$("#remove-button");
		this.$headerTitle = this.$("#header #title");
		
		this.$removeBtn.addClass("disabled");
		
		var that = this;
		$(window).on("resize", function() {
			that.resizeHandler();
		});
		
		this.resizeHandler();
		
		var len = this.archivableFolios.length;
		var that = this;
		for (var i = 0; i < len; i++) {
			var item = new App.views.archive.ArchiveFolioItemView({model: this.archivableFolios[i]});
			item.$el.on("folioArchiveChanged", function(e, isSelected, productId) {
				that.folioArchiveChangedHandler(isSelected, productId);
			});
			
			App.$archivegrid.append(item.render().el);
			
			this.folioItemViews.push(item);
		}
		
		if (this.archivableFolios.length == 0) {
			App.$archivegrid.html("<div id='archive-view-msg'>You do not have any issues to remove.</div>");
			this.$selectAllBtn.addClass("disabled");
		}
		
		this.omni_pv = App.omni.pageview("archiveView", "event1");
		
		return this;
	},
	
	resizeHandler: function() {
		App.$archivegrid.height(window.innerHeight - 81); // subtract padding.
	},
	
	close: function() {
		App.archive.trigger("view:closed");
		TcmOmni.set_pagename(this.omni_pv.prev);
		this.$el.remove();
	},
	
	selectAllButton_clickHandler: function() {
		if (this.$selectAllBtn.html() == settings.LBL_SELECT_ALL) {
			App.omni.event("lb_selectall_taps");
			
			console.log("archive view items:", this.folioItemsViews);
			
			_.each(this.folioItemViews, function(element, index, list) {
				element.setSelected(true);
			});
			
			// Populate foliosToArchive with all of the folios that aren't already in the array.
			var len = this.archivableFolios.length;
			for (var i = 0; i < len; i++) {
				var folio = this.archivableFolios[i];
				var productId = folio.productId;
				if (this.foliosToArchive.indexOf(productId) == -1) {
					this.foliosToArchive.push(productId);
				}
			}
		} else {
			App.omni.event("lb_deselectall_taps");
			
			_.each(this.folioItemViews, function(element, index, list) {
				element.setSelected(false);
			});
			
			this.foliosToArchive = [];
		}
		
		this.updateView();
	},
	
	removeButton_clickHandler: function(e) {
		e.stopPropagation();
		
		App.omni.event("lb_remove_taps");
		
		if (this.foliosToArchive.length > 0) {
			if (App._using_adobe_api) {
				var folio;
				var len = this.model.length;
				
				_.each(this.foliosToArchive, function(element, index, list) {
					var folio = App.api.libraryService.folioMap.getByProductId(element);
					if (folio.currentStateChangingTransaction() && folio.currentStateChangingTransaction().isCancelable) {
						var transaction = folio.currentStateChangingTransaction().cancel();
						transaction.completedSignal.addOnce(function() {
							folio.archive();
						}, this);
					} else if (folio.isArchivable) {
						folio.archive();
					}
				});
			}

			this.close();
		}
	},
	
	// Handler for when a user clicks a folio.
	folioArchiveChangedHandler: function(isSelected, productId) {
		var index = this.foliosToArchive.indexOf(productId);
		if (isSelected) {
			if (index == -1) {
				this.foliosToArchive.push(productId);
			}
		} else {
			if (index != -1) {
				this.foliosToArchive.splice(index, 1);
		  }
		}
		
		this.updateView();
	},
	
	updateView: function() {
		var len = this.foliosToArchive.length;
		if (len == 0) {
			this.$headerTitle.html("Select Issues");
			this.$removeBtn.addClass("disabled");
			
			this.$selectAllBtn.html(settings.LBL_SELECT_ALL);
		} else {
			if (len == 1) {
				this.$headerTitle.html("1 Issue Selected");
			} else {
				this.$headerTitle.html(len + " Issues Selected");
		  }
			
			this.$removeBtn.removeClass("disabled");
			
			this.$selectAllBtn.html(settings.LBL_DESELECT_ALL);
		}
	},
	
	close_clickHandler: function(e) {
	  e.stopPropagation();
	  App.omni.event("lb_close_taps");
	  
	  this.close();
	}
});