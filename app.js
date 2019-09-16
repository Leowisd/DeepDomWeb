var express 	= require("express"),
	app 		= express(),
	bodyParser 	= require("body-parser"),
	mongoose 	= require("mongoose");

mongoose.connect("mongodb://localhost/deepdom");
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

//Deal with sequence post
app.post("/inSequenceProcess", function(req, res){
	var sequence = req.body.sequenceInput;
	if (sequence !== undefined){
		var email = req.body.emailInput1;	
	} 	
	if (email !== undefined){
		console.log(email);
	}
	res.redirect("/inProcess");
});

//Deal with file post
app.post("/inFileProcess", function(req, res){
	var con = req.body;
	console.log(req.file);
	res.redirect("/inProcess");
});


app.listen(3000, process.env.IP, function(){
	console.log("The DeepDom Server Has Started!");
})