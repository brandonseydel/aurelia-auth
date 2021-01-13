
import { Authentication } from './authentication';
import { BaseConfig, AuthenticationProvider } from './base-config';
import { OAuth1 } from './oAuth1';
import { OAuth2 } from './oAuth2';
import { status, joinUrl } from './auth-utilities';
import { EventAggregator, HttpClient, json, ViewportInstruction, Interceptor, IRouter, inject } from 'aurelia';

@inject(HttpClient, IRouter, Authentication, OAuth1, OAuth2, BaseConfig, EventAggregator)
export class AuthService {
  tokenInterceptor: Interceptor;
  constructor(private readonly http: HttpClient,
    @IRouter private readonly router: IRouter,
    private readonly auth: Authentication, private readonly oAuth1: OAuth1,
    private readonly oAuth2: OAuth2, private readonly config: BaseConfig, private readonly eventAggregator: EventAggregator) {
    this.http = http;
    this.auth = auth;
    this.oAuth1 = oAuth1;
    this.oAuth2 = oAuth2;
    this.config = config.current;
    this.tokenInterceptor = auth.tokenInterceptor;
    this.eventAggregator = eventAggregator;
  }

  async getMe<T>(): Promise<T> {
    const profileUrl = this.auth.profileUrl;
    const response = await this.http.fetch(profileUrl)
      .then(status);
    return await response.json() as T;
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated;
  }

  getTokenPayload(): Record<string, unknown> {
    return this.auth.payload;
  }

  setToken(token: string): void {
    this.auth.setToken(Object.defineProperty({}, this.config.tokenName, { value: token }));
  }

  public async signup(...args: [content: { displayName: string; email: string; password: string; }] | [displayName: string, email: string, password: string]): Promise<Response> {
    const signupUrl = this.auth.signupUrl;

    let content: { displayName: string; email: string; password: string; };
    if (typeof args[0] === 'object') {
      content = args[0];
    }
    else {
      content = {
        displayName: args[0],
        email: args[1],
        password: args[2]
      }
    }

    const response = await this.http.fetch(signupUrl, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: json(content)
    });

    if (this.config.loginOnSignup) {
      this.auth.setToken(response);
    } else if (this.config.signupRedirect) {
      await this.router.goto(this.config.signupRedirect, { replace: true });
    }
    this.eventAggregator.publish('auth:signup', response);
    return response;
  }

  async login(...args: [formData: string] | [email: string, password: string]): Promise<Response> {

    const loginUrl = this.auth.loginUrl;
    const response = await this.http.fetch(loginUrl, {
      method: 'post',
      headers: args.length === 1 ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
      body: args.length === 1 ? args[0] : json({
        email: args[0],
        password: args[1]
      })
    }).then(status);

    this.auth.setToken(response);
    this.eventAggregator.publish('auth:login', response);
    return response;
  }

  logout(redirectUri: ViewportInstruction): void {
    this.auth.logout(redirectUri)
    this.eventAggregator.publish('auth:logout');
  }

  async authenticate(name: string, redirect: ViewportInstruction, userData: Record<string, unknown>): Promise<Response> {
    let provider: AuthenticationProvider = this.oAuth2;
    if (this.config.providers[name].type === '1.0') {
      provider = this.oAuth1;
    }

    const response = await provider.open(this.config.providers[name], userData || {})
    this.auth.setToken(response, redirect);
    this.eventAggregator.publish('auth:authenticate', response);
    return response;
  }

  async unlink<T = unknown>(provider: AuthenticationProvider): Promise<T> {
    const unlinkUrl = this.config.baseUrl ?
      joinUrl(this.config.baseUrl, this.config.unlinkUrl) : this.config.unlinkUrl;

    if (this.config.unlinkMethod === 'get') {
      const response = await this.http.fetch(unlinkUrl + provider)
        .then(status);
      this.eventAggregator.publish('auth:unlink', response);
      return await response.json() as T;
    } else if (this.config.unlinkMethod === 'post') {
      const response = await this.http.fetch(unlinkUrl, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: json(provider)
      }).then(status);
      this.eventAggregator.publish('auth:unlink', response);
      return await response.json() as T;
    }
  }
}
