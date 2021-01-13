import { joinUrl } from './auth-utilities';
import { Storage } from './storage';
import { Popup } from './popup';
import { AuthenticationProvider, BaseConfig } from './base-config';
import { HttpClient, inject, json } from 'aurelia';
import deepExtend from './deep-extend';
import { status } from './auth-utilities';

const defaults: AuthenticationProvider = {
  url: null,
  name: null,
  type: '1.0',
  popupOptions: null,
  redirectUri: null,
  authorizationEndpoint: null
};

@inject(Storage, Popup, HttpClient, BaseConfig)
export class OAuth1 implements AuthenticationProvider {


  constructor(private readonly storage: Storage,
    private popup: Popup,
    private readonly http: HttpClient,
    private readonly config: BaseConfig) {
    this.storage = storage;
    this.config = config.current;
    this.popup = popup;
    this.http = http;
  }
  name: string;
  url: string;
  type: '1.0' = '1.0';
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
  popupOptions: { height: string | number; width: string | number; };

  public async open(options: AuthenticationProvider, userData: Record<string, unknown>): Promise<Response> {
    const current = deepExtend({}, defaults, options);
    const serverUrl = this.config.baseUrl ? joinUrl(this.config.baseUrl, current.url) : current.url;

    if (this.config.platform !== 'mobile') {
      this.popup = this.popup.open('', current.name, current.popupOptions, current.redirectUri);
    }
    const response = await this.http.fetch(serverUrl, {
      method: 'post'
    })
      .then(status);
    if (this.config.platform === 'mobile') {
      this.popup = this.popup.open(
        [
          current.authorizationEndpoint,
          this.buildQueryString(response)
        ].join('?'),
        current.name,
        current.popupOptions,
        current.redirectUri);
    } else {
      (this.popup.popupWindow.location as any) = [
        current.authorizationEndpoint,
        this.buildQueryString(response)
      ].join('?');
    }

    const result = await (this.config.platform === 'mobile' ?
      this.popup.eventListener(current.redirectUri) : this.popup.pollPopup());
    return this.exchangeForToken(result, userData, current);
  }

  async exchangeForToken(oauthData: Record<string, unknown>, userData: Record<string, unknown>, current: AuthenticationProvider): Promise<Response> {
    const data = deepExtend({}, userData, oauthData);
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

  public buildQueryString(obj: Response): string {
    return Object.keys(obj).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])).join('&');
  }
}
