import { inject } from 'aurelia';
import { BaseConfig } from './base-config';

@inject(BaseConfig)
export class Storage {
  storage: globalThis.Storage;
  constructor(private readonly config: BaseConfig) {
    this.config = config.current;
    this.storage = this._getStorage(this.config.storage);
  }

  get(key: string) { return this.storage.getItem(key); }
  set(key: string, value: string) { return this.storage.setItem(key, value); }
  remove(key: string) { return this.storage.removeItem(key); }
  _getStorage(type: 'localStorage' | 'sessionStorage'): globalThis.Storage {
    if (type === 'localStorage') {
      if ('localStorage' in window && window.localStorage !== null) return localStorage;
      throw new Error('Local Storage is disabled or unavailable.');
    } else if (type === 'sessionStorage') {
      if ('sessionStorage' in window && window.sessionStorage !== null) return sessionStorage;
      throw new Error('Session Storage is disabled or unavailable.');
    }

    throw new Error('Invalid storage type specified: ' + type);
  }
}
