export class EventDispatcher {

	constructor() {
		this._handlers = {};
	}

	listen(eventName, handler) {
		if (!this._handlers[eventName]) {
			this._handlers[eventName] = [];
		}
		this._handlers[eventName].push(handler);
	}

	unlisten(eventName, handler) {
		if (this._handlers[eventName]) {
			let index = this._handlers[eventName].indexOf(handler);
			if (index > -1) {
				this._handlers[eventName].splice(index, 1);
			}
		}
	}

	hasListener(eventName) {
		return this._handlers[eventName] && this._handlers[eventName].length > 0;
	}

	dispatch(eventName, eventArg) {
		if (this.hasListener(eventName)) {
			let listeners = this._handlers[eventName];
			for (let i=0; i<listeners.length; i++) {
				listeners[i](eventArg);
			}
		}
	}

}