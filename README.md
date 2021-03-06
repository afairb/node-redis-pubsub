NRP (Node Redis Pubsub - Fork)
=================

**NOTE: this is a fork of Louis Chatriot's original [Node Redis Pubsub library](https://github.com/louischatriot/node-redis-pubsub) which is no longer maintained**

Simple pubsub for node using Redis. Why use NRP instead of Node's EventEmitter? It is useful when
your Node application needs to share data with other applications. In that case EventEmitter will not
help you, you need an external pubsub provider. Redis is pretty good at this, but its pubsub API
is strange. So you use this wrapper.

## Install and test
```bash
$ npm install node-redis-pubsub-fork      # Install locally
$ npm install -g node-redis-pubsub-fork   # Install globally
$
$ make test   # test (devDependencies need to be installed and a Redis server up)
```

## Usage
### Setup
for a trusted environment where Redis runs locally, unprotected on a port blocked by firewall.

```javascript
var NRP = require('node-redis-pubsub-fork')
  , config = { port: 6379       // Port of your locally running Redis server
             , scope: 'demo'    // Use a scope to prevent two NRPs from sharing messages
             }
  , nrp = new NRP(config);      // This is the NRP client
```

for a remote Redis server

```javascript
var NRP = require('node-redis-pubsub-fork')
  , config = { port: 1234       // Port of your remote Redis server
             , host: 'path.to.reremote.redis.host' // Redis server host, defaults to 127.0.0.1
             , auth: 'password' // Password
             , scope: 'demo'    // Use a scope to prevent two NRPs from sharing messages
             }
  , nrp = new NRP(config);      // This is the NRP client
```

### Simple pubsub

```javascript
var helloHandler = function (data) {
  console.log('Hello ' + data.name);
});
nrp.on('say hello', helloHandler);

nrp.emit('say hello', { name: 'Louis' });   // Outputs 'Hello Louis'


// You can use patterns to capture all messages of a certain type, and get the full name of the channel a message is sent on
nrp.on('city:*', function (data, channel) {
  console.log(data.city + ' is great');
});

nrp.emit('city:hello', { city: 'Paris' });   // Outputs 'Paris is great'
nrp.emit('city:yeah', { city: 'San Francisco' });   // Outputs 'San Francisco is great'


// Unsubscribe from a channel and handler you have previously subscribed to
nrp.off('say hello', helloHandler);


// Only subscribe to a channel for a single message
var goodbyeHandler = function(data) {
  console.log('Goodbye ' + data.name);
};
nrp.once('say goodbye', goodbyeHandler);

nrp.emit('say goodbye', { name: 'Louis' });   // Outputs 'Goodbye Louis' then unsubscribes from future messages with this handler on this channel
```


## License

(The MIT License)

Copyright (c) 2014

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Acknowledgements

Based on Louis Chatriot's [Node Redis Pubsub library](https://github.com/louischatriot/node-redis-pubsub), and incorporates some code from [Daniel Lowes's fork](https://github.com/Pleochism/node-redis-pubsub)
