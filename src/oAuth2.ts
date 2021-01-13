import { joinUrl, camelCase } from './auth-utilities';
import { Storage } from './storage';
import { Popup } from './popup';
import { BaseConfig, AuthenticationProvider } from './base-config';
import { Authentication } from './authentication';
import { HttpClient, inject, json } from 'aurelia';
import deepExtend from './deep-extend';
import { status } from './auth-utilities';

const defaults: AuthenticationProvider = {
  url: null,
  name: null,
  state: null,
  scope: null,
  type: '2.0',
  scopeDelimiter: null,
  redirectUri: null,
  popupOptions: null,
  authorizationEndpoint: null,
  responseParams: null,
  requiredUrlParams: null,
  optionalUrlParams: null,
  defaultUrlParams: ['response_type', 'client_id', 'redirect_uri'],
  responseType: 'code'
};


@inject(Storage, Popup, HttpClient, BaseConfig, Authentication)

export class OAuth2 implements AuthenticationProvider {
  type: '2.0' = '2.0'
  name: string;
  url: string;
  authorizationEndpoint?: string;
  redirectUri?: string;
  requiredUrlParams?: string[];
  scope?: string[];
  responseType?: string;
  optionalUrlParams?: string[];
  scopePrefix?: string;
  scopeDelimiter?: string;
  responseParams?: string;
  state?: string | (() => string);
  display?: string;
  clientId?: string;
  defaultUrlParams?: string[];
  nonce?: () => string;
  popupOptions: { height: string | number; width: string | number; };

  constructor(private readonly storage: Storage,
    private readonly popup: Popup,
    private readonly http: HttpClient,
    private readonly config: BaseConfig,
    private readonly auth: Authentication) {
  }
  code?: string;


  public open(options: AuthenticationProvider, userData: Record<string, unknown>): Promise<Response> {
    const current = deepExtend({}, defaults, options);

    //state handling
    const stateName = current.name + '_state';

    if (typeof current.state === 'function') {
      this.storage.set(stateName, current.state());
    } else if (typeof current.state === 'string') {
      this.storage.set(stateName, current.state);
    }

    //nonce handling
    const nonceName = current.name + '_nonce';

    if (typeof current.nonce === 'function') {
      this.storage.set(nonceName, current.nonce());
    } else if (typeof current.nonce === 'string') {
      this.storage.set(nonceName, current.nonce);
    }

    const url = current.authorizationEndpoint + '?' + this.buildQueryString(current);
    let openPopup;
    if (this.config.platform === 'mobile') {
      openPopup = this.popup.open(url, current.name, current.popupOptions, current.redirectUri).eventListener(current.redirectUri);
    } else {
      openPopup = this.popup.open(url, current.name, current.popupOptions, current.redirectUri).pollPopup();
    }

    return openPopup
      .then(oauthData => {
        if (oauthData.state && oauthData.state !== this.storage.get(stateName)) {
          return Promise.reject('OAuth 2.0 state parameter mismatch.');
        }

        if (current.responseType.toUpperCase().indexOf('TOKEN') !== -1) { //meaning implicit flow or hybrid flow
          if (!this.verifyIdToken(oauthData, current.name)) {
            return Promise.reject('OAuth 2.0 Nonce parameter mismatch.');
          }

          return oauthData;
        }

        return this.exchangeForToken(oauthData, userData, current); //responseType is authorization code only (no token nor id_token)
      });
  }

  public verifyIdToken(oauthData: AuthenticationProvider, providerName: string): boolean {
    const idToken = oauthData && oauthData[this.config.responseIdTokenProp];
    if (!idToken) return true;
    const idTokenObject = this.auth.decomposeToken(idToken);
    if (!idTokenObject) return true;
    const nonceFromToken = idTokenObject.nonce;
    if (!nonceFromToken) return true;
    const nonceInStorage = this.storage.get(providerName + '_nonce');
    if (nonceFromToken !== nonceInStorage) {
      return false;
    }
    return true;
  }

  public exchangeForToken(oauthData: Record<string, unknown>, userData: Record<string, unknown>, current: AuthenticationProvider): Promise<Response> {
    const data = deepExtend({}, userData, {
      code: oauthData.code,
      clientId: current.clientId,
      redirectUri: current.redirectUri
    });

    if (oauthData.state) {
      data.state = oauthData.state;
    }

    Object.keys(current.responseParams).forEach(param => data[param] = oauthData[param]);

    const exchangeForTokenUrl = this.config.baseUrl ? joinUrl(this.config.baseUrl, current.url) : current.url;
    const credentials = this.config.withCredentials ? 'include' : 'same-origin';

    return this.http.fetch(exchangeForTokenUrl, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: json(data),
      credentials: credentials
    }).then(status);
  }

  public buildQueryString(current: OAuth2): string {
    return ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'].flatMap(params => current[params]).map(paramName => {
      const camelizedName = camelCase(paramName);
      let paramValue = typeof current[paramName] === 'function' ? current[paramName]() : current[camelizedName];

      if (paramName === 'state') {
        const stateName = current.name + '_state';
        paramValue = encodeURIComponent(this.storage.get(stateName));
      }

      if (paramName === 'nonce') {
        const nonceName = current.name + '_nonce';
        paramValue = encodeURIComponent(this.storage.get(nonceName));
      }

      if (paramName === 'scope' && Array.isArray(paramValue)) {
        paramValue = paramValue.join(current.scopeDelimiter);

        if (current.scopePrefix) {
          paramValue = [current.scopePrefix, paramValue].join(current.scopeDelimiter);
        }
      }

      return [paramName, paramValue];


    }).map(pair => pair.join('=')).join('&');
  }
}
