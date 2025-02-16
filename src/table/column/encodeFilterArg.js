function encodeFilterArg(context, column, arg) {
	if (column.encode.safe)
		return column.encode.safe(context, arg);
	else
		return column.encode(context, arg);
}

module.exports = encodeFilterArg;