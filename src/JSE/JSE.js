/*
JSE - JavaScript Engine < http://www.jsengine.org >
Copyright (c) 2006-2012 Stephane Maccari < http://stephane.maccari.fr >

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Credits:
	- Browser detection taken from MooTools (c) 2007 Valerio Proietti
*/

//ToDo : implement ws transport
//ToDo : implement packaging through object oriented delivery (JSE.ws, JSE.xhr, JSE.script)


if (typeof(console) == "undefined") {
	console = {
			log : function()
			{
				
			}
	};
}


JSECache = {
		classes : {},
		strClasses : "",
		build: function()
		{
			this.strClasses = localStorage["JSE"];
			var split = this.strClasses.split(":|:");
			var source = "";
			while (split.length > 0)
			{
				var packageName = split.shift();
				var version = split.shift();
				var source = split.shift();
				this.classes[packageName] = {
					version : version,
					source : source
				};
				
			}
		},
		getItem : function(name)
		{
			return this.classes[name];
		},
		setItem : function(name, data, version)
		{
			this.classes[name] = {
					version : version,
					source : data
			};
			this.strClasses = this.strClasses + ((this.strClasses == "") ? "" : ":|:") + name + ":|:" + version + ":|:" + data;
		},
		write : function()
		{
			if (JSE.useCache) localStorage["JSE"] = JSECache.strClasses;
		}
};

if (typeof(window) != "undefined" && window.addEventListener) {
	window.addEventListener("unload", JSECache.write);
} else if (typeof(window) != "undefined"){
	window.attachEvent("onunload", JSECache.write);
}


if (typeof(localStorage) != "undefined" && localStorage["JSE"]) {
	JSECache.build();
}
//Default path to Javascript Packages
if (typeof(JSEPath) == "undefined") JSEPath = "";

/*JSEPaths = {
	"namespace" : {
		path : ["url1", "url2"],
		transport : ["xhr", "script", "require", "JSE.ws", "JSE.xhr", "JSE.script"]
	},
	"namespace.namespace" : {
		path : ["url1", "url2"],
		transport : ["xhr", "script", "require", "JSE.ws", "JSE.xhr", "JSE.script"]
	}
}
*/
//JSEPaths = {};

/*
 * Object augmentation
 * 	- Inheritance	
 * 		- cast(string JSEtype)
 * 		- extend(object,n arguments) 
 * 	- Events & Wires
 * 		- plugWire(JSEwire)
 * 		- unplugWire(JSEwire)
 * 		- stimulate(string event,n arguments)
 * 	- Object isolation
 * 		- isolate()
 * 	- Object preparation 
 * 		- prepare() 		
 */

JSEObject = function() {
	
};

