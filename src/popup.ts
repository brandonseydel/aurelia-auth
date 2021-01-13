import { inject } from 'aurelia';
import { parseQueryString } from './auth-utilities';
import { BaseConfig } from './base-config';

@inject(BaseConfig)
export class Popup {
  public popupWindow: Window;
  private url: string;
  private polling: NodeJS.Timeout;

  constructor(private readonly config: BaseConfig) {
  }

  public open(url: string, windowName: string, options: Record<string, unknown>, redirectUri: string): Popup {
    this.url = url;
    const optionsString = this.stringifyOptions(this.prepareOptions(options || {}));
    this.popupWindow = window.open(url, windowName, optionsString);
    if (this.popupWindow && this.popupWindow.focus) {
      this.popupWindow.focus();
    }

    return this;
  }

  public eventListener(redirectUri: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      this.popupWindow.addEventListener('loadstart', (event: Event & { url: string }) => {
        if (event.url.indexOf(redirectUri) !== 0) {
          return;
        }

        const parser = document.createElement('a');
        parser.href = event.url;

        if (parser.search || parser.hash) {
          const queryParams = parser.search.substring(1).replace(/\/$/, '');
          const hashParams = parser.hash.substring(1).replace(/\/$/, '');
          const hash = parseQueryString(hashParams);
          const qs = { ...parseQueryString(queryParams), ...hash };

          if (qs.error) {
            reject({
              error: qs.error
            });
          } else {
            resolve(qs);
          }

          this.popupWindow.close();
        }
      });

      this.popupWindow.addEventListener('exit', () => {
        reject({
          data: 'Provider Popup was closed'
        });
      });

      this.popupWindow.addEventListener('loaderror', () => {
        reject({
          data: 'Authorization Failed'
        });
      });
    });
  }

  public pollPopup(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      this.polling = setInterval(() => {
        try {
          const documentOrigin = document.location.host;
          const popupWindowOrigin = this.popupWindow.location.host;

          if (popupWindowOrigin === documentOrigin && (this.popupWindow.location.search || this.popupWindow.location.hash)) {
            const queryParams = this.popupWindow.location.search.substring(1).replace(/\/$/, '');
            const hashParams = this.popupWindow.location.hash.substring(1).replace(/[/$]/, '');
            const hash = parseQueryString(hashParams);
            const qs = { ...parseQueryString(queryParams), ...hash };
            if (qs.error) {
              reject({
                error: qs.error
              });
            } else {
              resolve(qs);
            }

            this.popupWindow.close();
            clearInterval(this.polling);
          }
        } catch (error) {
          // no-op
        }

        if (!this.popupWindow) {
          clearInterval(this.polling);
          reject({
            data: 'Provider Popup Blocked'
          });
        } else if (this.popupWindow.closed) {
          clearInterval(this.polling);
          reject({
            data: 'Problem poll popup'
          });
        }
      }, 35);
    });
  }

  prepareOptions(options: Record<string, unknown>): Record<string, unknown> {
    const width = options.width || 500;
    const height = options.height || 500;
    return {
      ...options,
      width,
      height,
      left: window.screenX + ((window.outerWidth - Number(width)) / 2),
      top: window.screenY + ((window.outerHeight - Number(height)) / 2.5)
    };
  }

  public stringifyOptions(options: Record<string, unknown>): string {
    return Object.keys(options).map(key => `${key}=${options[key]}`).join(',');
  }
}
