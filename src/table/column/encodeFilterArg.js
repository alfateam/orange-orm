function encodeFilterArg(context, column, arg) {
	if (arg && typeof arg._toFilterArg === 'function')
		return arg._toFilterArg(context);
	if (column.encode.safe)
		return column.encode.safe(context, arg);
	else
		return column.encode(context, arg);
}

module.exports = encodeFilterArg;
