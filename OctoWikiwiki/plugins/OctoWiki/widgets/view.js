/*\
title: title: $:/plugins/danielo515/OctoWiki/Widgets/view.js
type: application/javascript
module-type: widget
View widget
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

    var Widget = require("$:/core/modules/widgets/view.js").view;

    var ViewWidget = function(parseTreeNode,options) {
        options.wiki = $tw.OTW.wiki;
        this.initialise(parseTreeNode,options);
    };

    /*
     Inherit from the base widget class
     */
    ViewWidget.prototype = new Widget();

    exports['otw-view'] = ViewWidget;

})();
