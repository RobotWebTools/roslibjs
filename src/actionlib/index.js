var Ros = require('../core/Ros');
var mixin = require('../mixin');

var action = module.exports = {
    ActionClient: require('./ActionClient'),
    Goal: require('./Goal'),
    SimpleActionServer: require('./SimpleActionServer')
};

mixin(Ros, ['ActionClient', 'SimpleActionServer'], action);