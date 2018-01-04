var app = angular.module('santhiTrade', []);

app.controller('stockCtrl', function ($scope, $http) {

    $scope.portfolioList = [];
    $scope.portfolio = {};
    $scope.switch = 'portfolio';
    $scope.addNew = function(){
        console.log($scope.portfolio);
        $scope.portfolio.userId='srinivasaraju31@gmail.com';

        $http.post('/addPortfolio',$scope.portfolio).success(function(result){
            if(result.success)
                $scope.portfolio={};
            alert(result.message);
        })
    }
    $scope.switching = function(val){
        $scope.switch = val;
    }

    $scope.getPortfolio = function(){
        $http.get('/getPortfolio/srinivasaraju31@gmail.com').success(function(result){
            // console.log(result);
            if(result.success){
                $scope.portfolioList = result.data;
            }
        })
    }


    $scope.checkId= function(){
        $http.get('/checkId/'+$scope.portfolio.id).success(function(result){
            console.log(result);
            if(result.success){
                var data = JSON.parse(result.data);
                $scope.portfolio.presentValue = data.lastPrice;
            }else 
            alert(result.message);
            
            console.log(result.data[0].l);    
        }).error(function(result){
            console.log(result);
        })
    }
    $scope.getPortfolio();
});