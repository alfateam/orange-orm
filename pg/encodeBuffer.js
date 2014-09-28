function encodeBuffer(buffer) {
	return "E'\\\\x" + buffer.toString('hex') + "'";
}

module.exports = encodeBuffer;