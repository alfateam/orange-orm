var resultToPromise = require('./resultToPromise');
var orderBy = require('./rowArray/orderBy');
var negotiateNextTick = require('./rowArray/negotiateNextTick');
let fuzzyPromise = require('./fuzzyPromise');

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

	function toDtoNativePromise() {
		if (c.length === 0)
			return fuzzyPromise([]);
		let first = c[0].toDto.apply(this[0], arguments);
		if (first.then)
			return Promise.resolve().then( () => toDto.apply(this, arguments));
		else
			return toDtoSync.apply(this, arguments);
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

function toDtoSync(optionalStrategy) {
	let rows = this;
	var args = Array.prototype.slice.call(arguments).slice(1);
	var result = [];
	for (let i = 0; i < rows.length; i++) {
		result[i] = rows[i].toDto.apply(rows[i], args);
	}
	return orderBy(optionalStrategy, result);
}

module.exports = newRowArray;
