import { REFLUX_ACTION_KEY, REFLUX_DATA_BINDINGS_KEY } from './constance'

import { Action } from './action'
import { Observable } from 'rxjs/Observable'
import { State } from './state'
import { StateSelector } from './../dist/state-selector.d'
import { Subscription } from 'rxjs/Subscription'

declare var Reflect: any

/**
 * Bind data for give key and target using a selector function
 *
 * @param {any} target
 * @param {any} key
 * @param {any} selectorFunc
 */
export function bindData(target: any, key: string, selector: StateSelector): Subscription {
  return State.select(selector)
    .subscribe(data => {
      if (typeof target[key] === 'function') return target[key].call(target, data)
      target[key] = data
    })
}

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
export function action(target: any, propertyKey: string, descriptor: PropertyDescriptor) {

  let metadata = Reflect.getMetadata('design:paramtypes', target, propertyKey)
  if (metadata.length < 2) throw new Error('@action() must be applied to a function with two arguments. ' +
    'eg: reducer(state: State, action: SubclassOfAction): State { }')

  let refluxActions = {}
  if (Reflect.hasMetadata(REFLUX_ACTION_KEY, target)) {
    refluxActions = Reflect.getMetadata(REFLUX_ACTION_KEY, target)
  }
  refluxActions[propertyKey] = metadata[1]
  Reflect.defineMetadata(REFLUX_ACTION_KEY, refluxActions, target)

  return {
    value: function (state: any, action: Action): Observable<any> {
      return descriptor.value.call(this, state, action)
    }
  }
}

/**
 * Add @data meta
 *
 * @export
 * @param {*} target
 * @param {any} propertyKey
 * @param {any} selector
 * @param {any} bindImmediate
 */
export function addDataMeta(target: any, propertyKey: string, selector: StateSelector, bindImmediate?: boolean) {

  let bindingsMeta = Reflect.getMetadata(REFLUX_DATA_BINDINGS_KEY, target.constructor)
  if (!Reflect.hasMetadata(REFLUX_DATA_BINDINGS_KEY, target.constructor)) {
    bindingsMeta = { selectors: {}, subscriptions: [], destroyed: !bindImmediate }
  }

  bindingsMeta.selectors[propertyKey] = selector
  if (bindImmediate) {
    bindingsMeta.subscriptions.push(bindData(target, propertyKey, selector))
  }
  Reflect.defineMetadata(REFLUX_DATA_BINDINGS_KEY, bindingsMeta, target.constructor)
}

/**
 * Subscribe to the state events and map it to properties
 *
 * @export
 */
export function subscribe() {
  let dataBindings = Reflect.getMetadata(REFLUX_DATA_BINDINGS_KEY, this)
  if (dataBindings != undefined && dataBindings.destroyed === true) {
    dataBindings.subscriptions = dataBindings.subscriptions.concat(
      Object.keys(dataBindings.selectors)
        .map(key => bindData(this, key, dataBindings.selectors[key]))
    )

    dataBindings.destroyed = false
    Reflect.defineMetadata(REFLUX_DATA_BINDINGS_KEY, dataBindings, this)
  }
}

/**
 * Unsubscribe from the state changes
 *
 * @export
 */
export function unsubscribe() {
  let dataBindings = Reflect.getMetadata(REFLUX_DATA_BINDINGS_KEY, this)
  if (dataBindings != undefined) {
    dataBindings.subscriptions.forEach(subscription => subscription.unsubscribe())
    dataBindings.subscriptions = []
    dataBindings.destroyed = true
    Reflect.defineMetadata(REFLUX_DATA_BINDINGS_KEY, dataBindings, this)
  }
}