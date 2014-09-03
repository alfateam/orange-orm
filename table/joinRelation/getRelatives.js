var legToQuery = require('../query/addSubQueries/joinLegToQuery');
var getRelativesCore = require('../getRelativesCore');

module.exports = getRelativesCore.bind(null, legToQuery);