JSEObject.prototype.cast = function(JSEtype)
{
	// Returns an object containing source object members 
	// augmented by JSEtype instanciated object members
	var result = new (eval(JSEtype))();
	var item;
	for (item in this) 
	{
		result[item] = this[item];
	}
	return result;
};
JSEObject.prototype.extend = function(object)
{
	// Prototype ou Object inheritance
	var source = null;
	if (typeof(object) != "function") source = object;
	if (object.prototype) source = object.prototype;
	
	if (source != null) {
		var item;
		for (item in source) 
		{
			if (!this[item]) this[item] = source[item];
		}
	}
	
	if (typeof(object) == "function") {
		// Constructor inheritance, applying arguments
		if (arguments.length == 1) object.call(this);
		else object.apply(this,  Array.prototype.slice.apply(arguments, [1]));
	}
};
JSEObject.prototype.isolate = JSEObject.prototype.removeEventListeners = function()
{
	// Delete all listening wires
	if (this.JSEwireHub) {
		for (var item in this.JSEwireHub) 
		{
			if ((typeof(this.JSEwireHub[item]) == "object")&&(!JSEObject.prototype[item])) {
				while (this.JSEwireHub[item].length > 0)
				{
					try {
						this.unplugWire(this.JSEwireHub[item][0]);
					} catch(e) {}
				}
			}
		}
	}
	// Delete thisObj references from JSEWires in external JSEWireHubs
	if (this.JSEExtRef) {
		for (var i=0; i < this.JSEExtRef.length; i++)
		{
			var obj = this.JSEExtRef[i];
			if (obj.JSEwireHub) {
				for (var item in obj.JSEwireHub) 
				{
					if ((typeof(obj.JSEwireHub[item]) == "object")&&(!JSEObject.prototype[item])) {
						for (var k=0; k < obj.JSEwireHub[item].length; k++)
						{
							try {
								if (obj.JSEwireHub[item][k].thisObj==this) {
									obj.unplugWire(obj.JSEwireHub[item][k]);
									k--;
								}
							} catch(e) {}
						}
					}
				}
			}
		}
		
		this.JSEExtRef = new Array();
	}
};
JSEObject.prototype.plugWire = JSEObject.prototype.addEventListener = JSEObject.prototype.on = function(wire)
{
	wire = JSE.buildWire.apply(JSE,arguments);
	if ((wire != null) && (wire.method)) {
		// own JSEWireHub
		if (!this.JSEwireHub) this.JSEwireHub = new Array();
		if (!this.JSEwireHub[wire.event]) this.JSEwireHub[wire.event] = new Array();
		this.JSEwireHub[wire.event].push(wire);
		
		// JSEExtRef on destination thisObj (for isolation)
		if (wire.thisObj) {
			try {
			if (!wire.thisObj.JSEExtRef) wire.thisObj.JSEExtRef = new Array();
			wire.thisObj.JSEExtRef.push(this);
			} catch(e) {
			}
		}
	} 
};
JSEObject.prototype.unplugWire = JSEObject.prototype.removeEventListener = function(wire)
{
	wire = JSE.buildWire.apply(JSE,arguments);
	if (wire != null) {
		// JSEWire deletion in own JSEWireHub
		if (!this.JSEwireHub) this.JSEwireHub = new Array();
		if (this.JSEwireHub[wire.event]) 
		{
			for (var i=0; i < this.JSEwireHub[wire.event].length; i++)
			{
				if ((wire.method == this.JSEwireHub[wire.event][i].method)&&((wire.thisObj == this.JSEwireHub[wire.event][i].thisObj))) 
				{
						this.JSEwireHub[wire.event].splice(i,1);
						i--;
				}
			}
		}
		// JSEWire deletion in the JSEExtRef of the destination thisObj (for isolation)
		if ((wire.thisObj)&&(wire.thisObj.JSEExtRef)&&(JSE.arrayIndexOf(wire.thisObj.JSEExtRef, this) != -1)) {
			wire.thisObj.JSEExtRef.splice(JSE.arrayIndexOf(wire.thisObj.JSEExtRef, this),1);	
		}
	}
};
JSEObject.prototype.stimulate = JSEObject.prototype.triggerEvent = JSEObject.prototype.emit = function(strEvent)
{
	if (!this.JSEwireHub) this.JSEwireHub = new Array();
	if (!this.JSEwireHub[strEvent]) this.JSEwireHub[strEvent] = new Array();
	if (this.JSEwireHub[strEvent]) {
		var tmpArray = new Array();
		for (var i=0; i < this.JSEwireHub[strEvent].length; i++) tmpArray.push(this.JSEwireHub[strEvent][i]);
		for (var i=0; i < tmpArray.length; i++) {
			var wire = tmpArray[i];
			var thisObj = ((wire.thisObj) ? wire.thisObj : this); 
			//if (typeof(tmpArray[i]) == "function") tmpArray[i](Array.prototype.slice.apply(arguments, [1])); //JSECallback
			var args = Array.prototype.slice.apply(arguments, [1]);
			if (wire.args) args = wire.args.concat(args);
			if (wire.method && (typeof(wire.method) == "function")) wire.method.apply(thisObj, args);
		}
	}
};
JSEObject.prototype.prepare = function()
{
	//Instanciate member objects and build wires
	var object = this;
	if ((JSEObject.prototype.prepare.caller != JSE.componentLoaded)&&(JSEObject.prototype.prepare.caller)&&(JSEObject.prototype.prepare.caller.prototype)) object = JSEObject.prototype.prepare.caller.prototype;
	var _wireToTreat = new Object();
	if (!this._isPrepared) {
		var item;
		for (item in object)
		{
			//Member objects instanciation
			if ((object[item] != null)&&(item != "JSEwireHub")&&(item != "JSEEvents")) {
				if (object[item].JSEtype || object[item].JSEType) 
				{
					var wires = object[item].JSEwires || object[item].JSEEvents;
					var hint = object[item].JSEhint;
					var init = object[item].JSEinit;
					var type = object[item].JSEtype || object[item].JSEType;
					var typeParams = object[item].JSEtypeParams || object[item].JSETypeParams;
					if (typeParams) {
						var tmpParams = new Array();
						for (var i=0; i < typeParams.length; i++)
						{
							if ((typeof(typeParams[i]) == "string")&&(typeParams[i].indexOf("JSEInstance") != -1)) {
								var members = typeParams[i].split(".");
								var member = this;
								for (var j=1; j < members.length; j++) {
									member = member[members[j]];
								}
								tmpParams[i] = member;
							} else tmpParams[i] = typeParams[i];
						}
						typeParams = tmpParams;
						/*this[item] = new JSEObject();
						typeParams.unshift(eval(type));
						this[item].extend.apply(this[item], typeParams);*/
						if (eval(type + ".prototype")) this[item] = Object.create(eval(type + ".prototype"));
						this[item] = (eval(type).apply(this[item], typeParams) || this[item]);
					} else {
						try{
							if (typeof(eval(type)) == "function")
								this[item] = new (eval(type))();
							else {
								var obj = (eval(type));
								if(typeof(obj) != "undefined")
									this[item] = obj;
								else
									throw type+" is undefined";
							}
						} catch (e) {
							
							JSE.stimulate("onObjectPreparationError", ((!navigator.isIE) ? e.toString() : e.message));
						}
					}
					this[item].JSEhint = hint;
					if (wires) {
						//Wiring preparation
						object[item].JSEwires = wires;
						_wireToTreat[item] = object[item];
					}
					if (init) {
						this[item].init.apply(this[item],init);
					}
					
				}
			}
			
			
		}
		//Member objects pre-wiring
		if (_wireToTreat)
		{
			for (item in _wireToTreat)
			{
				if (_wireToTreat[item].JSEwires) 
				{
					var wires = _wireToTreat[item].JSEwires;
					
					for (var i=0; i < wires.length; i++) {
						var wire = new JSEWire(wires[i].event, wires[i].method, wires[i].thisObj);
						if (typeof(wire.method) == "string") {
							var members = wire.method.split(".");
							if (members[0] == "JSEInstance") {
								var method = this;
								for (var j=1; j < members.length; j++) {
									method = method[members[j]];
								}
								wire.method = method;
							}
							else wire.method = eval(wire.method);
						}
						if (typeof(wire.thisObj) == "string") {
							var members = wire.thisObj.split(".");
							if (members[0] == "JSEInstance") {
								var thisObj = this;
								for (var j=1; j < members.length; j++) {
									thisObj = thisObj[members[j]];
								}
								wire.thisObj = thisObj;
							}
							else wire.thisObj = eval(wire.thisObj);
						}
						this[item].plugWire(wire);
					}
				}
			}
			
		}
		//Auto wiring
		if (object["JSEwireHub"] || object["JSEEvents"]) {
			var item = "JSEwireHub";
			if (object["JSEEvents"] && !object["JSEwireHub"]) item = "JSEEvents";
			var tmpHub = new Array();
			var hubItem;
			for (hubItem in object[item]) {
				if (!JSEObject.prototype[item])
				{
					tmpHub[hubItem] = new Array();
					for (var i=0; i < object[item][hubItem].length; i++)
					{
						if (object[item][hubItem][i] && object[item][hubItem][i].method) {
							var wire = new JSEWire( object[item][hubItem][i].event,  object[item][hubItem][i].method,  object[item][hubItem][i].thisObj);
							if (typeof(wire.method) == "string") {
								var members = wire.method.split(".");
								if (members[0] == "JSEInstance") {
									var method = this;
									for (var j=1; j < members.length; j++) {
										method = method[members[j]];
									}
									wire.method = method;
								}
								else wire.method = eval(wire.method);
							}
							if (wire.method) {
								if (typeof(wire.thisObj) == "string") {
									var members = wire.thisObj.split(".");
									if (members[0] == "JSEInstance") {
										var thisObj = this;
										for (var j=1; j < members.length; j++) {
											thisObj = thisObj[members[j]];
										}
										wire.thisObj = thisObj;
									}
									else wire.thisObj = eval(wire.thisObj);
								}
								tmpHub[hubItem].push(wire);
							}
						}
					}
				}
			}
			this.JSEwireHub = tmpHub;
		}
	}
};



