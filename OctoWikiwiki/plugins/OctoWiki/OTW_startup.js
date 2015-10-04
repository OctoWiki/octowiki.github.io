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

        var logger = new $tw.utils.Logger("OTW"),
            OTW = { utils: {}, gitHub:{} }; // Our main scope!
            OTW.sandbox = require('$:/plugins/danielo515/OctoWiki/sandbox').sandbox;
            OTW.sandbox.tiddlers = []; //Store for the tiddlers to sandbox
            OTW.sandbox.folders = {}; //Hasmap of folders
            OTW.sandbox.files = {};

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
        var currentRepository, repoName,
            itemsCount,itemsToLoad,loadedItems,
            setSelected = function(repo,name){
                reset();
                currentRepository = repo;
                repoName = name;
            },
            isSelected = function (name) {
            return repoName === name;
            },
            getSelected = function(){
            return currentRepository;
        };

        function reset(){
            currentRepository = null; repoName = null;
            itemsCount = 0, itemsToLoad=0,loadedItems=0;
        }

        function list(branch,callback){
            currentRepository.getTree(branch +'?recursive=true',function(err,tree){
                if(err){
                    OTW.Debug.log('Error listing repository! ',err);
                    console.log('The repository was nos listed. Aborting');
                    return
                }
                else
                {
                    OTW.Debug.log("Repository tree: ",tree);
                    itemsCount = tree.length;
                    callback(tree);
                }
            });
        }

        function loadFile(path,branch,callback){
            branch = branch || 'master';
            OTW.Debug.log("Fetching file: ",path, " from github");
            currentRepository.read(branch, path, function(err, data) {
                itemsToLoad--; // one item less to process
                if(err){
                    logger.log("Error fetching file ",path, err);
                    return
                }
                loadedItems++; //register success
                callback(data);
            });
        }

        function load(branch,callback){
            OTW.Debug.log("Loading tiddler files from branch ",branch," on repository ",repoName);
            //We need to know when we are done loading because this is asynchronous.
            // so we need to know how many left to load

            registerFolder({path:undefined},repoName); //Register the root folder of the repository
            list(branch, function(tree) {
                itemsToLoad = itemsCount;
                $tw.utils.each(tree,function(item){
                    OTW.Debug.log("Loading item ",item, " - Count: ",itemsCount,". ",itemsToLoad, " items left");
                    if(item.type === 'tree' ){ //if it is a dir just register it
                        itemsToLoad--; loadedItems++;
                        OTW.registerFolder(item,repoName);
                        return;
                    }
                        if(isTiddlerFile(item.path)){
                            loadFile(item.path,branch,
                                function(data){
                                    registerFile(item,repoName);
                                    loadTiddlerFromGithub(item,data);});
                        } else{
                            itemsToLoad--;loadedItems++; //We are not going to load this file anyway
                        }
                });
                executeCallback(callback);
            });
        }

        function executeCallback(callback,reportProgress){
            if(!callback) return
            if( itemsToLoad > 0){
                setTimeout(
                    executeCallback.bind(this,callback,reportProgress)
                    ,100
                );
                reportProgress && reportProgress();
            } else{
                callback(succcessRate());
            }
        }

        function succcessRate(){
            var  rate=(( itemsCount - loadedItems ) * 100) / itemsCount;
            return ["Loaded items",loadedItems,"|Items to load",itemsToLoad, "|Success rate ",(100 - rate )+"%"].join(' | ');
        }

        return {
            setSelected: setSelected,
            isSelected: isSelected,
            getSelected: getSelected,
            list: list,
            successRate:succcessRate,
            load:load
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

    function Logout(){
        OTW.config.setToken('');
        location.reload();
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

    function loadTiddlerFromGithub(metadata,tiddlerData){
        var tiddlerFields =$tw.wiki.deserializeTiddlers(getTiddlerType(metadata.path),tiddlerData)[0];
        if (!tiddlerFields) {
            //If the default parser for this tiddler did not work, try to parse it as text/plain
            OTW.Debug.log("Were unable to parse " + path + ". Trying to import as text/plain");
            OTW.Debug.log(tiddlerData);
            tiddlerFields = $tw.Wiki.tiddlerDeserializerModules["text/plain"](tiddlerData, {});
            if (!tiddlerFields)
                return false
        }

        OTW.sandbox.tiddlers.push(tiddlerFields);

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
        };

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

    function copyFieldsAsOctoFields(destination){
        $tw.utils.each(Array.prototype.slice.call(arguments, 1), function(source) {
            if(source) {
                for(var property in source) {
                    destination['otw-'+property] = source[property];
                }
            }
        });
        return destination;
    }

    /*---------------- Other stuff -------------------*/
    //====================================================

    function isTiddlerFile(path){
        return $tw.OTW.utils.getTiddlerType(path)
    }

    function registerFolder(folder,repoName){
        var folders = OTW.sandbox.folders;
        var tiddler = {
            'otw-type':'folder',
            'otw-path':folder.path,
            'list': [] //list of child files
        };

        tiddler = copyFieldsAsOctoFields(tiddler,folder);
        //the root folder is the repo name
        tiddler.title = folder.path ? [ repoName, folder.path].join('/') : repoName;
        tiddler['otw-parent'] = getParentFolder(tiddler.title);

        folders[tiddler.title]=tiddler; //Register the folder
        $tw.wiki.addTiddler(tiddler);
    }

    function registerFile(metadata,repoName){
        var tiddlerFiles=OTW.sandbox.files,
            tiddlerFields = copyFieldsAsOctoFields({},metadata);
        tiddlerFields.title = [repoName,metadata.path].join('/');

        var parent = OTW.sandbox.folders[getParentFolder(tiddlerFields.title)];

        parent.list = parent.list.slice(0); //ugly workaround because chrome refuses to work as EcMaScript describes
        parent.list.push(tiddlerFields.title); //Register this tiddler in the metadata of it's parent folder  tiddler

        tiddlerFiles[tiddlerFields.title] = tiddlerFields; // Register the metadata tiddler
        $tw.wiki.addTiddlers([tiddlerFields,parent]); // refresh the tiddler store with the new data
    }

    function getParentFolder(path){
        return path.substr(0,path.lastIndexOf('/'))
    }

        /* --- OTW namespace creation and basic initialization---*/
    //===============================================================================0

        OTW.utils.getConfig = getConfig;
        OTW.utils.newClient = newClient;
        OTW.utils.listRepos = listRepos;
        OTW.utils.addRepos= addRepos;
        OTW.isTiddlerFile = isTiddlerFile;
        OTW.utils.getTiddlerType = getTiddlerType;
        OTW.utils.loadTiddlerFile = loadTiddlerFromGithub;
        OTW.utils.setOpenTiddlers =setOpenTiddlers;
        OTW.utils.getParentFolder = getParentFolder;
        OTW.utils.getGithubTiddler = getTiddler;
        OTW.gitHub.commit = commitFile;
        OTW.registerFolder = registerFolder;
        OTW.Login = Login;
        OTW.logout = Logout;
        OTW.config = configFactory();
        OTW.repository = repository();
        OTW.wiki = new $tw.Wiki();
        OTW.wiki.addTiddler({title:"Sandboxed",text:"This tiddler is totally isolated!!"});
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