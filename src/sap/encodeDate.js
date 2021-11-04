function encodeDate(date) {
	if (date.toISOString)
		return truncate(date.toISOString());
	return truncate(date);
}
function truncate(date) {
	return '\'' + date.substring(0,22) + '\'';
}

module.exports = encodeDate;