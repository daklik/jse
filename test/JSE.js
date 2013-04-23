/* jshint undef:false*/
describe("JSE objects and methods", function() {
    it("JSE should be defined", function() {
        expect(JSE).toBeDefined();
    });
    it("JSE.Object should be defined", function() {
        expect(JSE.Object).toBeDefined();
    });
});

describe("JSE inheritance", function() {
    it("Inheritance should copy methods and members from source static object", function() {
        var src = {
            testMethod: function() {

            },
            testMember: ["1"]
        };
        var dest = {};
        JSE.extend(dest, JSE.Object);
        dest.extend(src);

        expect(dest.testMethod).toBeDefined();
        expect(typeof(dest.testMethod)).toBe("function");
        expect(dest.testMember).toBeDefined();
        expect(typeof(dest.testMember)).toBe("object");
        expect(dest.testMember.length).toBe(1);
    });

    var src = function(str, num) {
        this.myMember = "ok";
        this.myCustomMember = str || "";
        this.myCustomNumber = num || 0;
    };
    src.prototype = {
        testMethod: function() {

        },
        testMember : ["1"]
    };
    var dest = {};
    JSE.extend(dest, JSE.Object);
    dest.extend(src);

    it("Inheritance should copy methods and members from source class constructor and prototype", function() {
        expect(dest.myMember).toBeDefined();
        expect(dest.myMember).toBe("ok");
        expect(dest.testMethod).toBeDefined();
        expect(typeof(dest.testMethod)).toBe("function");
        expect(dest.testMember).toBeDefined();
        expect(typeof(dest.testMember)).toBe("object");
        expect(dest.testMember.length).toBe(1);
    });
    it("Inheritance should pass arguments to the source constructor", function() {
        var otherDest = {};
        JSE.extend(otherDest, JSE.Object);
        otherDest.extend(src, "hello", 10);
        expect(otherDest.myCustomMember).toBe("hello");
        expect(otherDest.myCustomNumber).toBe(10);
    });
    it("Inheritance should share objects between source and extended objects", function() {
        var srcInstance = new src();
        srcInstance.testMember.push("2");
        expect(dest.testMember.length).toBe(2);
        dest.testMember.push("3");
        expect(srcInstance.testMember.length).toBe(3);
    });
    it("Inheritance should not modify extended objects upon runtime source prototype extension", function() {
        src.prototype.newMember = "noOK";
        expect(dest.newMember).toBeUndefined();
    });

});

describe("JSE events", function() {
    var obj = function(){

    };
    obj.prototype = {

    };
    JSE.extend(obj, JSE.Object);
    var myObj = new obj();

    it("JSE classes should have event oriented methods", function() {
        expect(myObj.plugWire).toBeDefined();
        expect(myObj.unplugWire).toBeDefined();
        expect(myObj.addEventListener).toBeDefined();
        expect(myObj.on).toBeDefined();
        expect(myObj.removeEventListener).toBeDefined();
        expect(myObj.isolate).toBeDefined();
        expect(myObj.stimulate).toBeDefined();
        expect(myObj.triggerEvent).toBeDefined();
        expect(myObj.emit).toBeDefined();

        expect(myObj.plugWire).toBe(myObj.addEventListener);
        expect(myObj.on).toBe(myObj.addEventListener);

        expect(myObj.unplugWire).toBe(myObj.removeEventListener);

        expect(myObj.stimulate).toBe(myObj.triggerEvent);
        expect(myObj.emit).toBe(myObj.triggerEvent);
    });

    it("Listening, triggering and unlistening events, using context", function() {
        function setNb(nb, str) {
            this.nb = nb;
            this.str = str || "";
        }

        myObj.on("onUpdate", setNb, myObj);
        myObj.emit("onUpdate", 3);
        expect(myObj.nb).toBe(3);

        myObj.removeEventListener("onUpdate", setNb, myObj);
        myObj.emit("onUpdate", 6);
        expect(myObj.nb).toBe(3);
    });

    it("Listening, triggering and unlistening events, using context, old school JSEWire", function() {
        function setNb(nb) {
            this.nb = nb;
        }

        myObj.on(new JSEWire("onUpdate", setNb, myObj));
        myObj.emit("onUpdate", 10);
        expect(myObj.nb).toBe(10);

        myObj.removeEventListener(new JSEWire("onUpdate", setNb, myObj));
        myObj.emit("onUpdate", 6);
        expect(myObj.nb).toBe(10);
    });

    it("Listening, triggering and unlistening events, using JSECallback for adding argument", function() {
        function setNb(str, nb) {
            this.nb = nb;
            this.str = str || "";
        }

        myObj.on("onUpdate", JSE.Callback(setNb, myObj, "hello"));
        myObj.emit("onUpdate", 5);
        expect(myObj.nb).toBe(5);
        expect(myObj.str).toBe("hello");

        myObj.removeEventListener("onUpdate", JSE.Callback(setNb, myObj, "hello"));
        myObj.emit("onUpdate", 6);
        expect(myObj.str).toBe("hello");
        expect(myObj.nb).toBe(5);
    });

    it("Isolation should unplug self listening", function() {
        function setNb(str, nb) {
            this.nb = nb;
            this.str = str || "";
        }

        myObj.on("onUpdate", JSE.Callback(setNb, myObj, "world"));
        myObj.emit("onUpdate", 15);
        expect(myObj.nb).toBe(15);
        expect(myObj.str).toBe("world");

        myObj.isolate();
        myObj.emit("onUpdate", 6);
        expect(myObj.str).toBe("world");
        expect(myObj.nb).toBe(15);
    });

    it("Isolation should unplug external references", function() {
        function setNb(nb) {
            this.nb = nb;
        }
        var myOther = new obj();

        myOther.on("onUpdate", setNb, myObj);
        myOther.emit("onUpdate", 0);
        expect(myObj.nb).toBe(0);

        myObj.isolate();
        myOther.emit("onUpdate", 10);
        expect(myObj.nb).toBe(0);
        expect(myOther.JSEwireHub.length).toBe(0);
    });
});

