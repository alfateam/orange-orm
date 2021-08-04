function encodeFilterArg(column, arg) {
	if (column.encode.safe)
		return column.encode.safe(arg);
	else
		return column.encode(arg);
}

module.exports = encodeFilterArg;