var utilsModule = angular.module("UtilsModule",[]);
utilsModule.factory('utilsService',['$log', '$state', '$ionicLoading','$resource','ENV', function($log, $state, $ionicLoading,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"users/openid/:openid";
    var resource = $resource(url,{openid:"@openid"});
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
        getLocalInfo: function(){
            var localJson = window.sessionStorage.getItem("localInfo");
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
        saveOpenid: function(openid){
            window.sessionStorage.setItem("localInfo","");
            var now = new Date();
            var openidInfo = {
                "time":now.getTime(),
                "openid":openid
            };
            window.sessionStorage.setItem("openidInfo",angular.toJson(openidInfo));
            resource.get({openid:openid},function(resp){
                if(resp && resp.id>1){
                    var now = new Date();
                    var localInfo = {
                        "time":now.getTime(),
                        "user":resp
                    };
                    window.sessionStorage.setItem("localInfo",angular.toJson(localInfo));
                }
            });
        },
        getOpenid: function(){
            var openidJson = window.sessionStorage.getItem("openidInfo");
            var result = {
                "flag":"noopenid",
                "openid":""
            };
            if(openidJson){
                var now = new Date();
                var opeidInfo = angular.fromJson(openidJson);
                if(opeidInfo.time>(now.getTime()-60*60*1000)){
                    result.flag = "pass";
                    result.openid = opeidInfo.openid;
                }else{
                    result.result = "timeout";
                }
            }
            return result;
        },
        subscribed: function(){
            var localJson = window.sessionStorage.getItem("localInfo");
            if(localJson){
                var localInfo = angular.fromJson(localJson);
                if(localInfo.user&&localInfo.user.openid&&localInfo.user.subscribe=='1'){
                    return true;
                }
            }
            return false;
        },
        registered: function(){
            var localJson = window.sessionStorage.getItem("localInfo");
            if(localJson){
                var localInfo = angular.fromJson(localJson);
                if(localInfo.user&&localInfo.user.openid&&localInfo.user.subscribe=='1'&&localInfo.user.phone){
                    return true;
                }
            }
            return false;
        },
        canDeploy: function(){
            var localJson = window.sessionStorage.getItem("localInfo");
            if(localJson){
                var localInfo = angular.fromJson(localJson);
                if(localInfo.user&&(localInfo.user.sellerLevel.id==8||localInfo.user.canDeployNumber>0)){
                    return true;
                }
            }
            return false;
        },
        reduceDeployNum: function(){
            var localJson = window.sessionStorage.getItem("localInfo");
            if(localJson){
                var localInfo = angular.fromJson(localJson);
                if(localInfo.result=='pass'&&localInfo.user.canDeployNumber>0){
                    localInfo.user.canDeployNumber -= 1;
                    window.sessionStorage.setItem("localInfo",angular.toJson(localInfo));
                }
            }
        }
    };
}]);