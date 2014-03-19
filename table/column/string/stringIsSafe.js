function stringIsSafe(value) {
	var pattern = /[\u0028-\u005b\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF@\/,. +\-]/
	return pattern.test(value);
}

module.exports = stringIsSafe;