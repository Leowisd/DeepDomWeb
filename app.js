var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	multer = require('multer'),
	fs = require("fs"),
	nodemailer = require("nodemailer"),
	sd = require("silly-datetime"),
	schedule = require("node-schedule"),
	exec = require('child_process').exec;

mongoose.connect("mongodb://localhost/deepdom");

const upload = multer({
	dest: 'data/upload'
});
app.use(upload.any());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static('assets'))

// SMTP CONFIG
// deepdom.service@gamil.com
// deepdom@2019
var config = {
	host: 'smtp.gmail.com',
	port: 465,
	auth: {
		user: 'deepdom.service@gmail.com',
		pass: 'deepdom@2019'
	}
};
var transporter = nodemailer.createTransport(config);

// SCHEMA SETUP
var jobInfoSchema = new mongoose.Schema({
	nickName: String,
	sequence: String,
	file: String,
	email: String,
	status: String,
	submittedTime: String,
	ipAddress: String
});

var jobInfo = mongoose.model("jobInfo", jobInfoSchema);

var userInfoSchema = new mongoose.Schema({
	ipAddress: String,
	capacity: Number
});

var userInfo = mongoose.model("userInfo", userInfoSchema);

// Set Process Count and Wailting List
var curProcess = 0;
var taskList = [];

// INDEX: show the landing page
app.get("/", function (req, res) {
	// console.log(get_client_ip(req));
	res.render("INDEX");
});

// UPLOAD: show the upload page
app.get("/upload", function (req, res) {
	res.render("UPLOAD");
});

// SEARCH: show the search page
app.get("/jobs", function (req, res) {
	res.render("SEARCH");
});

// JOBINFO: show the current job info
app.get("/upload/:id", function (req, res) {
	var jobId = req.params.id;
	jobId = jobId.substr(1); // delete the ':'

	var flag = 0;
	jobInfo.find({ _id: jobId }, function (err, docs) {
		if (docs.length > 0)
			if (docs[0].status === 'Done') {
				flag = 1;
			}
		res.render("JOBINFO", { jobId: jobId, flag: flag });
	});
});

// JOBSLIST: show all jos
app.get("/jobs/all", function (req, res) {
	jobInfo.find({ 'ipAddress': get_client_ip(req) }, function (err, docs) {
		if (err)
			console.error(err);
		res.render("JOBSLIST", { docs: docs, ip: get_client_ip(req) });
	});
});

// SHOW: show result
app.get("/jobs/:id", function (req, res) {
	var jobId = req.params.id;
	jobId = jobId.substr(1);


	var file = jobId + '.txt';

	var results = [];
	var arr = fs.readFileSync('data/results/' + file).toString().split('\n');
	for (var i = 0; i < arr.length; i++)
		if (i % 2 == 0) {
			var result = { name: arr[i], score: arr[i + 1] }
			results.push(result);
		}

	var data = fs.readFileSync('data/input/' + file).toString().split('\n');
	var seq = [];
	var j = 0;
	for (var i = 0; i < results.length; i++) {
		var name = results[i].name;
		var s = "";
		var num = 0;
		while (j < data.length) {
			var tmp = data[j].lastIndexOf('_');
			var na = data[j].substring(0, tmp);

			if (name === na) {
				if (s != "") {
					if (num > 0) {
						s = s.substring(0, 80 * num);
					}
				}
				s += data[j + 1];
				j += 2;
				num++;
			}
			else {
				seq.push(s);
				s = "";
				break;
			}
		}
	}
	res.render("SHOW", { results: results, seq: seq, file: file });
	// fs.readFile('data/results/' + file, function (err, data) {
	// 	if (err) {
	// 		return console.log(err);
	// 	}
	// 	arr = data.toString().split('\n');
	// 	for (var i = 0; i < arr.length; i++)
	// 		if (i % 2 == 0) {
	// 			var result = { name: arr[i], score: arr[i + 1] }
	// 			results.push(result);
	// 		}
	// 	// console.log(results);
	// 	res.render("SHOW", { results: results, seq: seq, file: file });
	// });
});


// DOWNLOAD: download the result file
app.get("/jobs/download/:id", function (req, res) {
	var file = req.params.id.substr(1);
	res.download("data/results/" + file);
});

