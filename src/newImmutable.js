function newImmutable(fn) {
	var result;
	var _run = runFirst;
	return run;

	function run() {
		var args = [].slice.call(arguments);
		return _run(args);
	}

	function runFirst(args) {
		result =  fn.apply(null, args);
		_run = runNIgnoreArgs;
		return result;
	}

	function runNIgnoreArgs() {
		return result;
	}
}

module.exports = newImmutable;