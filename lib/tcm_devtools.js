/* Dependencies:
 *   - settings/{BRAND}.js (-> settings/settings_loader.js)
 *   - jQuery
 *   - backbone.js (-> underscore.js)
 */
(function() {
    
   window.DEBUG = true;
    
   window.REPL = Backbone.View.extend({
      className: "dev-api-repl",
      events: {
        "click button": "start",
        "click .exit": "exit",
      },
      initialize: function() {
        this.logs = [];
        return this;
      },
      render: function() {
        var logs = this.logs.join("\n");
        this.$el.html("<pre class='scrollable'>"+logs+"</pre><button>start</button><div class='exit'>x</div>");
        this.$("pre")[0].scrollTop = 999999;
        return this;
      },
      start: function() {
        var that = this;
        var input = prompt("REPL input (blank to exit REPL):");
        if (!input) return;
        
        this.logs.push(">>> " + input); 
        var output;
        try {
          output = eval(input);
          try { output = JSON.stringify(output, null, "  ") } catch(e){}
        }
        catch(e) { 
          output = "error"; 
        }
        this.logs.push(output+"\n");
        this.render();
        setTimeout(function() { that.start() }, 100);
      },
      exit: function() {
        this.remove();
      }
      
   });

})();
