function encodeFilterArg (column, arg) {
	if (column.encode.safe)
		return column.encode.safe(column, arg);
	else
		return column.encode(column, arg);
}

module.exports = encodeFilterArg;