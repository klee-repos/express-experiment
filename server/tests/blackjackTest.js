 var Blackjack = require('../models/Blackjack.js');

var Deck = require('../models/Deck');

var d = new Deck();


// d.shuffle().then(function(result){
// 	console.log(d.deal(2));
// }, function(err){
// 	console.log(err);
// });

var game = new Blackjack();
game.startNewGame();
console.log(game);
game.hit();