/*
 * JSE System Objects  
 * 
 */

var oDate = new Date();

JSE = {
	JSEwireHub : {
		"onLoadingNamespace" : [],
		"onNamespaceLoadingError" : [],
		"onNamespaceLoaded" : [],
		"onImportDone" : [],
		"onInit" : [],
		"onInitError" : [],
		"onObjectPreparationError" : []
	},
	version : "2.0a",
	useCache : false,
	debug : false,
	namespaces : [],
	namespacesXHR : [],
	namespacesCache : [],
	allNamespaces : [],
	loadedNamespaces : [],
	currentPackMaster : null,
	lastNamespacePrepared : 0,
	lastNamespaceXHRPrepared : 0,
	namespaceLoadIndex : -1,
	namespaceXHRLoadIndex : -1,
	namespaceCacheLoadIndex : -1,
	namespacesLoaded : 0,
	namespacesXHRLoaded : 0,
	namespacesCacheLoaded : 0,
	isLoadingApplication : false,
	rebuildingFromCache : false,
	//Définition de la configuration de l'application en cours de JSELaunch
	applicationConfiguration : null,
	//Définition des wires de l'application en cours de JSELaunch
	applicationWires : null,
	//Applications dans la queue de JSELaunch
	nextApplications : [],
	//Stock les noms des namespaces à ne pas augmenter avec JSEObject
	externals : {},
	arrayIndexOf : function(source, match)
	{
		for (var i=0; i < source.length; i++)
		{
			if (source[i] == match) return i;
		}
		return -1;
	},
	systemInit : function()
	{
		//console.log(this.currentPackMaster + " : " + ((new Date()).getTime() - oDate.getTime()));
		//Init the JSELaunched application
		try {
			if (JSE.currentJSEPath != null) {
				JSEPath = JSE.currentJSEPath;
				JSE.currentJSEPath = null;
			}
			var loadedApplication = null;
			//Create a new instance of the JSELaunched application if needed
			if (typeof(eval(this.currentPackMaster)) == "function") loadedApplication = eval("new "+this.currentPackMaster+"()");
			else loadedApplication = eval(this.currentPackMaster);
			//Callbacks wiring
			if (this.applicationWires) {
				if ((typeof(this.applicationWires) == "function")||(this.applicationWires.method && this.applicationWires.event && this.applicationWires.event == "onInit")) {
					//Case one single onInit JSEWire
					var method = this.applicationWires.method || this.applicationWires;
					JSE.addEventListener("onInit", method, this.applicationWires.thisObj);
				} else {
					//Case list of wiring items
					for (var item in this.applicationWires)
					{
						
						if ((item != "onInit")&&(item != "onInitError")) {
							if (typeof(this.applicationWires[item]) == "function")
								loadedApplication.addEventListener(item, this.applicationWires[item]);
							else if (typeof(this.applicationWires[item]) != "undefined" && this.applicationWires[item].method) 
								loadedApplication.addEventListener(item, this.applicationWires[item].method, this.applicationWires[item].thisObj);
						} else {
							if (typeof(this.applicationWires[item]) == "function")
								this.addEventListener(item, this.applicationWires[item]);
							else if (typeof(this.applicationWires[item]) != "undefined" && this.applicationWires[item].method) 
								this.addEventListener(item, this.applicationWires[item].method, this.applicationWires[item].thisObj);
						}
					}
				}
			}
			//Call init method of the JSELaunched application
			if (loadedApplication.init) loadedApplication.init(this.applicationConfiguration);		
			
			this.applicationWires = null;
			this.applicationConfiguration = null;
			this.isLoadingApplication = false;
			//Stimulate the onInit JSE event
			this.triggerEvent("onInit", loadedApplication);
			//loadedApplication.triggerEvent("onInit", loadedApplication);
			
		} catch (e) {
			console.log(e)
			this.applicationConfiguration = null;
			this.isLoadingApplication = false;
			//Stimulate the onInitError JSE event
			this.triggerEvent("onInitError", loadedApplication, e);
		}
		if (JSE.nextApplications.length > 0) {
			var tmp = JSE.nextApplications[0];
			JSE.nextApplications.splice(0,1);
			JSELaunch(tmp[0], tmp[1], tmp[2], tmp[3]);
		}
	},
	baseLoad : function(namespace, ns, fcn)
	{
		ns.push(namespace);
		this.allNamespaces.push(namespace);
		fcn.call(this,false);
	},
	loadComponent : function(namespace)
	{
		this.baseLoad(namespace, this.namespaces, this.appendScriptComponent);
	},
	loadWSComponent : function(namespace)
	{
		if (!JSE.ws) JSE.ws = new WebSocket();
	},
	loadXHRComponent : function(namespace)
	{
		this.baseLoad(namespace, this.namespacesXHR, this.appendXHRComponent);
	},
	loadCacheComponent : function(namespace)
	{
		this.baseLoad(namespace, this.namespacesCache, this.appendCacheComponent);
	},
	loadNodeComponent : function(namespace)
	{
		this.baseLoad(namespace, this.namespaces, this.appendNodeComponent);
	},
	appendNodeComponent : function(isFromComponentLoad)
	{
		if ((!this.isLoadingModule)||((isFromComponentLoad)))	
		{
			JSE.namespaceLoadIndex++;
			this.isLoadingModule = true;
			try {
				if (eval("typeof("+this.namespaces[this.namespaceLoadIndex].name+") != 'undefined'")) {
					var JSEClone = eval(this.namespaces[this.namespaceLoadIndex].name);
					JSE.JSEClone = JSEClone;
				}
			} catch (e) {
				
			}
			require(this.namespaces[this.namespaceLoadIndex].url);
			JSE.componentLoaded();
		}
	},
	appendCacheComponent : function(isFromComponentLoaded)
	{
		if (!this.rebuildingFromCache || isFromComponentLoaded) {
			JSE.namespaceCacheLoadIndex++;
			var namespaceCache = this.namespacesCache[JSE.namespaceCacheLoadIndex].name;
			var JSEClone = false;
			try {
				if (eval("typeof("+namespaceCache+") != 'undefined'")) {
					JSEClone = eval(namespaceCache);
				}
			} catch (e) {
				
			}
			this.rebuildingFromCache = true;
			
			//Make it asynchronous
			if (JSE.namespacesXHR.length > 0) {
				setTimeout(function(){JSE.componentCacheLoaded(namespaceCache, JSEClone);},1);
			}
			else {
				JSE.componentCacheLoaded(namespaceCache, JSEClone);
			}
		} 
	},
	componentCacheLoaded : function(namespaceCache, JSEClone)
	{
		var data = JSECache.getItem(namespaceCache).source;
		/*var splitted = content.split("::");
		var data = splitted[1];
		var version = splitted[0];*/
		var oSc = document.createElement("script");
		oSc.text = data;
		document.body.appendChild(oSc);
		
		var nsEval = eval(namespaceCache);
		if (JSEClone) {
			var item;
			
			for (item in JSEClone) {
				nsEval[item] = JSEClone[item];
			}
			this.JSEClone = "";
		}
		JSE.extend(nsEval,JSEObject);
		
		//JSE.stimulate("onNamespaceLoaded",namespaceCache);
		//JSE.loadedNamespaces.push([namespaceCache, version]);
		this.rebuildingFromCache = false;
		JSE.namespacesCacheLoaded++;
		if (JSE.namespacesCacheLoaded < JSE.namespacesCache.length) {
			JSE.appendCacheComponent(true);
		}
		else if (JSE.namespacesXHRLoaded >= JSE.namespacesXHR.length && JSE.namespacesLoaded >= JSE.namespaces.length) {
			JSE.endLoadingPhase();
	
		} 
	},
	appendXHRComponent : function(isFromComponentLoad)
	{
		
			JSE.namespaceXHRLoadIndex++;
			var namespace = this.namespacesXHR[this.namespaceXHRLoadIndex].name;
			
			var xhr;
			if (window.XDomainRequest) {
				xhr = new XDomainRequest(); 
			}
			else if (window.XMLHttpRequest) {
		        xhr = new XMLHttpRequest();
		    } else if (window.ActiveXObject) {
		        xhr = new ActiveXObject("Microsoft.XMLHTTP");
		    }
					
			xhr.jsenamespace = this.namespacesXHR[this.namespaceXHRLoadIndex].name;
			xhr.namespaceLoadIndex = this.namespaceXHRLoadIndex;
			xhr.onreadystatechange = function() {
				if (this.readyState == 4) {
					//JSE.componentXHRLoaded.call(this);
				}
			};
			xhr.onprogress = function(){};
			xhr.ontimeout = function(){};
			xhr.onload = function() {
				////console.log("Loaded : " + this.namespace)	
				//Make it asynchronous (IE cache made it synchronous)
				setTimeout(function(){JSE.componentXHRLoaded.call(xhr);},1);
			};
			
			xhr.onerror = function(e)
			{
				alert("error");
			};
			xhr.timeout = 10000;
			//__JSEXmlHttpRequest = this;
			xhr.open("GET", this.namespacesXHR[this.namespaceXHRLoadIndex].url, true);
	        //alert(this.method+" : "+this.url);
	        //alert(this.url);
	    	xhr.send();
		
	},
	
	appendScriptComponent : function(isFromComponentLoad)
	{
		/*if (isFromComponentLoad) {
		try {
			if ((eval("typeof("+this.namespaces[this.namespaceLoadIndex].name+")") != "undefined")&&(!eval(this.namespaces[this.namespaceLoadIndex].name+".JSE"))) {
				JSE.namespaceLoadIndex++;
				if (JSE.namespaceLoadIndex < JSE.namespaces.length) JSE.appendScriptComponent(true);
				return;
			}
		} catch (e)
		{
			
		}}*/
		
		if ((!this.isLoadingModule)||((isFromComponentLoad)))	
		{
			JSE.namespaceLoadIndex++;
			this.isLoadingModule = true;
			var domScript = document.createElement("script");
			domScript.setAttribute("type","text/javascript");
			if (navigator.isIE) domScript.onreadystatechange = JSE.componentReady;
			else domScript.onload = JSE.componentLoaded;
			domScript.onerror = JSE.componentLoadingError;
			domScript.namespaceLoadIndex = JSE.namespaceLoadIndex;
			try {
				if (eval("typeof("+this.namespaces[this.namespaceLoadIndex].name+") != 'undefined'")) {
					var JSEClone = eval(this.namespaces[this.namespaceLoadIndex].name);
					domScript.JSEClone = JSEClone;
				}
			} catch (e) {
				
			}
			domScript.setAttribute("src",this.namespaces[this.namespaceLoadIndex].url+((JSE.debug) ? "?debug="+(new Date()).getTime() : ""));
			this.stimulate("onLoadingNamespace", this.namespaces[this.namespaceLoadIndex].name);
			var body = document.getElementsByTagName("body")[0];
			var head = document.getElementsByTagName("head")[0];
			if (body) body.appendChild(domScript);
			else if (head) head.appendChild(domScript);
		}
	},
	componentLoadingError : function()
	{
		JSE.stimulate("onNamespaceLoadingError", JSE.namespaces[JSE.namespaceLoadIndex].name);
	},
	componentXHRLoaded : function(isFromComponentLoad)
	{
		JSE.namespacesXHRLoaded++;
		//eval(this.responseText);
		
		try {
			if (eval("typeof("+this.jsenamespace+") != 'undefined'")) {
				var JSEClone = eval(this.jsenamespace);
				this.JSEClone = JSEClone;
			}
		} catch (e) {
			
		}
		//localStorage[this.namespace] = this.responseText;
		if (JSE.useCache) JSECache.setItem(this.jsenamespace, this.responseText, "?");
		
		var domScript = document.createElement("script");
		domScript.setAttribute("type","text/javascript");
		domScript.text = this.responseText;
		var body = document.getElementsByTagName("body")[0];
		var head = document.getElementsByTagName("head")[0];
		domScript.JSEnamespace = this.jsenamespace;
		domScript.JSEClone = this.JSEClone;
				
		if (body) body.appendChild(domScript);
		else if (head) head.appendChild(domScript);
		
		var nsEval = eval(this.jsenamespace);
		if (this.JSEClone) {
			var item;
			
			for (item in this.JSEClone) {
				nsEval[item] = this.JSEClone[item];
			}
			this.JSEClone = "";
		}
		JSE.extend(nsEval,JSEObject);
		JSE.stimulate("onNamespaceLoaded", this.jsenamespace);
		//JSE.isLoadingModule = false;
		if (JSE.namespacesXHRLoaded < JSE.namespacesXHR.length) {
				//JSE.appendXHRComponent(true);
				
			}
			else if (JSE.namespacesLoaded >= JSE.namespaces.length && JSE.namespacesCacheLoaded >= JSE.namespacesCache.length) {
				
				JSE.endLoadingPhase();
		
			}
		//	this.onload = "";
		////console.log("XHR Loaded : " + this.namespaceLoadIndex + " ("+JSE.namespacesXHRLoaded+"/" + JSE.namespacesXHR.length + ") : " + this.namespace);
		
	},
	endLoadingPhase : function()
	{
		for (var i=0; i < JSE.namespacesCache.length; i++) {
			if (typeof(eval(JSE.namespacesCache[i].name)) != "function" && !JSE.externals[JSE.namespacesCache[i].name]){
				try {
					eval(JSE.namespacesCache[i].name).prepare();
				} catch (e) {
					//console.log("***********************Error on :" + JSE.namespacesCache[i].name);
					//console.log(e);
				}
			}
			
		}
		//JSE.lastNamespaceXHRPrepared = JSE.namespacesXHR.length - 1;
		for (var i=JSE.lastNamespaceXHRPrepared; i < JSE.namespacesXHR.length; i++) {
			if (typeof(eval(JSE.namespacesXHR[i].name)) != "function" && !JSE.externals[JSE.namespacesXHR[i].name]){
				try {
					eval(JSE.namespacesXHR[i].name).prepare();
				} catch (e) {
					//console.log("***********************Error on :" + JSE.namespacesXHR[i].name);
					//console.log(e);
				}
			}
			
		}
		if (JSE.namespacesXHR.length > 0) JSE.lastNamespaceXHRPrepared = JSE.namespacesXHR.length - 1;
		
		for (var i=JSE.lastNamespacePrepared; i < JSE.namespaces.length; i++) {
			if (typeof(eval(JSE.namespaces[i].name)) != "function" && !JSE.externals[JSE.namespaces[i].name])
			eval(JSE.namespaces[i].name).prepare();
		}
		if (JSE.namespaces.length > 0) JSE.lastNamespacePrepared = JSE.namespaces.length - 1;
		//Controller initialization
		JSE.isLoadingModule = false;
		JSE.rebuildingFromCache = false;
		JSE.triggerEvent("onImportDone");
	},
	componentLoaded : function()
	{
		var nsEval = eval(JSE.namespaces[this.namespaceLoadIndex].name);
		if (this.JSEClone) {
			var item;
			
			for (item in this.JSEClone) {
				nsEval[item] = this.JSEClone[item];
			}
			this.JSEClone = "";
		}
		////console.log("SCRIPT Loaded : " + this.namespaceLoadIndex + " ("+JSE.namespacesLoaded+"/" + JSE.namespaces.length + ") : " + JSE.namespaces[this.namespaceLoadIndex].name);
		JSE.extend(nsEval,JSEObject);
		var obj = JSE.namespaces[this.namespaceLoadIndex].name.split(".");
		obj = obj[obj.length - 1];
		//if (JSE.namespaces[this.namespaceLoadIndex].alias) eval(this.namespaces[this.namespaceLoadIndex].alias + "=" + JSE.namespaces[this.namespaceLoadIndex].name);
		//if (eval("typeof("+obj+") == 'undefined'")) eval(obj + "=" + JSE.namespaces[this.namespaceLoadIndex].name);
		JSE.stimulate("onNamespaceLoaded", JSE.namespaces[this.namespaceLoadIndex].name);
		JSE.namespacesLoaded++;
		if (JSE.namespacesLoaded < JSE.namespaces.length) {
				if (this === JSE) JSE.appendNodeComponent(true);
				else JSE.appendScriptComponent(true);
		}
		else if (JSE.namespacesXHRLoaded >= JSE.namespacesXHR.length && JSE.namespacesCacheLoaded >= JSE.namespacesCache.length) {
			JSE.endLoadingPhase();
	
		}
		this.onload = "";
	},
	componentReady : function()
	{
		if ((this.readyState == "loaded")||(this.readyState == "complete")) {
			this.onreadystatechange = "";
			JSE.componentLoaded.call(this);
		}
	},
	hasNamespace : function(namespace)
	{
		for (var i=0; i < this.namespaces.length; i++) {
			if (this.namespaces[i].equals(namespace)) return true;
		}
		/*for (var i=0; i < this.namespacesXHR.length; i++) {
			if (this.namespacesXHR[i].equals(namespace)) return true;
		}*/
		//For non JSEImported objects
		try {
			if ((typeof(eval(namespace.name)) != "undefined")&&(!eval(namespace.name).JSE)) return true;
		} catch (e) {
			return false;
		}
		return false;
	},
	extend : function(src, dest)
	{
		var item;
		if (src.prototype) src = src.prototype;
		for (item in dest.prototype) {
			if (typeof(src[item]) == "undefined") src[item] = dest.prototype[item];
		}
	},
	buildWire : function()
	{
		//Cas wire
		if ((arguments.length == 1)&&(arguments[0].method)) {
			return arguments[0];
		}
		//Cas autre
		if (arguments.length > 1) {
			//Cas JSECallback
			if (typeof(arguments[1]) == "function" && arguments[1].method) {
				//console.log("cas JSECallback: " + arguments[1].arguments)
				return new JSEWire(arguments[0], arguments[1].method, arguments[1].thisObj, arguments[1].args);
			}
			return new JSEWire(arguments[0], arguments[1], arguments[2], arguments[3]);
		}
		return null;
	},
	alertMode : function()
	{
		JSE.unplugWire("onInitError", this._alert);
		JSE.plugWire("onInitError", this._alert);
	},
	_alert : function(a,b)
	{
		alert(b.message);
	}
};
JSE.extend(JSE, JSEObject);





