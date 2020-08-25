/**
 * 嵌套路由组件，支持组件缓存，具有组件一致的生命周期。
 * 给组件实例增加了如下生命周期方法：
 * 1、 routerUpdate(param)  路由参数更新；
 * 2、 routerLeave(nextRoute, route) 路由离开；
 * 3、 routerRecover(route, prevRoute) 路由从缓存恢复；
 */
export default class RouterView {
    constructor(options) {
        this.$$_el = options.el || null; //当前组件插入的插槽dom的对象
        this.parent = options.parent || null; //父组件实例
        this.$$_siblings = options.$$_siblings || null; //兄弟子节点
        this.$parameters = options.parameters || {};
        this.$router = options.router || null;
        this._init();
    }
    /**
     * 初始化
     */
    _init() {
        const router = this.$router;
        this.cached = {}; //已缓存的路由组件实例map：key为路由id
        this.current = null; //当前路由
        this.currentInstance = null; //当前路由根组件实例
        router.update((param) => {
            this.onRouterUpdate(param)
        });
        router.change((route, current) => {
            this.onRouterChange(route, current);
        });
        this.$router.init();
    }
    created() {

    }
    beforeMounted() {

    }

    mounted() {

    }
    beforeUpdated() {

    }
    updated() {


    }
    onRouterUpdate(param) {
        this.current && this.currentInstance && this.currentInstance.routerUpdate && this.currentInstance.routerUpdate(param);
    }
    /**
     * 路由改变，加载新组件
     * @param {*} route 
     * @param {*} current 
     */
    onRouterChange(route, current) {
        this.current && this.currentInstance && this.unloadComponent(route, current);
        this.loadComponent(route, current);
    }

    /**
     * 加载组件
     * @param {*} route  当前路由
     * @param {*} prevRoute 上一个路由 
     */
    loadComponent(route, prevRoute) {
        const wraper = this.$$_el || null;
        if (!wraper) {
            console.error(`找不到路由插槽`);
            return;
        }
        if (route.cache && this.cached[route.id]) {
            //从缓存恢复
            this.current = route;
            this.currentInstance = this.cached[route.id];
            this.currentInstance.$$_cache.recover();
            this.currentInstance.routerRecover && this.currentInstance.routerRecover(route, prevRoute);
        } else {
            //实例化新组件
            const component = route.component;
            const _opt = {
                el: wraper,
                router: this.$router
            }
            if (!this._isSyncFunction(component)) {
                //异步组件
                component((_m) => {
                    const _component = _m.default;
                    this.currentInstance = new _component(_opt);
                    this.$router.options.ready && this.$router.options.ready(route);
                    this.current = route;
                }).catch((e) => {
                    if (/loading[\s\S]*failed/gi.test(e.message)) {
                        //加载失败
                        this.$router.options.fail && this.$router.options.fail(route);
                        this.currentInstance = null;
                    } else {
                        //脚本报错，不处理
                        this.$router.options.ready && this.$router.options.ready(route);
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
     * 卸载当前页面组件
     * @param {*} nextRoute  下一个即将渲染的路由
     * @param {*} current 当前离开的路由
     */
    unloadComponent(nextRoute, route) {
        if (this.current && this.current.cache) {
            //缓存组件，并从dom树移除
            this.cached[this.current.id] = this.currentInstance;
            this.currentInstance.$$_cache.cache();
            this.currentInstance.routerLeave && this.currentInstance.routerLeave(nextRoute, route);
        } else {
            this.currentInstance.beforeDestroyed();
            this.currentInstance.destroyed();
        }
    }

    /**
     * 判断是否是同步组件
     * @param {*} fn 
     */
    _isSyncFunction(fn) {
        return !!fn.prototype && !!fn.prototype.mounted && !!fn.prototype.beforeMounted && !!fn.prototype.beforeDestroyed && !!fn.prototype.destroyed;
    }


    beforeDestroyed() {
        this.parent = null;
        this.$router = null;
        this.$$_el = null;
        this.currentInstance && this.currentInstance.beforeDestroyed();
        //预销毁缓存的组件实例
        for (let key in this.cached) {
            const instance = this.cached[key];
            instance && instance.beforeDestroyed && instance.beforeDestroyed();
        }

    }
    destroyed() {
        this.currentInstance && this.currentInstance.destroyed();
        //销毁缓存的组件实例
        for (let key in this.cached) {
            const instance = this.cached[key];
            instance && instance.destroyed && instance.destroyed();
        }
    }


}