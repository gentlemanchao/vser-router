import Router from './src/router.class';
import RouterView from './src/router.view';

function install(_Vser) {
    if (install.installed) return;
    install.installed = true;
    _Vser.component('RouterView', RouterView);
}
Router.install = install;
export default Router;