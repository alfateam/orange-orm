function negotiateGuidFormat(candidate) {
	var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
	if(!pattern.test(candidate))
		throw new TypeError(candidate +  ' is not a valid UUID');
}

module.exports = negotiateGuidFormat;