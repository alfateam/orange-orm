function stringIsSafe(value) {
	var pattern = /[\u0028-\u005A\u0060-\u007A\uC2A0\uF900-\uFDCF\uFDF0-\uFFEF]+$/
	return pattern.test(value);
}

module.exports = stringIsSafe;