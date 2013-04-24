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
/* global JSE:true */
/* global JSELaunch:true */
/* global JSEImport:true */
/* global JSEPackage:true */
/* global JSEWire:true */
/* global JSECallback:true */
/* global XDomainRequest:false */
/* global ActiveXObject:false */
/* global global:false */
/* global JSEPath:true */
/* global JSEObject:true */


//Default path to Javascript Packages
if (typeof(JSEPath) === "undefined") {
    JSEPath = "";
}

/*JSE.Paths = {
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
//JSE.Paths = {};

/*
 * Object augmentation
 *	- Inheritance
 *		- cast(string JSEtype)
 *		- extend(object,n arguments)
 *	- Events & Wires
 *		- plugWire(JSEwire)
 *		- unplugWire(JSEwire)
 *		- stimulate(string event,n arguments)
 *	- Object isolation
 *		- isolate()
 *	- Object preparation
 *      - prepare()
 */
/*
 * JSE System Objects
 *
 */
/**
 *
 * @type {{JSEwireHub: {onLoadingNamespace: Array, onNamespaceLoadingError: Array, onNamespaceLoaded: Array, onImportDone: Array, onInit: Array, onInitError: Array, onObjectPreparationError: Array}, version: string, useCache: boolean, debug: boolean, namespaces: Array, namespacesXHR: Array, namespacesCache: Array, allNamespaces: Array, loadedNamespaces: Array, currentPackMaster: null, lastNamespacePrepared: number, lastNamespaceXHRPrepared: number, namespaceLoadIndex: number, namespaceXHRLoadIndex: number, namespaceCacheLoadIndex: number, namespacesLoaded: number, namespacesXHRLoaded: number, namespacesCacheLoaded: number, isLoadingApplication: boolean, rebuildingFromCache: boolean, applicationConfiguration: null, applicationWires: null, nextApplications: Array, externals: {}, arrayIndexOf: Function, systemInit: Function, baseLoad: Function, loadComponent: Function, loadWSComponent: Function, loadXHRComponent: Function, loadCacheComponent: Function, loadNodeComponent: Function, appendNodeComponent: Function, appendCacheComponent: Function, componentCacheLoaded: Function, appendXHRComponent: Function, appendScriptComponent: Function, componentLoadingError: Function, componentXHRLoaded: Function, endLoadingPhase: Function, componentLoaded: Function, componentReady: Function, hasNamespace: Function, extend: Function, buildWire: Function}}
 */
