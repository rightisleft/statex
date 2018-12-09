import { Action } from './action';
import { StateSelector } from './state-selector';
import { Subscription } from 'rxjs';
/**
 * Bind data for give key and target using a selector function
 *
 * @param {any} target
 * @param {any} key
 * @param {any} selectorFunc
 */
export declare function bindData(target: any, key: string, selector: StateSelector): Subscription;
/**
 * Binds action to a function
 *
 * @example
 * class TodoStore {
 *
 *    @action
 *    addTodo(state: State, action: AddTodoAction): State {
 *       // return modified state
 *    }
 * }
 *
 * @export
 * @param {*} target
 * @param {string} propertyKey
 * @param {PropertyDescriptor} descriptor
 * @returns
 */
export declare function action(targetAction?: Action): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => any;
/**
 * Add @data meta
 *
 * @export
 * @param {*} target
 * @param {any} propertyKey
 * @param {any} selector
 * @param {any} bindImmediate
 */
export declare function data(selector: StateSelector, bindImmediate?: boolean): (target: any, propertyKey: string) => void;
/**
 * Subscribe to the state events and map it to properties
 *
 * @export
 */
export declare function subscribe(propsClass: any): void;
/**
 * Unsubscribe from the state changes
 *
 * @export
 */
export declare function unsubscribe(): void;
