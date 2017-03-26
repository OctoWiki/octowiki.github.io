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
exports.after = ["OctoWiki"];
exports.platforms = ["browser"];
exports.synchronous = true;

    var pluginTitles={
        modified: "$:/temp/OTW/modified-tiddlers",
         deleted: "$:/temp/OTW/deleted-tiddlers",
           "new": "$:/temp/OTW/new-tiddlers"
    };

exports.startup = function(){
    var logger = new $tw.utils.Logger("OctoWiki"),
        OTW = $tw.OTW;
    function isTiddlerFile(path){
        return $tw.OTW.utils.getTiddlerType(path)
    }



    /*****************************************************************************
     ########################### EVENT LISTENERS ##################################*/
    $tw.rootWidget.addEventListener("tm-otw-load-repository",function(event) {
        var repoName = event.paramObject.repository,
            username = event.paramObject.username,
            //get the details of the repository we want to navigate
            branch='master';
        
        OTW.repository.open(username,repoName);

        OTW.repository.load(branch,function(rate)
                {
                    logger.log("Repository loaded!! ",rate);
                    OTW.sandbox.boot(); // Boot and save the sandboxed wiki
                });

    });

    $tw.rootWidget.addEventListener("tm-otw-commit-wiki",function(event){
        var data = $tw.wiki.getTiddlerData(pluginTitles.modified),
        modifiedTiddlers = data ? data.tiddlers : null;
        $tw.utils.each(modifiedTiddlers,function(tiddler){
            OTW.utils.getGithubTiddler(tiddler.title).commit(function(result){
                OTW.Debug.log("Tiddler commited!!",tiddler.title,result);
            });
        });
    });

    $tw.rootWidget.addEventListener("tm-otw-show-changes", function(event){
        function generateChangesPlugin(type,tiddlers){
            var template= {
                type: "application/json",
                "plugin-type": "import",
                "status": "pending"
                },
                customFields= { title: pluginTitles[type]},
                changedTiddlers={tiddlers:{}};
            $tw.utils.each(tiddlers,function(tiddler){
                console.log("Packing ",tiddler.title," Into ",customFields.title);
                changedTiddlers.tiddlers[tiddler.title]= tiddler;
            });
            customFields.text = JSON.stringify(changedTiddlers,null,$tw.config.preferences.jsonSpaces);
            return new $tw.Tiddler(template,customFields)
        }

        var index = OTW.repository.indexTiddlers('otw-sandbox-title'), // repo tiddlers indexed by tiddler title
            changes = OTW.sandbox.getChanges(function(title){ return !(!!index[title])}); //get the changes providing a function to determine if a tiddler is new.

        OTW.Debug.log("Indexed tiddlers:" ,index);
        OTW.Debug.log("Changes:" ,changes);

        $tw.utils.each(changes,function(titles,type){
            var tiddlers = [],process;
            if(type === 'modified'){
                process = function(title){
                    tiddlers.push(index[title]);
                }
            }
            if(type === 'new'){
                process = function(title){
                    tiddlers.push( OTW.repository.newMetadataTiddler(title));
                }
            }
            if(type === 'deleted'){
                process = function(title){
                    var tid = index[title];
                    tid && tiddlers.push(tid)
                }
            }
            $tw.utils.each(titles,process);
            $tw.wiki.addTiddler(generateChangesPlugin(type,tiddlers));
        });

    });

    $tw.rootWidget.addEventListener("tm-otw-sandbox-open-tiddler",function(event){
        console.log(event);
        var title = event.paramObject.tiddler || event.tiddlerTitle,//defaults to the caller tiddler. This is useful if tiddlers are listed on a list widget.
            tiddler = $tw.wiki.getTiddler(title),
            fields = tiddler.fields;
        if(!fields['otw-sandbox-title']){ return; }
        OTW.Debug.log("Oppening sandboxed file", title);
        OTW.sandbox.openTiddler(fields['otw-sandbox-title']);

    });

    $tw.rootWidget.addEventListener("tm-otw-logout", function(event){
        OTW.logout();
    });

    $tw.rootWidget.addEventListener("tm-otw-immersive-mode", function(event){
        $tw.pageContainer.setAttribute('hidden','true');
    });
    
    $tw.rootWidget.addEventListener("tm-otw-new-repository", function(event){
        var repoName = event.param || event.paramObject.repository || null;
        if(!repoName){
            OTW.Debug.log("Can't create null repository!");
            return;
        }
        OTW.repository.newRepository({'name': repoName, 'description':'Created with OctoWiki!'},function(repo){
            OTW.repository.load('master',function(rate)
                {
                    OTW.Debug.log("Repository loaded!! ",rate);
                    OTW.sandbox.boot(); // Boot the sandboxed wiki
                });
        });
    });

    $tw.rootWidget.addEventListener("tm-otw-set-token",function(event) {
        var token = event.paramObject.token;
        $tw.OTW.config.setToken(token);
        if($tw.OTW.config.hasToken()) {
            $tw.OTW.Login();
            $tw.OTW.utils.setOpenTiddlers(['Repositories']);
        }
    });

        logger.log("Event listeners attached");

};

})();