class Utils {

	static mixin(source, target) {
		for (var prop in source) {
			if (source.hasOwnProperty(prop)) {
				target[prop] = source[prop];
			}
		}
		return target;
	}
}

export default Utils;