//Check XMLHTTPREQUEST level 2 or XDR capabilities
JSE.xhr2 = false;
if (typeof(window) != "undefined" && window.XDomainRequest) {
	JSE.xhr2 = true;
}
else if (typeof(window) != "undefined" && window.XMLHttpRequest) {
    var xhr = new XMLHttpRequest();
    if (xhr.withCredentials !== undefined) JSE.xhr2 = true;
    delete xhr;
}

JSENamespace = function(name, url)
{
	//TODO: check integrity for JSEPaths against xhr2 and document.domain once
	
	this.name = name;
	var basePath = this.name.replace(/\./g,"/");
	basePath += "/" + this.name.split(".")[this.name.split(".").length - 1] + ".js";
	this.transport = "script";
	if (typeof(JSEPaths) != "undefined") {
		
		var splitted = name.split(".");
		while (splitted.length > 0) {
			var oPath = JSEPaths[splitted.join(".")];
			if (oPath && oPath.path) {
				if (typeof(oPath.path) == "string") {
					this.url = oPath.path + basePath;
				} else if (oPath.path.length == 1) {
					this.url = oPath.path[0] + basePath;
				} else {
					var paramValue = 0;
					for (i = 0; i < name.length; i++) {
						paramValue += name.charCodeAt(i);
					}
					var serverIndex = paramValue % oPath.path.length;
					this.url = oPath.path[serverIndex] + basePath;
				}
				
				this.transport = ((oPath.transport) ? oPath.transport : "script");
				break;
			}
			splitted.pop();
		}
	}
	if (!this.url) {
		if ((url)&&(url != "")) {
			this.url = url + basePath;
		}
		else {
			this.url = JSEPath + basePath;
		}
	}
};
JSENamespace.prototype.equals = function(namespace)
{
	if (this.name == namespace.name) return true;
	return false;
}; 

