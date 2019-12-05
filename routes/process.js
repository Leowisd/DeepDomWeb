var express = require("express");
var router = express.Router();
var fs = require("fs"),
    csv = require("csvjson");

router.post("/process/scop/:id", function (req, res) {
    var jobId = req.params.id;
    jobId = jobId.substr(1);
    // console.log(jobId);

    var id = req.body.queryNo;

    const scopCsvPath = 'data/SCOP/' + jobId + '_SCOP.csv';
    var scopdata = fs.readFileSync(scopCsvPath, { encoding: 'utf8' });
    var options = {
        delimiter: ',', // optional
        quote: '"' // optional
    };

    var jsonObj = csv.toObject(scopdata, options);

    var scopRes = [];
    if (jsonObj.length > 0) {

        var queryID = "";
        var spfamID = [];
        var sfevalue = [];
        var scopDomID = [];
        var famevalue = [];
        var seg = [];
        var spfamName = [];
        var scopspfamID = [];
        var famName = [];
        var closeName = [];
        var closeID = [];

        for (var i = 0; i < jsonObj.length; i++) {
            if (i > 0 && jsonObj[i].seqID !== jsonObj[i - 1].seqID) {
                // console.log("new!" + jsonObj[i].seqID);
                var jsonTmp = {
                    numberId: id,
                    queryID: queryID,
                    superfamily: spfamID,
                    supeval: sfevalue,
                    family: scopDomID,
                    fameval: famevalue,
                    seg: seg,
                    spfamName: spfamName,
                    famName: famName,
                    closeID: closeID,
                    closeName: closeName,
                    scopspfamID: scopspfamID
                }

                scopRes.push(jsonTmp);
                if (scopRes.length - 1 == id) {
                    res.send(jsonTmp);
                }

                queryID = "";
                spfamID = [];
                sfevalue = [];
                scopDomID = [];
                famevalue = [];
                seg = [];
                spfamName = [];
                famName = [];
                closeName = [];
                closeID = [];
                scopspfamID = [];

                queryID = jsonObj[i].seqID;

                spfamID.push(jsonObj[i].spfamID);

                spfamName.push(jsonObj[i].spfamName);

                scopspfamID.push(jsonObj[i].scopspfamID);

                sfevalue.push(jsonObj[i].evalue);

                scopDomID.push(jsonObj[i].scopDomID);

                famName.push(jsonObj[i].famName);

                famevalue.push(jsonObj[i].famEvalue);

                closeID.push(jsonObj[i].scopFamID);

                closeName.push(jsonObj[i].closeStruct);

                var segTmp = jsonObj[i].matchRegion.replace(/,/g, '-').split('-');
                seg.push(segTmp);
            }
            else {
                // console.log("add!" + jsonObj[i].seqID);
                queryID = jsonObj[i].seqID;

                spfamID.push(jsonObj[i].spfamID);

                spfamName.push(jsonObj[i].spfamName);

                scopspfamID.push(jsonObj[i].scopspfamID);

                sfevalue.push(jsonObj[i].evalue);

                scopDomID.push(jsonObj[i].scopDomID);

                famName.push(jsonObj[i].famName);

                famevalue.push(jsonObj[i].famEvalue);

                closeID.push(jsonObj[i].scopFamID);

                closeName.push(jsonObj[i].closeStruct);

                var segTmp = jsonObj[i].matchRegion.replace(/,/g, '-').split('-');
                seg.push(segTmp);
            }
        }
    }

    var jsonTmp = {
        numberId: id,
        queryID: queryID,
        superfamily: spfamID,
        supeval: sfevalue,
        family: scopDomID,
        fameval: famevalue,
        seg: seg,
        spfamName: spfamName,
        famName: famName,
        closeID: closeID,
        closeName: closeName,
        scopspfamID: scopspfamID
    }
    scopRes.push(jsonTmp);
    if (scopRes.length - 1 == id) {
        res.send(jsonTmp);
    }
})


router.post("/process/cath/:id", function (req, res) {
    var jobId = req.params.id;
    jobId = jobId.substr(1);
    // console.log(jobId);

    var name = req.body.queryName.substr(1).split(' ')[0];
    var id = req.body.queryNo;

    const cathCsvPath = 'data/CATH/' + jobId + '_CATH.csv';
    var cathdata = fs.readFileSync(cathCsvPath, { encoding: 'utf8' });
    var options = {
        delimiter: ',', // optional
        quote: '"' // optional
    };

    var jsonArray = csv.toArray(cathdata, options);

    var cathRes = [];
    if (jsonArray.length > 1) {

        var queryID = "";
        var match_id = [];
        var accession = [];
        var desciption = [];
        var region = [];
        var indeval = [];
        var condval = [];

        for (var i = 1; i < jsonArray.length; i++) {
            if (i > 1 && jsonArray[i][2] !== jsonArray[i - 1][2]) {
                // console.log("new!" + jsonObj[i].seqID);
                var jsonTmp = {
                    numberId: id,
                    queryName: name,
                    queryID: queryID,
                    id: match_id,
                    accession: accession,
                    desciption: desciption,
                    seg: region,
                    indeval: indeval,
                    condval: condval
                }
                // console.log(jsonTmp);
                cathRes.push(jsonTmp);
                if (name == jsonTmp.queryID) {
                    res.send(jsonTmp);
                }

                queryID = "";
                match_id = [];
                accession = [];
                desciption = [];
                region = [];
                indeval = [];
                condval = [];

                queryID = jsonArray[i][2];

                match_id.push(jsonArray[i][0]);

                accession.push(jsonArray[i][1]);

                desciption.push(jsonArray[i][10]);

                indeval.push(jsonArray[i][9]);

                condval.push(jsonArray[i][8]);

                var segTmp = jsonArray[i][6].replace(/,/g, '-').split('-');
                region.push(segTmp);
            }
            else {
                // console.log("add!" + jsonObj[i].seqID);
                queryID = jsonArray[i][2];

                match_id.push(jsonArray[i][0]);

                accession.push(jsonArray[i][1]);

                desciption.push(jsonArray[i][10]);

                indeval.push(jsonArray[i][9]);

                condval.push(jsonArray[i][8]);

                var segTmp = jsonArray[i][6].replace(/,/g, '-').split('-');
                region.push(segTmp);
            }
        }
    }

    var jsonTmp = {
        numberId: id,
        queryName: name,
        queryID: queryID,
        id: match_id,
        accession: accession,
        desciption: desciption,
        seg: region,
        indeval: indeval,
        condval: condval
    }
    cathRes.push(jsonTmp);
    if (name == jsonTmp.queryID) {
        res.send(jsonTmp);
    }
})

