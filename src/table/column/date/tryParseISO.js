var patternWithTime = /(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d)/;
var patternDateOnly = /^\d{4}-[01]\d-[0-3]\d$/;

function tryParseISO(iso) {
	if (patternWithTime.test(iso) || patternDateOnly.test(iso)) {
		return iso;
	} else {
		throw new TypeError(iso + ' is not a valid Date');
	}
}

module.exports = tryParseISO;