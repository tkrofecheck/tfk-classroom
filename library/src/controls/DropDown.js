(function($) {
$.fn.dropDown = function(method) {
	if (this[0][method]) {
		return this[0][ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	} else if ( typeof method === 'object' || ! method ) {
		return this.each(function() {
			var ITEM_HEIGHT = 40;
			var EXTRA_HEIGHT = 0;
			var BACKGROUND_PADDING = 5;
			var WIDTH = method.menuWidth;
			var TRIANGLE_HEIGHT = 10;
			var TRIANGLE_WIDTH = 16;
			var TRIANGLE_MARGIN_LEFT = method.triangleMarginLeft;
			
			var dropDown_class = method.className;
			
			var isOpen = false;
			var $menu;
			
			var selectedIndex;
			var $this = $(this);
			var verticalGap = method.verticalGap; // The gap between the triangle and the button that opens/closes the menu.
			
			var isRedraw;
			
			var triggered;
			
			var disabledHash = {};
	
			init(method);
			
			function init(options) {
				// Prevent duplicate event handlers - Add a handler for when a user clicks the icon to open the dropdown.
				$this.off("click").on("click", clickHandler);
			};
			
			function clickHandler() {
				if (isOpen) {
					close();
				} else {
					var numItems = $this.children().length;
					
					isOpen = true;
					triggered = false;
					
					$(window).on("resize", updateLayout);
					
					if ($menu && !isRedraw) {
						$menu.css("display", "inline");
						$menu.appendTo("body");
						$modal.appendTo("body");
					} else {
						if (isRedraw) {
							$menu.remove();
							$("body").off("mousedown touchstart", "." + dropDown_class + " .item");		
						}
						
						var itemHtml = "";
						var children = $this.children();
						var isFlipSwitch = false;
						var flipSwitchState;
						
						// Clean up children (exclude any child without a specified ID)
						children = $.grep(children, function( child, index ) {
              return ( $(child).attr("id") );
            });
						
						numItems = children.length;
						
						// Loop through each item and create the html for the items.
						for (var i = 0; i < numItems; i++) {
							var child = $(children[i]);

						  if (child.attr("class") == "flip-switch") { // The menu item contains a flip switch control.
								itemHtml += "<div class='item extra-tall' control='" + child.attr("class") + "'>";
								itemHtml +=     "<div class='control-label'>" + child.html() + "</div>";
								itemHtml +=     "<div class='flip-switch' id='" + child.attr('id') +"'></div>";
								itemHtml += "</div>";
								
								isFlipSwitch = true;
								
								flipSwitchState = child.attr('state');
								
								EXTRA_HEIGHT = EXTRA_HEIGHT + 8; // Account for menu height change
							} else {
								var cssClass = disabledHash[i] ? "item-disabled item" : "item";
								itemHtml += "<div class='" + cssClass + "' id='" + child.attr('id') + "' >" + child.html() + "</div>";
							}
							
							if (i + 1 < numItems) {// add a divider for the items except for the last one.
                itemHtml += "<hr>";
              }
						}
						
						// Add handler for when the user selects an item.
						$("body").off("mousedown touchstart").on("mousedown touchstart", "." + dropDown_class + " .item", function(e) {
							var $item = $(e.currentTarget);
							
							// Find the index of the child to see if it is disabled.
							var index = $item.index() - $item.index()  / 2; // Take into account the <hr> elements.
							if ($item.attr("control") == "flip-switch" || disabledHash[index]) // Don't do anything if the row is a flipswitch or disabled.
								return;
								
							$item.addClass("selected");
							
							// User selected an item. Show the highlight for 70ms then fadeout the menu.
							$item.one("mouseup touchend", function() {
								$menu.delay(70).fadeOut(200, function() {
									$item.removeClass("selected");// Remove the selected state.
									$item.off("mouseout touchleave mouseover touchmove");
									selectedIndex = Math.floor($item.index() / 2); // Take into account the <hr> elements.
									
									if (!triggered) {
										triggered = true;
										$this.trigger("change", $item.attr("id"));
										close();
									}
								});
							});
							
							$item.off("mouseout touchleave").on("mouseout touchleave", function() {
								$item.removeClass("selected");
							});
							
							$item.off("mouseover touchmove").on("mouseover touchmove", function() {
								$item.addClass("selected");
							});
						});
				
						var height = (ITEM_HEIGHT + EXTRA_HEIGHT) * numItems + BACKGROUND_PADDING * 2 - 8; // Subtract 8 from the height to offset padding.
		
						var html  = "<div class='" + dropDown_class + "'>";
						    html +=    "<canvas id='dropDownCanvas' width='" + WIDTH + "' height='" + TRIANGLE_HEIGHT;
						    
						    if (TRIANGLE_MARGIN_LEFT) {
						      html += "<canvas id='dropDownCanvas' width='" + WIDTH + "' height='" + TRIANGLE_HEIGHT + "' style='margin-left: " + TRIANGLE_MARGIN_LEFT + "px;";
						    }
						    
						    html +=    "'>";
						    html +=    "</canvas>";
						    html +=    "<div class='drop-down-menu-background' style='width:" + (WIDTH - 10) + "px;height:" + height + "px'>"; // subtract 10 from the width to offset padding.
						    html +=        itemHtml;
						    html +=    "</div>";
						    html += "</div>";
						
						$menu = $(html).appendTo("body");
						
						// Create a modal background to stop clicks.
						$modal = $("<div class='modal-background-grey'></div>").appendTo("body");
						$modal.css("display", "inline");
						
						$modal.off("click").on("click", modalBackground_clickHandler);
						
						// Add the flip switch. Currently this only supports one flip switch in the menu.
						$(".drop-down-menu-background .flip-switch").flipSwitch({state: flipSwitchState});
					}
					
					updateLayout();
					
					isRedraw = true;
					
					// Change the y coord in case the user scrolled. Assume the x coord does not change.
					var y = $this.offset().top + $this.height() + ($this.parents().css("position") == "fixed" ? -$(window).scrollTop() : 0) + $(window).scrollTop();
					$menu.css("top", y + verticalGap);
				}
			};
			
			// Sets the coordinates of the menu and triangle.
			function updateLayout() {
				var canvas = document.getElementById("dropDownCanvas");
				var ctx = canvas.getContext("2d");
				
				// Calculate the y coord of the bottom of the button.
				var offset = $this.offset();
				var x;
				var triangleX;
				// Attempt to position from the left.
				// Offset the x of the rectangle by 8 to the left of the arrow.
				// Add 10 to the width to take into account the padding for the inner background.
				if (offset.left - 8 + WIDTH + 10 > $(window).width()) { // dropdown will go over the right edge so shift to the left.
					x = $(window).width() - WIDTH;
					triangleX = offset.left + ($this.width() / 2) - x - 17;
				} else { // position the dropdown with the button.
					x = offset.left;
					triangleX = ($this.width() / 2);
				}

				$menu.css("left", x + 4);
				
				ctx.clearRect(0, 0, TRIANGLE_WIDTH, TRIANGLE_HEIGHT);
				// Draw the triangle.
				ctx.beginPath();
				ctx.fillStyle = "#f7f7f7";
				ctx.moveTo(triangleX, 0);
				ctx.lineTo(triangleX + TRIANGLE_WIDTH / 2, TRIANGLE_HEIGHT);
				ctx.lineTo(triangleX - TRIANGLE_WIDTH / 2, TRIANGLE_HEIGHT);
				ctx.fill();
			};
			
			function modalBackground_clickHandler(e) {
				close();
			};
			
			function close() {
				isOpen = false;
				isRedraw = true;
				
				$menu.detach();
				$modal.detach();
				
				$(window).off("resize", updateLayout);
				
				App.library.trigger("menu-close");
			};
			
			/**
			 * Public functions.
			 */
			this.getSelectedIndex = function() {
				return selectedIndex;
			};
			
			this.getSelectedLabel = function() {
				return $($this.children()[selectedIndex]).html();
			};
			
			this.getSelectedId = function() {
        return $($this.children()[selectedIndex]).attr("id");
      };
			
			// Forces a redraw of the menu the next time it is opened.
			// This should be used when the HTML of an item has changed such as toggling between login/logout.
			this.invalidate = function() {
				isRedraw = true;
			};
			
			this.setDisabled = function(index) {
				if ($menu)
					$($menu.find(".item").get(index)).addClass("item-disabled");
				
				disabledHash[index] = true;
			};
			
			this.setEnabled = function(index) {
				if ($menu)
					$($menu.find(".item").get(index)).removeClass("item-disabled");
				
				delete disabledHash[index];
			};
		});
	} else {
		$.error( 'Method ' +  method + ' does not exist on jQuery.dropDown' );
	} 
};
})(jQuery);
