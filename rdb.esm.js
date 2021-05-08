import util$2 from 'util';
import assert from 'assert';

var _nodeResolve_empty = {};

var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': _nodeResolve_empty
});

let flags = {
	useProxy: true
};

var flags_1 = flags;

function newDatabase(connectionString) {
	flags_1.url = connectionString;
	let c = {};
	return c;
}

var newDatabase_1 = newDatabase;

function extract$4(sql) {
	if (sql)
		return sql;
	return '';
}

var extractSql = extract$4;

function extract$3(parameters) {
	if (parameters) {
		return parameters.slice(0);
	}
	return [];
}

var extractParameters = extract$3;

var nextParameterized = function(text, params) {
	nextParameterized = newParameterized$1;
	return nextParameterized(text, params);
};

function Parameterized(text, parameters) {
	this._text = text;
	this.parameters = parameters;
}

Parameterized.prototype.sql = function() {
	return this._text;
};

Parameterized.prototype.prepend = function(other) {
	if (other.sql) {
		var params = other.parameters.concat(this.parameters);
		return nextParameterized(other.sql() + this._text, params);
	} else
		return nextParameterized(other + this._text, this.parameters);
};

Parameterized.prototype.append = function(other) {
	if (other.sql) {
		var params = this.parameters.concat(other.parameters);
		return nextParameterized(this._text + other.sql(), params);
	} else
		return nextParameterized(this._text + other, this.parameters);
};

var newParameterized$1 = function(text, parameters) {
	text = extractSql(text);
	parameters = extractParameters(parameters);
	return new Parameterized(text, parameters);
};

var newParameterized = function() {
	newParameterized = newParameterized$1;
	return newParameterized.apply(null, arguments);
};

var newBoolean$1 = function() {
	newBoolean$1 = newBoolean_1;
	return newBoolean$1.apply(null, arguments);
};

function negotiateRawSqlFilter(filter) {
	var params = [];
	if (filter) {
		if (filter.and)
			return filter;
		if (filter.sql) {
			var sql = filter.sql;
			if (typeof filter.sql === 'function') {
				sql = filter.sql();
			}
			params.push(sql, filter.parameters);
		}
		else
			params = [filter];
	} else {
		params = [filter];
	}

	var parameterized = newParameterized.apply(null, params);
	return newBoolean$1(parameterized);
}

var negotiateRawSqlFilter_1 = negotiateRawSqlFilter;

function negotiateNextAndFilter(filter, other) {
	if (!other.sql())
		return filter;
	return filter.append(' AND ').append(other);
}

var negotiateNextAndFilter_1 = negotiateNextAndFilter;

function negotiateNextOrFilter(filter, other) {
	if (!other.sql())
		return filter;
	return filter.prepend('(').append(' OR ').append(other).append(')');
}

var negotiateNextOrFilter_1 = negotiateNextOrFilter;

var nextNewBoolean = _nextNewBoolean;




function newBoolean(filter) {
	var c = {};
	c.sql = filter.sql.bind(filter);
	c.parameters = filter.parameters;

	c.append = function(other) {
		var nextFilter = filter.append(other);
		return nextNewBoolean(nextFilter);
	};

	c.prepend = function(other) {
		var nextFilter = filter.prepend(other);
		return nextNewBoolean(nextFilter);
	};

	c.and = function(other) {
		other = negotiateRawSqlFilter_1(other);
		var nextFilter = negotiateNextAndFilter_1(filter, other);
		var next = nextNewBoolean(nextFilter);
		for (var i = 1; i < arguments.length; i++) {
			next = next.and(arguments[i]);
		}
		return next;
	};

	c.or = function(other) {
		other = negotiateRawSqlFilter_1(other);
		var nextFilter = negotiateNextOrFilter_1(filter, other);
		var next = nextNewBoolean(nextFilter);
		for (var i = 1; i < arguments.length; i++) {
			next = next.or(arguments[i]);
		}
		return next;
	};

	c.not = function() {
		var nextFilter = filter.prepend('NOT (').append(')');
		return nextNewBoolean(nextFilter);
	};

	return c;
}

function _nextNewBoolean(filter) {
	nextNewBoolean = newBoolean_1;
	return nextNewBoolean(filter);
}

var newBoolean_1 = newBoolean;

function encodeFilterArg(column, arg) {
	if (column.encode.safe)
		return column.encode.safe(arg);
	else
		return column.encode(arg);
}

var encodeFilterArg_1 = encodeFilterArg;

var nullOperator$5 = ' is ';


function equal$1(column,arg,alias) {
	var operator = '=';
	var encoded = encodeFilterArg_1(column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator$5;
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var equal_1 = equal$1;

var nullOperator$4 = ' is not ';

function notEqual(column,arg,alias) {
	var operator = '<>';
	var encoded = encodeFilterArg_1(column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator$4;
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var notEqual_1 = notEqual;

function lessThanOrEqual$1(column,arg,alias) {
	var operator = '<';
	var encoded = encodeFilterArg_1(column, arg);
	var firstPart = alias + '.' + column._dbName + operator;
	var filter = encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var lessThan = lessThanOrEqual$1;

function lessThanOrEqual(column,arg,alias) {
	var operator = '<=';
	var encoded = encodeFilterArg_1(column, arg);
	var firstPart = alias + '.' + column._dbName + operator;
	var filter = encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var lessThanOrEqual_1 = lessThanOrEqual;

function greaterThan(column,arg,alias) {
	var operator = '>';
	var encoded = encodeFilterArg_1(column, arg);
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var greaterThan_1 = greaterThan;

function greaterThanOrEqual(column,arg,alias) {
	var operator = '>=';
	var encoded = encodeFilterArg_1(column, arg);
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var greaterThanOrEqual_1 = greaterThanOrEqual;

function _in(column,values,alias) {
	var filter;
	if (values.length === 0) {
		filter =  newParameterized$1('1=2');
		return newBoolean_1(filter);
	}
	var firstPart = alias + '.' + column._dbName + ' in ';
	var parameterized = newParameterized$1(firstPart);
	var separator = '(';

	for (var i = 0; i < values.length; i++) {
		var encoded = encodeFilterArg_1(column, values[i]);
		parameterized = parameterized.append(separator).append(encoded);
		separator = ',';
	}
	filter =  parameterized.append(')');
	return newBoolean_1(filter);
}

var _in_1 = _in;

function extract$2(table, optionalAlias) {
	if (optionalAlias)
		return optionalAlias;
	return table._dbName;
}

var extractAlias = extract$2;

var newColumn = function(table,name) {
	var c = {};
	var extractAlias$1 = extractAlias.bind(null,table);
	c._dbName = name;
	c.alias = name;
	c.dbNull = null;
	table._columns.push(c);
	table[name] = c;

	c.equal = function(arg,alias) {
		alias = extractAlias$1(alias);
		return equal_1(c,arg, alias);
	};

	c.notEqual = function(arg,alias) {
		alias = extractAlias$1(alias);
		return notEqual_1(c,arg,alias);
	};

	c.lessThan = function(arg,alias) {
		alias = extractAlias$1(alias);
		return lessThan(c,arg,alias);
	};

	c.lessThanOrEqual = function(arg,alias) {
		alias = extractAlias$1(alias);
		return lessThanOrEqual_1(c,arg,alias);
	};

	c.greaterThan = function(arg,alias) {
		alias = extractAlias$1(alias);
		return greaterThan_1(c,arg,alias);
	};

	c.greaterThanOrEqual = function(arg,alias) {
		alias = extractAlias$1(alias);
		return greaterThanOrEqual_1(c,arg,alias);
	};

	c.between = function(from,to,alias) {
		alias = extractAlias$1(alias);
		from = c.greaterThanOrEqual(from,alias);
		to = c.lessThanOrEqual(to,alias);
		return from.and(to);
	};

	c.in = function(arg,alias) {
		alias = extractAlias$1(alias);
		return _in_1(c,arg,alias);
	};

	c.eq = c.equal;
	c.EQ = c.eq;
	c.ne = c.notEqual;
	c.NE = c.ne;
	c.gt = c.greaterThan;
	c.GT = c.gt;
	c.ge = c.greaterThanOrEqual;
	c.GE = c.ge;
	c.lt = c.lessThan;
	c.LT = c.lt;
	c.le = c.lessThanOrEqual;
	c.LE = c.le;
	return c;
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

/** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */

var uri_all = createCommonjsModule(function (module, exports) {
(function (global, factory) {
	factory(exports) ;
}(commonjsGlobal, (function (exports) {
function merge() {
    for (var _len = arguments.length, sets = Array(_len), _key = 0; _key < _len; _key++) {
        sets[_key] = arguments[_key];
    }

    if (sets.length > 1) {
        sets[0] = sets[0].slice(0, -1);
        var xl = sets.length - 1;
        for (var x = 1; x < xl; ++x) {
            sets[x] = sets[x].slice(1, -1);
        }
        sets[xl] = sets[xl].slice(1);
        return sets.join('');
    } else {
        return sets[0];
    }
}
function subexp(str) {
    return "(?:" + str + ")";
}
function typeOf(o) {
    return o === undefined ? "undefined" : o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase();
}
function toUpperCase(str) {
    return str.toUpperCase();
}
function toArray(obj) {
    return obj !== undefined && obj !== null ? obj instanceof Array ? obj : typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj) : [];
}
function assign(target, source) {
    var obj = target;
    if (source) {
        for (var key in source) {
            obj[key] = source[key];
        }
    }
    return obj;
}

function buildExps(isIRI) {
    var ALPHA$$ = "[A-Za-z]",
        DIGIT$$ = "[0-9]",
        HEXDIG$$ = merge(DIGIT$$, "[A-Fa-f]"),
        PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),
        //expanded
    GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
        SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
        RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$),
        UCSCHAR$$ = isIRI ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]",
        //subset, excludes bidi control characters
    IPRIVATE$$ = isIRI ? "[\\uE000-\\uF8FF]" : "[]",
        //subset
    UNRESERVED$$ = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$);
        subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*");
        subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*");
        var DEC_OCTET_RELAXED$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("0?[1-9]" + DIGIT$$) + "|0?0?" + DIGIT$$),
        //relaxed parsing rules
    IPV4ADDRESS$ = subexp(DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$),
        H16$ = subexp(HEXDIG$$ + "{1,4}"),
        LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$),
        IPV6ADDRESS1$ = subexp(subexp(H16$ + "\\:") + "{6}" + LS32$),
        //                           6( h16 ":" ) ls32
    IPV6ADDRESS2$ = subexp("\\:\\:" + subexp(H16$ + "\\:") + "{5}" + LS32$),
        //                      "::" 5( h16 ":" ) ls32
    IPV6ADDRESS3$ = subexp(subexp(H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{4}" + LS32$),
        //[               h16 ] "::" 4( h16 ":" ) ls32
    IPV6ADDRESS4$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,1}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{3}" + LS32$),
        //[ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
    IPV6ADDRESS5$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,2}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{2}" + LS32$),
        //[ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
    IPV6ADDRESS6$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,3}" + H16$) + "?\\:\\:" + H16$ + "\\:" + LS32$),
        //[ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
    IPV6ADDRESS7$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,4}" + H16$) + "?\\:\\:" + LS32$),
        //[ *4( h16 ":" ) h16 ] "::"              ls32
    IPV6ADDRESS8$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,5}" + H16$) + "?\\:\\:" + H16$),
        //[ *5( h16 ":" ) h16 ] "::"              h16
    IPV6ADDRESS9$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,6}" + H16$) + "?\\:\\:"),
        //[ *6( h16 ":" ) h16 ] "::"
    IPV6ADDRESS$ = subexp([IPV6ADDRESS1$, IPV6ADDRESS2$, IPV6ADDRESS3$, IPV6ADDRESS4$, IPV6ADDRESS5$, IPV6ADDRESS6$, IPV6ADDRESS7$, IPV6ADDRESS8$, IPV6ADDRESS9$].join("|")),
        ZONEID$ = subexp(subexp(UNRESERVED$$ + "|" + PCT_ENCODED$) + "+");
        //RFC 6874, with relaxed parsing rules
    subexp("[vV]" + HEXDIG$$ + "+\\." + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+");
        //RFC 6874
    subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$)) + "*");
        var PCHAR$ = subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@]"));
        subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\@]")) + "+");
        subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*");
    return {
        NOT_SCHEME: new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
        NOT_USERINFO: new RegExp(merge("[^\\%\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_HOST: new RegExp(merge("[^\\%\\[\\]\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_PATH: new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_PATH_NOSCHEME: new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_QUERY: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
        NOT_FRAGMENT: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
        ESCAPE: new RegExp(merge("[^]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        UNRESERVED: new RegExp(UNRESERVED$$, "g"),
        OTHER_CHARS: new RegExp(merge("[^\\%]", UNRESERVED$$, RESERVED$$), "g"),
        PCT_ENCODED: new RegExp(PCT_ENCODED$, "g"),
        IPV4ADDRESS: new RegExp("^(" + IPV4ADDRESS$ + ")$"),
        IPV6ADDRESS: new RegExp("^\\[?(" + IPV6ADDRESS$ + ")" + subexp(subexp("\\%25|\\%(?!" + HEXDIG$$ + "{2})") + "(" + ZONEID$ + ")") + "?\\]?$") //RFC 6874, with relaxed parsing rules
    };
}
var URI_PROTOCOL = buildExps(false);

var IRI_PROTOCOL = buildExps(true);

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/** Highest positive signed 32-bit float value */

var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

/** Bootstring parameters */
var base = 36;
var tMin = 1;
var tMax = 26;
var skew = 38;
var damp = 700;
var initialBias = 72;
var initialN = 128; // 0x80
var delimiter = '-'; // '\x2D'

/** Regular expressions */
var regexPunycode = /^xn--/;
var regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

/** Error messages */
var errors = {
	'overflow': 'Overflow: input needs wider integers to process',
	'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
	'invalid-input': 'Invalid input'
};

/** Convenience shortcuts */
var baseMinusTMin = base - tMin;
var floor = Math.floor;
var stringFromCharCode = String.fromCharCode;

/*--------------------------------------------------------------------------*/

/**
 * A generic error utility function.
 * @private
 * @param {String} type The error type.
 * @returns {Error} Throws a `RangeError` with the applicable error message.
 */
function error$1(type) {
	throw new RangeError(errors[type]);
}

/**
 * A generic `Array#map` utility function.
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} callback The function that gets called for every array
 * item.
 * @returns {Array} A new array of values returned by the callback function.
 */
function map(array, fn) {
	var result = [];
	var length = array.length;
	while (length--) {
		result[length] = fn(array[length]);
	}
	return result;
}

/**
 * A simple `Array#map`-like wrapper to work with domain name strings or email
 * addresses.
 * @private
 * @param {String} domain The domain name or email address.
 * @param {Function} callback The function that gets called for every
 * character.
 * @returns {Array} A new string of characters returned by the callback
 * function.
 */
function mapDomain(string, fn) {
	var parts = string.split('@');
	var result = '';
	if (parts.length > 1) {
		// In email addresses, only the domain name should be punycoded. Leave
		// the local part (i.e. everything up to `@`) intact.
		result = parts[0] + '@';
		string = parts[1];
	}
	// Avoid `split(regex)` for IE8 compatibility. See #17.
	string = string.replace(regexSeparators, '\x2E');
	var labels = string.split('.');
	var encoded = map(labels, fn).join('.');
	return result + encoded;
}

/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 * @see `punycode.ucs2.encode`
 * @see <https://mathiasbynens.be/notes/javascript-encoding>
 * @memberOf punycode.ucs2
 * @name decode
 * @param {String} string The Unicode input string (UCS-2).
 * @returns {Array} The new array of code points.
 */
function ucs2decode(string) {
	var output = [];
	var counter = 0;
	var length = string.length;
	while (counter < length) {
		var value = string.charCodeAt(counter++);
		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
			// It's a high surrogate, and there is a next character.
			var extra = string.charCodeAt(counter++);
			if ((extra & 0xFC00) == 0xDC00) {
				// Low surrogate.
				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
			} else {
				// It's an unmatched surrogate; only append this code unit, in case the
				// next code unit is the high surrogate of a surrogate pair.
				output.push(value);
				counter--;
			}
		} else {
			output.push(value);
		}
	}
	return output;
}

/**
 * Creates a string based on an array of numeric code points.
 * @see `punycode.ucs2.decode`
 * @memberOf punycode.ucs2
 * @name encode
 * @param {Array} codePoints The array of numeric code points.
 * @returns {String} The new Unicode string (UCS-2).
 */
var ucs2encode = function ucs2encode(array) {
	return String.fromCodePoint.apply(String, toConsumableArray(array));
};

/**
 * Converts a basic code point into a digit/integer.
 * @see `digitToBasic()`
 * @private
 * @param {Number} codePoint The basic numeric code point value.
 * @returns {Number} The numeric value of a basic code point (for use in
 * representing integers) in the range `0` to `base - 1`, or `base` if
 * the code point does not represent a value.
 */
var basicToDigit = function basicToDigit(codePoint) {
	if (codePoint - 0x30 < 0x0A) {
		return codePoint - 0x16;
	}
	if (codePoint - 0x41 < 0x1A) {
		return codePoint - 0x41;
	}
	if (codePoint - 0x61 < 0x1A) {
		return codePoint - 0x61;
	}
	return base;
};

/**
 * Converts a digit/integer into a basic code point.
 * @see `basicToDigit()`
 * @private
 * @param {Number} digit The numeric value of a basic code point.
 * @returns {Number} The basic code point whose value (when used for
 * representing integers) is `digit`, which needs to be in the range
 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
 * used; else, the lowercase form is used. The behavior is undefined
 * if `flag` is non-zero and `digit` has no uppercase form.
 */
var digitToBasic = function digitToBasic(digit, flag) {
	//  0..25 map to ASCII a..z or A..Z
	// 26..35 map to ASCII 0..9
	return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
};

/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 * @private
 */
var adapt = function adapt(delta, numPoints, firstTime) {
	var k = 0;
	delta = firstTime ? floor(delta / damp) : delta >> 1;
	delta += floor(delta / numPoints);
	for (; /* no initialization */delta > baseMinusTMin * tMax >> 1; k += base) {
		delta = floor(delta / baseMinusTMin);
	}
	return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
};

/**
 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
 * symbols.
 * @memberOf punycode
 * @param {String} input The Punycode string of ASCII-only symbols.
 * @returns {String} The resulting string of Unicode symbols.
 */
var decode = function decode(input) {
	// Don't use UCS-2.
	var output = [];
	var inputLength = input.length;
	var i = 0;
	var n = initialN;
	var bias = initialBias;

	// Handle the basic code points: let `basic` be the number of input code
	// points before the last delimiter, or `0` if there is none, then copy
	// the first basic code points to the output.

	var basic = input.lastIndexOf(delimiter);
	if (basic < 0) {
		basic = 0;
	}

	for (var j = 0; j < basic; ++j) {
		// if it's not a basic code point
		if (input.charCodeAt(j) >= 0x80) {
			error$1('not-basic');
		}
		output.push(input.charCodeAt(j));
	}

	// Main decoding loop: start just after the last delimiter if any basic code
	// points were copied; start at the beginning otherwise.

	for (var index = basic > 0 ? basic + 1 : 0; index < inputLength;) /* no final expression */{

		// `index` is the index of the next character to be consumed.
		// Decode a generalized variable-length integer into `delta`,
		// which gets added to `i`. The overflow checking is easier
		// if we increase `i` as we go, then subtract off its starting
		// value at the end to obtain `delta`.
		var oldi = i;
		for (var w = 1, k = base;; /* no condition */k += base) {

			if (index >= inputLength) {
				error$1('invalid-input');
			}

			var digit = basicToDigit(input.charCodeAt(index++));

			if (digit >= base || digit > floor((maxInt - i) / w)) {
				error$1('overflow');
			}

			i += digit * w;
			var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

			if (digit < t) {
				break;
			}

			var baseMinusT = base - t;
			if (w > floor(maxInt / baseMinusT)) {
				error$1('overflow');
			}

			w *= baseMinusT;
		}

		var out = output.length + 1;
		bias = adapt(i - oldi, out, oldi == 0);

		// `i` was supposed to wrap around from `out` to `0`,
		// incrementing `n` each time, so we'll fix that now:
		if (floor(i / out) > maxInt - n) {
			error$1('overflow');
		}

		n += floor(i / out);
		i %= out;

		// Insert `n` at position `i` of the output.
		output.splice(i++, 0, n);
	}

	return String.fromCodePoint.apply(String, output);
};

/**
 * Converts a string of Unicode symbols (e.g. a domain name label) to a
 * Punycode string of ASCII-only symbols.
 * @memberOf punycode
 * @param {String} input The string of Unicode symbols.
 * @returns {String} The resulting Punycode string of ASCII-only symbols.
 */
var encode = function encode(input) {
	var output = [];

	// Convert the input in UCS-2 to an array of Unicode code points.
	input = ucs2decode(input);

	// Cache the length.
	var inputLength = input.length;

	// Initialize the state.
	var n = initialN;
	var delta = 0;
	var bias = initialBias;

	// Handle the basic code points.
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = input[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var _currentValue2 = _step.value;

			if (_currentValue2 < 0x80) {
				output.push(stringFromCharCode(_currentValue2));
			}
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	var basicLength = output.length;
	var handledCPCount = basicLength;

	// `handledCPCount` is the number of code points that have been handled;
	// `basicLength` is the number of basic code points.

	// Finish the basic string with a delimiter unless it's empty.
	if (basicLength) {
		output.push(delimiter);
	}

	// Main encoding loop:
	while (handledCPCount < inputLength) {

		// All non-basic code points < n have been handled already. Find the next
		// larger one:
		var m = maxInt;
		var _iteratorNormalCompletion2 = true;
		var _didIteratorError2 = false;
		var _iteratorError2 = undefined;

		try {
			for (var _iterator2 = input[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
				var currentValue = _step2.value;

				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow.
		} catch (err) {
			_didIteratorError2 = true;
			_iteratorError2 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion2 && _iterator2.return) {
					_iterator2.return();
				}
			} finally {
				if (_didIteratorError2) {
					throw _iteratorError2;
				}
			}
		}

		var handledCPCountPlusOne = handledCPCount + 1;
		if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
			error$1('overflow');
		}

		delta += (m - n) * handledCPCountPlusOne;
		n = m;

		var _iteratorNormalCompletion3 = true;
		var _didIteratorError3 = false;
		var _iteratorError3 = undefined;

		try {
			for (var _iterator3 = input[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
				var _currentValue = _step3.value;

				if (_currentValue < n && ++delta > maxInt) {
					error$1('overflow');
				}
				if (_currentValue == n) {
					// Represent delta as a generalized variable-length integer.
					var q = delta;
					for (var k = base;; /* no condition */k += base) {
						var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
						if (q < t) {
							break;
						}
						var qMinusT = q - t;
						var baseMinusT = base - t;
						output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}
		} catch (err) {
			_didIteratorError3 = true;
			_iteratorError3 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion3 && _iterator3.return) {
					_iterator3.return();
				}
			} finally {
				if (_didIteratorError3) {
					throw _iteratorError3;
				}
			}
		}

		++delta;
		++n;
	}
	return output.join('');
};

/**
 * Converts a Punycode string representing a domain name or an email address
 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
 * it doesn't matter if you call it on a string that has already been
 * converted to Unicode.
 * @memberOf punycode
 * @param {String} input The Punycoded domain name or email address to
 * convert to Unicode.
 * @returns {String} The Unicode representation of the given Punycode
 * string.
 */
var toUnicode = function toUnicode(input) {
	return mapDomain(input, function (string) {
		return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
	});
};

/**
 * Converts a Unicode string representing a domain name or an email address to
 * Punycode. Only the non-ASCII parts of the domain name will be converted,
 * i.e. it doesn't matter if you call it with a domain that's already in
 * ASCII.
 * @memberOf punycode
 * @param {String} input The domain name or email address to convert, as a
 * Unicode string.
 * @returns {String} The Punycode representation of the given domain name or
 * email address.
 */
var toASCII = function toASCII(input) {
	return mapDomain(input, function (string) {
		return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
	});
};

/*--------------------------------------------------------------------------*/

/** Define the public API */
var punycode = {
	/**
  * A string representing the current Punycode.js version number.
  * @memberOf punycode
  * @type String
  */
	'version': '2.1.0',
	/**
  * An object of methods to convert from JavaScript's internal character
  * representation (UCS-2) to Unicode code points, and back.
  * @see <https://mathiasbynens.be/notes/javascript-encoding>
  * @memberOf punycode
  * @type Object
  */
	'ucs2': {
		'decode': ucs2decode,
		'encode': ucs2encode
	},
	'decode': decode,
	'encode': encode,
	'toASCII': toASCII,
	'toUnicode': toUnicode
};

/**
 * URI.js
 *
 * @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/uri-js
 */
/**
 * Copyright 2011 Gary Court. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 *    1. Redistributions of source code must retain the above copyright notice, this list of
 *       conditions and the following disclaimer.
 *
 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
 *       of conditions and the following disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY GARY COURT ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Gary Court.
 */
var SCHEMES = {};
function pctEncChar(chr) {
    var c = chr.charCodeAt(0);
    var e = void 0;
    if (c < 16) e = "%0" + c.toString(16).toUpperCase();else if (c < 128) e = "%" + c.toString(16).toUpperCase();else if (c < 2048) e = "%" + (c >> 6 | 192).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();else e = "%" + (c >> 12 | 224).toString(16).toUpperCase() + "%" + (c >> 6 & 63 | 128).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
    return e;
}
function pctDecChars(str) {
    var newStr = "";
    var i = 0;
    var il = str.length;
    while (i < il) {
        var c = parseInt(str.substr(i + 1, 2), 16);
        if (c < 128) {
            newStr += String.fromCharCode(c);
            i += 3;
        } else if (c >= 194 && c < 224) {
            if (il - i >= 6) {
                var c2 = parseInt(str.substr(i + 4, 2), 16);
                newStr += String.fromCharCode((c & 31) << 6 | c2 & 63);
            } else {
                newStr += str.substr(i, 6);
            }
            i += 6;
        } else if (c >= 224) {
            if (il - i >= 9) {
                var _c = parseInt(str.substr(i + 4, 2), 16);
                var c3 = parseInt(str.substr(i + 7, 2), 16);
                newStr += String.fromCharCode((c & 15) << 12 | (_c & 63) << 6 | c3 & 63);
            } else {
                newStr += str.substr(i, 9);
            }
            i += 9;
        } else {
            newStr += str.substr(i, 3);
            i += 3;
        }
    }
    return newStr;
}
function _normalizeComponentEncoding(components, protocol) {
    function decodeUnreserved(str) {
        var decStr = pctDecChars(str);
        return !decStr.match(protocol.UNRESERVED) ? str : decStr;
    }
    if (components.scheme) components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_SCHEME, "");
    if (components.userinfo !== undefined) components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.host !== undefined) components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.path !== undefined) components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.query !== undefined) components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    if (components.fragment !== undefined) components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
    return components;
}

function _stripLeadingZeros(str) {
    return str.replace(/^0*(.*)/, "$1") || "0";
}
function _normalizeIPv4(host, protocol) {
    var matches = host.match(protocol.IPV4ADDRESS) || [];

    var _matches = slicedToArray(matches, 2),
        address = _matches[1];

    if (address) {
        return address.split(".").map(_stripLeadingZeros).join(".");
    } else {
        return host;
    }
}
function _normalizeIPv6(host, protocol) {
    var matches = host.match(protocol.IPV6ADDRESS) || [];

    var _matches2 = slicedToArray(matches, 3),
        address = _matches2[1],
        zone = _matches2[2];

    if (address) {
        var _address$toLowerCase$ = address.toLowerCase().split('::').reverse(),
            _address$toLowerCase$2 = slicedToArray(_address$toLowerCase$, 2),
            last = _address$toLowerCase$2[0],
            first = _address$toLowerCase$2[1];

        var firstFields = first ? first.split(":").map(_stripLeadingZeros) : [];
        var lastFields = last.split(":").map(_stripLeadingZeros);
        var isLastFieldIPv4Address = protocol.IPV4ADDRESS.test(lastFields[lastFields.length - 1]);
        var fieldCount = isLastFieldIPv4Address ? 7 : 8;
        var lastFieldsStart = lastFields.length - fieldCount;
        var fields = Array(fieldCount);
        for (var x = 0; x < fieldCount; ++x) {
            fields[x] = firstFields[x] || lastFields[lastFieldsStart + x] || '';
        }
        if (isLastFieldIPv4Address) {
            fields[fieldCount - 1] = _normalizeIPv4(fields[fieldCount - 1], protocol);
        }
        var allZeroFields = fields.reduce(function (acc, field, index) {
            if (!field || field === "0") {
                var lastLongest = acc[acc.length - 1];
                if (lastLongest && lastLongest.index + lastLongest.length === index) {
                    lastLongest.length++;
                } else {
                    acc.push({ index: index, length: 1 });
                }
            }
            return acc;
        }, []);
        var longestZeroFields = allZeroFields.sort(function (a, b) {
            return b.length - a.length;
        })[0];
        var newHost = void 0;
        if (longestZeroFields && longestZeroFields.length > 1) {
            var newFirst = fields.slice(0, longestZeroFields.index);
            var newLast = fields.slice(longestZeroFields.index + longestZeroFields.length);
            newHost = newFirst.join(":") + "::" + newLast.join(":");
        } else {
            newHost = fields.join(":");
        }
        if (zone) {
            newHost += "%" + zone;
        }
        return newHost;
    } else {
        return host;
    }
}
var URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
var NO_MATCH_IS_UNDEFINED = "".match(/(){0}/)[1] === undefined;
function parse(uriString) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var components = {};
    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
    if (options.reference === "suffix") uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
    var matches = uriString.match(URI_PARSE);
    if (matches) {
        if (NO_MATCH_IS_UNDEFINED) {
            //store each component
            components.scheme = matches[1];
            components.userinfo = matches[3];
            components.host = matches[4];
            components.port = parseInt(matches[5], 10);
            components.path = matches[6] || "";
            components.query = matches[7];
            components.fragment = matches[8];
            //fix port number
            if (isNaN(components.port)) {
                components.port = matches[5];
            }
        } else {
            //IE FIX for improper RegExp matching
            //store each component
            components.scheme = matches[1] || undefined;
            components.userinfo = uriString.indexOf("@") !== -1 ? matches[3] : undefined;
            components.host = uriString.indexOf("//") !== -1 ? matches[4] : undefined;
            components.port = parseInt(matches[5], 10);
            components.path = matches[6] || "";
            components.query = uriString.indexOf("?") !== -1 ? matches[7] : undefined;
            components.fragment = uriString.indexOf("#") !== -1 ? matches[8] : undefined;
            //fix port number
            if (isNaN(components.port)) {
                components.port = uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : undefined;
            }
        }
        if (components.host) {
            //normalize IP hosts
            components.host = _normalizeIPv6(_normalizeIPv4(components.host, protocol), protocol);
        }
        //determine reference type
        if (components.scheme === undefined && components.userinfo === undefined && components.host === undefined && components.port === undefined && !components.path && components.query === undefined) {
            components.reference = "same-document";
        } else if (components.scheme === undefined) {
            components.reference = "relative";
        } else if (components.fragment === undefined) {
            components.reference = "absolute";
        } else {
            components.reference = "uri";
        }
        //check for reference errors
        if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) {
            components.error = components.error || "URI is not a " + options.reference + " reference.";
        }
        //find scheme handler
        var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
        //check if scheme can't handle IRIs
        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
            //if host component is a domain name
            if (components.host && (options.domainHost || schemeHandler && schemeHandler.domainHost)) {
                //convert Unicode IDN -> ASCII IDN
                try {
                    components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
                } catch (e) {
                    components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
                }
            }
            //convert IRI -> URI
            _normalizeComponentEncoding(components, URI_PROTOCOL);
        } else {
            //normalize encodings
            _normalizeComponentEncoding(components, protocol);
        }
        //perform scheme specific parsing
        if (schemeHandler && schemeHandler.parse) {
            schemeHandler.parse(components, options);
        }
    } else {
        components.error = components.error || "URI can not be parsed.";
    }
    return components;
}

function _recomposeAuthority(components, options) {
    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
    var uriTokens = [];
    if (components.userinfo !== undefined) {
        uriTokens.push(components.userinfo);
        uriTokens.push("@");
    }
    if (components.host !== undefined) {
        //normalize IP hosts, add brackets and escape zone separator for IPv6
        uriTokens.push(_normalizeIPv6(_normalizeIPv4(String(components.host), protocol), protocol).replace(protocol.IPV6ADDRESS, function (_, $1, $2) {
            return "[" + $1 + ($2 ? "%25" + $2 : "") + "]";
        }));
    }
    if (typeof components.port === "number" || typeof components.port === "string") {
        uriTokens.push(":");
        uriTokens.push(String(components.port));
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
}

var RDS1 = /^\.\.?\//;
var RDS2 = /^\/\.(\/|$)/;
var RDS3 = /^\/\.\.(\/|$)/;
var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/;
function removeDotSegments(input) {
    var output = [];
    while (input.length) {
        if (input.match(RDS1)) {
            input = input.replace(RDS1, "");
        } else if (input.match(RDS2)) {
            input = input.replace(RDS2, "/");
        } else if (input.match(RDS3)) {
            input = input.replace(RDS3, "/");
            output.pop();
        } else if (input === "." || input === "..") {
            input = "";
        } else {
            var im = input.match(RDS5);
            if (im) {
                var s = im[0];
                input = input.slice(s.length);
                output.push(s);
            } else {
                throw new Error("Unexpected dot segment condition");
            }
        }
    }
    return output.join("");
}

function serialize(components) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var protocol = options.iri ? IRI_PROTOCOL : URI_PROTOCOL;
    var uriTokens = [];
    //find scheme handler
    var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
    //perform scheme specific serialization
    if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options);
    if (components.host) {
        //if host component is an IPv6 address
        if (protocol.IPV6ADDRESS.test(components.host)) ;
        //TODO: normalize IPv6 address as per RFC 5952

        //if host component is a domain name
        else if (options.domainHost || schemeHandler && schemeHandler.domainHost) {
                //convert IDN via punycode
                try {
                    components.host = !options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host);
                } catch (e) {
                    components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
                }
            }
    }
    //normalize encoding
    _normalizeComponentEncoding(components, protocol);
    if (options.reference !== "suffix" && components.scheme) {
        uriTokens.push(components.scheme);
        uriTokens.push(":");
    }
    var authority = _recomposeAuthority(components, options);
    if (authority !== undefined) {
        if (options.reference !== "suffix") {
            uriTokens.push("//");
        }
        uriTokens.push(authority);
        if (components.path && components.path.charAt(0) !== "/") {
            uriTokens.push("/");
        }
    }
    if (components.path !== undefined) {
        var s = components.path;
        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
            s = removeDotSegments(s);
        }
        if (authority === undefined) {
            s = s.replace(/^\/\//, "/%2F"); //don't allow the path to start with "//"
        }
        uriTokens.push(s);
    }
    if (components.query !== undefined) {
        uriTokens.push("?");
        uriTokens.push(components.query);
    }
    if (components.fragment !== undefined) {
        uriTokens.push("#");
        uriTokens.push(components.fragment);
    }
    return uriTokens.join(""); //merge tokens into a string
}

function resolveComponents(base, relative) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var skipNormalization = arguments[3];

    var target = {};
    if (!skipNormalization) {
        base = parse(serialize(base, options), options); //normalize base components
        relative = parse(serialize(relative, options), options); //normalize relative components
    }
    options = options || {};
    if (!options.tolerant && relative.scheme) {
        target.scheme = relative.scheme;
        //target.authority = relative.authority;
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
    } else {
        if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
            //target.authority = relative.authority;
            target.userinfo = relative.userinfo;
            target.host = relative.host;
            target.port = relative.port;
            target.path = removeDotSegments(relative.path || "");
            target.query = relative.query;
        } else {
            if (!relative.path) {
                target.path = base.path;
                if (relative.query !== undefined) {
                    target.query = relative.query;
                } else {
                    target.query = base.query;
                }
            } else {
                if (relative.path.charAt(0) === "/") {
                    target.path = removeDotSegments(relative.path);
                } else {
                    if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
                        target.path = "/" + relative.path;
                    } else if (!base.path) {
                        target.path = relative.path;
                    } else {
                        target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
                    }
                    target.path = removeDotSegments(target.path);
                }
                target.query = relative.query;
            }
            //target.authority = base.authority;
            target.userinfo = base.userinfo;
            target.host = base.host;
            target.port = base.port;
        }
        target.scheme = base.scheme;
    }
    target.fragment = relative.fragment;
    return target;
}

function resolve(baseURI, relativeURI, options) {
    var schemelessOptions = assign({ scheme: 'null' }, options);
    return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions);
}

function normalize(uri, options) {
    if (typeof uri === "string") {
        uri = serialize(parse(uri, options), options);
    } else if (typeOf(uri) === "object") {
        uri = parse(serialize(uri, options), options);
    }
    return uri;
}

function equal(uriA, uriB, options) {
    if (typeof uriA === "string") {
        uriA = serialize(parse(uriA, options), options);
    } else if (typeOf(uriA) === "object") {
        uriA = serialize(uriA, options);
    }
    if (typeof uriB === "string") {
        uriB = serialize(parse(uriB, options), options);
    } else if (typeOf(uriB) === "object") {
        uriB = serialize(uriB, options);
    }
    return uriA === uriB;
}

function escapeComponent(str, options) {
    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE, pctEncChar);
}

function unescapeComponent(str, options) {
    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED, pctDecChars);
}

var handler = {
    scheme: "http",
    domainHost: true,
    parse: function parse(components, options) {
        //report missing host
        if (!components.host) {
            components.error = components.error || "HTTP URIs must have a host.";
        }
        return components;
    },
    serialize: function serialize(components, options) {
        var secure = String(components.scheme).toLowerCase() === "https";
        //normalize the default port
        if (components.port === (secure ? 443 : 80) || components.port === "") {
            components.port = undefined;
        }
        //normalize the empty path
        if (!components.path) {
            components.path = "/";
        }
        //NOTE: We do not parse query strings for HTTP URIs
        //as WWW Form Url Encoded query strings are part of the HTML4+ spec,
        //and not the HTTP spec.
        return components;
    }
};

var handler$1 = {
    scheme: "https",
    domainHost: handler.domainHost,
    parse: handler.parse,
    serialize: handler.serialize
};

function isSecure(wsComponents) {
    return typeof wsComponents.secure === 'boolean' ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
}
//RFC 6455
var handler$2 = {
    scheme: "ws",
    domainHost: true,
    parse: function parse(components, options) {
        var wsComponents = components;
        //indicate if the secure flag is set
        wsComponents.secure = isSecure(wsComponents);
        //construct resouce name
        wsComponents.resourceName = (wsComponents.path || '/') + (wsComponents.query ? '?' + wsComponents.query : '');
        wsComponents.path = undefined;
        wsComponents.query = undefined;
        return wsComponents;
    },
    serialize: function serialize(wsComponents, options) {
        //normalize the default port
        if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
            wsComponents.port = undefined;
        }
        //ensure scheme matches secure flag
        if (typeof wsComponents.secure === 'boolean') {
            wsComponents.scheme = wsComponents.secure ? 'wss' : 'ws';
            wsComponents.secure = undefined;
        }
        //reconstruct path from resource name
        if (wsComponents.resourceName) {
            var _wsComponents$resourc = wsComponents.resourceName.split('?'),
                _wsComponents$resourc2 = slicedToArray(_wsComponents$resourc, 2),
                path = _wsComponents$resourc2[0],
                query = _wsComponents$resourc2[1];

            wsComponents.path = path && path !== '/' ? path : undefined;
            wsComponents.query = query;
            wsComponents.resourceName = undefined;
        }
        //forbid fragment component
        wsComponents.fragment = undefined;
        return wsComponents;
    }
};

var handler$3 = {
    scheme: "wss",
    domainHost: handler$2.domainHost,
    parse: handler$2.parse,
    serialize: handler$2.serialize
};

var O = {};
//RFC 3986
var UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + ("\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" ) + "]";
var HEXDIG$$ = "[0-9A-Fa-f]"; //case-insensitive
var PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)); //expanded
//RFC 5322, except these symbols as per RFC 6068: @ : / ? # [ ] & ; =
//const ATEXT$$ = "[A-Za-z0-9\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\|\\}\\~]";
//const WSP$$ = "[\\x20\\x09]";
//const OBS_QTEXT$$ = "[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]";  //(%d1-8 / %d11-12 / %d14-31 / %d127)
//const QTEXT$$ = merge("[\\x21\\x23-\\x5B\\x5D-\\x7E]", OBS_QTEXT$$);  //%d33 / %d35-91 / %d93-126 / obs-qtext
//const VCHAR$$ = "[\\x21-\\x7E]";
//const WSP$$ = "[\\x20\\x09]";
//const OBS_QP$ = subexp("\\\\" + merge("[\\x00\\x0D\\x0A]", OBS_QTEXT$$));  //%d0 / CR / LF / obs-qtext
//const FWS$ = subexp(subexp(WSP$$ + "*" + "\\x0D\\x0A") + "?" + WSP$$ + "+");
//const QUOTED_PAIR$ = subexp(subexp("\\\\" + subexp(VCHAR$$ + "|" + WSP$$)) + "|" + OBS_QP$);
//const QUOTED_STRING$ = subexp('\\"' + subexp(FWS$ + "?" + QCONTENT$) + "*" + FWS$ + "?" + '\\"');
var ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
var QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
var VCHAR$$ = merge(QTEXT$$, "[\\\"\\\\]");
var SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
var UNRESERVED = new RegExp(UNRESERVED$$, "g");
var PCT_ENCODED = new RegExp(PCT_ENCODED$, "g");
var NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", '[\\"]', VCHAR$$), "g");
var NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g");
var NOT_HFVALUE = NOT_HFNAME;
function decodeUnreserved(str) {
    var decStr = pctDecChars(str);
    return !decStr.match(UNRESERVED) ? str : decStr;
}
var handler$4 = {
    scheme: "mailto",
    parse: function parse$$1(components, options) {
        var mailtoComponents = components;
        var to = mailtoComponents.to = mailtoComponents.path ? mailtoComponents.path.split(",") : [];
        mailtoComponents.path = undefined;
        if (mailtoComponents.query) {
            var unknownHeaders = false;
            var headers = {};
            var hfields = mailtoComponents.query.split("&");
            for (var x = 0, xl = hfields.length; x < xl; ++x) {
                var hfield = hfields[x].split("=");
                switch (hfield[0]) {
                    case "to":
                        var toAddrs = hfield[1].split(",");
                        for (var _x = 0, _xl = toAddrs.length; _x < _xl; ++_x) {
                            to.push(toAddrs[_x]);
                        }
                        break;
                    case "subject":
                        mailtoComponents.subject = unescapeComponent(hfield[1], options);
                        break;
                    case "body":
                        mailtoComponents.body = unescapeComponent(hfield[1], options);
                        break;
                    default:
                        unknownHeaders = true;
                        headers[unescapeComponent(hfield[0], options)] = unescapeComponent(hfield[1], options);
                        break;
                }
            }
            if (unknownHeaders) mailtoComponents.headers = headers;
        }
        mailtoComponents.query = undefined;
        for (var _x2 = 0, _xl2 = to.length; _x2 < _xl2; ++_x2) {
            var addr = to[_x2].split("@");
            addr[0] = unescapeComponent(addr[0]);
            if (!options.unicodeSupport) {
                //convert Unicode IDN -> ASCII IDN
                try {
                    addr[1] = punycode.toASCII(unescapeComponent(addr[1], options).toLowerCase());
                } catch (e) {
                    mailtoComponents.error = mailtoComponents.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
                }
            } else {
                addr[1] = unescapeComponent(addr[1], options).toLowerCase();
            }
            to[_x2] = addr.join("@");
        }
        return mailtoComponents;
    },
    serialize: function serialize$$1(mailtoComponents, options) {
        var components = mailtoComponents;
        var to = toArray(mailtoComponents.to);
        if (to) {
            for (var x = 0, xl = to.length; x < xl; ++x) {
                var toAddr = String(to[x]);
                var atIdx = toAddr.lastIndexOf("@");
                var localPart = toAddr.slice(0, atIdx).replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, pctEncChar);
                var domain = toAddr.slice(atIdx + 1);
                //convert IDN via punycode
                try {
                    domain = !options.iri ? punycode.toASCII(unescapeComponent(domain, options).toLowerCase()) : punycode.toUnicode(domain);
                } catch (e) {
                    components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
                }
                to[x] = localPart + "@" + domain;
            }
            components.path = to.join(",");
        }
        var headers = mailtoComponents.headers = mailtoComponents.headers || {};
        if (mailtoComponents.subject) headers["subject"] = mailtoComponents.subject;
        if (mailtoComponents.body) headers["body"] = mailtoComponents.body;
        var fields = [];
        for (var name in headers) {
            if (headers[name] !== O[name]) {
                fields.push(name.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, pctEncChar) + "=" + headers[name].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, pctEncChar));
            }
        }
        if (fields.length) {
            components.query = fields.join("&");
        }
        return components;
    }
};

var URN_PARSE = /^([^\:]+)\:(.*)/;
//RFC 2141
var handler$5 = {
    scheme: "urn",
    parse: function parse$$1(components, options) {
        var matches = components.path && components.path.match(URN_PARSE);
        var urnComponents = components;
        if (matches) {
            var scheme = options.scheme || urnComponents.scheme || "urn";
            var nid = matches[1].toLowerCase();
            var nss = matches[2];
            var urnScheme = scheme + ":" + (options.nid || nid);
            var schemeHandler = SCHEMES[urnScheme];
            urnComponents.nid = nid;
            urnComponents.nss = nss;
            urnComponents.path = undefined;
            if (schemeHandler) {
                urnComponents = schemeHandler.parse(urnComponents, options);
            }
        } else {
            urnComponents.error = urnComponents.error || "URN can not be parsed.";
        }
        return urnComponents;
    },
    serialize: function serialize$$1(urnComponents, options) {
        var scheme = options.scheme || urnComponents.scheme || "urn";
        var nid = urnComponents.nid;
        var urnScheme = scheme + ":" + (options.nid || nid);
        var schemeHandler = SCHEMES[urnScheme];
        if (schemeHandler) {
            urnComponents = schemeHandler.serialize(urnComponents, options);
        }
        var uriComponents = urnComponents;
        var nss = urnComponents.nss;
        uriComponents.path = (nid || options.nid) + ":" + nss;
        return uriComponents;
    }
};

var UUID = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
//RFC 4122
var handler$6 = {
    scheme: "urn:uuid",
    parse: function parse(urnComponents, options) {
        var uuidComponents = urnComponents;
        uuidComponents.uuid = uuidComponents.nss;
        uuidComponents.nss = undefined;
        if (!options.tolerant && (!uuidComponents.uuid || !uuidComponents.uuid.match(UUID))) {
            uuidComponents.error = uuidComponents.error || "UUID is not valid.";
        }
        return uuidComponents;
    },
    serialize: function serialize(uuidComponents, options) {
        var urnComponents = uuidComponents;
        //normalize UUID
        urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
        return urnComponents;
    }
};

SCHEMES[handler.scheme] = handler;
SCHEMES[handler$1.scheme] = handler$1;
SCHEMES[handler$2.scheme] = handler$2;
SCHEMES[handler$3.scheme] = handler$3;
SCHEMES[handler$4.scheme] = handler$4;
SCHEMES[handler$5.scheme] = handler$5;
SCHEMES[handler$6.scheme] = handler$6;

exports.SCHEMES = SCHEMES;
exports.pctEncChar = pctEncChar;
exports.pctDecChars = pctDecChars;
exports.parse = parse;
exports.removeDotSegments = removeDotSegments;
exports.serialize = serialize;
exports.resolveComponents = resolveComponents;
exports.resolve = resolve;
exports.normalize = normalize;
exports.equal = equal;
exports.escapeComponent = escapeComponent;
exports.unescapeComponent = unescapeComponent;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=uri.all.js.map
});

// do not edit .js files directly - edit src/index.jst



var fastDeepEqual = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }



    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};

// https://mathiasbynens.be/notes/javascript-encoding
// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
var ucs2length$1 = function ucs2length(str) {
  var length = 0
    , len = str.length
    , pos = 0
    , value;
  while (pos < len) {
    length++;
    value = str.charCodeAt(pos++);
    if (value >= 0xD800 && value <= 0xDBFF && pos < len) {
      // high surrogate, and there is a next character
      value = str.charCodeAt(pos);
      if ((value & 0xFC00) == 0xDC00) pos++; // low surrogate
    }
  }
  return length;
};

var util$1 = {
  copy: copy,
  checkDataType: checkDataType,
  checkDataTypes: checkDataTypes,
  coerceToTypes: coerceToTypes,
  toHash: toHash$1,
  getProperty: getProperty,
  escapeQuotes: escapeQuotes,
  equal: fastDeepEqual,
  ucs2length: ucs2length$1,
  varOccurences: varOccurences,
  varReplace: varReplace,
  schemaHasRules: schemaHasRules,
  schemaHasRulesExcept: schemaHasRulesExcept,
  schemaUnknownRules: schemaUnknownRules,
  toQuotedString: toQuotedString,
  getPathExpr: getPathExpr,
  getPath: getPath,
  getData: getData,
  unescapeFragment: unescapeFragment,
  unescapeJsonPointer: unescapeJsonPointer,
  escapeFragment: escapeFragment,
  escapeJsonPointer: escapeJsonPointer
};


function copy(o, to) {
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}


function checkDataType(dataType, data, strictNumbers, negate) {
  var EQUAL = negate ? ' !== ' : ' === '
    , AND = negate ? ' || ' : ' && '
    , OK = negate ? '!' : ''
    , NOT = negate ? '' : '!';
  switch (dataType) {
    case 'null': return data + EQUAL + 'null';
    case 'array': return OK + 'Array.isArray(' + data + ')';
    case 'object': return '(' + OK + data + AND +
                          'typeof ' + data + EQUAL + '"object"' + AND +
                          NOT + 'Array.isArray(' + data + '))';
    case 'integer': return '(typeof ' + data + EQUAL + '"number"' + AND +
                           NOT + '(' + data + ' % 1)' +
                           AND + data + EQUAL + data +
                           (strictNumbers ? (AND + OK + 'isFinite(' + data + ')') : '') + ')';
    case 'number': return '(typeof ' + data + EQUAL + '"' + dataType + '"' +
                          (strictNumbers ? (AND + OK + 'isFinite(' + data + ')') : '') + ')';
    default: return 'typeof ' + data + EQUAL + '"' + dataType + '"';
  }
}


function checkDataTypes(dataTypes, data, strictNumbers) {
  switch (dataTypes.length) {
    case 1: return checkDataType(dataTypes[0], data, strictNumbers, true);
    default:
      var code = '';
      var types = toHash$1(dataTypes);
      if (types.array && types.object) {
        code = types.null ? '(': '(!' + data + ' || ';
        code += 'typeof ' + data + ' !== "object")';
        delete types.null;
        delete types.array;
        delete types.object;
      }
      if (types.number) delete types.integer;
      for (var t in types)
        code += (code ? ' && ' : '' ) + checkDataType(t, data, strictNumbers, true);

      return code;
  }
}


var COERCE_TO_TYPES = toHash$1([ 'string', 'number', 'integer', 'boolean', 'null' ]);
function coerceToTypes(optionCoerceTypes, dataTypes) {
  if (Array.isArray(dataTypes)) {
    var types = [];
    for (var i=0; i<dataTypes.length; i++) {
      var t = dataTypes[i];
      if (COERCE_TO_TYPES[t]) types[types.length] = t;
      else if (optionCoerceTypes === 'array' && t === 'array') types[types.length] = t;
    }
    if (types.length) return types;
  } else if (COERCE_TO_TYPES[dataTypes]) {
    return [dataTypes];
  } else if (optionCoerceTypes === 'array' && dataTypes === 'array') {
    return ['array'];
  }
}


function toHash$1(arr) {
  var hash = {};
  for (var i=0; i<arr.length; i++) hash[arr[i]] = true;
  return hash;
}


var IDENTIFIER$1 = /^[a-z$_][a-z$_0-9]*$/i;
var SINGLE_QUOTE = /'|\\/g;
function getProperty(key) {
  return typeof key == 'number'
          ? '[' + key + ']'
          : IDENTIFIER$1.test(key)
            ? '.' + key
            : "['" + escapeQuotes(key) + "']";
}


function escapeQuotes(str) {
  return str.replace(SINGLE_QUOTE, '\\$&')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\f/g, '\\f')
            .replace(/\t/g, '\\t');
}


function varOccurences(str, dataVar) {
  dataVar += '[^0-9]';
  var matches = str.match(new RegExp(dataVar, 'g'));
  return matches ? matches.length : 0;
}


function varReplace(str, dataVar, expr) {
  dataVar += '([^0-9])';
  expr = expr.replace(/\$/g, '$$$$');
  return str.replace(new RegExp(dataVar, 'g'), expr + '$1');
}


function schemaHasRules(schema, rules) {
  if (typeof schema == 'boolean') return !schema;
  for (var key in schema) if (rules[key]) return true;
}


function schemaHasRulesExcept(schema, rules, exceptKeyword) {
  if (typeof schema == 'boolean') return !schema && exceptKeyword != 'not';
  for (var key in schema) if (key != exceptKeyword && rules[key]) return true;
}


function schemaUnknownRules(schema, rules) {
  if (typeof schema == 'boolean') return;
  for (var key in schema) if (!rules[key]) return key;
}


function toQuotedString(str) {
  return '\'' + escapeQuotes(str) + '\'';
}


function getPathExpr(currentPath, expr, jsonPointers, isNumber) {
  var path = jsonPointers // false by default
              ? '\'/\' + ' + expr + (isNumber ? '' : '.replace(/~/g, \'~0\').replace(/\\//g, \'~1\')')
              : (isNumber ? '\'[\' + ' + expr + ' + \']\'' : '\'[\\\'\' + ' + expr + ' + \'\\\']\'');
  return joinPaths(currentPath, path);
}


function getPath(currentPath, prop, jsonPointers) {
  var path = jsonPointers // false by default
              ? toQuotedString('/' + escapeJsonPointer(prop))
              : toQuotedString(getProperty(prop));
  return joinPaths(currentPath, path);
}


var JSON_POINTER$1 = /^\/(?:[^~]|~0|~1)*$/;
var RELATIVE_JSON_POINTER$1 = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function getData($data, lvl, paths) {
  var up, jsonPointer, data, matches;
  if ($data === '') return 'rootData';
  if ($data[0] == '/') {
    if (!JSON_POINTER$1.test($data)) throw new Error('Invalid JSON-pointer: ' + $data);
    jsonPointer = $data;
    data = 'rootData';
  } else {
    matches = $data.match(RELATIVE_JSON_POINTER$1);
    if (!matches) throw new Error('Invalid JSON-pointer: ' + $data);
    up = +matches[1];
    jsonPointer = matches[2];
    if (jsonPointer == '#') {
      if (up >= lvl) throw new Error('Cannot access property/index ' + up + ' levels up, current level is ' + lvl);
      return paths[lvl - up];
    }

    if (up > lvl) throw new Error('Cannot access data ' + up + ' levels up, current level is ' + lvl);
    data = 'data' + ((lvl - up) || '');
    if (!jsonPointer) return data;
  }

  var expr = data;
  var segments = jsonPointer.split('/');
  for (var i=0; i<segments.length; i++) {
    var segment = segments[i];
    if (segment) {
      data += getProperty(unescapeJsonPointer(segment));
      expr += ' && ' + data;
    }
  }
  return expr;
}


function joinPaths (a, b) {
  if (a == '""') return b;
  return (a + ' + ' + b).replace(/([^\\])' \+ '/g, '$1');
}


function unescapeFragment(str) {
  return unescapeJsonPointer(decodeURIComponent(str));
}


function escapeFragment(str) {
  return encodeURIComponent(escapeJsonPointer(str));
}


function escapeJsonPointer(str) {
  return str.replace(/~/g, '~0').replace(/\//g, '~1');
}


function unescapeJsonPointer(str) {
  return str.replace(/~1/g, '/').replace(/~0/g, '~');
}

var schema_obj = SchemaObject;

function SchemaObject(obj) {
  util$1.copy(obj, this);
}

var jsonSchemaTraverse = createCommonjsModule(function (module) {

var traverse = module.exports = function (schema, opts, cb) {
  // Legacy support for v0.3.1 and earlier.
  if (typeof opts == 'function') {
    cb = opts;
    opts = {};
  }

  cb = opts.cb || cb;
  var pre = (typeof cb == 'function') ? cb : cb.pre || function() {};
  var post = cb.post || function() {};

  _traverse(opts, pre, post, schema, '', schema);
};


traverse.keywords = {
  additionalItems: true,
  items: true,
  contains: true,
  additionalProperties: true,
  propertyNames: true,
  not: true
};

traverse.arrayKeywords = {
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};

traverse.propsKeywords = {
  definitions: true,
  properties: true,
  patternProperties: true,
  dependencies: true
};

traverse.skipKeywords = {
  default: true,
  enum: true,
  const: true,
  required: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};


function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
  if (schema && typeof schema == 'object' && !Array.isArray(schema)) {
    pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    for (var key in schema) {
      var sch = schema[key];
      if (Array.isArray(sch)) {
        if (key in traverse.arrayKeywords) {
          for (var i=0; i<sch.length; i++)
            _traverse(opts, pre, post, sch[i], jsonPtr + '/' + key + '/' + i, rootSchema, jsonPtr, key, schema, i);
        }
      } else if (key in traverse.propsKeywords) {
        if (sch && typeof sch == 'object') {
          for (var prop in sch)
            _traverse(opts, pre, post, sch[prop], jsonPtr + '/' + key + '/' + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
        }
      } else if (key in traverse.keywords || (opts.allKeys && !(key in traverse.skipKeywords))) {
        _traverse(opts, pre, post, sch, jsonPtr + '/' + key, rootSchema, jsonPtr, key, schema);
      }
    }
    post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  }
}


function escapeJsonPtr(str) {
  return str.replace(/~/g, '~0').replace(/\//g, '~1');
}
});

var resolve_1 = resolve$1;

resolve$1.normalizeId = normalizeId;
resolve$1.fullPath = getFullPath;
resolve$1.url = resolveUrl;
resolve$1.ids = resolveIds;
resolve$1.inlineRef = inlineRef;
resolve$1.schema = resolveSchema;

/**
 * [resolve and compile the references ($ref)]
 * @this   Ajv
 * @param  {Function} compile reference to schema compilation funciton (localCompile)
 * @param  {Object} root object with information about the root schema for the current schema
 * @param  {String} ref reference to resolve
 * @return {Object|Function} schema object (if the schema can be inlined) or validation function
 */
function resolve$1(compile, root, ref) {
  /* jshint validthis: true */
  var refVal = this._refs[ref];
  if (typeof refVal == 'string') {
    if (this._refs[refVal]) refVal = this._refs[refVal];
    else return resolve$1.call(this, compile, root, refVal);
  }

  refVal = refVal || this._schemas[ref];
  if (refVal instanceof schema_obj) {
    return inlineRef(refVal.schema, this._opts.inlineRefs)
            ? refVal.schema
            : refVal.validate || this._compile(refVal);
  }

  var res = resolveSchema.call(this, root, ref);
  var schema, v, baseId;
  if (res) {
    schema = res.schema;
    root = res.root;
    baseId = res.baseId;
  }

  if (schema instanceof schema_obj) {
    v = schema.validate || compile.call(this, schema.schema, root, undefined, baseId);
  } else if (schema !== undefined) {
    v = inlineRef(schema, this._opts.inlineRefs)
        ? schema
        : compile.call(this, schema, root, undefined, baseId);
  }

  return v;
}


/**
 * Resolve schema, its root and baseId
 * @this Ajv
 * @param  {Object} root root object with properties schema, refVal, refs
 * @param  {String} ref  reference to resolve
 * @return {Object} object with properties schema, root, baseId
 */
function resolveSchema(root, ref) {
  /* jshint validthis: true */
  var p = uri_all.parse(ref)
    , refPath = _getFullPath(p)
    , baseId = getFullPath(this._getId(root.schema));
  if (Object.keys(root.schema).length === 0 || refPath !== baseId) {
    var id = normalizeId(refPath);
    var refVal = this._refs[id];
    if (typeof refVal == 'string') {
      return resolveRecursive.call(this, root, refVal, p);
    } else if (refVal instanceof schema_obj) {
      if (!refVal.validate) this._compile(refVal);
      root = refVal;
    } else {
      refVal = this._schemas[id];
      if (refVal instanceof schema_obj) {
        if (!refVal.validate) this._compile(refVal);
        if (id == normalizeId(ref))
          return { schema: refVal, root: root, baseId: baseId };
        root = refVal;
      } else {
        return;
      }
    }
    if (!root.schema) return;
    baseId = getFullPath(this._getId(root.schema));
  }
  return getJsonPointer.call(this, p, baseId, root.schema, root);
}


/* @this Ajv */
function resolveRecursive(root, ref, parsedRef) {
  /* jshint validthis: true */
  var res = resolveSchema.call(this, root, ref);
  if (res) {
    var schema = res.schema;
    var baseId = res.baseId;
    root = res.root;
    var id = this._getId(schema);
    if (id) baseId = resolveUrl(baseId, id);
    return getJsonPointer.call(this, parsedRef, baseId, schema, root);
  }
}


var PREVENT_SCOPE_CHANGE = util$1.toHash(['properties', 'patternProperties', 'enum', 'dependencies', 'definitions']);
/* @this Ajv */
function getJsonPointer(parsedRef, baseId, schema, root) {
  /* jshint validthis: true */
  parsedRef.fragment = parsedRef.fragment || '';
  if (parsedRef.fragment.slice(0,1) != '/') return;
  var parts = parsedRef.fragment.split('/');

  for (var i = 1; i < parts.length; i++) {
    var part = parts[i];
    if (part) {
      part = util$1.unescapeFragment(part);
      schema = schema[part];
      if (schema === undefined) break;
      var id;
      if (!PREVENT_SCOPE_CHANGE[part]) {
        id = this._getId(schema);
        if (id) baseId = resolveUrl(baseId, id);
        if (schema.$ref) {
          var $ref = resolveUrl(baseId, schema.$ref);
          var res = resolveSchema.call(this, root, $ref);
          if (res) {
            schema = res.schema;
            root = res.root;
            baseId = res.baseId;
          }
        }
      }
    }
  }
  if (schema !== undefined && schema !== root.schema)
    return { schema: schema, root: root, baseId: baseId };
}


var SIMPLE_INLINED = util$1.toHash([
  'type', 'format', 'pattern',
  'maxLength', 'minLength',
  'maxProperties', 'minProperties',
  'maxItems', 'minItems',
  'maximum', 'minimum',
  'uniqueItems', 'multipleOf',
  'required', 'enum'
]);
function inlineRef(schema, limit) {
  if (limit === false) return false;
  if (limit === undefined || limit === true) return checkNoRef(schema);
  else if (limit) return countKeys(schema) <= limit;
}


function checkNoRef(schema) {
  var item;
  if (Array.isArray(schema)) {
    for (var i=0; i<schema.length; i++) {
      item = schema[i];
      if (typeof item == 'object' && !checkNoRef(item)) return false;
    }
  } else {
    for (var key in schema) {
      if (key == '$ref') return false;
      item = schema[key];
      if (typeof item == 'object' && !checkNoRef(item)) return false;
    }
  }
  return true;
}


function countKeys(schema) {
  var count = 0, item;
  if (Array.isArray(schema)) {
    for (var i=0; i<schema.length; i++) {
      item = schema[i];
      if (typeof item == 'object') count += countKeys(item);
      if (count == Infinity) return Infinity;
    }
  } else {
    for (var key in schema) {
      if (key == '$ref') return Infinity;
      if (SIMPLE_INLINED[key]) {
        count++;
      } else {
        item = schema[key];
        if (typeof item == 'object') count += countKeys(item) + 1;
        if (count == Infinity) return Infinity;
      }
    }
  }
  return count;
}


function getFullPath(id, normalize) {
  if (normalize !== false) id = normalizeId(id);
  var p = uri_all.parse(id);
  return _getFullPath(p);
}


function _getFullPath(p) {
  return uri_all.serialize(p).split('#')[0] + '#';
}


var TRAILING_SLASH_HASH = /#\/?$/;
function normalizeId(id) {
  return id ? id.replace(TRAILING_SLASH_HASH, '') : '';
}


function resolveUrl(baseId, id) {
  id = normalizeId(id);
  return uri_all.resolve(baseId, id);
}


/* @this Ajv */
function resolveIds(schema) {
  var schemaId = normalizeId(this._getId(schema));
  var baseIds = {'': schemaId};
  var fullPaths = {'': getFullPath(schemaId, false)};
  var localRefs = {};
  var self = this;

  jsonSchemaTraverse(schema, {allKeys: true}, function(sch, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
    if (jsonPtr === '') return;
    var id = self._getId(sch);
    var baseId = baseIds[parentJsonPtr];
    var fullPath = fullPaths[parentJsonPtr] + '/' + parentKeyword;
    if (keyIndex !== undefined)
      fullPath += '/' + (typeof keyIndex == 'number' ? keyIndex : util$1.escapeFragment(keyIndex));

    if (typeof id == 'string') {
      id = baseId = normalizeId(baseId ? uri_all.resolve(baseId, id) : id);

      var refVal = self._refs[id];
      if (typeof refVal == 'string') refVal = self._refs[refVal];
      if (refVal && refVal.schema) {
        if (!fastDeepEqual(sch, refVal.schema))
          throw new Error('id "' + id + '" resolves to more than one schema');
      } else if (id != normalizeId(fullPath)) {
        if (id[0] == '#') {
          if (localRefs[id] && !fastDeepEqual(sch, localRefs[id]))
            throw new Error('id "' + id + '" resolves to more than one schema');
          localRefs[id] = sch;
        } else {
          self._refs[id] = fullPath;
        }
      }
    }
    baseIds[jsonPtr] = baseId;
    fullPaths[jsonPtr] = fullPath;
  });

  return localRefs;
}

var error_classes = {
  Validation: errorSubclass(ValidationError$1),
  MissingRef: errorSubclass(MissingRefError$1)
};


function ValidationError$1(errors) {
  this.message = 'validation failed';
  this.errors = errors;
  this.ajv = this.validation = true;
}


MissingRefError$1.message = function (baseId, ref) {
  return 'can\'t resolve reference ' + ref + ' from id ' + baseId;
};


function MissingRefError$1(baseId, ref, message) {
  this.message = message || MissingRefError$1.message(baseId, ref);
  this.missingRef = resolve_1.url(baseId, ref);
  this.missingSchema = resolve_1.normalizeId(resolve_1.fullPath(this.missingRef));
}


function errorSubclass(Subclass) {
  Subclass.prototype = Object.create(Error.prototype);
  Subclass.prototype.constructor = Subclass;
  return Subclass;
}

var fastJsonStableStringify = function (data, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (node) {
        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        if (node === undefined) return;
        if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
        if (typeof node !== 'object') return JSON.stringify(node);

        var i, out;
        if (Array.isArray(node)) {
            out = '[';
            for (i = 0; i < node.length; i++) {
                if (i) out += ',';
                out += stringify(node[i]) || 'null';
            }
            return out + ']';
        }

        if (node === null) return 'null';

        if (seen.indexOf(node) !== -1) {
            if (cycles) return JSON.stringify('__cycle__');
            throw new TypeError('Converting circular structure to JSON');
        }

        var seenIndex = seen.push(node) - 1;
        var keys = Object.keys(node).sort(cmp && cmp(node));
        out = '';
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = stringify(node[key]);

            if (!value) continue;
            if (out) out += ',';
            out += JSON.stringify(key) + ':' + value;
        }
        seen.splice(seenIndex, 1);
        return '{' + out + '}';
    })(data);
};

var validate$1 = function generate_validate(it, $keyword, $ruleType) {
  var out = '';
  var $async = it.schema.$async === true,
    $refKeywords = it.util.schemaHasRulesExcept(it.schema, it.RULES.all, '$ref'),
    $id = it.self._getId(it.schema);
  if (it.opts.strictKeywords) {
    var $unknownKwd = it.util.schemaUnknownRules(it.schema, it.RULES.keywords);
    if ($unknownKwd) {
      var $keywordsMsg = 'unknown keyword: ' + $unknownKwd;
      if (it.opts.strictKeywords === 'log') it.logger.warn($keywordsMsg);
      else throw new Error($keywordsMsg);
    }
  }
  if (it.isTop) {
    out += ' var validate = ';
    if ($async) {
      it.async = true;
      out += 'async ';
    }
    out += 'function(data, dataPath, parentData, parentDataProperty, rootData) { \'use strict\'; ';
    if ($id && (it.opts.sourceCode || it.opts.processCode)) {
      out += ' ' + ('/\*# sourceURL=' + $id + ' */') + ' ';
    }
  }
  if (typeof it.schema == 'boolean' || !($refKeywords || it.schema.$ref)) {
    var $keyword = 'false schema';
    var $lvl = it.level;
    var $dataLvl = it.dataLevel;
    var $schema = it.schema[$keyword];
    var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
    var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
    var $breakOnError = !it.opts.allErrors;
    var $errorKeyword;
    var $data = 'data' + ($dataLvl || '');
    var $valid = 'valid' + $lvl;
    if (it.schema === false) {
      if (it.isTop) {
        $breakOnError = true;
      } else {
        out += ' var ' + ($valid) + ' = false; ';
      }
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = ''; /* istanbul ignore else */
      if (it.createErrors !== false) {
        out += ' { keyword: \'' + ($errorKeyword || 'false schema') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
        if (it.opts.messages !== false) {
          out += ' , message: \'boolean schema is false\' ';
        }
        if (it.opts.verbose) {
          out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
        }
        out += ' } ';
      } else {
        out += ' {} ';
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        /* istanbul ignore if */
        if (it.async) {
          out += ' throw new ValidationError([' + (__err) + ']); ';
        } else {
          out += ' validate.errors = [' + (__err) + ']; return false; ';
        }
      } else {
        out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      }
    } else {
      if (it.isTop) {
        if ($async) {
          out += ' return data; ';
        } else {
          out += ' validate.errors = null; return true; ';
        }
      } else {
        out += ' var ' + ($valid) + ' = true; ';
      }
    }
    if (it.isTop) {
      out += ' }; return validate; ';
    }
    return out;
  }
  if (it.isTop) {
    var $top = it.isTop,
      $lvl = it.level = 0,
      $dataLvl = it.dataLevel = 0,
      $data = 'data';
    it.rootId = it.resolve.fullPath(it.self._getId(it.root.schema));
    it.baseId = it.baseId || it.rootId;
    delete it.isTop;
    it.dataPathArr = [""];
    if (it.schema.default !== undefined && it.opts.useDefaults && it.opts.strictDefaults) {
      var $defaultMsg = 'default is ignored in the schema root';
      if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
      else throw new Error($defaultMsg);
    }
    out += ' var vErrors = null; ';
    out += ' var errors = 0;     ';
    out += ' if (rootData === undefined) rootData = data; ';
  } else {
    var $lvl = it.level,
      $dataLvl = it.dataLevel,
      $data = 'data' + ($dataLvl || '');
    if ($id) it.baseId = it.resolve.url(it.baseId, $id);
    if ($async && !it.async) throw new Error('async schema in sync schema');
    out += ' var errs_' + ($lvl) + ' = errors;';
  }
  var $valid = 'valid' + $lvl,
    $breakOnError = !it.opts.allErrors,
    $closingBraces1 = '',
    $closingBraces2 = '';
  var $errorKeyword;
  var $typeSchema = it.schema.type,
    $typeIsArray = Array.isArray($typeSchema);
  if ($typeSchema && it.opts.nullable && it.schema.nullable === true) {
    if ($typeIsArray) {
      if ($typeSchema.indexOf('null') == -1) $typeSchema = $typeSchema.concat('null');
    } else if ($typeSchema != 'null') {
      $typeSchema = [$typeSchema, 'null'];
      $typeIsArray = true;
    }
  }
  if ($typeIsArray && $typeSchema.length == 1) {
    $typeSchema = $typeSchema[0];
    $typeIsArray = false;
  }
  if (it.schema.$ref && $refKeywords) {
    if (it.opts.extendRefs == 'fail') {
      throw new Error('$ref: validation keywords used in schema at path "' + it.errSchemaPath + '" (see option extendRefs)');
    } else if (it.opts.extendRefs !== true) {
      $refKeywords = false;
      it.logger.warn('$ref: keywords ignored in schema at path "' + it.errSchemaPath + '"');
    }
  }
  if (it.schema.$comment && it.opts.$comment) {
    out += ' ' + (it.RULES.all.$comment.code(it, '$comment'));
  }
  if ($typeSchema) {
    if (it.opts.coerceTypes) {
      var $coerceToTypes = it.util.coerceToTypes(it.opts.coerceTypes, $typeSchema);
    }
    var $rulesGroup = it.RULES.types[$typeSchema];
    if ($coerceToTypes || $typeIsArray || $rulesGroup === true || ($rulesGroup && !$shouldUseGroup($rulesGroup))) {
      var $schemaPath = it.schemaPath + '.type',
        $errSchemaPath = it.errSchemaPath + '/type';
      var $schemaPath = it.schemaPath + '.type',
        $errSchemaPath = it.errSchemaPath + '/type',
        $method = $typeIsArray ? 'checkDataTypes' : 'checkDataType';
      out += ' if (' + (it.util[$method]($typeSchema, $data, it.opts.strictNumbers, true)) + ') { ';
      if ($coerceToTypes) {
        var $dataType = 'dataType' + $lvl,
          $coerced = 'coerced' + $lvl;
        out += ' var ' + ($dataType) + ' = typeof ' + ($data) + '; var ' + ($coerced) + ' = undefined; ';
        if (it.opts.coerceTypes == 'array') {
          out += ' if (' + ($dataType) + ' == \'object\' && Array.isArray(' + ($data) + ') && ' + ($data) + '.length == 1) { ' + ($data) + ' = ' + ($data) + '[0]; ' + ($dataType) + ' = typeof ' + ($data) + '; if (' + (it.util.checkDataType(it.schema.type, $data, it.opts.strictNumbers)) + ') ' + ($coerced) + ' = ' + ($data) + '; } ';
        }
        out += ' if (' + ($coerced) + ' !== undefined) ; ';
        var arr1 = $coerceToTypes;
        if (arr1) {
          var $type, $i = -1,
            l1 = arr1.length - 1;
          while ($i < l1) {
            $type = arr1[$i += 1];
            if ($type == 'string') {
              out += ' else if (' + ($dataType) + ' == \'number\' || ' + ($dataType) + ' == \'boolean\') ' + ($coerced) + ' = \'\' + ' + ($data) + '; else if (' + ($data) + ' === null) ' + ($coerced) + ' = \'\'; ';
            } else if ($type == 'number' || $type == 'integer') {
              out += ' else if (' + ($dataType) + ' == \'boolean\' || ' + ($data) + ' === null || (' + ($dataType) + ' == \'string\' && ' + ($data) + ' && ' + ($data) + ' == +' + ($data) + ' ';
              if ($type == 'integer') {
                out += ' && !(' + ($data) + ' % 1)';
              }
              out += ')) ' + ($coerced) + ' = +' + ($data) + '; ';
            } else if ($type == 'boolean') {
              out += ' else if (' + ($data) + ' === \'false\' || ' + ($data) + ' === 0 || ' + ($data) + ' === null) ' + ($coerced) + ' = false; else if (' + ($data) + ' === \'true\' || ' + ($data) + ' === 1) ' + ($coerced) + ' = true; ';
            } else if ($type == 'null') {
              out += ' else if (' + ($data) + ' === \'\' || ' + ($data) + ' === 0 || ' + ($data) + ' === false) ' + ($coerced) + ' = null; ';
            } else if (it.opts.coerceTypes == 'array' && $type == 'array') {
              out += ' else if (' + ($dataType) + ' == \'string\' || ' + ($dataType) + ' == \'number\' || ' + ($dataType) + ' == \'boolean\' || ' + ($data) + ' == null) ' + ($coerced) + ' = [' + ($data) + ']; ';
            }
          }
        }
        out += ' else {   ';
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
          if ($typeIsArray) {
            out += '' + ($typeSchema.join(","));
          } else {
            out += '' + ($typeSchema);
          }
          out += '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'should be ';
            if ($typeIsArray) {
              out += '' + ($typeSchema.join(","));
            } else {
              out += '' + ($typeSchema);
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        out += ' } if (' + ($coerced) + ' !== undefined) {  ';
        var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
          $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
        out += ' ' + ($data) + ' = ' + ($coerced) + '; ';
        if (!$dataLvl) {
          out += 'if (' + ($parentData) + ' !== undefined)';
        }
        out += ' ' + ($parentData) + '[' + ($parentDataProperty) + '] = ' + ($coerced) + '; } ';
      } else {
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
          if ($typeIsArray) {
            out += '' + ($typeSchema.join(","));
          } else {
            out += '' + ($typeSchema);
          }
          out += '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'should be ';
            if ($typeIsArray) {
              out += '' + ($typeSchema.join(","));
            } else {
              out += '' + ($typeSchema);
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
      }
      out += ' } ';
    }
  }
  if (it.schema.$ref && !$refKeywords) {
    out += ' ' + (it.RULES.all.$ref.code(it, '$ref')) + ' ';
    if ($breakOnError) {
      out += ' } if (errors === ';
      if ($top) {
        out += '0';
      } else {
        out += 'errs_' + ($lvl);
      }
      out += ') { ';
      $closingBraces2 += '}';
    }
  } else {
    var arr2 = it.RULES;
    if (arr2) {
      var $rulesGroup, i2 = -1,
        l2 = arr2.length - 1;
      while (i2 < l2) {
        $rulesGroup = arr2[i2 += 1];
        if ($shouldUseGroup($rulesGroup)) {
          if ($rulesGroup.type) {
            out += ' if (' + (it.util.checkDataType($rulesGroup.type, $data, it.opts.strictNumbers)) + ') { ';
          }
          if (it.opts.useDefaults) {
            if ($rulesGroup.type == 'object' && it.schema.properties) {
              var $schema = it.schema.properties,
                $schemaKeys = Object.keys($schema);
              var arr3 = $schemaKeys;
              if (arr3) {
                var $propertyKey, i3 = -1,
                  l3 = arr3.length - 1;
                while (i3 < l3) {
                  $propertyKey = arr3[i3 += 1];
                  var $sch = $schema[$propertyKey];
                  if ($sch.default !== undefined) {
                    var $passData = $data + it.util.getProperty($propertyKey);
                    if (it.compositeRule) {
                      if (it.opts.strictDefaults) {
                        var $defaultMsg = 'default is ignored for: ' + $passData;
                        if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
                        else throw new Error($defaultMsg);
                      }
                    } else {
                      out += ' if (' + ($passData) + ' === undefined ';
                      if (it.opts.useDefaults == 'empty') {
                        out += ' || ' + ($passData) + ' === null || ' + ($passData) + ' === \'\' ';
                      }
                      out += ' ) ' + ($passData) + ' = ';
                      if (it.opts.useDefaults == 'shared') {
                        out += ' ' + (it.useDefault($sch.default)) + ' ';
                      } else {
                        out += ' ' + (JSON.stringify($sch.default)) + ' ';
                      }
                      out += '; ';
                    }
                  }
                }
              }
            } else if ($rulesGroup.type == 'array' && Array.isArray(it.schema.items)) {
              var arr4 = it.schema.items;
              if (arr4) {
                var $sch, $i = -1,
                  l4 = arr4.length - 1;
                while ($i < l4) {
                  $sch = arr4[$i += 1];
                  if ($sch.default !== undefined) {
                    var $passData = $data + '[' + $i + ']';
                    if (it.compositeRule) {
                      if (it.opts.strictDefaults) {
                        var $defaultMsg = 'default is ignored for: ' + $passData;
                        if (it.opts.strictDefaults === 'log') it.logger.warn($defaultMsg);
                        else throw new Error($defaultMsg);
                      }
                    } else {
                      out += ' if (' + ($passData) + ' === undefined ';
                      if (it.opts.useDefaults == 'empty') {
                        out += ' || ' + ($passData) + ' === null || ' + ($passData) + ' === \'\' ';
                      }
                      out += ' ) ' + ($passData) + ' = ';
                      if (it.opts.useDefaults == 'shared') {
                        out += ' ' + (it.useDefault($sch.default)) + ' ';
                      } else {
                        out += ' ' + (JSON.stringify($sch.default)) + ' ';
                      }
                      out += '; ';
                    }
                  }
                }
              }
            }
          }
          var arr5 = $rulesGroup.rules;
          if (arr5) {
            var $rule, i5 = -1,
              l5 = arr5.length - 1;
            while (i5 < l5) {
              $rule = arr5[i5 += 1];
              if ($shouldUseRule($rule)) {
                var $code = $rule.code(it, $rule.keyword, $rulesGroup.type);
                if ($code) {
                  out += ' ' + ($code) + ' ';
                  if ($breakOnError) {
                    $closingBraces1 += '}';
                  }
                }
              }
            }
          }
          if ($breakOnError) {
            out += ' ' + ($closingBraces1) + ' ';
            $closingBraces1 = '';
          }
          if ($rulesGroup.type) {
            out += ' } ';
            if ($typeSchema && $typeSchema === $rulesGroup.type && !$coerceToTypes) {
              out += ' else { ';
              var $schemaPath = it.schemaPath + '.type',
                $errSchemaPath = it.errSchemaPath + '/type';
              var $$outStack = $$outStack || [];
              $$outStack.push(out);
              out = ''; /* istanbul ignore else */
              if (it.createErrors !== false) {
                out += ' { keyword: \'' + ($errorKeyword || 'type') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { type: \'';
                if ($typeIsArray) {
                  out += '' + ($typeSchema.join(","));
                } else {
                  out += '' + ($typeSchema);
                }
                out += '\' } ';
                if (it.opts.messages !== false) {
                  out += ' , message: \'should be ';
                  if ($typeIsArray) {
                    out += '' + ($typeSchema.join(","));
                  } else {
                    out += '' + ($typeSchema);
                  }
                  out += '\' ';
                }
                if (it.opts.verbose) {
                  out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
                }
                out += ' } ';
              } else {
                out += ' {} ';
              }
              var __err = out;
              out = $$outStack.pop();
              if (!it.compositeRule && $breakOnError) {
                /* istanbul ignore if */
                if (it.async) {
                  out += ' throw new ValidationError([' + (__err) + ']); ';
                } else {
                  out += ' validate.errors = [' + (__err) + ']; return false; ';
                }
              } else {
                out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              out += ' } ';
            }
          }
          if ($breakOnError) {
            out += ' if (errors === ';
            if ($top) {
              out += '0';
            } else {
              out += 'errs_' + ($lvl);
            }
            out += ') { ';
            $closingBraces2 += '}';
          }
        }
      }
    }
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces2) + ' ';
  }
  if ($top) {
    if ($async) {
      out += ' if (errors === 0) return data;           ';
      out += ' else throw new ValidationError(vErrors); ';
    } else {
      out += ' validate.errors = vErrors; ';
      out += ' return errors === 0;       ';
    }
    out += ' }; return validate;';
  } else {
    out += ' var ' + ($valid) + ' = errors === errs_' + ($lvl) + ';';
  }

  function $shouldUseGroup($rulesGroup) {
    var rules = $rulesGroup.rules;
    for (var i = 0; i < rules.length; i++)
      if ($shouldUseRule(rules[i])) return true;
  }

  function $shouldUseRule($rule) {
    return it.schema[$rule.keyword] !== undefined || ($rule.implements && $ruleImplementsSomeKeyword($rule));
  }

  function $ruleImplementsSomeKeyword($rule) {
    var impl = $rule.implements;
    for (var i = 0; i < impl.length; i++)
      if (it.schema[impl[i]] !== undefined) return true;
  }
  return out;
};

/**
 * Functions below are used inside compiled validations function
 */

var ucs2length = util$1.ucs2length;


// this error is thrown by async schemas to return validation errors via exception
var ValidationError = error_classes.Validation;

var compile_1 = compile$1;


/**
 * Compiles schema to validation function
 * @this   Ajv
 * @param  {Object} schema schema object
 * @param  {Object} root object with information about the root schema for this schema
 * @param  {Object} localRefs the hash of local references inside the schema (created by resolve.id), used for inline resolution
 * @param  {String} baseId base ID for IDs in the schema
 * @return {Function} validation function
 */
function compile$1(schema, root, localRefs, baseId) {
  /* jshint validthis: true, evil: true */
  /* eslint no-shadow: 0 */
  var self = this
    , opts = this._opts
    , refVal = [ undefined ]
    , refs = {}
    , patterns = []
    , patternsHash = {}
    , defaults = []
    , defaultsHash = {}
    , customRules = [];

  root = root || { schema: schema, refVal: refVal, refs: refs };

  var c = checkCompiling.call(this, schema, root, baseId);
  var compilation = this._compilations[c.index];
  if (c.compiling) return (compilation.callValidate = callValidate);

  var formats = this._formats;
  var RULES = this.RULES;

  try {
    var v = localCompile(schema, root, localRefs, baseId);
    compilation.validate = v;
    var cv = compilation.callValidate;
    if (cv) {
      cv.schema = v.schema;
      cv.errors = null;
      cv.refs = v.refs;
      cv.refVal = v.refVal;
      cv.root = v.root;
      cv.$async = v.$async;
      if (opts.sourceCode) cv.source = v.source;
    }
    return v;
  } finally {
    endCompiling.call(this, schema, root, baseId);
  }

  /* @this   {*} - custom context, see passContext option */
  function callValidate() {
    /* jshint validthis: true */
    var validate = compilation.validate;
    var result = validate.apply(this, arguments);
    callValidate.errors = validate.errors;
    return result;
  }

  function localCompile(_schema, _root, localRefs, baseId) {
    var isRoot = !_root || (_root && _root.schema == _schema);
    if (_root.schema != root.schema)
      return compile$1.call(self, _schema, _root, localRefs, baseId);

    var $async = _schema.$async === true;

    var sourceCode = validate$1({
      isTop: true,
      schema: _schema,
      isRoot: isRoot,
      baseId: baseId,
      root: _root,
      schemaPath: '',
      errSchemaPath: '#',
      errorPath: '""',
      MissingRefError: error_classes.MissingRef,
      RULES: RULES,
      validate: validate$1,
      util: util$1,
      resolve: resolve_1,
      resolveRef: resolveRef,
      usePattern: usePattern,
      useDefault: useDefault,
      useCustomRule: useCustomRule,
      opts: opts,
      formats: formats,
      logger: self.logger,
      self: self
    });

    sourceCode = vars(refVal, refValCode) + vars(patterns, patternCode)
                   + vars(defaults, defaultCode) + vars(customRules, customRuleCode)
                   + sourceCode;

    if (opts.processCode) sourceCode = opts.processCode(sourceCode, _schema);
    // console.log('\n\n\n *** \n', JSON.stringify(sourceCode));
    var validate;
    try {
      var makeValidate = new Function(
        'self',
        'RULES',
        'formats',
        'root',
        'refVal',
        'defaults',
        'customRules',
        'equal',
        'ucs2length',
        'ValidationError',
        sourceCode
      );

      validate = makeValidate(
        self,
        RULES,
        formats,
        root,
        refVal,
        defaults,
        customRules,
        fastDeepEqual,
        ucs2length,
        ValidationError
      );

      refVal[0] = validate;
    } catch(e) {
      self.logger.error('Error compiling schema, function code:', sourceCode);
      throw e;
    }

    validate.schema = _schema;
    validate.errors = null;
    validate.refs = refs;
    validate.refVal = refVal;
    validate.root = isRoot ? validate : _root;
    if ($async) validate.$async = true;
    if (opts.sourceCode === true) {
      validate.source = {
        code: sourceCode,
        patterns: patterns,
        defaults: defaults
      };
    }

    return validate;
  }

  function resolveRef(baseId, ref, isRoot) {
    ref = resolve_1.url(baseId, ref);
    var refIndex = refs[ref];
    var _refVal, refCode;
    if (refIndex !== undefined) {
      _refVal = refVal[refIndex];
      refCode = 'refVal[' + refIndex + ']';
      return resolvedRef(_refVal, refCode);
    }
    if (!isRoot && root.refs) {
      var rootRefId = root.refs[ref];
      if (rootRefId !== undefined) {
        _refVal = root.refVal[rootRefId];
        refCode = addLocalRef(ref, _refVal);
        return resolvedRef(_refVal, refCode);
      }
    }

    refCode = addLocalRef(ref);
    var v = resolve_1.call(self, localCompile, root, ref);
    if (v === undefined) {
      var localSchema = localRefs && localRefs[ref];
      if (localSchema) {
        v = resolve_1.inlineRef(localSchema, opts.inlineRefs)
            ? localSchema
            : compile$1.call(self, localSchema, root, localRefs, baseId);
      }
    }

    if (v === undefined) {
      removeLocalRef(ref);
    } else {
      replaceLocalRef(ref, v);
      return resolvedRef(v, refCode);
    }
  }

  function addLocalRef(ref, v) {
    var refId = refVal.length;
    refVal[refId] = v;
    refs[ref] = refId;
    return 'refVal' + refId;
  }

  function removeLocalRef(ref) {
    delete refs[ref];
  }

  function replaceLocalRef(ref, v) {
    var refId = refs[ref];
    refVal[refId] = v;
  }

  function resolvedRef(refVal, code) {
    return typeof refVal == 'object' || typeof refVal == 'boolean'
            ? { code: code, schema: refVal, inline: true }
            : { code: code, $async: refVal && !!refVal.$async };
  }

  function usePattern(regexStr) {
    var index = patternsHash[regexStr];
    if (index === undefined) {
      index = patternsHash[regexStr] = patterns.length;
      patterns[index] = regexStr;
    }
    return 'pattern' + index;
  }

  function useDefault(value) {
    switch (typeof value) {
      case 'boolean':
      case 'number':
        return '' + value;
      case 'string':
        return util$1.toQuotedString(value);
      case 'object':
        if (value === null) return 'null';
        var valueStr = fastJsonStableStringify(value);
        var index = defaultsHash[valueStr];
        if (index === undefined) {
          index = defaultsHash[valueStr] = defaults.length;
          defaults[index] = value;
        }
        return 'default' + index;
    }
  }

  function useCustomRule(rule, schema, parentSchema, it) {
    if (self._opts.validateSchema !== false) {
      var deps = rule.definition.dependencies;
      if (deps && !deps.every(function(keyword) {
        return Object.prototype.hasOwnProperty.call(parentSchema, keyword);
      }))
        throw new Error('parent schema must have all required keywords: ' + deps.join(','));

      var validateSchema = rule.definition.validateSchema;
      if (validateSchema) {
        var valid = validateSchema(schema);
        if (!valid) {
          var message = 'keyword schema is invalid: ' + self.errorsText(validateSchema.errors);
          if (self._opts.validateSchema == 'log') self.logger.error(message);
          else throw new Error(message);
        }
      }
    }

    var compile = rule.definition.compile
      , inline = rule.definition.inline
      , macro = rule.definition.macro;

    var validate;
    if (compile) {
      validate = compile.call(self, schema, parentSchema, it);
    } else if (macro) {
      validate = macro.call(self, schema, parentSchema, it);
      if (opts.validateSchema !== false) self.validateSchema(validate, true);
    } else if (inline) {
      validate = inline.call(self, it, rule.keyword, schema, parentSchema);
    } else {
      validate = rule.definition.validate;
      if (!validate) return;
    }

    if (validate === undefined)
      throw new Error('custom keyword "' + rule.keyword + '"failed to compile');

    var index = customRules.length;
    customRules[index] = validate;

    return {
      code: 'customRule' + index,
      validate: validate
    };
  }
}


/**
 * Checks if the schema is currently compiled
 * @this   Ajv
 * @param  {Object} schema schema to compile
 * @param  {Object} root root object
 * @param  {String} baseId base schema ID
 * @return {Object} object with properties "index" (compilation index) and "compiling" (boolean)
 */
function checkCompiling(schema, root, baseId) {
  /* jshint validthis: true */
  var index = compIndex.call(this, schema, root, baseId);
  if (index >= 0) return { index: index, compiling: true };
  index = this._compilations.length;
  this._compilations[index] = {
    schema: schema,
    root: root,
    baseId: baseId
  };
  return { index: index, compiling: false };
}


/**
 * Removes the schema from the currently compiled list
 * @this   Ajv
 * @param  {Object} schema schema to compile
 * @param  {Object} root root object
 * @param  {String} baseId base schema ID
 */
function endCompiling(schema, root, baseId) {
  /* jshint validthis: true */
  var i = compIndex.call(this, schema, root, baseId);
  if (i >= 0) this._compilations.splice(i, 1);
}


/**
 * Index of schema compilation in the currently compiled list
 * @this   Ajv
 * @param  {Object} schema schema to compile
 * @param  {Object} root root object
 * @param  {String} baseId base schema ID
 * @return {Integer} compilation index
 */
function compIndex(schema, root, baseId) {
  /* jshint validthis: true */
  for (var i=0; i<this._compilations.length; i++) {
    var c = this._compilations[i];
    if (c.schema == schema && c.root == root && c.baseId == baseId) return i;
  }
  return -1;
}


function patternCode(i, patterns) {
  return 'var pattern' + i + ' = new RegExp(' + util$1.toQuotedString(patterns[i]) + ');';
}


function defaultCode(i) {
  return 'var default' + i + ' = defaults[' + i + '];';
}


function refValCode(i, refVal) {
  return refVal[i] === undefined ? '' : 'var refVal' + i + ' = refVal[' + i + '];';
}


function customRuleCode(i) {
  return 'var customRule' + i + ' = customRules[' + i + '];';
}


function vars(arr, statement) {
  if (!arr.length) return '';
  var code = '';
  for (var i=0; i<arr.length; i++)
    code += statement(i, arr);
  return code;
}

var cache$1 = createCommonjsModule(function (module) {


var Cache = module.exports = function Cache() {
  this._cache = {};
};


Cache.prototype.put = function Cache_put(key, value) {
  this._cache[key] = value;
};


Cache.prototype.get = function Cache_get(key) {
  return this._cache[key];
};


Cache.prototype.del = function Cache_del(key) {
  delete this._cache[key];
};


Cache.prototype.clear = function Cache_clear() {
  this._cache = {};
};
});

var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var DAYS = [0,31,28,31,30,31,30,31,31,30,31,30,31];
var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
// uri-template: https://tools.ietf.org/html/rfc6570
var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
// For the source: https://gist.github.com/dperini/729294
// For test cases: https://mathiasbynens.be/demo/url-regex
// @todo Delete current URL in favour of the commented out URL rule when this issue is fixed https://github.com/eslint/eslint/issues/7983.
// var URL = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
var URL = /^(?:(?:http[s\u017F]?|ftp):\/\/)(?:(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\.[0-9]{1,3}){3})(?!127(?:\.[0-9]{1,3}){3})(?!169\.254(?:\.[0-9]{1,3}){2})(?!192\.168(?:\.[0-9]{1,3}){2})(?!172\.(?:1[6-9]|2[0-9]|3[01])(?:\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\.(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\.(?:(?:[a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\/(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i;
var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;


var formats_1 = formats;

function formats(mode) {
  mode = mode == 'full' ? 'full' : 'fast';
  return util$1.copy(formats[mode]);
}


formats.fast = {
  // date: http://tools.ietf.org/html/rfc3339#section-5.6
  date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
  // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
  time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
  'date-time': /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
  // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
  uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
  'uri-reference': /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
  'uri-template': URITEMPLATE,
  url: URL,
  // email (sources from jsen validator):
  // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
  // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'willful violation')
  email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  hostname: HOSTNAME,
  // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  // optimized http://stackoverflow.com/questions/53497/regular-expression-that-matches-valid-ipv6-addresses
  ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
  regex: regex,
  // uuid: http://tools.ietf.org/html/rfc4122
  uuid: UUID,
  // JSON-pointer: https://tools.ietf.org/html/rfc6901
  // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
  'json-pointer': JSON_POINTER,
  'json-pointer-uri-fragment': JSON_POINTER_URI_FRAGMENT,
  // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
  'relative-json-pointer': RELATIVE_JSON_POINTER
};


formats.full = {
  date: date$1,
  time: time,
  'date-time': date_time,
  uri: uri,
  'uri-reference': URIREF,
  'uri-template': URITEMPLATE,
  url: URL,
  email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
  hostname: HOSTNAME,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
  regex: regex,
  uuid: UUID,
  'json-pointer': JSON_POINTER,
  'json-pointer-uri-fragment': JSON_POINTER_URI_FRAGMENT,
  'relative-json-pointer': RELATIVE_JSON_POINTER
};


function isLeapYear(year) {
  // https://tools.ietf.org/html/rfc3339#appendix-C
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}


function date$1(str) {
  // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
  var matches = str.match(DATE);
  if (!matches) return false;

  var year = +matches[1];
  var month = +matches[2];
  var day = +matches[3];

  return month >= 1 && month <= 12 && day >= 1 &&
          day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
}


function time(str, full) {
  var matches = str.match(TIME);
  if (!matches) return false;

  var hour = matches[1];
  var minute = matches[2];
  var second = matches[3];
  var timeZone = matches[5];
  return ((hour <= 23 && minute <= 59 && second <= 59) ||
          (hour == 23 && minute == 59 && second == 60)) &&
         (!full || timeZone);
}


var DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
  // http://tools.ietf.org/html/rfc3339#section-5.6
  var dateTime = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length == 2 && date$1(dateTime[0]) && time(dateTime[1], true);
}


var NOT_URI_FRAGMENT = /\/|:/;
function uri(str) {
  // http://jmrware.com/articles/2009/uri_regexp/URI_regex.html + optional protocol + required "."
  return NOT_URI_FRAGMENT.test(str) && URI.test(str);
}


var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str)) return false;
  try {
    new RegExp(str);
    return true;
  } catch(e) {
    return false;
  }
}

var ref = function generate_ref(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $async, $refCode;
  if ($schema == '#' || $schema == '#/') {
    if (it.isRoot) {
      $async = it.async;
      $refCode = 'validate';
    } else {
      $async = it.root.schema.$async === true;
      $refCode = 'root.refVal[0]';
    }
  } else {
    var $refVal = it.resolveRef(it.baseId, $schema, it.isRoot);
    if ($refVal === undefined) {
      var $message = it.MissingRefError.message(it.baseId, $schema);
      if (it.opts.missingRefs == 'fail') {
        it.logger.error($message);
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('$ref') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { ref: \'' + (it.util.escapeQuotes($schema)) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'can\\\'t resolve reference ' + (it.util.escapeQuotes($schema)) + '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: ' + (it.util.toQuotedString($schema)) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        if ($breakOnError) {
          out += ' if (false) { ';
        }
      } else if (it.opts.missingRefs == 'ignore') {
        it.logger.warn($message);
        if ($breakOnError) {
          out += ' if (true) { ';
        }
      } else {
        throw new it.MissingRefError(it.baseId, $schema, $message);
      }
    } else if ($refVal.inline) {
      var $it = it.util.copy(it);
      $it.level++;
      var $nextValid = 'valid' + $it.level;
      $it.schema = $refVal.schema;
      $it.schemaPath = '';
      $it.errSchemaPath = $schema;
      var $code = it.validate($it).replace(/validate\.schema/g, $refVal.code);
      out += ' ' + ($code) + ' ';
      if ($breakOnError) {
        out += ' if (' + ($nextValid) + ') { ';
      }
    } else {
      $async = $refVal.$async === true || (it.async && $refVal.$async !== false);
      $refCode = $refVal.code;
    }
  }
  if ($refCode) {
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = '';
    if (it.opts.passContext) {
      out += ' ' + ($refCode) + '.call(this, ';
    } else {
      out += ' ' + ($refCode) + '( ';
    }
    out += ' ' + ($data) + ', (dataPath || \'\')';
    if (it.errorPath != '""') {
      out += ' + ' + (it.errorPath);
    }
    var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
      $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
    out += ' , ' + ($parentData) + ' , ' + ($parentDataProperty) + ', rootData)  ';
    var __callValidate = out;
    out = $$outStack.pop();
    if ($async) {
      if (!it.async) throw new Error('async schema referenced by sync schema');
      if ($breakOnError) {
        out += ' var ' + ($valid) + '; ';
      }
      out += ' try { await ' + (__callValidate) + '; ';
      if ($breakOnError) {
        out += ' ' + ($valid) + ' = true; ';
      }
      out += ' } catch (e) { if (!(e instanceof ValidationError)) throw e; if (vErrors === null) vErrors = e.errors; else vErrors = vErrors.concat(e.errors); errors = vErrors.length; ';
      if ($breakOnError) {
        out += ' ' + ($valid) + ' = false; ';
      }
      out += ' } ';
      if ($breakOnError) {
        out += ' if (' + ($valid) + ') { ';
      }
    } else {
      out += ' if (!' + (__callValidate) + ') { if (vErrors === null) vErrors = ' + ($refCode) + '.errors; else vErrors = vErrors.concat(' + ($refCode) + '.errors); errors = vErrors.length; } ';
      if ($breakOnError) {
        out += ' else { ';
      }
    }
  }
  return out;
};

var allOf = function generate_allOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $currentBaseId = $it.baseId,
    $allSchemasEmpty = true;
  var arr1 = $schema;
  if (arr1) {
    var $sch, $i = -1,
      l1 = arr1.length - 1;
    while ($i < l1) {
      $sch = arr1[$i += 1];
      if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
        $allSchemasEmpty = false;
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        $it.errSchemaPath = $errSchemaPath + '/' + $i;
        out += '  ' + (it.validate($it)) + ' ';
        $it.baseId = $currentBaseId;
        if ($breakOnError) {
          out += ' if (' + ($nextValid) + ') { ';
          $closingBraces += '}';
        }
      }
    }
  }
  if ($breakOnError) {
    if ($allSchemasEmpty) {
      out += ' if (true) { ';
    } else {
      out += ' ' + ($closingBraces.slice(0, -1)) + ' ';
    }
  }
  return out;
};

var anyOf = function generate_anyOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $noEmptySchema = $schema.every(function($sch) {
    return (it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all));
  });
  if ($noEmptySchema) {
    var $currentBaseId = $it.baseId;
    out += ' var ' + ($errs) + ' = errors; var ' + ($valid) + ' = false;  ';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    var arr1 = $schema;
    if (arr1) {
      var $sch, $i = -1,
        l1 = arr1.length - 1;
      while ($i < l1) {
        $sch = arr1[$i += 1];
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        $it.errSchemaPath = $errSchemaPath + '/' + $i;
        out += '  ' + (it.validate($it)) + ' ';
        $it.baseId = $currentBaseId;
        out += ' ' + ($valid) + ' = ' + ($valid) + ' || ' + ($nextValid) + '; if (!' + ($valid) + ') { ';
        $closingBraces += '}';
      }
    }
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' ' + ($closingBraces) + ' if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('anyOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should match some schema in anyOf\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError(vErrors); ';
      } else {
        out += ' validate.errors = vErrors; return false; ';
      }
    }
    out += ' } else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
    if (it.opts.allErrors) {
      out += ' } ';
    }
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
};

var comment = function generate_comment(it, $keyword, $ruleType) {
  var out = ' ';
  var $schema = it.schema[$keyword];
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  !it.opts.allErrors;
  var $comment = it.util.toQuotedString($schema);
  if (it.opts.$comment === true) {
    out += ' console.log(' + ($comment) + ');';
  } else if (typeof it.opts.$comment == 'function') {
    out += ' self._opts.$comment(' + ($comment) + ', ' + (it.util.toQuotedString($errSchemaPath)) + ', validate.root.schema);';
  }
  return out;
};

var _const = function generate_const(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
  }
  if (!$isData) {
    out += ' var schema' + ($lvl) + ' = validate.schema' + ($schemaPath) + ';';
  }
  out += 'var ' + ($valid) + ' = equal(' + ($data) + ', schema' + ($lvl) + '); if (!' + ($valid) + ') {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('const') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { allowedValue: schema' + ($lvl) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be equal to constant\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' }';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var contains$1 = function generate_contains(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $idx = 'i' + $lvl,
    $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt,
    $currentBaseId = it.baseId,
    $nonEmptySchema = (it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all));
  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
  if ($nonEmptySchema) {
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += ' var ' + ($nextValid) + ' = false; for (var ' + ($idx) + ' = 0; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
    $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
    var $passData = $data + '[' + $idx + ']';
    $it.dataPathArr[$dataNxt] = $idx;
    var $code = it.validate($it);
    $it.baseId = $currentBaseId;
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    out += ' if (' + ($nextValid) + ') break; }  ';
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' ' + ($closingBraces) + ' if (!' + ($nextValid) + ') {';
  } else {
    out += ' if (' + ($data) + '.length == 0) {';
  }
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('contains') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should contain a valid item\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' } else { ';
  if ($nonEmptySchema) {
    out += '  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
  }
  if (it.opts.allErrors) {
    out += ' } ';
  }
  return out;
};

var dependencies = function generate_dependencies(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $schemaDeps = {},
    $propertyDeps = {},
    $ownProperties = it.opts.ownProperties;
  for ($property in $schema) {
    if ($property == '__proto__') continue;
    var $sch = $schema[$property];
    var $deps = Array.isArray($sch) ? $propertyDeps : $schemaDeps;
    $deps[$property] = $sch;
  }
  out += 'var ' + ($errs) + ' = errors;';
  var $currentErrorPath = it.errorPath;
  out += 'var missing' + ($lvl) + ';';
  for (var $property in $propertyDeps) {
    $deps = $propertyDeps[$property];
    if ($deps.length) {
      out += ' if ( ' + ($data) + (it.util.getProperty($property)) + ' !== undefined ';
      if ($ownProperties) {
        out += ' && Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($property)) + '\') ';
      }
      if ($breakOnError) {
        out += ' && ( ';
        var arr1 = $deps;
        if (arr1) {
          var $propertyKey, $i = -1,
            l1 = arr1.length - 1;
          while ($i < l1) {
            $propertyKey = arr1[$i += 1];
            if ($i) {
              out += ' || ';
            }
            var $prop = it.util.getProperty($propertyKey),
              $useData = $data + $prop;
            out += ' ( ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') && (missing' + ($lvl) + ' = ' + (it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop)) + ') ) ';
          }
        }
        out += ')) {  ';
        var $propertyPath = 'missing' + $lvl,
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + ' + ' + $propertyPath;
        }
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('dependencies') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { property: \'' + (it.util.escapeQuotes($property)) + '\', missingProperty: \'' + ($missingProperty) + '\', depsCount: ' + ($deps.length) + ', deps: \'' + (it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", "))) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'should have ';
            if ($deps.length == 1) {
              out += 'property ' + (it.util.escapeQuotes($deps[0]));
            } else {
              out += 'properties ' + (it.util.escapeQuotes($deps.join(", ")));
            }
            out += ' when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
      } else {
        out += ' ) { ';
        var arr2 = $deps;
        if (arr2) {
          var $propertyKey, i2 = -1,
            l2 = arr2.length - 1;
          while (i2 < l2) {
            $propertyKey = arr2[i2 += 1];
            var $prop = it.util.getProperty($propertyKey),
              $missingProperty = it.util.escapeQuotes($propertyKey),
              $useData = $data + $prop;
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
            }
            out += ' if ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') {  var err =   '; /* istanbul ignore else */
            if (it.createErrors !== false) {
              out += ' { keyword: \'' + ('dependencies') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { property: \'' + (it.util.escapeQuotes($property)) + '\', missingProperty: \'' + ($missingProperty) + '\', depsCount: ' + ($deps.length) + ', deps: \'' + (it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", "))) + '\' } ';
              if (it.opts.messages !== false) {
                out += ' , message: \'should have ';
                if ($deps.length == 1) {
                  out += 'property ' + (it.util.escapeQuotes($deps[0]));
                } else {
                  out += 'properties ' + (it.util.escapeQuotes($deps.join(", ")));
                }
                out += ' when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
              }
              if (it.opts.verbose) {
                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
              }
              out += ' } ';
            } else {
              out += ' {} ';
            }
            out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
          }
        }
      }
      out += ' }   ';
      if ($breakOnError) {
        $closingBraces += '}';
        out += ' else { ';
      }
    }
  }
  it.errorPath = $currentErrorPath;
  var $currentBaseId = $it.baseId;
  for (var $property in $schemaDeps) {
    var $sch = $schemaDeps[$property];
    if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
      out += ' ' + ($nextValid) + ' = true; if ( ' + ($data) + (it.util.getProperty($property)) + ' !== undefined ';
      if ($ownProperties) {
        out += ' && Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($property)) + '\') ';
      }
      out += ') { ';
      $it.schema = $sch;
      $it.schemaPath = $schemaPath + it.util.getProperty($property);
      $it.errSchemaPath = $errSchemaPath + '/' + it.util.escapeFragment($property);
      out += '  ' + (it.validate($it)) + ' ';
      $it.baseId = $currentBaseId;
      out += ' }  ';
      if ($breakOnError) {
        out += ' if (' + ($nextValid) + ') { ';
        $closingBraces += '}';
      }
    }
  }
  if ($breakOnError) {
    out += '   ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
};

var _enum = function generate_enum(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
  }
  var $i = 'i' + $lvl,
    $vSchema = 'schema' + $lvl;
  if (!$isData) {
    out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + ';';
  }
  out += 'var ' + ($valid) + ';';
  if ($isData) {
    out += ' if (schema' + ($lvl) + ' === undefined) ' + ($valid) + ' = true; else if (!Array.isArray(schema' + ($lvl) + ')) ' + ($valid) + ' = false; else {';
  }
  out += '' + ($valid) + ' = false;for (var ' + ($i) + '=0; ' + ($i) + '<' + ($vSchema) + '.length; ' + ($i) + '++) if (equal(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + '])) { ' + ($valid) + ' = true; break; }';
  if ($isData) {
    out += '  }  ';
  }
  out += ' if (!' + ($valid) + ') {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('enum') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { allowedValues: schema' + ($lvl) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be equal to one of the allowed values\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' }';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var format$1 = function generate_format(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  if (it.opts.format === false) {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
    return out;
  }
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $unknownFormats = it.opts.unknownFormats,
    $allowUnknown = Array.isArray($unknownFormats);
  if ($isData) {
    var $format = 'format' + $lvl,
      $isObject = 'isObject' + $lvl,
      $formatType = 'formatType' + $lvl;
    out += ' var ' + ($format) + ' = formats[' + ($schemaValue) + ']; var ' + ($isObject) + ' = typeof ' + ($format) + ' == \'object\' && !(' + ($format) + ' instanceof RegExp) && ' + ($format) + '.validate; var ' + ($formatType) + ' = ' + ($isObject) + ' && ' + ($format) + '.type || \'string\'; if (' + ($isObject) + ') { ';
    if (it.async) {
      out += ' var async' + ($lvl) + ' = ' + ($format) + '.async; ';
    }
    out += ' ' + ($format) + ' = ' + ($format) + '.validate; } if (  ';
    if ($isData) {
      out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'string\') || ';
    }
    out += ' (';
    if ($unknownFormats != 'ignore') {
      out += ' (' + ($schemaValue) + ' && !' + ($format) + ' ';
      if ($allowUnknown) {
        out += ' && self._opts.unknownFormats.indexOf(' + ($schemaValue) + ') == -1 ';
      }
      out += ') || ';
    }
    out += ' (' + ($format) + ' && ' + ($formatType) + ' == \'' + ($ruleType) + '\' && !(typeof ' + ($format) + ' == \'function\' ? ';
    if (it.async) {
      out += ' (async' + ($lvl) + ' ? await ' + ($format) + '(' + ($data) + ') : ' + ($format) + '(' + ($data) + ')) ';
    } else {
      out += ' ' + ($format) + '(' + ($data) + ') ';
    }
    out += ' : ' + ($format) + '.test(' + ($data) + '))))) {';
  } else {
    var $format = it.formats[$schema];
    if (!$format) {
      if ($unknownFormats == 'ignore') {
        it.logger.warn('unknown format "' + $schema + '" ignored in schema at path "' + it.errSchemaPath + '"');
        if ($breakOnError) {
          out += ' if (true) { ';
        }
        return out;
      } else if ($allowUnknown && $unknownFormats.indexOf($schema) >= 0) {
        if ($breakOnError) {
          out += ' if (true) { ';
        }
        return out;
      } else {
        throw new Error('unknown format "' + $schema + '" is used in schema at path "' + it.errSchemaPath + '"');
      }
    }
    var $isObject = typeof $format == 'object' && !($format instanceof RegExp) && $format.validate;
    var $formatType = $isObject && $format.type || 'string';
    if ($isObject) {
      var $async = $format.async === true;
      $format = $format.validate;
    }
    if ($formatType != $ruleType) {
      if ($breakOnError) {
        out += ' if (true) { ';
      }
      return out;
    }
    if ($async) {
      if (!it.async) throw new Error('async format in sync schema');
      var $formatRef = 'formats' + it.util.getProperty($schema) + '.validate';
      out += ' if (!(await ' + ($formatRef) + '(' + ($data) + '))) { ';
    } else {
      out += ' if (! ';
      var $formatRef = 'formats' + it.util.getProperty($schema);
      if ($isObject) $formatRef += '.validate';
      if (typeof $format == 'function') {
        out += ' ' + ($formatRef) + '(' + ($data) + ') ';
      } else {
        out += ' ' + ($formatRef) + '.test(' + ($data) + ') ';
      }
      out += ') { ';
    }
  }
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('format') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { format:  ';
    if ($isData) {
      out += '' + ($schemaValue);
    } else {
      out += '' + (it.util.toQuotedString($schema));
    }
    out += '  } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should match format "';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + (it.util.escapeQuotes($schema));
      }
      out += '"\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + (it.util.toQuotedString($schema));
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' } ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var _if = function generate_if(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $thenSch = it.schema['then'],
    $elseSch = it.schema['else'],
    $thenPresent = $thenSch !== undefined && (it.opts.strictKeywords ? (typeof $thenSch == 'object' && Object.keys($thenSch).length > 0) || $thenSch === false : it.util.schemaHasRules($thenSch, it.RULES.all)),
    $elsePresent = $elseSch !== undefined && (it.opts.strictKeywords ? (typeof $elseSch == 'object' && Object.keys($elseSch).length > 0) || $elseSch === false : it.util.schemaHasRules($elseSch, it.RULES.all)),
    $currentBaseId = $it.baseId;
  if ($thenPresent || $elsePresent) {
    var $ifClause;
    $it.createErrors = false;
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += ' var ' + ($errs) + ' = errors; var ' + ($valid) + ' = true;  ';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    out += '  ' + (it.validate($it)) + ' ';
    $it.baseId = $currentBaseId;
    $it.createErrors = true;
    out += '  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; }  ';
    it.compositeRule = $it.compositeRule = $wasComposite;
    if ($thenPresent) {
      out += ' if (' + ($nextValid) + ') {  ';
      $it.schema = it.schema['then'];
      $it.schemaPath = it.schemaPath + '.then';
      $it.errSchemaPath = it.errSchemaPath + '/then';
      out += '  ' + (it.validate($it)) + ' ';
      $it.baseId = $currentBaseId;
      out += ' ' + ($valid) + ' = ' + ($nextValid) + '; ';
      if ($thenPresent && $elsePresent) {
        $ifClause = 'ifClause' + $lvl;
        out += ' var ' + ($ifClause) + ' = \'then\'; ';
      } else {
        $ifClause = '\'then\'';
      }
      out += ' } ';
      if ($elsePresent) {
        out += ' else { ';
      }
    } else {
      out += ' if (!' + ($nextValid) + ') { ';
    }
    if ($elsePresent) {
      $it.schema = it.schema['else'];
      $it.schemaPath = it.schemaPath + '.else';
      $it.errSchemaPath = it.errSchemaPath + '/else';
      out += '  ' + (it.validate($it)) + ' ';
      $it.baseId = $currentBaseId;
      out += ' ' + ($valid) + ' = ' + ($nextValid) + '; ';
      if ($thenPresent && $elsePresent) {
        $ifClause = 'ifClause' + $lvl;
        out += ' var ' + ($ifClause) + ' = \'else\'; ';
      } else {
        $ifClause = '\'else\'';
      }
      out += ' } ';
    }
    out += ' if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('if') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { failingKeyword: ' + ($ifClause) + ' } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should match "\' + ' + ($ifClause) + ' + \'" schema\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError(vErrors); ';
      } else {
        out += ' validate.errors = vErrors; return false; ';
      }
    }
    out += ' }   ';
    if ($breakOnError) {
      out += ' else { ';
    }
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
};

var items = function generate_items(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $idx = 'i' + $lvl,
    $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt,
    $currentBaseId = it.baseId;
  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
  if (Array.isArray($schema)) {
    var $additionalItems = it.schema.additionalItems;
    if ($additionalItems === false) {
      out += ' ' + ($valid) + ' = ' + ($data) + '.length <= ' + ($schema.length) + '; ';
      var $currErrSchemaPath = $errSchemaPath;
      $errSchemaPath = it.errSchemaPath + '/additionalItems';
      out += '  if (!' + ($valid) + ') {   ';
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = ''; /* istanbul ignore else */
      if (it.createErrors !== false) {
        out += ' { keyword: \'' + ('additionalItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schema.length) + ' } ';
        if (it.opts.messages !== false) {
          out += ' , message: \'should NOT have more than ' + ($schema.length) + ' items\' ';
        }
        if (it.opts.verbose) {
          out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
        }
        out += ' } ';
      } else {
        out += ' {} ';
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        /* istanbul ignore if */
        if (it.async) {
          out += ' throw new ValidationError([' + (__err) + ']); ';
        } else {
          out += ' validate.errors = [' + (__err) + ']; return false; ';
        }
      } else {
        out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      }
      out += ' } ';
      $errSchemaPath = $currErrSchemaPath;
      if ($breakOnError) {
        $closingBraces += '}';
        out += ' else { ';
      }
    }
    var arr1 = $schema;
    if (arr1) {
      var $sch, $i = -1,
        l1 = arr1.length - 1;
      while ($i < l1) {
        $sch = arr1[$i += 1];
        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
          out += ' ' + ($nextValid) + ' = true; if (' + ($data) + '.length > ' + ($i) + ') { ';
          var $passData = $data + '[' + $i + ']';
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + '[' + $i + ']';
          $it.errSchemaPath = $errSchemaPath + '/' + $i;
          $it.errorPath = it.util.getPathExpr(it.errorPath, $i, it.opts.jsonPointers, true);
          $it.dataPathArr[$dataNxt] = $i;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          out += ' }  ';
          if ($breakOnError) {
            out += ' if (' + ($nextValid) + ') { ';
            $closingBraces += '}';
          }
        }
      }
    }
    if (typeof $additionalItems == 'object' && (it.opts.strictKeywords ? (typeof $additionalItems == 'object' && Object.keys($additionalItems).length > 0) || $additionalItems === false : it.util.schemaHasRules($additionalItems, it.RULES.all))) {
      $it.schema = $additionalItems;
      $it.schemaPath = it.schemaPath + '.additionalItems';
      $it.errSchemaPath = it.errSchemaPath + '/additionalItems';
      out += ' ' + ($nextValid) + ' = true; if (' + ($data) + '.length > ' + ($schema.length) + ') {  for (var ' + ($idx) + ' = ' + ($schema.length) + '; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
      $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
      var $passData = $data + '[' + $idx + ']';
      $it.dataPathArr[$dataNxt] = $idx;
      var $code = it.validate($it);
      $it.baseId = $currentBaseId;
      if (it.util.varOccurences($code, $nextData) < 2) {
        out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
      } else {
        out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
      }
      if ($breakOnError) {
        out += ' if (!' + ($nextValid) + ') break; ';
      }
      out += ' } }  ';
      if ($breakOnError) {
        out += ' if (' + ($nextValid) + ') { ';
        $closingBraces += '}';
      }
    }
  } else if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += '  for (var ' + ($idx) + ' = ' + (0) + '; ' + ($idx) + ' < ' + ($data) + '.length; ' + ($idx) + '++) { ';
    $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
    var $passData = $data + '[' + $idx + ']';
    $it.dataPathArr[$dataNxt] = $idx;
    var $code = it.validate($it);
    $it.baseId = $currentBaseId;
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    if ($breakOnError) {
      out += ' if (!' + ($nextValid) + ') break; ';
    }
    out += ' }';
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
};

var _limit = function generate__limit(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $isMax = $keyword == 'maximum',
    $exclusiveKeyword = $isMax ? 'exclusiveMaximum' : 'exclusiveMinimum',
    $schemaExcl = it.schema[$exclusiveKeyword],
    $isDataExcl = it.opts.$data && $schemaExcl && $schemaExcl.$data,
    $op = $isMax ? '<' : '>',
    $notOp = $isMax ? '>' : '<',
    $errorKeyword = undefined;
  if (!($isData || typeof $schema == 'number' || $schema === undefined)) {
    throw new Error($keyword + ' must be number');
  }
  if (!($isDataExcl || $schemaExcl === undefined || typeof $schemaExcl == 'number' || typeof $schemaExcl == 'boolean')) {
    throw new Error($exclusiveKeyword + ' must be number or boolean');
  }
  if ($isDataExcl) {
    var $schemaValueExcl = it.util.getData($schemaExcl.$data, $dataLvl, it.dataPathArr),
      $exclusive = 'exclusive' + $lvl,
      $exclType = 'exclType' + $lvl,
      $exclIsNumber = 'exclIsNumber' + $lvl,
      $opExpr = 'op' + $lvl,
      $opStr = '\' + ' + $opExpr + ' + \'';
    out += ' var schemaExcl' + ($lvl) + ' = ' + ($schemaValueExcl) + '; ';
    $schemaValueExcl = 'schemaExcl' + $lvl;
    out += ' var ' + ($exclusive) + '; var ' + ($exclType) + ' = typeof ' + ($schemaValueExcl) + '; if (' + ($exclType) + ' != \'boolean\' && ' + ($exclType) + ' != \'undefined\' && ' + ($exclType) + ' != \'number\') { ';
    var $errorKeyword = $exclusiveKeyword;
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ($errorKeyword || '_exclusiveLimit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'' + ($exclusiveKeyword) + ' should be boolean\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } else if ( ';
    if ($isData) {
      out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
    }
    out += ' ' + ($exclType) + ' == \'number\' ? ( (' + ($exclusive) + ' = ' + ($schemaValue) + ' === undefined || ' + ($schemaValueExcl) + ' ' + ($op) + '= ' + ($schemaValue) + ') ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaValueExcl) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) : ( (' + ($exclusive) + ' = ' + ($schemaValueExcl) + ' === true) ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaValue) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) || ' + ($data) + ' !== ' + ($data) + ') { var op' + ($lvl) + ' = ' + ($exclusive) + ' ? \'' + ($op) + '\' : \'' + ($op) + '=\'; ';
    if ($schema === undefined) {
      $errorKeyword = $exclusiveKeyword;
      $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
      $schemaValue = $schemaValueExcl;
      $isData = $isDataExcl;
    }
  } else {
    var $exclIsNumber = typeof $schemaExcl == 'number',
      $opStr = $op;
    if ($exclIsNumber && $isData) {
      var $opExpr = '\'' + $opStr + '\'';
      out += ' if ( ';
      if ($isData) {
        out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
      }
      out += ' ( ' + ($schemaValue) + ' === undefined || ' + ($schemaExcl) + ' ' + ($op) + '= ' + ($schemaValue) + ' ? ' + ($data) + ' ' + ($notOp) + '= ' + ($schemaExcl) + ' : ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' ) || ' + ($data) + ' !== ' + ($data) + ') { ';
    } else {
      if ($exclIsNumber && $schema === undefined) {
        $exclusive = true;
        $errorKeyword = $exclusiveKeyword;
        $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
        $schemaValue = $schemaExcl;
        $notOp += '=';
      } else {
        if ($exclIsNumber) $schemaValue = Math[$isMax ? 'min' : 'max']($schemaExcl, $schema);
        if ($schemaExcl === ($exclIsNumber ? $schemaValue : true)) {
          $exclusive = true;
          $errorKeyword = $exclusiveKeyword;
          $errSchemaPath = it.errSchemaPath + '/' + $exclusiveKeyword;
          $notOp += '=';
        } else {
          $exclusive = false;
          $opStr += '=';
        }
      }
      var $opExpr = '\'' + $opStr + '\'';
      out += ' if ( ';
      if ($isData) {
        out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
      }
      out += ' ' + ($data) + ' ' + ($notOp) + ' ' + ($schemaValue) + ' || ' + ($data) + ' !== ' + ($data) + ') { ';
    }
  }
  $errorKeyword = $errorKeyword || $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limit') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { comparison: ' + ($opExpr) + ', limit: ' + ($schemaValue) + ', exclusive: ' + ($exclusive) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be ' + ($opStr) + ' ';
      if ($isData) {
        out += '\' + ' + ($schemaValue);
      } else {
        out += '' + ($schemaValue) + '\'';
      }
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += ' } ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var _limitItems = function generate__limitItems(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  var $op = $keyword == 'maxItems' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  out += ' ' + ($data) + '.length ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT have ';
      if ($keyword == 'maxItems') {
        out += 'more';
      } else {
        out += 'fewer';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' items\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var _limitLength = function generate__limitLength(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  var $op = $keyword == 'maxLength' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  if (it.opts.unicode === false) {
    out += ' ' + ($data) + '.length ';
  } else {
    out += ' ucs2length(' + ($data) + ') ';
  }
  out += ' ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitLength') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT be ';
      if ($keyword == 'maxLength') {
        out += 'longer';
      } else {
        out += 'shorter';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' characters\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var _limitProperties = function generate__limitProperties(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  var $op = $keyword == 'maxProperties' ? '>' : '<';
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'number\') || ';
  }
  out += ' Object.keys(' + ($data) + ').length ' + ($op) + ' ' + ($schemaValue) + ') { ';
  var $errorKeyword = $keyword;
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ($errorKeyword || '_limitProperties') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { limit: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should NOT have ';
      if ($keyword == 'maxProperties') {
        out += 'more';
      } else {
        out += 'fewer';
      }
      out += ' than ';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + ($schema);
      }
      out += ' properties\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var multipleOf = function generate_multipleOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (!($isData || typeof $schema == 'number')) {
    throw new Error($keyword + ' must be number');
  }
  out += 'var division' + ($lvl) + ';if (';
  if ($isData) {
    out += ' ' + ($schemaValue) + ' !== undefined && ( typeof ' + ($schemaValue) + ' != \'number\' || ';
  }
  out += ' (division' + ($lvl) + ' = ' + ($data) + ' / ' + ($schemaValue) + ', ';
  if (it.opts.multipleOfPrecision) {
    out += ' Math.abs(Math.round(division' + ($lvl) + ') - division' + ($lvl) + ') > 1e-' + (it.opts.multipleOfPrecision) + ' ';
  } else {
    out += ' division' + ($lvl) + ' !== parseInt(division' + ($lvl) + ') ';
  }
  out += ' ) ';
  if ($isData) {
    out += '  )  ';
  }
  out += ' ) {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('multipleOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { multipleOf: ' + ($schemaValue) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should be multiple of ';
      if ($isData) {
        out += '\' + ' + ($schemaValue);
      } else {
        out += '' + ($schemaValue) + '\'';
      }
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + ($schema);
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var not = function generate_not(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    out += ' var ' + ($errs) + ' = errors;  ';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    $it.createErrors = false;
    var $allErrorsOption;
    if ($it.opts.allErrors) {
      $allErrorsOption = $it.opts.allErrors;
      $it.opts.allErrors = false;
    }
    out += ' ' + (it.validate($it)) + ' ';
    $it.createErrors = true;
    if ($allErrorsOption) $it.opts.allErrors = $allErrorsOption;
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' if (' + ($nextValid) + ') {   ';
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('not') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should NOT be valid\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
    if (it.opts.allErrors) {
      out += ' } ';
    }
  } else {
    out += '  var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('not') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: {} ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should NOT be valid\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if ($breakOnError) {
      out += ' if (false) { ';
    }
  }
  return out;
};

var oneOf = function generate_oneOf(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $currentBaseId = $it.baseId,
    $prevValid = 'prevValid' + $lvl,
    $passingSchemas = 'passingSchemas' + $lvl;
  out += 'var ' + ($errs) + ' = errors , ' + ($prevValid) + ' = false , ' + ($valid) + ' = false , ' + ($passingSchemas) + ' = null; ';
  var $wasComposite = it.compositeRule;
  it.compositeRule = $it.compositeRule = true;
  var arr1 = $schema;
  if (arr1) {
    var $sch, $i = -1,
      l1 = arr1.length - 1;
    while ($i < l1) {
      $sch = arr1[$i += 1];
      if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        $it.errSchemaPath = $errSchemaPath + '/' + $i;
        out += '  ' + (it.validate($it)) + ' ';
        $it.baseId = $currentBaseId;
      } else {
        out += ' var ' + ($nextValid) + ' = true; ';
      }
      if ($i) {
        out += ' if (' + ($nextValid) + ' && ' + ($prevValid) + ') { ' + ($valid) + ' = false; ' + ($passingSchemas) + ' = [' + ($passingSchemas) + ', ' + ($i) + ']; } else { ';
        $closingBraces += '}';
      }
      out += ' if (' + ($nextValid) + ') { ' + ($valid) + ' = ' + ($prevValid) + ' = true; ' + ($passingSchemas) + ' = ' + ($i) + '; }';
    }
  }
  it.compositeRule = $it.compositeRule = $wasComposite;
  out += '' + ($closingBraces) + 'if (!' + ($valid) + ') {   var err =   '; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('oneOf') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { passingSchemas: ' + ($passingSchemas) + ' } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should match exactly one schema in oneOf\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError(vErrors); ';
    } else {
      out += ' validate.errors = vErrors; return false; ';
    }
  }
  out += '} else {  errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; }';
  if (it.opts.allErrors) {
    out += ' } ';
  }
  return out;
};

var pattern$2 = function generate_pattern(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $regexp = $isData ? '(new RegExp(' + $schemaValue + '))' : it.usePattern($schema);
  out += 'if ( ';
  if ($isData) {
    out += ' (' + ($schemaValue) + ' !== undefined && typeof ' + ($schemaValue) + ' != \'string\') || ';
  }
  out += ' !' + ($regexp) + '.test(' + ($data) + ') ) {   ';
  var $$outStack = $$outStack || [];
  $$outStack.push(out);
  out = ''; /* istanbul ignore else */
  if (it.createErrors !== false) {
    out += ' { keyword: \'' + ('pattern') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { pattern:  ';
    if ($isData) {
      out += '' + ($schemaValue);
    } else {
      out += '' + (it.util.toQuotedString($schema));
    }
    out += '  } ';
    if (it.opts.messages !== false) {
      out += ' , message: \'should match pattern "';
      if ($isData) {
        out += '\' + ' + ($schemaValue) + ' + \'';
      } else {
        out += '' + (it.util.escapeQuotes($schema));
      }
      out += '"\' ';
    }
    if (it.opts.verbose) {
      out += ' , schema:  ';
      if ($isData) {
        out += 'validate.schema' + ($schemaPath);
      } else {
        out += '' + (it.util.toQuotedString($schema));
      }
      out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
    }
    out += ' } ';
  } else {
    out += ' {} ';
  }
  var __err = out;
  out = $$outStack.pop();
  if (!it.compositeRule && $breakOnError) {
    /* istanbul ignore if */
    if (it.async) {
      out += ' throw new ValidationError([' + (__err) + ']); ';
    } else {
      out += ' validate.errors = [' + (__err) + ']; return false; ';
    }
  } else {
    out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
};

var properties$2 = function generate_properties(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  var $key = 'key' + $lvl,
    $idx = 'idx' + $lvl,
    $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt,
    $dataProperties = 'dataProperties' + $lvl;
  var $schemaKeys = Object.keys($schema || {}).filter(notProto),
    $pProperties = it.schema.patternProperties || {},
    $pPropertyKeys = Object.keys($pProperties).filter(notProto),
    $aProperties = it.schema.additionalProperties,
    $someProperties = $schemaKeys.length || $pPropertyKeys.length,
    $noAdditional = $aProperties === false,
    $additionalIsSchema = typeof $aProperties == 'object' && Object.keys($aProperties).length,
    $removeAdditional = it.opts.removeAdditional,
    $checkAdditional = $noAdditional || $additionalIsSchema || $removeAdditional,
    $ownProperties = it.opts.ownProperties,
    $currentBaseId = it.baseId;
  var $required = it.schema.required;
  if ($required && !(it.opts.$data && $required.$data) && $required.length < it.opts.loopRequired) {
    var $requiredHash = it.util.toHash($required);
  }

  function notProto(p) {
    return p !== '__proto__';
  }
  out += 'var ' + ($errs) + ' = errors;var ' + ($nextValid) + ' = true;';
  if ($ownProperties) {
    out += ' var ' + ($dataProperties) + ' = undefined;';
  }
  if ($checkAdditional) {
    if ($ownProperties) {
      out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
    } else {
      out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
    }
    if ($someProperties) {
      out += ' var isAdditional' + ($lvl) + ' = !(false ';
      if ($schemaKeys.length) {
        if ($schemaKeys.length > 8) {
          out += ' || validate.schema' + ($schemaPath) + '.hasOwnProperty(' + ($key) + ') ';
        } else {
          var arr1 = $schemaKeys;
          if (arr1) {
            var $propertyKey, i1 = -1,
              l1 = arr1.length - 1;
            while (i1 < l1) {
              $propertyKey = arr1[i1 += 1];
              out += ' || ' + ($key) + ' == ' + (it.util.toQuotedString($propertyKey)) + ' ';
            }
          }
        }
      }
      if ($pPropertyKeys.length) {
        var arr2 = $pPropertyKeys;
        if (arr2) {
          var $pProperty, $i = -1,
            l2 = arr2.length - 1;
          while ($i < l2) {
            $pProperty = arr2[$i += 1];
            out += ' || ' + (it.usePattern($pProperty)) + '.test(' + ($key) + ') ';
          }
        }
      }
      out += ' ); if (isAdditional' + ($lvl) + ') { ';
    }
    if ($removeAdditional == 'all') {
      out += ' delete ' + ($data) + '[' + ($key) + ']; ';
    } else {
      var $currentErrorPath = it.errorPath;
      var $additionalProperty = '\' + ' + $key + ' + \'';
      if (it.opts._errorDataPathProperty) {
        it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
      }
      if ($noAdditional) {
        if ($removeAdditional) {
          out += ' delete ' + ($data) + '[' + ($key) + ']; ';
        } else {
          out += ' ' + ($nextValid) + ' = false; ';
          var $currErrSchemaPath = $errSchemaPath;
          $errSchemaPath = it.errSchemaPath + '/additionalProperties';
          var $$outStack = $$outStack || [];
          $$outStack.push(out);
          out = ''; /* istanbul ignore else */
          if (it.createErrors !== false) {
            out += ' { keyword: \'' + ('additionalProperties') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { additionalProperty: \'' + ($additionalProperty) + '\' } ';
            if (it.opts.messages !== false) {
              out += ' , message: \'';
              if (it.opts._errorDataPathProperty) {
                out += 'is an invalid additional property';
              } else {
                out += 'should NOT have additional properties';
              }
              out += '\' ';
            }
            if (it.opts.verbose) {
              out += ' , schema: false , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
            }
            out += ' } ';
          } else {
            out += ' {} ';
          }
          var __err = out;
          out = $$outStack.pop();
          if (!it.compositeRule && $breakOnError) {
            /* istanbul ignore if */
            if (it.async) {
              out += ' throw new ValidationError([' + (__err) + ']); ';
            } else {
              out += ' validate.errors = [' + (__err) + ']; return false; ';
            }
          } else {
            out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
          }
          $errSchemaPath = $currErrSchemaPath;
          if ($breakOnError) {
            out += ' break; ';
          }
        }
      } else if ($additionalIsSchema) {
        if ($removeAdditional == 'failing') {
          out += ' var ' + ($errs) + ' = errors;  ';
          var $wasComposite = it.compositeRule;
          it.compositeRule = $it.compositeRule = true;
          $it.schema = $aProperties;
          $it.schemaPath = it.schemaPath + '.additionalProperties';
          $it.errSchemaPath = it.errSchemaPath + '/additionalProperties';
          $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
          var $passData = $data + '[' + $key + ']';
          $it.dataPathArr[$dataNxt] = $key;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          out += ' if (!' + ($nextValid) + ') { errors = ' + ($errs) + '; if (validate.errors !== null) { if (errors) validate.errors.length = errors; else validate.errors = null; } delete ' + ($data) + '[' + ($key) + ']; }  ';
          it.compositeRule = $it.compositeRule = $wasComposite;
        } else {
          $it.schema = $aProperties;
          $it.schemaPath = it.schemaPath + '.additionalProperties';
          $it.errSchemaPath = it.errSchemaPath + '/additionalProperties';
          $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
          var $passData = $data + '[' + $key + ']';
          $it.dataPathArr[$dataNxt] = $key;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          if ($breakOnError) {
            out += ' if (!' + ($nextValid) + ') break; ';
          }
        }
      }
      it.errorPath = $currentErrorPath;
    }
    if ($someProperties) {
      out += ' } ';
    }
    out += ' }  ';
    if ($breakOnError) {
      out += ' if (' + ($nextValid) + ') { ';
      $closingBraces += '}';
    }
  }
  var $useDefaults = it.opts.useDefaults && !it.compositeRule;
  if ($schemaKeys.length) {
    var arr3 = $schemaKeys;
    if (arr3) {
      var $propertyKey, i3 = -1,
        l3 = arr3.length - 1;
      while (i3 < l3) {
        $propertyKey = arr3[i3 += 1];
        var $sch = $schema[$propertyKey];
        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
          var $prop = it.util.getProperty($propertyKey),
            $passData = $data + $prop,
            $hasDefault = $useDefaults && $sch.default !== undefined;
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + $prop;
          $it.errSchemaPath = $errSchemaPath + '/' + it.util.escapeFragment($propertyKey);
          $it.errorPath = it.util.getPath(it.errorPath, $propertyKey, it.opts.jsonPointers);
          $it.dataPathArr[$dataNxt] = it.util.toQuotedString($propertyKey);
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            $code = it.util.varReplace($code, $nextData, $passData);
            var $useData = $passData;
          } else {
            var $useData = $nextData;
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ';
          }
          if ($hasDefault) {
            out += ' ' + ($code) + ' ';
          } else {
            if ($requiredHash && $requiredHash[$propertyKey]) {
              out += ' if ( ' + ($useData) + ' === undefined ';
              if ($ownProperties) {
                out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
              }
              out += ') { ' + ($nextValid) + ' = false; ';
              var $currentErrorPath = it.errorPath,
                $currErrSchemaPath = $errSchemaPath,
                $missingProperty = it.util.escapeQuotes($propertyKey);
              if (it.opts._errorDataPathProperty) {
                it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
              }
              $errSchemaPath = it.errSchemaPath + '/required';
              var $$outStack = $$outStack || [];
              $$outStack.push(out);
              out = ''; /* istanbul ignore else */
              if (it.createErrors !== false) {
                out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
                if (it.opts.messages !== false) {
                  out += ' , message: \'';
                  if (it.opts._errorDataPathProperty) {
                    out += 'is a required property';
                  } else {
                    out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
                  }
                  out += '\' ';
                }
                if (it.opts.verbose) {
                  out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
                }
                out += ' } ';
              } else {
                out += ' {} ';
              }
              var __err = out;
              out = $$outStack.pop();
              if (!it.compositeRule && $breakOnError) {
                /* istanbul ignore if */
                if (it.async) {
                  out += ' throw new ValidationError([' + (__err) + ']); ';
                } else {
                  out += ' validate.errors = [' + (__err) + ']; return false; ';
                }
              } else {
                out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
              }
              $errSchemaPath = $currErrSchemaPath;
              it.errorPath = $currentErrorPath;
              out += ' } else { ';
            } else {
              if ($breakOnError) {
                out += ' if ( ' + ($useData) + ' === undefined ';
                if ($ownProperties) {
                  out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
                }
                out += ') { ' + ($nextValid) + ' = true; } else { ';
              } else {
                out += ' if (' + ($useData) + ' !== undefined ';
                if ($ownProperties) {
                  out += ' &&   Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
                }
                out += ' ) { ';
              }
            }
            out += ' ' + ($code) + ' } ';
          }
        }
        if ($breakOnError) {
          out += ' if (' + ($nextValid) + ') { ';
          $closingBraces += '}';
        }
      }
    }
  }
  if ($pPropertyKeys.length) {
    var arr4 = $pPropertyKeys;
    if (arr4) {
      var $pProperty, i4 = -1,
        l4 = arr4.length - 1;
      while (i4 < l4) {
        $pProperty = arr4[i4 += 1];
        var $sch = $pProperties[$pProperty];
        if ((it.opts.strictKeywords ? (typeof $sch == 'object' && Object.keys($sch).length > 0) || $sch === false : it.util.schemaHasRules($sch, it.RULES.all))) {
          $it.schema = $sch;
          $it.schemaPath = it.schemaPath + '.patternProperties' + it.util.getProperty($pProperty);
          $it.errSchemaPath = it.errSchemaPath + '/patternProperties/' + it.util.escapeFragment($pProperty);
          if ($ownProperties) {
            out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
          } else {
            out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
          }
          out += ' if (' + (it.usePattern($pProperty)) + '.test(' + ($key) + ')) { ';
          $it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
          var $passData = $data + '[' + $key + ']';
          $it.dataPathArr[$dataNxt] = $key;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          if ($breakOnError) {
            out += ' if (!' + ($nextValid) + ') break; ';
          }
          out += ' } ';
          if ($breakOnError) {
            out += ' else ' + ($nextValid) + ' = true; ';
          }
          out += ' }  ';
          if ($breakOnError) {
            out += ' if (' + ($nextValid) + ') { ';
            $closingBraces += '}';
          }
        }
      }
    }
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
};

var propertyNames = function generate_propertyNames(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $errs = 'errs__' + $lvl;
  var $it = it.util.copy(it);
  var $closingBraces = '';
  $it.level++;
  var $nextValid = 'valid' + $it.level;
  out += 'var ' + ($errs) + ' = errors;';
  if ((it.opts.strictKeywords ? (typeof $schema == 'object' && Object.keys($schema).length > 0) || $schema === false : it.util.schemaHasRules($schema, it.RULES.all))) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    $it.errSchemaPath = $errSchemaPath;
    var $key = 'key' + $lvl,
      $idx = 'idx' + $lvl,
      $i = 'i' + $lvl,
      $invalidName = '\' + ' + $key + ' + \'',
      $dataNxt = $it.dataLevel = it.dataLevel + 1,
      $nextData = 'data' + $dataNxt,
      $dataProperties = 'dataProperties' + $lvl,
      $ownProperties = it.opts.ownProperties,
      $currentBaseId = it.baseId;
    if ($ownProperties) {
      out += ' var ' + ($dataProperties) + ' = undefined; ';
    }
    if ($ownProperties) {
      out += ' ' + ($dataProperties) + ' = ' + ($dataProperties) + ' || Object.keys(' + ($data) + '); for (var ' + ($idx) + '=0; ' + ($idx) + '<' + ($dataProperties) + '.length; ' + ($idx) + '++) { var ' + ($key) + ' = ' + ($dataProperties) + '[' + ($idx) + ']; ';
    } else {
      out += ' for (var ' + ($key) + ' in ' + ($data) + ') { ';
    }
    out += ' var startErrs' + ($lvl) + ' = errors; ';
    var $passData = $key;
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    var $code = it.validate($it);
    $it.baseId = $currentBaseId;
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' if (!' + ($nextValid) + ') { for (var ' + ($i) + '=startErrs' + ($lvl) + '; ' + ($i) + '<errors; ' + ($i) + '++) { vErrors[' + ($i) + '].propertyName = ' + ($key) + '; }   var err =   '; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('propertyNames') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { propertyName: \'' + ($invalidName) + '\' } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'property name \\\'' + ($invalidName) + '\\\' is invalid\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError(vErrors); ';
      } else {
        out += ' validate.errors = vErrors; return false; ';
      }
    }
    if ($breakOnError) {
      out += ' break; ';
    }
    out += ' } }';
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  return out;
};

var required$1 = function generate_required(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
  }
  var $vSchema = 'schema' + $lvl;
  if (!$isData) {
    if ($schema.length < it.opts.loopRequired && it.schema.properties && Object.keys(it.schema.properties).length) {
      var $required = [];
      var arr1 = $schema;
      if (arr1) {
        var $property, i1 = -1,
          l1 = arr1.length - 1;
        while (i1 < l1) {
          $property = arr1[i1 += 1];
          var $propertySch = it.schema.properties[$property];
          if (!($propertySch && (it.opts.strictKeywords ? (typeof $propertySch == 'object' && Object.keys($propertySch).length > 0) || $propertySch === false : it.util.schemaHasRules($propertySch, it.RULES.all)))) {
            $required[$required.length] = $property;
          }
        }
      }
    } else {
      var $required = $schema;
    }
  }
  if ($isData || $required.length) {
    var $currentErrorPath = it.errorPath,
      $loopRequired = $isData || $required.length >= it.opts.loopRequired,
      $ownProperties = it.opts.ownProperties;
    if ($breakOnError) {
      out += ' var missing' + ($lvl) + '; ';
      if ($loopRequired) {
        if (!$isData) {
          out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + '; ';
        }
        var $i = 'i' + $lvl,
          $propertyPath = 'schema' + $lvl + '[' + $i + ']',
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
        }
        out += ' var ' + ($valid) + ' = true; ';
        if ($isData) {
          out += ' if (schema' + ($lvl) + ' === undefined) ' + ($valid) + ' = true; else if (!Array.isArray(schema' + ($lvl) + ')) ' + ($valid) + ' = false; else {';
        }
        out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < ' + ($vSchema) + '.length; ' + ($i) + '++) { ' + ($valid) + ' = ' + ($data) + '[' + ($vSchema) + '[' + ($i) + ']] !== undefined ';
        if ($ownProperties) {
          out += ' &&   Object.prototype.hasOwnProperty.call(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + ']) ';
        }
        out += '; if (!' + ($valid) + ') break; } ';
        if ($isData) {
          out += '  }  ';
        }
        out += '  if (!' + ($valid) + ') {   ';
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'';
            if (it.opts._errorDataPathProperty) {
              out += 'is a required property';
            } else {
              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        out += ' } else { ';
      } else {
        out += ' if ( ';
        var arr2 = $required;
        if (arr2) {
          var $propertyKey, $i = -1,
            l2 = arr2.length - 1;
          while ($i < l2) {
            $propertyKey = arr2[$i += 1];
            if ($i) {
              out += ' || ';
            }
            var $prop = it.util.getProperty($propertyKey),
              $useData = $data + $prop;
            out += ' ( ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') && (missing' + ($lvl) + ' = ' + (it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop)) + ') ) ';
          }
        }
        out += ') {  ';
        var $propertyPath = 'missing' + $lvl,
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + ' + ' + $propertyPath;
        }
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = ''; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'';
            if (it.opts._errorDataPathProperty) {
              out += 'is a required property';
            } else {
              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          /* istanbul ignore if */
          if (it.async) {
            out += ' throw new ValidationError([' + (__err) + ']); ';
          } else {
            out += ' validate.errors = [' + (__err) + ']; return false; ';
          }
        } else {
          out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        out += ' } else { ';
      }
    } else {
      if ($loopRequired) {
        if (!$isData) {
          out += ' var ' + ($vSchema) + ' = validate.schema' + ($schemaPath) + '; ';
        }
        var $i = 'i' + $lvl,
          $propertyPath = 'schema' + $lvl + '[' + $i + ']',
          $missingProperty = '\' + ' + $propertyPath + ' + \'';
        if (it.opts._errorDataPathProperty) {
          it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
        }
        if ($isData) {
          out += ' if (' + ($vSchema) + ' && !Array.isArray(' + ($vSchema) + ')) {  var err =   '; /* istanbul ignore else */
          if (it.createErrors !== false) {
            out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
            if (it.opts.messages !== false) {
              out += ' , message: \'';
              if (it.opts._errorDataPathProperty) {
                out += 'is a required property';
              } else {
                out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
              }
              out += '\' ';
            }
            if (it.opts.verbose) {
              out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
            }
            out += ' } ';
          } else {
            out += ' {} ';
          }
          out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } else if (' + ($vSchema) + ' !== undefined) { ';
        }
        out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < ' + ($vSchema) + '.length; ' + ($i) + '++) { if (' + ($data) + '[' + ($vSchema) + '[' + ($i) + ']] === undefined ';
        if ($ownProperties) {
          out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', ' + ($vSchema) + '[' + ($i) + ']) ';
        }
        out += ') {  var err =   '; /* istanbul ignore else */
        if (it.createErrors !== false) {
          out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
          if (it.opts.messages !== false) {
            out += ' , message: \'';
            if (it.opts._errorDataPathProperty) {
              out += 'is a required property';
            } else {
              out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
            }
            out += '\' ';
          }
          if (it.opts.verbose) {
            out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
          }
          out += ' } ';
        } else {
          out += ' {} ';
        }
        out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } } ';
        if ($isData) {
          out += '  }  ';
        }
      } else {
        var arr3 = $required;
        if (arr3) {
          var $propertyKey, i3 = -1,
            l3 = arr3.length - 1;
          while (i3 < l3) {
            $propertyKey = arr3[i3 += 1];
            var $prop = it.util.getProperty($propertyKey),
              $missingProperty = it.util.escapeQuotes($propertyKey),
              $useData = $data + $prop;
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
            }
            out += ' if ( ' + ($useData) + ' === undefined ';
            if ($ownProperties) {
              out += ' || ! Object.prototype.hasOwnProperty.call(' + ($data) + ', \'' + (it.util.escapeQuotes($propertyKey)) + '\') ';
            }
            out += ') {  var err =   '; /* istanbul ignore else */
            if (it.createErrors !== false) {
              out += ' { keyword: \'' + ('required') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { missingProperty: \'' + ($missingProperty) + '\' } ';
              if (it.opts.messages !== false) {
                out += ' , message: \'';
                if (it.opts._errorDataPathProperty) {
                  out += 'is a required property';
                } else {
                  out += 'should have required property \\\'' + ($missingProperty) + '\\\'';
                }
                out += '\' ';
              }
              if (it.opts.verbose) {
                out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
              }
              out += ' } ';
            } else {
              out += ' {} ';
            }
            out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
          }
        }
      }
    }
    it.errorPath = $currentErrorPath;
  } else if ($breakOnError) {
    out += ' if (true) {';
  }
  return out;
};

var uniqueItems = function generate_uniqueItems(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  if (($schema || $isData) && it.opts.uniqueItems !== false) {
    if ($isData) {
      out += ' var ' + ($valid) + '; if (' + ($schemaValue) + ' === false || ' + ($schemaValue) + ' === undefined) ' + ($valid) + ' = true; else if (typeof ' + ($schemaValue) + ' != \'boolean\') ' + ($valid) + ' = false; else { ';
    }
    out += ' var i = ' + ($data) + '.length , ' + ($valid) + ' = true , j; if (i > 1) { ';
    var $itemType = it.schema.items && it.schema.items.type,
      $typeIsArray = Array.isArray($itemType);
    if (!$itemType || $itemType == 'object' || $itemType == 'array' || ($typeIsArray && ($itemType.indexOf('object') >= 0 || $itemType.indexOf('array') >= 0))) {
      out += ' outer: for (;i--;) { for (j = i; j--;) { if (equal(' + ($data) + '[i], ' + ($data) + '[j])) { ' + ($valid) + ' = false; break outer; } } } ';
    } else {
      out += ' var itemIndices = {}, item; for (;i--;) { var item = ' + ($data) + '[i]; ';
      var $method = 'checkDataType' + ($typeIsArray ? 's' : '');
      out += ' if (' + (it.util[$method]($itemType, 'item', it.opts.strictNumbers, true)) + ') continue; ';
      if ($typeIsArray) {
        out += ' if (typeof item == \'string\') item = \'"\' + item; ';
      }
      out += ' if (typeof itemIndices[item] == \'number\') { ' + ($valid) + ' = false; j = itemIndices[item]; break; } itemIndices[item] = i; } ';
    }
    out += ' } ';
    if ($isData) {
      out += '  }  ';
    }
    out += ' if (!' + ($valid) + ') {   ';
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ('uniqueItems') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { i: i, j: j } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should NOT have duplicate items (items ## \' + j + \' and \' + i + \' are identical)\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema:  ';
        if ($isData) {
          out += 'validate.schema' + ($schemaPath);
        } else {
          out += '' + ($schema);
        }
        out += '         , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } ';
    if ($breakOnError) {
      out += ' else { ';
    }
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
};

//all requires must be explicit because browserify won't work with dynamic requires
var dotjs = {
  '$ref': ref,
  allOf: allOf,
  anyOf: anyOf,
  '$comment': comment,
  const: _const,
  contains: contains$1,
  dependencies: dependencies,
  'enum': _enum,
  format: format$1,
  'if': _if,
  items: items,
  maximum: _limit,
  minimum: _limit,
  maxItems: _limitItems,
  minItems: _limitItems,
  maxLength: _limitLength,
  minLength: _limitLength,
  maxProperties: _limitProperties,
  minProperties: _limitProperties,
  multipleOf: multipleOf,
  not: not,
  oneOf: oneOf,
  pattern: pattern$2,
  properties: properties$2,
  propertyNames: propertyNames,
  required: required$1,
  uniqueItems: uniqueItems,
  validate: validate$1
};

var toHash = util$1.toHash;

var rules = function rules() {
  var RULES = [
    { type: 'number',
      rules: [ { 'maximum': ['exclusiveMaximum'] },
               { 'minimum': ['exclusiveMinimum'] }, 'multipleOf', 'format'] },
    { type: 'string',
      rules: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
    { type: 'array',
      rules: [ 'maxItems', 'minItems', 'items', 'contains', 'uniqueItems' ] },
    { type: 'object',
      rules: [ 'maxProperties', 'minProperties', 'required', 'dependencies', 'propertyNames',
               { 'properties': ['additionalProperties', 'patternProperties'] } ] },
    { rules: [ '$ref', 'const', 'enum', 'not', 'anyOf', 'oneOf', 'allOf', 'if' ] }
  ];

  var ALL = [ 'type', '$comment' ];
  var KEYWORDS = [
    '$schema', '$id', 'id', '$data', '$async', 'title',
    'description', 'default', 'definitions',
    'examples', 'readOnly', 'writeOnly',
    'contentMediaType', 'contentEncoding',
    'additionalItems', 'then', 'else'
  ];
  var TYPES = [ 'number', 'integer', 'string', 'array', 'object', 'boolean', 'null' ];
  RULES.all = toHash(ALL);
  RULES.types = toHash(TYPES);

  RULES.forEach(function (group) {
    group.rules = group.rules.map(function (keyword) {
      var implKeywords;
      if (typeof keyword == 'object') {
        var key = Object.keys(keyword)[0];
        implKeywords = keyword[key];
        keyword = key;
        implKeywords.forEach(function (k) {
          ALL.push(k);
          RULES.all[k] = true;
        });
      }
      ALL.push(keyword);
      var rule = RULES.all[keyword] = {
        keyword: keyword,
        code: dotjs[keyword],
        implements: implKeywords
      };
      return rule;
    });

    RULES.all.$comment = {
      keyword: '$comment',
      code: dotjs.$comment
    };

    if (group.type) RULES.types[group.type] = group;
  });

  RULES.keywords = toHash(ALL.concat(KEYWORDS));
  RULES.custom = {};

  return RULES;
};

var KEYWORDS = [
  'multipleOf',
  'maximum',
  'exclusiveMaximum',
  'minimum',
  'exclusiveMinimum',
  'maxLength',
  'minLength',
  'pattern',
  'additionalItems',
  'maxItems',
  'minItems',
  'uniqueItems',
  'maxProperties',
  'minProperties',
  'required',
  'additionalProperties',
  'enum',
  'format',
  'const'
];

var data = function (metaSchema, keywordsJsonPointers) {
  for (var i=0; i<keywordsJsonPointers.length; i++) {
    metaSchema = JSON.parse(JSON.stringify(metaSchema));
    var segments = keywordsJsonPointers[i].split('/');
    var keywords = metaSchema;
    var j;
    for (j=1; j<segments.length; j++)
      keywords = keywords[segments[j]];

    for (j=0; j<KEYWORDS.length; j++) {
      var key = KEYWORDS[j];
      var schema = keywords[key];
      if (schema) {
        keywords[key] = {
          anyOf: [
            schema,
            { $ref: 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#' }
          ]
        };
      }
    }
  }

  return metaSchema;
};

var MissingRefError = error_classes.MissingRef;

var async = compileAsync;


/**
 * Creates validating function for passed schema with asynchronous loading of missing schemas.
 * `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
 * @this  Ajv
 * @param {Object}   schema schema object
 * @param {Boolean}  meta optional true to compile meta-schema; this parameter can be skipped
 * @param {Function} callback an optional node-style callback, it is called with 2 parameters: error (or null) and validating function.
 * @return {Promise} promise that resolves with a validating function.
 */
function compileAsync(schema, meta, callback) {
  /* eslint no-shadow: 0 */
  /* global Promise */
  /* jshint validthis: true */
  var self = this;
  if (typeof this._opts.loadSchema != 'function')
    throw new Error('options.loadSchema should be a function');

  if (typeof meta == 'function') {
    callback = meta;
    meta = undefined;
  }

  var p = loadMetaSchemaOf(schema).then(function () {
    var schemaObj = self._addSchema(schema, undefined, meta);
    return schemaObj.validate || _compileAsync(schemaObj);
  });

  if (callback) {
    p.then(
      function(v) { callback(null, v); },
      callback
    );
  }

  return p;


  function loadMetaSchemaOf(sch) {
    var $schema = sch.$schema;
    return $schema && !self.getSchema($schema)
            ? compileAsync.call(self, { $ref: $schema }, true)
            : Promise.resolve();
  }


  function _compileAsync(schemaObj) {
    try { return self._compile(schemaObj); }
    catch(e) {
      if (e instanceof MissingRefError) return loadMissingSchema(e);
      throw e;
    }


    function loadMissingSchema(e) {
      var ref = e.missingSchema;
      if (added(ref)) throw new Error('Schema ' + ref + ' is loaded but ' + e.missingRef + ' cannot be resolved');

      var schemaPromise = self._loadingSchemas[ref];
      if (!schemaPromise) {
        schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref);
        schemaPromise.then(removePromise, removePromise);
      }

      return schemaPromise.then(function (sch) {
        if (!added(ref)) {
          return loadMetaSchemaOf(sch).then(function () {
            if (!added(ref)) self.addSchema(sch, ref, undefined, meta);
          });
        }
      }).then(function() {
        return _compileAsync(schemaObj);
      });

      function removePromise() {
        delete self._loadingSchemas[ref];
      }

      function added(ref) {
        return self._refs[ref] || self._schemas[ref];
      }
    }
  }
}

var custom = function generate_custom(it, $keyword, $ruleType) {
  var out = ' ';
  var $lvl = it.level;
  var $dataLvl = it.dataLevel;
  var $schema = it.schema[$keyword];
  var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
  var $errSchemaPath = it.errSchemaPath + '/' + $keyword;
  var $breakOnError = !it.opts.allErrors;
  var $errorKeyword;
  var $data = 'data' + ($dataLvl || '');
  var $valid = 'valid' + $lvl;
  var $errs = 'errs__' + $lvl;
  var $isData = it.opts.$data && $schema && $schema.$data,
    $schemaValue;
  if ($isData) {
    out += ' var schema' + ($lvl) + ' = ' + (it.util.getData($schema.$data, $dataLvl, it.dataPathArr)) + '; ';
    $schemaValue = 'schema' + $lvl;
  } else {
    $schemaValue = $schema;
  }
  var $rule = this,
    $definition = 'definition' + $lvl,
    $rDef = $rule.definition,
    $closingBraces = '';
  var $compile, $inline, $macro, $ruleValidate, $validateCode;
  if ($isData && $rDef.$data) {
    $validateCode = 'keywordValidate' + $lvl;
    var $validateSchema = $rDef.validateSchema;
    out += ' var ' + ($definition) + ' = RULES.custom[\'' + ($keyword) + '\'].definition; var ' + ($validateCode) + ' = ' + ($definition) + '.validate;';
  } else {
    $ruleValidate = it.useCustomRule($rule, $schema, it.schema, it);
    if (!$ruleValidate) return;
    $schemaValue = 'validate.schema' + $schemaPath;
    $validateCode = $ruleValidate.code;
    $compile = $rDef.compile;
    $inline = $rDef.inline;
    $macro = $rDef.macro;
  }
  var $ruleErrs = $validateCode + '.errors',
    $i = 'i' + $lvl,
    $ruleErr = 'ruleErr' + $lvl,
    $asyncKeyword = $rDef.async;
  if ($asyncKeyword && !it.async) throw new Error('async keyword in sync schema');
  if (!($inline || $macro)) {
    out += '' + ($ruleErrs) + ' = null;';
  }
  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
  if ($isData && $rDef.$data) {
    $closingBraces += '}';
    out += ' if (' + ($schemaValue) + ' === undefined) { ' + ($valid) + ' = true; } else { ';
    if ($validateSchema) {
      $closingBraces += '}';
      out += ' ' + ($valid) + ' = ' + ($definition) + '.validateSchema(' + ($schemaValue) + '); if (' + ($valid) + ') { ';
    }
  }
  if ($inline) {
    if ($rDef.statements) {
      out += ' ' + ($ruleValidate.validate) + ' ';
    } else {
      out += ' ' + ($valid) + ' = ' + ($ruleValidate.validate) + '; ';
    }
  } else if ($macro) {
    var $it = it.util.copy(it);
    var $closingBraces = '';
    $it.level++;
    var $nextValid = 'valid' + $it.level;
    $it.schema = $ruleValidate.validate;
    $it.schemaPath = '';
    var $wasComposite = it.compositeRule;
    it.compositeRule = $it.compositeRule = true;
    var $code = it.validate($it).replace(/validate\.schema/g, $validateCode);
    it.compositeRule = $it.compositeRule = $wasComposite;
    out += ' ' + ($code);
  } else {
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = '';
    out += '  ' + ($validateCode) + '.call( ';
    if (it.opts.passContext) {
      out += 'this';
    } else {
      out += 'self';
    }
    if ($compile || $rDef.schema === false) {
      out += ' , ' + ($data) + ' ';
    } else {
      out += ' , ' + ($schemaValue) + ' , ' + ($data) + ' , validate.schema' + (it.schemaPath) + ' ';
    }
    out += ' , (dataPath || \'\')';
    if (it.errorPath != '""') {
      out += ' + ' + (it.errorPath);
    }
    var $parentData = $dataLvl ? 'data' + (($dataLvl - 1) || '') : 'parentData',
      $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : 'parentDataProperty';
    out += ' , ' + ($parentData) + ' , ' + ($parentDataProperty) + ' , rootData )  ';
    var def_callRuleValidate = out;
    out = $$outStack.pop();
    if ($rDef.errors === false) {
      out += ' ' + ($valid) + ' = ';
      if ($asyncKeyword) {
        out += 'await ';
      }
      out += '' + (def_callRuleValidate) + '; ';
    } else {
      if ($asyncKeyword) {
        $ruleErrs = 'customErrors' + $lvl;
        out += ' var ' + ($ruleErrs) + ' = null; try { ' + ($valid) + ' = await ' + (def_callRuleValidate) + '; } catch (e) { ' + ($valid) + ' = false; if (e instanceof ValidationError) ' + ($ruleErrs) + ' = e.errors; else throw e; } ';
      } else {
        out += ' ' + ($ruleErrs) + ' = null; ' + ($valid) + ' = ' + (def_callRuleValidate) + '; ';
      }
    }
  }
  if ($rDef.modifying) {
    out += ' if (' + ($parentData) + ') ' + ($data) + ' = ' + ($parentData) + '[' + ($parentDataProperty) + '];';
  }
  out += '' + ($closingBraces);
  if ($rDef.valid) {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  } else {
    out += ' if ( ';
    if ($rDef.valid === undefined) {
      out += ' !';
      if ($macro) {
        out += '' + ($nextValid);
      } else {
        out += '' + ($valid);
      }
    } else {
      out += ' ' + (!$rDef.valid) + ' ';
    }
    out += ') { ';
    $errorKeyword = $rule.keyword;
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = '';
    var $$outStack = $$outStack || [];
    $$outStack.push(out);
    out = ''; /* istanbul ignore else */
    if (it.createErrors !== false) {
      out += ' { keyword: \'' + ($errorKeyword || 'custom') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { keyword: \'' + ($rule.keyword) + '\' } ';
      if (it.opts.messages !== false) {
        out += ' , message: \'should pass "' + ($rule.keyword) + '" keyword validation\' ';
      }
      if (it.opts.verbose) {
        out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
      }
      out += ' } ';
    } else {
      out += ' {} ';
    }
    var __err = out;
    out = $$outStack.pop();
    if (!it.compositeRule && $breakOnError) {
      /* istanbul ignore if */
      if (it.async) {
        out += ' throw new ValidationError([' + (__err) + ']); ';
      } else {
        out += ' validate.errors = [' + (__err) + ']; return false; ';
      }
    } else {
      out += ' var err = ' + (__err) + ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    var def_customError = out;
    out = $$outStack.pop();
    if ($inline) {
      if ($rDef.errors) {
        if ($rDef.errors != 'full') {
          out += '  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + '; if (' + ($ruleErr) + '.schemaPath === undefined) { ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '"; } ';
          if (it.opts.verbose) {
            out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
          }
          out += ' } ';
        }
      } else {
        if ($rDef.errors === false) {
          out += ' ' + (def_customError) + ' ';
        } else {
          out += ' if (' + ($errs) + ' == errors) { ' + (def_customError) + ' } else {  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + '; if (' + ($ruleErr) + '.schemaPath === undefined) { ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '"; } ';
          if (it.opts.verbose) {
            out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
          }
          out += ' } } ';
        }
      }
    } else if ($macro) {
      out += '   var err =   '; /* istanbul ignore else */
      if (it.createErrors !== false) {
        out += ' { keyword: \'' + ($errorKeyword || 'custom') + '\' , dataPath: (dataPath || \'\') + ' + (it.errorPath) + ' , schemaPath: ' + (it.util.toQuotedString($errSchemaPath)) + ' , params: { keyword: \'' + ($rule.keyword) + '\' } ';
        if (it.opts.messages !== false) {
          out += ' , message: \'should pass "' + ($rule.keyword) + '" keyword validation\' ';
        }
        if (it.opts.verbose) {
          out += ' , schema: validate.schema' + ($schemaPath) + ' , parentSchema: validate.schema' + (it.schemaPath) + ' , data: ' + ($data) + ' ';
        }
        out += ' } ';
      } else {
        out += ' {} ';
      }
      out += ';  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      if (!it.compositeRule && $breakOnError) {
        /* istanbul ignore if */
        if (it.async) {
          out += ' throw new ValidationError(vErrors); ';
        } else {
          out += ' validate.errors = vErrors; return false; ';
        }
      }
    } else {
      if ($rDef.errors === false) {
        out += ' ' + (def_customError) + ' ';
      } else {
        out += ' if (Array.isArray(' + ($ruleErrs) + ')) { if (vErrors === null) vErrors = ' + ($ruleErrs) + '; else vErrors = vErrors.concat(' + ($ruleErrs) + '); errors = vErrors.length;  for (var ' + ($i) + '=' + ($errs) + '; ' + ($i) + '<errors; ' + ($i) + '++) { var ' + ($ruleErr) + ' = vErrors[' + ($i) + ']; if (' + ($ruleErr) + '.dataPath === undefined) ' + ($ruleErr) + '.dataPath = (dataPath || \'\') + ' + (it.errorPath) + ';  ' + ($ruleErr) + '.schemaPath = "' + ($errSchemaPath) + '";  ';
        if (it.opts.verbose) {
          out += ' ' + ($ruleErr) + '.schema = ' + ($schemaValue) + '; ' + ($ruleErr) + '.data = ' + ($data) + '; ';
        }
        out += ' } } else { ' + (def_customError) + ' } ';
      }
    }
    out += ' } ';
    if ($breakOnError) {
      out += ' else { ';
    }
  }
  return out;
};

var $schema$1 = "http://json-schema.org/draft-07/schema#";
var $id$1 = "http://json-schema.org/draft-07/schema#";
var title = "Core schema meta-schema";
var definitions = {
	schemaArray: {
		type: "array",
		minItems: 1,
		items: {
			$ref: "#"
		}
	},
	nonNegativeInteger: {
		type: "integer",
		minimum: 0
	},
	nonNegativeIntegerDefault0: {
		allOf: [
			{
				$ref: "#/definitions/nonNegativeInteger"
			},
			{
				"default": 0
			}
		]
	},
	simpleTypes: {
		"enum": [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		]
	},
	stringArray: {
		type: "array",
		items: {
			type: "string"
		},
		uniqueItems: true,
		"default": [
		]
	}
};
var type$1 = [
	"object",
	"boolean"
];
var properties$1 = {
	$id: {
		type: "string",
		format: "uri-reference"
	},
	$schema: {
		type: "string",
		format: "uri"
	},
	$ref: {
		type: "string",
		format: "uri-reference"
	},
	$comment: {
		type: "string"
	},
	title: {
		type: "string"
	},
	description: {
		type: "string"
	},
	"default": true,
	readOnly: {
		type: "boolean",
		"default": false
	},
	examples: {
		type: "array",
		items: true
	},
	multipleOf: {
		type: "number",
		exclusiveMinimum: 0
	},
	maximum: {
		type: "number"
	},
	exclusiveMaximum: {
		type: "number"
	},
	minimum: {
		type: "number"
	},
	exclusiveMinimum: {
		type: "number"
	},
	maxLength: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minLength: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	pattern: {
		type: "string",
		format: "regex"
	},
	additionalItems: {
		$ref: "#"
	},
	items: {
		anyOf: [
			{
				$ref: "#"
			},
			{
				$ref: "#/definitions/schemaArray"
			}
		],
		"default": true
	},
	maxItems: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minItems: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	uniqueItems: {
		type: "boolean",
		"default": false
	},
	contains: {
		$ref: "#"
	},
	maxProperties: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minProperties: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	required: {
		$ref: "#/definitions/stringArray"
	},
	additionalProperties: {
		$ref: "#"
	},
	definitions: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	properties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	patternProperties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		propertyNames: {
			format: "regex"
		},
		"default": {
		}
	},
	dependencies: {
		type: "object",
		additionalProperties: {
			anyOf: [
				{
					$ref: "#"
				},
				{
					$ref: "#/definitions/stringArray"
				}
			]
		}
	},
	propertyNames: {
		$ref: "#"
	},
	"const": true,
	"enum": {
		type: "array",
		items: true,
		minItems: 1,
		uniqueItems: true
	},
	type: {
		anyOf: [
			{
				$ref: "#/definitions/simpleTypes"
			},
			{
				type: "array",
				items: {
					$ref: "#/definitions/simpleTypes"
				},
				minItems: 1,
				uniqueItems: true
			}
		]
	},
	format: {
		type: "string"
	},
	contentMediaType: {
		type: "string"
	},
	contentEncoding: {
		type: "string"
	},
	"if": {
		$ref: "#"
	},
	then: {
		$ref: "#"
	},
	"else": {
		$ref: "#"
	},
	allOf: {
		$ref: "#/definitions/schemaArray"
	},
	anyOf: {
		$ref: "#/definitions/schemaArray"
	},
	oneOf: {
		$ref: "#/definitions/schemaArray"
	},
	not: {
		$ref: "#"
	}
};
var require$$2 = {
	$schema: $schema$1,
	$id: $id$1,
	title: title,
	definitions: definitions,
	type: type$1,
	properties: properties$1,
	"default": true
};

var definition_schema = {
  $id: 'https://github.com/ajv-validator/ajv/blob/master/lib/definition_schema.js',
  definitions: {
    simpleTypes: require$$2.definitions.simpleTypes
  },
  type: 'object',
  dependencies: {
    schema: ['validate'],
    $data: ['validate'],
    statements: ['inline'],
    valid: {not: {required: ['macro']}}
  },
  properties: {
    type: require$$2.properties.type,
    schema: {type: 'boolean'},
    statements: {type: 'boolean'},
    dependencies: {
      type: 'array',
      items: {type: 'string'}
    },
    metaSchema: {type: 'object'},
    modifying: {type: 'boolean'},
    valid: {type: 'boolean'},
    $data: {type: 'boolean'},
    async: {type: 'boolean'},
    errors: {
      anyOf: [
        {type: 'boolean'},
        {const: 'full'}
      ]
    }
  }
};

var IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i;



var keyword = {
  add: addKeyword,
  get: getKeyword,
  remove: removeKeyword,
  validate: validateKeyword
};


/**
 * Define custom keyword
 * @this  Ajv
 * @param {String} keyword custom keyword, should be unique (including different from all standard, custom and macro keywords).
 * @param {Object} definition keyword definition object with properties `type` (type(s) which the keyword applies to), `validate` or `compile`.
 * @return {Ajv} this for method chaining
 */
function addKeyword(keyword, definition) {
  /* jshint validthis: true */
  /* eslint no-shadow: 0 */
  var RULES = this.RULES;
  if (RULES.keywords[keyword])
    throw new Error('Keyword ' + keyword + ' is already defined');

  if (!IDENTIFIER.test(keyword))
    throw new Error('Keyword ' + keyword + ' is not a valid identifier');

  if (definition) {
    this.validateKeyword(definition, true);

    var dataType = definition.type;
    if (Array.isArray(dataType)) {
      for (var i=0; i<dataType.length; i++)
        _addRule(keyword, dataType[i], definition);
    } else {
      _addRule(keyword, dataType, definition);
    }

    var metaSchema = definition.metaSchema;
    if (metaSchema) {
      if (definition.$data && this._opts.$data) {
        metaSchema = {
          anyOf: [
            metaSchema,
            { '$ref': 'https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#' }
          ]
        };
      }
      definition.validateSchema = this.compile(metaSchema, true);
    }
  }

  RULES.keywords[keyword] = RULES.all[keyword] = true;


  function _addRule(keyword, dataType, definition) {
    var ruleGroup;
    for (var i=0; i<RULES.length; i++) {
      var rg = RULES[i];
      if (rg.type == dataType) {
        ruleGroup = rg;
        break;
      }
    }

    if (!ruleGroup) {
      ruleGroup = { type: dataType, rules: [] };
      RULES.push(ruleGroup);
    }

    var rule = {
      keyword: keyword,
      definition: definition,
      custom: true,
      code: custom,
      implements: definition.implements
    };
    ruleGroup.rules.push(rule);
    RULES.custom[keyword] = rule;
  }

  return this;
}


/**
 * Get keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Object|Boolean} custom keyword definition, `true` if it is a predefined keyword, `false` otherwise.
 */
function getKeyword(keyword) {
  /* jshint validthis: true */
  var rule = this.RULES.custom[keyword];
  return rule ? rule.definition : this.RULES.keywords[keyword] || false;
}


/**
 * Remove keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Ajv} this for method chaining
 */
function removeKeyword(keyword) {
  /* jshint validthis: true */
  var RULES = this.RULES;
  delete RULES.keywords[keyword];
  delete RULES.all[keyword];
  delete RULES.custom[keyword];
  for (var i=0; i<RULES.length; i++) {
    var rules = RULES[i].rules;
    for (var j=0; j<rules.length; j++) {
      if (rules[j].keyword == keyword) {
        rules.splice(j, 1);
        break;
      }
    }
  }
  return this;
}


/**
 * Validate keyword definition
 * @this  Ajv
 * @param {Object} definition keyword definition object.
 * @param {Boolean} throwError true to throw exception if definition is invalid
 * @return {boolean} validation result
 */
function validateKeyword(definition, throwError) {
  validateKeyword.errors = null;
  var v = this._validateKeyword = this._validateKeyword
                                  || this.compile(definition_schema, true);

  if (v(definition)) return true;
  validateKeyword.errors = v.errors;
  if (throwError)
    throw new Error('custom keyword definition is invalid: '  + this.errorsText(v.errors));
  else
    return false;
}

var $schema = "http://json-schema.org/draft-07/schema#";
var $id = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#";
var description = "Meta-schema for $data reference (JSON Schema extension proposal)";
var type = "object";
var required = [
	"$data"
];
var properties = {
	$data: {
		type: "string",
		anyOf: [
			{
				format: "relative-json-pointer"
			},
			{
				format: "json-pointer"
			}
		]
	}
};
var additionalProperties = false;
var require$$1 = {
	$schema: $schema,
	$id: $id,
	description: description,
	type: type,
	required: required,
	properties: properties,
	additionalProperties: additionalProperties
};

var ajv = Ajv;

Ajv.prototype.validate = validate;
Ajv.prototype.compile = compile;
Ajv.prototype.addSchema = addSchema;
Ajv.prototype.addMetaSchema = addMetaSchema;
Ajv.prototype.validateSchema = validateSchema;
Ajv.prototype.getSchema = getSchema;
Ajv.prototype.removeSchema = removeSchema;
Ajv.prototype.addFormat = addFormat;
Ajv.prototype.errorsText = errorsText;

Ajv.prototype._addSchema = _addSchema;
Ajv.prototype._compile = _compile;

Ajv.prototype.compileAsync = async;

Ajv.prototype.addKeyword = keyword.add;
Ajv.prototype.getKeyword = keyword.get;
Ajv.prototype.removeKeyword = keyword.remove;
Ajv.prototype.validateKeyword = keyword.validate;


Ajv.ValidationError = error_classes.Validation;
Ajv.MissingRefError = error_classes.MissingRef;
Ajv.$dataMetaSchema = data;

var META_SCHEMA_ID = 'http://json-schema.org/draft-07/schema';

var META_IGNORE_OPTIONS = [ 'removeAdditional', 'useDefaults', 'coerceTypes', 'strictDefaults' ];
var META_SUPPORT_DATA = ['/properties'];

/**
 * Creates validator instance.
 * Usage: `Ajv(opts)`
 * @param {Object} opts optional options
 * @return {Object} ajv instance
 */
function Ajv(opts) {
  if (!(this instanceof Ajv)) return new Ajv(opts);
  opts = this._opts = util$1.copy(opts) || {};
  setLogger(this);
  this._schemas = {};
  this._refs = {};
  this._fragments = {};
  this._formats = formats_1(opts.format);

  this._cache = opts.cache || new cache$1;
  this._loadingSchemas = {};
  this._compilations = [];
  this.RULES = rules();
  this._getId = chooseGetId(opts);

  opts.loopRequired = opts.loopRequired || Infinity;
  if (opts.errorDataPath == 'property') opts._errorDataPathProperty = true;
  if (opts.serialize === undefined) opts.serialize = fastJsonStableStringify;
  this._metaOpts = getMetaSchemaOptions(this);

  if (opts.formats) addInitialFormats(this);
  if (opts.keywords) addInitialKeywords(this);
  addDefaultMetaSchema(this);
  if (typeof opts.meta == 'object') this.addMetaSchema(opts.meta);
  if (opts.nullable) this.addKeyword('nullable', {metaSchema: {type: 'boolean'}});
  addInitialSchemas(this);
}



/**
 * Validate data using schema
 * Schema will be compiled and cached (using serialized JSON as key. [fast-json-stable-stringify](https://github.com/epoberezkin/fast-json-stable-stringify) is used to serialize.
 * @this   Ajv
 * @param  {String|Object} schemaKeyRef key, ref or schema object
 * @param  {Any} data to be validated
 * @return {Boolean} validation result. Errors from the last validation will be available in `ajv.errors` (and also in compiled schema: `schema.errors`).
 */
function validate(schemaKeyRef, data) {
  var v;
  if (typeof schemaKeyRef == 'string') {
    v = this.getSchema(schemaKeyRef);
    if (!v) throw new Error('no schema with key or ref "' + schemaKeyRef + '"');
  } else {
    var schemaObj = this._addSchema(schemaKeyRef);
    v = schemaObj.validate || this._compile(schemaObj);
  }

  var valid = v(data);
  if (v.$async !== true) this.errors = v.errors;
  return valid;
}


/**
 * Create validating function for passed schema.
 * @this   Ajv
 * @param  {Object} schema schema object
 * @param  {Boolean} _meta true if schema is a meta-schema. Used internally to compile meta schemas of custom keywords.
 * @return {Function} validating function
 */
function compile(schema, _meta) {
  var schemaObj = this._addSchema(schema, undefined, _meta);
  return schemaObj.validate || this._compile(schemaObj);
}


/**
 * Adds schema to the instance.
 * @this   Ajv
 * @param {Object|Array} schema schema or array of schemas. If array is passed, `key` and other parameters will be ignored.
 * @param {String} key Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
 * @param {Boolean} _skipValidation true to skip schema validation. Used internally, option validateSchema should be used instead.
 * @param {Boolean} _meta true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
 * @return {Ajv} this for method chaining
 */
function addSchema(schema, key, _skipValidation, _meta) {
  if (Array.isArray(schema)){
    for (var i=0; i<schema.length; i++) this.addSchema(schema[i], undefined, _skipValidation, _meta);
    return this;
  }
  var id = this._getId(schema);
  if (id !== undefined && typeof id != 'string')
    throw new Error('schema id must be string');
  key = resolve_1.normalizeId(key || id);
  checkUnique(this, key);
  this._schemas[key] = this._addSchema(schema, _skipValidation, _meta, true);
  return this;
}


/**
 * Add schema that will be used to validate other schemas
 * options in META_IGNORE_OPTIONS are alway set to false
 * @this   Ajv
 * @param {Object} schema schema object
 * @param {String} key optional schema key
 * @param {Boolean} skipValidation true to skip schema validation, can be used to override validateSchema option for meta-schema
 * @return {Ajv} this for method chaining
 */
function addMetaSchema(schema, key, skipValidation) {
  this.addSchema(schema, key, skipValidation, true);
  return this;
}


/**
 * Validate schema
 * @this   Ajv
 * @param {Object} schema schema to validate
 * @param {Boolean} throwOrLogError pass true to throw (or log) an error if invalid
 * @return {Boolean} true if schema is valid
 */
function validateSchema(schema, throwOrLogError) {
  var $schema = schema.$schema;
  if ($schema !== undefined && typeof $schema != 'string')
    throw new Error('$schema must be a string');
  $schema = $schema || this._opts.defaultMeta || defaultMeta(this);
  if (!$schema) {
    this.logger.warn('meta-schema not available');
    this.errors = null;
    return true;
  }
  var valid = this.validate($schema, schema);
  if (!valid && throwOrLogError) {
    var message = 'schema is invalid: ' + this.errorsText();
    if (this._opts.validateSchema == 'log') this.logger.error(message);
    else throw new Error(message);
  }
  return valid;
}


function defaultMeta(self) {
  var meta = self._opts.meta;
  self._opts.defaultMeta = typeof meta == 'object'
                            ? self._getId(meta) || meta
                            : self.getSchema(META_SCHEMA_ID)
                              ? META_SCHEMA_ID
                              : undefined;
  return self._opts.defaultMeta;
}


/**
 * Get compiled schema from the instance by `key` or `ref`.
 * @this   Ajv
 * @param  {String} keyRef `key` that was passed to `addSchema` or full schema reference (`schema.id` or resolved id).
 * @return {Function} schema validating function (with property `schema`).
 */
function getSchema(keyRef) {
  var schemaObj = _getSchemaObj(this, keyRef);
  switch (typeof schemaObj) {
    case 'object': return schemaObj.validate || this._compile(schemaObj);
    case 'string': return this.getSchema(schemaObj);
    case 'undefined': return _getSchemaFragment(this, keyRef);
  }
}


function _getSchemaFragment(self, ref) {
  var res = resolve_1.schema.call(self, { schema: {} }, ref);
  if (res) {
    var schema = res.schema
      , root = res.root
      , baseId = res.baseId;
    var v = compile_1.call(self, schema, root, undefined, baseId);
    self._fragments[ref] = new schema_obj({
      ref: ref,
      fragment: true,
      schema: schema,
      root: root,
      baseId: baseId,
      validate: v
    });
    return v;
  }
}


function _getSchemaObj(self, keyRef) {
  keyRef = resolve_1.normalizeId(keyRef);
  return self._schemas[keyRef] || self._refs[keyRef] || self._fragments[keyRef];
}


/**
 * Remove cached schema(s).
 * If no parameter is passed all schemas but meta-schemas are removed.
 * If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
 * Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
 * @this   Ajv
 * @param  {String|Object|RegExp} schemaKeyRef key, ref, pattern to match key/ref or schema object
 * @return {Ajv} this for method chaining
 */
function removeSchema(schemaKeyRef) {
  if (schemaKeyRef instanceof RegExp) {
    _removeAllSchemas(this, this._schemas, schemaKeyRef);
    _removeAllSchemas(this, this._refs, schemaKeyRef);
    return this;
  }
  switch (typeof schemaKeyRef) {
    case 'undefined':
      _removeAllSchemas(this, this._schemas);
      _removeAllSchemas(this, this._refs);
      this._cache.clear();
      return this;
    case 'string':
      var schemaObj = _getSchemaObj(this, schemaKeyRef);
      if (schemaObj) this._cache.del(schemaObj.cacheKey);
      delete this._schemas[schemaKeyRef];
      delete this._refs[schemaKeyRef];
      return this;
    case 'object':
      var serialize = this._opts.serialize;
      var cacheKey = serialize ? serialize(schemaKeyRef) : schemaKeyRef;
      this._cache.del(cacheKey);
      var id = this._getId(schemaKeyRef);
      if (id) {
        id = resolve_1.normalizeId(id);
        delete this._schemas[id];
        delete this._refs[id];
      }
  }
  return this;
}


function _removeAllSchemas(self, schemas, regex) {
  for (var keyRef in schemas) {
    var schemaObj = schemas[keyRef];
    if (!schemaObj.meta && (!regex || regex.test(keyRef))) {
      self._cache.del(schemaObj.cacheKey);
      delete schemas[keyRef];
    }
  }
}


/* @this   Ajv */
function _addSchema(schema, skipValidation, meta, shouldAddSchema) {
  if (typeof schema != 'object' && typeof schema != 'boolean')
    throw new Error('schema should be object or boolean');
  var serialize = this._opts.serialize;
  var cacheKey = serialize ? serialize(schema) : schema;
  var cached = this._cache.get(cacheKey);
  if (cached) return cached;

  shouldAddSchema = shouldAddSchema || this._opts.addUsedSchema !== false;

  var id = resolve_1.normalizeId(this._getId(schema));
  if (id && shouldAddSchema) checkUnique(this, id);

  var willValidate = this._opts.validateSchema !== false && !skipValidation;
  var recursiveMeta;
  if (willValidate && !(recursiveMeta = id && id == resolve_1.normalizeId(schema.$schema)))
    this.validateSchema(schema, true);

  var localRefs = resolve_1.ids.call(this, schema);

  var schemaObj = new schema_obj({
    id: id,
    schema: schema,
    localRefs: localRefs,
    cacheKey: cacheKey,
    meta: meta
  });

  if (id[0] != '#' && shouldAddSchema) this._refs[id] = schemaObj;
  this._cache.put(cacheKey, schemaObj);

  if (willValidate && recursiveMeta) this.validateSchema(schema, true);

  return schemaObj;
}


/* @this   Ajv */
function _compile(schemaObj, root) {
  if (schemaObj.compiling) {
    schemaObj.validate = callValidate;
    callValidate.schema = schemaObj.schema;
    callValidate.errors = null;
    callValidate.root = root ? root : callValidate;
    if (schemaObj.schema.$async === true)
      callValidate.$async = true;
    return callValidate;
  }
  schemaObj.compiling = true;

  var currentOpts;
  if (schemaObj.meta) {
    currentOpts = this._opts;
    this._opts = this._metaOpts;
  }

  var v;
  try { v = compile_1.call(this, schemaObj.schema, root, schemaObj.localRefs); }
  catch(e) {
    delete schemaObj.validate;
    throw e;
  }
  finally {
    schemaObj.compiling = false;
    if (schemaObj.meta) this._opts = currentOpts;
  }

  schemaObj.validate = v;
  schemaObj.refs = v.refs;
  schemaObj.refVal = v.refVal;
  schemaObj.root = v.root;
  return v;


  /* @this   {*} - custom context, see passContext option */
  function callValidate() {
    /* jshint validthis: true */
    var _validate = schemaObj.validate;
    var result = _validate.apply(this, arguments);
    callValidate.errors = _validate.errors;
    return result;
  }
}


function chooseGetId(opts) {
  switch (opts.schemaId) {
    case 'auto': return _get$IdOrId;
    case 'id': return _getId;
    default: return _get$Id;
  }
}

/* @this   Ajv */
function _getId(schema) {
  if (schema.$id) this.logger.warn('schema $id ignored', schema.$id);
  return schema.id;
}

/* @this   Ajv */
function _get$Id(schema) {
  if (schema.id) this.logger.warn('schema id ignored', schema.id);
  return schema.$id;
}


function _get$IdOrId(schema) {
  if (schema.$id && schema.id && schema.$id != schema.id)
    throw new Error('schema $id is different from id');
  return schema.$id || schema.id;
}


/**
 * Convert array of error message objects to string
 * @this   Ajv
 * @param  {Array<Object>} errors optional array of validation errors, if not passed errors from the instance are used.
 * @param  {Object} options optional options with properties `separator` and `dataVar`.
 * @return {String} human readable string with all errors descriptions
 */
function errorsText(errors, options) {
  errors = errors || this.errors;
  if (!errors) return 'No errors';
  options = options || {};
  var separator = options.separator === undefined ? ', ' : options.separator;
  var dataVar = options.dataVar === undefined ? 'data' : options.dataVar;

  var text = '';
  for (var i=0; i<errors.length; i++) {
    var e = errors[i];
    if (e) text += dataVar + e.dataPath + ' ' + e.message + separator;
  }
  return text.slice(0, -separator.length);
}


/**
 * Add custom format
 * @this   Ajv
 * @param {String} name format name
 * @param {String|RegExp|Function} format string is converted to RegExp; function should return boolean (true when valid)
 * @return {Ajv} this for method chaining
 */
function addFormat(name, format) {
  if (typeof format == 'string') format = new RegExp(format);
  this._formats[name] = format;
  return this;
}


function addDefaultMetaSchema(self) {
  var $dataSchema;
  if (self._opts.$data) {
    $dataSchema = require$$1;
    self.addMetaSchema($dataSchema, $dataSchema.$id, true);
  }
  if (self._opts.meta === false) return;
  var metaSchema = require$$2;
  if (self._opts.$data) metaSchema = data(metaSchema, META_SUPPORT_DATA);
  self.addMetaSchema(metaSchema, META_SCHEMA_ID, true);
  self._refs['http://json-schema.org/schema'] = META_SCHEMA_ID;
}


function addInitialSchemas(self) {
  var optsSchemas = self._opts.schemas;
  if (!optsSchemas) return;
  if (Array.isArray(optsSchemas)) self.addSchema(optsSchemas);
  else for (var key in optsSchemas) self.addSchema(optsSchemas[key], key);
}


function addInitialFormats(self) {
  for (var name in self._opts.formats) {
    var format = self._opts.formats[name];
    self.addFormat(name, format);
  }
}


function addInitialKeywords(self) {
  for (var name in self._opts.keywords) {
    var keyword = self._opts.keywords[name];
    self.addKeyword(name, keyword);
  }
}


function checkUnique(self, id) {
  if (self._schemas[id] || self._refs[id])
    throw new Error('schema with key or id "' + id + '" already exists');
}


function getMetaSchemaOptions(self) {
  var metaOpts = util$1.copy(self._opts);
  for (var i=0; i<META_IGNORE_OPTIONS.length; i++)
    delete metaOpts[META_IGNORE_OPTIONS[i]];
  return metaOpts;
}


function setLogger(self) {
  var logger = self._opts.logger;
  if (logger === false) {
    self.logger = {log: noop$1, warn: noop$1, error: noop$1};
  } else {
    if (logger === undefined) logger = console;
    if (!(typeof logger == 'object' && logger.log && logger.warn && logger.error))
      throw new Error('logger must implement log, warn and error methods');
    self.logger = logger;
  }
}


function noop$1() {}

var ascii = '\u0020\u0028-\u003E\u0040-\u005A\u0060-\u007A';
var latin1 = '\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF';
var latinExtA = '\u0100-\u017F';
var latinExtB = '\u0180-\u024F';
var cyrillic = '\u0400-\u04FF';
var cjk = '\u4E00-\u9FC3';

var patternString = util$2.format('^[%s%s%s%s%s%s]+$', ascii, latin1, latinExtA, latinExtB, cyrillic, cjk);
var pattern$1 = new RegExp(patternString);

function stringIsSafe(value) {
	return pattern$1.test(value);
}

var stringIsSafe_1 = stringIsSafe;

function purify$6(value) {
	if(value == null)
		return null;
	return value;
}

var purify_1$5 = purify$6;

function _new$s(column) {

	return function(value) {
		value = purify_1$5(value);
		if (value == null) {
			if (column.dbNull === null)
				return newParameterized$1('null');
			return newParameterized$1('\'' + column.dbNull + '\'');
		}
		if(stringIsSafe_1(value))
			return newParameterized$1('\'' + value + '\'');
		return newParameterized$1('?', [value]);
	};
}

var newEncode$6 = _new$s;

function _new$r(column) {

	return function(value) {
		if (value == column.dbNull)
			return null;
		return value;
	};
}

var newDecodeCore = _new$r;

var nullOperator$3 = ' is ';

function startsWithCore(operator, column,arg,alias) {
	operator = ' ' + operator + ' ';
	var encoded = column.encode(arg);
	if (encoded.sql() == 'null')
		operator = nullOperator$3;
	else
		encoded = column.encode(arg + '%');
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var startsWithCore_1 = startsWithCore;

var startsWith = startsWithCore_1.bind(null, 'LIKE');

var nullOperator$2 = ' is ';

function endsWithCore$1(operator, column,arg,alias) {
	operator = ' ' + operator + ' ';
	var encoded = column.encode(arg);
	if (encoded.sql() == 'null')
		operator = nullOperator$2;
	else
		encoded = column.encode('%' + arg);
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var endsWithCore_1 = endsWithCore$1;

var endsWith = endsWithCore_1.bind(null, 'LIKE');

var nullOperator$1 = ' is ';

function endsWithCore(operator, column,arg,alias) {
	operator = ' ' + operator + ' ';
	var encoded = column.encode(arg);
	if (encoded.sql() == 'null')
		operator = nullOperator$1;
	else
		encoded = column.encode('%' + arg + '%');
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var containsCore = endsWithCore;

var contains = containsCore.bind(null, 'LIKE');

var iStartsWith = startsWithCore_1.bind(null, 'ILIKE');

var iEndsWith = endsWithCore_1.bind(null, 'ILIKE');

var iContains = containsCore.bind(null, 'ILIKE');

var nullOperator = ' is ';


function iEqual(column,arg,alias) {
	var operator = ' ILIKE ';
	var encoded = encodeFilterArg_1(column, arg);
	if (encoded.sql() == 'null')
		operator = nullOperator;
	var firstPart = alias + '.' + column._dbName + operator;
	var filter =  encoded.prepend(firstPart);
	return newBoolean_1(filter);
}

var iEqual_1 = iEqual;

function _new$q(table, column) {
	column.purify = purify_1$5;
	column.encode = newEncode$6(column);
	column.decode = newDecodeCore(column);
	var extractAlias$1 = extractAlias.bind(null, table);

	column.startsWith = function(arg, alias) {
		alias = extractAlias$1(alias);
		return startsWith(column, arg, alias);
	};
	column.endsWith = function(arg, alias) {
		alias = extractAlias$1(alias);
		return endsWith(column, arg, alias);
	};
	column.contains = function(arg, alias) {
		alias = extractAlias$1(alias);
		return contains(column, arg, alias);
	};
	column.iStartsWith = function(arg, alias) {
		alias = extractAlias$1(alias);
		return iStartsWith(column, arg, alias);
	};
	column.iEndsWith = function(arg, alias) {
		alias = extractAlias$1(alias);
		return iEndsWith(column, arg, alias);
	};
	column.iContains = function(arg, alias) {
		alias = extractAlias$1(alias);
		return iContains(column, arg, alias);
	};

	column.iEqual = function(arg, alias) {
		alias = extractAlias$1(alias);
		return iEqual_1(column, arg, alias);
	};

	column.iEq = column.iEqual;
	column.IEQ = column.iEqual;
	column.ieq = column.iEqual;
}

var string = _new$q;

function purify$5(value) {
	if(value == null)
		return null;
	return value;
}

var purify_1$4 = purify$5;

function _new$p(column) {

	return function(candidate) {
		var value = purify_1$4(candidate);
		if (value == null) {
			if(column.dbNull === null)
				return newParameterized$1('null');
			return newParameterized$1('\'' + column.dbNull + '\'');
		}
		return newParameterized$1('?', [JSON.stringify(value)]);
	};
}

var newEncode$5 = _new$p;

var constants = {
	PATH_SEPARATOR: '.',
	TARGET: Symbol('target'),
	UNSUBSCRIBE: Symbol('unsubscribe')
};

const isBuiltin = {
	withMutableMethods: value => {
		return value instanceof Date ||
			value instanceof Set ||
			value instanceof Map ||
			value instanceof WeakSet ||
			value instanceof WeakMap;
	},
	withoutMutableMethods: value => (typeof value === 'object' ? value === null : typeof value !== 'function') || value instanceof RegExp
};

var isBuiltin_1 = isBuiltin;

var isArray = Array.isArray;

var isSymbol = value => typeof value === 'symbol';

const {PATH_SEPARATOR} = constants;



var path = {
	after: (path, subPath) => {
		if (isArray(path)) {
			return path.slice(subPath.length);
		}

		if (subPath === '') {
			return path;
		}

		return path.slice(subPath.length + 1);
	},
	concat: (path, key) => {
		if (isArray(path)) {
			path = path.slice();

			if (key) {
				path.push(key);
			}

			return path;
		}

		if (key && key.toString !== undefined) {
			if (path !== '') {
				path += PATH_SEPARATOR;
			}

			if (isSymbol(key)) {
				return path + key.toString();
			}

			return path + key;
		}

		return path;
	},
	initial: path => {
		if (isArray(path)) {
			return path.slice(0, -1);
		}

		if (path === '') {
			return path;
		}

		const index = path.lastIndexOf(PATH_SEPARATOR);

		if (index === -1) {
			return '';
		}

		return path.slice(0, index);
	},
	last: path => {
		if (isArray(path)) {
			return path[path.length - 1] || '';
		}

		if (path === '') {
			return path;
		}

		const index = path.lastIndexOf(PATH_SEPARATOR);

		if (index === -1) {
			return path;
		}

		return path.slice(index + 1);
	},
	walk: (path, callback) => {
		if (isArray(path)) {
			path.forEach(key => callback(key));
		} else if (path !== '') {
			let position = 0;
			let index = path.indexOf(PATH_SEPARATOR);

			if (index === -1) {
				callback(path);
			} else {
				while (position < path.length) {
					if (index === -1) {
						index = path.length;
					}

					callback(path.slice(position, index));

					position = index + 1;
					index = path.indexOf(PATH_SEPARATOR, position);
				}
			}
		}
	}
};

var isIterator = value => typeof value === 'object' && typeof value.next === 'function';

const {TARGET: TARGET$1} = constants;

// eslint-disable-next-line max-params
var wrapIterator = (iterator, target, thisArg, applyPath, prepareValue) => {
	const originalNext = iterator.next;

	if (target.name === 'entries') {
		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value[0] = prepareValue(
					result.value[0],
					target,
					result.value[0],
					applyPath
				);
				result.value[1] = prepareValue(
					result.value[1],
					target,
					result.value[0],
					applyPath
				);
			}

			return result;
		};
	} else if (target.name === 'values') {
		const keyIterator = thisArg[TARGET$1].keys();

		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value = prepareValue(
					result.value,
					target,
					keyIterator.next().value,
					applyPath
				);
			}

			return result;
		};
	} else {
		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value = prepareValue(
					result.value,
					target,
					result.value,
					applyPath
				);
			}

			return result;
		};
	}

	return iterator;
};

var ignoreProperty = (cache, options, property) => {
	return cache.isUnsubscribed ||
		(options.ignoreSymbols && isSymbol(property)) ||
		(options.ignoreUnderscores && property.charAt(0) === '_') ||
		('ignoreKeys' in options && options.ignoreKeys.includes(property));
};

/**
 * @class Cache
 * @private
 */
class Cache {
	constructor(equals) {
		this._equals = equals;
		this._proxyCache = new WeakMap();
		this._pathCache = new WeakMap();
		this.isUnsubscribed = false;
	}

	_getDescriptorCache() {
		if (this._descriptorCache === undefined) {
			this._descriptorCache = new WeakMap();
		}

		return this._descriptorCache;
	}

	_getProperties(target) {
		const descriptorCache = this._getDescriptorCache();
		let properties = descriptorCache.get(target);

		if (properties === undefined) {
			properties = {};
			descriptorCache.set(target, properties);
		}

		return properties;
	}

	_getOwnPropertyDescriptor(target, property) {
		if (this.isUnsubscribed) {
			return Reflect.getOwnPropertyDescriptor(target, property);
		}

		const properties = this._getProperties(target);
		let descriptor = properties[property];

		if (descriptor === undefined) {
			descriptor = Reflect.getOwnPropertyDescriptor(target, property);
			properties[property] = descriptor;
		}

		return descriptor;
	}

	getProxy(target, path, handler, proxyTarget) {
		if (this.isUnsubscribed) {
			return target;
		}

		this._pathCache.set(target, path);

		let proxy = this._proxyCache.get(target);

		if (proxy === undefined) {
			proxy = target[proxyTarget] === undefined ?
				new Proxy(target, handler) :
				target;

			this._proxyCache.set(target, proxy);
		}

		return proxy;
	}

	getPath(target) {
		return this.isUnsubscribed ? undefined : this._pathCache.get(target);
	}

	isDetached(target, object) {
		path.walk(this.getPath(target), key => {
			if (object) {
				object = object[key];
			}
		});

		return !Object.is(target, object);
	}

	defineProperty(target, property, descriptor) {
		if (!Reflect.defineProperty(target, property, descriptor)) {
			return false;
		}

		if (!this.isUnsubscribed) {
			this._getProperties(target)[property] = descriptor;
		}

		return true;
	}

	setProperty(target, property, value, receiver, previous) { // eslint-disable-line max-params
		if (!this._equals(previous, value) || !(property in target)) {
			const descriptor = this._getOwnPropertyDescriptor(target, property);

			if (descriptor !== undefined && 'set' in descriptor) {
				return Reflect.set(target, property, value, receiver);
			}

			return Reflect.set(target, property, value);
		}

		return true;
	}

	deleteProperty(target, property, previous) {
		if (Reflect.deleteProperty(target, property)) {
			if (!this.isUnsubscribed) {
				const properties = this._getDescriptorCache().get(target);

				if (properties) {
					delete properties[property];
					this._pathCache.delete(previous);
				}
			}

			return true;
		}

		return false;
	}

	isSameDescriptor(a, target, property) {
		const b = this._getOwnPropertyDescriptor(target, property);

		return a !== undefined &&
			b !== undefined &&
			Object.is(a.value, b.value) &&
			(a.writable || false) === (b.writable || false) &&
			(a.enumerable || false) === (b.enumerable || false) &&
			(a.configurable || false) === (b.configurable || false) &&
			a.get === b.get &&
			a.set === b.set;
	}

	isGetInvariant(target, property) {
		const descriptor = this._getOwnPropertyDescriptor(target, property);

		return descriptor !== undefined &&
			descriptor.configurable !== true &&
			descriptor.writable !== true;
	}

	unsubscribe() {
		this._descriptorCache = null;
		this._pathCache = null;
		this._proxyCache = null;
		this.isUnsubscribed = true;
	}
}

var cache = Cache;

var isObject = value => toString.call(value) === '[object Object]';

const certainChange = () => true;

const shallowEqualArrays = (clone, value) => {
	return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
};

const shallowEqualSets = (clone, value) => {
	if (clone.size !== value.size) {
		return true;
	}

	for (const element of clone) {
		if (!value.has(element)) {
			return true;
		}
	}

	return false;
};

const shallowEqualMaps = (clone, value) => {
	if (clone.size !== value.size) {
		return true;
	}

	let bValue;
	for (const [key, aValue] of clone) {
		bValue = value.get(key);

		if (bValue !== aValue || (bValue === undefined && !value.has(key))) {
			return true;
		}
	}

	return false;
};

const IMMUTABLE_OBJECT_METHODS = new Set([
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'toLocaleString',
	'toString',
	'valueOf'
]);

const IMMUTABLE_ARRAY_METHODS = new Set([
	'concat',
	'includes',
	'indexOf',
	'join',
	'keys',
	'lastIndexOf'
]);

const IMMUTABLE_SET_METHODS = new Set([
	'has',
	'toString'
]);

const IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS].concat(['get']));

const SHALLOW_MUTABLE_ARRAY_METHODS = {
	push: certainChange,
	pop: certainChange,
	shift: certainChange,
	unshift: certainChange,
	copyWithin: shallowEqualArrays,
	reverse: shallowEqualArrays,
	sort: shallowEqualArrays,
	splice: shallowEqualArrays,
	flat: shallowEqualArrays,
	fill: shallowEqualArrays
};

const SHALLOW_MUTABLE_SET_METHODS = {
	add: shallowEqualSets,
	clear: shallowEqualSets,
	delete: shallowEqualSets
};

const COLLECTION_ITERATOR_METHODS = [
	'keys',
	'values',
	'entries'
];

const SHALLOW_MUTABLE_MAP_METHODS = {
	set: shallowEqualMaps,
	clear: shallowEqualMaps,
	delete: shallowEqualMaps
};

const HANDLED_ARRAY_METHODS = new Set([...IMMUTABLE_OBJECT_METHODS]
	.concat([...IMMUTABLE_ARRAY_METHODS])
	.concat(Object.keys(SHALLOW_MUTABLE_ARRAY_METHODS)));

const HANDLED_SET_METHODS = new Set([...IMMUTABLE_SET_METHODS]
	.concat(Object.keys(SHALLOW_MUTABLE_SET_METHODS))
	.concat(COLLECTION_ITERATOR_METHODS));

const HANDLED_MAP_METHODS = new Set([...IMMUTABLE_MAP_METHODS]
	.concat(Object.keys(SHALLOW_MUTABLE_MAP_METHODS))
	.concat(COLLECTION_ITERATOR_METHODS));

class Clone {
	constructor(value, path, argumentsList) {
		this._path = path;
		this._isChanged = false;
		this._clonedCache = new Set();

		if (value instanceof WeakSet) {
			this._weakValue = value.has(argumentsList[0]);
		} else if (value instanceof WeakMap) {
			this._weakValue = value.get(argumentsList[0]);
		} else {
			this.clone = path === undefined ? value : this._shallowClone(value);
		}
	}

	_shallowClone(value) {
		let clone;

		if (isObject(value)) {
			clone = {...value};
		} else if (isArray(value)) {
			clone = [...value];
		} else if (value instanceof Date) {
			clone = new Date(value);
		} else if (value instanceof Set) {
			clone = new Set(value);
		} else if (value instanceof Map) {
			clone = new Map(value);
		}

		this._clonedCache.add(clone);

		return clone;
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		const {name} = target;

		if (SmartClone.isHandledMethod(thisProxyTarget, name)) {
			if (isArray(thisProxyTarget)) {
				this._onIsChanged = SHALLOW_MUTABLE_ARRAY_METHODS[name];
			} else if (thisProxyTarget instanceof Set) {
				this._onIsChanged = SHALLOW_MUTABLE_SET_METHODS[name];
			} else if (thisProxyTarget instanceof Map) {
				this._onIsChanged = SHALLOW_MUTABLE_MAP_METHODS[name];
			}

			return thisProxyTarget;
		}

		return thisArg;
	}

	update(fullPath, property, value) {
		if (value !== undefined && property !== 'length') {
			let object = this.clone;

			path.walk(path.after(fullPath, this._path), key => {
				if (!this._clonedCache.has(object[key])) {
					object[key] = this._shallowClone(object[key]);
				}

				object = object[key];
			});

			object[property] = value;
		}

		this._isChanged = true;
	}

	isChanged(value, equals, argumentsList) {
		if (value instanceof Date) {
			return !equals(this.clone.valueOf(), value.valueOf());
		}

		if (value instanceof WeakSet) {
			return this._weakValue !== value.has(argumentsList[0]);
		}

		if (value instanceof WeakMap) {
			return this._weakValue !== value.get(argumentsList[0]);
		}

		return this._onIsChanged === undefined ?
			this._isChanged :
			this._onIsChanged(this.clone, value);
	}
}

class SmartClone {
	constructor() {
		this.stack = [];
	}

	static isHandledType(value) {
		return isObject(value) ||
			isArray(value) ||
			isBuiltin_1.withMutableMethods(value);
	}

	static isHandledMethod(target, name) {
		if (isObject(target)) {
			return IMMUTABLE_OBJECT_METHODS.has(name);
		}

		if (isArray(target)) {
			return HANDLED_ARRAY_METHODS.has(name);
		}

		if (target instanceof Set) {
			return HANDLED_SET_METHODS.has(name);
		}

		if (target instanceof Map) {
			return HANDLED_MAP_METHODS.has(name);
		}

		return isBuiltin_1.withMutableMethods(target);
	}

	get isCloning() {
		return this.stack.length !== 0;
	}

	start(value, path, argumentsList) {
		this.stack.push(new Clone(value, path, argumentsList));
	}

	update(fullPath, property, value) {
		this.stack[this.stack.length - 1].update(fullPath, property, value);
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		return this.stack[this.stack.length - 1].preferredThisArg(target, thisArg, thisProxyTarget);
	}

	isChanged(isMutable, value, equals, argumentsList) {
		return this.stack[this.stack.length - 1].isChanged(isMutable, value, equals, argumentsList);
	}

	stop() {
		return this.stack.pop().clone;
	}
}

var smartClone = SmartClone;

const {TARGET, UNSUBSCRIBE} = constants;









const defaultOptions = {
	equals: Object.is,
	isShallow: false,
	pathAsArray: false,
	ignoreSymbols: false,
	ignoreUnderscores: false,
	ignoreDetached: false
};

const onChange = (object, onChange, options = {}) => {
	options = {
		...defaultOptions,
		...options
	};
	const proxyTarget = Symbol('ProxyTarget');
	const {equals, isShallow, ignoreDetached} = options;
	const cache$1 = new cache(equals);
	const smartClone$1 = new smartClone();

	const handleChangeOnTarget = (target, property, previous, value) => {
		if (
			!ignoreProperty(cache$1, options, property) &&
			!(ignoreDetached && cache$1.isDetached(target, object))
		) {
			handleChange(cache$1.getPath(target), property, previous, value);
		}
	};

	// eslint-disable-next-line max-params
	const handleChange = (changePath, property, previous, value, name) => {
		if (smartClone$1.isCloning) {
			smartClone$1.update(changePath, property, previous);
		} else {
			onChange(path.concat(changePath, property), value, previous, name);
		}
	};

	const getProxyTarget = value => {
		if (value) {
			return value[proxyTarget] || value;
		}

		return value;
	};

	const prepareValue = (value, target, property, basePath) => {
		if (
			isBuiltin_1.withoutMutableMethods(value) ||
			property === 'constructor' ||
			(isShallow && !smartClone.isHandledMethod(target, property)) ||
			ignoreProperty(cache$1, options, property) ||
			cache$1.isGetInvariant(target, property) ||
			(ignoreDetached && cache$1.isDetached(target, object))
		) {
			return value;
		}

		if (basePath === undefined) {
			basePath = cache$1.getPath(target);
		}

		return cache$1.getProxy(value, path.concat(basePath, property), handler, proxyTarget);
	};

	const handler = {
		get(target, property, receiver) {
			if (isSymbol(property)) {
				if (property === proxyTarget || property === TARGET) {
					return target;
				}

				if (
					property === UNSUBSCRIBE &&
					!cache$1.isUnsubscribed &&
					cache$1.getPath(target).length === 0
				) {
					cache$1.unsubscribe();
					return target;
				}
			}

			const value = isBuiltin_1.withMutableMethods(target) ?
				Reflect.get(target, property) :
				Reflect.get(target, property, receiver);

			return prepareValue(value, target, property);
		},

		set(target, property, value, receiver) {
			value = getProxyTarget(value);

			const reflectTarget = target[proxyTarget] || target;
			const previous = reflectTarget[property];
			const hasProperty = property in target;

			if (cache$1.setProperty(reflectTarget, property, value, receiver, previous)) {
				if (!equals(previous, value) || !hasProperty) {
					handleChangeOnTarget(target, property, previous, value);
				}

				return true;
			}

			return false;
		},

		defineProperty(target, property, descriptor) {
			if (!cache$1.isSameDescriptor(descriptor, target, property)) {
				if (!cache$1.defineProperty(target, property, descriptor)) {
					return false;
				}

				handleChangeOnTarget(target, property, undefined, descriptor.value);
			}

			return true;
		},

		deleteProperty(target, property) {
			if (!Reflect.has(target, property)) {
				return true;
			}

			const previous = Reflect.get(target, property);

			if (cache$1.deleteProperty(target, property, previous)) {
				handleChangeOnTarget(target, property, previous);

				return true;
			}

			return false;
		},

		apply(target, thisArg, argumentsList) {
			const thisProxyTarget = thisArg[proxyTarget] || thisArg;

			if (cache$1.isUnsubscribed) {
				return Reflect.apply(target, thisProxyTarget, argumentsList);
			}

			if (smartClone.isHandledType(thisProxyTarget)) {
				const applyPath = path.initial(cache$1.getPath(target));
				const isHandledMethod = smartClone.isHandledMethod(thisProxyTarget, target.name);

				smartClone$1.start(thisProxyTarget, applyPath, argumentsList);

				const result = Reflect.apply(
					target,
					smartClone$1.preferredThisArg(target, thisArg, thisProxyTarget),
					isHandledMethod ?
						argumentsList.map(argument => getProxyTarget(argument)) :
						argumentsList
				);

				const isChanged = smartClone$1.isChanged(thisProxyTarget, equals, argumentsList);
				const clone = smartClone$1.stop();

				if (isChanged) {
					if (smartClone$1.isCloning) {
						handleChange(path.initial(applyPath), path.last(applyPath), clone, thisProxyTarget, target.name);
					} else {
						handleChange(applyPath, '', clone, thisProxyTarget, target.name);
					}
				}

				if (
					(thisArg instanceof Map || thisArg instanceof Set) &&
					isIterator(result)
				) {
					return wrapIterator(result, target, thisArg, applyPath, prepareValue);
				}

				return (smartClone.isHandledType(result) && isHandledMethod) ?
					cache$1.getProxy(result, applyPath, handler, proxyTarget) :
					result;
			}

			return Reflect.apply(target, thisArg, argumentsList);
		}
	};

	const proxy = cache$1.getProxy(object, options.pathAsArray ? [] : '', handler);
	onChange = onChange.bind(proxy);

	return proxy;
};

onChange.target = proxy => proxy[TARGET] || proxy;
onChange.unsubscribe = proxy => proxy[UNSUBSCRIBE] || proxy;

var onChange_1 = onChange;

var rfdc_1 = rfdc;

function copyBuffer (cur) {
  if (cur instanceof Buffer) {
    return Buffer.from(cur)
  }

  return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length)
}

function rfdc (opts) {
  opts = opts || {};

  if (opts.circles) return rfdcCircles(opts)
  return opts.proto ? cloneProto : clone

  function cloneArray (a, fn) {
    var keys = Object.keys(a);
    var a2 = new Array(keys.length);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var cur = a[k];
      if (typeof cur !== 'object' || cur === null) {
        a2[k] = cur;
      } else if (cur instanceof Date) {
        a2[k] = new Date(cur);
      } else if (ArrayBuffer.isView(cur)) {
        a2[k] = copyBuffer(cur);
      } else {
        a2[k] = fn(cur);
      }
    }
    return a2
  }

  function clone (o) {
    if (typeof o !== 'object' || o === null) return o
    if (o instanceof Date) return new Date(o)
    if (Array.isArray(o)) return cloneArray(o, clone)
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), clone))
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), clone))
    var o2 = {};
    for (var k in o) {
      if (Object.hasOwnProperty.call(o, k) === false) continue
      var cur = o[k];
      if (typeof cur !== 'object' || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), clone));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), clone));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        o2[k] = clone(cur);
      }
    }
    return o2
  }

  function cloneProto (o) {
    if (typeof o !== 'object' || o === null) return o
    if (o instanceof Date) return new Date(o)
    if (Array.isArray(o)) return cloneArray(o, cloneProto)
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), cloneProto))
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), cloneProto))
    var o2 = {};
    for (var k in o) {
      var cur = o[k];
      if (typeof cur !== 'object' || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), cloneProto));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), cloneProto));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        o2[k] = cloneProto(cur);
      }
    }
    return o2
  }
}

function rfdcCircles (opts) {
  var refs = [];
  var refsNew = [];

  return opts.proto ? cloneProto : clone

  function cloneArray (a, fn) {
    var keys = Object.keys(a);
    var a2 = new Array(keys.length);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var cur = a[k];
      if (typeof cur !== 'object' || cur === null) {
        a2[k] = cur;
      } else if (cur instanceof Date) {
        a2[k] = new Date(cur);
      } else if (ArrayBuffer.isView(cur)) {
        a2[k] = copyBuffer(cur);
      } else {
        var index = refs.indexOf(cur);
        if (index !== -1) {
          a2[k] = refsNew[index];
        } else {
          a2[k] = fn(cur);
        }
      }
    }
    return a2
  }

  function clone (o) {
    if (typeof o !== 'object' || o === null) return o
    if (o instanceof Date) return new Date(o)
    if (Array.isArray(o)) return cloneArray(o, clone)
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), clone))
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), clone))
    var o2 = {};
    refs.push(o);
    refsNew.push(o2);
    for (var k in o) {
      if (Object.hasOwnProperty.call(o, k) === false) continue
      var cur = o[k];
      if (typeof cur !== 'object' || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), clone));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), clone));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        var i = refs.indexOf(cur);
        if (i !== -1) {
          o2[k] = refsNew[i];
        } else {
          o2[k] = clone(cur);
        }
      }
    }
    refs.pop();
    refsNew.pop();
    return o2
  }

  function cloneProto (o) {
    if (typeof o !== 'object' || o === null) return o
    if (o instanceof Date) return new Date(o)
    if (Array.isArray(o)) return cloneArray(o, cloneProto)
    if (o instanceof Map) return new Map(cloneArray(Array.from(o), cloneProto))
    if (o instanceof Set) return new Set(cloneArray(Array.from(o), cloneProto))
    var o2 = {};
    refs.push(o);
    refsNew.push(o2);
    for (var k in o) {
      var cur = o[k];
      if (typeof cur !== 'object' || cur === null) {
        o2[k] = cur;
      } else if (cur instanceof Date) {
        o2[k] = new Date(cur);
      } else if (cur instanceof Map) {
        o2[k] = new Map(cloneArray(Array.from(cur), cloneProto));
      } else if (cur instanceof Set) {
        o2[k] = new Set(cloneArray(Array.from(cur), cloneProto));
      } else if (ArrayBuffer.isView(cur)) {
        o2[k] = copyBuffer(cur);
      } else {
        var i = refs.indexOf(cur);
        if (i !== -1) {
          o2[k] = refsNew[i];
        } else {
          o2[k] = cloneProto(cur);
        }
      }
    }
    refs.pop();
    refsNew.pop();
    return o2
  }
}

var _default = rfdc_1();

function _new$o(column) {
	column.purify = purify_1$4;
	column.encode = newEncode$5(column);
	column.decode = newDecodeCore(column);
	column.onChange = onChange_1;
	column.toDto = toDto$1;
}

function toDto$1(value) {
	return _default(value);
}

var json = _new$o;

function negotiateGuidFormat(candidate) {
	if(candidate == null)
		return null;
	var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if(!pattern.test(candidate))
		throw new TypeError(candidate +  ' is not a valid UUID');
	return candidate;
}

var purify$4 = negotiateGuidFormat;

function _new$n(column) {

	return function(candidate) {
		var value = purify$4(candidate);
		if (value == null) {
			if(column.dbNull === null)
				return newParameterized$1('null');
			return newParameterized$1('\'' + column.dbNull + '\'');
		}
		return newParameterized$1('\'' + value + '\'');
	};
}

var newEncode$4 = _new$n;

function _new$m(column) {
	column.purify = purify$4;
	column.encode = newEncode$4(column);
	column.decode = newDecodeCore(column);
}

var guid = _new$m;

var pattern = /(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d)/;

function tryParseISO(iso) {
	if (pattern.test(iso))
		return iso;
}

var tryParseISO_1 = tryParseISO;

function getISOTimezone(date) {
	var tzo = -date.getTimezoneOffset();
	var dif = tzo >= 0 ? '+' : '-';
	return dif + pad$1(tzo / 60) + ':' + pad$1(tzo % 60);
}

function pad$1(num) {
	var norm = Math.abs(Math.floor(num));
	return (norm < 10 ? '0' : '') + norm;
}

var getISOTimezone_1 = getISOTimezone;

function toISOString(date) {
	return date.getFullYear() +
         '-' + pad(date.getMonth()+1) +
         '-' + pad(date.getDate()) +
         'T' + pad(date.getHours()) +
         ':' + pad(date.getMinutes()) +
         ':' + pad(date.getSeconds()) +
         '.' + pad(date.getMilliseconds()) +
         getISOTimezone_1(date);
}

function pad(num) {
	var norm = Math.abs(Math.floor(num));
	return (norm < 10 ? '0' : '') + norm;
}



var toISOString_1 = toISOString;

function cloneDate(date) {
	date = new Date(date);

	Object.defineProperty(date, 'toISOString', {
		enumerable: false,
		configurable: true,
		writable: true,
		value: function() {
			return toISOString_1(date);
		}
	});
	return date;
}

var cloneDate_1 = cloneDate;

function purify$3(value) {
	if(value == null)
		return null;

	if (value.toISOString)
		return cloneDate_1(value);

	var iso = tryParseISO_1(value);
	if (iso)
		return iso;

	return cloneDate_1(value);
}

var purify_1$3 = purify$3;

function _newSafe(column, purify) {

	return function(value) {
		value = purify(value);
		if (value == null) {
			if (column.dbNull === null)
				return newParameterized$1('null');
			return newParameterized$1('\'' + column.dbNull + '\'');
		}
		return newParameterized$1('?', [value]);
	};
}

var newEncodeSafe = _newSafe;

function newDiscriminatorSql$1(table, alias) {
	var result = '';
	var formulaDiscriminators = table._formulaDiscriminators;
	var columnDiscriminators = table._columnDiscriminators;
	addFormula();
	addColumn();
	return result;

	function addFormula() {
		for (var i = 0; i<formulaDiscriminators.length; i++) {
			var current = formulaDiscriminators[i].replace('@this',alias);
			and();
			result += '(' + current + ')';
		}
	}

	function addColumn() {
		for (var i = 0; i< columnDiscriminators.length; i++) {
			var current = columnDiscriminators[i];
			and();
			result += alias + '.' + current;
		}
	}

	function and() {
		if(result)
			result += ' AND ';
		else
			result = ' ';
	}
}

var newDiscriminatorSql_1$1 = newDiscriminatorSql$1;

function newWhereSql$2(table,filter,alias) {
	var separator = ' where';
	var result = '';
	var sql = filter.sql();
	var discriminator = newDiscriminatorSql_1$1(table, alias);
	if (sql) {
		result = separator + ' ' + sql;
		separator = ' AND';
	}
	if(discriminator)
		result += separator + discriminator;
	return result;
}

var newWhereSql_1 = newWhereSql$2;

function encodeBoolean(bool) {
	return bool.toString();
}

var encodeBoolean_1 = encodeBoolean;

function encodeDate(date) {
	if (date.toISOString)
		return  '\'' + date.toISOString() + '\'';
	return '\'' + date + '\'';
}

var encodeDate_1 = encodeDate;

var format = 'delete from %s %s%s';


function deleteFromSql(table, alias, whereSql) {
	var name = table._dbName;
	return util$2.format(format, name, alias, whereSql);
}
var deleteFromSql_1 = deleteFromSql;

var selectForUpdateSql = function(alias) {
	return ' FOR UPDATE OF ' + alias;
};

var hostExpress = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

let browserContext = {
	changes: [],
	encodeBoolean: encodeBoolean_1,
	encodeDate: encodeDate_1,
	deleteFromSql: deleteFromSql_1,
	selectForUpdateSql: selectForUpdateSql,
	multipleStatements: true,
	accept: (caller) => caller.visitPg(),
	getManyDto: getManyDto$1,
	dbClient: {
		executeQuery: executeQuery$1
	},
	id: undefined,
};

async function getManyDto$1(table, filter, strategy) {
	let body = JSON.stringify(
		{
			table: table._dbName,
			columnDiscriminators: table._columnDiscriminators,
			formulaDiscriminators: table._formulaDiscriminators,
			sqlWhere: newWhereSql_1(table, filter, table._dbName).replace(' where ','') ,
			parameters: filter && filter.parameters,
			strategy});
	// eslint-disable-next-line no-undef
	var headers = new Headers();
	headers.append('Content-Type', 'application/json');
	// eslint-disable-next-line no-undef
	let request = new Request(`${flags_1.url}`, {method: 'POST', headers, body});
	// eslint-disable-next-line no-undef
	let response = await fetch(request);
	if (response.status === 200) {
		return response.json();
	}
	else {
		let msg = response.json && await response.json() || `Status ${response.status} from server`;
		let e = new Error(msg);
		// @ts-ignore
		e.status = response.status;
		throw e;
	}
}

async function executeQuery$1(query, onCompleted) {
	let body = JSON.stringify({sql: query.sql(), parameters: query.parameters});
	// eslint-disable-next-line no-undef
	var headers = new Headers();
	headers.append('Content-Type', 'application/json');
	// eslint-disable-next-line no-undef
	let request = new Request(`${flags_1.url}`, {method: 'PUT', headers, body});
	try {
		// eslint-disable-next-line no-undef
		let response = await fetch(request);
		if (response.status === 200) {
			onCompleted(undefined, await response.json());
		}
		else {
			let msg = response.json && await response.json() || `Status ${response.status} from server`;
			let e = new Error(msg);
			// @ts-ignore
			e.status = response.status;
			onCompleted(e);
		}

	}
	catch(error) {
		onCompleted(error);
	}
}

function getSessionContext() {
	if (flags_1.url) {
		return browserContext;
	}
	if (hostExpress())
		return hostExpress.getContext('rdb').rdb;
	else
		return hostExpress.domain.rdb;
}

var getSessionContext_1 = getSessionContext;

var getSessionSingleton = function(name) {
	return getSessionContext_1()[name];
};

function _new$l(column) {
	var encode = function(value) {
		value = purify_1$3(value);
		if (value == null) {
			if (column.dbNull === null)
				return newParameterized$1('null');
			return newParameterized$1('\'' + column.dbNull + '\'');
		}
		var encodeCore = getSessionSingleton('encodeDate');
		return newParameterized$1(encodeCore(value));
	};

	encode.safe = newEncodeSafe(column, purify_1$3);
	return encode;

}

var newEncode$3 = _new$l;

function _new$k(column) {
	var decodeCore = newDecodeCore(column);

	return function(value) {
		value = decodeCore(value);
		if (value === null)
			return value;
		return cloneDate_1(value);
	};
}

var newDecode$2 = _new$k;

function _new$j(column) {
	column.purify = purify_1$3;
	column.encode = newEncode$3(column);
	column.decode = newDecode$2(column);
}

var date = _new$j;

function purify$2(value) {
	if(value == null)
		return null;
	if (typeof(value) !== 'number')
		throw new Error('\'' + value + '\'' + ' is not a number');
	return value;
}

var purify_1$2 = purify$2;

var newEncode$2 = function(column) {
	return encode;

	function encode(value) {
		value = purify_1$2(value);
		if (value == null) {
			var dbNull = column.dbNull;
			return newParameterized$1('' + dbNull + '');
		}
		return newParameterized$1('' + value);
	}
};

function _new$i(column) {
	var decodeCore = newDecodeCore(column);

	return function(value) {
		value = decodeCore(value);
		if (value === null)
			return value;
		if (typeof(value) !== 'number')
			return parseFloat(value);
		return value;
	};
}

var newDecode$1 = _new$i;

function _new$h(column) {
	column.default = 0;
	column.purify = purify_1$2;
	column.encode = newEncode$2(column);
	column.decode = newDecode$1(column);
}

var numeric = _new$h;

function purify$1(value) {
	if (value === null || typeof (value) === 'undefined')
		return null;
	return Boolean(value);
}

var purify_1$1 = purify$1;

function _new$g(column) {


	function encode(value) {
		value = purify_1$1(value);
		if (value === null) {
			if (column.dbNull === null)
				return newParameterized$1('null');
			return newParameterized$1('\'' + column.dbNull + '\'');
		}
		var encodeCore =  getSessionSingleton('encodeBoolean');

		if (value)
			return newParameterized$1(encodeCore(true));
		return newParameterized$1(encodeCore(false));
	}

	encode.safe = newEncodeSafe(column, purify_1$1);
	return encode;
}

var newEncode$1 = _new$g;

function _new$f(column) {

	return function(value) {
		if (value == column.dbNull)
			return null;
		return purify_1$1(value);
	};
}

var newDecode = _new$f;

function _new$e(column) {
	column.purify = purify_1$1;
	column.default = false;
	column.encode = newEncode$1(column);
	column.decode = newDecode(column);
}

var boolean = _new$e;

function purify(value) {
	if(value == null)
		return null;
	if (!Buffer.isBuffer(value))
		throw new Error('\'' + value + '\'' + ' is not a buffer');
	return value;
}

var purify_1 = purify;

function _new$d() {

	return encode;

	function encode(value) {
		value = purify_1(value);
		if (value === null)
			return newParameterized$1('null');
		return newParameterized$1('?', [value]);
	}
}

var newEncode = _new$d;

function _new$c(column) {
	column.purify = purify_1;
	column.encode = newEncode();
	column.decode = newDecodeCore(column);
}

var binary = _new$c;

let inspect$1 = util$2.inspect;

function defineColumn(column, table) {
	var c = {};

	c.string = function() {
		string(table, column);
		return c;
	};

	c.json = function() {
		json(column);
		return c;
	};

	c.guid = function() {
		guid(column);
		return c;
	};

	c.date = function() {
		date(column);
		return c;
	};

	c.numeric = function(optionalPrecision,optionalScale) {
		numeric(column);
		return c;
	};

	c.boolean = function() {
		boolean(column);
		return c;
	};

	c.binary = function() {
		binary(column);
		return c;
	};

	c.default = function(value) {
		column.default = value;
		return c;
	};

	c.as = function(alias) {
		var oldAlias = column.alias;
		delete table[oldAlias];
		table[alias] = column;
		column.alias = alias;
		return c;
	};

	c.dbNull = function(value) {
		column.dbNull = value;
		return c;
	};

	c.serializable = function(value) {
		column.serializable = value;
		return c;
	};

	c.validate = function(value) {
		column.validate = value;
		return c;
	};

	c.JSONSchema = function(schema, options) {
		let ajv$1 = new ajv(options);
		let validate = ajv$1.compile(schema);
		column.validate = _validate;

		function _validate(value) {
			let valid = validate(value);
			if (!valid) {
				let e = new Error(`Column ${table._dbName}.${column._dbName} violates JSON Schema: ${inspect$1(validate.errors, false, 10)}`);
				e.errors = validate.errors;
				throw e;
			}
		}
		return c;
	};

	return c;
}

var column = defineColumn;

function newCollection() {
	var c = {};
	var initialArgs = [];
	for (var i = 0; i < arguments.length; i++) {
		initialArgs.push(arguments[i]);
	}
	var ranges = [initialArgs];

	c.addRange = function(otherCollection) {
		ranges.push(otherCollection);
	};

	c.add = function(element) {
		c.addRange([element]);
	};

	c.toArray = function() {
		var result = [];
		c.forEach(onEach);
		return result;

		function onEach(element) {
			result.push(element);
		}
	};

	c.forEach = function(callback) {
		var index = 0;
		for (var i = 0; i < ranges.length; i++) {
			ranges[i].forEach(onEach);
		}

		function onEach(element) {
			callback(element, index);
			index++;
		}

	};

	Object.defineProperty(c, 'length', {
		enumerable: false,
		get: function() {
			var result = 0;
			for (var i = 0; i < ranges.length; i++) {
				result += ranges[i].length;
			}
			return result;
		},
	});


	return c;
}

var newCollection_1 = newCollection;

function newQueryContext() {
	var rows = [];

	var c = {};
	c.rows = rows;

	c.expand = function(relation) {
		rows.forEach(function(row) {
			relation.expand(row);
		});
	};

	c.add = function(row) {
		rows.push(row);
	};

	return c;
}

var newQueryContext_1 = newQueryContext;

function newLeg$2(relation) {
	var c = {};
	var span = {};
	span.table = relation.childTable;
	span.legs = newCollection_1();
	span.queryContext = newQueryContext_1();
	c.span = span;
	c.name = relation.leftAlias;
	c.table = relation.parentTable;
	c.columns = relation.columns;
	c.expand = relation.expand;

	c.accept = function(visitor) {
		visitor.visitJoin(c);
	};

	return c;
}

var newJoinLeg = newLeg$2;

function tryGet$2(table) {
	var fakeRow = {};
	var args = arguments;
	table._primaryColumns.forEach(addPkValue);

	function addPkValue(pkColumn, index){
		fakeRow[pkColumn.alias] = args[index + 1];
	}

	return table._cache.tryGet(fakeRow);
}
var tryGetFromCacheById = tryGet$2;

function primaryKeyFilter(table) {
	var primaryColumns = table._primaryColumns;
	var key = arguments[1];
	var filter = primaryColumns[0].equal(key);
	for (var i = 1; i < primaryColumns.length; i++) {
		key = arguments[i+1];
		var colFilter = primaryColumns[i].equal(key);
		filter = filter.and(colFilter);
	}
	return filter;
}

var newPrimaryKeyFilter = primaryKeyFilter;

function _new$b(table,alias) {
	var aliasDot = alias + '.';
	var commaAliasDot = ',' + aliasDot;
	var columns = table._columns;
	var sql = aliasDot + encodeColumn(0);
	for (var i = 1; i < columns.length; i++) {
		sql = sql + commaAliasDot + encodeColumn(i);
	}
	return sql;

	function encodeColumn(i) {
		return columns[i]._dbName + ' as s' + alias + i;
	}
}

var newShallowColumnSql$2 = _new$b;

var newJoinedColumnSql$1 = _initJOinedColumnSql;

function sql(leg,alias) {
	var span = leg.span;
	var shallowColumnSql = newShallowColumnSql$2(span.table,alias);
	var joinedColumnSql = newJoinedColumnSql$1(span,alias);
	return ',' + shallowColumnSql + joinedColumnSql;
}

function _initJOinedColumnSql(span,alias) {
	newJoinedColumnSql$1 = newJoinedColumnSql;
	return newJoinedColumnSql$1(span,alias);
}

var joinLegToColumnSql = sql;

var newJoinedColumnSql = function(span,alias) {
	var index = 0;
	var c = {};
	var sql = '';

	c.visitJoin = function(leg) {
		var joinSql = joinLegToColumnSql(leg,alias + '_' + index);
		sql = sql + joinSql;
	};

	c.visitOne = function(leg) {
		c.visitJoin(leg);
	};

	c.visitMany = function() {
	};

	span.legs.forEach(onEach);


	function onEach(leg) {
		leg.accept(c);
		index++;
	}

	return sql;
};

var newColumnSql = function(table,span,alias) {
	var shallowColumnSql = newShallowColumnSql$2(table,alias);
	var joinedColumnSql = newJoinedColumnSql(span,alias);
	return shallowColumnSql + joinedColumnSql;
};

function newDiscriminatorSql(table, alias) {
	var result = newDiscriminatorSql_1$1(table,alias);
	if (result)
		return ' AND' + result;
	return result;

}

var newDiscriminatorSql_1 = newDiscriminatorSql;

function _new$a(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) {
	var sql = '';
	var delimiter = '';
	for (var i = 0; i < leftColumns.length; i++) {
		addColumn(i);
		delimiter = ' AND ';
	}

	function addColumn(index) {
		var leftColumn = leftColumns[index];
		var rightColumn = rightColumns[index];
		sql += delimiter + leftAlias + '.' + leftColumn._dbName + '=' + rightAlias + '.' + rightColumn._dbName;
	}

	sql += newDiscriminatorSql_1(rightTable,rightAlias);
	return sql;
}

var newShallowJoinSqlCore = _new$a;

function _new$9(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) {
	var sql = ' JOIN ' + rightTable._dbName + ' ' +  rightAlias + ' ON (';
	sql += newShallowJoinSqlCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias) + ')';
	return sql;
}

var newShallowJoinSql = _new$9;

function toJoinSql$3(leg,alias,childAlias) {
	var columns = leg.columns;
	var childTable = leg.span.table;
	return ' LEFT' + newShallowJoinSql(childTable,columns,childTable._primaryColumns,alias,childAlias);
}

var joinLegToShallowJoinSql = toJoinSql$3;

var newJoinSql$4 = _newJoinSql$1;

function toJoinSql$2(leg,alias,childAlias) {
	return joinLegToShallowJoinSql(leg,alias,childAlias) +
			newJoinSql$4(leg.span,childAlias);
}

function _newJoinSql$1() {
	newJoinSql$4 = newJoinSql$2;
	return newJoinSql$4.apply(null,arguments);
}

var joinLegToJoinSql = toJoinSql$2;

function toJoinSql$1(leg,alias,childAlias) {
	var parentTable = leg.table;
	var columns = leg.columns;
	var childTable = leg.span.table;
	return ' LEFT' + newShallowJoinSql(childTable,parentTable._primaryColumns,columns,alias,childAlias);
}

var oneLegToShallowJoinSql = toJoinSql$1;

var newJoinSql$3 = _newJoinSql;

function toJoinSql(leg,alias,childAlias) {
	return oneLegToShallowJoinSql(leg,alias,childAlias) +
			newJoinSql$3(leg.span,childAlias);
}

function _newJoinSql() {
	newJoinSql$3 = newJoinSql$2;
	return newJoinSql$3.apply(null,arguments);
}

var oneLegToJoinSql = toJoinSql;

function _new$8(span,alias) {
	var sql = '';
	var legNo = 0;
	var childAlias;

	var c = {};
	c.visitJoin = function(leg) {
		sql = sql + joinLegToJoinSql(leg,alias,childAlias);
	};

	c.visitOne = function(leg) {
		sql = sql + oneLegToJoinSql(leg,alias,childAlias);
	};

	c.visitMany = function() {};

	function onEachLeg(leg) {
		childAlias = alias + '_' + legNo;
		leg.accept(c);
		legNo++;
	}

	span.legs.forEach(onEachLeg);
	return sql;
}

var newJoinSql$2 = _new$8;

function negotiateLimit(limit) {
	if(!limit)
		return '';

	if(limit.charAt(0) !== ' ')
		return ' ' + limit;
	return limit;
}

var negotiateLimit_1 = negotiateLimit;

function negotiateExclusive(table, alias, _exclusive) {
	if (table._exclusive || _exclusive) {
		var encode =  getSessionSingleton('selectForUpdateSql');
		return encode(alias);
	}
	return '';
}

var negotiateExclusive_1 = negotiateExclusive;

function _new$7(table,filter,span,alias,innerJoin,orderBy,limit,exclusive) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newColumnSql(table,span,alias);
		var innerJoinSql = innerJoin.sql();
		var joinSql = newJoinSql$2(span,alias);
		var whereSql = newWhereSql_1(table,filter,alias);
		var safeLimit = negotiateLimit_1(limit);
		var exclusiveClause = negotiateExclusive_1(table,alias,exclusive);
		return 'select ' + columnSql + ' from ' + name + ' ' + alias + innerJoinSql + joinSql + whereSql + orderBy + safeLimit + exclusiveClause;
	};

	c.parameters = innerJoin.parameters.concat(filter.parameters);

	return c;
}

var newSingleQuery$2 = _new$7;

var parameterized = newParameterized$1('');
function emptyFilter() {
	return emptyFilter.and.apply(null, arguments);
}

emptyFilter.sql = parameterized.sql;
emptyFilter.parameters = parameterized.parameters;

emptyFilter.and = function(other) {
	other = negotiateRawSqlFilter_1(other);
	for (var i = 1; i < arguments.length; i++) {
		other = other.and(arguments[i]);
	}
	return other;
};

emptyFilter.or = function(other) {
	other = negotiateRawSqlFilter_1(other);
	for (var i = 1; i < arguments.length; i++) {
		other = other.or(arguments[i]);
	}
	return other;
};

emptyFilter.not = function() {
	return emptyFilter;
};

var emptyFilter_1 = emptyFilter;

function extract$1(filter) {
	if (filter)
		return filter;
	return emptyFilter_1;
}

var extractFilter = extract$1;

function extractOrderBy$1(table, alias, orderBy, originalOrderBy) {
	var dbNames = [];
	var i;
	if (orderBy) {
		if (typeof orderBy === 'string')
			orderBy = [orderBy];
		for (i = 0; i < orderBy.length; i++) {
			var nameAndDirection = extractNameAndDirection(orderBy[i]);
			pushColumn(nameAndDirection.name, nameAndDirection.direction);
		}
	} else {
		if(originalOrderBy)
			return originalOrderBy;

		for (i = 0; i < table._primaryColumns.length; i++) {
			pushColumn(table._primaryColumns[i].alias);
		}
	}

	function extractNameAndDirection(orderBy) {
		var elements = orderBy.split(' ');
		var direction = '';
		if (elements.length > 1) {
			direction = ' ' + elements[1];
		}
		return {
			name: elements[0],
			direction: direction
		};
	}
	function pushColumn(property, direction) {
		direction = direction || '';
		var column = getTableColumn(property);
		var jsonQuery = getJsonQuery(property, column.alias);

		dbNames.push(alias + '.' + column._dbName + jsonQuery + direction);
	}

	function getTableColumn(property) {
		var column = table[property] || table[property.split(/(-|#)>+/g)[0]];
		if(!column){
			throw new Error(`Unable to get column on orderBy '${property}'. If jsonb query, only #>, #>>, -> and ->> allowed. Only use ' ' to seperate between query and direction. Does currently not support casting.`);
		}
		return column;
	}
	function getJsonQuery(property, column) {
		let containsJson = (/(-|#)>+/g).test(property);
		if(!containsJson){
			return '';
		}
		return property.replace(column, '');
	}

	return ' order by ' + dbNames.join(',');
}

var extractOrderBy_1$1 = extractOrderBy$1;

function extractLimit$1(span) {
	if (span.limit) {
		return ' limit ' + span.limit;
	}
	return '';
}

var extractLimit_1$1 = extractLimit$1;

function newQuery$6(queries,table,filter,span,alias,innerJoin,orderBy,exclusive) {
	filter = extractFilter(filter);
	orderBy = extractOrderBy_1$1(table,alias,span.orderBy,orderBy);
	var limit = extractLimit_1$1(span);
	var singleQuery = newSingleQuery$2(table,filter,span,alias,innerJoin,orderBy,limit,exclusive);
	queries.push(singleQuery);

	return queries;
}

var newQuery_1$5 = newQuery$6;

function resolveExecuteQuery(query) {
	return resolve;

	function resolve(success, failed) {
		try {

			var domain = hostExpress && hostExpress.domain;
			if (domain) {
				success = hostExpress.domain.bind(success);
				failed = hostExpress.domain.bind(failed);
			}

			var client = getSessionSingleton('dbClient');
			client.executeQuery(query, onCompleted);
		} catch (e) {
			failed(e);
		}

		function onCompleted(err, rows) {
			if (!err) {
				var lastIndex = rows.length - 1;
				if (!Array.isArray(rows[0]) && Array.isArray(rows[lastIndex]))
					rows = rows[lastIndex];
				success(rows);
			} else
				failed(err);
		}
	}


}

var resolveExecuteQuery_1 = resolveExecuteQuery;

function executeQuery(query) {
	var resolver = resolveExecuteQuery_1(query);
	return new Promise(resolver);
}

var executeQuery_1 = executeQuery;

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
var browserRaw = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` or `self` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.

/* globals self */
var scope = typeof commonjsGlobal !== "undefined" ? commonjsGlobal : self;
var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// rawAsap provides everything we need except exception management.

// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = browserRaw.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
var browserAsap = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    browserRaw(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

var core = Promise$1;

function Promise$1(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Promise constructor\'s argument is not a function');
  }
  this._U = 0;
  this._V = 0;
  this._W = null;
  this._X = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise$1._Y = null;
Promise$1._Z = null;
Promise$1._0 = noop;

Promise$1.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise$1) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise$1(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise$1(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
}
function handle(self, deferred) {
  while (self._V === 3) {
    self = self._W;
  }
  if (Promise$1._Y) {
    Promise$1._Y(self);
  }
  if (self._V === 0) {
    if (self._U === 0) {
      self._U = 1;
      self._X = deferred;
      return;
    }
    if (self._U === 1) {
      self._U = 2;
      self._X = [self._X, deferred];
      return;
    }
    self._X.push(deferred);
    return;
  }
  handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
  browserAsap(function() {
    var cb = self._V === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._V === 1) {
        resolve(deferred.promise, self._W);
      } else {
        reject(deferred.promise, self._W);
      }
      return;
    }
    var ret = tryCallOne(cb, self._W);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise$1
    ) {
      self._V = 3;
      self._W = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._V = 1;
  self._W = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._V = 2;
  self._W = newValue;
  if (Promise$1._Z) {
    Promise$1._Z(self, newValue);
  }
  finale(self);
}
function finale(self) {
  if (self._U === 1) {
    handle(self, self._X);
    self._X = null;
  }
  if (self._U === 2) {
    for (var i = 0; i < self._X.length; i++) {
      handle(self, self._X[i]);
    }
    self._X = null;
  }
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  });
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}

core.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this;
  self.then(null, function (err) {
    setTimeout(function () {
      throw err;
    }, 0);
  });
};

core.prototype.finally = function (f) {
  return this.then(function (value) {
    return core.resolve(f()).then(function () {
      return value;
    });
  }, function (err) {
    return core.resolve(f()).then(function () {
      throw err;
    });
  });
};

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new core(core._0);
  p._V = 1;
  p._W = value;
  return p;
}
core.resolve = function (value) {
  if (value instanceof core) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new core(then.bind(value));
      }
    } catch (ex) {
      return new core(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

var iterableToArray = function (iterable) {
  if (typeof Array.from === 'function') {
    // ES2015+, iterables exist
    iterableToArray = Array.from;
    return Array.from(iterable);
  }

  // ES5, only arrays and array-likes exist
  iterableToArray = function (x) { return Array.prototype.slice.call(x); };
  return Array.prototype.slice.call(iterable);
};

core.all = function (arr) {
  var args = iterableToArray(arr);

  return new core(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof core && val.then === core.prototype.then) {
          while (val._V === 3) {
            val = val._W;
          }
          if (val._V === 1) return res(i, val._W);
          if (val._V === 2) reject(val._W);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new core(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

core.reject = function (value) {
  return new core(function (resolve, reject) {
    reject(value);
  });
};

core.race = function (values) {
  return new core(function (resolve, reject) {
    iterableToArray(values).forEach(function(value){
      core.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

core.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};

/* Static Functions */

core.denodeify = function (fn, argumentCount) {
  if (
    typeof argumentCount === 'number' && argumentCount !== Infinity
  ) {
    return denodeifyWithCount(fn, argumentCount);
  } else {
    return denodeifyWithoutCount(fn);
  }
};

var callbackFn = (
  'function (err, res) {' +
  'if (err) { rj(err); } else { rs(res); }' +
  '}'
);
function denodeifyWithCount(fn, argumentCount) {
  var args = [];
  for (var i = 0; i < argumentCount; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'return new Promise(function (rs, rj) {',
    'var res = fn.call(',
    ['self'].concat(args).concat([callbackFn]).join(','),
    ');',
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');
  return Function(['Promise', 'fn'], body)(core, fn);
}
function denodeifyWithoutCount(fn) {
  var fnLength = Math.max(fn.length - 1, 3);
  var args = [];
  for (var i = 0; i < fnLength; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'var args;',
    'var argLength = arguments.length;',
    'if (arguments.length > ' + fnLength + ') {',
    'args = new Array(arguments.length + 1);',
    'for (var i = 0; i < arguments.length; i++) {',
    'args[i] = arguments[i];',
    '}',
    '}',
    'return new Promise(function (rs, rj) {',
    'var cb = ' + callbackFn + ';',
    'var res;',
    'switch (argLength) {',
    args.concat(['extra']).map(function (_, index) {
      return (
        'case ' + (index) + ':' +
        'res = fn.call(' + ['self'].concat(args.slice(0, index)).concat('cb').join(',') + ');' +
        'break;'
      );
    }).join(''),
    'default:',
    'args[argLength] = cb;',
    'res = fn.apply(self, args);',
    '}',
    
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');

  return Function(
    ['Promise', 'fn'],
    body
  )(core, fn);
}

core.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback =
      typeof args[args.length - 1] === 'function' ? args.pop() : null;
    var ctx = this;
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx);
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new core(function (resolve, reject) {
          reject(ex);
        });
      } else {
        browserAsap(function () {
          callback.call(ctx, ex);
        });
      }
    }
  }
};

core.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != 'function') return this;

  this.then(function (value) {
    browserAsap(function () {
      callback.call(ctx, null, value);
    });
  }, function (err) {
    browserAsap(function () {
      callback.call(ctx, err);
    });
  });
};

core.enableSynchronous = function () {
  core.prototype.isPending = function() {
    return this.getState() == 0;
  };

  core.prototype.isFulfilled = function() {
    return this.getState() == 1;
  };

  core.prototype.isRejected = function() {
    return this.getState() == 2;
  };

  core.prototype.getValue = function () {
    if (this._V === 3) {
      return this._W.getValue();
    }

    if (!this.isFulfilled()) {
      throw new Error('Cannot get a value of an unfulfilled promise.');
    }

    return this._W;
  };

  core.prototype.getReason = function () {
    if (this._V === 3) {
      return this._W.getReason();
    }

    if (!this.isRejected()) {
      throw new Error('Cannot get a rejection reason of a non-rejected promise.');
    }

    return this._W;
  };

  core.prototype.getState = function () {
    if (this._V === 3) {
      return this._W.getState();
    }
    if (this._V === -1 || this._V === -2) {
      return 0;
    }

    return this._V;
  };
};

core.disableSynchronous = function() {
  core.prototype.isPending = undefined;
  core.prototype.isFulfilled = undefined;
  core.prototype.isRejected = undefined;
  core.prototype.getValue = undefined;
  core.prototype.getReason = undefined;
  core.prototype.getState = undefined;
};

var domains = core;

let promisify = util$2.promisify;


function newPromise(func) {
	if (!func)
		return Promise.resolve();
	return new domains(func);
}

newPromise.all = Promise.all;
newPromise.denodeify = promisify || domains.denodeify;
var promise_1 = newPromise;

function executeChanges(queries) {
	if (queries.length === 0)
		return promise_1();
	var i = -1;
	return execute().then(emitChanged);


	function execute() {
		i++;
		if (i+1 === queries.length )
			return executeQuery_1(queries[i]);
		else {
			return executeQuery_1(queries[i]).then(execute);
		}
	}

	async function emitChanged() {
		for (let i = 0; i < queries.length; i++) {
			if (queries[i].emitChanged)
				await Promise.all(queries[i].emitChanged());
		}
	}


}

var executeChanges_1 = executeChanges;

function getChangeSet() {
	return getSessionSingleton('changes');
}

var getChangeSet_1 = getChangeSet;

function compress(queries) {
	var multipleStatements = getSessionSingleton('multipleStatements');
	var compressed = [];
	var queryCount = queries.length;

	for (var i = 0; i < queryCount; i++) {
		var current = queries[i];
		if (multipleStatements && current.parameters.length === 0 && !current.disallowCompress) {
			for (var i2 = i+1; i2 < queryCount; i2++) {
				var next = queries[i2];
				if (next.parameters.length > 0 || ! next.disallowCompress)
					break;
				current = newParameterized$1(current.sql() + ';' + next.sql());
				i++;
			}
		}
		compressed.push(current);
	}
	return compressed;
}

var compressChanges = compress;

function popChanges() {
	var changeSet = getChangeSet_1();
	var length = changeSet.length;
	if (length > 0) {
		var lastCmd = changeSet[length-1];
		if (lastCmd.endEdit)
			lastCmd.endEdit();
		var compressed = compressChanges(changeSet);
		changeSet.length = 0;
		return compressed;
	}
	return changeSet;

}

var popChanges_1 = popChanges;

function executeQueriesCore(queries) {
	var promises = [];
	for (var i = 0; i < queries.length; i++) {
		var q = executeQuery_1(queries[i]);
		promises.push(q);
	}
	return promises;
}

var executeQueriesCore_1 = executeQueriesCore;

function executeQueries(queries) {
	var changes = popChanges_1();

	return executeChanges_1(changes).then(onDoneChanges);

	function onDoneChanges() {
		return executeQueriesCore_1(queries);
	}
}

var executeQueries_1 = executeQueries;

function negotiateQueryContext(queryContext, row) {
	if (queryContext)
		queryContext.add(row);
}

var negotiateQueryContext_1 = negotiateQueryContext;

function newUpdateCommandCore(table, columns, row) {
	var command = newParameterized$1('UPDATE ' + table._dbName + ' SET');
	var separator = ' ';

	addColumns();
	addWhereId();
	addDiscriminators();

	function addColumns() {
		for (var alias in columns) {
			var column = columns[alias];
			var encoded = column.encode(row[alias]);
			command = command.append(separator + column._dbName + '=').append(encoded);
			separator = ',';
		}
	}

	function addWhereId() {
		separator = ' WHERE ';
		var columns = table._primaryColumns;
		for (var i = 0; i < columns.length; i++) {
			var column = columns[i];
			var value = row[column.alias];
			var encoded = column.encode(value);
			command = command.append(separator + column._dbName + '=').append(encoded);
			separator = ' AND ';
		}
	}

	function addDiscriminators() {
		var discriminators = table._columnDiscriminators;
		if (discriminators.length === 0)
			return;
		discriminators = separator + discriminators.join(' AND ');
		command = command.append(discriminators);
	}

	return command;


}

var newUpdateCommandCore_1 = newUpdateCommandCore;

function newImmutable(fn) {
	var result;
	var _run = runFirst;
	return run;

	function run() {
		var args = [].slice.call(arguments);
		return _run(args);
	}

	function runFirst(args) {
		result =  fn.apply(null, args);
		_run = runNIgnoreArgs;
		return result;
	}

	function runNIgnoreArgs() {
		return result;
	}
}

var newImmutable_1 = newImmutable;

function newObject() {
	return {};
}

var newObject_1 = newObject;

var pointer = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pointer = void 0;
/**
Unescape token part of a JSON Pointer string

`token` should *not* contain any '/' characters.

> Evaluation of each reference token begins by decoding any escaped
> character sequence.  This is performed by first transforming any
> occurrence of the sequence '~1' to '/', and then transforming any
> occurrence of the sequence '~0' to '~'.  By performing the
> substitutions in this order, an implementation avoids the error of
> turning '~01' first into '~1' and then into '/', which would be
> incorrect (the string '~01' correctly becomes '~1' after
> transformation).

Here's my take:

~1 is unescaped with higher priority than ~0 because it is a lower-order escape character.
I say "lower order" because '/' needs escaping due to the JSON Pointer serialization technique.
Whereas, '~' is escaped because escaping '/' uses the '~' character.
*/
function unescape(token) {
    return token.replace(/~1/g, '/').replace(/~0/g, '~');
}
/** Escape token part of a JSON Pointer string

> '~' needs to be encoded as '~0' and '/'
> needs to be encoded as '~1' when these characters appear in a
> reference token.

This is the exact inverse of `unescape()`, so the reverse replacements must take place in reverse order.
*/
function escape(token) {
    return token.replace(/~/g, '~0').replace(/\//g, '~1');
}
/**
JSON Pointer representation
*/
var Pointer = /** @class */ (function () {
    function Pointer(tokens) {
        if (tokens === void 0) { tokens = ['']; }
        this.tokens = tokens;
    }
    /**
    `path` *must* be a properly escaped string.
    */
    Pointer.fromJSON = function (path) {
        var tokens = path.split('/').map(unescape);
        if (tokens[0] !== '')
            throw new Error("Invalid JSON Pointer: " + path);
        return new Pointer(tokens);
    };
    Pointer.prototype.toString = function () {
        return this.tokens.map(escape).join('/');
    };
    /**
    Returns an object with 'parent', 'key', and 'value' properties.
    In the special case that this Pointer's path == "",
    this object will be {parent: null, key: '', value: object}.
    Otherwise, parent and key will have the property such that parent[key] == value.
    */
    Pointer.prototype.evaluate = function (object) {
        var parent = null;
        var key = '';
        var value = object;
        for (var i = 1, l = this.tokens.length; i < l; i++) {
            parent = value;
            key = this.tokens[i];
            // not sure if this the best way to handle non-existant paths...
            value = (parent || {})[key];
        }
        return { parent: parent, key: key, value: value };
    };
    Pointer.prototype.get = function (object) {
        return this.evaluate(object).value;
    };
    Pointer.prototype.set = function (object, value) {
        var cursor = object;
        for (var i = 1, l = this.tokens.length - 1, token = this.tokens[i]; i < l; i++) {
            // not sure if this the best way to handle non-existant paths...
            cursor = (cursor || {})[token];
        }
        if (cursor) {
            cursor[this.tokens[this.tokens.length - 1]] = value;
        }
    };
    Pointer.prototype.push = function (token) {
        // mutable
        this.tokens.push(token);
    };
    /**
    `token` should be a String. It'll be coerced to one anyway.
  
    immutable (shallowly)
    */
    Pointer.prototype.add = function (token) {
        var tokens = this.tokens.concat(String(token));
        return new Pointer(tokens);
    };
    return Pointer;
}());
exports.Pointer = Pointer;
});

var util = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = exports.objectType = exports.hasOwnProperty = void 0;
exports.hasOwnProperty = Object.prototype.hasOwnProperty;
function objectType(object) {
    if (object === undefined) {
        return 'undefined';
    }
    if (object === null) {
        return 'null';
    }
    if (Array.isArray(object)) {
        return 'array';
    }
    return typeof object;
}
exports.objectType = objectType;
/**
Recursively copy a value.

@param source - should be a JavaScript primitive, Array, or (plain old) Object.
@returns copy of source where every Array and Object have been recursively
         reconstructed from their constituent elements
*/
function clone(source) {
    // loose-equality checking for null is faster than strict checking for each of null/undefined/true/false
    // checking null first, then calling typeof, is faster than vice-versa
    if (source == null || typeof source != 'object') {
        // short-circuiting is faster than a single return
        return source;
    }
    // x.constructor == Array is the fastest way to check if x is an Array
    if (source.constructor == Array) {
        // construction via imperative for-loop is faster than source.map(arrayVsObject)
        var length_1 = source.length;
        // setting the Array length during construction is faster than just `[]` or `new Array()`
        var arrayTarget = new Array(length_1);
        for (var i = 0; i < length_1; i++) {
            arrayTarget[i] = clone(source[i]);
        }
        return arrayTarget;
    }
    // Object
    var objectTarget = {};
    // declaring the variable (with const) inside the loop is faster
    for (var key in source) {
        // hasOwnProperty costs a bit of performance, but it's semantically necessary
        // using a global helper is MUCH faster than calling source.hasOwnProperty(key)
        if (exports.hasOwnProperty.call(source, key)) {
            objectTarget[key] = clone(source[key]);
        }
    }
    return objectTarget;
}
exports.clone = clone;
});

var equal = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = void 0;

/**
Evaluate `left === right`, treating `left` and `right` as ordered lists.

@returns true iff `left` and `right` have identical lengths, and every element
         of `left` is equal to the corresponding element of `right`. Equality is
         determined recursivly, via `compare`.
*/
function compareArrays(left, right) {
    var length = left.length;
    if (length !== right.length) {
        return false;
    }
    for (var i = 0; i < length; i++) {
        if (!compare(left[i], right[i])) {
            return false;
        }
    }
    return true;
}
/**
Evaluate `left === right`, treating `left` and `right` as property maps.

@returns true iff every property in `left` has a value equal to the value of the
         corresponding property in `right`, and vice-versa, stopping as soon as
         possible. Equality is determined recursivly, via `compare`.
*/
function compareObjects(left, right) {
    var left_keys = Object.keys(left);
    var right_keys = Object.keys(right);
    var length = left_keys.length;
    // quick exit if the number of keys don't match up
    if (length !== right_keys.length) {
        return false;
    }
    // we don't know for sure that Set(left_keys) is equal to Set(right_keys),
    // much less that their values in left and right are equal, but if right
    // contains each key in left, we know it can't have any additional keys
    for (var i = 0; i < length; i++) {
        var key = left_keys[i];
        if (!util.hasOwnProperty.call(right, key) || !compare(left[key], right[key])) {
            return false;
        }
    }
    return true;
}
/**
`compare()` returns true if `left` and `right` are materially equal
(i.e., would produce equivalent JSON), false otherwise.

> Here, "equal" means that the value at the target location and the
> value conveyed by "value" are of the same JSON type, and that they
> are considered equal by the following rules for that type:
> o  strings: are considered equal if they contain the same number of
>    Unicode characters and their code points are byte-by-byte equal.
> o  numbers: are considered equal if their values are numerically
>    equal.
> o  arrays: are considered equal if they contain the same number of
>    values, and if each value can be considered equal to the value at
>    the corresponding position in the other array, using this list of
>    type-specific rules.
> o  objects: are considered equal if they contain the same number of
>    members, and if each member can be considered equal to a member in
>    the other object, by comparing their keys (as strings) and their
>    values (using this list of type-specific rules).
> o  literals (false, true, and null): are considered equal if they are
>    the same.
*/
function compare(left, right) {
    // strict equality handles literals, numbers, and strings (a sufficient but not necessary cause)
    if (left === right) {
        return true;
    }
    var left_type = util.objectType(left);
    var right_type = util.objectType(right);
    // check arrays
    if (left_type == 'array' && right_type == 'array') {
        return compareArrays(left, right);
    }
    // check objects
    if (left_type == 'object' && right_type == 'object') {
        return compareObjects(left, right);
    }
    // mismatched arrays & objects, etc., are always inequal
    return false;
}
exports.compare = compare;
});

var patch = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.InvalidOperationError = exports.test = exports.copy = exports.move = exports.replace = exports.remove = exports.add = exports.TestError = exports.MissingError = void 0;



var MissingError = /** @class */ (function (_super) {
    __extends(MissingError, _super);
    function MissingError(path) {
        var _this = _super.call(this, "Value required at path: " + path) || this;
        _this.path = path;
        _this.name = 'MissingError';
        return _this;
    }
    return MissingError;
}(Error));
exports.MissingError = MissingError;
var TestError = /** @class */ (function (_super) {
    __extends(TestError, _super);
    function TestError(actual, expected) {
        var _this = _super.call(this, "Test failed: " + actual + " != " + expected) || this;
        _this.actual = actual;
        _this.expected = expected;
        _this.name = 'TestError';
        return _this;
    }
    return TestError;
}(Error));
exports.TestError = TestError;
function _add(object, key, value) {
    if (Array.isArray(object)) {
        // `key` must be an index
        if (key == '-') {
            object.push(value);
        }
        else {
            var index = parseInt(key, 10);
            object.splice(index, 0, value);
        }
    }
    else {
        object[key] = value;
    }
}
function _remove(object, key) {
    if (Array.isArray(object)) {
        // '-' syntax doesn't make sense when removing
        var index = parseInt(key, 10);
        object.splice(index, 1);
    }
    else {
        // not sure what the proper behavior is when path = ''
        delete object[key];
    }
}
/**
>  o  If the target location specifies an array index, a new value is
>     inserted into the array at the specified index.
>  o  If the target location specifies an object member that does not
>     already exist, a new member is added to the object.
>  o  If the target location specifies an object member that does exist,
>     that member's value is replaced.
*/
function add(object, operation) {
    var endpoint = pointer.Pointer.fromJSON(operation.path).evaluate(object);
    // it's not exactly a "MissingError" in the same way that `remove` is -- more like a MissingParent, or something
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _add(endpoint.parent, endpoint.key, util.clone(operation.value));
    return null;
}
exports.add = add;
/**
> The "remove" operation removes the value at the target location.
> The target location MUST exist for the operation to be successful.
*/
function remove(object, operation) {
    // endpoint has parent, key, and value properties
    var endpoint = pointer.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.value === undefined) {
        return new MissingError(operation.path);
    }
    // not sure what the proper behavior is when path = ''
    _remove(endpoint.parent, endpoint.key);
    return null;
}
exports.remove = remove;
/**
> The "replace" operation replaces the value at the target location
> with a new value.  The operation object MUST contain a "value" member
> whose content specifies the replacement value.
> The target location MUST exist for the operation to be successful.

> This operation is functionally identical to a "remove" operation for
> a value, followed immediately by an "add" operation at the same
> location with the replacement value.

Even more simply, it's like the add operation with an existence check.
*/
function replace(object, operation) {
    var endpoint = pointer.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === null) {
        return new MissingError(operation.path);
    }
    // this existence check treats arrays as a special case
    if (Array.isArray(endpoint.parent)) {
        if (parseInt(endpoint.key, 10) >= endpoint.parent.length) {
            return new MissingError(operation.path);
        }
    }
    else if (endpoint.value === undefined) {
        return new MissingError(operation.path);
    }
    endpoint.parent[endpoint.key] = operation.value;
    return null;
}
exports.replace = replace;
/**
> The "move" operation removes the value at a specified location and
> adds it to the target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to move the value from.
> This operation is functionally identical to a "remove" operation on
> the "from" location, followed immediately by an "add" operation at
> the target location with the value that was just removed.

> The "from" location MUST NOT be a proper prefix of the "path"
> location; i.e., a location cannot be moved into one of its children.

TODO: throw if the check described in the previous paragraph fails.
*/
function move(object, operation) {
    var from_endpoint = pointer.Pointer.fromJSON(operation.from).evaluate(object);
    if (from_endpoint.value === undefined) {
        return new MissingError(operation.from);
    }
    var endpoint = pointer.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _remove(from_endpoint.parent, from_endpoint.key);
    _add(endpoint.parent, endpoint.key, from_endpoint.value);
    return null;
}
exports.move = move;
/**
> The "copy" operation copies the value at a specified location to the
> target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to copy the value from.
> The "from" location MUST exist for the operation to be successful.

> This operation is functionally identical to an "add" operation at the
> target location using the value specified in the "from" member.

Alternatively, it's like 'move' without the 'remove'.
*/
function copy(object, operation) {
    var from_endpoint = pointer.Pointer.fromJSON(operation.from).evaluate(object);
    if (from_endpoint.value === undefined) {
        return new MissingError(operation.from);
    }
    var endpoint = pointer.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _add(endpoint.parent, endpoint.key, util.clone(from_endpoint.value));
    return null;
}
exports.copy = copy;
/**
> The "test" operation tests that a value at the target location is
> equal to a specified value.
> The operation object MUST contain a "value" member that conveys the
> value to be compared to the target location's value.
> The target location MUST be equal to the "value" value for the
> operation to be considered successful.
*/
function test(object, operation) {
    var endpoint = pointer.Pointer.fromJSON(operation.path).evaluate(object);
    var result = equal.compare(endpoint.value, operation.value);
    if (!result) {
        return new TestError(endpoint.value, operation.value);
    }
    return null;
}
exports.test = test;
var InvalidOperationError = /** @class */ (function (_super) {
    __extends(InvalidOperationError, _super);
    function InvalidOperationError(operation) {
        var _this = _super.call(this, "Invalid operation: " + operation.op) || this;
        _this.operation = operation;
        _this.name = 'InvalidOperationError';
        return _this;
    }
    return InvalidOperationError;
}(Error));
exports.InvalidOperationError = InvalidOperationError;
/**
Switch on `operation.op`, applying the corresponding patch function for each
case to `object`.
*/
function apply(object, operation) {
    // not sure why TypeScript can't infer typesafety of:
    //   {add, remove, replace, move, copy, test}[operation.op](object, operation)
    // (seems like a bug)
    switch (operation.op) {
        case 'add': return add(object, operation);
        case 'remove': return remove(object, operation);
        case 'replace': return replace(object, operation);
        case 'move': return move(object, operation);
        case 'copy': return copy(object, operation);
        case 'test': return test(object, operation);
    }
    return new InvalidOperationError(operation);
}
exports.apply = apply;
});

var diff = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffAny = exports.diffObjects = exports.diffArrays = exports.intersection = exports.subtract = exports.isDestructive = void 0;


function isDestructive(_a) {
    var op = _a.op;
    return op === 'remove' || op === 'replace' || op === 'copy' || op === 'move';
}
exports.isDestructive = isDestructive;
/**
List the keys in `minuend` that are not in `subtrahend`.

A key is only considered if it is both 1) an own-property (o.hasOwnProperty(k))
of the object, and 2) has a value that is not undefined. This is to match JSON
semantics, where JSON object serialization drops keys with undefined values.

@param minuend Object of interest
@param subtrahend Object of comparison
@returns Array of keys that are in `minuend` but not in `subtrahend`.
*/
function subtract(minuend, subtrahend) {
    // initialize empty object; we only care about the keys, the values can be anything
    var obj = {};
    // build up obj with all the properties of minuend
    for (var add_key in minuend) {
        if (util.hasOwnProperty.call(minuend, add_key) && minuend[add_key] !== undefined) {
            obj[add_key] = 1;
        }
    }
    // now delete all the properties of subtrahend from obj
    // (deleting a missing key has no effect)
    for (var del_key in subtrahend) {
        if (util.hasOwnProperty.call(subtrahend, del_key) && subtrahend[del_key] !== undefined) {
            delete obj[del_key];
        }
    }
    // finally, extract whatever keys remain in obj
    return Object.keys(obj);
}
exports.subtract = subtract;
/**
List the keys that shared by all `objects`.

The semantics of what constitutes a "key" is described in {@link subtract}.

@param objects Array of objects to compare
@returns Array of keys that are in ("own-properties" of) every object in `objects`.
*/
function intersection(objects) {
    var length = objects.length;
    // prepare empty counter to keep track of how many objects each key occurred in
    var counter = {};
    // go through each object and increment the counter for each key in that object
    for (var i = 0; i < length; i++) {
        var object = objects[i];
        for (var key in object) {
            if (util.hasOwnProperty.call(object, key) && object[key] !== undefined) {
                counter[key] = (counter[key] || 0) + 1;
            }
        }
    }
    // now delete all keys from the counter that were not seen in every object
    for (var key in counter) {
        if (counter[key] < length) {
            delete counter[key];
        }
    }
    // finally, extract whatever keys remain in the counter
    return Object.keys(counter);
}
exports.intersection = intersection;
function isArrayAdd(array_operation) {
    return array_operation.op === 'add';
}
function isArrayRemove(array_operation) {
    return array_operation.op === 'remove';
}
function appendArrayOperation(base, operation) {
    return {
        // the new operation must be pushed on the end
        operations: base.operations.concat(operation),
        cost: base.cost + 1,
    };
}
/**
Calculate the shortest sequence of operations to get from `input` to `output`,
using a dynamic programming implementation of the Levenshtein distance algorithm.

To get from the input ABC to the output AZ we could just delete all the input
and say "insert A, insert Z" and be done with it. That's what we do if the
input is empty. But we can be smarter.

          output
               A   Z
               -   -
          [0]  1   2
input A |  1  [0]  1
      B |  2  [1]  1
      C |  3   2  [2]

1) start at 0,0 (+0)
2) keep A (+0)
3) remove B (+1)
4) replace C with Z (+1)

If the `input` (source) is empty, they'll all be in the top row, resulting in an
array of 'add' operations.
If the `output` (target) is empty, everything will be in the left column,
resulting in an array of 'remove' operations.

@returns A list of add/remove/replace operations.
*/
function diffArrays(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // set up cost matrix (very simple initialization: just a map)
    var memo = {
        '0,0': { operations: [], cost: 0 },
    };
    /**
    Calculate the cheapest sequence of operations required to get from
    input.slice(0, i) to output.slice(0, j).
    There may be other valid sequences with the same cost, but none cheaper.
  
    @param i The row in the layout above
    @param j The column in the layout above
    @returns An object containing a list of operations, along with the total cost
             of applying them (+1 for each add/remove/replace operation)
    */
    function dist(i, j) {
        // memoized
        var memo_key = i + "," + j;
        var memoized = memo[memo_key];
        if (memoized === undefined) {
            if (i > 0 && j > 0 && equal.compare(input[i - 1], output[j - 1])) {
                // equal (no operations => no cost)
                memoized = dist(i - 1, j - 1);
            }
            else {
                var alternatives = [];
                if (i > 0) {
                    // NOT topmost row
                    var remove_base = dist(i - 1, j);
                    var remove_operation = {
                        op: 'remove',
                        index: i - 1,
                    };
                    alternatives.push(appendArrayOperation(remove_base, remove_operation));
                }
                if (j > 0) {
                    // NOT leftmost column
                    var add_base = dist(i, j - 1);
                    var add_operation = {
                        op: 'add',
                        index: i - 1,
                        value: output[j - 1],
                    };
                    alternatives.push(appendArrayOperation(add_base, add_operation));
                }
                if (i > 0 && j > 0) {
                    // TABLE MIDDLE
                    // supposing we replaced it, compute the rest of the costs:
                    var replace_base = dist(i - 1, j - 1);
                    // okay, the general plan is to replace it, but we can be smarter,
                    // recursing into the structure and replacing only part of it if
                    // possible, but to do so we'll need the original value
                    var replace_operation = {
                        op: 'replace',
                        index: i - 1,
                        original: input[i - 1],
                        value: output[j - 1],
                    };
                    alternatives.push(appendArrayOperation(replace_base, replace_operation));
                }
                // the only other case, i === 0 && j === 0, has already been memoized
                // the meat of the algorithm:
                // sort by cost to find the lowest one (might be several ties for lowest)
                // [4, 6, 7, 1, 2].sort((a, b) => a - b) -> [ 1, 2, 4, 6, 7 ]
                var best = alternatives.sort(function (a, b) { return a.cost - b.cost; })[0];
                memoized = best;
            }
            memo[memo_key] = memoized;
        }
        return memoized;
    }
    // handle weird objects masquerading as Arrays that don't have proper length
    // properties by using 0 for everything but positive numbers
    var input_length = (isNaN(input.length) || input.length <= 0) ? 0 : input.length;
    var output_length = (isNaN(output.length) || output.length <= 0) ? 0 : output.length;
    var array_operations = dist(input_length, output_length).operations;
    var padded_operations = array_operations.reduce(function (_a, array_operation) {
        var operations = _a[0], padding = _a[1];
        if (isArrayAdd(array_operation)) {
            var padded_index = array_operation.index + 1 + padding;
            var index_token = padded_index < (input_length + padding) ? String(padded_index) : '-';
            var operation = {
                op: array_operation.op,
                path: ptr.add(index_token).toString(),
                value: array_operation.value,
            };
            // padding++ // maybe only if array_operation.index > -1 ?
            return [operations.concat(operation), padding + 1];
        }
        else if (isArrayRemove(array_operation)) {
            var operation = {
                op: array_operation.op,
                path: ptr.add(String(array_operation.index + padding)).toString(),
            };
            // padding--
            return [operations.concat(operation), padding - 1];
        }
        else { // replace
            var replace_ptr = ptr.add(String(array_operation.index + padding));
            var replace_operations = diff(array_operation.original, array_operation.value, replace_ptr);
            return [operations.concat.apply(operations, replace_operations), padding];
        }
    }, [[], 0])[0];
    return padded_operations;
}
exports.diffArrays = diffArrays;
function diffObjects(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // if a key is in input but not output -> remove it
    var operations = [];
    subtract(input, output).forEach(function (key) {
        operations.push({ op: 'remove', path: ptr.add(key).toString() });
    });
    // if a key is in output but not input -> add it
    subtract(output, input).forEach(function (key) {
        operations.push({ op: 'add', path: ptr.add(key).toString(), value: output[key] });
    });
    // if a key is in both, diff it recursively
    intersection([input, output]).forEach(function (key) {
        operations.push.apply(operations, diff(input[key], output[key], ptr.add(key)));
    });
    return operations;
}
exports.diffObjects = diffObjects;
/**
`diffAny()` returns an empty array if `input` and `output` are materially equal
(i.e., would produce equivalent JSON); otherwise it produces an array of patches
that would transform `input` into `output`.
*/
function diffAny(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // strict equality handles literals, numbers, and strings (a sufficient but not necessary cause)
    if (input === output) {
        return [];
    }
    var input_type = util.objectType(input);
    var output_type = util.objectType(output);
    if (input_type == 'array' && output_type == 'array') {
        return diffArrays(input, output, ptr, diff);
    }
    if (input_type == 'object' && output_type == 'object') {
        return diffObjects(input, output, ptr, diff);
    }
    // at this point we know that input and output are materially different;
    // could be array -> object, object -> array, boolean -> undefined,
    // number -> string, or some other combination, but nothing that can be split
    // up into multiple patches: so `output` must replace `input` wholesale.
    return [{ op: 'replace', path: ptr.toString(), value: output }];
}
exports.diffAny = diffAny;
});

var rfc6902 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTests = exports.createPatch = exports.applyPatch = void 0;



/**
Apply a 'application/json-patch+json'-type patch to an object.

`patch` *must* be an array of operations.

> Operation objects MUST have exactly one "op" member, whose value
> indicates the operation to perform.  Its value MUST be one of "add",
> "remove", "replace", "move", "copy", or "test"; other values are
> errors.

This method mutates the target object in-place.

@returns list of results, one for each operation: `null` indicated success,
         otherwise, the result will be an instance of one of the Error classes:
         MissingError, InvalidOperationError, or TestError.
*/
function applyPatch(object, patch$1) {
    return patch$1.map(function (operation) { return patch.apply(object, operation); });
}
exports.applyPatch = applyPatch;
function wrapVoidableDiff(diff$1) {
    function wrappedDiff(input, output, ptr) {
        var custom_patch = diff$1(input, output, ptr);
        // ensure an array is always returned
        return Array.isArray(custom_patch) ? custom_patch : diff.diffAny(input, output, ptr, wrappedDiff);
    }
    return wrappedDiff;
}
/**
Produce a 'application/json-patch+json'-type patch to get from one object to
another.

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

`diff` is called on each pair of comparable non-primitive nodes in the
`input`/`output` object trees, producing nested patches. Return `undefined`
to fall back to default behaviour.

Returns list of operations to perform on `input` to produce `output`.
*/
function createPatch(input, output, diff$1) {
    var ptr = new pointer.Pointer();
    // a new Pointer gets a default path of [''] if not specified
    return (diff$1 ? wrapVoidableDiff(diff$1) : diff.diffAny)(input, output, ptr);
}
exports.createPatch = createPatch;
/**
Create a test operation based on `input`'s current evaluation of the JSON
Pointer `path`; if such a pointer cannot be resolved, returns undefined.
*/
function createTest(input, path) {
    var endpoint = pointer.Pointer.fromJSON(path).evaluate(input);
    if (endpoint !== undefined) {
        return { op: 'test', path: path, value: endpoint.value };
    }
}
/**
Produce an 'application/json-patch+json'-type list of tests, to verify that
existing values in an object are identical to the those captured at some
checkpoint (whenever this function is called).

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

Returns list of test operations.
*/
function createTests(input, patch) {
    var tests = new Array();
    patch.filter(diff.isDestructive).forEach(function (operation) {
        var pathTest = createTest(input, operation.path);
        if (pathTest)
            tests.push(pathTest);
        if ('from' in operation) {
            var fromTest = createTest(input, operation.from);
            if (fromTest)
                tests.push(fromTest);
        }
    });
    return tests;
}
exports.createTests = createTests;
});

var createPatch$3 = function createPatch(original, dto) {
	let clonedOriginal = toCompareObject(original);
	let clonedDto = toCompareObject(dto);
	let changes = rfc6902.createPatch(clonedOriginal, clonedDto);
	changes = changes.map(addOldValue);
	return changes;

	function addOldValue(change) {
		if (change.op === 'remove' || change.op === 'replace') {
			let splitPath = change.path.split('/');
			splitPath.shift();
			change.oldValue = splitPath.reduce(extract, clonedOriginal);
		}
		else
			return change;

		function extract(obj, element) {
			return obj[element];
		}

		return change;
	}

	function toCompareObject(object) {
		if (Array.isArray(object)) {
			let copy = {__patchType : 'Array'};
			for (var i = 0; i < object.length; i++) {
				let element = toCompareObject(object[i]);
				if (element === Object(element) && 'id' in element)
					copy[element.id] = element;
				else
					copy[i] = element;
			}
			return copy;
		} else if (object === Object(object)) {
			let copy = {};
			for (let name in object) {
				copy[name] = toCompareObject(object[name]);
			}
			return copy;
		}
		return object;
	}
};

function rdbClient() {
	let isSaving;
	let isSlicing;
	let c = rdbClient;
	c.createPatch = createPatch$3;
	c.insert = insert;
	c.update = update;
	c.delete = _delete;
	c.proxify = proxify;
	c.save = save;
	let originalJSON = new WeakMap();
	let insertDeleteCount = new WeakMap();
	let previousArray = new WeakMap();
	let proxified = new WeakMap();

	function proxify(itemOrArray) {
		if (proxified.has(itemOrArray))
			return itemOrArray;
		if (Array.isArray(itemOrArray)) {
			for (let i = 0; i < itemOrArray.length; i++) {
				const row = itemOrArray[i];
				itemOrArray[i] = proxify(row);

			}
			let p = new Proxy(itemOrArray, arrayHandler);
			insertDeleteCount.set(p, new Map());
			proxified.set(p, p);
			return p;
		}
		else {
			let p = new Proxy(itemOrArray, handler);
			proxified.set(p, p);
			return p;
		}
	}

	let arrayHandler = {

		get(target, property, receiver) {
			if (property === 'length' & !isSlicing) {
				isSlicing = true;
				previousArray.set(receiver, target.slice(0));
				isSlicing = false;
			}
			const value = Reflect.get(target, property, receiver);
			// if (typeof value === 'object')
			// 	return proxify(value);
			return value;
		},
		set: function(target, property, value, receiver) {
			isSlicing = true;
			let previous = receiver[property];
			if (property === 'length' && previous > value) {
				let previousAr = previousArray.get(receiver);
				for (let i = Number.parseInt(value); i < previousAr.length; i++) {
					let row = previousAr[i];
					updateInsertDeleteCount(receiver, row, -1);
				}

			}
			else if (typeof previous === 'object')
				updateInsertDeleteCount(receiver, previous, -1);
			if (typeof value === 'object') {
				value = proxify(value);
				updateInsertDeleteCount(receiver, value, 1);
			}
			isSlicing = false;
			return Reflect.set(target, property, value);
		}
	};

	let handler = {
		set: function(obj, prop, value, receiver) {
			if (isSaving)
				obj[prop] = value;
			else if (! originalJSON.has(receiver)) {
				originalJSON.set(receiver, JSON.stringify(receiver));
				obj[prop] = value;
			}
			return true;
		}
	};
	function updateInsertDeleteCount(array, object, step) {
		let countMap = insertDeleteCount.get(array);
		let count = countMap.get(object) || 0;
		countMap.set(object, count + step);
	}

	async function insert(row, saveFn) {
		let patch = createPatch$3([], [row]);
		let changedRow = await saveFn(patch);
		console.log('changed inserted ' + JSON.stringify(changedRow));
		row =  proxify(row);
		isSaving = true;
		refresh(row, changedRow);
		isSaving = false;
		return row;
	}

	async function update(row, saveFn) {
		console.log('updating');
		let patch = [];
		if (originalJSON.has(row)) {
			patch = createPatch$3([JSON.parse(originalJSON.get(row))], [row]);
			console.log('got patch');
		}
		else
			console.log('no patch');
		let changedRow = await saveFn(patch);
		isSaving = true;
		refresh(row, changedRow);
		isSaving = false;
		return row;
	}

	async function _delete(row, saveFn) {
		let patch = createPatch$3([row], []);
		await saveFn(patch);
		return;
	}

	function refresh(row, updated) {
		for(let p in row) {
			if (!(p in updated))
				delete row[p];
		}
		Object.assign(row, updated);
	}
	async function save(rows, saveFn) {
		let counts = insertDeleteCount.get(rows);
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			if (counts.get(row) > 0)
				await insert(row, saveFn);
			else if (!counts.has(row) || counts.get(row) === 0)
				await update(row, saveFn);
		}
		for(let [row, count] of counts) {
			if (count < 0)
				await _delete(row, saveFn);
		}
		return rows;

	}

	return c;
}


var rdbClient_1 = rdbClient();

function _createDto(table, row) {
	var dto = {};
	var columns = table._columns;
	var length = columns.length;
	flags_1.useProxy = false;
	for (var i = 0; i < length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable)) {
			var alias = column.alias;
			if (column.toDto)
				dto[alias] = column.toDto(row[alias]);
			else
				dto[alias] = row[alias];
		}
	}
	flags_1.useProxy = true;
	return dto;
}

var createDto = _createDto;

let createPatch$2 = rdbClient_1.createPatch;


function newUpdateCommand(table, column, row) {
	return new UpdateCommand(table, column, row);
}

function UpdateCommand(table, column, row) {
	this._table = table;
	this._row = row;
	this.__getCoreCommand = newImmutable_1(newUpdateCommandCore_1);
	this._columnList = newObject_1();
	this._columnList[column.alias] = column;
	this.onFieldChanged = this.onFieldChanged.bind(this);
	row.subscribeChanged(this.onFieldChanged);
}

UpdateCommand.prototype.onFieldChanged = function(_row, column) {
	this._columnList[column.alias] = column;
};

UpdateCommand.prototype.sql = function() {
	return this._getCoreCommand().sql();
};

Object.defineProperty(UpdateCommand.prototype, 'parameters', {
	get: function() {
		return this._getCoreCommand().parameters;
	}
});

UpdateCommand.prototype._getCoreCommand = function() {
	return this.__getCoreCommand(this._table, this._columnList, this._row);
};

UpdateCommand.prototype.endEdit = function() {
	this._getCoreCommand();
	this._row.unsubscribeChanged(this.onFieldChanged);
	let dto = JSON.parse(JSON.stringify(createDto(this._table, this._row)));
	this._patch = createPatch$2([JSON.parse(this._row._oldValues)],[dto]);
	this._row._oldValues = JSON.stringify(dto);
};

UpdateCommand.prototype.emitChanged = function() {
	return this._table._emitChanged({row: this._row, patch: this._patch});
};

UpdateCommand.prototype.matches = function(otherRow) {
	return this._row === otherRow;
};

Object.defineProperty(UpdateCommand.prototype, 'disallowCompress', {
	get: function() {
		return this._table._emitChanged.callbacks.length > 0;

	}
});

var newUpdateCommand_1 = newUpdateCommand;

function negotiateEndEdit(changes) {
	var last = changes[changes.length - 1];
	if (last && last.endEdit)
		last.endEdit();
}

var negotiateEndEdit_1 = negotiateEndEdit;

function pushCommand(command) {
	var changes = getChangeSet_1();
	negotiateEndEdit_1(changes);
	changes.push(command);
}

var pushCommand_1 = pushCommand;

function lastCommandMatches(row) {
	var changeSet = getChangeSet_1();
	var lastIndex = changeSet.length-1;
	if (lastIndex >= 0 && changeSet[lastIndex].matches)
		return changeSet[lastIndex].matches(row);
	return false;
}

var lastCommandMatches_1 = lastCommandMatches;

function updateField(table, column, row, oldValue) {
	if (lastCommandMatches_1(row))
		return;
	var command = newUpdateCommand_1(table, column, row);
	pushCommand_1(command);
}

var updateField_1 = updateField;

function emitEvent() {
	var callbacks = [];
	var emit = function() {

		var copy = callbacks.slice(0, callbacks.length);
		var result = [];
		for (var i = 0; i < copy.length; i++) {
			var callback = copy[i];
			result.push(callback.apply(null,arguments));
		}
		return result;
	};

	emit.add = function(callback) {
		callbacks.push(callback);
	};

	emit.tryAdd = function(callback) {
		if (callback)
			emit.add(callback);
	};

	emit.remove = function(callback) {
		for (var i = 0; i < callbacks.length; i++) {
			if(callbacks[i] === callback){
				callbacks.splice(i,1);
				return;
			}
		}
	};

	emit.tryRemove = function(callback) {
		if(callback)
			emit.remove(callback);
	};

	emit.clear = function() {
		callbacks.splice(0, callbacks.length);
	};

	emit.callbacks = callbacks;

	return emit;
}

var emitEvent_1 = emitEvent;

var extractSubStrategy = _extractSubStrategy;

function _extractSubStrategy(table) {
	extractSubStrategy = extractStrategy_1;
	return extractSubStrategy(table);
}

function extractStrategy$1() {
	if (arguments.length === 2)
		return arguments[0];
	var table = arguments[0];
	var strategy = {};
	var relations = table._relations;
	var relationName;

	var visitor = {};
	visitor.visitJoin = function() {};

	visitor.visitMany = function(relation) {
		strategy[relationName] = extractSubStrategy(relation.childTable);
	};

	visitor.visitOne = visitor.visitMany;

	for (relationName in relations) {
		var relation = relations[relationName];
		relation.accept(visitor);
	}
	return strategy;
}

var extractStrategy_1 = extractStrategy$1;

var emptyStrategy$1 = newObject_1();

function extractDeleteStrategy(strategy) {
	if (strategy)
		return strategy;
	return emptyStrategy$1;
}

var extractDeleteStrategy_1 = extractDeleteStrategy;

var addSubStrategies = _addSubStrategies;


function newCascadeDeleteStrategy(strategy, table) {
	var relations = table._relations;
	var relationName;

	var c = {};
	c.visitJoin = function(){};
	c.visitOne = function(relation) {
		var subStrategy = newObject_1();
		strategy[relationName] = subStrategy;
		addSubStrategies(subStrategy, relation.childTable);
	};

	c.visitMany = c.visitOne;

	for(relationName in relations) {
		var relation = relations[relationName];
		relation.accept(c);
	}
	return strategy;
}

function _addSubStrategies(strategy, table) {
	addSubStrategies = newCascadeDeleteStrategy_1;
	addSubStrategies(strategy, table);
}

var newCascadeDeleteStrategy_1 = newCascadeDeleteStrategy;

var nextRemoveFromCache = _nextRemoveFromCache;

function removeFromCache(row, strategy, table) {
	if (Array.isArray(row)) {
		removeManyRows();
		return;
	}
	if (row)
		removeSingleRow();

	function removeManyRows() {
		row.forEach( function(rowToRemove) {
			nextRemoveFromCache(rowToRemove, strategy, table);
		});
	}

	function removeSingleRow() {
		var relations = table._relations;
		for (var relationName in strategy) {
			var relation = relations[relationName];
			var rows = relation.getRowsSync(row);
			nextRemoveFromCache(rows, strategy[relationName], relation.childTable);
		}
		table._cache.tryRemove(row);
	}
}

function _nextRemoveFromCache(row, strategy, table) {
	nextRemoveFromCache = removeFromCache_1;
	nextRemoveFromCache(row, strategy, table);
}

var removeFromCache_1 = removeFromCache;

function newSelectSql$1(table, alias) {
	var colName = table._primaryColumns[0]._dbName;
	var sql = 'SELECT ' + alias + '.' + colName + ' FROM ' + table._dbName + ' AS ' + alias;
	sql = newParameterized$1(sql);
	return newBoolean_1(sql);
}

var selectSql$1 = newSelectSql$1;

function createAlias(table, depth) {
	if (depth === 0)
		return table._dbName;
	return '_' + depth;
}
var createAlias_1 = createAlias;

function newJoinSql$1(relations) {
	var length = relations.length;
	var leftAlias,
		rightAlias;
	var sql = '';

	function addSql(relation) {
		var rightColumns = relation.childTable._primaryColumns;
		var leftColumns = relation.columns;
		sql += ' INNER' + newShallowJoinSql(relation.childTable,leftColumns,rightColumns,leftAlias,rightAlias);
	}

	relations.forEach(function(relation, i){
		leftAlias = '_' + (length-i);
		rightAlias = createAlias_1(relation.childTable, length-i-1);
		addSql(relation);

	});

	return sql;
}

var joinSql$1 = newJoinSql$1;

function newWhereSql$1(relations, shallowFilter, rightAlias) {
	var sql;
	var relationCount = relations.length;
	var relation = relations[0];
	var leftAlias = '_' + relationCount;
	var table = relation.childTable;
	var leftColumns = relation.columns;
	var rightColumns = table._primaryColumns;
	where();

	function where() {
		var table = relation.childTable;
		var joinCore = newShallowJoinSqlCore(table, leftColumns, rightColumns, leftAlias, rightAlias);
		if (shallowFilter)
			sql = shallowFilter.prepend(' WHERE ' + joinCore + ' AND ');
		else
			sql = ' WHERE ' + joinCore;
	}
	return sql;
}

var whereSql$1 = newWhereSql$1;

function newSubFilter$1(relations, shallowFilter) {
	var relationCount = relations.length;
	if (relationCount === 0)
		return shallowFilter;
	var table = relations[0].childTable;
	var alias = createAlias_1(table, relationCount -1);
	var filter = selectSql$1(table,alias).prepend('EXISTS (');
	var join = joinSql$1(relations.slice(1));
	var where = whereSql$1(relations,shallowFilter,alias);
	return filter.append(join).append(where).append(')');

}

var subFilter$1 = newSubFilter$1;

function newSingleCommandCore(table,filter,alias) {
	var c = {};

	c.sql = function() {
		var whereSql = filter.sql();
		if (whereSql)
			whereSql = ' where ' + whereSql;
		var deleteFromSql = getSessionSingleton('deleteFromSql');
		return deleteFromSql(table, alias, whereSql);
	};

	c.parameters = filter.parameters;

	return c;
}

var newSingleCommandCore_1 = newSingleCommandCore;

function _new$6(table,filter,relations) {
	var alias = createAlias_1(table, relations.length);
	filter = extractFilter(filter);
	filter = subFilter$1(relations, filter);
	var discriminator = newDiscriminatorSql_1$1(table, alias);
	if (discriminator !== '')
		filter = filter.and(discriminator);
	return newSingleCommandCore_1(table, filter, alias);
}

var newSingleCommand = _new$6;

var nextCommand = function() {
	nextCommand = newDeleteCommand;
	nextCommand.apply(null, arguments);
};

function newCommand(queries,table,filter,strategy,relations) {
	var singleCommand = newSingleCommand(table,filter,relations);
	for(var name in strategy) {
		var childStrategy = strategy[name];
		var childRelation = table._relations[name];
		var joinRelation = childRelation.joinRelation;
		var	childRelations = [joinRelation].concat(relations);
		nextCommand(queries,childRelation.childTable,filter,childStrategy,childRelations);
	}
	queries.push(singleCommand);
	return queries;
}

var newDeleteCommand = newCommand;

var createPatch$1 = rdbClient_1.createPatch;


function _delete$1(row, strategy, table) {
	var relations = [];
	removeFromCache_1(row, strategy, table);

	var args = [table];
	table._primaryColumns.forEach(function(primary) {
		args.push(row[primary.alias]);
	});
	var filter = newPrimaryKeyFilter.apply(null, args);
	var cmds = newDeleteCommand([], table, filter, strategy, relations);
	cmds.forEach(function(cmd) {
		pushCommand_1(cmd);
	});
	var cmd = cmds[0];
	if (table._emitChanged.callbacks.length > 0) {
		cmd.disallowCompress = true;
		var dto = createDto(table, row);
		let patch =  createPatch$1([dto],[]);
		cmd.emitChanged = table._emitChanged.bind(null, {row: row, patch: patch});
	}

}

var _delete_1$1 = _delete$1;

function resultToPromise(result) {
	return Promise.resolve(result);
}

var resultToPromise_1 = resultToPromise;

function toDto(strategy, table, row) {
	var dto = createDto(table, row);
	strategy = strategy || {};
	var promise = resultToPromise_1(dto);

	for (var property in strategy) {
		mapChild(property);
	}

	function mapChild(name) {
		promise = promise.then(getRelated).then(onChild);

		function getRelated() {
			return row[name];
		}

		function onChild(child) {
			if (child)
				return child.__toDto(strategy[name]).then(onChildDto);
		}

		function onChildDto(childDto) {
			dto[name] = childDto;
		}
	}

	return promise.then(function() {
		return dto;
	});
}

var toDto_1 = toDto;

function fromCompareObject(object) {
	if (object === null || object === undefined) return object;
	if (object.__patchType === 'Array') {
		let copy = [];
		let i = 0;
		for (let id in object) {
			if (id !== '__patchType') {
				copy[i] = fromCompareObject(object[id]);
				i++;
			}
		}
		return copy;
	} else if (object === Object(object)) {
		let copy = {};
		for (let name in object) {
			if (name !== '__patchType')
				copy[name] = fromCompareObject(object[name]);
		}
		return copy;
	}
	return object;
}

var fromCompareObject_1 = fromCompareObject;

let { inspect } = util$2;



function applyPatch({ defaultConcurrency, concurrency }, dto, changes) {
	let dtoCompare = toCompareObject(dto);
	changes = validateConflict(dtoCompare, changes);
	rfc6902.applyPatch(dtoCompare, changes);

	let result = fromCompareObject_1(dtoCompare);

	if (Array.isArray(dto))
		dto.length = 0;
	else
		for (let name in dto) {
			delete dto[name];
		}

	for (let name in result) {
		dto[name] = result[name];
	}

	return dto;

	function validateConflict(object, changes) {
		return changes.filter(change => {
			let expectedOldValue = change.oldValue;
			let strategy = getStrategy(change.path);
			if ((strategy === 'optimistic') || (strategy === 'skipOnConflict')) {
				let oldValue = getOldValue(object, change.path);
				try {
					assert.deepEqual(oldValue, expectedOldValue);
				}
				catch (e) {
					if (strategy === 'skipOnConflict')
						return false;
					throw new Error(`The field ${change.path} was changed by another user. Expected ${inspect(fromCompareObject_1(expectedOldValue), false, 10)}, but was ${inspect(fromCompareObject_1(oldValue), false, 10)}.`);
				}
			}
			return true;
		});

		function getOldValue(obj, path) {
			let splitPath = path.split('/');
			splitPath.shift();
			return splitPath.reduce(extract, obj);

			function extract(obj, name) {
				if (obj === Object(obj))
					return obj[name];
				return;
			}
		}

	}

	function getStrategy(path) {
		let splitPath = path.split('/');
		splitPath.shift();
		return splitPath.reduce(extract, concurrency);

		function extract(obj, name) {
			if (Array.isArray(obj))
				return obj[0] || defaultConcurrency;
			if (obj === Object(obj))
				return obj[name] || defaultConcurrency;
			return obj;
		}
	}
}

function toCompareObject(object) {
	if (Array.isArray(object)) {
		let copy = {};
		Object.defineProperty(copy, '__patchType', {
			value: 'Array',
			writable: true,
			enumerable: true
		});

		for (var i = 0; i < object.length; i++) {
			let element = toCompareObject(object[i]);
			if (element === Object(element) && 'id' in element)
				copy[element.id] = element;
			else
				copy[i] = element;
		}
		return copy;
	} else if (object === Object(object)) {
		let copy = {};
		for (let name in object) {
			copy[name] = toCompareObject(object[name]);
		}
		return copy;
	}
	return object;
}

var applyPatch_1 = applyPatch;

/* eslint-disable require-atomic-updates */

async function patchTable(table, patches, { defaultConcurrency = 'optimistic', concurrency = {} } = {}) {
	for (let i = 0; i < patches.length; i++) {
		let patch = {path: undefined, value: undefined, op: undefined};
		Object.assign(patch, patches[i]);
		patch.path = patches[i].path.split('/').slice(1);
		if (patch.op === 'add' || patch.op === 'replace')
			await add({ path: patch.path, value: patch.value, op: patch.op, oldValue: patch.oldValue, concurrency: concurrency }, table);
		else if (patch.op === 'remove')
			await remove(patch, table);
	}

	async function add({ path, value, op, oldValue, concurrency = {} }, table, row, parentRow, relation) {
		let property = path[0];
		path = path.slice(1);
		if (!row && path.length > 0)
			row = row || await table.tryGetById(property);
		if (path.length === 0) {
			let pkName = table._primaryColumns[0].alias;
			row = table.insert(value[pkName]);
			for (let name in value) {
				row[name] = fromCompareObject_1(value[name]);
			}
			if (relation && relation.joinRelation) {
				let fkName = relation.joinRelation.columns[0].alias;
				let parentPk = relation.joinRelation.childTable._primaryColumns[0].alias;
				if (!row[fkName])
					row[fkName] = parentRow[parentPk];
			}
			return;
		}
		property = path[0];
		if (isColumn(property, table)) {
			let dto = {};
			dto[property] = row[property];
			let result = applyPatch_1({ defaultConcurrency, concurrency }, dto, [{ path: '/' + path.join('/'), op, value, oldValue }]);
			row[property] = result[property];
		}
		else if (isOneRelation(property, table)) {
			let relation = table[property]._relation;
			await add({ path, value, op, oldValue, concurrency: concurrency[property] }, relation.childTable, await row[property], row, relation);
		}
		else if (isManyRelation(property, table)) {
			let relation = table[property]._relation;
			if (path.length === 1) {
				for (let id in value) {
					await add({ path: [id], value: value[id], op, oldValue, concurrency: concurrency[property] }, relation.childTable, {}, row, relation);
				}
			}
			else
				await add({ path: path.slice(1), value, oldValue, op, concurrency: concurrency[property] }, relation.childTable, undefined, row, relation);
		}
	}

	async function remove({ path, value, op }, table, row) {
		let property = path[0];
		path = path.slice(1);
		row = row || await table.getById(property);
		if (path.length === 0)
			return row.cascadeDelete();
		property = path[0];
		if (isColumn(property, table)) {
			let dto = {};
			dto[property] = row[property];
			let result = applyPatch_1({defaultConcurrency: 'overwrite', concurrency: undefined}, dto, [{ path: '/' + path.join('/'), op }]);
			row[property] = result[property];
		}
		else if (isOneRelation(property, table)) {
			let child = await row[property];
			if (!child)
				throw new Error(property + ' does not exist');
			await remove({ path, value, op }, table[property], child);
		}
		else if (isManyRelation(property, table)) {
			let relation = table[property]._relation;
			if (path.length === 1) {
				let children = (await row[property]).slice(0);
				for (let i = 0; i < children.length; i++) {
					let child = children[i];
					await remove({ path: path.slice(1), value, op }, table[property], child);
				}
			}
			else
				await remove({ path: path.slice(1), value, op }, relation.childTable);
		}
	}

	function isColumn(name, table) {
		return table[name] && table[name].equal;
	}

	function isManyRelation(name, table) {
		return table[name] && table[name]._relation.isMany;
	}

	function isOneRelation(name, table) {
		return table[name] && table[name]._relation.isOne;
	}
}

var patchTable_1 = patchTable;

function patchRow(table, row, patches, options) {
	patches = JSON.parse(JSON.stringify(patches));
	let pkName = table._primaryColumns[0].alias;
	let id = row[pkName];
	for (let i = 0; i < patches.length; i++) {
		patches[i].path = '/' + id + patches[i].path;
	}
	return patchTable_1(table, patches, options);
}

var patchRow_1 = patchRow;

function newDecodeDbRow(table, dbRow) {
	let columns = table._columns;
	let numberOfColumns = columns.length;
	if (dbRow.offset === undefined) {
		dbRow.offset = 0;
	}

	let offset = dbRow.offset;

	let keys = Object.keys(dbRow);

	for (let i = 0; i < numberOfColumns; i++) {
		defineColumnProperty(i);
	}

	dbRow.offset += numberOfColumns;

	function defineColumnProperty(i) {
		let column = columns[i];
		let purify = column.purify;
		let name = column.alias;
		let intName = '__' + name;
		i = offset + i;
		let key = keys[i];

		Object.defineProperty(Row.prototype, intName, {
			enumerable: false,
			get: function() {
				return this._dbRow[key];
			},

			set: function(value) {
				let oldValue = this[name];
				value = purify(value);
				this._dbRow[key] = value;
				if (column.validate)
					column.validate(value, this._dbRow);
				updateField_1(table, column, this);
				let emit = this._emitColumnChanged[name];
				if (emit)
					emit(this, column, value, oldValue);
				this._emitChanged(this, column, value, oldValue);
			}
		});

		Object.defineProperty(Row.prototype, name, {
			get: function() {
				if (column.onChange && flags_1.useProxy && this[intName] !== null && typeof this[intName] === 'object') {
					if (!(name in this._proxies)) {
						let value = this[intName];
						this._proxies[name] = column.onChange(this._dbRow[key], () => {
							if(this[intName] !== onChange_1.target(value)) {
								return;
							}
							this[intName] = this._dbRow[key];
						});
					}
					return this._proxies[name];
				}
				return this[intName];
			},
			set: function(value) {
				if (column.onChange && value !== null && typeof value === 'object') {
					if(this[intName] === onChange_1.target(value))
						return;
					this._proxies[name] = column.onChange(value, () => {
						if(this[intName] !== onChange_1.target(value))
							return;
						this[intName] = this._dbRow[key];
					});
				}
				this[intName] = value;
			}
		});
	}

	setRelated();

	function setRelated() {
		let relations = table._relations;
		for (let relationName in relations) {
			setSingleRelated(relationName);
		}
	}

	function setSingleRelated(name) {
		Object.defineProperty(Row.prototype, name, {
			get: function() {
				return createGetRelated(this, name)();
			}
		});
	}

	function createGetRelated(row, alias) {
		let get = row._related[alias];
		if (!get) {
			let relation = table._relations[alias];
			get = relation.toGetRelated(row);
			row._related[alias] = get;
		}
		return get;
	}

	Row.prototype.subscribeChanged = function(onChanged, name) {
		let emit;
		if (name) {
			emit = this._emitColumnChanged[name] || (this._emitColumnChanged[name] = emitEvent_1());
			emit.add(onChanged);
			return;
		}
		this._emitChanged.add(onChanged);
	};

	Row.prototype.unsubscribeChanged = function(onChanged, name) {
		if (name) {
			this._emitColumnChanged[name].tryRemove(onChanged);
			return;
		}
		this._emitChanged.tryRemove(onChanged);
	};

	Row.prototype.toJSON = function() {
		return this.toDto.apply(this, arguments).then(JSON.stringify);
	};

	Row.prototype.toDto = function(strategy) {
		let args = Array.prototype.slice.call(arguments, 0);
		args.push(table);
		strategy = extractStrategy_1.apply(null, args);
		let p =  toDto_1(strategy, table, this);
		return Promise.resolve().then(() => p);
	};

	Row.prototype.__toDto = function(strategy) {
		let args = Array.prototype.slice.call(arguments, 0);
		args.push(table);
		strategy = extractStrategy_1.apply(null, args);
		return toDto_1(strategy, table, this);
	};

	Row.prototype.expand = function(alias) {
		let get = createGetRelated(this, alias);
		get.expanded = true;
	};

	Row.prototype.isExpanded = function(alias) {
		let get = createGetRelated(this, alias);
		return get.expanded;
	};

	Row.prototype.delete = function(strategy) {
		strategy = extractDeleteStrategy_1(strategy);
		_delete_1$1(this, strategy, table);
	};

	Row.prototype.cascadeDelete = function() {
		let strategy = newCascadeDeleteStrategy_1(newObject_1(), table);
		_delete_1$1(this, strategy, table);
	};

	Row.prototype.patch = async function(patches, options) {
		await patchRow_1(table, this, patches, options);
		return this;
	};

	function decodeDbRow(row) {
		for (let i = 0; i < numberOfColumns; i++) {
			let index = offset + i;
			let key = keys[index];
			row[key] = columns[i].decode(row[key]);
		}
		return new Row(row);
	}

	function Row(dbRow) {
		this._dbRow = dbRow;
		this._related = {};
		this._emitColumnChanged = {};
		this._emitChanged = emitEvent_1();
		this._proxies = {};
		this._oldValues =  JSON.stringify(createDto(table, this));
	}

	return decodeDbRow;
}

var newDecodeDbRow_1 = newDecodeDbRow;

function decodeDbRow(context, table, dbRow) {
	var decode = context._decodeDbRow;
	if (!decode) {
		decode = newDecodeDbRow_1(table, dbRow);
		Object.defineProperty(context, '_decodeDbRow', {
			enumerable: false,
			get: function() {
				return decode;
			},
		});
	}
	return decode(dbRow);
}

var decodeDbRow_1 = decodeDbRow;

var nextDbRowToRow = _nextDbRowToRow;


function dbRowToRow(span, dbRow) {
	var table = span.table;
	var row = decodeDbRow_1(span, table, dbRow);
	var cache = table._cache;
	if (!cache.tryGet(row)) {
		var queryContext = span.queryContext;
		negotiateQueryContext_1(queryContext, row);
		row.queryContext = queryContext;
	}
	row = cache.tryAdd(row);

	var c = {};

	c.visitOne = function(leg) {
		nextDbRowToRow(leg.span, dbRow);
		leg.expand(row);
	};

	c.visitJoin = function(leg) {
		nextDbRowToRow(leg.span, dbRow);
		leg.expand(row);
	};

	c.visitMany = function() {
	};

	span.legs.forEach(onEach);

	function onEach(leg) {
		leg.accept(c);
	}

	return row;
}

function _nextDbRowToRow(span, dbRow) {
	nextDbRowToRow = dbRowToRow_1;
	nextDbRowToRow(span, dbRow);
}

var dbRowToRow_1 = dbRowToRow;

function orderBy(strategy, rows) {
	if (strategy && strategy.orderBy) {
		var comparer = createComparer(strategy.orderBy);
		return rows.sort(comparer);
	}
	return rows;
}

function createComparer(orderBy) {
	var comparers = [];
	if (typeof orderBy === 'string')
		orderBy = [orderBy];
	orderBy.forEach(function(order) {
		var elements = order.split(' ');
		var name = elements[0];
		var direction = elements[1] || 'asc';

		if (direction === 'asc')
			comparers.push(compareAscending);
		else
			comparers.push(compareDescending);

		function compareAscending(a, b) {
			a = a[name];
			b = b[name];
			if (a === b)
				return 0;
			if (a < b)
				return -1;
			return 1;
		}

		function compareDescending(a, b) {
			return compareAscending(b, a);
		}

	});

	function compareComposite(a, b) {
		for (var i = 0; i < comparers.length; i++) {
			var result = comparers[i](a, b);
			if (result !== 0)
				return result;
		}
		return 0;
	}

	return compareComposite;
}

var orderBy_1 = orderBy;

function negotiateNextTick(i) {
	if (i === 0)
		return;
	if (i % 1000 === 0)
		return domains.resolve();
	return;
}

var negotiateNextTick_1 = negotiateNextTick;

function newRowArray() {
	var c = [];

	Object.defineProperty(c, 'toJSON', {
		enumerable: false,
		value: toJSON
	});

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

	function toJSON() {
		return c.toDto.apply(null, arguments).then(JSON.stringify);
	}

	function toDtoNativePromise() {
		let args = arguments;
		return Promise.resolve().then( () => toDto.apply(null, args));
	}

	function toDto(optionalStrategy) {
		var args = arguments;
		var result = [];
		var length = c.length;
		var i = -1;

		return resultToPromise_1().then(toDtoAtIndex);

		function toDtoAtIndex() {
			i++;
			if (i === length) {
				return orderBy_1(optionalStrategy, result);
			}
			var row = c[i];
			return getDto()
				.then(onDto)
				.then(toDtoAtIndex);

			function getDto() {
				return row.__toDto.apply(row,args);
			}

			function onDto(dto) {
				result.push(dto);
				return negotiateNextTick_1(i);
			}
		}
	}

	return c;
}

var rowArray = newRowArray;

function dbRowsToRows(span, dbRows) {
	var rows = rowArray(span.table);
	for (var i = 0; i < dbRows.length; i++) {
		var row = dbRowToRow_1(span, dbRows[i]);
		rows.push(row);
	}
	return rows;
}

var dbRowsToRows_1 = dbRowsToRows;

function resultToRows(span,result) {
	return result[0].then(onResult);

	function onResult(result) {
		return dbRowsToRows_1(span,result);
	}

}

var resultToRows_1 = resultToRows;

function toSpan(table,strategy) {
	var span = {};
	span.queryContext = newQueryContext_1();
	span.legs = newCollection_1();
	span.table = table;
	applyStrategy(table,span,strategy);
	return span;

	function applyStrategy(table,span,strategy) {
		var legs = span.legs;
		if(!strategy)
			return;
		for (var name in strategy) {
			if (table._relations[name])
				addLeg(legs,table,strategy,name);
			else
				span[name] = strategy[name];
		}
	}

	function addLeg(legs,table,strategy,name) {
		var relation = table._relations[name];
		var leg = relation.toLeg();
		legs.add(leg);
		var subStrategy = strategy[name];
		var childTable = relation.childTable;
		applyStrategy(childTable,leg.span,subStrategy);
	}
}

var strategyToSpan = toSpan;

var emptyInnerJoin = newParameterized$1();


function getMany(table,filter,strategy) {
	return getManyCore(table,filter,strategy);
}

function getManyCore(table,filter,strategy,exclusive) {
	var alias = table._dbName;
	var noOrderBy;
	filter = negotiateRawSqlFilter_1(filter);
	var span = strategyToSpan(table,strategy);
	var queries = newQuery_1$5([],table,filter,span,alias,emptyInnerJoin,noOrderBy,exclusive);
	return executeQueries_1(queries).then(onResult);

	function onResult(result) {
		return resultToRows_1(span,result);
	}
}

getMany.exclusive = function(table,filter,strategy) {
	return getManyCore(table,filter,strategy,true);
};

var getMany_1 = getMany;

function tryGet$1(table, filter, strategy) {
	strategy = setLimit(strategy);
	return getMany_1(table, filter, strategy).then(filterRows);
}

function filterRows(rows) {
	if (rows.length > 0)
		return rows[0];
	return null;
}

tryGet$1.exclusive = function(table, filter, strategy) {
	strategy = setLimit(strategy);
	return getMany_1.exclusive(table, filter, strategy).then(filterRows);
};

function setLimit(strategy) {
	return util$2._extend({ limit: 1 }, strategy);
}

var tryGetFirstFromDb = tryGet$1;

function extract(table) {
	var lengthWithStrategy = table._primaryColumns.length  + 2;
	if (arguments.length === lengthWithStrategy)
		return arguments[lengthWithStrategy-1];
	return emptyStrategy;
}

function emptyStrategy() {

}

var extractStrategy = extract;

function tryGet() {
	var filter = newPrimaryKeyFilter.apply(null, arguments);
	var table = arguments[0];
	var strategy = extractStrategy.apply(null, arguments);
	return tryGetFirstFromDb(table, filter, strategy);
}

tryGet.exclusive = function tryGet() {
	var filter = newPrimaryKeyFilter.apply(null, arguments);
	var table = arguments[0];
	var strategy = extractStrategy.apply(null, arguments);
	return tryGetFirstFromDb.exclusive(table, filter, strategy);
};

var tryGetFromDbById = tryGet;

function get$1(table, ...ids) {
	return tryGetFromDbById.apply(null, arguments).then((row) => onResult(table, row, ids));
}

get$1.exclusive = function(table, ...ids) {
	return tryGetFromDbById.exclusive.apply(null, arguments).then((row) => onResult(table, row, ids));
};

function onResult(table, row, id) {
	if (row === null)
		throw new Error(`${table._dbName  }: Row with id ${id} not found.`);
	return row;
}

var getFromDbById = get$1;

function getById() {
	var cached =  tryGetFromCacheById.apply(null,arguments);
	if (cached)
		return resultToPromise_1(cached);
	return getFromDbById.apply(null,arguments);
}

getById.exclusive = getFromDbById.exclusive;

var getById_1 = getById;

var nullPromise = promise_1(null);

function newGetRelated(parent, relation) {
	function getRelated() {
		if (getRelated.expanded)
			return relation.getFromCache(parent);
		if (parent.queryContext)
			return relation.getRelatives(parent).then(onRelatives);
		return relation.getFromDb(parent).then(onFromDb);

		function onFromDb(rows) {
			getRelated.expanded = true;
			return rows;
		}

		function onRelatives() {
			return relation.getFromCache(parent);
		}
	}
	return getRelated;
}

var newGetRelated_1 = newGetRelated;

function negotiateExpandInverse(parent, relation, children) {
	var joinRelation = relation.joinRelation;
	if (!joinRelation)
		return;
	var firstChild = children.find(function(child) {
		return child.queryContext;
	});

	if (firstChild)
		firstChild.queryContext.expand(joinRelation);
}

var negotiateExpandInverse_1 = negotiateExpandInverse;

function getRelatives$1(parent, relation) {
	var queryContext = parent.queryContext;
	var filter = emptyFilter_1;
	if (relation.columns.length === 1)
		createInFilter();
	else
		createCompositeFilter();

	function createInFilter() {
		var ids = [];
		var row;
		var id;
		var alias = relation.columns[0].alias;
		for (var i = 0; i < queryContext.rows.length; i++) {
			row = queryContext.rows[i];
			id = row[alias];
			if (!isNullOrUndefined(id))
				ids.push(id);
		}

		if (ids.length > 0)
			filter = relation.childTable._primaryColumns[0].in(ids);
	}

	function createCompositeFilter() {
		var keyFilter;
		for (var i = 0; i < queryContext.rows.length; i++) {
			keyFilter = rowToPrimaryKeyFilter(queryContext.rows[i], relation);
			if (keyFilter)
				filter = filter.or(keyFilter);
		}
	}

	return relation.childTable.getMany(filter).then(onRows);

	function onRows(rows) {
		queryContext.expand(relation);
		negotiateExpandInverse_1(parent, relation, rows);
		return rows;
	}
}

function rowToPrimaryKeyFilter(row, relation) {
	var key = relation.columns.map( function(column) {
		return row[column.alias];
	});
	if (key.some(isNullOrUndefined)) {
		return;
	}
	var args = [relation.childTable].concat(key);
	return newPrimaryKeyFilter.apply(null, args);
}

function isNullOrUndefined(item) {
	return item === null || item === undefined;
}

var getRelatives_1$1 = getRelatives$1;

function _newJoin(parentTable, childTable, columnNames) {
	var c = {};
	c.parentTable = parentTable;
	c.childTable = childTable;
	c.columns = [];
	var columns = parentTable._columns;
	addColumns();

	c.accept = function(visitor) {
		visitor.visitJoin(c);
	};

	c.toLeg = function() {
		return newJoinLeg(c);
	};

	c.getFromDb = function(parent) {
		var key = parentToKey(parent);
		if (key.some(isNullOrUndefined)) {
			return nullPromise;
		}
		var args = [childTable].concat(key);
		return getById_1.apply(null, args);
	};

	c.getFromCache = c.getFromDb;

	c.toGetRelated = function(parent) {
		return newGetRelated_1(parent, c);
	};

	c.getRelatives = function(parent) {
		return getRelatives_1$1(parent, c);
	};

	c.expand = function(parent) {
		parent.expand(c.leftAlias);
	};

	c.getRowsSync = function(parent) {
		var key = parentToKey(parent);

		if (key.some(isNullOrUndefined)) {
			return null;
		}
		var args = [childTable].concat(key);
		return tryGetFromCacheById.apply(null, args);
	};

	return c;

	function addColumns() {
		var numberOfColumns = columnNames.length;
		for (var i = 0; i < columns.length; i++) {
			var curColumn = columns[i];
			tryAdd(curColumn);
			if (numberOfColumns === c.columns.length)
				return;
		}
	}

	function tryAdd(column) {
		for (var i = 0; i < columnNames.length; i++) {
			var name = columnNames[i];
			if (column._dbName === name) {
				c.columns.push(column);
				return;
			}
		}
	}

	function isNullOrUndefined(item) {
		return item === null || item === undefined;
	}

	function parentToKey(parent) {
		var primaryKeys = c.columns.map(function(column) {
			return parent[column.alias];
		});
		return primaryKeys;
	}
}

var newJoinRelation = _newJoin;

function newSelectSql(table, alias) {
	var colName = table._primaryColumns[0]._dbName;
	var sql = 'SELECT ' + alias + '.' + colName + ' FROM ' + table._dbName + ' AS ' + alias;
	sql = newParameterized$1(sql);
	return newBoolean_1(sql);
}

var selectSql = newSelectSql;

function newJoinSql(relations) {
	if (relations.length === 1)
		return  '';
	var leftAlias,
		rightAlias;
	var relation;
	var c = {};
	var i;
	var sql = '';

	c.visitJoin = function(relation) {
		sql += ' INNER' + newShallowJoinSql(relation.parentTable,relation.childTable._primaryColumns,relation.columns,leftAlias,rightAlias);
	};

	c.visitOne = function(relation) {
		innerJoin(relation);
	};

	c.visitMany = c.visitOne;

	function innerJoin(relation) {
		var joinRelation = relation.joinRelation;
		var table = joinRelation.childTable;
		var rightColumns = table._primaryColumns;
		var leftColumns = joinRelation.columns;

		sql += ' INNER' + newShallowJoinSql(table,leftColumns,rightColumns,leftAlias,rightAlias);
	}

	for (i = relations.length-1; i > 0; i--) {
		leftAlias = '_' + (i+1);
		rightAlias = '_' + i;
		relation = relations[i];
		relation.accept(c);
	}
	return sql;
}

var joinSql = newJoinSql;

function newWhereSql(relation,shallowFilter) {
	var c = {};
	var sql;

	c.visitJoin = function(relation) {
		var table = relation.childTable;
		var alias = relation.parentTable._dbName;
		var leftColumns = relation.columns;
		var rightColumns = table._primaryColumns;
		where(alias,leftColumns,rightColumns);
	};

	c.visitOne = function(relation) {
		var joinRelation = relation.joinRelation;
		var rightColumns = joinRelation.columns;
		var childTable = joinRelation.childTable;
		var leftColumns = childTable._primaryColumns;
		var alias = childTable._dbName;
		where(alias,leftColumns,rightColumns);
	};

	c.visitMany = c.visitOne;

	function where(alias,leftColumns,rightColumns) {
		var table = relation.childTable;
		var joinCore = newShallowJoinSqlCore(table,leftColumns,rightColumns,alias,'_1');
		if (shallowFilter)
			sql = shallowFilter.prepend(' WHERE ' + joinCore + ' AND ');
		else
			sql = ' WHERE ' + joinCore;
	}

	relation.accept(c);
	return sql;
}

var whereSql = newWhereSql;

function newSubFilter(relations, shallowFilter) {
	var relationCount = relations.length;
	var alias = '_' + relationCount;
	var table = relations[relationCount-1].childTable;
	var filter = selectSql(table,alias).prepend('EXISTS (');
	var join = joinSql(relations);
	var where = whereSql(relations[0],shallowFilter);
	return filter.append(join).append(where).append(')');

}

var subFilter = newSubFilter;

function newRelatedColumn(column,relations) {
	var c = {};
	var alias = '_' + relations.length;
	for (var propName in column) {
		var prop = column[propName];
		if (prop instanceof Function)

			c[propName] = wrapFilter(prop);
	}
	return c;

	function wrapFilter(filter) {
		return runFilter;

		function runFilter() {
			var args = [];
			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			args.push(alias);
			var shallowFilter =  filter.apply(null,args);
			return subFilter(relations,shallowFilter);
		}
	}

}

var relatedColumn = newRelatedColumn;

var nextRelatedTable = _nextRelatedTable;


function newRelatedTable(relations) {
	var table = relations[relations.length - 1].childTable;
	var columns = table._columns;
	var c = {};

	Object.defineProperty(c, '_relation', {
		value: relations[relations.length - 1],
		writable: false
	});

	for (var i = 0; i < columns.length; i++) {
		var col = columns[i];
		c[col.alias] = relatedColumn(col, relations);
	}
	defineChildren();

	function defineChildren() {
		var childRelations = table._relations;
		for (var alias in childRelations) {
			defineChild(alias);
		}
	}

	function defineChild(alias) {
		var relation = table._relations[alias];
		var children = relations.slice(0);
		children.push(relation);

		Object.defineProperty(c, alias, {
			get: function() {
				return nextRelatedTable(children);
			}
		});
	}

	c.exists = function() {
		return subFilter(relations);
	};

	return c;
}

function _nextRelatedTable(relations) {
	nextRelatedTable = newRelatedTable_1;
	return nextRelatedTable(relations);
}

var newRelatedTable_1 = newRelatedTable;

function newJoin(parentTable, childTable) {
	var c = {};
	var columnNames = [];

	c.by = function() {
		for (var i = 0; i < arguments.length; i++) {
			verifyColumnExists(arguments[i]);
			columnNames.push(arguments[i]);
		}
		return c;
	};

	function verifyColumnExists(columnName) {
		var columns = parentTable._columns;
		for (var i = 0; i < columns.length; i++) {
			if (columns[i]._dbName === columnName)
				return;

		}
		throw new Error('Unknown column: ' + columnName);
	}

	c.as = function(alias) {
		var relation = newJoinRelation(parentTable, childTable, columnNames);
		relation.leftAlias = alias;
		parentTable._relations[alias] = relation;

		Object.defineProperty(parentTable, alias, {
			get: function() {
				return newRelatedTable_1([relation]);
			}
		});

		return relation;
	};
	return c;
}

var join = newJoin;

function newLeg$1(relation) {

	var joinRelation = relation.joinRelation;
	var c = {};
	c.name = joinRelation.rightAlias;
	var span = {};
	span.queryContext = newQueryContext_1();
	span.table = joinRelation.parentTable;
	span.legs = newCollection_1();
	c.span = span;
	c.table = joinRelation.childTable;
	c.columns = joinRelation.columns;
	c.expand = relation.expand;

	c.accept = function(visitor) {
		visitor.visitOne(c);
	};

	return c;
}

var newOneLeg = newLeg$1;

function newLeg(relation) {
	var c = newOneLeg(relation);
	c.name = relation.joinRelation.rightAlias;
	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	c.expand = relation.expand;

	return c;
}

var newManyLeg = newLeg;

function extractParentKey(joinRelation, child) {

	var childTable = joinRelation.childTable;
	var primaryColumns = childTable._primaryColumns;
	var parent = {};

	joinRelation.columns.forEach(addKeyToParent);

	function addKeyToParent(childPk, index) {
		var primaryColumn = primaryColumns[index];
		parent[primaryColumn.alias] = child[childPk.alias];
	}

	return parent;
}

var extractParentKey_1 = extractParentKey;

function synchronizeChanged(manyCache, joinRelation, parent, child) {
	var columns = joinRelation.columns;
	columns.forEach(subscribeColumn);
	child = null;

	function subscribeColumn(column) {
		child.subscribeChanged(onChanged, column.alias);
	}

	function unsubscribe(child) {
		columns.forEach(unsubscribeColumn);

		function unsubscribeColumn(column) {
			child.unsubscribeChanged(onChanged, column.alias);
		}
	}

	function onChanged(child) {
		unsubscribe(child);
		manyCache.tryRemove(parent, child);
		var newParent = extractParentKey_1(joinRelation, child);
		manyCache.tryAdd(newParent, child);
	}



}

var synchronizeChanged_1 = synchronizeChanged;

function synchronizeAdded(action, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeAdded(onAdded);

	function onAdded(child) {
		var parent = extractParentKey_1(joinRelation, child);
		action(parent, child);
	}
}

var synchronizeAdded_1 = synchronizeAdded;

function synchronizeRemoved(action, joinRelation) {
	var cache = joinRelation.parentTable._cache;
	cache.subscribeRemoved(onRemoved);

	function onRemoved(child) {
		var parent = extractParentKey_1(joinRelation, child);
		action(parent, child);
	}
}

var synchronizeRemoved_1 = synchronizeRemoved;

function cacheCore() {
	var emitAdded = emitEvent_1();
	var emitRemoved = emitEvent_1();
	var c = {};
	var cache = {};
	var keyLength;

	c.tryGet = function(key) {
		var index = 0;
		var keyLength = key.length;

		return tryGetCore(cache, index);

		function tryGetCore(cache, index) {
			var keyValue = key[index];
			var cacheValue = cache[keyValue];
			if (typeof cacheValue === 'undefined')
				return null;
			if (keyLength - 1 === index)
				return cacheValue;
			return tryGetCore(cache[keyValue], ++index);
		}

	};

	c.tryAdd = function(key, result) {
		var index = 0;
		keyLength = key.length;

		return  addCore(cache, index);

		function addCore(cache, index) {
			var keyValue = key[index];

			if (keyLength - 1 === index) {
				if (keyValue in cache)
					return cache[keyValue];

				cache[keyValue] = result;
				emitAdded(result);
				return result;
			}
			if (! (keyValue in cache))
				cache[keyValue] = {};
			return addCore(cache[keyValue], ++index);
		}
	};

	c.tryRemove = function(key) {
		var index = 0;
		var keyLength = key.length;

		return tryRemoveCore(cache, index);

		function tryRemoveCore(cache, index) {
			var keyValue = key[index];
			if (!(keyValue in cache))
				return null;
			var cacheValue = cache[keyValue];
			if (keyLength - 1 === index) {
				delete cache[keyValue];
				emitRemoved(cacheValue);
				return cacheValue;
			}

			return tryRemoveCore(cache[keyValue], ++index);
		}

	};

	c.getAll = function() {
		var index = 0;
		var result = [];
		getAllCore(cache, index);

		function getAllCore(cache, index) {
			for (var name in cache) {
				var value = cache[name];
				if (index === keyLength - 1)
					result.push(value);
				else
					getAllCore(value, index+1);
			}
		}
		return result;
	};

	c.subscribeAdded = emitAdded.add;
	c.subscribeRemoved = emitRemoved.add;

	return c;
}

var newCache = cacheCore;

function newManyCache$1(joinRelation) {
	var c = {};
	var cache = newCache();
	var primaryColumns = joinRelation.childTable._primaryColumns;

	c.tryGet = function(parentRow) {
		var key = toKey(parentRow);
		var rows =  cache.tryGet(key);
		if (!rows)
			return newArray();
		return rows;
	};

	function tryAdd(parentRow, childRow) {
		var key = toKey(parentRow);
		var existing = cache.tryGet(key);
		if(existing) {
			existing.push(childRow);
			return;
		}
		var rows = newArray();
		rows.push(childRow);
		existing = cache.tryAdd(key, rows);
	}

	function newArray() {
		return rowArray(joinRelation.parentTable);
	}

	c.tryAdd = tryAdd;

	c.tryRemove = function(parentRow, childRow) {
		var key = toKey(parentRow);
		var existing = cache.tryGet(key);
		var index = existing.indexOf(childRow);
		existing.splice(index,1);
	};

	function toKey(row) {
		return primaryColumns.map(onColumn);

		function onColumn(column) {
			return row[column.alias];
		}
	}

	return c;
}

var newManyCacheCore = newManyCache$1;

var rngBrowser = createCommonjsModule(function (module) {
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}
});

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]
  ]).join('');
}

var bytesToUuid_1 = bytesToUuid;

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/uuidjs/uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rngBrowser();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid_1(b);
}

var v1_1 = v1;

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rngBrowser)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid_1(rnds);
}

var v4_1 = v4;

var uuid = v4_1;
uuid.v1 = v1_1;
uuid.v4 = v4_1;

var uuid_1 = uuid;

var newId = uuid_1.v4;

var setSessionSingleton = function(name, value) {
	getSessionContext_1()[name] = value;
};

function newManyCache(joinRelation) {
	var c = {};
	var key = newId();

	c.tryAdd = function(parent, child) {
		var cache = getSessionSingleton(key);
		cache.tryAdd(parent, child);
		synchronizeChanged_1(c, joinRelation, parent, child);
	};

	c.tryRemove = function(parent, child) {
		var cache = getSessionSingleton(key);
		cache.tryRemove(parent, child);
	};

	c.tryGet = function(parentRow) {
		var cache = getSessionSingleton(key);
		if (!cache) {
			cache = newManyCacheCore(joinRelation);
			setSessionSingleton(key, cache);
			fillCache();
			synchronizeAdded_1(c.tryAdd, joinRelation);
			synchronizeRemoved_1(c.tryRemove, joinRelation);
		}
		return cache.tryGet(parentRow);
	};


	function fillCache() {
		var childTable = joinRelation.parentTable;
		var childCache = childTable._cache;
		var children = childCache.getAll();
		children.forEach(addToCache);

		function addToCache(child) {
			var parent = extractParentKey_1(joinRelation, child);
			c.tryAdd(parent, child);
		}
	}



	return c;
}

var newManyCache_1 = newManyCache;

function newForeignKeyFilter(joinRelation, parentRow) {
	var columns = joinRelation.columns;
	var rightTable = joinRelation.childTable;

	var filter = getNextFilterPart(0);

	for (var i = 1; i < columns.length; i++) {

		filter = filter.and(getNextFilterPart(i));
	}

	function getNextFilterPart(index) {
		var column = columns[index];
		var pk = rightTable._primaryColumns[index];
		return column.eq(parentRow[pk.alias]);
	}
	return filter;
}

var newForeignKeyFilter_1 = newForeignKeyFilter;

function getRelatives(parent, relation) {
	var queryContext = parent.queryContext;

	var filter;
	var parentTable = relation.joinRelation.childTable;

	if (parentTable._primaryColumns.length === 1)
		filter = createInFilter();
	else
		filter = createCompositeFilter();


	function createInFilter() {
		var parentAlias = parentTable._primaryColumns[0].alias;
		var ids = queryContext.rows.map(function(row) {
			return row[parentAlias];
		});
		var column = relation.joinRelation.columns[0];
		return column.in(ids);
	}

	function createCompositeFilter() {
		var filters = queryContext.rows.map(function(row) {
			return newForeignKeyFilter_1(relation.joinRelation, row);
		});
		return emptyFilter_1.or.apply(emptyFilter_1, filters);
	}

	return relation.childTable.getMany(filter).then(onRows);

	function onRows(rows) {
		queryContext.expand(relation);
		negotiateExpandInverse_1(parent, relation, rows);
		return rows;
	}

}

var getRelatives_1 = getRelatives;

function newManyRelation(joinRelation) {
	var c = {};
	var manyCache = newManyCache_1(joinRelation);

	c.joinRelation = joinRelation;
	c.childTable = joinRelation.parentTable;
	c.isMany = true;

	c.accept = function(visitor) {
		visitor.visitMany(c);
	};

	c.getFromCache = function(parent) {
		var row = manyCache.tryGet(parent);
		return resultToPromise_1(row);
	};

	c.getFromDb = function(parent) {
		var filter = newForeignKeyFilter_1(joinRelation, parent);
		return c.childTable.getMany(filter);
	};

	c.getRelatives = function(parent) {
		return getRelatives_1(parent, c);
	};

	c.toGetRelated = function(parent) {
		return newGetRelated_1(parent, c);
	};

	c.expand = function(parent) {
		return parent.expand(joinRelation.rightAlias);
	};

	c.getRowsSync = manyCache.tryGet;

	c.toLeg = function() {
		return newManyLeg(c);
	};

	return c;
}

var newManyRelation_1 = newManyRelation;

function newOne$1(joinRelation) {
	var c = {};
	var parentTable = joinRelation.childTable;

	c.as = function(alias) {
		joinRelation.rightAlias = alias;
		var relation = newManyRelation_1(joinRelation);
		parentTable._relations[alias] = relation;

		Object.defineProperty(parentTable, alias, {
			get: function() {
				return newRelatedTable_1([relation]);
			}
		});

		return relation;
	};

	return c;
}

var hasMany = newOne$1;

function newOneCache(joinRelation) {
	var c = {};
	var cache = newManyCache_1(joinRelation);

	c.tryGet = function(parent) {
		var res = cache.tryGet(parent);
		if (res.length === 0)
			return null;
		return res[0];
	};
	return c;
}

var newOneCache_1 = newOneCache;

function newOneRelation(joinRelation) {
	var c = {};
	var oneCache = newOneCache_1(joinRelation);

	c.joinRelation = joinRelation;
	c.childTable = joinRelation.parentTable;
	c.isOne = true;

	c.accept = function(visitor) {
		visitor.visitOne(c);
	};

	c.getFromCache = function(parent) {
		var row = oneCache.tryGet(parent);
		return resultToPromise_1(row);
	};

	c.getFromDb = function(parent) {
		var filter = newForeignKeyFilter_1(joinRelation, parent);
		return c.childTable.tryGetFirst(filter);
	};

	c.getRelatives = function(parent) {
		return getRelatives_1(parent, c);
	};

	c.toGetRelated = function(parent) {
		return newGetRelated_1(parent, c);
	};

	c.expand = function(parent) {
		return parent.expand(joinRelation.rightAlias);
	};

	c.getRowsSync = oneCache.tryGet;

	c.toLeg = function() {
		return newOneLeg(c);
	};

	return c;
}

var newOneRelation_1 = newOneRelation;

function newOne(joinRelation) {
	var c = {};
	var parentTable = joinRelation.childTable;

	c.as = function(alias) {
		joinRelation.rightAlias = alias;
		var relation = newOneRelation_1(joinRelation);
		parentTable._relations[alias] = relation;

		Object.defineProperty(parentTable, alias, {
			get: function() {
				return newRelatedTable_1([relation]);
			}
		});
		return relation;
	};

	return c;
}

var hasOne = newOne;

function _new$5(table,alias) {
	var columnFormat = '%s as "%s"';
	var columns = table._columns;
	var sql = '';
	var separator = alias + '.';
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable))
			sql = sql + separator + util$2.format(columnFormat, column._dbName, column.alias);
		separator = ',' + alias + '.';
	}
	return sql;
}

var newShallowColumnSql$1 = _new$5;

function _new$4(table,filter,span, alias,subQueries,orderBy,limit) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newShallowColumnSql$1(table,alias);
		var whereSql = newWhereSql_1(table,filter,alias);
		return 'select ' + columnSql + subQueries + ' from ' + name + ' ' + alias + whereSql + orderBy + limit;
	};

	c.parameters = filter.parameters;

	return c;
}

var newSingleQuery$1 = _new$4;

function joinLegToQuery$3(parentAlias,leg,legNo) {
	var childAlias = parentAlias + '_' + legNo;
	var span = leg.span;
	var parentTable = leg.table;
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;

	var shallowJoin  = newShallowJoinSqlCore(parentTable,childColumns,parentColumns,childAlias,parentAlias);
	var filter = newParameterized$1(shallowJoin);
	var query = newQueryCore$1(span.table,filter,span,childAlias);
	return util$2.format(',(select row_to_json(r) from (%s limit 1) r) "%s"', query.sql(), leg.name );
}

var joinLegToQuery_1$1 = joinLegToQuery$3;

function oneLegToQuery$3(rightAlias,leg,legNo) {
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;

	var shallowJoin  = newShallowJoinSqlCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var filter = newParameterized$1(shallowJoin);
	var query = newQueryCore$1(span.table,filter,span,leftAlias);
	return util$2.format(',(select row_to_json(r) from (%s limit 1) r) "%s"', query.sql(), leg.name );
}

var oneLegToQuery_1 = oneLegToQuery$3;

function manyLegToQuery$4(rightAlias, leg, legNo) {
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;
	extractOrderBy_1$1(rightTable, rightAlias);

	var shallowJoin = newShallowJoinSqlCore(rightTable, leftColumns, rightColumns, leftAlias, rightAlias);
	var filter = newParameterized$1(shallowJoin);
	var query = newQueryCore$1(span.table, filter, span, leftAlias);
	return util$2.format(',(select coalesce(json_agg(row_to_json(r)),\'[]\') from (%s) r ) "%s"', query.sql(), leg.name);

}

var manyLegToQuery_1$1 = manyLegToQuery$4;

var joinLegToQuery$2 = _joinLegToQuery$1;
var oneLegToQuery$2 = _oneLegToQuery$1;
var manyLegToQuery$3 = _manyLegToQuery$1;

function newSubQueries$1(table,span,alias) {
	var result = [];
	var c = {};
	var _legNo;

	c.visitJoin = function(leg) {
		result.push(joinLegToQuery$2( alias,leg,_legNo));
	};
	c.visitOne = function(leg) {
		result.push(oneLegToQuery$2( alias,leg,_legNo));
	};
	c.visitMany = function(leg) {
		result.push(manyLegToQuery$3( alias,leg,_legNo));
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}

	return result.join('');
}

function _joinLegToQuery$1() {
	joinLegToQuery$2 = joinLegToQuery_1$1;
	return joinLegToQuery$2.apply(null,arguments);
}

function _oneLegToQuery$1() {
	oneLegToQuery$2 = oneLegToQuery_1;
	return oneLegToQuery$2.apply(null,arguments);
}

function _manyLegToQuery$1() {
	manyLegToQuery$3 = manyLegToQuery_1$1;
	return manyLegToQuery$3.apply(null,arguments);
}



var newSubQueries_1$1 = newSubQueries$1;

function extractOrderBy(alias, span) {
	var table = span.table;
	var dbNames = [];
	var orderBy = span.orderBy;
	var i;
	if (span.orderBy) {
		if (typeof orderBy === 'string')
			orderBy = [orderBy];
		for (i = 0; i < orderBy.length; i++) {
			var nameAndDirection = extractNameAndDirection(orderBy[i]);
			pushColumn(nameAndDirection.name, nameAndDirection.direction);
		}
	} else
		for (i = 0; i < table._primaryColumns.length; i++) {
			pushColumn(table._primaryColumns[i].alias);
		}

	function extractNameAndDirection(orderBy) {
		var elements = orderBy.split(' ');
		var direction = '';
		if (elements.length > 1) {
			direction = ' ' + elements[1];
		}
		return {
			name: elements[0],
			direction: direction
		};
	}

	function pushColumn(property, direction) {
		direction = direction || '';
		var column = getTableColumn(property);
		var jsonQuery = getJsonQuery(property, column.alias);

		dbNames.push(alias + '.' + column._dbName + jsonQuery + direction);
	}
	function getTableColumn(property) {
		var column = table[property] || table[property.split(/(-|#)>+/g)[0]];
		if(!column){
			throw new Error(`Unable to get column on orderBy '${property}'. If jsonb query, only #>, #>>, -> and ->> allowed. Only use ' ' to seperate between query and direction. Does currently not support casting.`);
		}
		return column;
	}
	function getJsonQuery(property, column) {
		let containsJson = (/(-|#)>+/g).test(property);
		if(!containsJson){
			return '';
		}
		return property.replace(column, '');
	}

	return ' order by ' + dbNames.join(',');
}

var extractOrderBy_1 = extractOrderBy;

function extractLimit(span) {
	if (span.limit)
		return ' limit ' + span.limit;
	return '';
}

var extractLimit_1 = extractLimit;

function newQuery$5(table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = extractOrderBy_1(alias,span);
	var limit = extractLimit_1(span);
	var subQueries = newSubQueries_1$1(table,span,alias);
	var query = newSingleQuery$1(table,filter,span,alias,subQueries,orderBy,limit);
	return newParameterized$1(query.sql(), query.parameters);
}

var newQueryCore$1 = newQuery$5;

function newQuery$4() {
	var query = newQueryCore$1.apply(null, arguments);
	return query.prepend('select json_strip_nulls(coalesce(json_agg(row_to_json(r)), \'[]\')) as result from (').append(') r');
}

var newQuery_1$4 = newQuery$4;

function newQuery$3() {
	var c = {};
	var _newQuery;

	//todo
	c.visitPg = function() {
		_newQuery = newQuery_1$4;
	};
	c.visitMySql = function() {
		throw new Error('MySql not supported');
	};

	c.visitSqlite = function() {
		throw new Error('Sqlite not supported');
	};

	getSessionContext_1().accept(c);

	return _newQuery.apply(null, arguments);
}

var newQuery_1$3 = newQuery$3;

function getManyDto(table, filter, strategy) {
	let isPg;
	let c = {};

	c.visitPg = function() {
		isPg = true;
	};
	c.visitMySql = function() {};
	c.visitSqlite = function() {};

	let context = getSessionContext_1();
	context.accept(c);

	if(context.getManyDto) {
		return getManyDto(table, filter, strategy);
	}

	if (!isPg) {
		let args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		return table.getMany.apply(null, args)
			.then((rows) => {
				args.shift();
				return rows.toDto.apply(null, args);
			});
	}
	var alias = table._dbName;
	filter = negotiateRawSqlFilter_1(filter);
	var span = strategyToSpan(table, strategy);
	var query = newQuery_1$3(table, filter, span, alias);
	return executeQueries_1([query]).then(onResults).then(onSingleResult);

	function onResults(rowsPromises) {
		return rowsPromises[0];
	}

	function onSingleResult(result) {
		for (var p in result[0]) {
			let res = result[0][p];
			return res;
		}
	}

}

var getManyDto_1 = getManyDto;

function get() {
	var cached =  tryGetFromCacheById.apply(null,arguments);
	if (cached)
		return resultToPromise_1(cached);
	return tryGetFromDbById.apply(null,arguments);
}
get.exclusive = tryGetFromDbById.exclusive;

var tryGetById = get;

function getCache(id) {
	var cache = getSessionSingleton(id);
	if (cache)
		return cache;
	cache = newCache();
	setSessionSingleton(id, cache);
	return cache;
}



var getCache_1 = getCache;

function newDomainCache() {
	var c = {};
	var id = newId();

	c.tryGet = function(key) {
		var cache = getCache();
		return cache.tryGet(key);
	};

	c.tryAdd = function(key, value) {
		var cache = getCache();
		return cache.tryAdd(key,value);
	};

	c.getAll = function() {
		var cache = getCache();
		return cache.getAll();
	};

	c.tryRemove = function(key) {
		var cache = getCache();
		return cache.tryRemove(key);
	};

	c.subscribeAdded = function(onAdded) {
		var cache = getCache();
		return cache.subscribeAdded(onAdded);
	};

	c.subscribeRemoved = function(onRemoved) {
		var cache = getCache();
		return cache.subscribeRemoved(onRemoved);
	};

	function getCache() {
		return getCache_1(id);
	}
	return c;
}

var newDomainCache_1 = newDomainCache;

function newRowCache(table) {
	var c = {};
	var cache = newDomainCache_1();
	var pkNames;
	var rowToKey = firstRowToKey;

	function getPkNames() {
		var names = {};
		var primaryColumns = table._primaryColumns;
		var keyLength = primaryColumns.length;
		for (var i = 0; i < keyLength; i++) {
			var column = primaryColumns[i];
			names[column.alias] = null;
		}
		return names;
	}

	c.tryGet = function(row) {
		var key = rowToKey(row);
		return cache.tryGet(key);

	};

	function firstRowToKey(row) {
		pkNames = getPkNames();
		rowToKey = nextRowToKey;
		table = null;
		return rowToKey(row);
	}

	function nextRowToKey(row) {
		var key = [];
		for(var pkName in pkNames) {
			key.push(row[pkName]);
		}
		return key;
	}

	c.tryAdd = function(row) {
		var key = rowToKey(row);
		return cache.tryAdd(key, row);
	};

	c.tryRemove = function(row) {
		var key = rowToKey(row);
		cache.tryRemove(key);
	};

	c.subscribeAdded = cache.subscribeAdded;
	c.subscribeRemoved = cache.subscribeRemoved;

	c.getAll = cache.getAll;

	return c;
}

var newRowCache_1 = newRowCache;

function newRow(table) {
	var dto = {};
	table._columns.forEach(addColumn);

	function addColumn(column) {
		var alias = column.alias;
		if ('default' in column) {
			if (typeof column.default === 'function')
				dto[alias] = column.default();
			else if (column.toDto)
				dto[alias] = column.toDto(column.default);
			else
				dto[alias] = column.default;
		}
		else
			dto[alias] = null;
	}

	for (var i = 1; i < arguments.length; i++) {
		var pkValue = arguments[i];
		var column = table._primaryColumns[i - 1];
		dto[column.alias] = pkValue;
	}

	return decodeDbRow_1(table, table, dto);
}

var newRow_1 = newRow;

function getSqlTemplate(table) {
	if (table._insertTemplate)
		return table._insertTemplate;
	var columnNames = [];
	var values = [];
	var sql = 'INSERT INTO ' + table._dbName + ' (';
	addDiscriminators();
	addColumns();
	sql = sql + columnNames.join(',') + ') VALUES (' + values.join(',') + ')';
	table._insertTemplate = sql;
	return sql;

	function addDiscriminators() {
		var discriminators = table._columnDiscriminators;
		for (var i = 0; i < discriminators.length; i++) {
			var parts = discriminators[i].split('=');
			columnNames.push(parts[0]);
			values.push(parts[1]);
		}
	}

	function addColumns() {
		var columns = table._columns;
		for (var i = 0; i < columns.length; i++) {
			var column = columns[i];
			columnNames.push(column._dbName);
			values.push('%s');
		}
	}
}

var getSqlTemplate_1 = getSqlTemplate;

function newInsertCommandCore(table, row) {
	var parameters = [];
	var values = [getSqlTemplate_1(table)];

	var columns = table._columns;
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		var alias = column.alias;
		var encoded = column.encode(row[alias]);
		if (encoded.parameters.length > 0) {
			values.push('?');
			parameters.push(encoded.parameters[0]);
		} else
			values.push(encoded.sql());
	}

	var sql = util$2.format.apply(null, values);
	return newParameterized$1(sql, parameters);
}

var newInsertCommandCore_1 = newInsertCommandCore;

var createPatch = rdbClient_1.createPatch;


function newInsertCommand(table, row) {
	return new InsertCommand(table, row);
}

function InsertCommand(table, row) {
	this.__getCoreCommand = newImmutable_1(newInsertCommandCore_1);
	this._table = table;
	this._row = row;
}

InsertCommand.prototype._getCoreCommand = function() {
	return this.__getCoreCommand(this._table, this._row);
};

InsertCommand.prototype.sql = function() {
	return this._getCoreCommand().sql();
};

InsertCommand.prototype.matches = function(otherRow) {
	return this._row === otherRow;
};


InsertCommand.prototype.endEdit = function() {
	this.sql();
	var dto = createDto(this._table, this._row);
	if (this._table._emitChanged.callbacks.length > 0)
		this._patch = createPatch([], [dto]);
};

InsertCommand.prototype.emitChanged = function() {
	return this._table._emitChanged({row: this._row, patch: this._patch});
};

Object.defineProperty(InsertCommand.prototype, 'parameters', {
	get: function() {
		return this._getCoreCommand().parameters;

	}
});

Object.defineProperty(InsertCommand.prototype, 'disallowCompress', {
	get: function() {
		return this._table._emitChanged.callbacks.length > 0;

	}
});


var newInsertCommand_1 = newInsertCommand;

function insert(table)  {
	var args = [].slice.call(arguments);
	var row = newRow_1.apply(null, args);
	row = table._cache.tryAdd(row);
	var cmd = newInsertCommand_1(table, row);
	pushCommand_1(cmd);
	expand(table, row);
	return row;
}

function expand(table, row) {
	var relationName;
	var visitor = {};
	visitor.visitJoin = function() {};

	visitor.visitMany = function() {
		row.expand(relationName);
	};

	visitor.visitOne = function() {
		row.expand(relationName);
	};

	for (relationName in table._relations) {
		var relation = table._relations[relationName];
		relation.accept(visitor);
	}

}

var insert_1 = insert;

var emptyPromise = resultToPromise_1();

function _delete(table, filter, strategy) {
	filter = negotiateRawSqlFilter_1(filter);
	strategy = extractDeleteStrategy_1(strategy);
	var relations = [];
	var cmds = [];

	cmds = newDeleteCommand(cmds, table, filter, strategy, relations);
	cmds.forEach(function(cmd) {
		pushCommand_1(cmd);
	});
	return emptyPromise;
}

var _delete_1 = _delete;

function cascadeDelete(table, filter) {
	var empty = newObject_1();
	var strategy = newCascadeDeleteStrategy_1(empty, table);
	return _delete_1(table, filter, strategy);
}

var cascadeDelete_1 = cascadeDelete;

function _new$3(table,alias) {
	var columnFormat = '\'%s\',%s.%s';
	var columns = table._columns;
	var sql = '';
	var separator = '';
	for (var i = 0; i < columns.length; i++) {
		var column = columns[i];
		if (!('serializable' in column && !column.serializable))
			sql = sql + separator + util$2.format(columnFormat, column.alias, alias, column._dbName);
		separator = ',';
	}
	return sql;
}

var newShallowColumnSql = _new$3;

var template$1 = 'select json_object(%s%s) as result from %s %s%s%s%s';


function _new$2(table,filter,alias,subQueries,orderBy,limit) {
	var c = {};

	c.sql = function() {
		var name = table._dbName;
		var columnSql = newShallowColumnSql(table,alias);
		var whereSql = newWhereSql_1(table,filter,alias);
		return util$2.format(template$1, columnSql, subQueries, name, alias, whereSql, orderBy, limit);
	};

	c.parameters = filter.parameters;

	return c;
}

var newSingleQuery = _new$2;

var template = 'json_object(%s%s)';


function _new$1(table,alias,subQueries) {
	var c = {};

	c.sql = function() {
		var columnSql = newShallowColumnSql(table,alias);
		return util$2.format(template, columnSql, subQueries);
	};

	c.parameters = [];

	return c;
}

var newSingleQueryCore = _new$1;

function newQueryCore(table,span,alias) {
	var subQueries = newSubQueries_1(table,span,alias);
	return newSingleQueryCore(table,alias,subQueries);
}

var newQueryCore_1 = newQueryCore;

function joinLegToQuery$1(parentAlias,leg,legNo) {
	var childAlias = parentAlias + '_' + legNo;
	var span = leg.span;
	var childTable = span.table;
	var parentTable = leg.table;
	var childColumns = span.table._primaryColumns;
	var parentColumns = leg.columns;

	var shallowJoin  = newShallowJoinSqlCore(parentTable,childColumns,parentColumns,childAlias,parentAlias);
	var query = newQueryCore_1(childTable,span,childAlias);

	return util$2.format(',\'%s\',(select %s from %s %s where %s)', leg.name, query.sql(), childTable._dbName, childAlias, shallowJoin);
}

var joinLegToQuery_1 = joinLegToQuery$1;

function manyLegToQuery$2(rightAlias,leg,legNo) {
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;
	var orderBy = extractOrderBy_1$1(rightTable,rightAlias);

	var shallowJoin  = newShallowJoinSqlCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var query = newQueryCore_1(span.table,span,leftAlias);


	return util$2.format(',\'%s\',(select %s from %s %s where %s%s LIMIT 1)',
		leg.name, query.sql(), span.table._dbName, leftAlias, shallowJoin, orderBy);
}

var oneLegToQuery$1 = manyLegToQuery$2;

function manyLegToQuery$1(rightAlias,leg,legNo) {
	var leftAlias = rightAlias + '_' + legNo;
	var span = leg.span;
	var rightTable = leg.table;
	var rightColumns = rightTable._primaryColumns;
	var leftColumns = leg.columns;
	var orderBy = extractOrderBy_1(leftAlias, span);

	var shallowJoin  = newShallowJoinSqlCore(rightTable,leftColumns,rightColumns,leftAlias,rightAlias);
	var query = newQueryCore_1(span.table,span,leftAlias);


	return util$2.format(',\'%s\',(select cast(concat(\'[\',ifnull(group_concat(%s%s),\'\'),\']\') as json) from %s %s where %s)',
		leg.name, query.sql(), orderBy, span.table._dbName, leftAlias, shallowJoin);
}

var manyLegToQuery_1 = manyLegToQuery$1;

var joinLegToQuery = _joinLegToQuery;
var oneLegToQuery = _oneLegToQuery;
var manyLegToQuery = _manyLegToQuery;

function newSubQueries(table,span,alias) {
	var result = [];
	var c = {};
	var _legNo;

	c.visitJoin = function(leg) {
		result.push(joinLegToQuery( alias,leg,_legNo));
	};
	c.visitOne = function(leg) {
		result.push(oneLegToQuery( alias,leg,_legNo));
	};
	c.visitMany = function(leg) {
		result.push(manyLegToQuery( alias,leg,_legNo));
	};

	span.legs.forEach(onEachLeg);

	function onEachLeg(leg,legNo) {
		_legNo = legNo;
		leg.accept(c);
	}

	return result.join('');
}

function _joinLegToQuery() {
	joinLegToQuery = joinLegToQuery_1;
	return joinLegToQuery.apply(null,arguments);
}

function _oneLegToQuery() {
	oneLegToQuery = oneLegToQuery$1;
	return oneLegToQuery.apply(null,arguments);
}

function _manyLegToQuery() {
	manyLegToQuery = manyLegToQuery_1;
	return manyLegToQuery.apply(null,arguments);
}



var newSubQueries_1 = newSubQueries;

function newQuery$2(table,filter,span,alias) {
	filter = extractFilter(filter);
	var orderBy = extractOrderBy_1(alias,span);
	var limit = extractLimit_1(span);

	var subQueries = newSubQueries_1(table,span,alias);
	return newSingleQuery(table,filter,alias,subQueries,orderBy,limit);
}

var newQuery_1$2 = newQuery$2;

function newQuery$1() {
	var query = newQueryCore$1.apply(null, arguments);
	return query.prepend('select row_to_json(r)::text as result from (').append(') r');
}

var newQuery_1$1 = newQuery$1;

function newQuery(db) {
	var c = {};
	var _newQuery;

	c.visitPg = function() {
		_newQuery = newQuery_1$1;
	};
	c.visitMySql = function() {
		_newQuery = newQuery_1$2;
	};

	c.visitSqlite = function() {
		throw new Error('Sqlite not supported');
	};

	db.accept(c);

	var args = [];
	for (var i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	return _newQuery.apply(null, args);
}

var newQuery_1 = newQuery;

function newQueryStream(query, options) {
	var dbClient = getSessionSingleton('dbClient');
	return dbClient.streamQuery(query, options);
}

var newQueryStream_1 = newQueryStream;

function createReadStreamCoreNative(table, db, filter, strategy, transformer, streamOptions) {
	var alias = table._dbName;
	filter = negotiateRawSqlFilter_1(filter);
	var span = strategyToSpan(table, strategy);

	if (process.domain)
		process.domain.add(transformer);

	db.transaction(async() => {
		await start();
	}).then(null, onError);

	function start() {
		return new Promise((resolve, reject) => {
			var query = newQuery_1(db, table, filter, span, alias);
			var queryStream = newQueryStream_1(query, streamOptions);
			queryStream.on('end', resolve);
			queryStream.on('error', onStreamError);
			queryStream.pipe(transformer);

			function onStreamError(e) {
				reject(e);
			}
		});

	}

	function onError(e) {
		transformer.emit('error', e);
	}

	return transformer;
}

var createReadStreamCoreNative_1 = createReadStreamCoreNative;

function createReadStreamNative(table, db, filter, strategy, streamOptions) {
	var transformer = hostExpress.Transform({ objectMode: true });
	transformer._transform = function(chunk, _enc, cb) {
		var row = JSON.parse(chunk.result);
		transformer.push(row);
		cb();
	};

	return createReadStreamCoreNative_1(table, db, filter, strategy, transformer, streamOptions);
}

var createReadStreamNative_1 = createReadStreamNative;

function cloneStrategy(strategy, target) {
	target = target || {};
	for (var name in strategy) {
		target[name] = mapChild(strategy[name]);
	}
	return target;
}

function mapChild(strategy) {
	if (strategy instanceof Array)
		return cloneStrategy(strategy, []);
	if (strategy instanceof Object) {
		return cloneStrategy(strategy, {});
	}
	return strategy;
}

var cloneStrategy_1 = cloneStrategy;

function createBatchFilter(table, filter, strategy, lastDto) {
	if (!lastDto) {
		return filter;
	}

	var orderBy = strategy.orderBy;

	for (var i = 0; i < strategy.orderBy.length; i++) {
		var subFilter = createSubFilter(i);
		filter = filter.or(subFilter);
	}

	function createSubFilter(index) {
		var subFilter = emptyFilter_1;
		for (var i = 0; i < index + 1; i++) {
			var order = orderBy[i];
			var elements = order.split(' ');
			var name = elements[0];
			var direction = elements[1] || 'asc';
			var value = lastDto[name];
			if (index === i) {
				if (direction === 'asc')
					subFilter = subFilter.and(table[name].greaterThan(value));
				else
					subFilter = subFilter.and(table[name].lessThan(value));
			} else
				subFilter = subFilter.and(table[name].eq(value));
		}
		return subFilter;
	}

	return filter;
}



var createBatchFilter_1 = createBatchFilter;

var defaultBatchSize = 200;
var Readable = hostExpress.Readable;


function createReadStream$1(table, db, filter, strategy, streamOptions) {
	filter = extractFilter(filter);
	var batchFilter;
	strategy = cloneStrategy_1(strategy);
	calculateOrderBy();
	streamOptions = streamOptions || {};
	var batchSize = streamOptions.batchSize || defaultBatchSize;
	batchSize = (batchSize + 1) / 2 >> 0;
	var maxRows = strategy.limit;
	var currentRowCount = 0;
	var busy;
	var waitingforMore;
	var dtos = [];
	var lastDto;
	var done;

	var stream = Readable({ objectMode: true });
	stream._read = function() {
		waitingforMore = true;
		if (!busy) {
			if (dtos.length > 0)
				negotiatePushStream();
			else
				getDtos();
		}
	};
	if (process.domain)
		process.domain.add(stream);

	function getDtos() {
		busy = true;
		return db.transaction(async() => {
			await getBatch()
				.then(onRows)
				.then(onDtos);
		})
			.then(negotiatePushStream, onError);
	}

	function onRows(rows) {
		return rows.toDto(strategy);
	}

	function onDtos(result) {
		busy = false;
		currentRowCount += result.length;
		lastDto = result[result.length - 1];
		dtos = dtos.concat(result);
		if (currentRowCount >= maxRows || result.length < batchSize) {
			dtos.push(null);
			done = true;
		}
	}

	function negotiatePushStream() {
		if (dtos.length <= batchSize && !done)
			getDtos();
		if (!waitingforMore)
			return;
		waitingforMore = false;
		stream.push(dtos.shift());
	}

	function getBatch() {
		calculateLimit();
		calculateBatchFilter();
		return table.getMany(batchFilter, strategy);
	}

	function calculateLimit() {
		if (maxRows === undefined || maxRows === null)
			strategy.limit = batchSize;
		else {
			var rowsLeft = maxRows - currentRowCount;
			strategy.limit = Math.min(rowsLeft, batchSize);
		}
	}

	function calculateOrderBy() {
		strategy.orderBy = strategy.orderBy || [];
		if (typeof strategy.orderBy === 'string') {
			strategy.orderBy = [strategy.orderBy];
		}
		var primaryColumns = table._primaryColumns;
		for (var i = 0; i < primaryColumns.length; i++) {
			strategy.orderBy.push(primaryColumns[i].alias);
		}
	}

	function calculateBatchFilter() {
		batchFilter = createBatchFilter_1(table, filter, strategy, lastDto);
	}

	function onError(e) {
		stream.emit('error', e);
	}

	return stream;
}

var createReadStreamDefault = createReadStream$1;

function createReadStream(table, db, filter, strategy, streamOptions) {
	var create;
	var c = {};

	c.visitPg = function() {
		create =  createReadStreamNative_1;
	};

	c.visitMySql = c.visitPg;

	c.visitSqlite = function() {
		create =  createReadStreamDefault;
	};

	db.accept(c);

	return create(table, db, filter, strategy, streamOptions);
}

var createReadStream_1 = createReadStream;

function createJSONReadStream$2(table, db, filter, strategy, streamOptions) {
	var transformer = hostExpress.Transform({
		objectMode: true
	});
	var started;
	transformer._transform = function(chunk, enc, cb) {
		if (started)
			transformer.push(',' + chunk.result);
		else {
			transformer.push('[');
			transformer.push(chunk.result);
			started = true;
		}
		cb();
	};

	transformer._flush = function(cb) {
		transformer.push(']');
		cb();
	};

	return createReadStreamCoreNative_1(table, db, filter, strategy, transformer, streamOptions);
}

var createJSONReadStreamNative = createJSONReadStream$2;

function createJSONReadStream$1(table, db, filter, strategy, streamOptions) {
	var transformer = hostExpress.Transform({ objectMode: true });
	var started;
	transformer._transform = function(obj, enc, cb) {
		var data = JSON.stringify(obj);
		if (started)
			transformer.push(',' + data);
		else {
			transformer.push('[');
			transformer.push(data);
			started = true;
		}
		cb();
	};

	transformer._flush = function(cb) {
		transformer.push(']');
		cb();
	};

	var objectStream = createReadStreamDefault(table, db, filter, strategy, streamOptions);
	objectStream.on('error', onError);
	return objectStream.pipe(transformer);

	function onError(e) {
		transformer.emit('error', e);
	}
}

var createJSONReadStreamDefault = createJSONReadStream$1;

function createJSONReadStream(table, db, filter, strategy, streamOptions) {
	var create;
	var c = {};

	c.visitPg = function() {
		create = createJSONReadStreamNative;
	};

	c.visitMySql = c.visitPg;

	c.visitSqlite = function() {
		create = createJSONReadStreamDefault;
	};

	db.accept(c);

	return create(table, db, filter, strategy, streamOptions);
}

var createJSONReadStream_1 = createJSONReadStream;

function _new(tableName) {
	var table = newObject_1();
	table._dbName = tableName;
	table._primaryColumns = [];
	table._columns = [];
	table._columnDiscriminators = [];
	table._formulaDiscriminators = [];
	table._relations = {};
	table._cache = newRowCache_1(table);
	table._emitChanged = emitEvent_1();

	table.primaryColumn = function(columnName) {
		var columnDef = newColumn(table, columnName);
		table._primaryColumns.push(columnDef);
		return column(columnDef, table);
	};

	table.column = function(columnName) {
		var columnDef = newColumn(table, columnName);
		return column(columnDef, table);
	};

	table.join = function(relatedTable) {
		return join(table, relatedTable);
	};

	table.hasMany = function(joinRelation) {
		return hasMany(joinRelation);
	};

	table.hasOne = function(joinRelation) {
		return hasOne(joinRelation);
	};

	table.getMany = function(filter, strategy) {
		return Promise.resolve().then(() => getMany_1(table, filter, strategy));
	};

	table.getManyDto = function(filter, strategy) {
		if (arguments.length < 2)
			strategy = extractStrategy_1(table);
		return Promise.resolve().then(() => getManyDto_1(table, filter, strategy));
	};

	table.getMany.exclusive = function(filter, strategy) {
		return Promise.resolve().then(() => getMany_1.exclusive(table, filter, strategy));
	};

	table.tryGetFirst = function() {
		return callAsync(tryGetFirstFromDb, arguments);
	};
	table.tryGetFirst.exclusive = function() {
		return callAsync(tryGetFirstFromDb.exclusive, arguments);
	};

	function callAsync(func, args) {
		return Promise.resolve().then(() => call(func, args));
	}

	function call(func, args) {
		var mergedArgs = [table];
		for (var i = 0; i < args.length; i++) {
			mergedArgs.push(args[i]);
		}
		return func.apply(null, mergedArgs);
	}

	table.getById = function() {
		return callAsync(getById_1, arguments);
	};

	table.getById.exclusive = function() {
		return callAsync(getById_1.exclusive, arguments);
	};

	table.tryGetById = function() {
		return callAsync(tryGetById, arguments);
	};

	table.tryGetById.exclusive = function() {
		return callAsync(tryGetById.exclusive, arguments);
	};

	table.columnDiscriminators = function() {
		for (var i = 0; i < arguments.length; i++) {
			table._columnDiscriminators.push(arguments[i]);
		}
		return table;
	};

	table.formulaDiscriminators = function() {
		for (var i = 0; i < arguments.length; i++) {
			table._formulaDiscriminators.push(arguments[i]);
		}
		return table;
	};

	table.insert = function() {
		return call(insert_1, arguments);
	};

	table.delete = _delete_1.bind(null, table);
	table.cascadeDelete = cascadeDelete_1.bind(null, table);
	table.createReadStream = createReadStream_1.bind(null, table);
	table.createJSONReadStream = createJSONReadStream_1.bind(null, table);
	table.exclusive = function() {
		table._exclusive = true;
		return table;
	};
	table.patch = patchTable_1.bind(null, table);
	table.subscribeChanged = table._emitChanged.add;
	table.unsubscribeChanged = table._emitChanged.remove;

	return table;
}

var table = _new;

var command$1 = newParameterized$1('COMMIT');
function empty$1() {}

command$1.endEdit = empty$1;
command$1.matches = empty$1;

var commitCommand = command$1;

function deleteSessionContext() {
	if (hostExpress()) {
		let context = hostExpress.get('rdb');
		delete context.rdb;
		if (context.exit)
			hostExpress.exit('rdb');
	}
	else if (process)
		delete process.domain.rdb;
}

var deleteSessionContext_1 = deleteSessionContext;

function release() {
	var done = getSessionSingleton('dbClientDone');
	var pool = getSessionSingleton('pool');
	deleteSessionContext_1();
	if (done)
		done();
	if (pool)
		return pool.end();

}

var releaseDbClient = release;

function commit(result) {
	return popAndPushChanges()
		.then(releaseDbClient)
		.then(onReleased);

	function onReleased() {
		return result;
	}

	async function popAndPushChanges() {
		let changes = popChanges_1();
		while (changes.length > 0) {
			await executeChanges_1(changes);
			changes = popChanges_1();
		}
		pushCommand_1(commitCommand);
		return executeChanges_1(popChanges_1());
	}
}

var commit_1 = function(result) {
	return Promise.resolve()
		.then(() => commit(result));
};

var command = newParameterized$1('ROLLBACK');
function empty() {}

command.endEdit = empty;
command.matches = empty;

var rollbackCommand = command;

function tryReleaseDbClient() {
	try {
		releaseDbClient();
	}
	// eslint-disable-next-line no-empty
	catch (e) {

	}

}

var tryReleaseDbClient_1 = tryReleaseDbClient;

function newThrow(e, previousPromise) {
	return previousPromise.then(throwError, throwError);
	function throwError() {
		tryReleaseDbClient_1();
		throw e;
	}
}

var newThrow_1 = newThrow;

function rollback(e) {
	var executeRollback = executeQuery_1.bind(null, rollbackCommand);
	var chain = resultToPromise_1()
		.then(popChanges_1)
		.then(executeRollback)
		.then(releaseDbClient);

	if (e)
		return newThrow_1(e, chain);
	return chain;
}

var rollback_1 = function(e) {
	return Promise.resolve().then(() => rollback(e));
};

var pools = newObject_1();

Object.defineProperty(pools, 'end', {
	enumerable: false,
	value: end
});

function end() {
	var all = [];
	for (var poolId in pools) {
		var endPool = pools[poolId].end();
		all.push(endPool);
	}
	return Promise.all(all);
}

var pools_1 = pools;

var logger = function() {
};

function log() {
	logger.apply(null, arguments);
}

log.registerLogger = function(cb) {
	logger = cb;
};

var log_1 = log;

function negotiateSql(query) {
	if(typeof(query) === 'string')
		return function() { return query; };

	var sql = query.sql;
	if(typeof(sql) === 'function')
		return sql;
	else if(typeof(sql) === 'string')
		return function() { return sql; };
	else
		throw new Error('Query lacks sql property string or function');
}

var negotiateSql_1 = negotiateSql;

function negotiateParameters(parameters) {
	if(parameters === undefined)
		return [];
	else if(parameters.length !== undefined)
		return parameters;
	else
		throw new Error('Query has invalid parameters property. Must be undefined or array');
}

var negotiateParameters_1 = negotiateParameters;

function wrapQuery(query) {
	var safeSql = negotiateSql_1(query);
	var safeParameters = negotiateParameters_1(query.parameters);
	let obj =  {
		sql: safeSql,
		parameters: safeParameters
	};
	if (query.types)
		obj.types = query.types;
	return obj;
}


var wrapQuery_1 = wrapQuery;

function doQuery(query) {
	var wrappedQuery = wrapQuery_1(query);
	return executeQueries_1([wrappedQuery]).then(unwrapResult);
}

function unwrapResult(results) {
	return results[0];
}

var query = doQuery;

function toIntKey(key) {
	if (isInteger())
		return key;
	if (isIntegerString())
		return trim(key);
	var intKey = '';
	for (var i = 0; i < key.length; ++i) {
		var value = key[i].toUpperCase();
		value = parseInt(value, 16);
		if (!isNaN(value))
			intKey += value;
	}

	return trim(intKey);

	function isIntegerString() {
		var pattern = /^-?\d+\.?\d*$/;
		var reg = new RegExp(pattern);
		return (typeof key === 'string' && reg.test(key));
	}

	function isInteger() {
		return (typeof key === 'number') && (Math.floor(key) === key);
	}

	function trim(value) {
		var maxBigInt = '9223372036854775807';
		value = value.substring(0, 19);
		if (value > maxBigInt)
			return value.substring(0,18);
		return value;
	}
}

var toIntKey_1 = toIntKey;

function lock(key, func) {
	key = toIntKey_1(key);
	if(typeof func === 'function') {
		return inLock(key, func);
	} else {
		var sql = 'SELECT pg_advisory_xact_lock(' + key + ')';
		return query(sql);
	}
}

async function inLock(key, func) {
	await query('SELECT pg_advisory_lock(' + key + ')');
	try {
		let result = await func();
		await query('SELECT pg_advisory_unlock(' + key + ')');
		return result;
	} catch(e) {
		await query('SELECT pg_advisory_unlock(' + key + ')');
		throw e;
	}
}

var lock_1 = lock;

function executeSchema(schema) {
	if (!schema)
		throw new Error('Missing schema');
	if (!Array.isArray(schema))
		schema = [schema];
	return query('SET LOCAL search_path TO ' + schema.join(','));
}

var schema = executeSchema;

var _sqlite;


var connectViaPool = function(connectionString) {
	if (connectionString.indexOf && connectionString.indexOf('mysql') === 0)
		return connectViaPool.mySql.apply(null, arguments);
	if (connectionString.indexOf && connectionString.indexOf('postgres') === 0)
		return hostExpress.apply(null, arguments);
	else
		return connectViaPool.http.apply(null, arguments);
};

connectViaPool.pg = hostExpress;
connectViaPool.mySql = hostExpress;
connectViaPool.http = newDatabase_1;
connectViaPool.table = table;
connectViaPool.filter = emptyFilter_1;
connectViaPool.commit = commit_1;
connectViaPool.rollback = rollback_1;
connectViaPool.end = pools_1.end;
connectViaPool.log = log_1.registerLogger;
connectViaPool.query = query;
connectViaPool.lock = lock_1;
connectViaPool.schema = schema;

Object.defineProperty(connectViaPool, 'sqlite', {
	get: function() {
		if (!_sqlite)
			_sqlite = hostExpress;
		return _sqlite;
	}
});

connectViaPool.express = hostExpress;
connectViaPool.useHook = function(bool) {
	flags_1.useHook = bool;
};

var rdb = connectViaPool;

export default rdb;
