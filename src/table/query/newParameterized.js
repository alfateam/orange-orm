var extractSql = require('./extractSql');
var extractParameters = require('./parameterized/extractParameters');

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
		return newParameterized(other.sql() + this._text, params);
	} else
		return newParameterized(other + this._text, this.parameters);
};

Parameterized.prototype.append = function(other) {
	if (other.sql) {
		var params = this.parameters.concat(other.parameters);
		return newParameterized(this._text + other.sql(), params);
	} else
		return newParameterized(this._text + other, this.parameters);
};

function newParameterized(text, parameters) {
	text = extractSql(text);
	parameters = extractParameters(parameters);
	return new Parameterized(text, parameters);
}

module.exports = newParameterized;
