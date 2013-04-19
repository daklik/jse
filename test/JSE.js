/* jshint undef:false*/
describe("JSE objects and methods", function() {
    it("JSE should be defined", function() {
        expect(JSE).toBeDefined();
    });
    it("JSE.Object should be defined", function() {
        expect(JSE.Object).toBeDefined();
    });
});

describe("JSE Object inheritance", function() {
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

    var src = function() {
        this.myMember = "ok";
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
});