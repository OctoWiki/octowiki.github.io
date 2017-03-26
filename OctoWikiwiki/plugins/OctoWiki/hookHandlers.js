/*\
title: $:/plugins/danielo515/OctoWiki/startup/hooks.js
type: application/javascript
module-type: startup

Required event listeners for loading Repositories
\*/

(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

// Export name and synchronous status
exports.name = "OctoWiki-hooks";
exports.after = ["OctoWiki"];
exports.platforms = ["browser"];
exports.synchronous = true;

    var pluginTitles={
        modified: "$:/temp/OTW/modified-tiddlers",
         deleted: "$:/temp/OTW/deleted-tiddlers",
           "new": "$:/temp/OTW/new-tiddlers"
    };

exports.startup = function(){
    var logger = new $tw.utils.Logger("OTW-hooks"),
        OTW = $tw.OTW;

    /*****************************************************************************
     ########################### HOOKS ##################################*/

    $tw.hooks.addHook('otw-sandbox-booted',function () {
        $tw.rootWidget.dispatchEvent({type:'tm-otw-immersive-mode'});
        //$tw.pageContainer.setAttribute('hidden','true');
    } );

        logger.log("Hooks registered");

};

})();