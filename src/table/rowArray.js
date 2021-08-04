var resultToPromise = require('./resultToPromise');
var orderBy = require('./rowArray/orderBy');
var negotiateNextTick = require('./rowArray/negotiateNextTick');

function newRowArray() {
	var c = [];

	Object.defineProperty(c, 'toDto', {
		enumerable: false,
		writable: true,
		value: toDtoNativePromise
	});

	Object.defineProperty(c, '__toDto', {
		enumerable: false,
		writable: true,
		value: toDto
	});

	async function toDtoNativePromise() {
		let result = [];
		for (let i = 0; i < c.length; i++) {
			result.push(await c[i].toDto.apply(c[i], arguments));
		}
		return result;
	}

	return c;
}

function toDto(optionalStrategy) {
	var args = arguments;
	var result = [];
	var length = this.length;
	var rows = this;
	var i = -1;

	return resultToPromise().then(toDtoAtIndex);

	function toDtoAtIndex() {
		i++;
		if (i === length) {
			return orderBy(optionalStrategy, result);
		}
		var row = rows[i];
		return getDto()
			.then(onDto)
			.then(toDtoAtIndex);

		function getDto() {
			return row.__toDto.apply(row,args);
		}

		function onDto(dto) {
			result.push(dto);
			return negotiateNextTick(i);
		}
	}
}

module.exports = newRowArray;
