JSEPackage("JSE.HTTP");

/**
 * @namespace JSE.HTTP
 */
JSE.HTTP = {
	JSEwireHub : {
		"responseLoaded" : [],
		"onRequestLaunched" : [],
		"onRequestLoaded" : [],
		"onRequestCancelled" : []
	},
	currentRequest : -1,
	isRequesting : false,
	requests : [],
	asyncRequests : [],
	freeze : false,
	addRequest : function(request, params)
	{
		this.requests.push([request, params+"&charset=UTF-8"]);
		this.nextHTTPCall();
	},
	addAsyncRequest : function(req)
	{
		if (!this.freeze) {
			this.freeze = true;
			this.asyncRequests.push(req);
			var index = (this.asyncRequests.length - 1);
			this.freeze = false;
			req.unplugWire(new JSEWire("requestLaunched", this._stimulateLaunch, this));
			req.unplugWire(new JSEWire("responseLoaded", this._stimulateLoaded, this));
			req.unplugWire(new JSEWire("responseCancelled", this._stimulateCancelled, this));
			req.plugWire(new JSEWire("requestLaunched", this._stimulateLaunch, this));
			req.plugWire(new JSEWire("responseLoaded", this._stimulateLoaded, this));
			req.plugWire(new JSEWire("responseCancelled", this._stimulateCancelled, this));
			return index;
			
		} else return this.addAsyncRequest(req);
	},
	_stimulateLaunch : function()
	{
		this.stimulate("onRequestLaunched");
	},
	_stimulateLoaded : function()
	{
		this.stimulate("onRequestLoaded");
	},
	_stimulateCancelled : function()
	{
		this.stimulate("onRequestCancelled");
	},
	nextHTTPCall : function()
	{
		if (!this.isRequesting)
		{
			this.currentRequest++;
			if (this.requests.length > this.currentRequest)
			{
				this.isRequesting = true;
				var wires = this.requests[this.currentRequest][0].JSEwireHub["responseLoaded"];
				this.JSEwireHub["responseLoaded"] = new Array();
				for (var i=0; i < wires.length; i++) this.plugWire(wires[i]);
				this.requests[this.currentRequest][0].JSEwireHub["responseLoaded"] = new Array();
				this.requests[this.currentRequest][0].plugWire({
					event : "responseLoaded",
					method : JSE.HTTP._responseLoaded,
					thisObj : JSE.HTTP
				});
				this.requests[this.currentRequest][0]._doRequest(this.requests[this.currentRequest][1]);
			} else {
				this.currentRequest--;
			}
		}
	},
	_responseLoaded : function()
	{
		var wires = this.JSEwireHub["responseLoaded"];
		this.requests[this.currentRequest][0].JSEwireHub["responseLoaded"] = new Array();
		for (var i=0; i < wires.length; i++) this.requests[this.currentRequest][0].plugWire(wires[i]);
		this.stimulate("responseLoaded",this.requests[this.currentRequest][0].response);
		this.isRequesting = false;
		this.nextHTTPCall();
	}	
};