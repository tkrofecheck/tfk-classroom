/**
 * Displays the login dialog that includes two links, "Forgot Password" and "Sign in".
 */
App.views.dialogs.GradeLevelDialog = Backbone.View.extend({
	tagName:  "div",
	
	className: "modal-background-grey",
	
	template: Handlebars.templates["dialog-grade-level.tmpl"],
	
	events: {
		"click"                   : "clickHandler",
		"click #close"            : "cancel_clickHandler",
		"click .grade"            : "submit_clickHandler"
	},
	
	initialize: function() {
		console.log("App.views.dialogs.GradeLevelDialog.initialize()");
		this.render().$el.appendTo("body");
    this.open();
	},
	
	render: function(e) {
		console.log("App.views.dialogs.GradeLevelDialog.render()");
		var that = this,
		    cx = {};
		
		cx = {
		  settings: settings
		};
		
		this.$el.html(this.template(cx));

		return this;
	},
	
	open: function(e) {
	  this.$("#gradelevel").addClass("pop");
	},
	
	clickHandler: function(e) {
		e.stopPropagation();
		//preview-dialog-content-container
		var clientX = e.clientX;
		var clientY = e.clientY;
		var $gradelevel = this.$("#gradelevel");
		var offset = $gradelevel.offset();
		if (clientX < offset.left ||
		    clientX > offset.left + $gradelevel.width() ||
		    clientY < offset.top ||
		    clientY > offset.top + $gradelevel.height()) {
			  this.close();
		}
	},
	
	submit_clickHandler: function(e) {
		e.stopPropagation();
		
		App.gradeLevel = e.currentTarget.id;

		App.grade.trigger("level:updated");
		this.$el.trigger("gradeSelectionSuccess");
		
		this.close();
	},
	
	cancel_clickHandler: function(e) {
	  this.close();
	},
	
	close: function() {
		this.$el.unbind();
		this.$el.remove();
	}
});
