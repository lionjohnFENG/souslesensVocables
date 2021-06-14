var fs = require('fs');
var async = require('async')
var SQLserverConnector = require('./SQLserverConnector.')


var TagAnalyzer = {

    analyzeTag: function (tag) {
        var pattern = ""
        for (var i = 0; i < tag.length; i++) {
            var c = tag.charCodeAt(i)
            if (c > 47 && c < 58)
                pattern += "N"
            else if (c > 64 && c < 91)
                pattern += "A"
            else if (c > 96 && c < 123)
                pattern += "A"
            else if (c == 45)
                pattern += "-"
            else if (c == 32)
                pattern += " "
            else
                pattern = "ERROR"


        }
        return pattern

    },


    processTags: function (callback) {
        var systemCodesMap = {};
        var subSystemCodesMap = {};

        var tagCodesMap = {}
        async.series(
            [


                //load systems and subSystems maps
                function (callbackSeries) {
                    var query = "select * from dbo.systemUnit_501_207"
                    SQLserverConnector.getData("MIE", query, function (err, result) {
                        if (err)
                            return callback(err)
                        result.forEach(function (item) {
                            systemCodesMap[item.system_code_501] = item
                            subSystemCodesMap[item.system_code_501 + item.subSystem_code_501] = item

                        })

                        return callbackSeries()
                    })


                },
                //load tagCodes
                function (callbackSeries) {
                    var query = "select * from dbo. ONE_codification"
                    SQLserverConnector.getData("MIE", query, function (err, result) {
                        if (err)
                            return callback(err)
                        result.forEach(function (item) {
                            tagCodesMap[item.codification_CodeEP] = item


                        })

                        return callbackSeries()
                    })


                }
                ,
                function (callbackSeries) {
                    if (true) {
                        return callbackSeries()
                    }
                    var str = "" + fs.readFileSync("D:\\NLP\\ontologies\\MIE\\distinctTags.txt")
                    var tags = str.split(",")
                    var patterns = {}
                    var output = []
                    var regexEquipment_501 = /^(?<sector>[\w\d]{1,2})-*(?<item>\w{1,3})-*(?<system>\d)(?<subSystem>\d)(?<seqNum>\d{1,2})-*(?<suffix>[\w\d]{0,5})-*.*$/g


                    tags.forEach(function (tag, regexEquipment_501) {
                        var obj = TagAnalyzer.parseTag(tag);
                        if (obj)
                            output.push(obj)
                    })


                    var x = output
                    var keys = Object.keys(output[0])
                    var str = ""
                    keys.forEach(function (key, index) {
                        str += key + "\t"
                    })
                    str += "systemLabel\t"
                    str += "subSystemLabel\t"
                    str += "functionalClassLabel\t"

                    str += "\n"


                    output.forEach(function (item, index0) {
                        if (!item["system"])
                            return str += "NA\t" + item.tag + "\n"
                        keys.forEach(function (key, index) {


                            str += item[key] + "\t"


                        })
                        var systemCode = item["system"]

                        var systemName = ""
                        var system = systemCodesMap[systemCode]
                        if (system)
                            systemName = system.System
                        str += systemName + "\t"


                        var subSystemCode = item["system"] + item["subSystem"]
                        var subSystemName = ""
                        var subSystem = subSystemCodesMap[subSystemCode]
                        if (subSystem)
                            subSystemName = subSystem.SubSystem

                        str += subSystemName + "\t"


                        var functionalClassCode = item["equipmentType"]
                        var functionalClassName = ""
                        var functionalClass = tagCodesMap[functionalClassCode]
                        if (functionalClass)
                            functionalClassName = functionalClass.functionalClass_Name

                        str += functionalClassName + "\t"


                        str += "\n"

                    })
                    fs.writeFileSync("D:\\NLP\\ontologies\\MIE\\parseTags.txt", str)

                    //    var x=str;
                    /*   var pattern = TagAnalyzer.analyzeTag(tag)
                       if (!patterns[pattern])
                           patterns[pattern] = []

                       patterns[pattern].push(tag)

                   })
                   for (var key in patterns) {
                       console.log(key)
                   }*/

                    return callbackSeries()
                },
                function (callbackSeries) {
                    var str = "" + fs.readFileSync("D:\\NLP\\ontologies\\MIE\\distinctTags.txt")
                    var tags = str.split(",")
                    var patterns = {}
                    var output = []

                    var regexEquipment_501b = /^(?<sector>[\d]{0,1})-*(?<A>[A-Z]{0,4})(?<B>[0-9]{0,5})-*(?<C>[A-Z]{1,3})-*(?<D>[0-9]*)-*(?<E>.*)$/
                    tags.forEach(function (tag,) {
                        var obj = TagAnalyzer.parseTag(tag, regexEquipment_501b);
                        if (obj)
                            output.push(obj)
                    })
                    var keys = Object.keys(output[0])
                    var str = ""
                    keys.forEach(function (key, index) {
                        str += key + "\t"
                    })

                    str += "\n"


                    output.forEach(function (item, index0) {

                        keys.forEach(function (key, index) {
                            str += item[key] + "\t"
                        })
                        str += "\n"


                    })
                    fs.writeFileSync("D:\\NLP\\ontologies\\MIE\\parseTagsB.txt", str)
                }


            ], function (err) {


            }
        )


    },

    parseTag: function (tag, regex) {

        //  var regexEquipment_501 = /^(?<sector>[\d]{1,2})[-\s]{0,1}(?<equipmentType>\w{2})[-\s]{0,1}(?<system>\d)(?<subSystem>\d)(?<seqNum>\d{1,2})-*(?<discriminationCode>[\w]{0,4})(?<more>.*)$/


        var obj = regex.exec(tag)
        if (obj) {
            var groups = obj.groups
            groups.tag = tag
            return groups;
            // console.log(tag + "\t" + JSON.stringify(groups,))
        } else {
            return {tag: tag}
        }
        return null;


    }
    ,

    deconcat: function () {

        var str = "0 Critical & Safety,Systems,Main critical and safety equipment,1 Hydrocarbon extraction Equipment from crude oil/gas well to the treatment,units (treatment excluded),2 Produced liquid,processing,Equipment dedicated to treat and evacuate Oil,production,3 Produced Gas,processing,Equipment dedicated to treat and evacuate, dispose,or inject gas production,4 Produced gas liquid,processing,Equipment dedicated to treat and evacuate NGL,5 Water processing Equipment dedicated to treat, evacuate or inject,water,6 Electric Energy All general equipment for electrical production and,distribution,7 Common Facilities Topsides utilities, Subsea distribution systems,(umbilical, umbilical distribution modules…),8 Housing & Others Housing, building, structure and miscellaneous"
        var data = str.split(",")
        var output = ""
        data.forEach(function (str) {
            var p = str.indexOf(" ")
            output += str.substring(0, p) + "," + str.substring(p + 1) + "\n"

        })
        var x = output
    },


    clovFormats:
        [["TOTAL-T0000000001", "XX-NN-AA(A)(A)-NNNN(A)", "Main equipments tag structure"],
            ["TOTAL-T0000000002", "XX-NN-AAAA-NNNN(A)", "Piping equipments (SP items) tagging specific requirements"],
            ["TOTAL-T0000000003", "XX-NN-AA(A)(A)-NNNN(A)-A(A)(N)(N)(N)(N)(N)", "Switchgears and MCC compartments"],
            ["TOTAL-T0000000004", "XX-NN-AA(A)(A)-NNNN(A)", "Electrical equipment related to other main equipment"],
            ["TOTAL-T0000000005", "XX-NN-XXXX-NNNN(A)", "Telecom equipments tagging specific requirements"],
            ["TOTAL-T0000000006", "XX-NN-A(A)(A)(A)(A)(A)-NNNN(A)", "Field instruments & instrumented functions tag structure"],
            ["TOTAL-T0000000007", "XX-NN-AA(A)(A)-NNNN(A)-AX(X)(X)(X)", "Electrical consumer controls"],
            ["TOTAL-T0000000008", "XX-NN-A(A)(A)(A)(A)(A)-NNNN(A)-AA", "Hardwired links between ICSS sub-systems"],
            ["TOTAL-T0000000009", "XX-NN-N(N)(N)(N)N-AA(A)-NNN-ANN(A)(X)-(A)(A)", "Piping tag structure"],
            ["TOTAL-T0000000010", "XX-NN-N(N)(N)(N)N-AA(A)-NNN-AANN", "Piping supports"],
            ["TOTAL-T0000000011", "XX-NN-AANN-AAA-NNNN", "Ducting tag structure"],
            ["TOTAL-T0000000012", "XX(X)(X)-NN-N(N)(N)(N)NAA(A)-(N)(N)NN(A)-(A)(A)", "Pipeline tag structure"],
            ["TOTAL-T0000000013", "XX-NN-AA-NNNN(A)", "Manual valves"],
            ["TOTAL-T0000000014", "XX-NN-AA(A)(A)-NNNN(A)-AA(X)(X)(X)", "Electrical & instrumentation cables tag structure"],
            ["TOTAL-T0000000015", "XX-NN-A(A)(A)(A)(A)(A)-NNNN(A)-AA(X)(X)(X)", "Tubing"]]

    ,tagFormatsToRegex:function(){
        var formats=[]
        TagAnalyzer.clovFormats.forEach(function(item){
            formats.push({
                name:item[2],
                id:item[0],
                value: item[1]
            })

            })
        var regexEquipment_501 = /^(?<sector>[\w\d]{1,2})-*(?<item>\w{1,3})-*(?<system>\d)(?<subSystem>\d)(?<seqNum>\d{1,2})-*(?<suffix>[\w\d]{0,5})-*.*$/g
       var x= formats
       var formatRegexmap={}
        formats.forEach(function(item){
            var regexStr=""
            var array=item.value.split("-")
            var okLetters=["A","N","X"]
            var optionalLetters={};
            var mandatoryLetters={}
            array.forEach(function(str,index){




                    for (var i=0;i<str.length;i++) {
                        var letter = str.charAt(i);
                        if (letter == "(") {
                            var letter2 = str.charAt(i + 1);
                            if (!optionalLetters[letter2])
                                optionalLetters[letter2] = 0
                            optionalLetters[letter2] += 1

                        } else {
                            if (okLetters.indexOf(letter) > -1)
                                if (!mandatoryLetters[letter])
                                    mandatoryLetters[letter] = 0
                            mandatoryLetters[letter] += 1
                        }

                    }

                        for(var key in mandatoryLetters) {
                            var map = {
                                X: "[\\w\\d]",
                                A: "\\w",
                                N: "\\d"
                            }
                            var cardinality = "" + mandatoryLetters[key]
                            if (optionalLetters[key]) {
                                cardinality += "," + (mandatoryLetters[key] + optionalLetters[key])
                            }


                            var exp = map[key]
                            regexStr += "(?<group" + index + ">" + exp + "{" + cardinality + "})"
                        }


                        regexStr+="-"


                    

            })




            formatRegexmap[regexStr]=item
        })
        var xx=formatRegexmap
    }


}

module.exports = TagAnalyzer

//TagAnalyzer.deconcat()
//TagAnalyzer.processTags("5FY1043")

TagAnalyzer.tagFormatsToRegex()