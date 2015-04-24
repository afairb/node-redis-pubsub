var redis = require('redis');


/**
 * Create a new NodeRedisPubsub instance that can subscribe to channels and publish messages
 * @param {Object} options Options for the client creations:
 *                 port - Optional, the port on which the Redis server is launched
 *                 scope - Optional, two NodeRedisPubsubs with different scopes will not share messages
 */
function NodeRedisPubsub (options) {
    if (!(this instanceof NodeRedisPubsub)) return new NodeRedisPubsub(options);
    options = options || {};
    var port = options && options.port || 6379; // 6379 is Redis' default
    var host = options && options.host || '127.0.0.1';
    var auth = options && options.auth;

    function createClient() {
        if (options && options.createClient) {
            return options.createClient();
        } else {
            return redis.createClient(port, host);
        }
    };

    // Need to create two Redis clients as one cannot be both in receiver and emitter mode
    this.emitter = createClient();
    this.receiver = createClient();

    if (auth) {
        this.emitter.auth(auth);
        this.receiver.auth(auth);
    }

    this.receiver.setMaxListeners(0);

    this.prefix = options.scope ? options.scope + ':' : '';
}


// Store handlers so they can be deregistered later on
var handlers = [];


/**
 * Return the emitter object to be used as a regular Redis client to save resources
 */
NodeRedisPubsub.prototype.getRedisClient = function() {
    return this.emitter;
}


/**
 * Subscribe to a channel
 * @param {String} channel The channel to subscribe to, can be a pattern e.g. 'user.*'
 * @param {Function} handler Function to call with the received message
 * @param {Function} cb Optional callback to call once the handler is registered
 *
 */
NodeRedisPubsub.prototype.on = function(channel, handler, cb) {
    var callback = cb || function () {}
        , self = this;

    var wrapper = function (pattern, _channel, message) {
        if (self.prefix + channel === pattern) {
            handler(JSON.parse(message), _channel);
        }
    };

    this.receiver.on('pmessage', wrapper);

    handlers.push({handler: handler, wrapper: wrapper, channel: channel});

    this.receiver.psubscribe(this.prefix + channel, callback);
};


/**
 * Unsubscribe from a channel
 * @param {String} channel The channel to unsubscribe from, can be a pattern e.g. 'user.*'
 * @param {Function} cb Optional callback to call once the handler is unregistered
 * @param {Function} handler Function to unsubscribe
 *
 */
NodeRedisPubsub.prototype.off = function(channel, handler, cb) {
    var callback = cb || function () {}
        , self = this;

    // Remove any matching functions
    var indices = [];
    handlers.forEach(function(item, index) {
        if (item.handler === handler || (handler === null && item.channel == channel)) {
            self.receiver.removeListener('pmessage', item.wrapper);
            indices.push(index);
        }
    });

    // Flush matching funcs from the list
    handlers = handlers.filter(function(item, index) { return indices.indexOf(index) == -1; });

    this.receiver.punsubscribe(this.prefix + channel, callback);
};


/**
 * Subscribe to a channel for a single message only, then unsubscribe
 * @param {String} channel The channel to subscribe to, can be a pattern e.g. 'user.*'
 * @param {Function} handler Function to call with the received message
 * @param {Function} cb Optional callback to call once the handler is registered
 *
 */
NodeRedisPubsub.prototype.once = function(channel, handler, cb) {
    this.onceIf(channel, handler, false, false, cb);
};


/**
* Subscribe to a channel for a single message when a condition is met, then unsubscribe
* @param {String} channel The channel to subscribe to, can be a pattern e.g. 'user.*'
* @param {Function} handler Function to call with the received message
* @param {String} field A field of the recieved message JSON that we want to compare
* @param {String} value The value we want the specified field to equal
* @param {Function} cb Optional callback to call once the handler is registered
*
*/
NodeRedisPubsub.prototype.onceIf = function(channel, handler, field, value, cb) {
    var callback = cb || function () {}
        , self = this;

    var wrapper = function (pattern, _channel, message) {
        var json = JSON.parse(message);
        if (self.prefix + channel === pattern && (!field || json[field] == value)) {
            self.off(channel, handler, function() {
                handler(json, _channel);
            });
        }
    };

    this.receiver.on('pmessage', wrapper);

    handlers.push({handler: handler, wrapper: wrapper, channel: channel});

    this.receiver.psubscribe(this.prefix + channel, callback);
};


/**
 * Emit an event
 * @param {String} channel Channel on which to emit the message
 * @param {Object} message
 * @param {Function} cb Optional callback to call once the message is emitted
 */
NodeRedisPubsub.prototype.emit = function (channel, message, cb) {
    this.emitter.publish(this.prefix + channel, JSON.stringify(message), cb);
};


module.exports = NodeRedisPubsub;
