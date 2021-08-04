module.exports = function(object) {
	return invoke;

	function invoke(resolve) {
		resolve(object);
	}
};