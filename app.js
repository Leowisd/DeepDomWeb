var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	multer = require('multer'),
	fs = require("fs"),
	nodemailer = require("nodemailer"),
	sd = require("silly-datetime"),
	exec = require('child_process').exec;



mongoose.connect("mongodb://localhost/deepdom");

const upload = multer({
	dest: 'data/upload'
});
app.use(upload.any());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


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
	submittedTime: String
});

var jobInfo = mongoose.model("jobInfo", jobInfoSchema);


// INDEX: show the landing page
app.get("/", function (req, res) {
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
	res.render("JOBINFO", { jobId: jobId });
});

// JOBSLIST: show all jos
app.get("/jobs/all", function (req, res) {
	jobInfo.find({}, function(err, docs){
		res.render("JOBSLIST", {docs: docs});		
	});
});

// SHOW: show result
app.get("/jobs/:id", function (req, res) {
	var jobId = req.params.id;
	jobId = jobId.substr(1);


	var results = [];
	var arr = [];
	var file = jobId + '.txt';
	fs.readFile('data/results/' + file, function (err, data) {
		if (err) {
			return console.log(err);
		}
		arr = data.toString().split('\n');
		for (var i = 0; i < arr.length; i++)
			if (i % 2 == 0) {
				var result = { name: arr[i], score: arr[i + 1] }
				results.push(result);
			}
		// console.log(results);
		res.render("SHOW", { results: results });
	});
});


//Deal with sequence post
app.post("/upload/sequence", function (req, res) {
	var sequence = req.body.sequenceInput.trim();
	var email = req.body.emailInput1;
	var nickName = req.body.nickName1;
	// if (email !== undefined){
	// 	console.log(email);
	// }

	var job = new jobInfo({
		nickName : nickName,
		sequence: sequence,
		email: email,
		status: "uploading",
		submittedTime: sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
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

		job.status = 'Processing';
		job.save(function (err, job) {
			if (err) {
				console.log("SOMETHING WENT WRONG!");
			}
			else {
				console.log("Job was saved!");
				console.log("======================================");
				// console.log(job);
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

		//after convert, run the predict script
		console.log("Predict ready...");
		var arg3 = 'data/input/' + job.file;
		var arg4 = 'data/results/' + job.file;
		var workprecessor2 = exec("python DeepDom/predict.py -input " + arg3 + ' -output ' + arg4, function (error, stdout, stderr) {
			if (error) {
				console.info('stderr : ' + stderr);

				var updates = { $set: { status: 'error' } };
				job.updateOne(updates, function (err, job) {
					if (err) {
						console.log(err);
					}
					else {
						console.log("SOMETHING WENT WRONG!");
						// console.log(job);
					}
				});
				return;
			}
		});

		workprecessor2.on('exit', function (code) {
			console.info('Predict done!');
			// console.log('predict child process exit，exit code: '+code);		
			var updates = { $set: { status: 'Done' } };
			job.updateOne(updates, function (err, job) {
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
					to: email,
					text: 'Your job: ' + job.id + ' has completed!'
				};
				transporter.sendMail(mail, function (error, info) {
					if (error) return console.log(error);
					console.log('mail sent:', info.response);
				});
			}

		});

	});

	res.redirect("/upload/:" + job.id);
});

//Deal with file post
app.post("/upload/file", function (req, res) {

	var email = req.body.emailInput2;
	var nickName = req.body.nickName2;
	// if (email !== undefined)
	// 	console.log('email: ' + email);

	var job = new jobInfo({
		nickName : nickName,
		email: email,
		status: "uploading",
		submittedTime: sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')
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
	fs.unlinkSync(req.files[0].path); //delete the original file


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
		console.info('convert success!');
		// console.log('convert child process exit，exit code: '+code);

		job.status = 'Processing';
		job.save(function (err, job) {
			if (err) {
				console.log("SOMETHING WENT WRONG!");
			}
			else {
				console.log("Job was saved!");
				console.log("======================================");
				// console.log(job);
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

		//after convert, run the predict script
		var arg3 = 'data/input/' + job.file;
		var arg4 = 'data/results/' + job.file;
		var workprecessor2 = exec("python DeepDom/predict.py -input " + arg3 + ' -output ' + arg4, function (error, stdout, stderr) {
			if (error) {
				console.info('stderr : ' + stderr);
				var updates = { $set: { status: 'error' } };
				job.updateOne(updates, function (err, job) {
					if (err) {
						console.log(err);
					}
					else {
						console.log("SOMETHING WENT WRONG!");
						console.log("======================================");
						// console.log(job);
					}
				});
				return;
			}
		});
		workprecessor2.on('exit', function (code) {
			console.info('Predict done!');
			// console.log('predict child process exit，exit code: '+code);		
			var updates = { $set: { status: 'Done' } };
			job.updateOne(updates, function (err, job) {
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
			if (email !== "") {
				var mail = {
					from: 'DeepDom<deepdom.service@gmail.com>',
					subject: 'DeepDom: Job Infomation',
					to: email,
					text: 'Your job: ' + job.id + ' has completed!'
				};
				transporter.sendMail(mail, function (error, info) {
					if (error) return console.log(error);
					console.log('mail sent:', info.response);
				});
			}
		});

	});

	res.redirect("/upload/:" + job.id);
});


app.post("/result", function (req, res) {
	var jobId = req.body.JobIDInput.trim();
	res.redirect("/jobs/:" + jobId);
});


app.listen(3000, process.env.IP, function () {
	console.log("The DeepDom Server Has Started At: http://localhost:3000/");
	console.log("");
})