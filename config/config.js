// config/database.js
module.exports = {
    'secret': 'tangenttechnolabs123',
    // 'dbUri' : 'mongodb://localhost:27017/tangent', 
    'ipAddress': '0.0.0.0',
     'TCP_PORT':8080,
    'HTTP_PORT':8000,
    'homeAddr':'http://192.168.1.102:8000/',
    
    'email':{
        'host':'mail.tangenttechnolabs.com',
        'port':465,
        'userId':'info@tangenttechnolabs.com',
        'pwd':'tangent123',
        'regSub':'User Id Registration mail from Tangent',
        'forgotPassSub':'Reset Password Request'
    },
    'timeout':900000,   //15 mins 1000*60*15
    'pkt_time_interval':3000,
    'PKT_END_MSG':'###',
    'PKT_LENGTH':1000

};