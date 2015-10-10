/*\
title: $:/plugins/danielo515/OctoWiki/widgets/sidebar
type: application/javascript
module-type: utils

Modal sidebar

\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    var widget = require("$:/core/modules/widgets/widget.js");

    var Notifier = function(wiki) {
        this.wiki = wiki;
    };

    /*
     Creates the sidebar dom element
     */
    Notifier.prototype.display = function(title,options) {
        options = options || {};
        // Create the wrapper divs
        var self = this,
            notification = document.createElement("div"),
            tiddler = this.wiki.getTiddler(title),
            duration = $tw.utils.getAnimationDuration(),
            refreshHandler;
        // Don't do anything if the tiddler doesn't exist
        if(!tiddler) {
            return;
        }
        // Add classes
        $tw.utils.addClass(notification,"otw-sidebar-frame");
        // Create the variables
        var variables = $tw.utils.extend({currentTiddler: title},options.variables);
        // Render the body of the notification
        var widgetNode = this.wiki.makeTranscludeWidget(title,{parentWidget: $tw.rootWidget, document: document, parseAsInline: true, variables: variables});
        widgetNode.render(notification,null);

        refreshHandler = function(changes) {
            widgetNode.refresh(changes,notification,null);
        };
        this.wiki.addEventListener("change",refreshHandler);

        // Add the notification to the DOM
        document.body.appendChild(notification);
        // Force layout
        $tw.utils.forceLayout(notification);

    };

    exports.Sidebar = Notifier;

})();