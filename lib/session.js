var session = exports;

var unserialize = require('./unserialize');
var cookie = require('express/node_modules/cookie');
var storage = require('./storage');

session.getUserFromPHPSessionCookie = function(session_cookie, callback) {
    if (session_cookie) {
        // if there is, parse the cookie
        var cookies = cookie.parse(session_cookie);

        if (cookies[config.sessionKey]) {
            var session_data = cookies[config.sessionKey];

            if (session_data) {
                var session_key = unserialize(session_data);

                storage.store.get(session_key[0], function(err, data){
					if (data) {
						var session_data = unserialize(data);

						if (session_data && session_data[0] && (session_data[0]['session_id'] == session_key[0]) && session_data[1] && session_data[1]['warden']) {
							if (session_data[1].warden.user && session_data[1].warden.user.id) {
								callback(session_data[1].warden.user, null);
							}
							else {
								callback(null, err ? err : 'Invalid session.');
							}
						}
						else {
							callback(null, err ? err : 'Invalid session.');
						}
					}
					else {
						callback(null, err ? err : 'Invalid session.');
					}
                });
            }
            else {
                callback(0, 'Invalid session.');
            }
        }
        else {
            callback(0, 'Invalid session.');
        } 
    }
    else {
        callback(0, 'Invalid session.');
    }   
};

session.getUserIdFromPHPSessionCookie = function(session_cookie, callback) {
    session.getUserFromPHPSessionCookie(session_cookie, function(user, err) {
        if (user) {
            callback(user.id, err);
        }
        else {
            callback(0, err ? err : 'Invalid session');
        }
    });
};

session.getClientUserId = function(client, callback) {
    session.getUserIdFromPHPSessionCookie(client.request.headers.cookie, function(user_id, err) {
        callback(user_id, err);
    });
};

session.getClientUser = function(client, callback) {
    session.getUserFromPHPSessionCookie(client.request.headers.cookie, function(user, err) {
        callback(user, err);
    });
};
