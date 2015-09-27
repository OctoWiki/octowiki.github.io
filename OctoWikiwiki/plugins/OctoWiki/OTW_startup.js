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
                Verbose: debugVerbose === 'yes',
                log: function(message){
                if(this.Active){logger.log(message)}
            }
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
                    return config.token ? true : false;
                },
                setToken = function(token){
                    config.token=token.trim();
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
        var unloggedUser=['OctoWiki'],
            loggedUser=['Repositories'],
            tiddlersTitles = OTW.config.hasToken() ? loggedUser : unloggedUser;

        $tw.wiki.setText('$:/DefaultTiddlers','text',null,tiddlersTitles.join('\n'));
    }

    /*-- Force the navigation to the provided list of tiddlers
         closing all the other tiddlers --*/
    function setOpenTiddlers(tiddlersTitles){
        var StoryList = {title:'$:/StoryList', list: tiddlersTitles};
        $tw.wiki.addTiddler( new $tw.Tiddler(StoryList));
    }

    function setTiddlerText(title,text){
        $tw.wiki.setText(title,'text',null,text);
    }

    function openTiddler(title){
        var OpenedTiddlers = $tw.wiki.getTiddlerList("$:/StoryList");
        OpenedTiddlers.push(title);
        var StoryList = {title:'$:/StoryList',list:OpenedTiddlers};
        $tw.wiki.addTiddler( new $tw.Tiddler(StoryList));
    }

    function Login(){
        OTW.client = newClient();
        OTW.user = OTW.client.getUser();
        //Once logged show the logout button
        setTiddlerText(
            "$:/state/OctoWiki/IsLogged",
            'yes');
        //List the repositories and add them as tiddlers
        listRepos(addRepos);
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
        var type = $tw.utils.getFileExtensionInfo(getFileExtension(path));
        return type && type.type;
    }

    function getFileExtension(path){
        return path.substr(path.lastIndexOf("."))
    }

    function loadTiddlerFile(path,repository,reponame,branch){
        branch = branch || 'master';
        logger.log("Fetching file: ",path, " from github");
        function parseGithubTiddler(tiddlerData){
            var tiddlerFields =$tw.wiki.deserializeTiddlers(getTiddlerType(path),tiddlerData)[0];
            if (tiddlerFields) {
            } else {
                //If the default parser for this tiddler did not work, try to parse it as text/plain
                OTW.Debug.log("Were unable to parse " + path + ". Trying to import as text/plain");
                OTW.Debug.log(tiddlerData);
                tiddlerFields = $tw.Wiki.tiddlerDeserializerModules["text/plain"](tiddlerData, {});
                if (!tiddlerFields)
                    return false
            }
            tiddlerFields["otw-path"]=  path;
            tiddlerFields["otw-tags"]=  tiddlerFields.tags;
            delete tiddlerFields.tags; //remove tiddler tags to avoid interactions with current wiki
            tiddlerFields["otw-repository"]=  reponame;
            tiddlerFields["otw-alias"]= tiddlerFields.title;
            tiddlerFields["title"]= reponame + '/' + path;
            return new $tw.Tiddler(tiddlerFields)
        }

        repository.read(branch, path, function(err, data) {
            if(err){
                logger.log("Error fetching file ",path, err);
                return
            }
            var newTiddler=parseGithubTiddler(data);
            if(newTiddler){
                $tw.wiki.addTiddler(newTiddler);
                openTiddler(newTiddler.fields.title);

            }
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
        OTW.utils.setOpenTiddlers =setOpenTiddlers;
        OTW.Login = Login;
        OTW.config = configFactory();
        setDebug();

        /* --- Here is where startup stuff really starts ---*/

        OTW.Github = require("$:/plugins/danielo515/OctoWiki/github.js").Github;

    /*If we have a token already, we are ready to login and load the repositories*/
        if( OTW.config.hasToken()){
            Login();
        }else{
            logger.log("There is no Token stored!");
        }

        /* -- Load default tiddlers -- */
        setDefaultTiddlers();

        $tw.OTW = OTW;
        logger.log("Github library loaded");

};

})();