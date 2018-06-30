class State {

	constructor () {
		this._state = {};
	}

	exists (key) {
		return (this._state[key] !== undefined);
	}

	get (key) {
		return this._state[key];
	}

	set (key, value) {
		this._state[key] = value;
	}
	
}

export default State;