/*\
title: $:/plugins/danielo515/OctoWiki/Macros/removePath.js
type: application/javascript
module-type: macro

Macro that removes the path part of an absolute filename
\*/
(function(){

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    /*
     Information about this macro
     */

    exports.name = "removepath";

    exports.params = [{name:"filename"}];

    /*
     Run the macro
     */
    exports.run = function(filename) {
        return filename.substr(filename.lastIndexOf('/')+1).toString();
    };

})();