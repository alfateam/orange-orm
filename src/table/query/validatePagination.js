function validatePagination(value) {
	validateValue(value, 'limit');
	validateValue(value, 'offset');
	if (value?.limit !== undefined && value?.offset !== undefined
		&& !Number.isSafeInteger(value.limit + value.offset))
		throwInvalid('pagination range', `${value.offset} + ${value.limit}`);
}

function validateValue(value, name) {
	if (!value || value[name] === undefined)
		return;
	if (Number.isSafeInteger(value[name]) && value[name] >= 0)
		return;

	throwInvalid(name, String(value[name]));
}

function throwInvalid(name, value) {
	const error = new Error(`Invalid ${name}: ${value}`);
	error.status = 400;
	throw error;
}

validatePagination.limit = value => validateValue(value, 'limit');
validatePagination.offset = value => validateValue(value, 'offset');

module.exports = validatePagination;
