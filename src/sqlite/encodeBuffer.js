//unused because using sql parameters instead
//Remove ?
function encodeBuffer(buffer) {
	return 'E\'\\\\x' + buffer.toString('hex') + '\'';
}

module.exports = encodeBuffer;