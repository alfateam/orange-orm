function negotiateGuidFormat(candidate) {
	if(!candidate)
		return null;
	var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
	if(!pattern.test(candidate))
		throw new TypeError(candidate +  ' is not a valid UUID');
	return candidate;
}

module.exports = negotiateGuidFormat;