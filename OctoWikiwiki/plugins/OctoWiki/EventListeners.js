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

        logger.log("Loading tiddler files from branch ",branch," on repository ",repoName);
        repository.getTree(branch+'?recursive=true', function(err, tree) {
            OTW.Debug.log("Repository tree: ",tree);
            $tw.utils.each(tree,function(item){
                if(item.type === 'tree' ){
                    OTW.registerFolder(item,repoName);
                }
                if(isTiddlerFile(item.path)){
                    $tw.OTW.utils.loadTiddlerFile(item.path,repository,repoName,branch);
                }
            });
        });

    });

    $tw.rootWidget.addEventListener("tm-otw-commit-tiddler",function(event){
        var title = event.paramObject.tiddler,
            message = event.paramObject.message,
            tiddler = OTW.utils.getGithubTiddler(title);

        OTW.Debug.log("Commiting tiddler ", title);

        OTW.gitHub.commit(tiddler.getRepository(),tiddler.getPath(),tiddler.render(),message);
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