JSE = {
    JSEwireHub: {
        "onLoadingNamespace": [],
        "onNamespaceLoadingError": [],
        "onNamespaceLoaded": [],
        "onImportDone": [],
        "onInit": [],
        "onInitError": [],
        "onObjectPreparationError": []
    },
    version: "2.0a",
    useCache: false,
    debug: false,
    namespaces: [],
    namespacesXHR: [],
    namespacesCache: [],
    allNamespaces: [],
    loadedNamespaces: [],
    currentPackMaster: null,
    lastNamespacePrepared: 0,
    lastNamespaceXHRPrepared: 0,
    namespaceLoadIndex: -1,
    namespaceXHRLoadIndex: -1,
    namespaceCacheLoadIndex: -1,
    namespacesLoaded: 0,
    namespacesXHRLoaded: 0,
    namespacesCacheLoaded: 0,
    isLoadingApplication: false,
    rebuildingFromCache: false,
    //Définition de la configuration de l'application en cours de JSELaunch
    applicationConfiguration: null,
    //Définition des wires de l'application en cours de JSELaunch
    applicationWires: null,
    //Applications dans la queue de JSELaunch
    nextApplications: [],
    //Stock les noms des namespaces à ne pas augmenter avec JSE.Object
    externals: {},
    /**
     *
     * @param source
     * @param match
     * @returns {number}
     */
    arrayIndexOf: function (source, match) {
        for (var i = 0; i < source.length; i++) {
            if (source[i] === match) {
                return i;
            }
        }
        return -1;
    },
    /**
     *
     */
    systemInit: function () {
        function clear() {
            JSE.applicationWires = null;
            JSE.applicationConfiguration = null;
            JSE.isLoadingApplication = false;
        }

        //Init the JSELaunched application
        try {
            if (JSE.currentJSEPath !== null) {
                JSEPath = JSE.currentJSEPath;
                JSE.currentJSEPath = null;
            }
            var loadedApplication = null;
            //Create a new instance of the JSELaunched application if needed
            if (typeof(eval(this.currentPackMaster)) === "function") {
                loadedApplication = eval("new " + this.currentPackMaster + "()");
            }
            else {
                loadedApplication = eval(this.currentPackMaster);
            }
            //Callbacks wiring
            if (this.applicationWires) {
                if ((typeof(this.applicationWires) === "function") || (this.applicationWires.method && this.applicationWires.event && this.applicationWires.event === "onInit")) {
                    //Case one single onInit JSEWire
                    var method = this.applicationWires.method || this.applicationWires;
                    JSE.addEventListener("onInit", method, this.applicationWires.thisObj);
                } else {
                    //Case list of wiring items
                    var item, wireSrc;
                    for (item in this.applicationWires) {
                        wireSrc = ((item !== "onInit") && (item !== "onInitError")) ? loadedApplication : this;

                        if (typeof(this.applicationWires[item]) === "function") {
                            wireSrc.addEventListener(item, this.applicationWires[item]);
                        }
                        else if (typeof(this.applicationWires[item]) !== "undefined" && this.applicationWires[item].method) {
                            wireSrc.addEventListener(item, this.applicationWires[item].method, this.applicationWires[item].thisObj);
                        }

                    }
                }
            }
            //Call init method of the JSELaunched application
            if (loadedApplication.init) {
                loadedApplication.init(this.applicationConfiguration);
            }

            clear();
            //Stimulate the onInit JSE event
            this.triggerEvent("onInit", loadedApplication);
            //loadedApplication.triggerEvent("onInit", loadedApplication);

        } catch (e) {

            clear();
            //Stimulate the onInitError JSE event
            this.triggerEvent("onInitError", loadedApplication, e);
        }
        if (JSE.nextApplications.length > 0) {
            var tmp = JSE.nextApplications[0];
            JSE.nextApplications.splice(0, 1);
            JSELaunch(tmp[0], tmp[1], tmp[2], tmp[3]);
        }
    },
    /**
     *
     * @param namespace
     * @param ns
     * @param fcn
     */
    baseLoad: function (namespace, ns, fcn) {
        ns.push(namespace);
        this.allNamespaces.push(namespace);
        fcn.call(this, false);
    },
    /**
     *
     * @param namespace
     */
    loadComponent: function (namespace) {
        this.baseLoad(namespace, this.namespaces, this.appendScriptComponent);
    },
    /**
     *
     * @param namespace
     */
    loadWSComponent: function (namespace) {
        if (!this.ws) {
            this.ws = new WebSocket();
        }
    },
    /**
     *
     * @param namespace
     */
    loadXHRComponent: function (namespace) {
        this.baseLoad(namespace, this.namespacesXHR, this.appendXHRComponent);
    },
    /**
     *
     * @param namespace
     */
    loadCacheComponent: function (namespace) {
        this.baseLoad(namespace, this.namespacesCache, this.appendCacheComponent);
    },
    /**
     *
     * @param namespace
     */
    loadNodeComponent: function (namespace) {
        this.baseLoad(namespace, this.namespaces, this.appendNodeComponent);
    },
    /**
     *
     * @param isFromComponentLoad
     */
    appendNodeComponent: function (isFromComponentLoad) {
        if ((!this.isLoadingModule) || ((isFromComponentLoad))) {
            this.namespaceLoadIndex++;
            this.isLoadingModule = true;
            try {
                if (eval("typeof(" + this.namespaces[this.namespaceLoadIndex].name + ") != 'undefined'")) {
                    var JSEClone = eval(this.namespaces[this.namespaceLoadIndex].name);
                    this.JSEClone = JSEClone;
                }
            } catch (e) {

            }
            /*global require*/
            require(this.namespaces[this.namespaceLoadIndex].url);
            JSE.componentLoaded();
        }
    },
    /**
     *
     * @param isFromComponentLoaded
     */
    appendCacheComponent: function (isFromComponentLoaded) {
        if (!this.rebuildingFromCache || isFromComponentLoaded) {
            JSE.namespaceCacheLoadIndex++;
            var namespaceCache = this.namespacesCache[JSE.namespaceCacheLoadIndex].name;
            var JSEClone = false;
            try {
                if (eval("typeof(" + namespaceCache + ") != 'undefined'")) {
                    JSEClone = eval(namespaceCache);
                }
            } catch (e) {

            }
            this.rebuildingFromCache = true;

            //Make it asynchronous
            if (JSE.namespacesXHR.length > 0) {
                setTimeout(function () {
                    JSE.componentCacheLoaded(namespaceCache, JSEClone);
                }, 1);
            }
            else {
                JSE.componentCacheLoaded(namespaceCache, JSEClone);
            }
        }
    },
    /**
     *
     * @param namespaceCache
     * @param JSEClone
     */
    componentCacheLoaded: function (namespaceCache, JSEClone) {
        var data = JSE.Cache.getItem(namespaceCache).source;
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
        JSE.extend(nsEval, JSE.Object);

        this.rebuildingFromCache = false;
        JSE.namespacesCacheLoaded++;
        if (JSE.namespacesCacheLoaded < JSE.namespacesCache.length) {
            JSE.appendCacheComponent(true);
        }
        else if (JSE.namespacesXHRLoaded >= JSE.namespacesXHR.length && JSE.namespacesLoaded >= JSE.namespaces.length) {
            JSE.endLoadingPhase();

        }
    },
    /**
     *
     * @param isFromComponentLoad
     */
    appendXHRComponent: function (isFromComponentLoad) {

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

        xhr.onprogress = function () {
        };
        xhr.ontimeout = function () {
        };
        xhr.onload = function () {
            //Make it asynchronous (IE cache made it synchronous)
            setTimeout(function () {
                JSE.componentXHRLoaded.call(xhr);
            }, 1);
        };

        xhr.onerror = function (e) {

        };
        xhr.timeout = 10000;
        xhr.open("GET", this.namespacesXHR[this.namespaceXHRLoadIndex].url, true);
        xhr.send();

    },
    /**
     *
     * @param isFromComponentLoad
     */
    appendScriptComponent: function (isFromComponentLoad) {

        if ((!this.isLoadingModule) || ((isFromComponentLoad))) {
            JSE.namespaceLoadIndex++;
            this.isLoadingModule = true;
            var domScript = document.createElement("script");
            domScript.setAttribute("type", "text/javascript");
            if (navigator.isIE) {
                domScript.onreadystatechange = JSE.componentReady;
            }
            else {
                domScript.onload = JSE.componentLoaded;
            }
            domScript.onerror = JSE.componentLoadingError;
            domScript.namespaceLoadIndex = JSE.namespaceLoadIndex;
            try {
                if (eval("typeof(" + this.namespaces[this.namespaceLoadIndex].name + ") != 'undefined'")) {
                    var JSEClone = eval(this.namespaces[this.namespaceLoadIndex].name);
                    domScript.JSEClone = JSEClone;
                }
            } catch (e) {

            }
            domScript.setAttribute("src", this.namespaces[this.namespaceLoadIndex].url + ((JSE.debug) ? "?debug=" + (new Date()).getTime() : ""));
            this.stimulate("onLoadingNamespace", this.namespaces[this.namespaceLoadIndex].name);
            var body = document.getElementsByTagName("body")[0];
            var head = document.getElementsByTagName("head")[0];
            if (body) {
                body.appendChild(domScript);
            }
            else if (head) {
                head.appendChild(domScript);
            }
        }
    },
    /**
     *
     */
    componentLoadingError: function () {
        JSE.stimulate("onNamespaceLoadingError", JSE.namespaces[JSE.namespaceLoadIndex].name);
    },
    /**
     *
     * @param isFromComponentLoad
     */
    componentXHRLoaded: function (isFromComponentLoad) {
        JSE.namespacesXHRLoaded++;
        try {
            if (eval("typeof(" + this.jsenamespace + ") != 'undefined'")) {
                var JSEClone = eval(this.jsenamespace);
                this.JSEClone = JSEClone;
            }
        } catch (e) {

        }

        if (JSE.useCache) {
            JSE.Cache.setItem(this.jsenamespace, this.responseText, "?");
        }

        var domScript = document.createElement("script");
        domScript.setAttribute("type", "text/javascript");
        domScript.text = this.responseText;
        var body = document.getElementsByTagName("body")[0];
        var head = document.getElementsByTagName("head")[0];
        domScript.JSEnamespace = this.jsenamespace;
        domScript.JSEClone = this.JSEClone;

        if (body) {
            body.appendChild(domScript);
        }
        else if (head) {
            head.appendChild(domScript);
        }

        var nsEval = eval(this.jsenamespace);
        if (this.JSEClone) {
            var item;

            for (item in this.JSEClone) {
                nsEval[item] = this.JSEClone[item];
            }
            this.JSEClone = "";
        }
        JSE.extend(nsEval, JSE.Object);
        JSE.stimulate("onNamespaceLoaded", this.jsenamespace);

        if (JSE.namespacesXHRLoaded >= JSE.namespacesXHR.length && JSE.namespacesLoaded >= JSE.namespaces.length && JSE.namespacesCacheLoaded >= JSE.namespacesCache.length) {

            JSE.endLoadingPhase();

        }

    },
    /**
     *
     */
    endLoadingPhase: function () {
        var i;
        for (i = 0; i < JSE.namespacesCache.length; i++) {
            if (typeof(eval(JSE.namespacesCache[i].name)) !== "function" && !JSE.externals[JSE.namespacesCache[i].name]) {
                try {
                    eval(JSE.namespacesCache[i].name).prepare();
                } catch (e) {

                }
            }

        }

        for (i = JSE.lastNamespaceXHRPrepared; i < JSE.namespacesXHR.length; i++) {
            if (typeof(eval(JSE.namespacesXHR[i].name)) !== "function" && !JSE.externals[JSE.namespacesXHR[i].name]) {
                try {
                    eval(JSE.namespacesXHR[i].name).prepare();
                } catch (e) {

                }
            }

        }
        if (JSE.namespacesXHR.length > 0) {
            JSE.lastNamespaceXHRPrepared = JSE.namespacesXHR.length - 1;
        }

        for (i = JSE.lastNamespacePrepared; i < JSE.namespaces.length; i++) {
            if (typeof(eval(JSE.namespaces[i].name)) !== "function" && !JSE.externals[JSE.namespaces[i].name]) {
                eval(JSE.namespaces[i].name).prepare();
            }
        }
        if (JSE.namespaces.length > 0) {
            JSE.lastNamespacePrepared = JSE.namespaces.length - 1;
        }
        //Controller initialization
        JSE.isLoadingModule = false;
        JSE.rebuildingFromCache = false;
        JSE.triggerEvent("onImportDone");
    },
    componentLoaded: function () {
        var nsEval = eval(JSE.namespaces[this.namespaceLoadIndex].name);
        if (this.JSEClone) {
            var item;

            for (item in this.JSEClone) {
                nsEval[item] = this.JSEClone[item];
            }
            this.JSEClone = "";
        }
        JSE.extend(nsEval, JSE.Object);

        JSE.stimulate("onNamespaceLoaded", JSE.namespaces[this.namespaceLoadIndex].name);
        JSE.namespacesLoaded++;
        if (JSE.namespacesLoaded < JSE.namespaces.length) {
            if (this === JSE) {
                JSE.appendNodeComponent(true);
            }
            else {
                JSE.appendScriptComponent(true);
            }
        }
        else if (JSE.namespacesXHRLoaded >= JSE.namespacesXHR.length && JSE.namespacesCacheLoaded >= JSE.namespacesCache.length) {
            JSE.endLoadingPhase();

        }
        this.onload = "";
    },
    componentReady: function () {
        if ((this.readyState === "loaded") || (this.readyState === "complete")) {
            this.onreadystatechange = "";
            JSE.componentLoaded.call(this);
        }
    },
    hasNamespace: function (namespace) {
        for (var i = 0; i < this.namespaces.length; i++) {
            if (this.namespaces[i].equals(namespace)) {
                return true;
            }
        }

        //For non JSEImported objects
        try {
            if ((typeof(eval(namespace.name)) !== "undefined") && (!eval(namespace.name).JSE)) {
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    },
    extend: function (src, dest) {
        var item;
        if (src.prototype) {
            src = src.prototype;
        }
        for (item in dest.prototype) {
            if (typeof(src[item]) === "undefined") {
                src[item] = dest.prototype[item];
            }
        }
    },
    buildWire: function () {
        //Cas wire
        if ((arguments.length === 1) && (arguments[0].method)) {
            return arguments[0];
        }
        //Cas autre
        if (arguments.length > 1) {
            //Cas JSECallback
            if (typeof(arguments[1]) === "function" && arguments[1].method) {
                return new JSEWire(arguments[0], arguments[1].method, arguments[1].thisObj, arguments[1].args);
            }
            return new JSEWire(arguments[0], arguments[1], arguments[2], arguments[3]);
        }
        return null;
    }
};

/**
 *
 * @type {{classes: {}, strClasses: string, build: Function, getItem: Function, setItem: Function, write: Function}}
 */
JSE.Cache = {
    classes: {},
    strClasses: "",
    build: function () {
        this.strClasses = localStorage.getItem("JSE");
        var split = this.strClasses.split(":|:");
        var source = "";
        while (split.length > 0) {
            var packageName = split.shift();
            var version = split.shift();
            source = split.shift();
            this.classes[packageName] = {
                version: version,
                source: source
            };

        }
    },
    getItem: function (name) {
        return this.classes[name];
    },
    setItem: function (name, data, version) {
        this.classes[name] = {
            version: version,
            source: data
        };
        this.strClasses = this.strClasses + ((this.strClasses === "") ? "" : ":|:") + name + ":|:" + version + ":|:" + data;
    },
    write: function () {
        if (JSE.useCache) {
            localStorage.setItem("JSE", JSE.Cache.strClasses);
        }
    }
};
if (typeof(window) !== "undefined" && window.addEventListener) {
    window.addEventListener("unload", JSE.Cache.write);
} else if (typeof(window) !== "undefined") {
    window.attachEvent("onunload", JSE.Cache.write);
}
if (typeof(localStorage) !== "undefined" && localStorage.getItem("JSE")) {
    JSE.Cache.build();
}

/**
 *
 * @constructor
 */
JSE.Object = function () {

};

/**
 *
 */
JSE.Object.prototype.cast = function (JSEtype) {
    // Returns an object containing source object members
    // augmented by JSEtype instanciated object members
    var result = new (eval(JSEtype))();
    var item;
    for (item in this) {
        result[item] = this[item];
    }
    return result;
};
/**
 *
 * @param object
 */
JSE.Object.prototype.extend = function (object) {
    // Prototype ou Object inheritance
    var source = null;
    if (typeof(object) !== "function") {
        source = object;
    }
    if (object.prototype) {
        source = object.prototype;
    }

    if (source !== null) {
        var item;
        for (item in source) {
            if (!this[item]) {
                this[item] = source[item];
            }
        }
    }

    if (typeof(object) === "function") {
        // Constructor inheritance, applying arguments
        if (arguments.length === 1) {
            object.call(this);
        }
        else {
            object.apply(this, Array.prototype.slice.apply(arguments, [1]));
        }
    }
};
/**
 *
 * @type {Function}
 */
JSE.Object.prototype.isolate = JSE.Object.prototype.removeEventListeners = function () {
    // Delete all listening wires
    var item;
    if (this.JSEwireHub) {
        for (item in this.JSEwireHub) {
            if ((typeof(this.JSEwireHub[item]) === "object") && (!JSE.Object.prototype[item])) {
                while (this.JSEwireHub[item].length > 0) {
                    try {
                        this.unplugWire(this.JSEwireHub[item][0]);
                    } catch (e) {
                    }
                }
            }
        }
    }
    // Delete thisObj references from JSEWires in external JSEWireHubs
    if (this.JSEExtRef) {
        for (var i = 0; i < this.JSEExtRef.length; i++) {
            var obj = this.JSEExtRef[i];
            if (obj.JSEwireHub) {
                for (item in obj.JSEwireHub) {
                    if ((typeof(obj.JSEwireHub[item]) === "object") && (!JSE.Object.prototype[item])) {
                        for (var k = 0; k < obj.JSEwireHub[item].length; k++) {
                            try {
                                if (obj.JSEwireHub[item][k].thisObj === this) {
                                    obj.unplugWire(obj.JSEwireHub[item][k]);
                                    k--;
                                }
                            } catch (e) {
                            }
                        }
                    }
                }
            }
        }

        this.JSEExtRef = [];
    }
};
/**
 *
 * @param wire
 * @private
 */
JSE._buildWireHub = function(wire) {
    if (!this.JSEwireHub) {
        this.JSEwireHub = [];
    }
    if (wire && !this.JSEwireHub[wire.event]) {
        this.JSEwireHub[wire.event] = [];
    }
};
/**
 *
 * @type {Function}
 */
JSE.Object.prototype.plugWire = JSE.Object.prototype.addEventListener = JSE.Object.prototype.on = function (wire) {
    wire = JSE.buildWire.apply(JSE, arguments);
    if ((wire !== null) && (wire.method)) {
        // own JSEWireHub
        JSE._buildWireHub.call(this, wire);
        this.JSEwireHub[wire.event].push(wire);

        // JSEExtRef on destination thisObj (for isolation)
        if (wire.thisObj) {
            try {
                if (!wire.thisObj.JSEExtRef) {
                    wire.thisObj.JSEExtRef = [];
                }
                wire.thisObj.JSEExtRef.push(this);
            } catch (e) {
            }
        }
    }
};
/**
 *
 * @type {Function}
 */
JSE.Object.prototype.unplugWire = JSE.Object.prototype.removeEventListener = function (wire) {
    wire = JSE.buildWire.apply(JSE, arguments);
    if (wire !== null) {
        // JSEWire deletion in own JSEWireHub
        JSE._buildWireHub.call(this);
        if (this.JSEwireHub[wire.event]) {
            for (var i = 0; i < this.JSEwireHub[wire.event].length; i++) {
                if ((wire.method === this.JSEwireHub[wire.event][i].method) && ((wire.thisObj === this.JSEwireHub[wire.event][i].thisObj))) {
                    this.JSEwireHub[wire.event].splice(i, 1);
                    i--;
                }
            }
        }
        // JSEWire deletion in the JSEExtRef of the destination thisObj (for isolation)
        if ((wire.thisObj) && (wire.thisObj.JSEExtRef) && (JSE.arrayIndexOf(wire.thisObj.JSEExtRef, this) !== -1)) {
            wire.thisObj.JSEExtRef.splice(JSE.arrayIndexOf(wire.thisObj.JSEExtRef, this), 1);
        }
    }
};
/**
 *
 * @type {Function}
 */
JSE.Object.prototype.stimulate = JSE.Object.prototype.triggerEvent = JSE.Object.prototype.emit = function (strEvent) {
    JSE._buildWireHub.call(this);
    if (this.JSEwireHub[strEvent]) {
        var tmpArray = [], i;
        for (i = 0; i < this.JSEwireHub[strEvent].length; i++) {
            tmpArray.push(this.JSEwireHub[strEvent][i]);
        }
        for (i = 0; i < tmpArray.length; i++) {
            var wire = tmpArray[i];
            var thisObj = ((wire.thisObj) ? wire.thisObj : this);
            //if (typeof(tmpArray[i]) == "function") tmpArray[i](Array.prototype.slice.apply(arguments, [1])); //JSECallback
            var args = Array.prototype.slice.apply(arguments, [1]);
            if (wire.args) {
                args = wire.args.concat(args);
            }
            if (wire.method && (typeof(wire.method) === "function")) {
                wire.method.apply(thisObj, args);
            }
        }
    }
};
/**
 *
 */
JSE.Object.prototype.prepare = function () {

    function checkAndBuild(obj, thisObj, type) {
        var members;
        if (typeof(obj) === "string") {
            members = obj.split(".");
            if (members[0] === "JSEInstance") {
                obj = thisObj;
                for (j = 1; j < members.length; j++) {
                    obj = obj[members[j]];
                }
                return obj;
            }
            else {
                return eval(obj);
            }
        } else if (typeof(obj) === type) {
            return obj;
        }
        return false;
    }

    //Instanciate member objects and build wires
    var object = this;
    if ((JSE.Object.prototype.prepare.caller !== JSE.componentLoaded) && (JSE.Object.prototype.prepare.caller) && (JSE.Object.prototype.prepare.caller.prototype)) {
        object = JSE.Object.prototype.prepare.caller.prototype;
    }
    var _wireToTreat = {};
    if (!this._isPrepared) {
        var item, wires, wire, i, members, j;
        for (item in object) {
            //Member objects instanciation
            if ((object[item] !== null) && (item !== "JSEwireHub") && (item !== "JSEEvents")) {
                if (object[item].JSEtype || object[item].JSEType) {
                    wires = object[item].JSEwires || object[item].JSEEvents;
                    var type = object[item].JSEtype || object[item].JSEType;
                    var typeParams = object[item].JSEtypeParams || object[item].JSETypeParams;
                    if (typeParams) {
                        var tmpParams = [];
                        for (i = 0; i < typeParams.length; i++) {
                            if ((typeof(typeParams[i]) === "string") && (typeParams[i].indexOf("JSEInstance") !== -1)) {
                                members = typeParams[i].split(".");
                                var member = this;
                                for (j = 1; j < members.length; j++) {
                                    member = member[members[j]];
                                }
                                tmpParams[i] = member;
                            } else {
                                tmpParams[i] = typeParams[i];
                            }
                        }
                        typeParams = tmpParams;

                        if (eval(type + ".prototype")) {
                            this[item] = Object.create(eval(type + ".prototype"));
                        }
                        this[item] = (eval(type).apply(this[item], typeParams) || this[item]);
                    } else {
                        try {
                            if (typeof(eval(type)) === "function") {
                                this[item] = new (eval(type))();
                            }
                            else {
                                var obj = (eval(type));
                                if (typeof(obj) !== "undefined") {
                                    this[item] = obj;
                                }
                                else {
                                    throw type + " is undefined";
                                }

                            }
                        } catch (e) {

                            JSE.stimulate("onObjectPreparationError", e);
                        }
                    }

                    if (wires) {
                        //Wiring preparation
                        object[item].JSEwires = wires;
                        _wireToTreat[item] = object[item];
                    }

                }
            }
        }
        //Member objects pre-wiring
        if (_wireToTreat) {
            for (item in _wireToTreat) {
                if (_wireToTreat[item].JSEwires) {
                    wires = _wireToTreat[item].JSEwires;

                    for (i = 0; i < wires.length; i++) {
                        wire = new JSEWire(wires[i].event, wires[i].method, wires[i].thisObj);
                        wire.method = checkAndBuild(wire.method, this, "function");
                        wire.thisObj = checkAndBuild(wire.thisObj, this, "object");
                        if (wire.method) {
                            this[item].plugWire(wire);
                        }
                    }
                }
            }

        }
        //Auto wiring
        if (object.JSEwireHub || object.JSEEvents) {
            item = "JSEwireHub";

            var tmpHub = [], hubItem;
            for (hubItem in object[item]) {
                if (!JSE.Object.prototype[item]) {
                    tmpHub[hubItem] = [];
                    for (i = 0; i < object[item][hubItem].length; i++) {
                        if (object[item][hubItem][i] && object[item][hubItem][i].method) {
                            wire = new JSEWire(object[item][hubItem][i].event, object[item][hubItem][i].method, object[item][hubItem][i].thisObj);
                            wire.method = checkAndBuild(wire.method, this, "function");

                            if (wire.method) {
                                wire.thisObj = checkAndBuild(wire.thisObj, this, "object");
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
JSE.extend(JSE, JSE.Object);


//Check XMLHTTPREQUEST level 2 or XDR capabilities
JSE.xhr2 = false;
if (typeof(window) !== "undefined" && window.XDomainRequest) {
    JSE.xhr2 = true;
}
else if (typeof(window) !== "undefined" && window.XMLHttpRequest) {
    JSE._xhr = new XMLHttpRequest();
    if (JSE._xhr.withCredentials !== undefined) {
        JSE.xhr2 = true;
    }
    delete JSE._xhr;
}

/**
 *
 * @param name
 * @param url
 * @constructor
 */
JSE.Namespace = function (name, url) {
    //TODO: check integrity for JSE.Paths against xhr2 and document.domain once

    this.name = name;
    var basePath = this.name.replace(/\./g, "/"), i;
    basePath += "/" + this.name.split(".")[this.name.split(".").length - 1] + ".js";
    this.transport = "script";
    if (typeof(JSE.Paths) !== "undefined") {

        var splitted = name.split(".");
        while (splitted.length > 0) {
            var oPath = JSE.Paths[splitted.join(".")];
            if (oPath && oPath.path) {
                if (typeof(oPath.path) === "string") {
                    this.url = oPath.path + basePath;
                } else if (oPath.path.length === 1) {
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
        if ((url) && (url !== "")) {
            this.url = url + basePath;
        }
        else {
            this.url = JSEPath + basePath;
        }
    }
};
/**
 *
 * @param namespace
 * @returns {boolean}
 */
JSE.Namespace.prototype.equals = function (namespace) {
    return (this.name === namespace.name);
};
/**
 *
 * @param packageName
 * @param packageURL
 * @constructor
 */
JSEImport = function (packageName, packageURL) {
    if (JSE.currentPackMaster === null) {
        JSE.currentPackMaster = packageName;
    }
    var namespace = new JSE.Namespace(packageName, packageURL);
    if (!JSE.hasNamespace(namespace)) {
        if (JSE.useCache && JSE.Cache.getItem(packageName)) {
            JSE.loadCacheComponent(namespace);
        }
        else if (namespace.transport === "xhr") {
            JSE.loadXHRComponent(namespace);
        }
        else if (namespace.transport === "require") {
            JSE.loadNodeComponent(namespace);
        }
        else if (namespace.transport === "ws" && window && "WebSocket" in window) {
            JSE.loadWSComponent(namespace);
        }
        else {
            JSE.loadComponent(namespace);
        }
    }
};
/**
 *
 * @param name
 * @param external
 * @constructor
 */
JSEPackage = function (name, external) {
    var names = name.split(".");
    var object = (typeof(window) !== "undefined") ? window : global;
    for (var i = 0; i < names.length; i++) {
        if (!object[names[i]]) {
            object[names[i]] = new JSE.Object();
            object[names[i]].JSE = true;
        }
        object = object[names[i]];
    }
    if (external) {
        JSE.externals[name] = true;
    }

};
/**
 *
 * @param event
 * @param method
 * @param thisObj
 * @param args
 * @constructor
 */
JSEWire = function (event, method, thisObj, args) {
    this.event = event;
    this.method = method;
    this.thisObj = thisObj;
    this.args = args;
};
/**
 *
 * @param fcn
 * @param thisObj
 * @returns {Function}
 * @constructor
 */
JSE.Callback = function (fcn, thisObj) {
    var args = null;
    if (arguments.length > 2) {
        args = Array.prototype.slice.apply(arguments, [2]);
    }
    var result = function () {
        var arg = arguments;
        if (args !== null) {
            arg = args.concat(arguments);
        }
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
 *  - JSELaunch(object, configuration object, callBackWires, rootURL)
 */
/**
 *
 * @param application
 * @param conf
 * @param callBackWires
 * @param rootURL
 * @constructor
 */
JSELaunch = function (application, conf, callBackWires, rootURL) {

    if (!JSE.isLoadingApplication) {
        JSE.isLoadingApplication = true;
        JSE.JSEwireHub.onInit = [];
        if (callBackWires) {

            JSE.applicationWires = callBackWires;

        }
        if (conf) {
            JSE.applicationConfiguration = conf;
        }
        else {
            JSE.applicationConfiguration = null;
        }
        JSE.currentPackMaster = application;

        var namespace = new JSE.Namespace(application);
        if (!JSE.hasNamespace(namespace)) {
            JSE.currentJSEPath = JSEPath;

            if (rootURL) {
                JSEPath = rootURL;
            }
            JSEImport(application);
        }
        else {
            JSE.systemInit();
        }

    } else {
        JSE.nextApplications.push([application, conf, callBackWires, rootURL]);

    }
};
JSE.addEventListener("onImportDone", JSE.systemInit, JSE);
/*
 * Browser detection
 * 
 *  - navigator.isIE
 *  - navigator.isIE6
 *  - navigator.isIE7
 *  - navigator.isSafari
 *  - navigator.isSafari2
 *  - navigator.isSafari3
 *  - navigator.isMozilla
 *  - navigator.isOpera
 *  - navigator.isJSECompatible
 */
if (typeof(window) !== "undefined") {
    window.xpath = !!(document.evaluate);
    if (window.ActiveXObject && !window.opera) {
        navigator.isIE = navigator[window.XMLHttpRequest ? 'isIE7' : 'isIE6'] = true;
    }
    else if (document.childNodes && !document.all && !navigator.taintEnabled) {
        navigator.isSafari = navigator[window.xpath ? 'isSafari3' : 'isSafari2'] = true;
    }
    else if (document.getBoxObjectFor !== null) {
        navigator.isMozilla = true;
    }
    else if (window.mozInnerScreenX !== null) {
        navigator.isMozilla = true;
    }
    navigator.isOpera = window.opera;
    navigator.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    navigator.isJSECompatible = navigator.isIE || navigator.isMozilla || navigator.isOpera || navigator.isSafari3 || navigator.isChrome;
}

