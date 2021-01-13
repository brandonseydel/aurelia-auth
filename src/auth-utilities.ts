export function camelCase(name: string): string {
  return name.replace(/([:\-_]+(.))/g, function (_: string, separator: string, letter: string, offset: number) {
    return offset ? letter.toUpperCase() : letter;
  });
}

export function status(response: Response): Promise<Response> {
  if (response.status >= 200 && response.status < 400) {
    return response.json().catch(function () {
      return null;
    });
  }

  throw response;
}

export function parseQueryString<T extends Record<string, string>>(keyValue: string): T {
  let key: string;
  let value: string[];
  const obj = {};

  (keyValue || '').split('&').forEach(kv => {
    if (kv) {
      value = kv.split('=');
      key = decodeURIComponent(value[0]);
      obj[key] = typeof value[1] !== 'undefined' ? decodeURIComponent(value[1]) : true;
    }
  })

  return obj as T;
}

export function joinUrl(baseUrl: string, url: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(url)) {
    return url;
  }

  [baseUrl, url].join('/')
    .replace(/[/]+/g, '/')
    .replace(/\/\?/g, '?')
    .replace(/\/#/g, '#')
    .replace(/:\//g, '://');
}


export function isBlankObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Object.getPrototypeOf(value);
}

export function isArrayLike(obj: unknown): boolean {
  if (obj === null || isWindow(obj as { window: unknown; })) {
    return false;
  }
}

export function isWindow(obj: { window: unknown; }): boolean {
  return obj && obj.window === obj;
}
