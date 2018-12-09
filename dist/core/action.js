"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var immutable_1 = require("./immutable");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var replaceable_state_1 = require("./replaceable-state");
var state_1 = require("./state");
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
var Action = /** @class */ (function () {
    function Action() {
    }
    Object.defineProperty(Action, "lastAction", {
        /**
         * The last action occurred
         *
         * @readonly
         * @static
         *
         * @memberOf Action
         */
        get: function () {
            return Action._lastAction;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Action, "showError", {
        /**
         * Set show error flag, if set to true, this module must show errors on Action rejections
         */
        set: function (showError) {
            Action._showError = showError;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Action.prototype, "identity", {
        /**
         * Returns identity of this class
         *
         * @readonly
         * @type {string}
         */
        get: function () {
            var id = Action.identities.indexOf(this.constructor);
            if (id < 0) {
                Action.identities.push(this.constructor);
                id = Action.identities.indexOf(this.constructor);
            }
            return "c" + id;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Subscribe to this action. actionObserver will be called when 'dispatch()' is invoked
     *
     * @param {ActionObserver} actionObserver The function that process the action
     * @param {*} context Context binding
     * @returns {Action}
     */
    Action.prototype.subscribe = function (actionObserver, context) {
        if (!Action.subscriptions[this.identity]) {
            Action.subscriptions[this.identity] = [];
        }
        Action.subscriptions[this.identity].push(actionObserver.bind(context));
        return this;
    };
    /**
     * Dispatch this action. Returns an observable which will be completed when all action subscribers
     * complete it's processing
     *
     * @returns {Observable<S>}
     */
    Action.prototype.dispatch = function () {
        var _this = this;
        console.log('dispatch');
        Action._lastAction = this;
        var subscriptions = Action.subscriptions[this.identity];
        console.log('subscriptions', subscriptions);
        if (subscriptions == undefined || subscriptions.length === 0) {
            console.log('none found');
            return new Promise(function (resolve) { return resolve(); });
        }
        var observable = rxjs_1.from(subscriptions);
        console.log('observable', observable);
        // convert 'Observable' returned by action subscribers to state
        observable = observable.pipe(operators_1.flatMap(function (actionObserver) {
            console.log('flatMap', actionObserver);
            console.log('State.current', state_1.State.current);
            console.log('actionObserver', actionObserver);
            var result = actionObserver(state_1.State.current, _this);
            if (!(result instanceof rxjs_1.Observable || result instanceof Promise)) {
                console.log('change', result);
                return rxjs_1.Observable.create(function (observer) {
                    observer.next(result);
                    observer.complete();
                });
            }
            return result;
        }), operators_1.map(function (state) {
            // if reducer returns function call that function to resolve state
            console.log('map:state', state);
            if (typeof state === 'function')
                return state(state_1.State.current);
            return state;
        }), operators_1.map(function (state) {
            // merge or replace state
            console.log('map:state2', state);
            if (state instanceof replaceable_state_1.ReplaceableState) {
                // replace the state with the new one if not 'undefined'
                return immutable_1.default.from(state.state);
            }
            else if (state != undefined) {
                // merge the state with existing state
                return state_1.State.current.merge(state, { deep: true });
            }
        }), 
        // wait until all the subscripts have completed processing
        operators_1.skipWhile(function (state, i) {
            console.log('skipWhile', state);
            return i + 1 < subscriptions.length;
        }), 
        // push 'next' state to 'stateStream' if there has been a change to the state
        operators_1.map(function (state) {
            console.log('map:state3', state);
            if (state != undefined) {
                state_1.State.next(state);
            }
            return state;
        }), operators_1.catchError(function (err) { return rxjs_1.throwError(err); }), 
        // make this sharable (to avoid multiple copies of this observable being created)
        operators_1.share());
        console.log('Pipe Done');
        return new Promise(function (resolve, reject) {
            // to trigger observable
            observable.subscribe(function () {
                // empty function
                console.log('emptyFunction::called');
            }, function (error) {
                // show error
                if (Action._showError) {
                    console.error(error);
                }
                reject(error);
            }, function () {
                console.log('resolve');
                resolve(state_1.State.current);
            });
        });
    };
    Action.identities = [];
    Action.subscriptions = [];
    return Action;
}());
exports.Action = Action;
//# sourceMappingURL=action.js.map