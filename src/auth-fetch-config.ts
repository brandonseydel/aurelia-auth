import { HttpClient } from 'aurelia';
import { Authentication } from './authentication';

export class FetchConfig {
  constructor(private readonly httpClient: HttpClient, private readonly authService: Authentication) {
  }

  public configure(): void {
    this.httpClient.configure(httpConfig => {
      httpConfig
        .withInterceptor(this.authService.tokenInterceptor);
      return httpConfig;
    });
  }
}
