var containsCore = require('./containsCore');

module.exports = (context, ...rest) => containsCore.apply(null, [context, 'LIKE', ...rest]);

