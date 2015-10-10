/*\
title: $:/plugins/danielo515/OctoWiki/startup/WikiWrapper.js
type: application/javascript
module-type: startup

This module creates the required ui elements outside the main container after the wiki is rendered.
It also installs the required classes to identify the host wiki.
\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

// Export name and synchronous status
    exports.name = "otw-wrapper";
    exports.platforms = ["browser"];
    exports.after = ["render"];
    exports.synchronous = true;


    exports.startup = function() {
        $tw.pageContainer.classList.add('otw-wiki-wrapper');

        $tw.OTW.sidebar = new $tw.utils.Sidebar($tw.wiki);
        /*$tw.rootWidget.addEventListener("otw-slide",function(event) {
            $tw.sidebar.display(event.param);
        });*/
        $tw.OTW.sidebar.display('$:/plugins/danielo515/OctoWiki/ui/Sandbox/Sidebar');


    };

})();