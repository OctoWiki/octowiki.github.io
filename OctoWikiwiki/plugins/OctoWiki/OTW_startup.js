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

            var logger = new $tw.utils.Logger("OTW-Debug");

            OTW.Debug = {
                Active: debugActive === 'yes',
                Verbose: debugVerbose === 'yes',
                log: function( /*..message..*/ ){
                if(this.Active){
                    /*if( !verboseOnly || ( verboseOnly && this.verbose) ){*/
                        logger.log.apply(logger,arguments)
                }
            }
            }
        }

        function getConfig(configName){
            var configValue = $tw.wiki.getTiddlerText(CONFIG_PREFIX + configName,"");
            return configValue.trim();
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


    var repository = function(){
        var currentRepository, selected,
            setSelected = function(repo,name){
                currentRepository = repo;
                selected = name;
            },
            isSelected = function (name) {
            return selected === name;
            },
            getSelected = function(){
            return currentRepository;
        }

        return {
            setSelected: setSelected,
            isSelected: isSelected,
            getSelected: getSelected
        }
    };



    /*------------Github Stuff ----------------*/
    /*==========================================*/
    function newClient(){
        return new OTW.Github
        ({
            token: OTW.config.getToken()
            ,auth:'oauth'
        });
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

    function commitFile(repository,path,content,message){
        repository.write('master', path, content, message, function(err) {
            logger.log(err);
        });
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
            tiddlerFields["otw-title"]= tiddlerFields.title;
            tiddlerFields["title"]= reponame + '/' + path;
            tiddlerFields["otw-parent"]= getParentFolder(tiddlerFields.title);
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

    /*---------------- Tiddlers stuff -------------------*/
    //====================================================

    function setDefaultTiddlers(){
        var unloggedUser=['$:/plugins/danielo515/OctoWiki','OctoWiki'],
            loggedUser=['$:/plugins/danielo515/OctoWiki','Repositories'],
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

    function getTiddlerType(path){
        var type = $tw.utils.getFileExtensionInfo(getFileExtension(path));
        return type && type.type;
    }

    function getFileExtension(path){
        return path.substr(path.lastIndexOf("."))
    }

    function isMetadata(fieldName){
        var metadataFields = {
            'otw-path':true,
            'otw-repository':true
        }

        return metadataFields[fieldName];
    }

    function getTiddler(title){ //A wrapper around the tiddler object
        var tiddler = $tw.wiki.getTiddler(title),
            fields = tiddler && tiddler.fields || {},
            renderTemplates = { '.tid' : '$:/core/templates/tid-tiddler'};

        function getActualFields(){
            var actualFields = {};
            $tw.utils.each(fields,function(value,field){
                if(isMetadata(field)) return; //We don't want metadata fields in the original file

                var fieldName = field.replace('otw-','');
                //Checking the original field name, instead of the modified makes us sure that we are not
                // going to override a field converted from a metadata field like otw-title -> tittle
                if( !actualFields.hasOwnProperty(field) ){
                    actualFields[fieldName] = value
                }
            });

            return actualFields;
        }

        function getPath(){
            return fields['otw-path'];
        }

        function getOwner(){
            var repoTiddler = $tw.wiki.getTiddler('$:/repositories/'+ fields.title);

            return repoTiddler && repoTiddler.fields['owner-login'];
        }

        function getRepository(){
            if( OTW.repository.isSelected(fields['otw-repository']) )
            return OTW.repository.getSelected();
            else {
                return OTW.client.getRepo(getOwner(), fields['otw-repository'])
            }
        }

        function getRenderTemplate(){
            /* Render as a tid file or just as a plain text file*/
            return renderTemplates[getFileExtension(fields['otw-path'])] || '$:/core/templates/plain-text-tiddler';
        }

        //returns tex representing a tiddler as its original file
        function renderTiddler(){
            var githubFields = getActualFields();
            $tw.wiki.addTiddler(new $tw.Tiddler(githubFields)); //add the tiddler with the fields it should have to be able to render it
            var content = $tw.wiki.renderTiddler("text/plain",getRenderTemplate(),{variables: {currentTiddler: githubFields.title}});
            $tw.wiki.deleteTiddler(githubFields.title);
            return content;
        }

        return {
            getActualFields: getActualFields,
            getRenderTemplate: getRenderTemplate,
            render: renderTiddler,
            getPath: getPath,
            getOwner: getOwner,
            getRepository: getRepository
        }
    }

    /*---------------- Other stuff -------------------*/
    //====================================================

    function registerFolder(folder,repoName){
        var tiddler = {
            'otw-type':'folder',
            'otw-path':folder.path
        };
        tiddler.title = [ repoName, folder.path].join('/');
        tiddler['otw-parent'] = getParentFolder(tiddler.title);

        $tw.wiki.addTiddler(tiddler);
    }

    function getParentFolder(path){
        return path.substr(0,path.lastIndexOf('/'))
    }

        /* --- OTW namespace creation and basic initialization---*/
    //===============================================================================0
        var OTW = { utils: {}, gitHub:{} };
        OTW.utils.getConfig = getConfig;
        OTW.utils.newClient = newClient;
        OTW.utils.listRepos = listRepos;
        OTW.utils.addRepos= addRepos;
        OTW.utils.getTiddlerType = getTiddlerType;
        OTW.utils.loadTiddlerFile = loadTiddlerFile;
        OTW.utils.setOpenTiddlers =setOpenTiddlers;
        OTW.utils.getParentFolder = getParentFolder;
        OTW.utils.getGithubTiddler = getTiddler;
        OTW.gitHub.commit = commitFile;
        OTW.registerFolder = registerFolder;
        OTW.Login = Login;
        OTW.config = configFactory();
        OTW.repository = repository();
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