describe("JSE literal notation", function() {
    it("JSE class instances should have a prepare method", function() {
        var obj = function(){

        };
        obj.prototype = {

        };
        JSE.extend(obj, JSE.Object);
        var objInstance = new obj();
        expect(objInstance.prepare).toBeDefined();
        expect(typeof(objInstance.prepare)).toBe("function");
    });
    it("JSE static objects should have a prepare method", function() {
        var obj = {};
        JSE.extend(obj, JSE.Object);
        expect(obj.prepare).toBeDefined();
        expect(typeof(obj.prepare)).toBe("function");
    });
    it("JSE class instances preparation should transform members with JSEType property into objects", function() {
        var obj = function(){
            this.prepare();
        };
        obj.prototype = {
            "member" : {
                "JSEType" : "Array"
            }
        };
        JSE.extend(obj, JSE.Object);
        var objInstance = new obj();

        expect(objInstance.member).toBeDefined();
        expect(typeof(objInstance.member)).toBe("object");
        expect(objInstance.member.length).toBeDefined();
    });
    it("JSE preparation should pass JSETypeParams as arguments to JSEType constructor", function() {
        var myobj = function(){
            this.prepare();
        };
        myobj.prototype = {
            "mymember" : {
                "JSEType" : "Array",
                "JSETypeParams" : [10, "hello", "world"]
            }
        };
        JSE.extend(myobj, JSE.Object);
        var objInstance = new myobj();
        expect(objInstance.mymember.length).toBe(3);
        expect(objInstance.mymember[0]).toBe(10);
        expect(objInstance.mymember[1]).toBe("hello");
        expect(objInstance.mymember[2]).toBe("world");
    });
    it("JSE preparation should plug self event listeners", function() {
        (window||global).set = function(a){this.str = a;};
        var myObj = function() {
            this.nb = 0;
            this.str = "";
            this.a = 0;
            this.prepare();
        };
        myObj.prototype = {
            JSEwireHub: {
                "onUpdate" : [
                    {method:"JSEInstance.update", thisObj:"JSEInstance"},
                    {method:"set", thisObj:"JSEInstance"},
                    {method:function(a){this.a = a;}, thisObj:"JSEInstance"},
                    {method:function(a){this.a = a;}, thisObj:(window||global)},
                    {method:"set", thisObj:(window||global)},
                    {method:"JSEInstance.update", thisObj:(window||global)}
                ]
            },
            update : function(nb) {
                this.nb = nb;
            }
        };
        JSE.extend(myObj, JSE.Object);
        var myInstance = new myObj();
        myInstance.emit("onUpdate", 3);
        expect(myInstance.nb).toBe(3);
        expect(myInstance.str).toBe(3);
        expect(myInstance.a).toBe(3);
        expect((window||global).a).toBe(3);
        expect((window||global).nb).toBe(3);
        expect((window||global).str).toBe(3);
        delete (window||global).set;
        delete (window||global).a;
        delete (window||global).nb;
    });
});