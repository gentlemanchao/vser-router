export default class RouterHash {
    constructor(options) {
        const defaults = {
            routes: [], //路由配置
            pathChange: function (route) {}, //hash改变
            update: function (param) {}, //路由参数更新
            notfound: function (hash) {}, //路由未找到
            change: function (route, current) {}, //路由改变；参数：(最新路由，当前路由)
        }
        this.options = Object.assign(defaults, options);
        this.init();
        this.event();
    }
    init() {
        this.current = null; //当前页面路由
        this.destroyQueue = []; //销毁时执行的队列
        this.compileRoutes(); //解析所有路由
        this.getRoute(); //获取当前页面路由
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
        const hash = this._getDistinationPath(to);
        if (hash) {
            location.hash = hash;
        }
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
        const hash = this._getDistinationPath(to);
        if (hash) {
            const url = location.href.replace(location.hash, '');
            location.replace(`${url}#${hash}`);
        }

    }

    /**
     * 路由跳转
     * @param {number} n 前进或后退n步 
     */
    go(n) {
        window.history.go(n)
    }

    /**
     * 获取目标路径
     */
    _getDistinationPath(to) {
        if (!to) {
            console.error('请传入跳转目标路径参数')
            return null;
        }

        if (to.path) {
            return to.path;
        } else if (to.name) {
            const route = this._getRouteByName(to.name);
            if (route) {
                //组装hash地址
                const param = to.params || {};
                let arr = [];
                const pathArr = route._path || [];
                for (let i = 0, len = pathArr.length; i < len; i++) {
                    const segment = pathArr[i].trim();
                    if (segment.indexOf(':') === 0) {
                        const key = segment.substring(1);
                        arr.push(param[key] || '');
                    } else {
                        arr.push(segment);
                    }
                }
                return arr.join('/');
            } else {
                console.error(`名为"${to.name}"的路由不存在`);
                return null;
            }
        }
    }



    /**
     * 解析所有路由
     */
    compileRoutes() {
        const routes = this.options.routes || [];
        //递归解析
        const compile = (list, parentPath, base) => {
            list.forEach((_route, index) => {
                const _index = index + 1;
                _route.id = (base || 0) * 10 + _index;
                _route._path = [].concat(parentPath || [], this.decodePath(_route.path));
                _route.children && compile(_route.children, _route._path, _index);
            });
        }
        compile(routes);
    }

    /**
     * 通过路由名获取指定路由
     * @param {*} name 
     */
    _getRouteByName(name) {
        const routes = this.options.routes;
        const find = function (routeName, list) {
            for (let i = 0, len = list.length; i < len; i++) {
                const item = list[i];
                if (item.name === routeName) {
                    return item;
                }
                if (item.children) {
                    const child = find(routeName, item.children || []);
                    if (child) {
                        return child;
                    }
                }

            }
            return null;
        }
        return find(name, routes);
    }
    /**
     * 获取当前hash值
     */
    getHash() {
        let hash = location.hash;
        const pos = hash.indexOf('#');
        if (pos < 0) {
            return '';
        } else {
            hash = hash.slice(pos + 1);
        }
        const pos1 = hash.indexOf('?');
        if (pos1 < 0) {
            return hash;
        } else {
            return hash.slice(0, pos1);
        }

    }
    /**
     * 解析路径
     */
    decodePath(hash) {
        const delimeter = '/';
        const arr = hash.split(delimeter);
        return arr;
    }
    /**
     * 递归寻找当前路由
     * @param {array} pathArr 当前页面路径数组
     */
    _findRoute(pathArr) {
        const routes = this.options.routes;
        // 匹配路由
        const matchRoute = function (target, current) {
            let param = {};
            for (let i = 0, len = current.length; i < len; i++) {
                const segment = current[i].trim(); //当前路由片段
                if (segment.indexOf(':') === 0) {
                    //参数
                    param[segment.substring(1)] = target[i];
                    continue;
                } else if (target[i] !== segment) {
                    return false;
                }
            }
            return {
                param,
                matched: true
            }
        }
        // 寻找路由
        const find = function (target, list) {
            const length = target.length;
            for (let i = 0, len = list.length; i < len; i++) {
                const item = list[i];
                if (item.children) {
                    const child = find(pathArr, item.children);
                    if (child) {
                        return child;
                    }
                }
                if (item._path.length === length) {
                    const result = matchRoute(target, item._path);
                    if (result && result.matched) {
                        return Object.assign({
                            param: result.param
                        }, item)
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
            }
            return null;
        }
        return find(pathArr, routes);
    }
    /**
     * 比较参数是否相同
     */
    _diffParam(param, oldParam) {
        for (let key in param) {
            if (param[key] !== oldParam[key]) {
                return false;
            }
        }
        return true;
    }
    /**
     * 获取当前页面路由
     */
    getRoute() {
        const hash = this.getHash();
        const pathArr = this.decodePath(hash);
        const result = this._findRoute(pathArr);
        this.current && this._onChange(result);
        if (result) {
            if (this.current && this.current.id === result.id) {
                //相同页面参数改变
                if (this._diffParam(result.param || {}, this.current.param || {})) {
                    //路径相同 参数也相同
                } else {
                    //路径相同 参数不同
                    this._onUpdate(result.param);
                }

            } else {
                //不同页面
                this.options.change && this.options.change(result, this.current);
            }
            this.current = result;
        } else {
            //路由没找到
            this.options.notfound && this.options.notfound(hash);
        }
    }
    /**
     * 路由参数更新
     * @param {*} param 
     */
    _onUpdate(param) {
        this.options.update && this.options.update(param);
    }
    /**
     * 路由改变
     * @param {*} route 
     */
    _onChange(route) {
        this.options.pathChange && this.options.pathChange(route);
    }


    event() {
        //路由改变
        const onHashChange = (e) => {
            this.getRoute();
        }

        if (window.addEventListener) {
            window.addEventListener('hashchange', onHashChange);
        } else {
            window.attachEvent('onHashchange', onHashChange);
        }
        this.destroyQueue.push(function () {
            if (window.removeEventListener) {
                window.removeEventListener('hashchange', onhashchange);
            } else {
                window.detachEvent('onHashchange', onhashchange);
            }
        })
    }
    destroy() {
        //执行销毁队列
        this.destroyQueue.forEach((func) => {
            func && func();
        });
    }

}