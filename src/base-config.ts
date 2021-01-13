import { NavigationInstruction } from '@aurelia/router';
import deepExtend from './deep-extend';

export interface AuthenticationProvider {
  name: string;
  url: string;
  type: '1.0' | '2.0';
  authorizationEndpoint?: string;
  redirectUri?: string;
  requiredUrlParams?: string[];
  scope?: string[];
  code?: string;
  responseType?: string;
  optionalUrlParams?: string[];
  scopePrefix?: string;
  scopeDelimiter?: string;
  responseParams?: string;
  state?: string | (() => string);
  display?: string;
  clientId?: string;
  defaultUrlParams?: string[];
  nonce?: () => string | number;
  popupOptions: { height: number | string; width: string | number; };
  open?: (options: AuthenticationProvider, userData: Record<string, unknown>) => Promise<Response>;
}

export class BaseConfig {
  providers: Record<string, AuthenticationProvider>;
  httpInterceptor = true;
  loginOnSignup = true;
  baseUrl = '/';
  loginRedirect: NavigationInstruction = '#/';
  logoutRedirect: NavigationInstruction = '#/';
  signupRedirect: NavigationInstruction = '#/login';
  loginUrl = '/auth/login';
  signupUrl = '/auth/signup';
  profileUrl = '/auth/me';
  loginRoute: NavigationInstruction = '/login';
  signupRoute: NavigationInstruction = '/signup';
  tokenRoot: string;
  tokenName = 'token';
  idTokenName = 'id_token';
  tokenPrefix = 'aurelia';
  responseTokenProp = 'access_token';
  responseIdTokenProp = 'id_token';
  unlinkUrl = '/auth/unlink/';
  unlinkMethod = 'get';
  authHeader = 'Authorization';
  authToken = 'Bearer';
  withCredentials = true;
  platform = 'browser';
  storage: 'localStorage' | 'sessionStorage' = 'localStorage';



  public configure(incomingConfig: BaseConfig): void {
    deepExtend(this, incomingConfig)
  }

  get current(): BaseConfig {
    return this;
  }

  constructor() {
    this.providers = {
      identSrv: {
        name: 'identSrv',
        url: '/auth/identSrv',
        //authorizationEndpoint: 'http://localhost:22530/connect/authorize',
        redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
        scope: ['profile', 'openid'],
        responseType: 'code',
        scopePrefix: '',
        scopeDelimiter: ' ',
        requiredUrlParams: ['scope', 'nonce'],
        optionalUrlParams: ['display', 'state'],
        state: function () {
          const rand = Math.random().toString(36).substr(2);
          return encodeURIComponent(rand);
        },
        display: 'popup',
        type: '2.0',
        clientId: 'jsClient',
        nonce: function () {
          const val = ((Date.now() + Math.random()) * Math.random()).toString().replace('.', '');
          return encodeURIComponent(val);
        },
        popupOptions: { width: 452, height: 633 }
      },
      google: {
        name: 'google',
        url: '/auth/google',
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
        redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
        scope: ['profile', 'email'],
        scopePrefix: 'openid',
        scopeDelimiter: ' ',
        requiredUrlParams: ['scope'],
        optionalUrlParams: ['display', 'state'],
        display: 'popup',
        type: '2.0',
        state: function () {
          const rand = Math.random().toString(36).substr(2);
          return encodeURIComponent(rand);
        },
        popupOptions: {
          width: 452,
          height: 633
        }
      },
      facebook: {
        name: 'facebook',
        url: '/auth/facebook',
        authorizationEndpoint: 'https://www.facebook.com/v2.3/dialog/oauth',
        redirectUri: window.location.origin + '/' || window.location.protocol + '//' + window.location.host + '/',
        scope: ['email'],
        scopeDelimiter: ',',
        nonce: function () {
          return Math.random();
        },
        requiredUrlParams: ['nonce', 'display', 'scope'],
        display: 'popup',
        type: '2.0',
        popupOptions: {
          width: 580,
          height: 400
        }
      },
      linkedin: {
        name: 'linkedin',
        url: '/auth/linkedin',
        authorizationEndpoint: 'https://www.linkedin.com/uas/oauth2/authorization',
        redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
        requiredUrlParams: ['state'],
        scope: ['r_emailaddress'],
        scopeDelimiter: ' ',
        state: 'STATE',
        type: '2.0',
        popupOptions: {
          width: 527,
          height: 582
        }
      },
      github: {
        name: 'github',
        url: '/auth/github',
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
        redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
        optionalUrlParams: ['scope'],
        scope: ['user:email'],
        scopeDelimiter: ' ',
        type: '2.0',
        popupOptions: {
          width: 1020,
          height: 618
        }
      },
      yahoo: {
        name: 'yahoo',
        url: '/auth/yahoo',
        authorizationEndpoint: 'https://api.login.yahoo.com/oauth2/request_auth',
        redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
        scope: [],
        scopeDelimiter: ',',
        type: '2.0',
        popupOptions: {
          width: 559,
          height: 519
        }
      },
      twitter: {
        name: 'twitter',
        url: '/auth/twitter',
        authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
        type: '1.0',
        popupOptions: {
          width: 495,
          height: 645
        }
      },
      live: {
        name: 'live',
        url: '/auth/live',
        authorizationEndpoint: 'https://login.live.com/oauth20_authorize.srf',
        redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
        scope: ['wl.emails'],
        scopeDelimiter: ' ',
        requiredUrlParams: ['display', 'scope'],
        display: 'popup',
        type: '2.0',
        popupOptions: {
          width: 500,
          height: 560
        }
      },
      instagram: {
        name: 'instagram',
        url: '/auth/instagram',
        authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
        redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
        requiredUrlParams: ['scope'],
        scope: ['basic'],
        scopeDelimiter: '+',
        display: 'popup',
        type: '2.0',
        popupOptions: {
          width: 550,
          height: 369
        }
      }
    };
  }
}
