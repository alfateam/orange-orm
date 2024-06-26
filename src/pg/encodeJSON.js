function encode(arg) {
	// if (Array.isArray(arg))
	// 	return new JsonBArrayParam(arg);
	// else
	return arg;
}

//todo
class JsonBArrayParam {
	constructor(actualArray) { this.actualArray = actualArray; }
	toPostgres() {
		return JSON.stringify(this.actualArray);
	}
}

module.exports = encode;