JSEImport = function(packageName, packageURL)
{
	if (JSE.currentPackMaster == null) JSE.currentPackMaster = packageName;
	var namespace = new JSENamespace(packageName, packageURL);
	if (!JSE.hasNamespace(namespace)) {
		if (JSE.useCache && JSECache.getItem(packageName)) {
			JSE.loadCacheComponent(namespace);
		}
		else if (namespace.transport == "xhr") JSE.loadXHRComponent(namespace);
		else if (namespace.transport == "require") JSE.loadNodeComponent(namespace);
		else if (namespace.transport == "ws" && window && "WebSocket" in window) JSE.loadWSComponent(namespace);
		else JSE.loadComponent(namespace);
	}
};
//JSEPackage
JSEPackage = function(name, external)
{
	var names = name.split(".");
	var object = (typeof(window) != "undefined") ? window : global;
	for (var i=0; i < names.length; i++) { 
            if (!object[names[i]]) { 
                    object[names[i]] = new JSEObject(); 
                    object[names[i]].JSE = true;
            } 
            object = object[names[i]]; 
    } 
    if (external) {
    	JSE.externals[name] = true;
    }
	
};
JSEWire = function(event, method, thisObj, args)
{
	this.event = event;
	this.method = method;
	this.thisObj = thisObj;
	this.args = args;
};
JSECallback = function(fcn, thisObj)
{
	var args = null;
	if (arguments.length > 2) {
		args = Array.prototype.slice.apply(arguments,[2]);
	}
	var result = function() {
		var arg = arguments;
		if (args != null) arg = args.concat(arguments);
		fcn.apply(thisObj, arg);
	};
	result.method = fcn;
	result.thisObj = thisObj;
	result.args = args;
	return result;
};


