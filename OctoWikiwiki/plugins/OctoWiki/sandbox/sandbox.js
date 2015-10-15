/*\
title: $:/plugins/danielo515/OctoWiki/sandbox
type: application/javascript
module-type: library

Creates a sandboxed fully operational tiddlywiki object.
Returns the sandboxed wiki, but also provides an interface for an easier interaction
with her(the wiki).
\*/

(function(){
    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    var sandbox = {}, $$tw, previousState, afterBoot;

    function boot (preloadTiddlers) {
        preloadTiddlers  = preloadTiddlers || [];
        if(this.tiddlers) {
            preloadTiddlers = preloadTiddlers ? this.tiddlers.concat(preloadTiddlers) : preloadTiddlers;
        }

        console.log("Booting with the following preloaded tiddlers: ",preloadTiddlers);

         $$tw = _bootprefix( {'preloadTiddlers':preloadTiddlers} ); //create the barebones $tw object
          var  actualDefine = $$tw.modules.define; //save the define method that we are going to hijack

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
                    $tw.OTW.Debug.log("Hijacked call to (DOM) with: ",x);
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

        this.tw = _boot($$tw); // Boot the $$tw object
       
        if(typeof afterBoot == "function"){
            afterBoot(); //run an after Boot function if any
        }
        
        previousState = $tw.utils.extend({},$$tw.wiki.changeCount);
        $tw.OTW.Debug.log("Initial state of sandboxed wiki: ",previousState);
        return $$tw;

    };
    
    function close(){
        $$tw.pageContainer.remove();
        if(this.tw){
            this.tw = null;
        }
        $$tw = null;
        $tw.OTW.Debug.log("Sandboxed wiki closed");
    }
    
    function registerAfterBootFunction(fn){
        if(!(typeof fn === 'function')){
           $tw.OTW.Debug.log("Can't register after boot function because it is not a function!");
            return false;
           }
        afterBoot = fn;
    }

    /*-- Force the navigation to the provided list of tiddlers
     closing all the other tiddlers --*/
    function setOpenTiddlers(tiddlersTitles){
        var StoryList = {title:'$:/StoryList', list: tiddlersTitles};
        $$tw.wiki.addTiddler( new $$tw.Tiddler(StoryList));
    }

    function openTiddler(title){
        var tw= $$tw; //in a future we may support several wikis opened at once
        var OpenedTiddlers = tw.wiki.getTiddlerList("$:/StoryList");
        OpenedTiddlers.push(title);
        var StoryList = {title:'$:/StoryList',list:OpenedTiddlers};
        tw.wiki.addTiddler( new tw.Tiddler(StoryList));
    }

    function getChanges(isNew){
    //Returns an object with deleted and modified tiddlers.
    // If a isNew function is provided it also divides the results into a new category.
    // isNew receives a title and should return true if the tiddler should be considered as new.
    // This is because a tiddler is new on certain context, and there is no way for the sandbox to determine such context
        var changes={ deleted: [], modified: [], "new":[] },
            currentState = $tw.utils.extend({},$$tw.wiki.changeCount), //get current state copying the changeCount object
            modifiedORnew = function(title){
                return typeof isNew === "function" && isNew(title) ? 'new' : 'modified' ;
            };
        $tw.utils.each(currentState, function(count,title){
            if( previousState[title] !== count) { //tiddler has changed
                var status = $$tw.wiki.tiddlerExists(title) ? modifiedORnew(title) : 'deleted';
                changes[status].push(title);
            }
        });
        return changes;
    }

    function resetChanges(){
        if($$tw){
            previousState = $$tw.utils.extend({},$$tw.wiki.changeCount);
        } else {
            return {error:"The wiki has not booted!!"}
        }
    }
    
    function getTiddler(title){
        checkState();
        var tid = $$tw.wiki.getTiddler(title); //not sure if use this or the closure variable $$tw
        return tid ? tid.fields : null
    }
    
    function renderTiddler(outputType,template,title){
        //Options should be an object including, at least, currentTiddler pointing to the tiddler you want to render.
        // we have to do this way because we are using the second argument (which is usually the title) for the render template we want to use.
        checkState();
        return $$tw.wiki.renderTiddler(outputType,template,{variables: {currentTiddler: title}});
    }
    
    function checkState(){
        if( ! $$tw || ! $$tw.wiki){
            Logger.log("Sandbox wiki has not booted!! ");
            throw "Sandbox wiki has not booted!! ";
        }else{
            return true
        }
    }

    sandbox.boot = boot;
    sandbox.close = close;
    sandbox.setOpenTiddlers = setOpenTiddlers;
    sandbox.openTiddler = openTiddler;
    sandbox.getChanges = getChanges;
    sandbox.resetChanges = resetChanges;
    sandbox.getTiddler = getTiddler;
    sandbox.renderTiddler = renderTiddler;

    exports.sandbox = sandbox;
})();