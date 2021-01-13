import { IRouter, NavigationInstruction } from '@aurelia/router';
import { BaseConfig } from './base-config';
import { Storage } from './storage';
import { inject, Interceptor, ViewportInstruction } from 'aurelia';

@inject(IRouter, Storage, BaseConfig)
export class Authentication {
  tokenName: string;
  idTokenName: string;
  initialUrl: string;
  constructor(
    @IRouter private readonly router: IRouter,
    private readonly storage: Storage, private readonly config: BaseConfig) {
    this.tokenName = this.config.tokenPrefix ?
      this.config.tokenPrefix + '_' + this.config.tokenName : this.config.tokenName;
    this.idTokenName = this.config.tokenPrefix ?
      this.config.tokenPrefix + '_' + this.config.idTokenName : this.config.idTokenName;
  }

  public get loginRoute(): NavigationInstruction {
    return this.config.loginRoute;
  }

  public get loginRedirect(): NavigationInstruction {
    return this.initialUrl || this.config.loginRedirect;
  }

  public get loginUrl(): string {
    return this.config.loginUrl;
  }

  public get signupUrl(): string {
    return this.config.signupUrl;
  }

  get profileUrl(): string {
    return this.config.profileUrl;
  }

  get token(): string {
    return this.storage.get(this.tokenName);
  }

  get payload(): Record<string, unknown> {
    const token = this.storage.get(this.tokenName);
    return this.decomposeToken(token);
  }

  decomposeToken(token: string): Record<string, unknown> | null {
    if (token && token.split('.').length === 3) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      try {
        return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
      } catch (error) {
        return null;
      }
    }
  }

  public setInitialUrl(url: string): void {
    this.initialUrl = url;
  }

  public setToken(response: Response, redirect?: ViewportInstruction) {
    // access token handling
    const accessToken = response && response[this.config.responseTokenProp];
    let tokenToStore;

    if (accessToken) {
      if (typeof accessToken === 'object' && typeof accessToken.data === 'object') {
        response = accessToken;
      } else if (typeof accessToken === 'string') {
        tokenToStore = accessToken;
      }
    }

    if (!tokenToStore && response) {
      tokenToStore = this.config.tokenRoot && response[this.config.tokenRoot] ?
        response[this.config.tokenRoot][this.config.tokenName] : response[this.config.tokenName];
    }

    if (tokenToStore) {
      this.storage.set(this.tokenName, tokenToStore);
    }

    // id token handling
    const idToken = response && response[this.config.responseIdTokenProp];

    if (idToken) {
      this.storage.set(this.idTokenName, idToken);
    }

    if (this.config.loginRedirect && !redirect) {
      this.router.goto(this.loginRedirect, { replace: true });
    } else if (redirect && typeof redirect === 'string') {
      window.location.href = window.encodeURI(redirect);
    }
  }

  removeToken(): void {
    this.storage.remove(this.tokenName);
  }

  get isAuthenticated(): boolean {
    const token = this.storage.get(this.tokenName);

    // There's no token, so user is not authenticated.
    if (!token) {
      return false;
    }

    // There is a token, but in a different format. Return true.
    if (token.split('.').length !== 3) {
      return true;
    }

    let exp;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      exp = JSON.parse(window.atob(base64)).exp;
    } catch (error) {
      return false;
    }

    if (exp) {
      return Math.round(new Date().getTime() / 1000) <= exp;
    }

    return true;
  }

  public logout(redirect: ViewportInstruction): void {
    this.storage.remove(this.tokenName);
    if (this.config.logoutRedirect && !redirect) {
      this.router.goto(this.config.logoutRedirect, { replace: true });

    } else if (typeof redirect === 'string') {
      window.location.href = redirect;
    }
  }

  get tokenInterceptor(): Interceptor {
    return {
      request(request) {
        if (this.auth.isAuthenticated() && this.config.httpInterceptor) {
          const tokenName = this.config.tokenPrefix ? `${this.config.tokenPrefix}_${this.config.tokenName}` : this.config.tokenName;
          let token = this.storage.get(tokenName);

          if (this.config.authHeader && this.config.authToken) {
            token = `${this.config.authToken} ${token}`;
          }

          request.headers.set(this.config.authHeader, token);
        }
        return request;
      }
    };
  }
}
