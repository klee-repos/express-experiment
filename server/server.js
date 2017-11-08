
'use strict';

var port = process.env.PORT || 3000;

var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

require('dotenv').config();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var gameNum = 0;
var gameNames = ['donkey','frog','bear'];

var mongoose = require('mongoose');
var Game = require('./models/game');
var atlasdb;
var uri = process.env.DB_URI;

mongoose.Promise = global.Promise;
mongoose.connect(uri, {useMongoClient: true}, function(err) {
	if (err) {
		console.log("Mongoose error: " + err);
	} else {
		atlasdb = mongoose.connection;
		console.log("Successfully connected to MongoDB Atlas via mongoose");
	}
});



io.on('connection',function(socket){
	console.log("User connected");
	socket.on('startSession',function(){
		var name = gameNames[gameNum];
		var found = false;

		var game = new Game({
			name: name,
			_id: name,
			score: 0,
			amzUserId: ""
		});

		Game.findOne({name: name}, function(err, foundGame) {
			if (foundGame) {
				found = true;
			} else {
				found = false;
			}
		}).then(function(foundGame) {
			if (found) {
				socket.join(name);
				console.log("Connected to existing session in db");
				gameNum++;
				socket.emit('gameName', name);
			} else {
				game.save(function(saveErr) {
					if (saveErr) {
						console.log(saveErr);
					} else {
						console.log("New session created in db");
					}
				}).then(function(game){
					socket.join(name);
					gameNum++;
					socket.emit('gameName', name);
				})
			}
		})
		socket.on('disconnect',function(){
			console.log("Game " + name + " ended");
			game.remove();
		});
	});
});

/* App routes */

app.get('/', function(req, res){
	res.sendFile(path.resolve('client/index.html'));
});

app.post('/connect', function(req, res) {
	var name = req.body.name;
	var amzUserId = req.body.amzUserId;
	Game.findOne({name: name}, function(err, game) {
		if (game) {
			game.amzUserId = amzUserId;
			game.save();
			res.send({"found":true});
		} else {
			res.send({"found":false});
		}
	})
});

app.post('/score', function(req, res){
	var name = req.body.name;
	var score = req.body.score;
	Game.findOne({name: name},function(err,game){
		game.score = score;
		game.save();
		io.to(name).emit('score',score);
	})
	res.end();
});

app.get('/score/:name', function(req, res){
	Game.findOne({name:req.params.name}, function(err,game){
		res.send(game);
	});
});

http.listen(port, function() {
	console.log("Node server running on port: " + port);
});