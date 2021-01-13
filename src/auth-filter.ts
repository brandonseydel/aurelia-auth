import { valueConverter, ValueConverterInstance } from "aurelia";
import { IViewportInstruction } from '@aurelia/router'





@valueConverter({ name: 'auth-filter' })
export class AuthFilterValueConverter implements ValueConverterInstance {
  public toView(routes: IViewportInstruction[], isAuthenticated: boolean): IViewportInstruction[] {
    return routes.filter(r => (r.parameters as Record<string, unknown>).auth === undefined || (r.parameters as Record<string, unknown>).auth === isAuthenticated);
  }
}
