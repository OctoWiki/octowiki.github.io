/*\
title: $:/plugins/danielo515/OctoWiki/startup/event-listeners.js
type: application/javascript
module-type: startup

Required event listeners for loading Repositories
\*/

(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

// Export name and synchronous status
exports.name = "OctoWiki-eventListeners";
exports.after = ["startup"];
exports.platforms = ["browser"];
exports.synchronous = true;

exports.startup = function(){
       var logger = new $tw.utils.Logger("OctoWiki");

        /*****************************************************************************
         ########################### EVENT LISTENERS ##################################*/
        $tw.rootWidget.addEventListener("tm-otw-load-repository",function(event) {
            console.log(event);
        });

        logger.log("Event listeners attached");

};

})();