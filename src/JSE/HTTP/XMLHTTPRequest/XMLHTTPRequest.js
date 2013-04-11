JSEPackage("JSE.HTTP.XMLHTTPRequest");

JSEImportApi("JSE.HTTP");

/**
 * @class JSE.HTTP.XMLHTTPRequest
 * @param {String} url Url de la ressource a atteindre.
 * @param {String} method Methode d'envoi ['GET'|'POST']
 * @constructor
 */
JSE.HTTP.XMLHTTPRequest = function(url, method) {
	this.prepare();
	this.url = url;
	if (method) this.method = method;
	else this.method = "GET";
};

JSE.HTTP.XMLHTTPRequest.prototype = {
	JSEwireHub : {
		"responseLoaded" : []
	},
	response : {
		JSEhint : "Response from the server call",
		JSEtype : "Object"
	},
	/**
	 * @type String
	 */
	method : "GET",
	/**
	 * @type String
	 */
	url : "",
	/**
	 * @type String
	 */
	params : "",
	/**
	 * @type Number
	 */
	timeout : -1,
	/**
	 * @type XMLHttpRequest|ActiveXObject
	 */
	__XmlHttpRequest : null,
	request : function(params) {
		//alert("XMLHTTPRequest request : "+this.url)
		//JSE.HTTP.addRequest(this, params);
		this._doRequest(params);
	},
	_doRequest : function(params) {
		//params += "&unique="+(new Date()).getTime();
		//Ne pas supprimer le paramètre version
		if (typeof(params) == "undefined") {
			params = "";
		} else {
			params += "&";
		}
		params += "&version=&charset=UTF-8"; //&from=" + _FwkFromParam;
		if (params.indexOf("&lang=") == -1) {
			params += "&lang=" + ViaMichelin.Api.Constants.System.ApiLang;
		}
		
		//TODO : params
		if (window.XMLHttpRequest) {
	        this.__XmlHttpRequest = new XMLHttpRequest();
	    } else if (window.ActiveXObject) {
	        this.__XmlHttpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	    }
		var obj = this;
		this.__XmlHttpRequest.onreadystatechange = function() {
			if (obj.__XmlHttpRequest.readyState == 4) {
				obj.HTTPResponseLoaded();
			}
		};
		//__JSEXmlHttpRequest = this;
		this.__XmlHttpRequest.open(this.method, this.url +"?"+params, true);
        //alert(this.method+" : "+this.url);
        //alert(this.url);
        if (this.method == "GET") {
        	this.__XmlHttpRequest.send(params);
		} else {
        	this.__XmlHttpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        	this.__XmlHttpRequest.send(params);
        }
        JSE.HTTP.stimulate("onRequestLaunched");
	},
	_doCancel : function() {
		this.__XmlHttpRequest.onreadystatechange = function(){};
		this.stimulate("responseCancelled",this);
		JSE.HTTP.stimulate("onRequestCancelled");
	},
	HTTPResponseLoaded : function() {
		this.response.responseText = this.__XmlHttpRequest.responseText;
		this.response.responseXML = this.__XmlHttpRequest.responseXML;
		this.stimulate("responseLoaded",this.response);
		JSE.HTTP.stimulate("onRequestLoaded");
	}
};