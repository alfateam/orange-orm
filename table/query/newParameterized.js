var extractSql = require('./extractSql');
var extractParameters = require('./parameterized/extractParameters');

var nextParameterized = function(text, params) {
    nextParameterized = require('../query/newParameterized');
    return nextParameterized(text, params);
}

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

module.exports = function(text, parameters) {
    text = extractSql(text);
    parameters = extractParameters(parameters);
    return new Parameterized(text, parameters);
};
