/*\
title: $:/plugins/danielo515/OctoWiki/startup/WikiWrapper.js
type: application/javascript
module-type: startup
Title, stylesheet and page rendering
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
    };

})();