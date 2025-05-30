function decodeBinary(u8Arr) {
	let binaryString = '';
	for (let i = 0; i < u8Arr.length; i++) {
		binaryString += String.fromCharCode(u8Arr[i]);
	}
	return btoa(binaryString);
}

module.exports = decodeBinary;