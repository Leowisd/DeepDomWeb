var express 	= require("express"),
	app 		= express(),
	bodyParser 	= require("body-parser"),
// 	mongoose 	= require("mongoose"),
	multer = require('multer'),
	fs = require("fs"),
	exec = require('child_process').exec; 



// mongoose.connect("mongodb://localhost/deepdom");
const upload = multer({
	dest: 'data/upload'
});
app.use(upload.any());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");

app.get("/", function(req, res){
	res.render("landing");
});

app.get("/upload", function(req, res){
	res.render("upload");
});

app.get("/search", function(req, res){
	res.render("search");
});

//Get inprocess page
app.get("/inProcess", function(req, res){
	res.render("inProcess");
});

app.get("/status", function(req, res){
	res.render("status");
});

//Deal with sequence post
app.post("/inSequenceProcess", function(req, res){
	var sequence = req.body.sequenceInput;
	if (sequence !== undefined){
		//console.log(sequence);
		var email = req.body.emailInput1;	
	} 	
	if (email !== undefined){
		console.log(email);
	}
	
	// Create a new file and write the sequence in
	console.log("Data written ready");
	fs.writeFile('data/upload/uploadtest.txt', sequence,  function(err) {
		if (err) {
			return console.error(err);
		}
		console.log("Data written success!");
	 });

	// run the convert file script
	var arg1 = 'data/upload/uploadtest.txt';
	var arg2 = 'data/input/inputtest.txt';
	var workprecessor = exec("perl DeepDom/dataprocess.pl -input_seq "+ arg1+' -output_seq '+arg2 +' ',function(error,stdout,stderr){
    	if(error) {
        	console.info('stderr : '+stderr);
		}
	});
	workprecessor.on('exit', function (code) {
		console.info('convert success!');
		console.log('convert child process exit，exit code: '+code);
	});
	
	//after convert, run the predict script
	var arg3 = 'data/input/inputtest.txt';
	var arg4 = 'data/results/resulttest.txt';
	var workprecessor2 = exec("python DeepDom/predict.py -input "+arg3 + ' -output ' + arg4, function(error,stdout,stderr){
		if(error) {
			console.info('stderr : '+stderr);
		}
	}); 
	workprecessor2.on('exit', function (code) {
		console.info('predic done!');
		console.log('predict child process exit，exit code: '+code);
	});

	res.redirect("/inProcess");
});

//Deal with file post
app.post("/inFileProcess", function(req, res){
	// console.log(req.body);
	var email = req.body.emailInput2;
	if (email !== undefined)
		console.log('email: ' + email);
	// console.log(req.files);
	var des_file = 'data/upload/' + req.files[0].originalname;
	fs.readFile(req.files[0].path, function(err, data){
		fs.writeFile(des_file, data, function(err){
			if (err){
				console.log(err);
			}else{
				console.log('File: ' + req.files[0].originalname + ' uploaded successfully');
			}
		});
	});
	fs.unlinkSync(req.files[0].path); //delete the original file

	// run the convert file script
	var arg1 = des_file;
	var arg2 = 'data/input/' + req.files[0].originalname;
	var workprecessor = exec("perl DeepDom/dataprocess.pl -input_seq "+ arg1+' -output_seq '+arg2 +' ',function(error,stdout,stderr){
    	if(error) {
        	console.info('stderr : '+stderr);
		}
	});
	workprecessor.on('exit', function (code) {
		console.info('convert success!');
		console.log('convert child process exit，exit code: '+code);
	});
	
	//after convert, run the predict script
	var arg3 = 'data/input/' + req.files[0].originalname;
	var arg4 = 'data/results/' + req.files[0].originalname;
	var workprecessor2 = exec("python DeepDom/predict.py -input "+arg3 + ' -output ' + arg4, function(error,stdout,stderr){
		if(error) {
			console.info('stderr : '+stderr);
		}
	}); 
	workprecessor2.on('exit', function (code) {
		console.info('predic done!');
		console.log('predict child process exit，exit code: '+code);
	});

	res.redirect("/inProcess");
});


app.listen(3000, process.env.IP, function(){
	console.log("The DeepDom Server Has Started At: http://localhost:3000/!");
	console.log("");
})