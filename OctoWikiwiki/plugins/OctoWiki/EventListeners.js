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
        var client = $tw.OTW.client,
            repoName = event.paramObject.repository,
            username = event.paramObject.username,
            //get the details of the repository we want to navigate
            repository = client.getRepo(username, repoName),
            branch='master';

        OTW.repository.setSelected(repository,repoName);

        OTW.repository.load(branch,
            function(rate){
                logger.log("Repository loaded!! ",rate);
                OTW.$ = OTW.sandbox.boot(); // Boot and save the sandboxed wiki
            });

    });

    $tw.rootWidget.addEventListener("tm-otw-commit-tiddler",function(event){
        var title = event.paramObject.tiddler,
            message = event.paramObject.message,
            tiddler = OTW.utils.getGithubTiddler(title);

        OTW.Debug.log("Commiting tiddler ", title);

        OTW.gitHub.commit(tiddler.getRepository(),tiddler.getPath(),tiddler.render(),message);
    });

    $tw.rootWidget.addEventListener("tm-otw-show-changes", function(event){
        function generateChangesPlugin(type,tidList,index){
            var template= {
                type: "application/json",
                "plugin-type": "import",
                "status": "pending"
                },
                customFields= { title: pluginTitles[type]},
                changedTiddlers={};
            $tw.utils.each(tidList,function(title){
                var fileTiddler = index[title];
                if(!fileTiddler) return;
                changedTiddlers[fileTiddler.title]= fileTiddler;
            });
            customFields.text = JSON.stringify(changedTiddlers,null,$tw.config.preferences.jsonSpaces);
            return new $tw.Tiddler(template,customFields)
        }

        var index = OTW.repository.indexTiddlers('otw-sandbox-title'), // repo tiddlers indexed by tiddler title
            changes = OTW.sandbox.getChanges(function(title){ return !!index[title]}); //get the changes providing a function to determine if a tiddler is new.

        if(changes.modified.length > 0){
            $tw.wiki.addTiddler(generateChangesPlugin('modified',changes.modified,index));
        }
        if(changes.deleted.length > 0){
            $tw.wiki.addTiddler(generateChangesPlugin('deleted',changes.deleted,index));
        }
        if(changes.new.length > 0){
            $tw.wiki.addTiddler(generateChangesPlugin('new',changes.new,index));
        }
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