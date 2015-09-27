/*\
title: $:/plugins/danielo515/OctoWiki/startup/OTW.js
type: application/javascript
module-type: startup

This module creates the basic structure needed for the plugin.
This included the OTW Object namespace and the loading of the token
\*/
(function(){
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "OctoWiki";
exports.platforms = ["browser"];
exports.before = ["startup"];
exports.synchronous = true;

    var CONFIG_PREFIX="$:/plugins/danielo515/OctoWiki/config/";


exports.startup = function(){
        /* --- Declaration ZONE ---*/
        //============================

        var logger = new $tw.utils.Logger("OTW");

        function setDebug(){
            var debugActive = $tw.wiki.getTiddlerText(CONFIG_PREFIX + "Debug/Active");
            var debugVerbose = $tw.wiki.getTiddlerText(CONFIG_PREFIX + "Debug/Verbose");

            OTW.Debug = {
                Active: debugActive === 'yes',
                Verbose: debugVerbose === 'yes'
            }
        }

        function getConfig(configName){
            var configValue = $tw.wiki.getTiddlerText(CONFIG_PREFIX + configName,"");
            return configValue.trim();
        }

        function newClient(){
            return new OTW.Github
            ({
                token: OTW.config.getToken()
                ,auth:'oauth'
            });
        }

        function configFactory(){
            var storage = localStorage,
                config = JSON.parse(storage.getItem('OctoConfig')) || { token:undefined},
                hasToken = function(){
                    return config.token !== undefined;
                },
                setToken = function(token){
                    config.token=token;
                    saveConfig();
                },
                getToken = function(){
                    return config.token;
                },
                saveConfig = function(){
                    localStorage.setItem('OctoConfig',JSON.stringify(config));
                };

            return {
                hasToken: hasToken,
                setToken: setToken,
                getToken: getToken,
                saveConfig: saveConfig
            };

        }

    function setDefaultTiddlers(){
        var unloggedUser=['OctoWiki','Login'],
            loggedUser=['Repositories'],
            tiddlersTitles = OTW.config.hasToken() ? loggedUser : unloggedUser;

        $tw.wiki.setText('$:/DefaultTiddlers','text',null,tiddlersTitles.join('\n'));
    }

    //List all the repositories of the currently logged user
    function listRepos(callback){
            if( OTW.user !== undefined){
                OTW.user.repos(function (err,repos) {
                    callback(repos);
                });
            } else{
                callback([{message:"user is not logged"}])
            }
        }

    function getTiddlerType(path){
        var type = $tw.utils.getFileExtensionInfo(path.substr(-4));
        return type && type.type;
    }

    function loadTiddlerFile(path,repository,reponame,branch){
        branch = branch || 'master';
        logger.log("Fetching file: ",path, " from github");
        repository.read(branch, path, function(err, data) {
            var tiddlerFields =$tw.wiki.deserializeTiddlers(getTiddlerType(path),data);
            tiddlerFields["otw-path"]=  path;
            tiddlerFields["title"]= reponame + '/' + path;
            tiddlerFields["otw-alias"]= tiddlerFields.title;

            $tw.wiki.addTiddler(new $tw.Tiddler(tiddlerFields[0]));
        });
    }

    //Receives a repository object and returns a tiddler containing all the
    // repository information in tiddler's fields
        function repoToTiddler(repo){
            repo.title = "$:/repositories/" + repo.name;
            $tw.utils.each(repo.owner,function(value,name){
                repo['owner-'+name]=value;
            });
            return new $tw.Tiddler( repo );
        }

        function addRepos(repos){
            $tw.utils.each(repos,function(repo){
                $tw.wiki.addTiddler(repoToTiddler(repo));
            });
        }

        /* --- OTW namespace creation and basic initialization---*/
        var OTW = { utils: {}};
        OTW.utils.getConfig = getConfig;
        OTW.utils.newClient = newClient;
        OTW.utils.listRepos = listRepos;
        OTW.utils.addRepos= addRepos;
        OTW.utils.getTiddlerType = getTiddlerType;
        OTW.utils.loadTiddlerFile = loadTiddlerFile;
        OTW.config = configFactory();
        setDebug();

        /* --- Here is where startup stuff really starts ---*/

        OTW.Github = require("$:/plugins/danielo515/OctoWiki/github.js").Github;

    /*If we have a token already, we are ready to load the repositories*/
        if( OTW.config.hasToken()){
            OTW.client = newClient();
            OTW.user = OTW.client.getUser();
            //List the repos and add them as tiddlers
            listRepos(addRepos);
        }else{
            logger.log("There is no Token stored!");
        }

        /* -- Load default tiddlers -- */
        setDefaultTiddlers();

        $tw.OTW = OTW;
        logger.log("Github library loaded");

};

})();