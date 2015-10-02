/*\
title: $:/plugins/ahahn/unibar/fireonrender.js
type: application/javascript
module-type: widget

fire action on render widget
Created by Andreas Hahn for his unibar plugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CommonAction = require("$:/plugins/ahahn/unibar/commonAction.js").commonAction;

var FireOnRenderWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
	this.setup(false, true, [], true);
	this.state = undefined;
};

/*
Inherit from the base widget class
*/
FireOnRenderWidget.prototype = new CommonAction();
	
FireOnRenderWidget.prototype.render = function(parent, nextSibling) {
	CommonAction.prototype.render.call(this, parent, nextSibling);
	this.invokeActions(this, {});
}

	
exports.fireonrender = FireOnRenderWidget;

})();
