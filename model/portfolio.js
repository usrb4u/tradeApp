var mongoose = require('mongoose');

var portfolioSchema = mongoose.Schema({
    stockId:String,
    userId:String,
	presentValue:String,
	buyValue:String,
	stopLoss: String,
	baseValue:String,
	targetValue:String,
	quantity:String,
	track:Boolean,
    min_val:String,
	max_val:String,
	status:String
});

//status Vaules are : 'bought', 'sold', 'monitor'. default value 'monitor'

var portfolio = mongoose.model('portfolio',portfolioSchema);

module.exports = portfolio;



