/*\
title: $:/plugins/danielo515/OctoWiki/sandbox
type: application/javascript
module-type: library

Creates a fully operational sandboxed wiki
\*/

(function(){
    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    var sandbox = {};

    sandbox.boot = function (preloadTiddlers) {
        preloadTiddlers  = preloadTiddlers || [];
        if(this.tiddlers) {
            preloadTiddlers = preloadTiddlers ? this.tiddlers.concat(preloadTiddlers) : preloadTiddlers;
        }

        console.log("Booting with the following preloaded tiddlers: ",preloadTiddlers);

        var $$tw = _bootprefix( {'preloadTiddlers':preloadTiddlers} ), //create the barebones $tw object
            actualDefine = $$tw.modules.define; //save the define method that we are going to hijack

        // Here is where the sandboxing magic occurs. We have to hijack the define method to make it behave different.
        // On boot $TW registers a module to extract tiddlers from the DOM called "(DOM)".
        // We don't want that method to extract the tiddlers from the dom of our hosting TW
        // but it is absolutely necessary that it exits or TW will fail at boot, so that is the second thing we have to hijack
        $$tw.modules.define = function(moduleName,moduleType,definition) {
            console.log(moduleName);
            if (moduleName === "$:/boot/tiddlerdeserializer/dom") { //hijack the dom deserializer
                definition["_DOM_"] = definition["(DOM)"];
                delete definition["(DOM)"];
                actualDefine('oldDom', moduleType, definition);
                actualDefine(moduleName, moduleType, {"(DOM)" : function(x){
                    console.log(x);
                    console.log(definition._DOM_(x));
                    return [
                        $tw.wiki.getTiddler("$:/core").fields
                    ]}}); // we may load the tiddlers here!}))
            }
            else
            { // if not the target module, just call the original function
                    actualDefine(moduleName,moduleType,definition)
            }
           };

        return _boot($$tw); // Boot the $$tw object

    };


    exports.sandbox = sandbox;
})();