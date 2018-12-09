import { Action } from './action';
import { Observable } from 'rxjs';
/**
 * Observer for next value from observable (used by subscribe() function)
 *
 * @export
 * @interface ActionObserver
 */
export interface ActionObserver {
    (state: any, action: Action): Promise<any> | Observable<any> | any;
}
/**
 * Observer for an error from observable (used by subscribe() function)
 *
 * @export
 * @interface ErrorObserver
 */
export interface ErrorObserver {
    (error: any): void;
}
