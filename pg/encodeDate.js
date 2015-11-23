function encodeDate (date) {
	if (date.toISOString)
		return  "'" + date.toISOString() + "'";
	return "'" + date + "'";
}

module.exports = encodeDate;