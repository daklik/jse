JSEPackage("JSE.HTTP.AsyncJSHTTPRequest");

JSEImportApi("JSE.HTTP");
JSEImportApi("JSE.HTML.UIComponent");

/**
 * @class JSE.HTTP.AsyncJSHTTPRequest
 * @extends JSE.HTML.UIComponent
 * @param {String} url Url de la ressource a atteindre.
 * @constructor
 */
JSE.HTTP.AsyncJSHTTPRequest = function(url) {
	this.extend(JSE.HTML.UIComponent);
	this.prepare();
	this.url = url;
	this.HTMLElement.style.display = "none";
	this.appendToHTMLElement(document.body);
	
	this.scriptElements = new Array();
	this.timeouts = new Array();
};

JSE.HTTP.AsyncJSHTTPRequest.prototype = {
	JSEwireHub : {
		"requestLaunched" : [],
		"responseLoaded" : [],
		"responseCancelled" : []
	},
	response : {
		JSEhint : "Response from the server call",
		JSEtype : "Object"
	},
	url : {
		JSEhint : "URL to call",
		JSEtype : "String"
	},
	params : {
		JSEhint : "Parameters string for the request",
		JSEtype : "String"
	},
	timeout : -1,
	setTimeout : function(timeout) {
		this.timeout = timeout;
	},
	
	request : function(params) {
		params = (typeof(params) == "undefined")
				? ""
				: params;
		var index = JSE.HTTP.addAsyncRequest(this);
		this._doRequest(params, index);
	},
	
	_doRequest : function(params, index) {
		//Ne pas supprimer le paramètre version
		var lang = ViaMichelin.Api.Constants.System.ApiLang;
		
		params += "&charset=UTF-8&callBack=JSE.HTTP.asyncRequests["+index+"].HTTPResponseLoaded";
		//params += "&from=" + _FwkFromParam;
		if (params.indexOf("&lang=") == -1) params += "&lang=" + lang;
		
		var scriptElement = document.createElement("script");
		scriptElement.setAttribute("type","text/javascript");
		scriptElement.setAttribute("src",this.url + "?" + params);
		
		//Pour nettoyage du dom après chargement
		if (navigator.isIE) scriptElement.onreadystatechange = this.readyStateChange;
		else scriptElement.onload = this.loadComplete;
		
		
		//this.scriptElements.push(scriptElement);
		//if (this.timeout != -1) this.timer = setTimeout("JSE.HTTP.asyncJSRequests["+index+"]._doCancel("+(this.scriptElements.length-1)+")", this.timeout);
		this.stimulate("requestLaunched",this.url + "?" + params);
		this.HTMLElement.appendChild(scriptElement);
	},
	
	_doCancel : function(n) {
		this.HTMLElement.removeChild(this.scriptElements[n]);
		this.stimulate("responseCancelled",this);
	},
	
	HTTPResponseLoaded : function(response) {
		if (this.timeout != -1) clearTimeout(this.timer);
		this.stimulate("responseLoaded",response);
	},
	
	readyStateChange: function () {
		if ((this.readyState == "loaded")||(this.readyState == "complete")) {
			this.onreadystatechange = "";
			JSE.HTTP.AsyncJSHTTPRequest.prototype.loadComplete.call(this);
		}
	},
	
	loadComplete: function () {
		this.parentNode.removeChild(this);
	}
};