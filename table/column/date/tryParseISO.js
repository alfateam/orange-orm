var pattern = /(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

function tryParseISO (iso) {
	if (pattern.test(iso))
		return iso;
}

module.exports = tryParseISO;