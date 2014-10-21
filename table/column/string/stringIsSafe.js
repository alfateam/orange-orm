var ascii = '\u0020\u0028-\u003E\u0040-\u005A\u0060-\u007A';
var latin1 = '\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF';
var latinExtA = '\u0100-\u017F';
var latinExtB = '\u0180-\u024F';
var cyrillic = '\u0400-\u04FF';	
var cjk = '\u4E00-\u9FC3';
var util = require('util');
var patternString = util.format('^[%s%s%s%s%s%s]+$', ascii, latin1, latinExtA, latinExtB, cyrillic, cjk);
var pattern = new RegExp(patternString);

function stringIsSafe(value) {
	return pattern.test(value);
}

module.exports = stringIsSafe;