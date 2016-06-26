/**
 * Created by jiaquan on 16/2/5.
 */
angular.module('ionicApp', ['ionic','ngResource','ngMessages','config','myControllers','myServices','filterModule','UtilsModule'])
    .config(function($stateProvider,$locationProvider, $httpProvider, $urlRouterProvider,$ionicConfigProvider) {
        //$httpProvider.interceptors.push(function($rootScope){
        //    return {
        //        request: function(config) {
        //            var openid = "login";
        //            if(undefined!=$rootScope.user){
        //                openid = $rootScope.user.openid;
        //            }
        //            config.headers['login-openid'] = openid;
        //            return config;
        //        },
        //        response: function(response) {
        //            var responseFlag = response.headers('responseFlag');
        //            if(responseFlag=="notpass"){
        //                window.location.href = "#/guoqingauction";
        //            }
        //            return response;
        //        }
        //    };
        //});
        $ionicConfigProvider.platform.ios.tabs.style('standard');
        $ionicConfigProvider.platform.ios.tabs.position('bottom');
        $ionicConfigProvider.platform.android.tabs.style('standard');
        $ionicConfigProvider.platform.android.tabs.position('standard');

        $ionicConfigProvider.platform.ios.navBar.alignTitle('center');
        $ionicConfigProvider.platform.android.navBar.alignTitle('left');

        $ionicConfigProvider.platform.ios.backButton.previousTitleText('').icon('ion-ios-arrow-thin-left');
        $ionicConfigProvider.platform.android.backButton.previousTitleText('').icon('ion-android-arrow-back');

        $ionicConfigProvider.platform.ios.views.transition('ios');
        $ionicConfigProvider.platform.android.views.transition('android');
        $locationProvider.html5Mode(true);
        $ionicConfigProvider.views.maxCache(0);
        $stateProvider
            .state('tabs', {
                url: "/tabs",
                abstract: true,
                templateUrl: "templates/tabbar.html"
            })
            .state('tabs.home', {
                url: "/home?code&state",
                views: {
                    'tab-home': {
                        templateUrl: "templates/home.html"
                    }
                }
            })
            .state('tabs.deploy', {
                url: "/deploy",
                views: {
                    'tab-deploy': {
                        templateUrl: "templates/deploy/deploy.html"
                    }
                }
            })
            .state('tabs.artifacts', {
                url: "/artifacts",
                views: {
                    'tab-look': {
                        templateUrl: "templates/artifact/artifacts.html"
                    }
                }
            })
            .state('tabs.artifact', {
                url: "/artifact/:id?code&state",
                views: {
                    'tab-look': {
                        templateUrl: "templates/artifact/artifact-detail.html"
                    }
                }
            })
            .state('tabs.forums', {
                url: "/forums",
                views: {
                    'tab-forums': {
                        templateUrl: "templates/forum/forums.html"
                    }
                }
            })
            .state('forum', {
                url: "/forums/:id",
                templateUrl: "templates/forum/forum-detail.html"
            })
            .state('forum-deploy', {
                url: "/forum/deploy",
                templateUrl: "templates/forum/forum-deploy.html"
            })
            .state('tabs.points', {
                url: "/points",
                views: {
                    'tab-look': {
                        templateUrl: "templates/point/point.html"
                    }
                }
            })
            .state('tabs.point', {
                url: "/point/:id?code&state",
                views: {
                    'tab-look': {
                        templateUrl: "templates/point/point-detail.html"
                    }
                }
            })
            .state('introduction', {
                url: "/introduction",
                templateUrl: "templates/auction-inf.html"
            })
            .state('guoqingauction', {
                url: "/guoqingauction",
                templateUrl: "templates/guoqingauction.html"
            })
            .state('spokesman', {
                url: "/spokesman",
                templateUrl: "templates/spokesman.html"
            })
            .state('tabs.me', {
                url: "/me",
                views: {
                    'tab-me': {
                        templateUrl: "templates/me/me.html"
                    }
                }
            })
            .state('myartifacts', {
                url: "/myartifacts",
                templateUrl: "templates/me/myartifacts.html"
            })
            .state('myartifactdetail', {
                url: "/myartifacts/:id",
                templateUrl: "templates/me/myartifact-detail.html"
            })
            .state('pay_orders', {
                url: "/pay_orders",
                templateUrl: "templates/me/pay-orders.html"
            })
            .state('pay_orderdetail', {
                url: "/pay_orders/:id",
                templateUrl: "templates/me/pay-order-detail.html"
            })
            .state('fahuo_orders', {
                url: "/fahuo_orders",
                templateUrl: "templates/me/fahuo-orders.html"
            })
            .state('fahuo_orderdetail', {
                url: "/:userId/fahuo_orders/:id",
                templateUrl: "templates/me/fahuo-order-detail.html"
            })
            .state('shouhuo_orders', {
                url: "/shouhuo_orders",
                templateUrl: "templates/me/shouhuo-orders.html"
            })
            .state('shouhuo_orderdetail', {
                url: "/:userId/shouhuo_orders/:id",
                templateUrl: "templates/me/shouhuo-order-detail.html"
            })
            .state('evaluation_orders', {
                url: "/evaluation_orders",
                templateUrl: "templates/me/evaluation-orders.html"
            })
            .state('evaluation_orderdetail', {
                url: "/:userId/evaluation_orders/:id",
                templateUrl: "templates/me/evaluation-order-detail.html"
            })
            .state('shenpi', {
                url: "/shenpi",
                templateUrl: "templates/me/shenpi-orders.html"
            })
            .state('shenpi_detail', {
                url: "/shenpi/:id",
                templateUrl: "templates/me/shenpi-order-detail.html"
            })
            .state('address', {
                url: "/address",
                templateUrl: "templates/me/address.html"
            })
            .state('address-look', {
                url: "/address-look/:id",
                templateUrl: "templates/me/address-look.html"
            })
            .state('address-new', {
                url: "/address-new",
                templateUrl: "templates/me/address-new.html"
            })
            .state('address-edit', {
                url: "/address-edit/:id",
                templateUrl: "templates/me/address-edit.html"
            })
            .state('wallet', {
                url: "/wallet",
                templateUrl: "templates/me/wallet.html"
            })
            .state('store', {
                url: "/store",
                templateUrl: "templates/me/store.html"
            })
            .state('messages', {
                url: "/messages",
                templateUrl: "templates/me/message.html"
            })
            .state('investors', {
                url: "/investors",
                templateUrl: "templates/me/investors.html"
            })
            .state('mayinvestors', {
                url: "/mayinvestors",
                templateUrl: "templates/me/mayinvestors.html"
            })
            .state('transfers', {
                url: "/wallet/transfers",
                templateUrl: "templates/me/transfers.html"
            })
            .state('register', {
                url: "/register",
                templateUrl: "templates/register.html"
            })
            .state('shop', {
                url: "/shop/:id",
                templateUrl: "templates/shop.html"
            })
            .state('share', {
                url: "/share/:id",
                templateUrl: "templates/share-artifact.html"
            });

        $urlRouterProvider.otherwise("/tabs/home");

    });
