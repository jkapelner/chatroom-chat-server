var lodash = require('lodash');
var path = require('path');
var fs = require('fs');
var local = null;
var env = process.env.NODE_ENV || 'development';
var localConfigPath = './config/' + env + '/config.js';

console.log("config environment = " + env);

if (fs.existsSync(path.resolve(__dirname, localConfigPath))) {
	local = require(localConfigPath);
}

var config = {
    csrfTokenKey: 'ChatroomCsrfToken',
    sessionKey: 'fuelrid',
    roomKey: 'Room',
    web: {
        chat: {
            port: parseInt(process.env.PORT || process.env.NODE_PORT || 8002)
        }
    },
    redis: {
        host: 'localhost',
        port: 6379
    }
};

if (local) {
  config = lodash.merge(config, local); //overwrite default settings with local ones
}

module.exports = config;

