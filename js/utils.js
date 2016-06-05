var utilsModule = angular.module("UtilsModule",[]);
utilsModule.factory('utilsService',['$log', '$state', '$ionicLoading', function($log, $state, $ionicLoading){
    return {
        showLoading: function (content) {
            $ionicLoading.show({
                template: content
            });
        },
        hideLoading: function () {
            $ionicLoading.hide();
        },
        isEmpty: function (obj) {
            for (var name in obj) {
                return false;
            }
            return true;
        },
        now: function(){
            var now = new Date();
            return now.getTime();
        },
        saveLocalInfo: function(user){
            var now = new Date();
            var localInfo = {
                "time":now.getTime(),
                "user":user
            };
            window.localStorage.setItem("localInfo",angular.toJson(localInfo));
        },
        getLocalInfo: function(){
            var localJson = window.localStorage.getItem("localInfo");
            var result = {
                "result": "nouser",
                "user":null
            };
            if(localJson){
                var now = new Date();
                var localInfo = angular.fromJson(localJson);
                if(localInfo.time>(now.getTime()-60*60*1000)){
                    result.result = "pass";
                    result.user = localInfo.user;
                    return result;
                }else{
                    result.result = "timeout";
                    return result;
                }
            }else{
                return result;
            }
        },
        subscribe: function(){
            var localJson = window.localStorage.getItem("localInfo");
            if(localJson){
                return true;
            }else{
                return false;
            }
        },
        registered: function(){
            var localJson = window.localStorage.getItem("localInfo");
            if(localJson){
                var localInfo = angular.fromJson(localJson);
                if(localInfo.user&&localInfo.user.phone){
                    return true;
                }else{
                    return false;
                }
            }else{
                return false;
            }
        }
    };
}]);