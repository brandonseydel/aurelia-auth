import { Login } from './login/login';
import Aurelia, { ICustomElementViewModel, IRouter } from "aurelia";
import { AuthorizeStep } from '../src/authorize-step';
export class App implements ICustomElementViewModel {
  constructor(@IRouter private readonly router: IRouter,
    private readonly authorize: AuthorizeStep) {
  }

  attached() {
    this.router.goto('login');
  }
}