// DELETE: delete the selected job
app.post("/jobs/delete/:id", function (req, res) {
	var job = req.params.id.substr(1);
	// console.log(job);

	var fileSize = 0;
	fs.stat('data/upload/' + job + '.txt', function(err, stats){
		if (err)
			return console.error(err);
		fileSize = stats.size;
	});
	userInfo.findOne({'ipAddress': get_client_ip(req)}, function(err, doc){
		if (err)
			console.error(err);
		if (doc != undefined){
			var update = { $set: { capacity: doc.capacity - fileSize } };
			userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
				if (err)
					console.log(err);
				else {
					console.log("User info was updated!");
					console.log("User Size: " + (doc.capacity - fileSize));
				}
			});
		}
	});

	jobInfo.findOne({ _id: job }, function (err, doc) {
		if (err)
			return console.error(err);
		if (doc != undefined) {
			var dFile = doc.file;
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
		return console.log("Delete files of the job: " + job);
	});
	jobInfo.deleteOne({ _id: job }, function (err) {
		if (err)
			return console.error(err);
		console.log("Delete log of the job:" + job);
		return console.log("======================================");
	});
});


//Deal with sequence post
app.post("/upload/sequence", function (req, res) {
	var sequence = req.body.sequenceInput.trim();
	var email = req.body.emailInput1;
	var nickName = req.body.nickName1;

	var job = new jobInfo({
		nickName: nickName,
		sequence: sequence,
		email: email,
		status: "uploaded",
		submittedTime: sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
		ipAddress: get_client_ip(req)
	});
	job.file = job.id + '.txt';

	// Create a new file and write the sequence in
	console.log("Data written ready...");
	// fs.writeFile('data/upload/'+job.file, sequence,  function(err) {
	// 	if (err) {
	// 		return console.error(err);
	// 	}
	// 	console.log("Data written success!");
	// });
	fs.writeFileSync('data/upload/' + job.file, sequence);
	console.log("Data written success!");
	console.log("======================================");
	
	var fileSize = 0;
	fs.stat('data/upload/' + job.file, function(err, stats){
		if (err)
			return console.error(err);
		fileSize = stats.size;
	});
	userInfo.findOne({'ipAddress': get_client_ip(req)}, function(err, doc){
		if (err)
			console.error(err);
		if (doc == undefined){
			var user = new userInfo({
				ipAddress: get_client_ip(req),
				capacity: fileSize
			});
			user.save(function(err, u){
				if (err)
					console.error(err);
				else {
					console.log("Create a new user: " + get_client_ip(req));
					console.log("======================================");
				}
			})
		}
		else{
			var update = { $set: { capacity: doc.capacity + fileSize } };
			userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
				if (err)
					console.log(err);
				else {
					console.log("User info was updated!");
					console.log("User size: " + (doc.capacity + fileSize));
					console.log("======================================");
				}
			});
		}
	});

	taskList.push(job.id);

	job.save(function (err, job) {
		if (err) {
			console.log("SOMETHING WENT WRONG!");
		}
		else {
			console.log("Job was saved!");
			console.log("======================================");
		}
	});

	// send job ID email
	if (job.email !== "") {
		var mail = {
			from: 'DeepDom<deepdom.service@gmail.com>',
			subject: 'DeepDom: Job Infomation',
			to: email,
			text: 'Your job ID is:' + job.id
		};
		transporter.sendMail(mail, function (error, info) {
			if (error) return console.log(error);
			console.log('mail sent:', info.response);
		});
	}
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////


	// // run the convert file script
	// console.log("Data convert ready...");
	// var arg1 = 'data/upload/' + job.file;
	// var arg2 = 'data/input/' + job.file;
	// var workprecessor = exec("perl DeepDom/dataprocess.pl -input_seq " + arg1 + ' -output_seq ' + arg2 + ' ', function (error, stdout, stderr) {
	// 	if (error) {
	// 		console.info('stderr : ' + stderr);
	// 		job.status = 'error';
	// 		return;
	// 	}
	// });
	// workprecessor.on('exit', function (code) {
	// 	console.info('Data convert success!');
	// 	// console.log('convert child process exit，exit code: '+code);

	// 	job.status = 'Processing';
	// 	job.save(function (err, job) {
	// 		if (err) {
	// 			console.log("SOMETHING WENT WRONG!");
	// 		}
	// 		else {
	// 			console.log("Job was saved!");
	// 			console.log("======================================");
	// 			// console.log(job);
	// 		}
	// 	});

	// 	// send job ID email
	// 	if (job.email !== "") {
	// 		var mail = {
	// 			from: 'DeepDom<deepdom.service@gmail.com>',
	// 			subject: 'DeepDom: Job Infomation',
	// 			to: email,
	// 			text: 'Your job ID is:' + job.id
	// 		};
	// 		transporter.sendMail(mail, function (error, info) {
	// 			if (error) return console.log(error);
	// 			console.log('mail sent:', info.response);
	// 		});
	// 	}

	// 	//after convert, run the predict script
	// 	console.log("Predict ready...");
	// 	var arg3 = 'data/input/' + job.file;
	// 	var arg4 = 'data/results/' + job.file;
	// 	var workprecessor2 = exec("python DeepDom/predict.py -input " + arg3 + ' -output ' + arg4, function (error, stdout, stderr) {
	// 		if (error) {
	// 			console.info('stderr : ' + stderr);

	// 			var updates = { $set: { status: 'error' } };
	// 			job.updateOne(updates, function (err, job) {
	// 				if (err) {
	// 					console.log(err);
	// 				}
	// 				else {
	// 					console.log("SOMETHING WENT WRONG!");
	// 					// console.log(job);
	// 				}
	// 			});
	// 			return;
	// 		}
	// 	});

	// 	workprecessor2.on('exit', function (code) {
	// 		console.info('Predict done!');
	// 		// console.log('predict child process exit，exit code: '+code);		
	// 		var updates = { $set: { status: 'Done' } };
	// 		job.updateOne(updates, function (err, job) {
	// 			if (err) {
	// 				console.log(err);
	// 			}
	// 			else {
	// 				console.log("Job was updated!");
	// 				console.log("======================================");
	// 				// console.log(job);
	// 			}
	// 		});

	// 		// send success email 
	// 		if (job.email !== "") {
	// 			var mail = {
	// 				from: 'DeepDom<deepdom.service@gmail.com>',
	// 				subject: 'DeepDom: Job Infomation',
	// 				to: email,
	// 				text: 'Your job: ' + job.id + ' has completed!'
	// 			};
	// 			transporter.sendMail(mail, function (error, info) {
	// 				if (error) return console.log(error);
	// 				console.log('mail sent:', info.response);
	// 			});
	// 		}

	// 	});

	// });

	res.redirect("/upload/:" + job.id);
});

