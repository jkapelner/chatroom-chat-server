var storage = exports;

var redis = require('redis');
var lodash = require('lodash');

storage.pub = redis.createClient(config.redis.port, config.redis.host);
storage.sub = redis.createClient(config.redis.port, config.redis.host, {detect_buffers: true});
storage.store = redis.createClient(config.redis.port, config.redis.host);

if (config.redis.password) {
    storage.pub.auth(config.redis.password, function(){console.log("adentro! pub")});
    storage.sub.auth(config.redis.password, function(){console.log("adentro! sub")});
    storage.store.auth(config.redis.password, function(){console.log("adentro! store")});
}

storage.getUsersInRoom = function(room, callback) {
    var key = config.roomKey + '_' + room;
	storage.store.hvals(key, function(err, results) {
		var users = [];
		
		if (!err && users) {
			lodash.forEach(results, function(value) {
				users.push(JSON.parse(value));
			});
		}
		
		callback(err, users);
	});
};

storage.addUserToRoom = function(room, user, callback) {
    var key = config.roomKey + '_' + room;
	storage.store.hset(key, user.id, JSON.stringify(user), callback);
};

storage.removeUserFromRoom = function(room, user, callback) {
    var key = config.roomKey + '_' + room;
	storage.store.hdel(key, user.id, callback);
};

storage.isUserInRoom = function(room, user, callback) {
    var key = config.roomKey + '_' + room;
	storage.store.hexists(key, user.id, callback);
};
