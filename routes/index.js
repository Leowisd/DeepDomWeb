var express = require("express");
var router = express.Router({ mergeParams: true });
var sd = require("silly-datetime"),
	fs = require("fs"),
	schedule = require("node-schedule"),
	moment = require("moment"),
	request = require("request");
exec = require('child_process').exec;

var jobInfo = require("../models/jobInfo");
var transporter = require("../models/emailConfig");

// Set Process Count and Wailting List
taskList = [];
var curProcess = 0;

// INDEX: show the landing page
router.get("/", function (req, res) {
	// console.log(get_client_ip(req));
	res.render("INDEX");
});

// Set a rule schedule to run tasks per 5s
var rule = new schedule.RecurrenceRule();
var ruleTime = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
rule.second = ruleTime;
schedule.scheduleJob(rule, function () {
	if (curProcess == 0 && taskList.length > 0) {
		curProcess = 1;
		console.log("Should run task");

		var curJob = taskList.shift();

		jobInfo.findById(curJob, function (err, job) {
			if (err)
				console.error(err);
			else {
				// run the convert file script
				console.log("Data convert ready...");
				var arg1 = 'data/upload/' + job.file;
				var arg2 = 'data/input/' + job.file;
				var cmd1 = "perl DeepDom/dataprocess.pl -input_seq " + arg1 + ' -output_seq ' + arg2 + ' ';
				var workprecessor = exec(cmd1, function (error, stdout, stderr) {
					if (error) {
						console.info('stderr : ' + stderr);
						job.status = 'error';
						return;
					}
				});
				workprecessor.on('exit', function (code) {
					console.info('Data convert success!');
					// console.log('convert child process exit，exit code: '+code);

					//after convert, run the predict script
					// python predict.py -input processed_seq.txt -output predict_result.txt -model-prefix cpu_model.h5
					console.log("Predict ready...");
					var arg3 = 'data/input/' + job.file;
					var arg4 = 'data/results/' + job.file;
					// CPU
					var cmd2 = "python DeepDom/predict.py -input " + arg3 + ' -output ' + arg4 + " -model-prefix DeepDom/cpu_model.h5";
					// GPU
					// var cmd2 = "python DeepDom/predict.py -input " + arg3 + ' -output ' + arg4;
					var workprecessor2 = exec(cmd2, function (error, stdout, stderr) {
						if (error) {
							console.info('stderr : ' + stderr);

							var updates = { $set: { status: 'error' } };
							jobInfo.updateOne({ _id: job.id }, updates, function (err, job) {
								if (err) {
									console.log(err);
								}
								else {
									console.log("SOMETHING WENT WRONG!");
									// console.log(job);
								}
							});
							// return;
						}
					});

					workprecessor2.on('exit', function (code) {
						console.info('Predict done!');

						curProcess = 0;
						var updates = { $set: { status: 'Done' } };
						jobInfo.updateOne({ _id: job.id }, updates, function (err, job) {
							if (err) {
								console.log(err);
							}
							else {
								console.log("Job was updated!");
								console.log("======================================");
								// console.log(job);
							}
						});

						// send success email 
						if (job.email !== "") {
							var mail = {
								from: 'DeepDom<deepdom.service@gmail.com>',
								subject: 'DeepDom: Job Infomation',
								to: job.email,
								text: 'Your job: ' + job.id + ' has completed!'
							};
							transporter.sendMail(mail, function (error, info) {
								if (error) return console.log(error);
								console.log('mail sent:', info.response);
							});
						}

					});

				});

			}
		});
	}
});

// clean data per week
// schedule.scheduleJob('0 * * * * *', function () {

schedule.scheduleJob('0 0 0 * * 0', function () {
	var curTime = moment().format('YYYY-MM-DD HH:mm:ss');
	var curDay = parseInt(curTime.substring(8, 10));
	var curMonth = parseInt(curTime.substring(5, 7));
	var curYear = parseInt(curTime.substring(0, 4));
	curDay -= 7;
	if (curDay <= 0) {
		curDay = 30 + curDay;
		curMonth--;
		if (curMonth <= 0) {
			curMonth = 12 + curMonth;
			curYear--;
		}
	}
	var due = curYear + "-" + curMonth + "-" + curDay + " 00:00:00";
	// var due = '2020' + "-" + curMonth + "-" + curDay + " 00:00:00";

	jobInfo.find({ 'submittedTime': { $lte: due } }, function (err, docs) {
		if (err)
			return console.error(err);
		if (docs != undefined) {
			for (var i = 0; i < docs.length; i++) {
				var dFile = docs[i].file;
				fs.unlink('data/input/' + dFile, function (err) {
					if (err) console.error(err);
				});
				fs.unlink('data/results/' + dFile, function (err) {
					if (err) console.error(err);
				});
				fs.unlink('data/upload/' + dFile, function (err) {
					if (err) console.error(err);
				});
			}
		}
		return console.log("Clean Old Tasks Files at:" + curTime);
	});

	jobInfo.deleteMany({ 'submittedTime': { $lte: due } }, function (err) {
		if (err)
			return console.error(err);
		return console.log("Clean Old Tasks Historys at:" + curTime);
	});

});

module.exports = router;