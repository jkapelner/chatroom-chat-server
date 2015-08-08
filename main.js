config = require('./config'); //global config variable

var io = require('socket.io')({
	transports: [ // enable all transports (optional if you want flashsocket)
			'websocket'
			, 'htmlfile'
			, 'xhr-polling'
			, 'jsonp-polling'
		]
}).listen(config.web.chat.port);

var storage = require('./lib/storage');
var session = require('./lib/session');


var sendError = function(user_id, type, msg) {
    client.emit(type, msg);
    console.log("user " + user_id.toString() + ' ' + type + ': ' + msg);
};


console.log('chatroom server listening on port ' + config.web.chat.port);

var ioredis = require('socket.io-redis');
io.adapter(ioredis({pubClient: storage.pub, subClient: storage.sub}));
	
//authorize the connection
io.use(function(socket, next) {
	var handshakeData = socket.request;

    session.getUserIdFromPHPSessionCookie(handshakeData.headers.cookie, function(user_id, err) {
        if (user_id) {
            next(); //accept the incoming connection
			console.log('user ' + user_id + ' authenticated.');
        } else {
            next(err || "Socket authentication failed for unknown reason"); //reject the connection
            console.log('connection rejected: ' + err);
        }
    });
});

io.sockets.on('connection', function(client){ //client connection to server
	session.getClientUser(client, function(user, err) {
		if (user) {
			console.log("user " + user.id.toString() + " connected.");
	
			client.on('disconnect', function(){
				//client disconnected
				console.log("user " + user.id.toString() + " disconnected."); //just show a console message, nothing really yet to do for this
			});

			client.on("join_room", function(room) {
				storage.sub.subscribe(room);
				storage.isUserInRoom(room, user, function(err, isInRoom) { //check if user is already in the room
					if (isInRoom) {
						//user is already in the room, so just join the client on the server side, but don't notify other clients
						console.log("user " + user.id.toString() + " rejoined room " + room);
					}
					else {
						//user not in the room, so add them and notify other clients
						storage.addUserToRoom(room, user, function(err, result) {
							if (!err) {
								storage.pub.publish(room, JSON.stringify({msg: 'user_joined', data: user}));
								console.log("user " + user.id.toString() + " joined room " + room);
							}
						});
					}
				});
			});
		 
			client.on("leave_room", function(room) {
				storage.removeUserFromRoom(room, user, function(err, result) {
					if (!err) {
						storage.pub.publish(room, JSON.stringify({msg: 'user_left', data: user}));
						console.log("user " + user.id.toString() + " left room " + room);
					}
				});
			});
		 
			client.on("whos_in_the_room", function(room){
				storage.getUsersInRoom(room, function(err, users) {
					if (!err) {
						client.emit("users_in_room", users); //return the list of users in the room to the client
					}
				});
			});
				
			//post a message to another user in the same room (message is not stored, so it can only be sent in real time to another online user - only use during live chats)
			client.on('post_user_message', function(room, message){
				storage.isUserInRoom(room, user, function(err, isInRoom) {
					if (!err && isInRoom) { //if user is in the room
						storage.pub.publish(room, JSON.stringify({msg: 'on_user_message', data: {user: user, message: message}}));
						console.log("user " + user.id.toString() + " posted a message in room " + room);
					}
				});
			});

			storage.sub.on('message', function (channel, message) {
				var message = JSON.parse(message);
				
				if ((message.msg != 'on_user_message') || (message.data.user.id != user.id)) { //prevent sending posted messages back to the sender (only send to other recipients)
					client.emit(message.msg, message.data);
				}
			});
		}
	});		
});
