import { SecuredRoute } from './secured-route/secured-route';
import { Login } from './login/login';
import { App } from './app';
import Aurelia, { RouterConfiguration, Registration } from 'aurelia';
import AureliaAuthentication from '../src/aurelia-authentication';


const t = new Aurelia();
t.container;

Aurelia
  .register(
    Login,
    SecuredRoute,
    AureliaAuthentication(x => {
      x.options = {
        exclude: ['login']
      };

      x.config.loginRoute = 'login';

    })
  )
  .app(App)
  .start();
