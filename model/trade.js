var mongoose = require('mongoose');

var tradeSchema = mongoose.Schema({
	stockId:String,
	userId:String,
	buyVal:String,
	buy_quantity: Boolean,
	sellValue:String,
	sell_quantity:String,
	regDate:Date,
	subscription:String
});

var trade = mongoose.model('trade',tradeSchema);

module.exports = trade;