router.post("/process/comparison/:id", function(req, res){
    var jobId = req.params.id;
    jobId = jobId.substr(1);

    var id = req.body.queryNo;
    var name = req.body.queryName.substr(1).split(' ')[0];
    

    const scopCsvPath = 'data/SCOP/' + jobId + '_SCOP.csv';
    var scopdata = fs.readFileSync(scopCsvPath, { encoding: 'utf8' });
    var options = {
        delimiter: ',', // optional
        quote: '"' // optional
    };

    // --------------------
    // get current scop eval
    // --------------------
    var jsonObj = csv.toObject(scopdata, options);

    var scopRes = [];
    var isFind = false;
    if (jsonObj.length > 0) {

        var sfevalue = [];
        var famevalue = [];

        for (var i = 0; i < jsonObj.length; i++) {
            if (i > 0 && jsonObj[i].seqID !== jsonObj[i - 1].seqID) {
                // console.log("new!" + jsonObj[i].seqID);
                var jsonTmp = {
                    supeval: sfevalue,
                    fameval: famevalue,

                }
                scopRes.push(jsonTmp);
                if (scopRes.length - 1 == id) {
                    isFind = true;
                    break;
                }

                sfevalue = [];
                famevalue = [];
                
                sfevalue.push(jsonObj[i].evalue);
                famevalue.push(jsonObj[i].famEvalue);
            }
            else {
                sfevalue.push(jsonObj[i].evalue);
                famevalue.push(jsonObj[i].famEvalue);
            }
        }
    }

    if (isFind == false){
        var jsonTmp = {
            supeval: sfevalue,
            fameval: famevalue,
        }
        scopRes.push(jsonTmp);
    }
    var scopSupFamVal = scopRes[scopRes.length -1].supeval;
    var scopFamVal = scopRes[scopRes.length - 1].fameval;

    var scop = 0;
    if (scopSupFamVal != undefined){
        for (var i = 0; i < scopSupFamVal.length; i++){
            scop += new Number(scopSupFamVal[i]);
        }
        scop /= scopSupFamVal.length;
    }
    else scop = 1;

    // -----------------------
    // get current CATH evalue
    // -----------------------
    const cathCsvPath = 'data/CATH/' + jobId + '_CATH.csv';
    var cathdata = fs.readFileSync(cathCsvPath, { encoding: 'utf8' });
    var options = {
        delimiter: ',', // optional
        quote: '"' // optional
    };

    var jsonArray = csv.toArray(cathdata, options);

    var cathRes = [];
    var isGot = false;
    if (jsonArray.length > 1) {

        var queryID = "";
        var indeval = [];
        var condval = [];

        for (var i = 1; i < jsonArray.length; i++) {
            if (i > 1 && jsonArray[i][2] !== jsonArray[i - 1][2]) {
                // console.log("new!" + jsonObj[i].seqID);
                var jsonTmp = {
                    queryID: queryID,
                    indeval: indeval,
                    condval: condval
                }
                // console.log(jsonTmp);
                cathRes.push(jsonTmp);
                if (name == jsonTmp.queryID) {
                    isGot = true;
                    break;
                }

                queryID = "";
                indeval = [];
                condval = [];

                queryID = jsonArray[i][2];
                indeval.push(jsonArray[i][9]);
                condval.push(jsonArray[i][8]);
            }
            else {
                queryID = jsonArray[i][2];
                indeval.push(jsonArray[i][9]);
                condval.push(jsonArray[i][8]);
            }
        }
    }

    if (isGot == false){
        var jsonTmp = {
            queryID: queryID,
            indeval: indeval,
            condval: condval
        }
        cathRes.push(jsonTmp);
    }
    var cathIndVal = cathRes[cathRes.length - 1].indeval;

    var cath = 0;
    if (cathIndVal != undefined){
        for (var i = 0; i < cathIndVal.length; i++){
            cath += new Number(cathIndVal[i]);
        }
        cath /= cathIndVal.length;
    }
    else cath = 1;
    // --------------
    // return result
    // --------------
    var re = {
        id: id,
        method : ""
    }

    if (scop > 1e-14 && cath > 1e-14) re.method = 'deepdom';
    else if (scop < cath) re.method = 'scop';
    else re.method = 'cath';
    res.send(re);
})

module.exports = router;

