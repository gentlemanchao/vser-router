vser-router

1、vser的路由插件，用于实现单页应用；

2、支持hash和history模式；

3、支持路由缓存；

4、支持路由嵌套，如：
   
      `<Page>
        <Header slot="header">
            <div style="color:#fff;" slot="left">我才是左侧按钮</div>
        </Header>
        <RouterView></RouterView>
        <Footer slot="footer"></Footer>
    </Page>`  
    

5、用法：

    import VserRouter from 'vser-router';
    import Vser from 'vser';

    Vser.use(VserRouter);
    const router = new VserRouter({
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
        routes: []
    });

    new xxx({
        el: document.getElementById('app'),
        router,
    });

    初始化成功后，任何组件都可以通过this.$router访问路由对象实例，调用路由方法；
    通过this.$router.route 获取当前页面路由信息和参数；

6、路径配置，如：

    [{
            path: '/home',   
            name: 'home',   
            cache: false,   
            meta: {         
                title: '测试'   
            },
            component: resolve => require(['./_components/main/index'], resolve), 
            children: [{
                    path: 'second/:id',
                    name: 'second',
                    component: resolve => require(['./_components/second/'], resolve)
                },
                {
                    path: ':id/third',
                    name: 'third',
                    component: resolve => require(['./_components/third/'], resolve)
                },

            ]
        },
    ];

    参数解释：

    path： 路由路径，支持动态参数。
           参数以冒号开头如： path: 'second/:id/xxx/:xxx/'

    name： 路由名

    cache: 是否缓存（boolean），若为true：路由离开时，组件会被缓存，再次进入时，会自动从缓存恢复。

    meta:  有关页面信息

    component: 路由组件，可同步引入，也可异步引入
               同步引入示例：  component: require('./_components/second/')
               异步引入示例：  component: resolve => require(['./_components/second/'], resolve)

    children: 子路由配置(array)


7、路由跳转

    通过调用路由实例的跳转方法来实现跳转,跳转方法如下：
    

     /**
     * 路由跳转，可通过name名称跳转，也可通过path跳转
     * @param {Object} option 
     * @param {String} option.name   路由名
     * @param {String} option.path   路由路径（优先级高于路由名）
     * @param {Object} option.params 路由参数（路径动态参数在此设置）
     */
    push(option)
  

    /**
     * 路由跳转 replace模式，可通过name名称跳转，也可通过path跳转
     * @param {Object} option 
     * @param {String} option.name   路由名
     * @param {String} option.path   路由路径（优先级高于路由名）
     * @param {Object} option.params 路由参数（路径动态参数在此设置）
     */
    replace(option)
    

    /**
     * 路由跳转
     * @param {number} n 前进或后退n步（后退请设置负数） 
     */
    go(n)

