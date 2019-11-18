var express = require("express");
var router = express.Router();
var fs = require("fs"),
    parseString = require('xml2js').parseString,
    exec = require('child_process').exec;

router.post("/process/hmmscan", function (req, res) {
    // console.log(req.body.seq);
    var seq = req.body.seq;
    var name = req.body.name;

    console.info("Hmmscan start: " + name);
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
        parseString(stdout, function (err, result) {
            var hits = result.opt.data[0].hits;
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
                for (var j = 0; j < segments.length; j++){
                    segtmp.push(segments[j].$.start);
                    segtmp.push(segments[j].$.end);
                }
                seg.push(segtmp);
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
        console.info("Hmmscan finished: " + name);
        res.send(result);
    });
})


module.exports = router;

