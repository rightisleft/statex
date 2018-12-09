import Immutable from './immutable'

import {ActionObserver} from './observers'
import {empty, from, Observable, Observer, throwError} from 'rxjs'
import {catchError, flatMap, map, share, skipWhile} from 'rxjs/operators'
import {ReplaceableState} from './replaceable-state'
import {State} from './state'
import {fromArray} from 'rxjs/internal/observable/fromArray'

/**
 * Defines an action which an be extended to implement custom actions for a statex application
 *
 * @example
 *
 * // Create your own action class
 * class PageSwitchAction extends Action {
 *   constructor(public pageId: string) { super() }
 * }
 *
 * // Subscribe to your action
 * new PageSwitchAction(undefined).subscribe((state: State, action: PageSwitchAction): Observable<State> => {
 *   return Observable.create((observer: Observer<State>) => {
 *     observer.next(updatedState)
 *       observer.complete()
 *   }).share()
 * }, this)
 *
 * // Dispatch your action
 * new PageSwitchAction('page1').dispatch()
 *
 * @export
 * @class Action
 */
export class Action {

    private static _lastAction: Action
    private static _showError: boolean
    private static identities: any[] = []
    private static subscriptions: any[] = []

    /**
     * The last action occurred
     *
     * @readonly
     * @static
     *
     * @memberOf Action
     */
    public static get lastAction() {
        return Action._lastAction
    }

    /**
     * Set show error flag, if set to true, this module must show errors on Action rejections
     */
    public static set showError(showError: boolean) {
        Action._showError = showError
    }

    /**
     * Returns identity of this class
     *
     * @readonly
     * @type {string}
     */
    get identity(): string {
        let id = Action.identities.indexOf(this.constructor)
        if (id < 0) {
            Action.identities.push(this.constructor)
            id = Action.identities.indexOf(this.constructor)
        }
        return `c${id}`
    }

    /**
     * Subscribe to this action. actionObserver will be called when 'dispatch()' is invoked
     *
     * @param {ActionObserver} actionObserver The function that process the action
     * @param {*} context Context binding
     * @returns {Action}
     */
    public subscribe(actionObserver: ActionObserver, context: any): Action {
        if (!Action.subscriptions[this.identity]) {
            Action.subscriptions[this.identity] = []
        }
        Action.subscriptions[this.identity].push(actionObserver.bind(context))
        return this
    }

    /**
     * Dispatch this action. Returns an observable which will be completed when all action subscribers
     * complete it's processing
     *
     * @returns {Observable<S>}
     */
    dispatch(): Promise<any> {
        console.log('dispatch')
        Action._lastAction = this
        let subscriptions: ActionObserver[] = Action.subscriptions[this.identity]
        console.log('subscriptions', subscriptions)

        if (subscriptions == undefined || subscriptions.length === 0) {
            console.log('none found')
            return new Promise(resolve => resolve())
        }

        let observable: Observable<any> = from(subscriptions)

        console.log('observable', observable)

        // convert 'Observable' returned by action subscribers to state
        observable = observable.pipe(
        flatMap((actionObserver: ActionObserver): Observable<any> => {
                console.log('flatMap', actionObserver)
                console.log('State.current', State.current)
                console.log('actionObserver', actionObserver)

                const result = actionObserver(State.current, this)
                if (!(result instanceof Observable || result instanceof Promise)) {
                    console.log('change', result)
                    return Observable.create((observer: Observer<any>) => {
                        observer.next(result)
                        observer.complete()
                    })
                }
                return result as Observable<any>
            }),
            map((state: any) => {
                // if reducer returns function call that function to resolve state
                console.log('map:state', state)

                if (typeof state === 'function') return state(State.current)
                return state
            }),
            map((state: any) => {
                // merge or replace state
                console.log('map:state2', state)
                if (state instanceof ReplaceableState) {
                    // replace the state with the new one if not 'undefined'
                    return Immutable.from((state as ReplaceableState).state)
                } else if (state != undefined) {
                    // merge the state with existing state
                    return State.current.merge(state, {deep: true})
                }
            }),
            // wait until all the subscripts have completed processing
            skipWhile((state: any, i: number) => {
                console.log('skipWhile', state)
                return i + 1 < subscriptions.length
            }),
            // push 'next' state to 'stateStream' if there has been a change to the state
            map((state: any) => {
                console.log('map:state3', state)
                if (state != undefined) {
                    State.next(state)
                }
                return state
            }),
            catchError(err => throwError(err) ),
            // make this sharable (to avoid multiple copies of this observable being created)
            share())

        console.log('Pipe Done')


        return new Promise((resolve, reject) => {
            // to trigger observable
            observable.subscribe(() => {
                // empty function
                console.log('emptyFunction::called')
            }, (error) => {
                // show error
                if (Action._showError) {
                    console.error(error)
                }
                reject(error)
            }, () => {
                console.log('resolve')
                resolve(State.current)
            })
        })
    }
}
