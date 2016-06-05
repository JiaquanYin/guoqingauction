/**
 * Created by jiaquan on 15/12/14.
 */
var num = 1;
var appControllers = angular.module("myControllers",[]);
appControllers
    .controller('homeController',['$scope','$rootScope','$stateParams','weixinFactory','userFactory','$state','wxconfigerFactory','ENV','messageCountFactory','utilsService', function($scope,$rootScope,$stateParams,weixinFactory,userFactory,$state,wxconfigerFactory,ENV,messageCountFactory,utilsService){
        $scope.messageCount = 0;
        $scope.hideMessage = true;
        $rootScope.registered = true;
        //var code = $stateParams.code;
        var code = "o7aBGs2evt8W644-18cO1fcrQImI";
        if(undefined!=code&&(typeof $rootScope.user == 'undefined')){
            weixinFactory.getUserByCode(code);
        }
        $scope.$on('userUpdatedByCode',function(){
            $rootScope.user = weixinFactory.getUser();
            utilsService.saveLocalInfo($rootScope.user);
            if(typeof $rootScope.user == 'undefined'){
                $state.go("guoqingauction");
            }else{
                wxconfigerFactory.get({url:ENV.webapi},function(resp){
                    var wxConfiger=resp;
                    wx.config({
                        debug: false,
                        appId: wxConfiger.appId,
                        timestamp: wxConfiger.timestamp+'',
                        nonceStr: wxConfiger.nonceStr,
                        signature: wxConfiger.signature,
                        jsApiList: ['chooseWXPay','hideOptionMenu','showOptionMenu','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','onMenuShareTimeline','chooseImage','previewImage','uploadImage']
                    },function(err){
                        alert(err);
                    });
                });
                if(null==$rootScope.user.nickname||null==$rootScope.user.phone||1>$rootScope.user.phone.length){
                    $rootScope.registered = false;
                }
                messageCountFactory.get({userId:$rootScope.user.id,status:"wd"},function(resp){
                    $scope.messageCount = resp.count;
                    if($scope.messageCount>0){
                        $scope.hideMessage = false;
                    }
                });
            }
        });
        wx.ready(function(){
            wx.hideOptionMenu();
        });
        if($rootScope.user){
            if(null==$rootScope.user.nickname||null==$rootScope.user.phone||1>$rootScope.user.phone.length){
                $rootScope.registered = false;
            }
            messageCountFactory.get({userId:$rootScope.user.id,status:"wd"},function(resp){
                $scope.messageCount = resp.count;
                if($scope.messageCount>0){
                    $scope.hideMessage = false;
                }
            });
        }
    }])
    .controller('registerController',['$rootScope','$scope','$state','userFactory','$timeout',function($rootScope,$scope,$state,userFactory,$timeout){
        wx.hideOptionMenu();
        $scope.registerTip = false;
        $scope.user=$rootScope.user;
        $scope.submiting = false;
        $scope.tipInfo = "";
        $scope.register = function(){
            $scope.submiting = true;
            $scope.tipInfo = "正在提交信息...";
            userFactory.update({openid:$scope.user.openid},$scope.user,function(resp){
                $rootScope.registered = true;
                $rootScope.user = resp;
                $scope.registerTip = true;
                //$scope.tipInfo = "恭喜,注册成功,请返回首页查看\"关于艺拍堂\"";
                //$state.go("introduction");
            },function(err){
                $scope.tipInfo = "注册失败,请稍后重试";
                $rootScope.registered = false;
            });
        }
    }])
    .controller('artifactsController',['$rootScope','$scope','artifactFactory','$ionicScrollDelegate','utilsService',function($rootScope,$scope,artifactFactory,$ionicScrollDelegate,utilsService){
        wx.hideOptionMenu();
        var localUser = utilsService.getLocalInfo();
        //alert(angular.toJson(localUser));
        $scope.loadingMore = false;
        $rootScope.tabs = [true,false,false,false,false,false];
        $scope.isLoading = true;
        /*二级tab页切换*/
        $scope.changeNav=function(current){
            angular.forEach($scope.tabs,function(value,index){
                if(index==current){
                    $rootScope.tabs[index] = true;
                    console.log("set tab");
                    artifactFactory.setArtifactType(index);
                }else{
                    $rootScope.tabs[index] = false;
                }
            });
        };

        //获取服务器数据
        artifactFactory.getTopArtifacts();
        //接收第一次加载数据的通知
        $scope.$on('topArtifactsUpdated', function() {
            $scope.isLoading = false;
            $scope.artifacts=artifactFactory.getArtifacts();
            $scope.$broadcast('scroll.refreshComplete');
        });
        $scope.$on('moreArtifactsUpdated', function() {
            $scope.artifacts=artifactFactory.getArtifacts();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;
        });
        //下拉更新
        $scope.doRefresh=function(){
            artifactFactory.getTopArtifacts();
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            artifactFactory.getMoreArtifacts();
        };


        $scope.hasNextPage = function() {
            return artifactFactory.hasNextPage();
        };
    }])
    .controller('artifactDetailController',['$rootScope','$scope','$stateParams','artDetailFactory','$filter','biddingFactory','randomFactory','ENV','wxconfigerFactory','attentionFactory','storeFactory','$interval','commonFactory',function($rootScope,$scope,$stateParams,artDetailFactory,$filter,biddingFactory,randomFactory,ENV,wxconfigerFactory,attentionFactory,storeFactory,$interval,commonFactory){
        wx.hideOptionMenu();
        wx.showMenuItems({
            menuList: ['menuItem:share:timeline']
        });
        $scope.registered = $rootScope.registered;
        var user = $rootScope.user;
        var artId = $stateParams.id;
        var userId = user.id;
        $scope.rest=0;
        $scope.showAttentions = [];
        $scope.showloading=true;
        $scope.oldPrice = 0;
        $scope.currentPrice = 0;
        $scope.showComment = false;
        $scope.vComment="";
        $scope.randoms = [];
        artDetailFactory.get(artId);
        $scope.showPriceError = false;
        var date = new Date();
        $scope.usrls = [];
        $scope.groupImages = [];
        $scope.getMaxBidding = function(biddings){
            var biddings = $filter('orderBy')($scope.artifact.biddings, '-price', false);
            if(biddings!=undefined && biddings.length>0){
                $scope.currentPrice = biddings[0].price;
                $scope.oldPrice = $scope.currentPrice;
            }else{
                $scope.currentPrice = 0;
            }
        };
        $scope.getMaxPrice = function(biddings){
            var biddings = $filter('orderBy')(biddings, '-price', false);
            if(biddings!=undefined && biddings.length>0){
                return biddings[0].price;
            }else{
                return 0;
            }
        };
        $scope.setShared = function(){
            $scope.artifact.shared=1;
        };
        $scope.$on('artDetailUpdated', function() {
            $scope.artifact=artDetailFactory.getArtifact();
            var now = new Date();
            $scope.rest=$scope.artifact.deadline-now.getTime();
            $scope.showAttentions = $scope.artifact.attentions;
            $scope.getMaxBidding($scope.artifact.biddings);
            $scope.showloading=false;
            $scope.groupImages = commonFactory.groupingImages($scope.artifact.images,3);
            angular.forEach($scope.artifact.images,function(value,index){
                $scope.usrls.push(value.src);
            });
            //分享功能
            wx.onMenuShareTimeline({
                title: '国青艺拍堂宝贝--'+$scope.artifact.name,
                link: ENV.webapi+"#/share/"+$scope.artifact.id,
                imgUrl: $scope.artifact.images[0].src, // 分享图标
                success: function () {
                    if(1>$scope.artifact.shared){
                        attention = {
                            "id": null,
                            "support": "0",
                            "comment": null,
                            "share": "1",
                            "user": null
                        };
                        attentionFactory.saveAttention({artifactId:artId,userId:userId},attention,function(resp){
                            $scope.setShared();
                        });
                    }
                },
                cancel: function () {
                    // 用户取消分享后执行的回调函数
                }
            });
        });
        randomFactory.query({pointed:"0"},function(resp){
            var randomArt = [];
            angular.forEach(resp,function(value,index){
                var currentArt = {};
                currentArt = value;
                currentArt.maxPrice = $scope.getMaxPrice(value.biddings);
                randomArt.push(currentArt);
            });
            $scope.randoms = randomArt;
        });
        /*出价*/
        $scope.submitBiddingPrice = function(){
            $scope.priceError="";
            if($scope.closed){
                return;
            }
            if($scope.currentPrice<=0){
                $scope.priceError= "请输入你正确的竞拍价";
                $scope.showPriceError = true;
                return;
            }
            if($scope.currentPrice<$scope.artifact.startPrice){
                $scope.priceError = '竞拍价要不小于起拍价('+$scope.artifact.startPrice+')';
                $scope.showPriceError = true;
            }else if($scope.currentPrice==$scope.artifact.startPrice){
                $scope.showPriceError = false;
                var bidding = {
                    "id": null,
                    "price": $scope.currentPrice,
                    "artifact": null,
                    "user": user,
                    "submitTime": date.getTime()
                };
                biddingFactory.save({artId:artId},bidding,function(rep){
                    $scope.artifact.biddings = rep.biddings;
                    $scope.artifact.status = rep.status;
                    $scope.getMaxBidding(rep.biddings);
                },function(err){
                    $scope.showPriceError = true;
                    $scope.priceError= "竞拍失败,请稍后重试";
                });
            }else if($scope.currentPrice>$scope.artifact.startPrice){
                if($scope.artifact.increase>0){
                    if($scope.currentPrice>=($scope.oldPrice+$scope.artifact.increase)){
                        $scope.showPriceError = false;
                        var bidding = {
                            "id": null,
                            "price": $scope.currentPrice,
                            "artifact": null,
                            "user": user,
                            "submitTime": date.getTime()
                        };
                        biddingFactory.save({artId:artId},bidding,function(rep){
                            $scope.artifact.biddings = rep.biddings;
                            $scope.artifact.status = rep.status;
                            $scope.getMaxBidding(rep.biddings);
                        },function(err){
                            $scope.showPriceError = true;
                            $scope.priceError= "竞拍失败,请稍后重试";
                        });
                    }else{
                        $scope.showPriceError = true;
                        $scope.priceError= "竞拍价要不小于现价加增幅";
                    }
                }else{
                    if($scope.currentPrice>$scope.oldPrice){
                        $scope.showPriceError = false;
                        var bidding = {
                            "id": null,
                            "price": $scope.currentPrice,
                            "artifact": null,
                            "user": user,
                            "submitTime": date.getTime()
                        };
                        biddingFactory.save({artId:artId},bidding,function(rep){
                            $scope.artifact.biddings = rep.biddings;
                            $scope.artifact.status = rep.status;
                            $scope.getMaxBidding(rep.biddings);
                        },function(err){
                            $scope.showPriceError = true;
                            $scope.priceError= "竞拍失败,请稍后重试";
                        });
                    }else{
                        $scope.showPriceError = true;
                        $scope.priceError= "竞拍价要大于现价";
                    }
                }

            }
        };
        $scope.showCommentArea = function(){
            $scope.showComment = true;
        };
        $scope.commenting = false;
        $scope.submitComment = function(){
            if(1>$scope.vComment.length){
                return;
            }
            $scope.commenting = true;
            attention = {
                "id": null,
                "support": "0",
                "comment": $scope.vComment,
                "share": "0",
                "user": null
            };
            attentionFactory.saveAttention({artifactId:artId,userId:userId},attention,function(resp){
                $scope.artifact.attentions = resp;
                $scope.showAttentions = resp;
                $scope.commenting = false;
                $scope.showComment = false;
            },function(error){
                $scope.commenting = false;
                $scope.showComment = false;
            });
        };
        $scope.supporting = false;
        $scope.support = function(){
            $scope.supporting = true;
            if($scope.artifact.supported<1){
                attention = {
                    "id": null,
                    "support": "1",
                    "comment": null,
                    "share": "0",
                    "user": null
                };
                attentionFactory.saveAttention({artifactId:artId,userId:userId},attention,function(resp){
                    $scope.artifact.supported += 1;
                    $scope.supporting = false;
                },function(error){
                    $scope.supporting = false;
                });
            }else{
                $scope.supporting = false;
            }
        };
        $scope.storing = false;
        $scope.storeTip = "收藏";
        $scope.store = function(){
            $scope.storing = true;
            var storeNow = new Date();
            var store = {
                id:null,
                artifactId:$scope.artifact.id,
                artifactName:$scope.artifact.name,
                storeTime:storeNow.getTime(),
                artifactImg:$scope.artifact.images[0].src,
                userId:userId
            };
            storeFactory.save({userId:userId},store,function(resp){
                $scope.storeTip = "已收藏";
                $scope.storing = false;
            });
        };
        /*竞拍倒计时*/
        //是否竞拍结束
        $scope.closed = false;
        $interval(function(){
            if($scope.rest>1000){
                $scope.rest = $scope.rest - 1000;
            }else{
                $scope.closed = true;
            }
        },1000);
        $scope.previewImage = function(current){
            wx.previewImage({
                current: current, // 当前显示图片的http链接
                urls: $scope.usrls // 需要预览的图片http链接列表
            });
        };
    }])
    .controller("deployController",['$rootScope','$scope','$filter','ENV','wxconfigerFactory','saveOrUpdateFactory','$state','$timeout','$ionicLoading',function($rootScope,$scope,$filter,ENV,wxconfigerFactory,saveOrUpdateFactory,$state,$timeout,$ionicLoading){
        wx.hideOptionMenu();
        $scope.canShowDeploy = false;
        $scope.tipInfo = "";
        $scope.images = {
            localIds:[],
            serverIds:[]
        };
        /*分类信息*/
        $scope.types = [
            {"typeKey":0,"typeValue":"文房四宝"},
            {"typeKey":1,"typeValue":"玉粹珠宝"},
            {"typeKey":2,"typeValue":"茶酒滋补"},
            {"typeKey":3,"typeValue":"紫砂陶器"},
            {"typeKey":4,"typeValue":"精雕细琢"},
            {"typeKey":5,"typeValue":"文玩杂项"}
        ];
        $scope.pointed = false;
        $scope.uploaded = "未上传";
        $scope.submiting = false;
        $scope.user = $rootScope.user;
        var now = new Date();
        var at = new Date(now.getFullYear(),now.getMonth(),now.getDate()+2);
        $scope.artifact = {
            "id": null,
            "openId": $scope.user.openid,
            "name": null,
            "introduction": null,
            "deadline": at.getTime(),
            "type": 0,
            "startPrice": 0,
            "increase": 0,
            "heartPrice": 0,
            "baotui": "1",
            "baoyou": "1",
            "images": [],
            "submitTime": now.getTime(),
            "user": $scope.user,
            "biddings": [],
            "successPrice": 0,
            "pointed": "0",
            "status": "0",
            "evaluation": null,
            "attentions": [],
            "shareNum": 0
        };
        if($scope.user.sellerLevel.id==8||($scope.user.canDeployNumber>0&&$scope.user.sellerLevel.id>3&&$scope.user.sellerLevel.id<8)){
            $scope.canShowDeploy = true;
        }
        $scope.showLoading = function() {
            $ionicLoading.show({
                template: '正在发布宝贝,请稍后...'
            });
        };
        $scope.hideLoading = function(){
            $ionicLoading.hide();
        };
        $scope.deleteImg = function(localId){
            angular.forEach($scope.images.localIds,function(value,index){
                if(value == localId){
                    $scope.images.localIds.splice(index,1);
                }
            });
        };
        $scope.chooseImage = function(){
            wx.chooseImage({
                count: 9, // 默认9
                sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
                success: function (res) {
                    $scope.$apply(function(){
                        angular.forEach(res.localIds, function(value,index){
                            $scope.images.localIds.push(value);
                        });
                    });
                }
            });
        };
        $scope.uploadImage = function(){
            if ($scope.images.localIds.length == 0) {
                return;
            }
            $scope.images.serverIds=[];
            var syncUpload = function(localIds){
                var localId = localIds.pop();
                wx.uploadImage({
                    localId: localId,
                    isShowProgressTips: 1,
                    success: function (res) {
                        var serverId = res.serverId; // 返回图片的服务器端ID
                        $scope.images.serverIds.push(serverId);
                        if(localIds.length > 0){
                            syncUpload(localIds);
                        }else{
                            $scope.$apply(function(){
                                $scope.uploaded = "已上传"+$scope.images.serverIds.length+'张';
                            });
                        }
                    }
                });
            };
            syncUpload($scope.images.localIds);
        };

        $scope.previewImage = function(){
            if ($scope.images.localIds.length == 0) {
                return;
            }
            wx.previewImage({
                current: $scope.images.serverIds[0],
                urls: $scope.images.serverIds
            });
        };
        $scope.checkData = function(){
            if($scope.images.serverIds.length<1){
                $scope.tipInfo = "请上传图片";
                return false;
            }
            if($scope.artifact.name.length<1){
                $scope.tipInfo = "请输入宝贝名称";
                return false;
            }
            if($scope.artifact.introduction.length<1){
                $scope.tipInfo = "请输入宝贝介绍";
                return false;
            }
            if($scope.artifact.type<0||$scope.artifact.type>5){
                $scope.tipInfo = "请检查宝贝的类别";
                return false;
            }
            if($scope.user.point<($scope.artifact.shareNum*10)){
                $scope.tipInfo = "你的积分不足,请修改分享次数";
                return false;
            }
            return true;
        };
        $scope.deploy = function(){
            if(!$scope.checkData()){
                return;
            }
            $scope.submiting = true;
            $scope.showLoading();
            if($scope.pointed==true){
                $scope.artifact.pointed="1";
            }else{
                $scope.artifact.pointed="0";
            }
            if($scope.images.serverIds.length > 0) {
                angular.forEach($scope.images.serverIds,function(serverId,index){
                    var image = {id:null, serverId:serverId,openid:$scope.user.openid, mediaId:serverId, src:null,createTime:now.getTime()};
                    $scope.artifact.images.push(image);
                });
            }
            $scope.tipInfo = "正在发布宝贝,请稍后...";
            saveOrUpdateFactory.save($scope.artifact,function(resp){
                if(null!=resp && undefined!=resp){
                    $rootScope.user.canDeployNumber -=1;
                    $scope.hideLoading();
                    if(resp.pointed=='1'){
                        $state.go("tabs.points");
                    }else{
                        $state.go("tabs.artifacts");
                    }
                    //$scope.tipInfo = "恭喜,宝贝发布成功,请返回首页";
                }else{
                    $scope.tipInfo = "抱歉,宝贝发布异常,请稍后再试";
                    $scope.hideLoading();
                }
            },function(err){
                $scope.tipInfo = "抱歉,宝贝发布失败,请稍后再试";
                $scope.hideLoading();
            });
        };
    }])
    .controller('pointController',['$scope','$interval','pointFactory','$ionicScrollDelegate',function($scope,$interval,pointFactory,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.isLoading = true;
        $scope.loadingMore = false;

        //获取服务器数据
        pointFactory.getTopArtifacts();
        //接收第一次加载数据的通知
        $scope.$on('topPointsUpdated', function() {
            $scope.isLoading = false;
            $scope.artifacts=pointFactory.getArtifacts();
            console.log($scope.artifacts);
            $scope.$broadcast('scroll.refreshComplete');
        });
        //接收加载更多数据的通知
        $scope.$on('morePointsUpdated', function() {
            $scope.artifacts=pointFactory.getArtifacts();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;
        });
        //下拉更新
        $scope.doRefresh=function(){
            pointFactory.getTopArtifacts();
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            pointFactory.getMoreArtifacts();
        };
        $scope.hasNextPage = function() {
            return pointFactory.hasNextPage();
        };
    }])
    /*随机产生artifact
     .controller('pointController',['$scope','$interval','pointFactory',function($scope,$interval,pointFactory){
     $scope.assertive = false;
     $scope.dark = true;
     pointFactory.getTopArtifacts();
     $scope.$on('pointUpdated', function() {
     $scope.artifact=pointFactory.getRandomArtifact();
     $scope.assertive = false;
     $scope.dark = true;
     });
     //手机摇一摇
     var SHAKE_THRESHOLD = 3000;
     var last_update = 0;
     var x = y = z = last_x = last_y = last_z = 0;
     //摇一摇开关，1表示开，0表示关
     var canShake = 1;
     if (window.DeviceMotionEvent) {
     window.addEventListener('devicemotion', deviceMotionHandler, false);
     } else {
     alert('你的设备不支持DeviceMotion事件');
     }
     function deviceMotionHandler(eventData) {
     var acceleration = eventData.accelerationIncludingGravity;
     var curTime = new Date().getTime();

     //100ms监听一次，拒绝重复监听
     if ((curTime - last_update) > 100 && canShake==1) {
     var diffTime = curTime - last_update;
     last_update = curTime;
     x = acceleration.x;
     y = acceleration.y;
     z = acceleration.z;
     var speed = Math.abs(x + y + z - last_x - last_y - last_z) / diffTime * 10000;
     if (speed > SHAKE_THRESHOLD) {
     $scope.assertive = true;
     $scope.dark = false;
     pointFactory.getNextArtifacts();
     }
     last_x = x;
     last_y = y;
     last_z = z;
     }
     }
     $scope.changeArtifact = function(){
     $scope.assertive = true;
     $scope.dark = false;
     pointFactory.getNextArtifacts();
     }
     }])
     */
    .controller('pointDetailController',['$rootScope','$scope','$stateParams','artDetailFactory','$filter','biddingFactory','randomFactory','ENV','wxconfigerFactory','attentionFactory','storeFactory','$interval','commonFactory',function($rootScope,$scope,$stateParams,artDetailFactory,$filter,biddingFactory,randomFactory,ENV,wxconfigerFactory,attentionFactory,storeFactory,$interval,commonFactory){
        wx.hideOptionMenu();
        wx.showMenuItems({
            menuList: ['menuItem:share:timeline']
        });
        $scope.registered = $rootScope.registered;
        var user = $rootScope.user;
        var artId = $stateParams.id;
        var userId = user.id;
        $scope.rest=0;
        $scope.showAttentions = [];
        $scope.showloading=true;
        $scope.oldPrice = 0;
        $scope.currentPrice = 0;
        $scope.showComment = false;
        $scope.vComment="";
        $scope.randoms = [];
        artDetailFactory.get(artId);
        $scope.showPriceError = false;
        $scope.usrls = [];
        $scope.groupImages = [];
        var date = new Date();
        $scope.getMaxBidding = function(biddings){
            var biddings = $filter('orderBy')($scope.artifact.biddings, '-price', false);
            if(biddings!=undefined && biddings.length>0){
                $scope.currentPrice = biddings[0].price;
                $scope.oldPrice = $scope.currentPrice;
            }else{
                $scope.currentPrice = 0;
            }
        };
        $scope.getMaxPrice = function(biddings){
            var biddings = $filter('orderBy')(biddings, '-price', false);
            if(biddings!=undefined && biddings.length>0){
                return biddings[0].price;
            }else{
                return 0;
            }
        };
        $scope.setShared = function(){
            $scope.artifact.shared=1;
        };
        $scope.$on('artDetailUpdated', function() {
            $scope.artifact=artDetailFactory.getArtifact();
            var now = new Date();
            $scope.rest=$scope.artifact.deadline-now.getTime();
            $scope.showAttentions = $scope.artifact.attentions;
            $scope.getMaxBidding($scope.artifact.biddings);
            $scope.showloading=false;
            $scope.groupImages = commonFactory.groupingImages($scope.artifact.images,3);
            angular.forEach($scope.artifact.images,function(value,index){
                $scope.usrls.push(value.src);
            });
            //分享功能
            wx.onMenuShareTimeline({
                title: '国青艺拍堂宝贝--'+$scope.artifact.name,
                link: ENV.webapi+"#/share/"+$scope.artifact.id,
                imgUrl: $scope.artifact.images[0].src, // 分享图标
                success: function () {
                    if(1>$scope.artifact.shared){
                        attention = {
                            "id": null,
                            "support": "0",
                            "comment": null,
                            "share": "1",
                            "user": null
                        };
                        attentionFactory.saveAttention({artifactId:artId,userId:userId},attention,function(resp){
                            $scope.setShared();
                        });
                    }
                },
                cancel: function () {
                    // 用户取消分享后执行的回调函数
                }
            });
        });
        randomFactory.query({pointed:"0"},function(resp){
            var randomArt = [];
            angular.forEach(resp,function(value,index){
                var currentArt = {};
                currentArt = value;
                currentArt.maxPrice = $scope.getMaxPrice(value.biddings);
                randomArt.push(currentArt);
            });
            $scope.randoms = randomArt;
        });
        /*出价*/
        $scope.submitBiddingPrice = function(){
            $scope.priceError="";
            if($scope.closed){
                return;
            }
            if($scope.currentPrice<=0){
                $scope.priceError= "请输入你正确的竞拍价";
                $scope.showPriceError = true;
                return;
            }
            if($scope.currentPrice<$scope.artifact.startPrice){
                $scope.priceError = '竞拍价要不小于起拍价('+$scope.artifact.startPrice+')';
                $scope.showPriceError = true;
            }else if($scope.currentPrice==$scope.artifact.startPrice){
                $scope.showPriceError = false;
                var bidding = {
                    "id": null,
                    "price": $scope.currentPrice,
                    "artifact": null,
                    "user": user,
                    "submitTime": date.getTime()
                };
                biddingFactory.save({artId:artId},bidding,function(rep){
                    $scope.artifact.biddings = rep.biddings;
                    $scope.artifact.status = rep.status;
                    $scope.getMaxBidding(rep.biddings);
                },function(err){
                    $scope.showPriceError = true;
                    $scope.priceError= "竞拍失败,请稍后重试";
                });
            }else if($scope.currentPrice>$scope.artifact.startPrice){
                if($scope.artifact.increase>0){
                    if($scope.currentPrice>=($scope.oldPrice+$scope.artifact.increase)){
                        $scope.showPriceError = false;
                        var bidding = {
                            "id": null,
                            "price": $scope.currentPrice,
                            "artifact": null,
                            "user": user,
                            "submitTime": date.getTime()
                        };
                        biddingFactory.save({artId:artId},bidding,function(rep){
                            $scope.artifact.biddings = rep.biddings;
                            $scope.artifact.status = rep.status;
                            $scope.getMaxBidding(rep.biddings);
                        },function(err){
                            $scope.showPriceError = true;
                            $scope.priceError= "竞拍失败,请稍后重试";
                        });
                    }else{
                        $scope.showPriceError = true;
                        $scope.priceError= "竞拍价要不小于现价加增幅";
                    }
                }else{
                    if($scope.currentPrice>$scope.oldPrice){
                        $scope.showPriceError = false;
                        var bidding = {
                            "id": null,
                            "price": $scope.currentPrice,
                            "artifact": null,
                            "user": user,
                            "submitTime": date.getTime()
                        };
                        biddingFactory.save({artId:artId},bidding,function(rep){
                            $scope.artifact.biddings = rep.biddings;
                            $scope.artifact.status = rep.status;
                            $scope.getMaxBidding(rep.biddings);
                        },function(err){
                            $scope.showPriceError = true;
                            $scope.priceError= "竞拍失败,请稍后重试";
                        });
                    }else{
                        $scope.showPriceError = true;
                        $scope.priceError= "竞拍价要大于现价";
                    }
                }

            }
        };
        $scope.showCommentArea = function(){
            $scope.showComment = true;
        };
        $scope.commenting = false;
        $scope.submitComment = function(){
            if(1>$scope.vComment.length){
                return;
            }
            $scope.commenting = true;
            attention = {
                "id": null,
                "support": "0",
                "comment": $scope.vComment,
                "share": "0",
                "user": null
            };
            attentionFactory.saveAttention({artifactId:artId,userId:userId},attention,function(resp){
                $scope.artifact.attentions = resp;
                $scope.showAttentions = resp;
                $scope.commenting = false;
                $scope.showComment = false;
            },function(error){
                $scope.commenting = false;
                $scope.showComment = false;
            });
        };
        $scope.supporting = false;
        $scope.support = function(){
            $scope.supporting = true;
            if($scope.artifact.supported<1){
                attention = {
                    "id": null,
                    "support": "1",
                    "comment": null,
                    "share": "0",
                    "user": null
                };
                attentionFactory.saveAttention({artifactId:artId,userId:userId},attention,function(resp){
                    $scope.artifact.supported += 1;
                    $scope.supporting = false;
                },function(error){
                    $scope.supporting = false;
                });
            }else{
                $scope.supporting = false;
            }
        };
        $scope.storing = false;
        $scope.storeTip = "收藏";
        $scope.store = function(){
            $scope.storing = true;
            var storeNow = new Date();
            var store = {
                id:null,
                artifactId:$scope.artifact.id,
                artifactName:$scope.artifact.name,
                storeTime:storeNow.getTime(),
                artifactImg:$scope.artifact.images[0].src,
                userId:userId
            };
            storeFactory.save({userId:userId},store,function(resp){
                $scope.storeTip = "已收藏";
                $scope.storing = false;
            });
        };
        /*竞拍倒计时*/
        //是否竞拍结束
        $scope.closed = false;
        $interval(function(){
            if($scope.rest>1000){
                $scope.rest = $scope.rest - 1000;
            }else{
                $scope.closed = true;
            }
        },1000);
        $scope.previewImage = function(current){
            wx.previewImage({
                current: current, // 当前显示图片的http链接
                urls: $scope.usrls // 需要预览的图片http链接列表
            });
        };
    }])
    .controller('spokesmanController',['$rootScope','$scope', function($rootScope,$scope){
        wx.hideOptionMenu();
        if(typeof $rootScope.user != 'undefined'){
            $scope.qrcode = $rootScope.user.qrcode;
        }
    }])
    .controller('meController',['$rootScope','$scope', 'messageCountFactory', function($rootScope,$scope,messageCountFactory){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        messageCountFactory.get({userId:$scope.user.id,status:"wd"},function(resp){
            $scope.messageCount = resp.count;
        });
    }])
    .controller('myartifactController',['$rootScope','$scope','$interval','myartifactFactory','$ionicScrollDelegate',function($rootScope,$scope,$interval,myartifactFactory,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        $scope.loadingMore = false;
        //获取服务器数据
        console.log("开始获取服务器数据");
        myartifactFactory.getTopArtifacts($scope.user.id);
        console.log("接收到刚才传过来的通知");
        //接收到刚才传过来的通知
        $scope.$on('myartifactsUpdated', function() {
            $scope.isLoading = false;
            $scope.myartifacts=myartifactFactory.getArtifacts();
            $scope.$broadcast('scroll.refreshComplete');
        });

        $scope.$on('myMoreArtifactsUpdated', function() {
            $scope.myartifacts=myartifactFactory.getArtifacts();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;
        });


        //下拉更新
        $scope.doRefresh=function(){
            myartifactFactory.getTopArtifacts($scope.user.id);
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            myartifactFactory.getMoreArtifacts($scope.user.id);
        };


        $scope.hasNextPage = function() {
            return myartifactFactory.hasNextPage();
        };
    }])
    .controller('myartifactDetailController',['$rootScope','$scope','$stateParams','artDetailFactory','$state','myartifactFactory',function($rootScope,$scope,$stateParams,artDetailFactory,$state,myartifactFactory){
        wx.hideOptionMenu();
        var id = $stateParams.id;
        $scope.user = $rootScope.user;
        /*分类信息*/
        $scope.types = ["文房四宝","玉粹珠宝","茶酒滋补","紫砂陶器","精雕细琢","文玩杂项"];
        $scope.isLoading=true;
        artDetailFactory.get(id);
        $scope.$on('artDetailUpdated', function() {
            $scope.isLoading=false;
            $scope.artifact=artDetailFactory.getArtifact();
            $scope.type = $scope.types[$scope.artifact.type];
        });
        $scope.deleteing = false;
        $scope.deleteArt = function(){
            $scope.deleteing = true;
            artDetailFactory.deleteArtifact(id);
            $scope.$on('artDeletedUpdated', function() {
                $scope.deleteing=false;
                myartifactFactory.getTopArtifacts($scope.user.id);
                $state.go("myartifacts");
            });
        }
    }])
    .controller('payOrdersController',['$rootScope','$scope','$interval','orderFactory',function($rootScope,$scope,$interval,orderFactory){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        $scope.loadingMore = false;
        orderFactory.getTopOrders("1");
        //接收到刚才传过来的通知
        $scope.$on('ordersUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $scope.$broadcast('scroll.refreshComplete');
        });

        $scope.$on('ordersMoreUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $scope.loadingMore = false;
        });

        //下拉更新
        $scope.doRefresh=function(){
            orderFactory.getTopOrders("1");
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            orderFactory.getMoreOrders("1");
        };


        $scope.hasNextPage = function() {
            return orderFactory.hasNextPage();
        };
    }])
    .controller('payOrderDetailController',['$rootScope','$scope','$stateParams','$state','orderFactory','weixinpayFactory','wxconfigerFactory','ENV','addressFactory',function($rootScope,$scope,$stateParams,$state,orderFactory,weixinpayFactory,wxconfigerFactory,ENV,addressFactory){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        var id = $stateParams.id;
        /*分类信息*/
        $scope.types = ["文房四宝","玉粹珠宝","茶酒滋补","紫砂陶器","精雕细琢","文玩杂项"];
        $scope.isLoading=true;
        $scope.tipInfo = "";
        orderFactory.accessOrder(id);
        var resource = addressFactory.getResource();
        resource.query({userId:$scope.user.id,page:1},function(resp){
            $scope.addresses = resp;
        },function(){});
        $scope.$on('orderUpdated', function() {
            $scope.isLoading=false;
            $scope.order=orderFactory.getOrder();
            if($scope.order.artifact.pointed=='1'){
                $scope.tipInfo = "请使用积分购买该宝贝";
            }else{
                $scope.tipInfo = "请使用微信支付购买该宝贝";
            }
            $scope.type = $scope.types[$scope.order.artifact.type];
        });
        $scope.changeTipInfo = function(message,type){
            $scope.tipInfo = message;
            if('ok'!=type){
                $scope.paying = false;
            }
        };
        $scope.paying = false;
        $scope.payMoney = function(){
            if("1"!=$scope.order.artifact.status){
                $scope.tipInfo = "请返回刷新订单...";
                return;
            }
            if(!$scope.checkAddress()){
                return;
            }
            $scope.paying = true;
            weixinpayFactory.accessPaysign(id);
        };
        $scope.$on("paysignUpdated",function(){
            var paysign = weixinpayFactory.getPaysign();
            if(parseInt(paysign.agent)<5){
                alert("您的微信版本低于5.0无法使用微信支付");
                return;
            }
            wx.chooseWXPay({
                appId: paysign.appId,
                timestamp: paysign.timeStamp,
                nonceStr: paysign.nonceStr,
                package: paysign.package,
                signType: "MD5",
                paySign: paysign.paySign,
                success: function (res) {
                    if(res.errMsg == "chooseWXPay:ok" ) {
                        $scope.changeTipInfo("支付成功,请等待卖家发货...","ok");
                    }else{
                        $scope.changeTipInfo("支付失败,请稍后再试或者咨询客服","error");
                    }
                },
                cancel:function(res){
                    $scope.changeTipInfo("您已取消支付,请尽快支付竞拍的宝贝,谢谢合作...","cancel");
                }
            });
        });
        $scope.payPoint = function(){
            if("1"!=$scope.order.artifact.status){
                $scope.tipInfo = "请返回刷新订单...";
                return;
            }
            if(!$scope.checkAddress()){
                return;
            }
            $scope.paying = true;
            if(!$scope.checkPoint()){
                return;
            }
            var now = new Date();
            var pointPay = {
                "id": null,
                "time": now.getTime(),
                "price": -$scope.order.price,
                "status": "wcl"
            };
            $scope.order.orderPayings.push(pointPay);
            $scope.order.artifact.status="2";
            $scope.order.status="1";
            orderFactory.updateOrder($scope.order);
        };
        $scope.checkPoint = function(){
            if($scope.user.point<$scope.order.price){
                $scope.tipInfo="你的积分不足,不能支付";
                return false;
            }
            return true;
        };
        $scope.$on('updateOrderSuccess', function() {
            if($scope.order.type =="1"){
                $rootScope.user.point =$rootScope.user.point-$scope.order.price;
            }
            $scope.changeTipInfo("恭喜您,支付成功","ok");
        });
        $scope.$on('updateOrderFail', function() {
            $scope.tipInfo="支付失败,请稍后重试";
        });
        $scope.checkAddress = function(){
            if(!$scope.hasAddress){
                $scope.tipInfo="请选择送货地址或者前往我的地址添加...";
                return false;
            }
            return true;
        };
        $scope.hasAddress = false;
        $scope.submitAddress = function(addressId){
            var address = {id:addressId};
            $scope.order.address = address;
            orderFactory.updateAddress($scope.order);
        };
        $scope.$on('updateAddressSuccess', function() {
            $scope.hasAddress = true;
            $scope.tipInfo="设置地址成功";
        });
        $scope.$on('updateAddressFail', function() {
            $scope.hasAddress = false;
            $scope.tipInfo="设置地址失败";
        });
    }])
    .controller('fahuoOrdersController',['$rootScope','$scope','$interval','orderFactory','$ionicScrollDelegate',function($rootScope,$scope,$interval,orderFactory,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        $scope.loadingMore = false;
        //获取服务器数据
        orderFactory.getTopOrders("2");
        //接收到刚才传过来的通知
        $scope.$on('ordersUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $scope.$broadcast('scroll.refreshComplete');
        });

        $scope.$on('ordersMoreUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;
        });
        //下拉更新
        $scope.doRefresh=function(){
            orderFactory.getTopOrders("2");
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            orderFactory.getMoreOrders("2");
        };


        $scope.hasNextPage = function() {
            return orderFactory.hasNextPage();
        };
    }])
    .controller('fahuoOrderDetailController',['$rootScope','$scope','$stateParams','$state','orderFactory','commonFactory',function($rootScope,$scope,$stateParams,$state,orderFactory,commonFactory){
        wx.hideOptionMenu();
        $scope.fahuoing = false;
        $scope.fahuoStatus=true;
        $scope.tipInfo = "请仔细确认输入的快递单号,确认发货后不能修改";
        var id = $stateParams.id;
        /*分类信息*/
        $scope.types = ["文房四宝","玉粹珠宝","茶酒滋补","紫砂陶器","精雕细琢","文玩杂项"];
        $scope.isLoading=true;
        $scope.groupImages = [];
        orderFactory.accessOrder(id);
        $scope.$on('orderUpdated', function() {
            $scope.isLoading=false;
            $scope.order=orderFactory.getOrder();
            $scope.groupImages = commonFactory.groupingImages($scope.order.artifact.images,3);
            $scope.type = $scope.types[$scope.order.artifact.type];
            if($scope.order.expressNumber&&$scope.order.expressNumber.length>0){
                $scope.fahuoStatus=false;
            }
        });
        $scope.fahuo = function(){
            if("2"!=$scope.order.artifact.status){
                $scope.tipInfo = "请返回刷新订单...";
                return;
            }
            if($scope.order.expressNumber.length<1){
                $scope.tipInfo = "请填写物流地址,确保地址正确";
                return;
            }
            $scope.fahuoing = true;
            $scope.order.artifact.status = "3";
            orderFactory.updateOrder($scope.order);
        };
        $scope.$on('updateOrderSuccess', function() {
            $scope.fahuoStatus=false;
            //$state.go("fahuo_orders");
            $scope.tipInfo = "发货成功,请关注宝贝的物流情况,确保宝贝送达";
        });
        $scope.$on('updateOrderFail', function() {
            $scope.fahuoStatus=false;
            $scope.tipInfo = "发货失败,请稍后更新发货信息";
        });
    }])
    .controller('shouhuoOrdersController',['$rootScope','$scope','$interval','orderFactory','$ionicScrollDelegate',function($rootScope,$scope,$interval,orderFactory,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        $scope.loadingMore = false;
        orderFactory.getTopOrders("3");
        $scope.$on('ordersUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $scope.$broadcast('scroll.refreshComplete');
        });

        $scope.$on('ordersMoreUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;
        });

        //下拉更新
        $scope.doRefresh=function(){
            orderFactory.getTopOrders("3");
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            orderFactory.getMoreOrders("3");
        };


        $scope.hasNextPage = function() {
            return orderFactory.hasNextPage();
        };
    }])
    .controller('shouhuoOrderDetailController',['$rootScope','$scope','$stateParams','$state','orderFactory','$ionicPopup',function($rootScope,$scope,$stateParams,$state,orderFactory,$ionicPopup){
        wx.hideOptionMenu();
        $scope.disable = false;
        $scope.tipInfo = "请仔细检查宝贝,然后确认收货,如宝贝存在问题请申请退货";
        var id = $stateParams.id;
        /*分类信息*/
        $scope.types = ["文房四宝","玉粹珠宝","茶酒滋补","紫砂陶器","精雕细琢","文玩杂项"];
        $scope.isLoading=true;
        orderFactory.accessOrder(id);
        $scope.$on('orderUpdated', function() {
            $scope.isLoading=false;
            $scope.order=orderFactory.getOrder();
            $scope.type = $scope.types[$scope.order.artifact.type];
        });
        $scope.shouhuo = function() {
            if("3"!=$scope.order.artifact.status){
                $scope.tipInfo = "请返回刷新订单...";
                return;
            }
            var confirmPopup = $ionicPopup.confirm({
                title: '收货确认',
                template: '确认收货后,不能再申请退货',
                cancelText: '取消',
                cancelType: 'button-small button-default',
                okText: '确认收货',
                okType: 'button-small button-positive'
            });

            confirmPopup.then(function(res) {
                if(res) {
                    $scope.disable = true;
                    var resource = orderFactory.getResource();
                    $scope.order.artifact.status = "4";
                    resource.update({userId:$scope.user.id,id:id}, $scope.order, function(res){
                        $rootScope.user = res.user;
                        if('4'==res.artifact.status){
                            $scope.tipInfo = "感谢购买宝贝,请继续浏览其他宝贝";
                            //$state.go("shouhuo_orders");
                        }else{
                            $scope.tipInfo = "操作失败,请稍后再试";
                        }
                    });
                }
            });
        };
        $scope.tuihuo = function() {
            if("3"!=$scope.order.artifact.status){
                $scope.tipInfo = "请返回刷新订单...";
                return;
            }
            var promptPopup = $ionicPopup.prompt({
                title: '退货申请',
                maxLength: 20,
                inputPlaceholder:'退货理由,最多20个字',
                cancelText: '取消',
                cancelType: 'button-small button-default',
                okText: '提交申请',
                okType: 'button-small button-positive'
            });

            promptPopup.then(function(res) {
                if(undefined!=res) {
                    if(0<res.length){
                        $scope.disable = true;
                        var resource = orderFactory.getResource();
                        $scope.order.artifact.status = "6";
                        $scope.order.returnReason=res;
                        resource.update({userId:$scope.user.id,id:id}, $scope.order,
                            function(res){
                                if('6'==res.artifact.status){
                                    $scope.tipInfo = "我们会及时处理你的申请,并通知你结果";
                                }else{
                                    $scope.tipInfo = "操作失败,请稍后再试";
                                }
                            },
                            function(error){
                                $scope.tipInfo = "操作失败,请稍后再试";
                            }
                        );
                    }else{
                        $scope.tipInfo = "请填写退货理由";
                    }
                }
            });
        };

    }])
    .controller('evaluationController',['$rootScope','$scope','$interval','orderFactory','$ionicScrollDelegate',function($rootScope,$scope,$interval,orderFactory,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        $scope.loadingMore = false;
        orderFactory.getTopOrders("4");
        $scope.$on('ordersUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $scope.$broadcast('scroll.refreshComplete');
        });

        $scope.$on('ordersMoreUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;
        });

        //下拉更新
        $scope.doRefresh=function(){
            orderFactory.getTopOrders("4");
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            orderFactory.getMoreOrders("4");
        };


        $scope.hasNextPage = function() {
            return orderFactory.hasNextPage();
        };
    }])
    .controller('evaluationDetailController',['$rootScope','$scope','$stateParams','$state','orderFactory','$ionicPopup',function($rootScope,$scope,$stateParams,$state,orderFactory,$ionicPopup){
        wx.hideOptionMenu();
        $scope.disable = false;
        $scope.tipInfo = "请留下您宝贵的评价";
        var id = $stateParams.id;
        /*分类信息*/
        $scope.types = ["文房四宝","玉粹珠宝","茶酒滋补","紫砂陶器","精雕细琢","文玩杂项"];
        $scope.isLoading=true;
        orderFactory.accessOrder(id);
        $scope.$on('orderUpdated', function() {
            $scope.isLoading=false;
            $scope.order=orderFactory.getOrder();
            $scope.type = $scope.types[$scope.order.artifact.type];
        });
        $scope.evaluation = function(){
            if("4"!=$scope.order.artifact.status){
                $scope.tipInfo = "请返回刷新订单...";
                return;
            }
            if(null==$scope.order.artifact.evaluation||$scope.order.artifact.evaluation.length<1){
                $scope.tipInfo = "请补充你的评价";
                return;
            }
            $scope.disable = true;
            var resource = orderFactory.getResource();
            $scope.order.artifact.status = "5";
            resource.update({userId:$scope.user.id,id:id}, $scope.order,
                function(res){
                    if('5'==res.artifact.status){
                        $scope.tipInfo = "感谢您的评价,请继续关注其他宝贝";
                        //$state.go("evaluation_orders");
                    }else{
                        $scope.tipInfo = "操作失败,请稍后再试";
                    }
                },
                function(error){
                    $scope.tipInfo = "操作失败,请稍后再试";
                }
            );
        };

    }])
    .controller('addressController',['$rootScope','$scope','addressFactory','$state','$ionicScrollDelegate',function($rootScope,$scope,addressFactory,$state,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        addressFactory.getTopAddresses();
        $scope.$on('addressesUpdated', function() {
            $scope.isLoading = false;
            $scope.addresses=addressFactory.getAddresses();
            $scope.$broadcast('scroll.refreshComplete');
        });


        //下拉更新
        $scope.doRefresh=function(){
            addressFactory.getTopAddresses();
        };

        //上拉更新
        $scope.loadMore=function(){
            addressFactory.getNextAddresses();
            $scope.$broadcast('scroll.infiniteScrollComplete');
        };


        $scope.hasNextPage = function() {
            return addressFactory.hasNextPage();
        };
        $scope.deleteAddress = function(address){
            addressFactory.deleteAddress(address);
            $scope.$on('deleteAddressSuccess',function(){
                angular.forEach($scope.addresses,function(value,index){
                    if(address.id==value.id){
                        $scope.addresses.splice(index,1);
                    }
                });
            });
        };
        $scope.editAddress = function(address){
            $state.go('address-edit',{id:address.id});
        }
    }])
    .controller('addressLookController',['$rootScope','$scope','addressFactory','$stateParams',function($rootScope,$scope,addressFactory,$stateParams){
        wx.hideOptionMenu();
        var id = $stateParams.id;
        $scope.isLoading = true;
        addressFactory.accessAddress(id);
        $scope.$on('addressUpdated', function() {
            $scope.isLoading = false;
            $scope.address=addressFactory.getAddress();
        });
    }])
    .controller('addressNewController',['$rootScope','$scope','addressFactory','$state',function($rootScope,$scope,addressFactory,$state){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.submiting = false;
        $scope.address = {
            "username":null,
            "telNumber":null,
            "firstStage":null,
            "secondStage":null,
            "thirdStage":null,
            "detailInfo":null,
            "status":"used"
        };
        $scope.newAddress = function(){
            if(!$scope.checkAddress()){
                $scope.tipInfo = "请检查输入信息合法性";
                return;
            }
            $scope.submiting = true;
            var resource = addressFactory.getResource();
            resource.save({userId:$scope.user.id},$scope.address,function(res){
                if(0<res.id){
                    //$scope.tipInfo = "新增地址成功,请返回刷新地址";
                    $state.go("address");
                }else{
                    $scope.tipInfo = "新增地址失败,请稍后重试";
                }
            },function(err){
                $scope.tipInfo = "新增地址失败,请稍后重试";
            });
        };
        $scope.checkAddress = function(){
            if(1>$scope.address.username.length){
                return false;
            }
            if(1>$scope.address.telNumber.length){
                return false;
            }
            if(1>$scope.address.firstStage.length){
                return false;
            }
            if(1>$scope.address.detailInfo.length){
                return false;
            }
            return true;
        }
    }])
    .controller('addressEditController',['$rootScope','$scope','addressFactory','$stateParams','$state',function($rootScope,$scope,addressFactory,$stateParams,$state){
        wx.hideOptionMenu();
        $scope.submiting = false;
        var id = $stateParams.id;
        $scope.isLoading = true;
        $scope.tipInfo="";
        addressFactory.accessAddress(id);
        $scope.$on('addressUpdated', function() {
            $scope.isLoading = false;
            $scope.address=addressFactory.getAddress();
        });
        $scope.editAddress = function(){
            if(!$scope.checkAddress()){
                $scope.tipInfo = "请检查输入信息合法性";
                return;
            }
            $scope.submiting = true;
            addressFactory.updateAddress($scope.address);
        };
        $scope.$on("updateAddressSuccess",function(){
            //$scope.tipInfo = "修改地址成功,请返回刷新地址";
            $state.go("address");
        });
        $scope.$on("updateAddressFail",function(){
            $scope.tipInfo = "修改地址失败,请稍后重试";
        });
        $scope.checkAddress = function(){
            if(1>$scope.address.username.length){
                return false;
            }
            if(1>$scope.address.telNumber.length){
                return false;
            }
            if(1>$scope.address.firstStage.length){
                return false;
            }
            if(1>$scope.address.detailInfo.length){
                return false;
            }
            return true;
        }
    }])
    .controller('walletController',['$rootScope','$scope','moneyFactory','$state',function($rootScope,$scope,moneyFactory,$state){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.hasMoney = false;
        moneyFactory.accessMoneys();
        $scope.$on('moneyQuerySuccess',function(){
            $scope.moneys = moneyFactory.getMoneys();
            $scope.$broadcast('scroll.refreshComplete');
            if(0<$scope.moneys.length){
                $scope.hasMoney = true;
            }
        });
        //下拉更新
        $scope.doRefresh=function(){
            moneyFactory.accessMoneys();
        }
    }])
    .controller('transfersController',['$rootScope','$scope','transfersFactory',function($rootScope,$scope,transfersFactory){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.submiting = false;
        $scope.tipInfo = "";
        $scope.transferMoney = $scope.user.money;
        var now = new Date();
        $scope.transfer = function(){
            if($scope.transferMoney<1){
                $scope.tipInfo = "提现金额不能小于1";
                return;
            }
            if($scope.transferMoney>$scope.user.money){
                $scope.tipInfo = "提现金额已超出你的账户余额";
                return;
            }
            $scope.submiting = true;
            var strMoney = $scope.transferMoney*100;
            transfersFactory.get({userId:$scope.user.id,money:strMoney},function(res){
                //console.log("res>>"+res.result+"|"+res.msg);
                if("SUCCESS"==res.result){
                    $scope.submiting = false;
                    $rootScope.user.money -=$scope.transferMoney;
                }
                $scope.tipInfo = res.msg;
            },function(error){
                //$scope.tipInfo = "提现失败,请稍后重试";
                $scope.tipInfo=error;
            });
        }
    }])
    .controller('shareArtfactController',['$rootScope','$scope','$stateParams','shareFactory',function($rootScope,$scope,$stateParams,shareFactory){
        wx.hideOptionMenu();
        var user = $rootScope.user;
        var artId = $stateParams.id;
        $scope.nodata = false;
        $scope.showloading=true;
        shareFactory.get({id:artId},function(resp){
            $scope.artifact = resp;
            $scope.showloading=false;
            if(undefined==$scope.artifact||null==$scope.artifact){
                $scope.nodata = true;
            }
        },function(error){
            $scope.nodata = true;
        });
    }])
    .controller('myStoreController',['$rootScope','$scope','storeFactory','ENV',function($rootScope,$scope,storeFactory,ENV){
        wx.hideOptionMenu();
        $scope.weburl = ENV.webapi;
        var user = $rootScope.user;
        var userId = user.id;
        $scope.tipInfo = "";
        $scope.stores = [];
        $scope.showloading=true;
        storeFactory.query({userId:userId},function(resp){
            $scope.stores = resp;
            $scope.showloading=false;
        },function(){
            $scope.tipInfo = "加载数据失败,请稍后重试...";
        });
    }])
    .controller('myMessageController',['$rootScope','$scope','messageFactory','ENV',function($rootScope,$scope,messageFactory,ENV){
        wx.hideOptionMenu();
        $scope.weburl = ENV.webapi;
        var user = $rootScope.user;
        var userId = user.id;
        $scope.tipInfo = "";
        $scope.messages = [];
        $scope.isloading=true;
        $scope.deleteMessage = function(message){
           angular.forEach($scope.messages,function(value,key){
               if(value.id==message.id){
                   $scope.messages.splice(key,1);
               }
           });
        };
        messageFactory.query({userId:userId,status:'wd'},function(resp){
            $scope.messages = resp;
            $scope.isloading=false;
        },function(){
            $scope.tipInfo = "加载数据失败,请稍后重试...";
        });
        $scope.read = function(message){
            message.status = 'yd';
            messageFactory.update({userId:userId,id:message.id},message,function(resp){
                $scope.deleteMessage(message);
            },function(){
                $scope.tipInfo = "处理失败,请稍后重试...";
            });
        };
    }])
    .controller('mayinvestorsController',['$rootScope','$scope','investorsFactory','ENV','$filter','mayinvestorsFactory','noneSubordinateInvestorsFactory',function($rootScope,$scope,investorsFactory,ENV,$filter,mayinvestorsFactory,noneSubordinateInvestorsFactory){
        wx.hideOptionMenu();
        $scope.mayinvestor = true;
        $scope.mayinvestors = [];
        $scope.investors = [];
        mayinvestorsFactory.query({},function(resp){
            angular.forEach(resp,function(value,key){
                value.checked = false;
                $scope.mayinvestors.push(value);
            });
        });
        $scope.changeType = function(flag){
            if($scope.mayinvestor==flag){
                return;
            }else{
                $scope.mayinvestor = flag;
                if(flag){
                    mayinvestorsFactory.query({},function(resp){
                        $scope.mayinvestors = [];
                        angular.forEach(resp,function(value,key){
                            value.checked = false;
                            $scope.mayinvestors.push(value);
                        });
                    });
                }else {
                    noneSubordinateInvestorsFactory.query({},function(resp){
                        $scope.investors = [];
                        angular.forEach(resp,function(value,key){
                            value.checked = false;
                            $scope.investors.push(value);
                        });
                    });
                }
            }
        };
        $scope.setInvesotrs = function(){
            var userIds = [];
            if($scope.mayinvestor){
                angular.forEach($scope.mayinvestors, function(value,index){
                    if(value.checked==true){
                        userIds.push(value.id);
                    }
                });
                if(userIds.length>0){
                    mayinvestorsFactory.update({investorType:'investors',ids:userIds},function(resp){
                        $scope.mayinvestors = [];
                        angular.forEach(resp,function(value,key){
                            value.checked = false;
                            $scope.mayinvestors.push(value);
                        });
                    });
                }
            }else{
                angular.forEach($scope.investors, function(value,index){
                    if(value.checked==true){
                        userIds.push(value.id);
                    }
                });
                if(userIds.length>0){
                    mayinvestorsFactory.update({investorType:'not_investors',ids:userIds},function(resp){
                        noneSubordinateInvestorsFactory.query({},function(resp2){
                            $scope.investors = [];
                            angular.forEach(resp2,function(value,key){
                                value.checked = false;
                                $scope.investors.push(value);
                            });
                        });
                    });
                }
            }
        };
    }])
    .controller('investorsController',['$rootScope','$scope','investorsFactory',function($rootScope,$scope,investorsFactory){
        wx.hideOptionMenu();
        $scope.assigned = false;
        $scope.tipInfo = "";
        $scope.selectedInvestor = {
            id:null,
            admin:[],
            other:[],
            updateIds:[]
        };
        $scope.assignedUser = function(a){
            if('Y'==a){
                $scope.assigned = true;
            }else{
                $scope.assigned = false;
            }
        };
        $scope.parseUser = function(id){
            $scope.selectedInvestor.id=id;
            $scope.selectedInvestor.admin=[];
            $scope.selectedInvestor.other=[];
            angular.forEach($scope.nonInvestors,function(value,key){
                if(value.investors==id){
                    value.checked=true;
                    $scope.selectedInvestor.admin.push(value);
                }else {
                    value.checked=false;
                    $scope.selectedInvestor.other.push(value);
                }
            });
        };
        investorsFactory.query({isInvestors:'investors'},function(resp){
            $scope.selectedInvestor.id=resp[0].id;
            $scope.investors=resp;
        });
        investorsFactory.query({isInvestors:'not_investors'},function(resp){
            $scope.nonInvestors=resp;
            if(null==$scope.selectedInvestor.id){
                angular.forEach(resp,function(value,index){
                    if(null!=value.investors){
                        $scope.selectedInvestor.id = value.investors;
                    }
                });
            }
            $scope.parseUser($scope.selectedInvestor.id);
        });
        $scope.updateInvestor = function(){
            $scope.selectedInvestor.updateIds = [];
            $scope.selectedInvestor.updateIds.push(0);
            angular.forEach($scope.selectedInvestor.admin,function(value,index){
                if(value.checked==true){
                    $scope.selectedInvestor.updateIds.push(value.id);
                }
            });
            angular.forEach($scope.selectedInvestor.other,function(value,index){
                if(value.checked==true){
                    $scope.selectedInvestor.updateIds.push(value.id);
                }
            });
            investorsFactory.update({userId:$scope.selectedInvestor.id,ids:$scope.selectedInvestor.updateIds},
                function(resp){
                    $scope.tipInfo = "已更新投资人用户";
                    $scope.nonInvestors = resp;
                    $scope.parseUser($scope.selectedInvestor.id);
                },
                function(error){
                    $scope.tipInfo = "更新失败,请稍后重试";
                }
            );
        }
    }])
    .controller('shopController',['$rootScope','$scope','shopsFactory','userFactory','$stateParams','$ionicScrollDelegate',function($rootScope,$scope,shopsFactory,userFactory,$stateParams,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.isLoading = true;
        $scope.userId =$stateParams.id;
        $scope.loadingMore = false;
        userFactory.get({openid:$scope.userId},function(resp){
            $scope.shopUser = resp;
        });
        //获取服务器数据
        shopsFactory.getTopArtifacts($scope.userId);
        //接收第一次加载数据的通知
        $scope.$on('shopsUpdated', function() {
            $scope.isLoading = false;
            $scope.userArtifacts=shopsFactory.getArtifacts();
            $scope.$broadcast('scroll.refreshComplete');
        });
        $scope.$on('moreShopsUpdated', function() {
            $scope.userArtifacts=shopsFactory.getArtifacts();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;

        });
        //下拉更新
        $scope.doRefresh=function(){
            shopsFactory.getTopArtifacts($scope.userId);
        };

        //上拉更新
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            shopsFactory.getMoreArtifacts($scope.userId);
        };


        $scope.hasNextPage = function() {
            return shopsFactory.hasNextPage();
        };
    }])
    .controller('forumsController',['$rootScope','$scope','forumFactory','$ionicScrollDelegate','forumCommentFactory','$ionicPopup',function($rootScope,$scope,forumFactory,$ionicScrollDelegate,forumCommentFactory,$ionicPopup){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        $scope.loadingMore = false;
        $scope.supporting = false;
        $scope.deleteing = false;
        var resource = forumFactory.getResource();
        forumFactory.getTopForums();
        $scope.$on("forumsUpdated",function(resp){
            $scope.forums = forumFactory.getForums();
            $scope.$broadcast('scroll.refreshComplete');
            $scope.isLoading = false;
        });
        $scope.$on("moreForumsUpdated",function(resp){
            $scope.forums = forumFactory.getForums();
            $ionicScrollDelegate.scrollTop();
            $scope.loadingMore = false;
        });
        //下拉刷新
        $scope.doRefresh=function(){
            forumFactory.getTopForums();
        };

        //点击加载更多数据
        $scope.loadMore=function(){
            $scope.loadingMore = true;
            forumFactory.getMoreForums();
        };
        $scope.hasNextPage = function() {
            return forumFactory.hasNextPage();
        };
        $scope.support = function(forumId){
            $scope.supporting = true;
            angular.forEach($scope.forums, function(value,key){
                if(forumId==value.id&&value.supported==0){
                    var now = new Date();
                    var forumComment = {
                        "id": null,
                        "forum_id":forumId,
                        "comment": null,
                        "user": $scope.user,
                        "support": "1",
                        "submitTime": now.getTime()
                    };
                    forumCommentFactory.save({userId:$scope.user.id},forumComment,function(resp){
                        angular.forEach($scope.forums,function(value,index){
                            if(value.id==forumId){
                                value.forumComments.push(resp);
                                value.supported=1;
                            }
                        });
                        $scope.supporting = false;
                    },function(error){
                        $scope.supporting = false;
                    });
                }
            });
        };
        $scope.deleteForum = function(forum){
            forum.isShow=0;
            $scope.deleteing = true;
            var confirmPopup = $ionicPopup.confirm({
                title: '提示信息',
                template: '确认删除当前帖子吗？',
                cancelText: '取 消',
                okText: '删 除',
                cssClass: 'my-confirm'
            });

            confirmPopup.then(function(res) {
                if(res) {
                    resource.update({id:forum.id},forum,function(resp){
                        angular.forEach($scope.forums,function(value,key){
                            if(value.id==forum.id){
                                $scope.forums.splice(key,1);
                            }
                        });
                        $scope.deleteing = false;
                    },function(error){
                        $scope.deleteing = false;
                    });
                } else {
                    $scope.deleteing = false;
                }
            });
        }
    }])
    .controller('forumDetailController',['$rootScope','$scope','forumFactory','$stateParams','$ionicScrollDelegate','forumCommentFactory','utilsService',function($rootScope,$scope,forumFactory,$stateParams,$ionicScrollDelegate,forumCommentFactory,utilsService){
        wx.hideOptionMenu();
        $scope.isLoading = true;
        $scope.commenting = false;
        $scope.inputComment = "";
        $scope.user = $rootScope.user;
        var forumId = $stateParams.id;
        var resource = forumFactory.getResource();
        resource.get({id:forumId},function(resp){
            $scope.forum = resp;
            $scope.isLoading = false;
        },function(error){
            $scope.isLoading = false;
        });
        $scope.comment = function(){
            if($scope.inputComment.length<1||"请输入评论内容"===$scope.inputComment){
                $scope.inputComment="请输入评论内容";
                return;
            }
            utilsService.showLoading("正在提交评论内容,请稍后...");
            $scope.commenting = true;
            var now = new Date();
            var forumComment = {
                "id": null,
                "forum_id":$scope.forum.id,
                "comment": $scope.inputComment,
                "user": $scope.user,
                "support": "0",
                "submitTime": now.getTime()
            };
            forumCommentFactory.save({userId:$scope.user.id},forumComment,function(resp){
                $scope.forum.forumComments.push(resp);
                $scope.inputComment = "";
                $scope.commenting = false;
                utilsService.hideLoading();
            },function(error){
                utilsService.hideLoading();
            });
        };
        $scope.toContentBottom = function(){
            $ionicScrollDelegate.$getByHandle('mainScroll').scrollBottom(false);
        }
    }])
    .controller('forumDeployController',['$rootScope','$scope','wxconfigerFactory','ENV','forumFactory','$state','$ionicLoading',function($rootScope,$scope,wxconfigerFactory,ENV,forumFactory,$state,$ionicLoading){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.tipInfo = "";
        $scope.images = {
            localIds:[],
            serverIds:[]
        };
        var now = new Date();
        $scope.forum = {
           "id":null,
            "forumImages":[],
            "content":"",
            "user":$scope.user,
            "createTime":now.getTime(),
            "isShow":1
        };
        $scope.uploaded = "未上传";
        $scope.submiting = false;
        $scope.showLoading = function() {
            $ionicLoading.show({
                template: '正在发布帖子,请稍后...'
            });
        };
        $scope.hideLoading = function(){
            $ionicLoading.hide();
        };
        $scope.deleteImg = function(localId){
            angular.forEach($scope.images.localIds,function(value,index){
                if(value == localId){
                    $scope.images.localIds.splice(index,1);
                }
            });
        };
        $scope.chooseImage = function(){
            wx.chooseImage({
                count: 9, // 默认9
                sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
                success: function (res) {
                    $scope.$apply(function(){
                        angular.forEach(res.localIds, function(value,index){
                            $scope.images.localIds.push(value);
                        });
                    });
                }
            });
        };
        $scope.uploadImage = function(){
            if ($scope.images.localIds.length == 0) {
                return;
            }
            $scope.images.serverIds=[];
            var syncUpload = function(localIds){
                var localId = localIds.pop();
                wx.uploadImage({
                    localId: localId,
                    isShowProgressTips: 1,
                    success: function (res) {
                        var serverId = res.serverId; // 返回图片的服务器端ID
                        $scope.images.serverIds.push(serverId);
                        if(localIds.length > 0){
                            syncUpload(localIds);
                        }else{
                            $scope.$apply(function(){
                                $scope.uploaded = "已上传"+$scope.images.serverIds.length+'张';
                            });
                        }
                    }
                });
            };
            syncUpload($scope.images.localIds);
        };

        $scope.previewImage = function(){
            if ($scope.images.localIds.length == 0) {
                return;
            }
            wx.previewImage({
                current: $scope.images.serverIds[0],
                urls: $scope.images.serverIds
            });
        };
        $scope.checkData = function(){
            if($scope.images.serverIds.length<1){
                $scope.tipInfo = "请上传图片";
                return false;
            }
            if($scope.forum.content.length<1){
                $scope.tipInfo = "请输入帖子内容";
                return false;
            }
            return true;
        };
        $scope.deploy = function(){
            if(!$scope.checkData()){
                return;
            }
            $scope.submiting = true;
            $scope.showLoading();
            var resource = forumFactory.getResource();
            $scope.parseImages($scope.images.serverIds);
            $scope.tipInfo = "正在发布帖子,请稍后...";
            resource.save($scope.forum,function(resp){
                //$scope.tipInfo = "恭喜,帖子发布成功";
                $scope.hideLoading();
                $state.go("tabs.forums");
            },function(error){
                $scope.submiting = false;
                $scope.tipInfo = "抱歉,帖子发布失败,请稍后再试";
                $scope.hideLoading();
            });
        };
        $scope.parseImages = function(serverIds){
            $scope.forum.forumImages = [];
            angular.forEach(serverIds,function(serverId,index){
                var image = {
                    "id": null,
                    "openid": $scope.user.openid,
                    "name": null,
                    "src": null,
                    "serverId":serverId
                };
                $scope.forum.forumImages.push(image);
            });

        };
    }])
    .controller('shenpiController',['$rootScope','$scope','$interval','orderFactory','$ionicScrollDelegate',function($rootScope,$scope,$interval,orderFactory,$ionicScrollDelegate){
        wx.hideOptionMenu();
        $scope.user = $rootScope.user;
        $scope.isLoading = true;
        orderFactory.getTopOrders("6");
        $scope.$on('ordersUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $scope.$broadcast('scroll.refreshComplete');
        });

        $scope.$on('ordersMoreUpdated', function() {
            $scope.isLoading = false;
            $scope.orders=orderFactory.getOrders();
            $scope.loadingMore = false;
        });

        //下拉更新
        $scope.doRefresh=function(){
            orderFactory.getTopOrders("6");
        };

        //上拉更新
        $scope.loadMore=function(){
            orderFactory.getMoreOrders("6");
            $scope.$broadcast('scroll.infiniteScrollComplete');
        };


        $scope.hasNextPage = function() {
            return orderFactory.hasNextPage();
        };
    }])
    .controller('shenpiDetailController',['$rootScope','$scope','$stateParams','$state','orderFactory','$ionicPopup',function($rootScope,$scope,$stateParams,$state,orderFactory,$ionicPopup){
        wx.hideOptionMenu();
        $scope.disable = false;
        $scope.tuikuan = false;
        $scope.tipInfo = "请尽快审批";
        var id = $stateParams.id;
        /*分类信息*/
        $scope.types = ["文房四宝","玉粹珠宝","茶酒滋补","紫砂陶器","精雕细琢","文玩杂项"];
        $scope.isLoading=true;
        orderFactory.accessOrder(id);
        $scope.$on('orderUpdated', function() {
            $scope.isLoading=false;
            $scope.order=orderFactory.getOrder();
            $scope.type = $scope.types[$scope.order.artifact.type];
        });
        $scope.shenpi = function(){
            if("6"!=$scope.order.artifact.status){
                $scope.tipInfo = "请返回刷新订单...";
                return;
            }
            if(null==$scope.order.artifact.processExplain||$scope.order.artifact.processExplain.length<1){
                $scope.tipInfo = "请填写审批意见";
                return;
            }
            $scope.disable = true;
            var resource = orderFactory.getResource();
            if($scope.tuikuan){
                $scope.order.artifact.status = "9";
                $scope.order.artifact.returnResult = "agree";
            }else{
                $scope.order.artifact.status = "4";
                $scope.order.artifact.returnResult = "disagree";
            }
            resource.update({userId:$scope.user.id,id:id}, $scope.order,
                function(res){
                    if('4'==res.artifact.status){
                        $rootScope.user = res.user;
                        $scope.tipInfo = "不同意退货,已经付款给卖家";
                    }
                    if('9'==res.artifact.status){
                        $rootScope.user = res.user;
                        if(res.type=='0'){
                            $scope.tipInfo = "同意退货,请及时到微信平台完成退款,商户订单号为:"+res.wxOrderId;
                        }else{
                            $scope.tipInfo = "同意退货,将返还积分给买家";
                        }
                    }
                    if('6'==res.artifact.status){
                        $rootScope.user = res.user;
                        $scope.tipInfo = "操作失败,请稍后再试";
                    }
                },
                function(error){
                    $scope.tipInfo = "操作失败,请稍后再试";
                }
            );
        };

    }]);

