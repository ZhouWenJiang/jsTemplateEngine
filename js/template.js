(function(global) {
	var el = svd.el
  	var diff = svd.diff
  	var patch = svd.patch
	var handlers = {};
	var domElements={};
	var templateEl;
	var tree;
	// function to replace values between double curly braces
	function injectData(data, string) {
		return string.replace(/(\{.*?\})/g,function($1){
			return resolve(data, $1);
		});
	}
	// move up the scope chain until the attribute is found
	// return the value or null
	function resolve(data, attrVal) {
		attrVal = attrVal.replace(/^\{(.+?)\}$/, '$1');
		with(data){//calcute result
			try{
				return eval(attrVal);
			}catch(e){
				if(e instanceof ReferenceError){//change scope
					if(data.__PARENT__){
						return resolve(data.__PARENT__,attrVal);
					}
				}
				return undefined;
			}
		}
	}
	// return true if a varialbe is falsy or an empty array
	function isEmpty(v) {
		return !v || (v.slice === Array.prototype.slice && v.length === 0);
	}
	function isNotEmptyStr(string){
		var str = string.replace(/(^\s*)|(\s*$)/g, "");
		return str.length;
	}
	
	function parse(id,data){
		if(!domElements[id]){
			domElements[id]={};
			domElements[id].template = document.getElementById(id).cloneNode(true);
			document.getElementById(id).innerHTML="";
			domElements[id].tree=el(domElements[id].template.tagName);
		}
		var  templateEl= domElements[id].template;
		var newTree = walk(templateEl,data);
		newTree.countChildren();
		
		var patches = diff(domElements[id].tree,newTree);
		patch(document.getElementById(id),patches);
		domElements[id].tree=newTree;
		
	}
	
	// function to recursively walk the DOM to handle data-repeat attributes
	// and handle attributes and inner text that contains curly braces
	function walk(element, data,parentVDom) {
		
		var i, len;
		// replace curlies in text nodes
		if (element.nodeType === 3) {
			// text node
			var text = injectData(data, element.nodeValue);
			if(isNotEmptyStr(text))//filter empty String
				parentVDom.children.push(text);
			return;
		}
		if (element.nodeType !== 1) {
			// not dom node (e.g. html comment)
			return;
		}
		var ele = el(element.nodeName);
		if(parentVDom)
			parentVDom.children.push(ele);
		ele.parent=parentVDom;
		
		// run all handlers
		if (runAllHandlers(element, data,ele) === false) {
			return;
		}
		// replace string values in attributes
		for (i = 0, len = element.attributes.length; i < len; i++) {
			if (!(element.attributes[i].name in handlers)) {
				ele.props[element.attributes[i].name]=injectData(data, element.attributes[i].value);
			}
		}	
		
		if (element.hasChildNodes()) {
			for (i = 0, len = element.childNodes.length; i < len; i++) {
				if (element.childNodes[i]) {
					walk(element.childNodes[i], data,ele);
				}
			}
		}
		//ele.parent=undefined;
		return ele;
	
	}
	
	function addHandler(attr, callback) {
		handlers[attr] = callback;
		return global.baffi;
	}
	
	function runAllHandlers(el, data,vdom) {
		var attr, result;
		for (attr in handlers) {
			if (!handlers.hasOwnProperty(attr) || !el.hasAttribute(attr) ) {
				continue;
			}
			result = handlers[attr].call(el, data, el.getAttribute(attr),vdom);
			if (result === false) {
				return false;
			}
		}
		return true;
	}
	
	// loop
	addHandler('for', function repeatHandler(data, attrVal,vdom) {
		var parent = vdom.parent;
		parent.children.pop();
		var items, i, len, clone;
		//items = resolve(data, attrVal);
		var keys = attrVal.split(" ");
		items = resolve(data,keys[0]);
		if(items==undefined){
			throw new ReferenceError(keys[0]+" undefined.");
		}
		var obj ={};		
		this.removeAttribute('for');
		
		// check that we have an array with one or more items
		if (!isEmpty(items)) {
			for (i = 0, len = items.length; i < len; i++) {
				
				obj[keys[2]|| "data"]=items[i];
				obj[keys[3] || "i"]=i;
				obj.__PARENT__ = data;
				walk(this, obj,parent);
			}
		}
		this.setAttribute("for",attrVal);
		return false;
	});
	
	// remove node if falsy
	addHandler('if', function ifHandler(data, attrVal,vdom) {
		if ( isEmpty( resolve(data, attrVal) ) ) {
			vdom.parent.children.pop();
			return false;
		}
	});
	
	// remove node if truthy
	addHandler('ifnot', function ifNotHandler(data, attrVal,vdom) {
		if ( !isEmpty( resolve(data, attrVal) ) ) {
			vdom.parent.children.pop();
			return false;
		}
	});
	
    global.render = parse;
})(window);