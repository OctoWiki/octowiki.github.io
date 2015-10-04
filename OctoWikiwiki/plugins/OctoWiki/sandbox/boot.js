var fakeWindow = {eval: window.eval}, bootPrefix=$tw.wiki.getTiddler('$:/boot/bootprefix.js').fields.text,
bootCode=[ bootPrefix , $tw.wiki.getTiddler('$:/boot/boot.js').fields.text  ].join('\n');
$tw.utils.extend(fakeWindow,window,{$tw:{browser:{},node:false}});
main=document.getElementsByClassName('tc-page-container-wrapper')[0];
main.parentNode.removeChild(main);
sandbox=$tw.utils.evalSandboxed(bootCode, {window:fakeWindow,exports:undefined},'OctoWiki');

//_______________ Other way. We are going to hijack the dom deserializer and then boot.
$$tw = _bootprefix();
actualDefine = $$tw.modules.define;
$$tw.modules.define = function(moduleName,moduleType,definition) { //hijack the dom deserializer
    console.log(moduleName);
    if (moduleName === "$:/boot/tiddlerdeserializer/dom") {
        definition["_DOM_"] = definition["(DOM)"];
        delete definition["(DOM)"];
        actualDefine('oldDom', moduleType, definition);
        actualDefine(moduleName, moduleType, {"(DOM)" : function(x){
            console.log(x);
            console.log(definition._DOM_(x));
            return [
            $tw.wiki.getTiddler("$:/core").fields
        ]}}); // we may load the tiddlers here!}))
    } else {
        actualDefine(moduleName,moduleType,definition)
    }
}

_boot($$tw);