function resultToPromise(result) {
	var c = {
		then: function(success) {
			success(result);
		}
	};
	return c;
}

module.exports = resultToPromise;