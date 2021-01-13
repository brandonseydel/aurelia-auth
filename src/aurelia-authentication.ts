import { HookTypes, Router } from '@aurelia/router';
import { Storage } from './storage';
import { AuthService } from './auth-service';
import { AuthorizeStep } from './authorize-step';
import { FetchConfig } from './auth-fetch-config';
import { BaseConfig } from './base-config';
import { AuthFilterValueConverter } from './auth-filter';
import Aurelia, { IContainer, IRegistry, Registration, HttpClient, IRouter, RouterConfiguration, IResolver, IAurelia, IRouterActivateOptions } from 'aurelia';
import { Authentication } from './authentication';
import { Popup } from './popup';
import { OAuth1 } from './oAuth1';
import { OAuth2 } from './oAuth2';



class AureliaAuthenticationRegistry implements IRegistry {
  config: BaseConfig;
  options: AuthorizeStep['options'];
  routerOptions: IRouterActivateOptions;

  static configure(
    config: (config: AureliaAuthenticationRegistry) => void): AureliaAuthenticationRegistry {
    const instance = new AureliaAuthenticationRegistry();
    instance.config = new BaseConfig();
    config(instance);
    return instance;
  }

  register(container: IContainer): IContainer {
    const router = container.get(IRouter);
    if (!router) {
      throw 'Please register a router before invoking the authentication plugin';
    }
    this.config ??= new BaseConfig();
    container.register(
      HttpClient,
      Registration.instance(BaseConfig, this.config),
      AuthFilterValueConverter,
      Registration.singleton(FetchConfig, FetchConfig),
      Registration.singleton(AuthorizeStep, AuthorizeStep),
      Registration.singleton(Popup, Popup),
      Registration.singleton(AuthService, AuthService),
      Registration.singleton(OAuth1, OAuth1),
      Registration.singleton(Storage, Storage),
      Registration.singleton(Authentication, Authentication),
      Registration.singleton(OAuth2, OAuth2));

    const hookDef = container.get(AuthorizeStep);
    hookDef.options = this.options;

    return container.register(RouterConfiguration.customize({
      ...this.routerOptions,
      hooks: [hookDef]
    }));
  }
}
export { FetchConfig, AuthorizeStep, Popup, AuthService, OAuth1, OAuth2, Storage }
export default AureliaAuthenticationRegistry.configure;
