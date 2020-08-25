import RouterHash from './router.hash';
import RouterHistory from './router.history';

export default class Router {
    constructor(options) {
        const defaults = {
            wraper: null, //组件插槽dom对象
            mode: 'hash', //模式：hash|history
            routes: [], //路由配置
            before: function (route, prev) {},
            after: function (route, next) {},
            ready: function (route) {},
            fail: function (route) {},
            update: function (param) {}, //路由参数更新
            notFound: function (path) {
                console.error(`${path} 当前路由没找到`)
            }, //路由未找到
            change: function (route) {}, //路由改变
        }
        this.options = Object.assign(defaults, options);
        this.init();
    }

    init() {
        const options = this.options;
        this.cached = {}; //已缓存的路由组件实例map：key为路由id
        this.router = null;
        this.currentInstance = null; //当前组件实例
        this.current = null; //当前路由
        const _opts = {
            routes: options.routes || [], //路由配置
            pathChange: options.change(),
            update: options.update, //路由参数更新
            notfound: options.notFound, //路由未找到
            change: (route, current) => {
                this.current && this.currentInstance && this.unloadComponent();
                this.loadComponent(route);
            }, //路由改变；参数：(最新路由，当前路由)

        }
        if (options.mode === 'hash') {
            this.router = new RouterHash(_opts);
        } else if (options.mode === 'history') {
            this.router = new RouterHistory(_opts);
        } else {
            console.error(`不支持的路由模式:${options.mode}`)
        }


        // 注入 路由实例 和 routerLeave routerReenter生命周期方法

    }
    /**
     * 卸载当前页面组件
     */
    unloadComponent() {
        if (this.current && this.current.cache) {
            //缓存组件，并从dom树移除
            this.cached[this.current.id] = this.currentInstance;
            this.currentInstance.$$_cache.cache();
            this.currentInstance.routerLeave && this.currentInstance.routerLeave();
        } else {
            this.currentInstance.beforeDestroyed();
            this.currentInstance.destroyed();
        }
    }
    /**
     * 加载组件
     */
    loadComponent(route) {
        const wraper = this.options.wraper || null;
        if (!wraper) {
            console.error(`找不到路由插槽`);
            return;
        }
        if (route.cache && this.cached[route.id]) {
            //从缓存恢复
            this.current = route;
            this.currentInstance = this.cached[route.id];
            this.currentInstance.$$_cache.recover();
            this.currentInstance.routerRecover && this.currentInstance.routerRecover();
        } else {
            //实例化新组件
            const component = route.component;
            const _opt = {
                el: wraper
            }
            if (!this._isSyncFunction(component)) {
                //异步组件
                component((_m) => {
                    const _component = _m.default;
                    this.currentInstance = new _component(_opt);
                    this.options.ready && this.options.ready(route);
                    this.current = route;
                }).catch((e) => {
                    if (/loading[\s\S]*failed/gi.test(e.message)) {
                        //加载失败
                        this.options.fail && this.options.fail(route);
                        this.currentInstance = null;
                    } else {
                        //脚本报错，不处理
                        this.options.ready && this.options.ready(route);
                        this.current = route;
                    }
                });
            } else {
                //同步组件
                try {
                    this.currentInstance = new component(_opt);
                    this.options.ready && this.options.ready(route);
                    this.current = route;
                } catch (e) {
                    this.options.fail && this.options.fail(route);
                    this.currentInstance = null;
                }
            }
        }
    }

    /**
     * 判断是否是同步组件
     * @param {*} fn 
     */
    _isSyncFunction(fn) {
        return !!fn.prototype && !!fn.prototype.mounted && !!fn.prototype.beforeMounted && !!fn.prototype.beforeDestroyed && !!fn.prototype.destroyed;
    }



    /**
     * 路由跳转
     * @param {*} to 
     */
    push(to) {
        // {
        //     name: 'xxx',
        //     params: {}
        // }
        // {
        //     path:`/xxx/:xxx`
        // }
        this.router && this.router.push(to);
    }
    /**
     * 路由跳转 replace模式
     * @param {*} to 
     */
    replace(to) {
        // {
        //     name: 'xxx',
        //     params: {}
        // }
        // {
        //     path:`/xxx/:xxx`
        // }
        this.router && this.router.replace(to);
    }
    /**
     * 路由跳转
     * @param {number} n 前进或后退n步 
     */
    go(n) {
        this.router && this.router.go(n);
    }
    destroy() {
        this.router && this.router.destroy();
    }

}