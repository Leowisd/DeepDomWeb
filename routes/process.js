var express = require("express");
var router = express.Router();
var fs = require("fs"),
    parseString = require('xml2js').parseString,
    exec = require('child_process').exec;

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

        if (stdout == undefined) res.send(undefined);   //in case of service busy

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
        
        if (stdout == undefined) res.send(undefined);   //in case of service busy

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