//Deal with file post
app.post("/upload/file", function (req, res) {

	var email = req.body.emailInput2;
	var nickName = req.body.nickName2;
	// if (email !== undefined)
	// 	console.log('email: ' + email);

	var job = new jobInfo({
		nickName: nickName,
		email: email,
		status: "uploaded",
		submittedTime: sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
		ipAddress: get_client_ip(req)
	});
	job.file = job.id + '.txt';

	var data = fs.readFileSync(req.files[0].path);
	fs.writeFileSync('data/upload/' + job.file, data);
	console.log('File: ' + req.files[0].originalname + ' uploaded successfully');
	console.log("======================================");
	// var des_file = 'data/upload/' + job.file;
	// fs.readFile(req.files[0].path, function(err, data){
	// 	fs.writeFile(des_file, data, function(err){
	// 		if (err){
	// 			console.log(err);
	// 			return;

	// 		}else{
	// 			console.log('File: ' + req.files[0].originalname + ' uploaded successfully');
	// 			console.log("======================================");
	// 		}
	// 	});
	// });
	fs.unlink(req.files[0].path, function (err) {
		if (err)
			console.error(err);
	}); //delete the original file

	var fileSize = 0;
	fs.stat('data/upload/' + job.file, function(err, stats){
		if (err)
			return console.error(err);
		fileSize = stats.size;
	});
	userInfo.findOne({'ipAddress': get_client_ip(req)}, function(err, doc){
		if (err)
			console.error(err);
		if (doc == undefined){
			var user = new userInfo({
				ipAddress: get_client_ip(req),
				capacity: fileSize
			});
			user.save(function(err, u){
				if (err)
					console.error(err);
				else {
					console.log("Create a new user: " + get_client_ip(req));
					console.log("======================================");
				}
			})
		}
		else{
			var update = { $set: { capacity: doc.capacity + fileSize } };
			userInfo.updateOne({ 'ipAddress': get_client_ip(req) }, update, function (err, u) {
				if (err)
					console.log(err);
				else {
					console.log("User info was updated!");
					console.log("User size: " + (doc.capacity + fileSize));
					console.log("======================================");
				}
			});
		}
	});

	taskList.push(job.id);

	job.save(function (err, job) {
		if (err) {
			console.log("SOMETHING WENT WRONG!");
		}
		else {
			console.log("Job was saved!");
			console.log("======================================");
		}
	});

	// send job ID email
	if (job.email !== "") {
		var mail = {
			from: 'DeepDom<deepdom.service@gmail.com>',
			subject: 'DeepDom: Job Infomation',
			to: email,
			text: 'Your job ID is:' + job.id
		};
		transporter.sendMail(mail, function (error, info) {
			if (error) return console.log(error);
			console.log('mail sent:', info.response);
		});
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// // run the convert file script
	// console.log("Data convert ready...");
	// var arg1 = 'data/upload/' + job.file;
	// var arg2 = 'data/input/' + job.file;
	// var workprecessor = exec("perl DeepDom/dataprocess.pl -input_seq " + arg1 + ' -output_seq ' + arg2 + ' ', function (error, stdout, stderr) {
	// 	if (error) {
	// 		console.info('stderr : ' + stderr);
	// 		job.status = 'error';
	// 		return;
	// 	}
	// });
	// workprecessor.on('exit', function (code) {
	// 	console.info('convert success!');
	// 	// console.log('convert child process exit，exit code: '+code);

	// 	job.status = 'Processing';
	// 	job.save(function (err, job) {
	// 		if (err) {
	// 			console.log("SOMETHING WENT WRONG!");
	// 		}
	// 		else {
	// 			console.log("Job was saved!");
	// 			console.log("======================================");
	// 			// console.log(job);
	// 		}
	// 	});

	// 	// send job ID email
	// 	if (job.email !== "") {
	// 		var mail = {
	// 			from: 'DeepDom<deepdom.service@gmail.com>',
	// 			subject: 'DeepDom: Job Infomation',
	// 			to: email,
	// 			text: 'Your job ID is:' + job.id
	// 		};
	// 		transporter.sendMail(mail, function (error, info) {
	// 			if (error) return console.log(error);
	// 			console.log('mail sent:', info.response);
	// 		});
	// 	}

	// 	//after convert, run the predict script
	// 	var arg3 = 'data/input/' + job.file;
	// 	var arg4 = 'data/results/' + job.file;
	// 	var workprecessor2 = exec("python DeepDom/predict.py -input " + arg3 + ' -output ' + arg4, function (error, stdout, stderr) {
	// 		if (error) {
	// 			console.info('stderr : ' + stderr);
	// 			var updates = { $set: { status: 'error' } };
	// 			job.updateOne(updates, function (err, job) {
	// 				if (err) {
	// 					console.log(err);
	// 				}
	// 				else {
	// 					console.log("SOMETHING WENT WRONG!");
	// 					console.log("======================================");
	// 					// console.log(job);
	// 				}
	// 			});
	// 			return;
	// 		}
	// 	});
	// 	workprecessor2.on('exit', function (code) {
	// 		console.info('Predict done!');
	// 		// console.log('predict child process exit，exit code: '+code);		
	// 		var updates = { $set: { status: 'Done' } };
	// 		job.updateOne(updates, function (err, job) {
	// 			if (err) {
	// 				console.log(err);
	// 			}
	// 			else {
	// 				console.log("Job was updated!");
	// 				console.log("======================================");
	// 				// console.log(job);
	// 			}
	// 		});

	// 		// send success email 
	// 		if (email !== "") {
	// 			var mail = {
	// 				from: 'DeepDom<deepdom.service@gmail.com>',
	// 				subject: 'DeepDom: Job Infomation',
	// 				to: email,
	// 				text: 'Your job: ' + job.id + ' has completed!'
	// 			};
	// 			transporter.sendMail(mail, function (error, info) {
	// 				if (error) return console.log(error);
	// 				console.log('mail sent:', info.response);
	// 			});
	// 		}
	// 	});

	// });

	res.redirect("/upload/:" + job.id);
});

// Search POST
app.post("/resultById", function (req, res) {
	var jobId = req.body.JobIDInput.trim();
	res.redirect("/jobs/:" + jobId);
});

app.post("/resultByName", function (req, res) {
	var name = req.body.NicknameInput.trim();

	jobInfo.find({ 'nickName': { $regex: name } }, function (err, docs) {
		res.render("JOBSLIST", { docs: docs });
	});
});

app.post("/resultBySeq", function (req, res) {
	var seq = req.body.sequenceInput.trim();
	jobInfo.find({ 'sequence': seq }, function (err, docs) {
		res.render("JOBSLIST", { docs: docs });
	});
});

app.get("*", function (req, res) {
	res.render("404");
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
				var workprecessor = exec("perl DeepDom/dataprocess.pl -input_seq " + arg1 + ' -output_seq ' + arg2 + ' ', function (error, stdout, stderr) {
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
					console.log("Predict ready...");
					var arg3 = 'data/input/' + job.file;
					var arg4 = 'data/results/' + job.file;
					var workprecessor2 = exec("python DeepDom/predict.py -input " + arg3 + ' -output ' + arg4, function (error, stdout, stderr) {
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
						// console.log('predict child process exit，exit code: '+code);		
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
	var curTime = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
	var curDay = parseInt(curTime.substring(8));
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

function get_client_ip(req) {
	var ipStr = req.ip.split(':');
	return ipStr[ipStr.length - 1];
};

app.listen(3000, process.env.IP, function () {
	console.log("The DeepDom Server Has Started At: http://localhost:3000/");
	console.log("");
})