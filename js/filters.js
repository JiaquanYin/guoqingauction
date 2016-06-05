/**
 * Created by jiaquan on 15/12/20.
 */
var filterModule = angular.module('filterModule', []);
filterModule.filter('countdownTimer', function(){
    //输入参数为剩余时间的毫秒数
    return function(input){
        var out = '';
        var hour = 0;
        var minute = 0;
        var second = 0;
        hour = Math.floor(input/(3600*1000));
        var leaveMinute = input - hour*3600*1000;
        minute = Math.floor(leaveMinute/(60*1000));
        var leaveSecond = leaveMinute - minute*60*1000;
        second = Math.floor(leaveSecond/1000);
        if(hour<0||minute<0||second<0){
            out = "拍卖已经结束了...";
        }else{
            out = '距离结束:'+hour+'时'+minute+'分'+second+'秒';
        }
        return out;
    }
});
