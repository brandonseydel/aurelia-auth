import { inject, Router, ViewportInstruction } from 'aurelia';
import { Authentication } from './authentication';
import { IHookDefinition, IRouter, Navigation } from '@aurelia/router'

@inject(Authentication, IRouter)
export class AuthorizeStep implements IHookDefinition {
  constructor(
    private readonly auth: Authentication,
    @IRouter private readonly router: IRouter
  ) {
  }

  public hook = async (viewportInstructions: ViewportInstruction[], navigationInstruction: Navigation): Promise<boolean | ViewportInstruction[]> => {
    const isLoggedIn = this.auth.isAuthenticated;
    const loginRoute = this.auth.loginRoute;
    if (this.options.include?.length || this.options.exclude?.length) {
      if (!isLoggedIn) {
        this.auth.setInitialUrl(window.location.href);
        this.router.load(loginRoute).catch((error: Error) => { throw error; });
        return [];
      }
    } else if (isLoggedIn && navigationInstruction.instruction == this.auth.loginRoute) {
      const loginRedirect = this.auth.loginRedirect;
      this.router.load(loginRedirect, { replace: true }).catch((error: Error) => { throw error; });
      return [];
    }
  }

  options: IHookDefinition['options'];

}
