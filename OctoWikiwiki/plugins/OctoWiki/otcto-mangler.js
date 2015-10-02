/*\
title: $:/plugins/danielo515/OctoWiki/Widgets/FieldMangler
type: application/javascript
module-type: widget

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

    var FieldManglerWidget = require("$:/core/modules/widgets/fieldmangler.js").fieldmangler;

    var FieldManglerCustom = function(parseTreeNode,options) {
        this.initialise(parseTreeNode,options);
        this.addEventListeners([
            {type: "tm-remove-field", handler: "handleRemoveFieldEvent"},
            {type: "tm-add-field", handler: "handleAddFieldEvent"},
            {type: "tm-remove-tag", handler: "handleRemoveTagEvent"},
            {type: "tm-add-tag", handler: "handleAddTagEvent"}
        ]);
    };
    FieldManglerCustom.prototype = new FieldManglerWidget();

    FieldManglerCustom.prototype.handleRemoveTagEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle);
	if(tiddler && tiddler.fields.tags) {
		var p = tiddler.fields.tags.indexOf(event.param);
		if(p !== -1) {
			var modification = this.wiki.getModificationFields();
			modification.tags = (tiddler.fields.tags || []).slice(0);
			modification.tags.splice(p,1);
			if(modification.tags.length === 0) {
				modification.tags = undefined;
			}
		this.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
		}
	}
	return true;
};


    FieldManglerCustom.prototype.handleAddTagEvent = function(event) {
	var tiddler = this.wiki.getTiddler(this.mangleTitle);
	if(tiddler && typeof event.param === "string") {
		var tag = event.param.trim();
		if(tag !== "") {
            var field = event.paramObject.field || 'tags'; //we want to be able to define the destination field!
			if(field === 'tags'){ // If the field is the tags field, then just call the original widget
				FieldManglerWidget.prototype.handleAddTagEvent.call(this,event);
				return
			}
			var modification = this.wiki.getModificationFields();
			modification[field] = $tw.utils.parseStringArray(tiddler.fields[field]) || [];
			$tw.utils.pushTop(modification[field],tag);
			modification[field] = $tw.utils.stringifyList(modification[field]);
			this.wiki.addTiddler(new $tw.Tiddler(tiddler,modification));
		}
	}
	return true;
};

exports['fieldmangler-ext'] = FieldManglerCustom;

})();