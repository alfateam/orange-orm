function encodeBinary(base64) {
	// return Buffer.from(base64, 'base64');


	// Decode base64 to a binary string
	const binaryString = atob(base64);

	// Create a new Uint8Array with the same length as the binary string
	const len = binaryString.length;
	const bytes = new Uint8Array(len);

	// Populate the Uint8Array with numeric character codes
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return bytes;
}

module.exports = encodeBinary;