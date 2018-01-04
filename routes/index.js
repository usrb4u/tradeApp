var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config/config.js');
var Portfolio = require(process.cwd() + '/model/portfolio');
var schedule = require('node-schedule');
var query = 'http://localhost:7000/stockapi/' ;
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

var stockInfo = [];

var startRule = new schedule.RecurrenceRule();
startRule.dayOfWeek = [0, new schedule.Range(1, 5)];
startRule.hour = 18;
startRule.minute = 44;
startRule.second= 00;

var endRule = new schedule.RecurrenceRule();
endRule.dayOfWeek = [0, new schedule.Range(1, 5)];
endRule.hour = 15;
endRule.minute = 25;
var stJob =null;
var j = schedule.scheduleJob(startRule, function(){
  getPortfolioInfo();
  // console.log('Started first schedule');
   stJob = schedule.scheduleJob('*/2 * * * *',function(){
     console.log('monitoring every query');
     getPortfolioInfo();
    
      function go(pos){
      setTimeout(function(){
    
          if(pos < stockInfo.length) {
            monitorLiveInfo(stockInfo[pos],pos);
            go(++pos);
          }else
          return;
        
      }, 2000);
    }
    go(0);
    
    
  })
  // console.log('The answer to life, the universe, and everything!');
});


var transporter = nodemailer.createTransport(smtpTransport({
  host: config.email.host,
  secure: true,
  port: config.email.port,
  auth: {
      user: config.email.userId,
      pass: config.email.pwd
  },
  tls: { rejectUnauthorized: false }
}));
//santhi4u@outlook.com
var sendMail = function(mail,stockId, status, value,baseValue){
  transporter.sendMail({
    from: config.email.userId,
    to: mail,
    subject: 'Stock Status for '+stockId,
    html: "Dear Santhi, <br/>"+status+" your Stock id:"+ stockId+" .<br/> Current Value : "+value+"<br/> Considered Base Value: "+baseValue +  "<br/> <br/> Regards, <br/>Srinivas<br/>",
}, function (error, response) {
    if (error) {
        console.log(error);
    } else {
        console.log("Message sent to reset password for User: " +mail);
    }
});
}

var k = schedule.scheduleJob(endRule, function(){
  console.log('End job called');
  if(stJob){
    stJob.cancel();
  }
})

var SLValue =0;
var percentage = 0;

var getPortfolioInfo = function(){
  Portfolio.find({}).lean().exec(function(err,results){
    stockInfo = results;
    console.log("Got Stock info from Portfolio Table");
  })
}

var  updateBaseValue = function(stockId,val, stat) {
  // Portfolio.find({stockId:stockId}).lean().exec(function(err,results){
    console.log('Updating record for '+stockId+' '+val);
    Portfolio.update({ stockId: stockId }, {
      $set: {
          status: stat,
          baseValue: val
      }
  }).lean().exec(function (err, docs) {
    if(err)
    console.log('Invalid stock Id to update values')

  })
}

var changeCurrentValue = function(val,pos){
  stockInfo[pos].presentValue = val;
}


var monitorLiveInfo = function(stockObj, position){
  
    
    request(query+stockObj.stockId, function (error, response, body) {
      if (response.statusCode == 400 || error) {
        console.log({ success: false, message: 'Invalid Id' });
        console.log(error);
      } else
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body);
          changeCurrentValue(body.lastPrice,position)
          console.log(stockObj.stockId+' '+body.lastPrice+' '+stockObj.status);
          if(stockObj.status=='buy'){
            if(stockObj.baseValue < body.lastPrice) {
              //update record in DB
               stockObj.baseValue = body.dayHigh;
               sendMail('srinivasarau31@gmail.com',stockObj.stockId,'Buy',body.baseValue,stockObj.baseValue)
               updateBaseValue(stockObj.stockId,body.dayHigh, 'buy');
            }else {
              SLValue = stockObj.baseValue - body.lastPrice;
              percentage = SLValue * 100 / stockObj.baseValue;
              if(percentage > stockObj.stopLoss){
                // change the status to sold and find the down trend value for buy
                sendMail('srinivasarau31@gmail.com',stockObj.stockId,'Buy',body.baseValue,stockObj.baseValue)
                updateBaseValue(stockObj.stockId,body.dayLow, 'sell');
              }
            }
          }


          if(stockObj.status=='sell'  || stockObj.status == 'monitor'){
            if(stockObj.baseValue > body.lastPrice) {
              //update record in DB
              updateBaseValue(stockObj.stockId, body.lastPrice, 'sell');
               stockObj.baseValue = body.lastPrice;
            }else {
              SLValue = stockObj.baseValue - body.dayLow;
              percentage = SLValue * 100 / stockObj.dayLow;
              if(percentage > stockObj.stopLoss){
                // change the status to buy and find the uptrend trend value for sell
                sendMail('srinivasarau31@gmail.com',stockObj.stockId,'Sell',body.baseValue,stockObj.baseValue)
                updateBaseValue(stockObj.stockId,body.dayHigh, 'buy');
              }
          }
          
        }
        }
    })

}

router.post('/addPortfolio', function (req, res) {

  Portfolio.find({stockId:req.body.id}).lean().exec(function(err,result){
    if(err) {
      res.status(500).json({success:false, message:'Error during query execution'});
      return;
    }
    if(result.length==0){
      var portfolio = new Portfolio({
        stockId: req.body.id,
        userId: req.body.userId,
        baseValue: req.body.presentValue,
        buyValue: req.body.buyValue,
        stopLoss: req.body.stopLoss,
        targetValue: req.body.targetValue,
        quantity: req.body.quantity,
        status:req.body.status
      })
      portfolio.save(function (err, result) {
        if (err) {
          res.status(500).write({ message: err.message });
        } else {
          // res.json(result);
          console.log('Device registered in db:');
          console.log(result);
          res.json({success:true,message:'Succeeded...'})
        }
    
      });
    }
    else {
      res.json({success:false,message:'already exists stockId'})

    }
  })

})
  
router.get('/getPortfolio/:userId',function(req,res){
  if(stockInfo.length==0){
    Portfolio.find({userId:req.params.userId}).lean().exec(function(err,result){
      if(err)
      {
        console.log(err);
        return;
      }else {
        for(var i=0; i<result.length; i++){
          if(result[i].presentValue==undefined || result[i].presentValue==null)
          result[i].presentValue = result[i].baseValue;
        }
      }
      // console.log(result);
      res.status(200).json({success:true,data:result});
    })
  }else {
    var stocks =[];
    for(var i=0; i<stockInfo.length; i++){
      if(stockInfo[i].presentValue==undefined || stockInfo[i].presentValue==null)
      stockInfo[i].presentValue = stockInfo[i].baseValue;
      if(stockInfo[i].userId==req.params.userId)
        stocks.push(stockInfo[i]);
    }
    res.status(200).json({success:true,data:stocks});
  }
  
})


router.get('/checkId/:id', function (req, res) {
  var query = 'http://localhost:7000/stockapi/' + req.params.id
  // monitorLiveInfo();
  request(query, function (error, response, body) {
    if (response.statusCode == 400) {
      res.send(500).json({ success: false, message: 'Invalid Id' });
    } else
      if (!error && response.statusCode == 200) {
        
        if(JSON.parse(body)==null)
          res.json({success:false,message:'Invalid stockId'});
        else
          res.json({ success: true, data: body });
      }

  })
})

module.exports = router;
