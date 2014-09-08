var should = require('chai').should()
  , conf = { port: 6379, scope: 'onescope' }
  , conf2 = { port: 6379, scope: 'anotherscope' }
  , conf3 = {}
  , NodeRedisPubsub = require('../index')
  ;


describe('Node Redis Pubsub', function () {

  it('Should send and receive standard messages correctly', function (done) {
    var rq = new NodeRedisPubsub(conf);

    rq.on('a test', function (data) {
      data.first.should.equal('First message');
      data.second.should.equal('Second message');
      done();
    }
    , function () {
        rq.emit('a test', { first: 'First message'
                            , second: 'Second message' });
      });
  });

  it('Should receive pattern messages correctly', function (done) {
    var rq = new NodeRedisPubsub(conf);

    rq.on('test:*', function (data) {
      data.first.should.equal('First message');
      data.second.should.equal('Second message');
      done();
    }
    , function () {
        rq.emit('test:created', { first: 'First message'
                            , second: 'Second message' });
      });
  });

  it('Should only receive messages for his own scope', function (done) {
    var rq = new NodeRedisPubsub(conf)
      , rq2 = new NodeRedisPubsub(conf2)
      ;

    rq.on('thesame', function (data) {
      data.first.should.equal('First message');
      data.second.should.equal('Second message');
      rq2.emit('thesame', { third: 'Third message' });
    }
    , function () {
        rq2.on('thesame', function (data) {
          data.third.should.equal('Third message');   // Tests would fail here if rq2 received message destined to rq
          done();
        }, function () {
          rq.emit('thesame', { first: 'First message'
                             , second: 'Second message' });
        });
      });
  });

  it('Should be able to unsubscribe', function (done) {
    var rq = new NodeRedisPubsub(conf)
      , num = 0;
      ;

    var handler = function (data) {
      data.first.should.equal('Message');
      num++;
      if (num > 1) {
          // Should unsubscribe after two (or more) messages and not call done again
          done();
      }
    };

    rq.on('unsub test', handler
    , function () {
        rq.emit('unsub test', { first: 'Message'},
            function(){
                rq.emit('unsub test', { first: 'Message'},
                    function(){
                        rq.off('unsub test', handler);
                        rq.emit('unsub test', { first: 'Message'});
                    });
            });
      });
  });

  it('Should be able to listen only once', function (done) {
    var rq = new NodeRedisPubsub(conf);

    var handler = function (data) {
      data.first.should.equal('First message');
      done();
    };

    rq.once('once test', handler
    , function () {
        rq.emit('once test', { first: 'First message'},
            function(){
                rq.emit('once test', { first: 'First message'});
            });
      });
  });

  it('Should be able to listen only once with a condition', function (done) {
    var rq = new NodeRedisPubsub(conf);

    var handler = function (data) {
      data.first.should.equal('Two');
      done();
    };

    rq.onceIf('onceIf test', handler, 'first', 'Two'
    , function () {
        rq.emit('onceIf test', { first: 'One'},
            function(){
                rq.emit('onceIf test', { first: 'Two'});
            });
      });
  });

  it('Should give the name of the channel to the message handler', function (done) {
    var rq = new NodeRedisPubsub(conf3);

    rq.on('test_channel:*', function (data, channel) {
        if (channel == 'test_channel:one') {
            data.msg.should.equal('Message One');
            rq.emit('test_channel:two', { msg: 'Message Two' });
        } else if (channel == 'test_channel:two') {
            data.msg.should.equal('Message Two');
            done();
        }
    }
    , function () {
        rq.emit('test_channel:one', { msg: 'Message One' });
    });
  });

});
