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
				var cmd1 = "perl Modules/DEEPDOM/dataprocess.pl -input_seq " + arg1 + ' -output_seq ' + arg2 + ' ';
				var workprecessor = exec(cmd1, function (error, stdout, stderr) {
					if (error) {
						console.info('stderr : ' + stderr);
						var updates = { $set: { status: 'error' } };
						jobInfo.updateOne({ _id: job.id }, updates, function (err, job) {
							if (err) {
								console.log(err);
							}
							else {
								console.log("SOMETHING WENT WRONG WHEN CONVERT!");
								// console.log(job);
							}
						});
						// return;
					}
				});
				workprecessor.on('exit', function (code) {
					console.info('Data convert success...');
					// console.log('convert child process exit，exit code: '+code);

					//after convert, run the predict script
					// python predict.py -input processed_seq.txt -output predict_result.txt -model-prefix cpu_model.h5
					console.log("Predict ready...");
					var arg3 = 'data/input/' + job.file;
					var arg4 = 'data/results/' + job.id + '.res';
					// CPU
					var cmd2 = "python Modules/DEEPDOM/predict.py -input " + arg3 + ' -output ' + arg4 + " -model-prefix Modules/DEEPDOM/cpu_model.h5";
					// GPU
					// var cmd2 = "python Modules/DEEPDOM/predict.py -input " + arg3 + ' -output ' + arg4;
					var workprecessor2 = exec(cmd2, function (error, stdout, stderr) {
						if (error) {
							console.info('stderr : ' + stderr);
							var updates = { $set: { status: 'error' } };
							jobInfo.updateOne({ _id: job.id }, updates, function (err, job) {
								if (err) {
									console.log(err);
								}
								else {
									console.log("SOMETHING WENT WRONG WHEN DEEPDOM!");
									// console.log(job);
								}
							});
							// return;
						}
					});

					workprecessor2.on('exit', function (code) {
						console.info('Predict done...');

						// Run SCOP Superfamily scan
						console.info("SCOP Starts...");
						var arg5 = 'data/upload/' + job.file;
						var cmd3 = 'perl Modules/SCOP/superfamily.pl ' + arg5;
						var workprecessor3 = exec(cmd3, function (error, stdout, stderr) {
							if (error) {
								console.info('stderr : ' + stderr);
								var updates = { $set: { status: 'error' } };
								jobInfo.updateOne({ _id: job.id }, updates, function (err, job) {
									if (err) {
										console.log(err);
									}
									else {
										console.log("SOMETHING WENT WRONG WHEN SCOP!");
										// console.log(job);
									}
								});
								// return;
							}
						});

						workprecessor3.on('exit', function (code) {
							// clean tmp files
							fs.unlink('data/tmp/' + job.id + '_torun.fa', function (err) {
								if (err)
									console.error(err);
							});
							fs.unlink('data/tmp/' + job.id + '.res', function (err) {
								if (err)
									console.error(err);
							});
							console.info("SCOP done...");

							// // Run CATH scan
							console.info("CATH Starts...");
							var arg6 = 'data/upload/' + job.file;
							var cmd4 = 'perl Modules/CATH/cath.pl ' + arg6;
							var workprecessor4 = exec(cmd4, function (error, stdout, stderr) {
								if (error) {
									console.info('stderr : ' + stderr);
									var updates = { $set: { status: 'error' } };
									jobInfo.updateOne({ _id: job.id }, updates, function (err, job) {
										if (err) {
											console.log(err);
										}
										else {
											console.log("SOMETHING WENT WRONG WHEN CATH!");
											// console.log(job);
										}
									});
								}
							});

							workprecessor4.on('exit', function (code) {
								// copy the result to CATH results file
								var cdata = fs.readFileSync('data/tmp/' + job.id + '.crh.csv');
								fs.writeFileSync('data/CATH/' + job.id + '.csv', cdata);
								// clean tmp files
								fs.unlink('data/tmp/' + job.id + '.crh', function (err) {
									if (err)
										console.error(err);
								});
								fs.unlink('data/tmp/' + job.id + '.crh.csv', function (err) {
									if (err)
										console.error(err);
								});
								fs.unlink('data/tmp/' + job.id + '.hmmsearch', function (err) {
									if (err)
										console.error(err);
								});
								console.info("CATH done...");

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


					});

				});

			}
		});
	}
});

// clean data per week
// schedule.scheduleJob('0 * * * * *', function () {

schedule.scheduleJob('0 0 0 * * 0', function () {
	var curTime = moment().utcOffset("-06:00").format('YYYY-MM-DD HH:mm:ss');
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
				fs.unlink('data/results/' + docs[i].id + '.res', function (err) {
					if (err) console.error(err);
				});
				fs.unlink('data/upload/' + dFile, function (err) {
					if (err) console.error(err);
				});
				fs.unlink('data/SCOP/' + docs[i].id + '.ass', function (err) {
					if (err) console.error(err);
				});
				fs.unlink('data/CATH/' + docs[i].id + '.csv', function (err) {
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