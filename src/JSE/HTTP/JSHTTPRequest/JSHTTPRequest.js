JSEPackage("JSE.HTTP.JSHTTPRequest");

JSEImportApi("JSE.HTTP");
JSEImportApi("JSE.HTML.UIComponent");

/**
 * @class JSE.HTTP.JSHTTPRequest
 * @extends JSE.HTML.UIComponent
 * @param {String} url Url de la ressource a atteindre.
 * @constructor
 */
JSE.HTTP.JSHTTPRequest = function(url)
{
	this.extend(JSE.HTML.UIComponent);
	this.prepare();
	this.url = url;
	this.HTMLElement.style.display = "none";
	this.appendToHTMLElement(document.body);
};

JSE.HTTP.JSHTTPRequest.prototype = {
	JSEwireHub : {
		"responseLoaded" : []
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
	request : function(params)
	{
		JSE.HTTP.addRequest(this, params);
	},
	_doRequest : function(params)
	{ 
		params += "&charset=UTF-8";
		//Ne pas supprimer le paramètre version
		params += "&callBackObject=HTTPResponse&version=";
		params += "&lang=" + ViaMichelin.Api.Constants.System.ApiLang;
		
		this.scriptElement = document.createElement("script");
		this.scriptElement.expando = this;
		this.scriptElement.setAttribute("type","text/javascript");
		if (navigator.isIE) this.scriptElement.onreadystatechange = this.HTTPResponseReady;
		else this.scriptElement.onload = this.HTTPResponseLoaded;
		this.scriptElement.setAttribute("src",this.url + "?" + params);
		this.HTMLElement.appendChild(this.scriptElement);
	},
	_doCancel : function()
	{
		if (navigator.isIE) this.scriptElement.onreadystatechange = "";
		else this.scriptElement.onload = "";
		this.HTMLElement.removeChild(this.scriptElement);
		this.stimulate("responseCancelled",this);
	},
	HTTPResponseReady : function()
	{
		if ((this.readyState == "loaded")||(this.readyState == "complete")) this.expando.HTTPResponseLoaded.apply(this);
	},
	HTTPResponseLoaded : function()
	{
		this.expando.response = HTTPResponse;
		this.expando.stimulate("responseLoaded",this.expando.response);
		this.expando.scriptElement = null;
		this.expando = "";
		this.onload ="";
		this.onreadystatechange = "";
	}
};

HTTPResponse = null;