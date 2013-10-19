define("xiongsongsong/template/1.1.0/template",["./split"],function(require,exports,module){"use strict";function AMS_RemoveNote(a){return a.replace(/^\s*##.*$/gim,"")}function AMS_temporaryProtection(a){for(var b=0;b<AMS_PlaceholderFlag.length;b++){var c=AMS_PlaceholderFlag[b];a=a.replace(c[0],c[1].source)}return a=a.replace(/#js([\s\S]*?)#end/gm,"AMS_FLAG_JS$1AMS_FLAG_ENDJS")}function AMS_revertProtection(a){for(var b=0;b<AMS_PlaceholderFlag.length;b++){var c=AMS_PlaceholderFlag[b];a=a.replace(c[1],c[2])}return a}function AMS_ReplaceElse(a){return a=a.replace(/#(elseif)[\s]*(\([^)]+\)){1}/gm,"AMS_FLAG_ELSEIF$2"),a=a.replace(/#else/gm,"AMS_FLAG_ELSE"),a=a.replace(/AMSTEMPBLOCKS==(.*)==/gm,"\\#$1")}function AMS_TranslateIF(a){function b(){if(/#end/.test(a)){var c=a.match(/[\s\S]+?#end/)[0],g="";if(/#(if|each|js)/gm.test(c)){for(var h=[],i=0;i<d.length;i++){var j=d[i],k=c.lastIndexOf(j);k>-1&&h.push(k)}c=c.substring(Math.max.apply(null,h));var l=c.match(e),m=l[0].substring(1),n="",o="";"if"==m?(n="AMS_FLAG_IF",o="AMS_FLAG_ENDIF"):"each"==m?(n="AMS_FLAG_EACH",o="AMS_FLAG_ENDEACH"):"js"==m&&(n="AMS_FLAG_JS",o="AMS_FLAG_ENDJS"),g=c.replace(f,n+"$1"+o),"if"===m&&(g=AMS_ReplaceElse(g)),a=a.replace(c,g)}else g=c.substring(0,c.length-4),a=a.replace(c,g);b()}}function c(b){var c=/[\\]+#\{([^}]+)\}/gm;a=b.replace(c,"AMS_VARIABLE_COMMENT$1}"),a=a.replace(/#\{([^}]+)\}/gm,"AMS_PLACEHOLDER_START--$1--AMS_PLACEHOLDER_END")}a=AMS_temporaryProtection(a);var d=["#if","#each","#js"],e=/#(if|each|js)/gm,f=/(?:#if|#each|#js)([\s\S]+?)#end/gm;return b(),c(a),a}function AMS_TransportOperation(a){var b=/(AMS_FLAG_IF|AMS_FLAG_ELSEIF){1}(?:[\s]*([^)]+?\)))(.*?)(?=AMS_FLAG_ELSEIF|AMS_FLAG_ELSE|AMS_FLAG_ENDIF|AMS_FLAG_EACH|AMS_FLAG_JS|[\r\n])/gm;return a=a.replace(b,"$1AMS_OPERATION--$2--AMS_OPERATION$3")}function AMS_transportJS(a){var b=/AMS_FLAG_JS(?:[\s\S]+?)AMS_FLAG_ENDJS/gm,c=a.match(b);if(c)for(var d=0;d<c.length;d++){var e=c[d],f=e.match(/AMS_FLAG_JS([\s\S]+?)AMS_FLAG_ENDJS/);f&&(a=a.replace(e,"AMS_FLAG_JS"+encodeURIComponent(f[1])+"AMS_FLAG_ENDJS"))}return a}function AMS_transportVar(a){return a=a.replace(/^[\s]*#run(.+?)$/gm,"AMS_RUN_START$1AMS_RUN_END")}function AMS_CreateTpl(a){var b,c,d="\r\n//AMS_COMPILED\r\n";b=AMS_RemoveNote(a),b=AMS_TranslateIF(b),b=AMS_transportJS(b),b=AMS_TransportOperation(b),b=AMS_transportVar(b),b=AMS_revertProtection(b),c=b.split(/[\r\n]/);for(var e=0;e<c.length;e++){for(var f=c[e],g=AMS_SPLIT(f,AMS_IF_FLAG),h=0;h<g.length;h++){var i=g[h];AMS_IF_FLAG.test(i)?/AMS_FLAG_IFAMS_OPERATION/.test(i)?d+=i.replace(/AMS_FLAG_IFAMS_OPERATION--(.+?)--AMS_OPERATION/g,"if $1 {"):/AMS_FLAG_ELSEIFAMS_OPERATION/.test(i)?d+=i.replace(/AMS_FLAG_ELSEIFAMS_OPERATION--(.+?)--AMS_OPERATION/,"} else if $1 { "):"AMS_FLAG_ELSE"===i?d+=i.replace(/AMS_FLAG_ELSE/,"} else {"):"AMS_FLAG_ENDIF"===i?d+=i.replace(/AMS_FLAG_ENDIF/gm,"}"):/AMS_FLAG_EACH/.test(i)?d+=i.replace(AMS_forEachRe,function(a){var b=a.match(AMS_forEachRe),c=b[1].split(","),d=b[2],e=c.length>1?c[1]:"index",f=c[2]?c[2]:d;return""+(c[2]?"var "+c[2]+"="+d+";":"")+"\r\n"+"(function(){for(var "+e+"=0;"+e+"<"+f+".length;"+e+"++){\r\n"+"var "+c[0]+"="+f+"["+e+"];\r\n"}):"AMS_FLAG_ENDEACH"===i?d+=i.replace(/AMS_FLAG_ENDEACH/gm,"}})();"):/AMS_PLACEHOLDER_START/.test(i)?d+=i.replace(/AMS_PLACEHOLDER_START--(.+?)--AMS_PLACEHOLDER_END/,"echo($1);"):/AMS_FLAG_JS/.test(i)?(i.match(/AMS_FLAG_JS(.+?)AMS_FLAG_ENDJS/),d+=i.replace(/AMS_FLAG_JS(.+?)AMS_FLAG_ENDJS/,decodeURIComponent(i.match(/AMS_FLAG_JS(.+?)AMS_FLAG_ENDJS/)[1])+"\r\n")):/AMS_RUN_START/.test(i)&&(d+=i.replace(/AMS_RUN_START(.+?)AMS_RUN_END/,"$1")):i.length>0&&(d+='AMS_RENDER+="'+i.replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'";'),i.length>0&&(d+="\r\n"),h===g.length-1&&(d+='AMS_RENDER+="\\r\\n";')}d+="\r\n"}return d}function AMS_Render(AMS_VALUE,AMS_DATA,s){var head='var AMS_RENDER=" ";\r\n;function echo(s){AMS_RENDER+=s;}\r\n';for(var k in AMS_DATA)AMS_DATA.hasOwnProperty(k)&&(head+="var "+k+' = AMS_DATA["'+k+'"];\r\n');return AMS_VALUE.indexOf("//AMS_COMPILED")>=0?eval(head+AMS_VALUE):eval(head+AMS_CreateTpl(AMS_VALUE,AMS_DATA))}var AMS_SPLIT=require("./split").split,AMS_PlaceholderFlag=[[/\\#if/gm,/AMS_IF_COMMENT/gm,"#if"],[/\\#elseif/gm,/AMS_ELSEIF_COMMENT/gm,"#elseif"],[/\\#else/gm,/AMS_ELSE_COMMENT/gm,"#else"],[/\\#each/gm,/AMS_EACH_COMMENT/gm,"#each"],[/\\#end/gm,/AMS_END_COMMENT/gm,"#end"],[/\\#run/gm,/AMS_RUN_COMMENT/gm,"#run"],[/\\#js/gm,/AMS_JS_COMMENT/gm,"#js"],[/\\#\{/,/AMS_VARIABLE_COMMENT/,"#{"],[/\\\)/gim,/AMS_CLOSE/gm,")"]],AMS_OPEN_IF=["AMS_FLAG_IFAMS_OPERATION","AMS_FLAG_ELSEIFAMS_OPERATION"],AMS_CLOSE_IF="AMS_OPERATION",AMS_IF_FLAG=new RegExp("("+AMS_OPEN_IF[0]+"--(?:.+?)--"+AMS_CLOSE_IF+"|"+AMS_OPEN_IF[1]+"--(?:.+?)--"+AMS_CLOSE_IF+"|"+"AMS_FLAG_EACH(?:\\([^)]+?\\))|"+"AMS_PLACEHOLDER_START"+"--(?:.+?)--"+"AMS_PLACEHOLDER_END|"+"AMS_FLAG_JS(?:.+?)AMS_FLAG_ENDJS|"+"AMS_RUN_START(?:.+?)AMS_RUN_END|"+"AMS_FLAG_ELSE|AMS_FLAG_ENDIF|AMS_FLAG_ENDEACH)","gm"),AMS_forEachRe=/AMS_FLAG_EACH\((.+?)[\s]+in[\s]+([^\s]+)\)/;exports.render=AMS_Render,exports.compile=AMS_CreateTpl}),define("xiongsongsong/template/1.1.0/split",[],function(a,b){var c;c=c||function(a){var b,c=String.prototype.split,d=/()??/.exec("")[1]===a;return b=function(b,e,f){if("[object RegExp]"!==Object.prototype.toString.call(e))return c.call(b,e,f);var g,h,i,j,k=[],l=(e.ignoreCase?"i":"")+(e.multiline?"m":"")+(e.extended?"x":"")+(e.sticky?"y":""),m=0,e=new RegExp(e.source,l+"g");for(b+="",d||(g=new RegExp("^"+e.source+"$(?!\\s)",l)),f=f===a?-1>>>0:f>>>0;(h=e.exec(b))&&(i=h.index+h[0].length,!(i>m&&(k.push(b.slice(m,h.index)),!d&&h.length>1&&h[0].replace(g,function(){for(var b=1;b<arguments.length-2;b++)arguments[b]===a&&(h[b]=a)}),h.length>1&&h.index<b.length&&Array.prototype.push.apply(k,h.slice(1)),j=h[0].length,m=i,k.length>=f)));)e.lastIndex===h.index&&e.lastIndex++;return m===b.length?j||!e.test(""):k.push(b.slice(m)),k.length>f?k.slice(0,f):k},String.prototype.split=function(a,c){return b(this,a,c)},b}(),b.split=c});