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
exports.after = ["startup"];
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
                config = JSON.parse(storage.getItem('OctoConfig')) || { token:null},
                hasToken = function(){
                    return config.token !== null;
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

        function listRepos(callback){
            if( OTW.user !== undefined){
                OTW.user.repos(function (err,repos) {
                    callback(repos);
                });
            } else{
                callback([{message:"user is not logged"}])
            }
        }

        function repoToTiddler(repo){
            repo.title = "$:/repositories/" + repo.name;
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
        OTW.config = configFactory();
        setDebug();

        /* Here is where startup stuff really starts */

        OTW.Github = require("$:/plugins/danielo515/OctoWiki/github.js").Github;

        if( OTW.config.hasToken()){
            OTW.client = newClient();
            OTW.user = OTW.client.getUser();
        }else{
            logger.log("There is no Token stored!");
        }

        $tw.OTW = OTW;
        logger.log("Github library loaded");
        console.log("Me cago en toooooo");

};

})();