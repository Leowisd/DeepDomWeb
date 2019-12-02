var express = require("express");
var router = express.Router();
var fs = require("fs"),
    parseString = require('xml2js').parseString,
    csv = require("csvjson"),
    exec = require('child_process').exec;

router.post("/process/scop/:id", function (req, res) {
    var jobId = req.params.id;
    jobId = jobId.substr(1);
    // console.log(jobId);

    var id = req.body.queryId;

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
        var scopFamID = [];
        var sfevalue = [];
        var scopDomID = [];
        var famevalue = [];
        var seg = [];

        for (var i = 0; i < jsonObj.length; i++) {
            if (i > 0 && jsonObj[i].seqID !== jsonObj[i - 1].seqID) {
                // console.log("new!" + jsonObj[i].seqID);
                var jsonTmp = {
                    numberId: id,
                    queryID: queryID,
                    superfamily: scopFamID,
                    supeval: sfevalue,
                    family: scopDomID,
                    fameval: famevalue,
                    seg: seg
                }
                // console.log(jsonTmp);
                scopRes.push(jsonTmp);

                queryID = "";
                scopFamID = [];
                sfevalue = [];
                scopDomID = [];
                famevalue = [];
                seg = [];

                queryID = jsonObj[i].seqID;

                scopFamID.push(jsonObj[i].scopFamID);

                sfevalue.push(jsonObj[i].evalue);

                scopDomID.push(jsonObj[i].scopDomID);

                famevalue.push(jsonObj[i].famEvalue);

                var segTmp = jsonObj[i].matchRegion.replace(/,/g, '-').split('-');
                seg.push(segTmp);
            }
            else {
                // console.log("add!" + jsonObj[i].seqID);
                queryID = jsonObj[i].seqID;

                scopFamID.push(jsonObj[i].scopFamID);

                sfevalue.push(jsonObj[i].evalue);

                scopDomID.push(jsonObj[i].scopDomID);

                famevalue.push(jsonObj[i].famEvalue);

                var segTmp = jsonObj[i].matchRegion.replace(/,/g, '-').split('-');
                seg.push(segTmp);
            }
        }
    }
    // console.log(scopRes[id]);

    res.send(scopRes[id]);
})

router.post("/process/hmmscan/superfamily", function (req, res) {
    // console.log(req.body.seq);
    var seq = req.body.seq;
    var name = req.body.name;

    console.info("Hmmscan in superfamily DB started: " + name);
    var cmd = "curl -X POST -L -H 'Expect:' -H 'Accept:text/xml' -F hmmdb=superfamily -F seq='" + seq + "' https://www.ebi.ac.uk/Tools/hmmer/search/hmmscan";
    var workprecessor = exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.info('stderr : ' + stderr);
        }
        var superfamily = [];
        var family = [];
        var supeval = [];
        var fameval = [];
        var seg = [];

        if (stdout == undefined) res.send(undefined);   //in case of server busy

        parseString(stdout, function (err, result) {
            var hits = result.opt.data[0].hits;
            if (hits != undefined) {
                for (var i = 0; i < hits.length; i++) {
                    // superfamily
                    superfamily.push(hits[i].$.desc);
                    supeval.push(hits[i].$.evalue);
                    // famliy
                    family.push(hits[i].domains[0].family[0].$.famdesc);
                    fameval.push(hits[i].domains[0].family[0].$.fameval);
                    // segments
                    var segments = hits[i].domains[0].segments;
                    var segtmp = [];
                    for (var j = 0; j < segments.length; j++) {
                        segtmp.push(segments[j].$.start);
                        segtmp.push(segments[j].$.end);
                    }
                    seg.push(segtmp);
                }
            }
        });
        var result = {
            superfamily: superfamily,
            supeval: supeval,
            family: family,
            fameval: fameval,
            seg: seg
        };
        // console.log(result);
        console.info("Hmmscan in superfamily DB finished: " + name);
        res.send(result);
    });
})

router.post("/process/hmmscan/3d", function (req, res) {
    // console.log(req.body.seq);
    var seq = req.body.seq;
    var name = req.body.name;

    console.info("Hmmscan in 3D DB started: " + name);
    var cmd = "curl -X POST -L -H 'Expect:' -H 'Accept:text/xml' -F hmmdb=gene3d -F seq='" + seq + "' https://www.ebi.ac.uk/Tools/hmmer/search/hmmscan";
    var workprecessor = exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.info('stderr : ' + stderr);
        }

        var id = [];
        var accession = [];
        var desciption = [];
        var region = [];
        var start = [];
        var end = [];
        var indeval = [];
        var condval = [];

        if (stdout == undefined) res.send(undefined);   //in case of server busy

        parseString(stdout, function (err, result) {
            var hits = result.opt.data[0].hits;
            if (hits != undefined) {
                for (var i = 0; i < hits.length; i++) {
                    for (var j = 0; j < hits[i].domains.length; j++) {
                        // id
                        id.push(hits[i].$.name);
                        // accession
                        accession.push(hits[i].$.acc);
                        // description
                        desciption.push(hits[i].$.desc);
                        // region
                        var segtmp = [];
                        segtmp.push(hits[i].domains[j].segments[0].$.start);
                        segtmp.push(hits[i].domains[j].segments[0].$.end);
                        region.push(segtmp);
                        // start
                        start.push(hits[i].domains[j].$.ienv);
                        // end
                        end.push(hits[i].domains[j].$.jenv);
                        // indeval
                        indeval.push(hits[i].domains[j].$.ievalue);
                        // condeval
                        condval.push(hits[i].domains[j].$.cevalue);
                    }
                }
            }
        });

        var result = {
            id: id,
            accession: accession,
            desciption: desciption,
            region: region,
            start: start,
            end: end,
            indeval: indeval,
            condval: condval
        }
        console.info("Hmmscan in 3D DB finished: " + name);
        // console.log(result);
        res.send(result);
    });
})



module.exports = router;

