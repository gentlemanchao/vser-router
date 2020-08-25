import RouterHash from './router.hash';
import RouterHistory from './router.history';

export default class Router {
    constructor(options) {
        const defaults = {
            mode: 'hash', //模式：hash|history
            routes: [], //路由配置
            pathChange: function (path) {},
            before: function (route, prev) {}, //路由即将进入
            ready: function (route) {}, //路由加载就绪
            fail: function (route) {}, //路由加载失败
            after: function (route, next) {}, //路由即将离开
            notFound: function (path) {
                console.error(`${path} 当前路由没找到`)
            }, //路由未找到
        }
        this.options = Object.assign(defaults, options);
        this.changeFunc = null;
        this.updateFunc = null;
        this.route = null; //当前路由
    }
    /**
     * 路由参数更新执行的方法
     * @param {*} func 
     */
    update(func) {
        this.updateFunc = func;
    }
    /**
     * 路由改变执行的方法
     * @param {*} func 
     */
    change(func) {
        this.changeFunc = func;
    }

    onUpdate(param) {
        this.updateFunc && typeof this.updateFunc === 'function' && this.updateFunc(param);
    }
    onChange(route, current) {
        this.changeFunc && typeof this.changeFunc === 'function' && this.changeFunc(route, current);
    }
    init() {
        const options = this.options;

        this.router = null;
        const _opts = {
            routes: options.routes || [], //路由配置
            pathChange: options.pathChange(),
            update: (param) => {
                this.onUpdate(param);
            }, //路由参数更新
            notfound: options.notFound, //路由未找到
            change: (route, current) => {
                options.after(current, route);
                options.before(route, current);
                this.route = route;
                this.onChange(route, current);
            }, //路由改变；参数：(最新路由，当前路由)

        }
        if (options.mode === 'hash') {
            this.router = new RouterHash(_opts);
        } else if (options.mode === 'history') {
            this.router = new RouterHistory(_opts);
        } else {
            console.error(`不支持的路由模式:${options.mode}`)
        }


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