var mongoose = require("mongoose");

var userInfoSchema = new mongoose.Schema({
	ipAddress: String,
	capacity: Number
});

module.exports = mongoose.model("userInfo", userInfoSchema);