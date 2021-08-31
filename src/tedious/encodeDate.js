function encodeDate(date) {
	if (date.toISOString)
		return truncate(date.toISOString());
	return truncate(date);
}
function truncate(date) {
	return '\'' + date.substring(0,23) + '\'';
}

module.exports = encodeDate;