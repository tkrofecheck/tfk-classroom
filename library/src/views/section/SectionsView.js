/**
 * Displays the archivable folios in a grid.
 */
App.views.section.SectionsView = Backbone.View.extend({
	tagName:  "div",
	
	className: "sections-view",
	
	template: Handlebars.templates["sections.tmpl"],
	
	events: {
		"tap #close-button"			    : "closeButton_clickHandler",
		"tap #download-all-button"	: "downloadAllButton_clickHandler"
	},
	
	// A reference to the folio object from the API.
	folio: null,
	
	initialize: function() {
		console.log("App.views.section.SectionsView.initialize()");
	},
	
	render: function() {
		console.log("App.views.section.SectionsView.render()");
		
		var that = this,
		    cx = {};
		    
		cx = {
		  model: this.model
		};
		
		this.FolioStates = App.api.libraryService.folioStates;
		
		this.$el.html(this.template(cx));
		
		$(window).on("resize", function() {
			that.resizeHandler();
		});
		
		this.resizeHandler();
		
		if (App._using_adobe_api) {
			//Get a reference to the original folio object.
			this.folio = App.api.libraryService.folioMap.internal[this.model.attributes.id];
			var transaction = this.folio.getSections();
			transaction.completedSignal.addOnce(this.getSectionsHandler, this);
			
			this.$("#download-all-button").hide();
		} else {
			App.$sectionsgrid = this.$("#sections-grid");
			// Create placeholder sections.
			var sections = [{title: "Front Page", libraryPreviewUrl: this.model.get("libraryPreviewUrl")},
			                {title: "Business", libraryPreviewUrl: this.model.get("libraryPreviewUrl")},
			                {title: "Sports", libraryPreviewUrl: this.model.get("libraryPreviewUrl")},
			                {title: "Living", libraryPreviewUrl: this.model.get("libraryPreviewUrl")},
			                {title: "Home & Garden", libraryPreviewUrl: this.model.get("libraryPreviewUrl")}];

			App.$sectionsgrid = this.$("#sections-grid");
			_.each(sections, function(element, index, list) {
				var item = new App.views.section.SectionFolioItemView({model: element});
				$grid.append(item.render().el);
			});
		}
		
		this.$("#title").html(this.model.get("title"));
		
		return this;
	},
	
	getSectionsHandler: function(transaction) {
		transaction.completedSignal.remove(this.getSectionsHandler);
		
		var isShowDownloadAllButton = false;
		var that = this;

		// Sort the sections by the order in which they are added in folio producer.
		var sortedSections = this.folio.sections.sort(function(sectionA,sectionB){
			return sectionA.index - sectionB.index;
		});

		for (var i = 0; i < sortedSections.length; i++) {
			var section = sortedSections[i];
			var item = new App.views.section.SectionFolioItemView({model: section});
			item.$el.off("folioInstalled").on("folioInstalled", function() {
				that.folioInstalledHandler();
			});
			App.$sectionsgrid.append(item.render().el);
			
			if (section.state < this.FolioStates.DOWNLOADING)
				isShowDownloadAllButton = true;
		}
		
		if (isShowDownloadAllButton)
			this.$("#download-all-button").show();
	},
	
	// Handler for folioInstalled triggered from SectionFolioItemView.
	// Check to see if all of the sections are installed and if so hide the download button.
	folioInstalledHandler: function() {
		var isShowDownloadAllButton = false;
		for (var id in this.folio.sections.internal) {
			if (this.folio.sections.internal[id].state < this.FolioStates.DOWNLOADING)
				isShowDownloadAllButton = true;
		}
		
		if (!isShowDownloadAllButton)
			this.$("#download-all-button").hide();
	},
	
	resizeHandler: function() {
		App.$sectionsgrid.height(window.innerHeight - 81); // subtract padding.
	},
	
	closeButton_clickHandler: function() {
		this.$el.trigger("sectionsViewClosed");
		TcmOmni.set_pagename(this.omni_pv.prev);
		this.remove();
	},
	
	downloadAllButton_clickHandler: function() {
		for (var id in this.folio.sections.internal) {
			var section = this.folio.sections.internal[id];
			if (section.isDownloadable)
				section.download();
		}
		
		this.$("#download-all-button").hide();
	}
});