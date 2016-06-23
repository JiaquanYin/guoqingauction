/**
 * Created by jiaquan on 15/12/14.
 */
var appServices = angular.module("myServices",[]);
appServices.factory('weixinFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"weixin/:code";
    var resource = $resource(url,{code:'@code'});
    var user = {};
    return {
        getUserByCode:function(code){
            resource.get({code:code},
                function(resp){
                    user = resp;
                    $rootScope.$broadcast("userUpdatedByCode");
                }
            );
        },
        getUser:function(){
            if(undefined == user.id){
                return;
            }
            return user;
        }
    };
});
appServices.factory('userFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"users/openid/:openid";
    return resource = $resource(url,{openid:"@openid"},{
        update: {
            method: 'PUT',
            timeout: 20000
        }
    });
});
appServices.factory('transfersFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+":userId/transfers/:money";
    return resource = $resource(url,{userId:"@userId",money:"@money"});
});
appServices.factory('moneyFactory',function($rootScope,$resource,ENV,utilsService){
    var rootApi = ENV.api;
    var url = rootApi+":userId/moneys";
    var moneys = {};
    var resource = $resource(url,{userId:"@userId"},{
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        }
    });
    var localInfo = utilsService.getLocalInfo();
    var userId = null;
    if(localInfo.result=='pass'){
        userId = localInfo.user.id;
    }

    return {
        accessMoneys: function(){
            resource.query({userId:userId},function(res){
                moneys.data = res;
                $rootScope.$broadcast('moneyQuerySuccess');
            });
        },
        getMoneys: function(){
            if(undefined==moneys.data){
                return;
            }
            return moneys.data;
        }
    };
});
appServices.factory('wxconfigerFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"weixinConfiger";
    return resource = $resource(url,{url:"@url"});
});
appServices.factory('artifactFactory',function($rootScope,$resource,ENV){
    var ApiUrl = ENV.api+"artifacts",
    // 用来存储话题类别的数据结构，包含了下一页、是否有下一页等属性
        artifacts = {},
        userArtifacts = {},
        type = 0;


    var resource = $resource(ApiUrl, {}, {
        query: {
            method: 'get',
            params: {
                type: '@type',
                page: '@page',
                rows: 10

            },
            timeout: 20000,
            isArray:true
        }
    });


    return {

        //获取第一页的数据
        getTopArtifacts:function(){

            var hasNextPage = true;   //是否有下一页

            resource.query({
                type:type,
                page:1
            }, function (r) {
                console.log(r);
                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                artifacts[type]={

                    'hasNextPage':hasNextPage,
                    'nextPage': 2,
                    'data': r
                };
                $rootScope.$broadcast('topArtifactsUpdated');

            })
        } ,
        //返回我们保存的数据
        getArtifacts:function(){
            if(artifacts[type]==undefined){
                return;
            }
            return artifacts[type].data;

        },
        getMoreArtifacts:function(){
            //为了解决一步加载的时候数据还没有加载完成  然后请求loadMore的时候  找不到数据
            if(artifacts[type]==undefined){
                return;
            }
            //获取以前的数据
            var hasNextPage=artifacts[type].hasNextPage;
            var nextPage=artifacts[type].nextPage;
            var moreArtifactsData=artifacts[type].data;
            resource.query({
                type:type,
                page:nextPage
            }, function (r) {
                nextPage++;
                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                moreArtifactsData=r;
                artifacts[type]={
                    'hasNextPage':hasNextPage,
                    'nextPage': nextPage,
                    'data': moreArtifactsData
                };
                $rootScope.$broadcast('moreArtifactsUpdated');

            });
        },
        setArtifactType:function(typeId){   //点击分类加载数据
            type=typeId;
            this.getTopArtifacts();
        },
        hasNextPage: function() {
            if (artifacts[type] == undefined) {
                return;
            }
            return artifacts[type].hasNextPage;
        }
    }
});
appServices.factory('artDetailFactory',function($rootScope,$resource,ENV,utilsService){
    var ApiUrl = ENV.api+":userId/artifacts/:id",
    // 用来存储宝贝详细
        artifact = null;
    var localInfo = utilsService.getLocalInfo();
    var userId = null;
    if(localInfo.result=='pass'){
        userId = localInfo.user.id;
    }
    var resource = $resource(ApiUrl, {userId:'@userId', id:'@id'},{
        update: {method:'PUT'}
    });
    return {

        get: function(aid) {

             console.log(aid);
            return resource.get({
                userId:userId,
                id: aid
            }, function(response) {
                 console.log(response);
                artifact = response;
                $rootScope.$broadcast('artDetailUpdated');
            });

        },
        getArtifact: function() {
            if(artifact==null){
                return;
            }
            return artifact;
        },
        deleteArtifact: function(artId){
            resource.delete({id:artId},function(resp){
                artifact = resp;
                $rootScope.$broadcast('artDeletedUpdated');
            });
        },
        getResource: function(){
            return resource;
        }
    };
});
appServices.factory('saveOrUpdateFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"artifacts/:id";
    var resource = $resource(url,{id:"@id"});
    return resource;
});
appServices.factory('biddingFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"artifacts/:artId/biddings/:id";
    var resource = $resource(url,{artId:"@artId",id:"@id"});
    return resource;
});
appServices.factory('pointFactory',function($rootScope,$resource,ENV){
    var ApiUrl = ENV.api+"points/:id",
    // 用来存储话题类别的数据结构，包含了下一页、是否有下一页等属性
        artifacts = {};


    var resource = $resource(ApiUrl, {id:'@id',page:"@page"}, {
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        }
    });


    return {

        //获取第一页的数据
        getTopArtifacts:function(){

            var hasNextPage = true;   //是否有下一页

            resource.query({page:1},
                function (r) {
                    if (r.length < 10) {  //来判断是否有下一页数据
                        hasNextPage = false;
                    }
                    artifacts={
                        'hasNextPage':hasNextPage,
                        'nextPage': 2,
                        'data': r
                    };
                //在这里请求完成以后  通知controller
                $rootScope.$broadcast('topPointsUpdated');

            });
        } ,
        //返回我们保存的数据
        getArtifacts:function(){
            if(artifacts.data==undefined){
                return;
            }
            return artifacts.data;

        },
        getMoreArtifacts:function(){
            //为了解决一步加载的时候数据还没有加载完成  然后请求loadMore的时候  找不到数据
            if(artifacts.data==undefined){
                return;
            }

            //获取以前的数据
            var hasNextPage=artifacts.hasNextPage;
            var nextPage=artifacts.nextPage;
            var moreArtifactsData=artifacts.data;
            resource.query({page:nextPage},
                function (r) {
                    nextPage++;
                    if (r.length < 10) {  //来判断是否有下一页数据
                        hasNextPage = false;
                    }
                    moreArtifactsData=r;
                    artifacts={
                        'hasNextPage':hasNextPage,
                        'nextPage': nextPage,
                        'data': moreArtifactsData
                    };
                    $rootScope.$broadcast('morePointsUpdated');
            });
        },
        hasNextPage: function() {
            if (artifacts.data == undefined) {
                return;
            }
            return artifacts.hasNextPage;
        }
    }
});
appServices.factory('openidFactory',function($resource,ENV){
    var url = ENV.api+"openid";
    return $resource(url,{code:'@code'});
});
appServices.factory('myartifactFactory',function($rootScope,$resource,ENV){
    var ApiUrl = ENV.api+":userId/artifacts",
    // 用来存储话题类别的数据结构，包含了下一页、是否有下一页等属性
        artifacts = {};


    var resource = $resource(ApiUrl, {userId:'@userId'}, {
        query: {
            method: 'get',
            params: {
                page: '@page'
            },
            timeout: 20000,
            isArray:true
        }
    });


    return {

        //获取第一页的数据
        getTopArtifacts:function(userId){

            var hasNextPage = true;   //是否有下一页

            resource.query({
                userId:userId,
                page:1
            }, function (r) {
                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                artifacts={
                    'hasNextPage':hasNextPage,
                    'nextPage': 2,
                    'data': r
                };
                $rootScope.$broadcast('myartifactsUpdated');

            })
        } ,
        //返回我们保存的数据
        getArtifacts:function(){
            if(artifacts.data==undefined){
                return;
            }
            return artifacts.data;

        },
        getMoreArtifacts:function(userId){
            //为了解决一步加载的时候数据还没有加载完成  然后请求loadMore的时候  找不到数据
            if(artifacts.data==undefined){
                return false;
            }

            //获取以前的数据
            var hasNextPage=artifacts.hasNextPage;
            var nextPage=artifacts.nextPage;
            var moreArtifactsData=artifacts.data;

            resource.query({
                userId:userId,
                page:nextPage
            }, function (r) {

                nextPage++;

                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                moreArtifactsData=r;
                artifacts={
                    'hasNextPage':hasNextPage,
                    'nextPage': nextPage,
                    'data': moreArtifactsData
                };

                //在这里请求完成以后  通知controller


                $rootScope.$broadcast('myMoreArtifactsUpdated');

            })
        },
        hasNextPage: function() {
            if (artifacts.data == undefined) {
                return;
            }
            return artifacts.hasNextPage;
        }
    }
});
appServices.factory('shopsFactory',function($rootScope,$resource,ENV){
    var ApiUrl = ENV.api+"shops/:userId",
    // 用来存储话题类别的数据结构，包含了下一页、是否有下一页等属性
        artifacts = {};


    var resource = $resource(ApiUrl, {userId:'@userId'}, {
        query: {
            method: 'get',
            params: {
                page: '@page'
            },
            timeout: 20000,
            isArray:true
        }
    });


    return {

        //获取第一页的数据
        getTopArtifacts:function(userId){

            var hasNextPage = true;   //是否有下一页

            resource.query({
                userId:userId,
                page:1
            }, function (r) {
                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                artifacts={
                    'hasNextPage':hasNextPage,
                    'nextPage': 2,
                    'data': r
                };
                $rootScope.$broadcast('shopsUpdated');

            })
        } ,
        //返回我们保存的数据
        getArtifacts:function(){
            if(artifacts.data==undefined){
                return;
            }
            return artifacts.data;

        },
        getMoreArtifacts:function(userId){
            //为了解决一步加载的时候数据还没有加载完成  然后请求loadMore的时候  找不到数据
            if(artifacts.data==undefined){
                return false;
            }

            //获取以前的数据
            var hasNextPage=artifacts.hasNextPage;
            var nextPage=artifacts.nextPage;
            var moreArtifactsData=artifacts.data;

            resource.query({
                userId:userId,
                page:nextPage
            }, function (r) {

                nextPage++;

                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                moreArtifactsData=r;
                artifacts={
                    'hasNextPage':hasNextPage,
                    'nextPage': nextPage,
                    'data': moreArtifactsData
                };
                $rootScope.$broadcast('moreShopsUpdated');

            })
        },
        hasNextPage: function() {
            if (artifacts.data == undefined) {
                return;
            }
            return artifacts.hasNextPage;
        }
    }
});
appServices.factory('orderFactory',function($rootScope,$resource,ENV,utilsService){
    var ApiUrl = ENV.api+":userId/orders/:id",
    // 用来存储话题类别的数据结构，包含了下一页、是否有下一页等属性
        orders = {},
        order = {};
    var localInfo = utilsService.getLocalInfo();
    var userId = null;
    if(localInfo.result=='pass'){
        userId = localInfo.user.id;
    }

    var resource = $resource(ApiUrl, {userId:'@userId',id:"@id"}, {
        query: {
            method: 'get',
            params: {
                page: '@page',
                artStatus: '@artStatus'
            },
            timeout: 20000,
            isArray:true
        },
        update: {method:'PUT'}
    });


    return {

        //获取第一页的数据
        getTopOrders:function(artStatus){

            var hasNextPage = true;   //是否有下一页

            resource.query({
                userId:userId,
                page:1,
                artStatus:artStatus
            }, function (r) {
                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                orders={
                    'hasNextPage':hasNextPage,
                    'nextPage': 2,
                    'data': r
                };
                $rootScope.$broadcast('ordersUpdated');

            })
        } ,
        //返回我们保存的数据
        getOrders:function(){
            if(orders.data==undefined){
                return false
            }
            return orders.data;

        },
        getMoreOrders:function(artStatus){
            //为了解决一步加载的时候数据还没有加载完成  然后请求loadMore的时候  找不到数据
            if(orders.data==undefined){
                return false;
            }

            //获取以前的数据
            var hasNextPage=orders.hasNextPage;
            var nextPage=orders.nextPage;
            var moreOrdersData=orders.data;

            console.log(moreOrdersData);

            resource.query({
                userId:userId,
                page:nextPage,
                artStatus:artStatus
            }, function (r) {

                nextPage++;

                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                moreOrdersData=r;
                orders={
                    'hasNextPage':hasNextPage,
                    'nextPage': nextPage,
                    'data': moreOrdersData
                };
                $rootScope.$broadcast('ordersMoreUpdated');

            })
        },
        hasNextPage: function() {
            if (orders.data == undefined) {
                return false;
            }
            return orders.hasNextPage;
        },
        accessOrder: function(orderId){
            resource.get({id:orderId},function(resp){
                order = resp;
                $rootScope.$broadcast('orderUpdated');
            });
        },
        getOrder: function(){
            if(undefined==order.id){
                return;
            }
            return order;
        },
        updateOrder: function(order){
            resource.update({userId:userId,id:order.id}, order, function(res){
                if(res.id !=undefined){
                    $rootScope.$broadcast('updateOrderSuccess');
                }else{
                    $rootScope.$broadcast('updateOrderFail');
                }
            });
        },
        updateAddress: function(order){
            resource.update({userId:userId,id:order.id}, order,
                function(res){
                    if(res.id !=undefined){
                        $rootScope.$broadcast('updateAddressSuccess');
                    }else{
                        $rootScope.$broadcast('updateAddressFail');
                    }
                },
                function(error){
                    $rootScope.$broadcast('updateAddressFail');
                }
            );
        },
        getResource: function(){
            return resource;
        }
    }
});
appServices.factory('weixinpayFactory',function($rootScope,$resource,ENV){
    var ApiUrl = ENV.api+"unifiedorder/:orderId";
    var paysign;
    var resource = $resource(ApiUrl, {orderId:"@orderId"});
    return {
        accessPaysign: function(id){
            resource.get({orderId:id},function(resp){
                paysign = resp;
                $rootScope.$broadcast('paysignUpdated');
            });
        },
        getPaysign: function(){
            if(typeof paysign == "undefined"){
                return;
            }
            return paysign;
        }
    }
});
appServices.factory('addressFactory',function($rootScope,$resource,ENV,utilsService){

    var ApiUrl = ENV.api+":userId/addresses/:id",
    // 用来存储话题类别的数据结构，包含了下一页、是否有下一页等属性
        addresses = {},
        address = {};
    var localInfo = utilsService.getLocalInfo();
    var userId = null;
    if(localInfo.result=='pass'){
        userId = localInfo.user.id;
    }

    var resource = $resource(ApiUrl, {userId:'@userId',id:"@id"}, {
        query: {
            method: 'get',
            params: {
                page: '@page'
            },
            timeout: 20000,
            isArray:true
        },
        update: {method:'PUT'},
        delete: {method:'DELETE'}
    });


    return {
        //获取第一页的数据
        getTopAddresses:function(){

            var hasNextPage = true;   //是否有下一页

            resource.query({
                userId:userId,
                page:1
            }, function (r) {
                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                addresses={
                    'hasNextPage':hasNextPage,
                    'nextPage': 2,
                    'data': r
                };
                $rootScope.$broadcast('addressesUpdated');

            })
        } ,
        //返回我们保存的数据
        getAddresses:function(){
            if(addresses.data==undefined){
                return false
            }
            return addresses.data;

        },
        getNextAddresses:function(){
            //为了解决一步加载的时候数据还没有加载完成  然后请求loadMore的时候  找不到数据
            if(addresses.data==undefined){
                return false;
            }

            //获取以前的数据
            var hasNextPage=addresses.hasNextPage;
            var nextPage=addresses.nextPage;
            var moreAddressesData=addresses.data;
            resource.query({
                userId:userId,
                page:nextPage
            }, function (r) {

                nextPage++;

                if (r.length < 10) {  //来判断是否有下一页数据
                    hasNextPage = false;
                }
                moreAddressesData=r;
                addresses={
                    'hasNextPage':hasNextPage,
                    'nextPage': nextPage,
                    'data': moreAddressesData
                };
                $rootScope.$broadcast('addressesUpdated');

            })
        },
        hasNextPage: function() {
            if (addresses.data == undefined) {
                return false;
            }
            return addresses.hasNextPage;
        },
        accessAddress: function(addressId){
            resource.get({id:addressId},function(resp){
                console.log("username>>"+resp.username);
                address = resp;
                $rootScope.$broadcast('addressUpdated');
            });
        },
        getAddress: function(){
            console.log("获取address");
            if(undefined==address.id){
                return;
            }
            console.log("address>>"+address.username);
            return address;
        },
        updateAddress: function(address){
            resource.update({id:address.id}, address, function(res){
                if(res.id !=undefined){
                    $rootScope.$broadcast('updateAddressSuccess');
                }else{
                    $rootScope.$broadcast('updateAddressFail');
                }
            },function(error){
                $rootScope.$broadcast('updateAddressFail');
            });
        },
        deleteAddress: function(address){
            resource.delete({id:address.id},function(res){
                if('deleted'==res.status){
                    $rootScope.$broadcast('deleteAddressSuccess');
                }else{
                    $rootScope.$broadcast('deleteAddressFail');
                }
            },function(error){
                $rootScope.$broadcast('deleteAddressFail');
            });
        },
        getResource: function(){
            return resource;
        }
    }
});
appServices.factory('randomFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"random";
    var resource = $resource(url,{pointed:"@pointed"},{
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        }
    });
    return resource;
});
appServices.factory('attentionFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"artifact/:artifactId/attentions/:id/user/:userId";
    var resource = $resource(url,{artifactId:"@artifactId",id:"@id",userId:"@userId"},{
        update:{
            method: 'PUT',
            timeout: 20000,
            isArray:true
        },
        saveAttention: {
            method: 'POST',
            timeout: 20000,
            isArray:true
        }
    });
    return resource;
});
appServices.factory('storeFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"user/:userId/storees";
    var resource = $resource(url,{userId:"@userId"},{
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        }
    });
    return resource;
});
appServices.factory('messageFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"user/:userId/messages/:id";
    var resource = $resource(url,{userId:"@userId",id:"@id",status:"@status"},{
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        },
        update:{
            method: 'PUT',
            timeout: 20000
        }
    });
    return resource;
});
appServices.factory('messageCountFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"user/:userId/messages/count";
    var resource = $resource(url,{userId:"@userId",status:"@status"});
    return resource;
});
appServices.factory('forumCommentFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"users/:userId/forumComment";
    var resource = $resource(url,{userId:"@userId"});
    return resource;
});
appServices.factory('investorsFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"investors/:userId";
    var resource = $resource(url,{userId:"@userId",isInvestors:"@isInvestors",ids:"@ids"},{
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        },
        update:{
            method: 'PUT',
            timeout: 20000,
            isArray:true
        }
    });
    return resource;
});
appServices.factory('mayinvestorsFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"mayinvestors";
    var resource = $resource(url,{investorType:'@investorType',ids:'@ids'},{
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        },
        update:{
            method: 'PUT',
            timeout: 20000,
            isArray:true
        }
    });
    return resource;
});
appServices.factory('noneSubordinateInvestorsFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"noneSubordinateInvestors";
    var resource = $resource(url,{},{
        query: {
            method: 'get',
            timeout: 20000,
            isArray:true
        }
    });
    return resource;
});
appServices.factory('forumFactory',function($rootScope,$resource,ENV,utilsService){
    var ApiUrl = ENV.api+":userId/forums/:id", forums = {};
    var localInfo = utilsService.getLocalInfo();
    var userId = null;
    if(localInfo.result=='pass'){
        userId = localInfo.user.id;
    }
    //var userId = 1;
    var resource = $resource(ApiUrl, {userId:"@userId",id:'@id'}, {
        query: {
            method: 'get',
            params: {
                page: '@page'
            },
            timeout: 20000,
            isArray:true
        },
        update:{
            method: 'PUT',
            timeout: 20000
        }
    });

    return {
        //获取第一页的数据
        getTopForums:function(){
            var hasNextPage = true;   //是否有下一页
            resource.query({userId:userId,page:1},
                function (r) {
                    if (r.length < 10) {  //来判断是否有下一页数据
                        hasNextPage = false;
                    }
                    forums={
                        'hasNextPage':hasNextPage,
                        'nextPage': 2,
                        'data': r
                    };
                    $rootScope.$broadcast('forumsUpdated');
                });
        } ,
        //返回我们保存的数据
        getForums:function(){
            if(forums.data==undefined){
                return false;
            }
            return forums.data;

        },
        getMoreForums:function(){
            //为了解决一步加载的时候数据还没有加载完成  然后请求loadMore的时候  找不到数据
            if(forums.data==undefined){
                return false;
            }
            //获取以前的数据
            var hasNextPage=forums.hasNextPage;
            var nextPage=forums.nextPage;
            resource.query({userId:userId,page:nextPage},
                function (r) {
                    if (r.length < 10) {  //来判断是否有下一页数据
                        hasNextPage = false;
                    }else{
                        nextPage++;
                    }
                    console.log("下一页>>>"+(nextPage)+"<<<");
                    forums={
                        'hasNextPage':hasNextPage,
                        'nextPage': nextPage,
                        'data': r
                    };
                    $rootScope.$broadcast('moreForumsUpdated');
                }
            );
        },
        getResource: function(){
           return resource;
        },
        hasNextPage: function() {
            if (forums.data == undefined) {
                return false;
            }
            return forums.hasNextPage;
        }
    }
});
appServices.factory('commonFactory',function($rootScope,$resource,ENV){
    return {
        expire:function(start,interval){
            var now = new Date();
            if((now.getTime()-start+60)>interval){
                return true;
            }else{
                return false;
            }
        },
        groupingImages: function(images,numberEachRow){
            var group = [];
            for(var i=0,len=images.length;i<len;i+=3){
                group.push(images.slice(i,i+3));
            }
            return group;
        }
    }
});
appServices.factory('shareFactory',function($rootScope,$resource,ENV){
    var rootApi = ENV.api;
    var url = rootApi+"share/:id";
    var resource = $resource(url,{id:"@id"});
    return resource;
});