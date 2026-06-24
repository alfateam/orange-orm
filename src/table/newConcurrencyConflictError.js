function newConcurrencyConflictError() {
	const error = new Error('The row was changed by another user.');
	error.status = 409;
	return error;
}

module.exports = newConcurrencyConflictError;
