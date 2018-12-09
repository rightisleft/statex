"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var immutable_1 = require("./immutable");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
/**
 * Defines a stream for changing state in a statex application
 *
 * @example
 *
 * // replace state
 * State.next(state)
 *
 * // subscribe to state stream
 * State.subscribe((state: State) => {
 *   // do your action here
 * })
 *
 * // or listen to a portion of the state
 * State
 *   .select((state: State) => state.application.pageContainer)
 *   .subscribe((state: State) => {
 *     // do your action here
 *   })
 *
 * @export
 * @class StateStream
 * @extends {BehaviorSubject}
 */
var State = /** @class */ (function () {
    function State() {
        var _this = this;
        this.currentState = immutable_1.default.from({});
        this.subject = new rxjs_1.BehaviorSubject(this.currentState);
        this.subject.subscribe(function (state) { return _this.currentState = state; });
    }
    Object.defineProperty(State, "current", {
        get: function () {
            return State.state.currentState;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Publish next state
     * @param state
     */
    State.next = function (state) {
        State.state.subject.next(state);
    };
    /**
     * Subscribe to the stream
     * @param onNext
     * @param onError
     * @param onComplete
     */
    State.subscribe = function (onNext, onError, onComplete) {
        return State.state.subject.subscribe(onNext, onError, onComplete);
    };
    /**
     * Fires 'next' only when the value returned by this function changed from the previous value.
     *
     * @template T
     * @param {StateSelector<T>} selector
     * @returns {Observable<T>}
     */
    State.select = function (selector) {
        var _this = this;
        return rxjs_1.Observable.create(function (subscriber) {
            var previousState;
            var subscription = _this.subscribe(function (state) {
                var selection = select(state, selector);
                if (selection !== select(previousState, selector)) {
                    previousState = state;
                    subscriber.next(selection);
                }
            }, undefined, undefined);
            return subscription;
        }).pipe(operators_1.share());
    };
    State.state = new State();
    return State;
}());
exports.State = State;
/**
 * Run selector function on the given state and return it's result. Return undefined if an error occurred
 *
 * @param {*} state
 * @param {StateSelector} selector
 * @returns The value return by the selector, undefined if an error occurred.
 */
function select(state, selector) {
    if (state == undefined)
        return;
    if (selector == undefined)
        return state;
    try {
        return selector(state);
    }
    catch (error) {
        return undefined;
    }
}
//# sourceMappingURL=state.js.map