/*
 * JSE Application launcher
 * 
 * 		- JSELaunch(object, configuration object, callBackWires, rootURL)
 */
JSELaunch = function(application, conf, callBackWires, rootURL)
{
	oDate = new Date();
	
	
	
	if (!JSE.isLoadingApplication) {
		JSE.isLoadingApplication = true;
		JSE.JSEwireHub["onInit"] = new Array();
		if (callBackWires) {
			
			JSE.applicationWires = callBackWires;
			
		}
		if (conf) JSE.applicationConfiguration = conf;
		else JSE.applicationConfiguration = null;
		JSE.currentPackMaster = application;
		
		var namespace = new JSENamespace(application);
		if (!JSE.hasNamespace(namespace)) {
			JSE.currentJSEPath = JSEPath;
			
			if (rootURL) JSEPath = rootURL;
			JSEImport(application);
		}
		else JSE.systemInit();
		
	} else {
		JSE.nextApplications.push([application, conf, callBackWires, rootURL]);
		/*JSE.plugWire(new JSEWire("onInit",function() {
			
			if (JSE.nextApplications.length > 0) {
				var tmp = JSE.nextApplications[0];
				JSE.nextApplications.splice(0,1);
				JSELaunch(tmp[0], tmp[1], tmp[2], tmp[3]);
			}	
		},JSE));*/
	}
} 
JSE.addEventListener("onImportDone", JSE.systemInit, JSE);
/*
 * Browser detection
 * 
 * 		- navigator.isIE
 * 		- navigator.isIE6
 * 		- navigator.isIE7
 * 		- navigator.isSafari
 * 		- navigator.isSafari2
 * 		- navigator.isSafari3
 * 		- navigator.isMozilla
 * 		- navigator.isOpera
 * 		- navigator.isJSECompatible
 */
if (typeof(window) != "undefined") {
	window.xpath = !!(document.evaluate);
	if (window.ActiveXObject && !window.opera) navigator.isIE = navigator[window.XMLHttpRequest ? 'isIE7' : 'isIE6'] = true;
	else if (document.childNodes && !document.all && !navigator.taintEnabled) navigator.isSafari = navigator[window.xpath ? 'isSafari3' : 'isSafari2'] = true;
	else if (document.getBoxObjectFor != null) navigator.isMozilla = true;
	else if (window.mozInnerScreenX != null) navigator.isMozilla = true;
	navigator.isOpera = window.opera;
	navigator.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	navigator.isJSECompatible = navigator.isIE || navigator.isMozilla || navigator.isOpera || navigator.isSafari3 || navigator.isChrome;
}

