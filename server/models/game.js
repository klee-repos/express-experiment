var mongoose = require('mongoose');

var gameSchema = new mongoose.Schema(
	{
		_id: String,
		score: {type:Number, default:0},
		began: {type:Date, default:Date.now},
		name: String,
		amzUserId: String
	});

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;