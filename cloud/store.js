var ParseSession = Parse.Object.extend('Messages');

var Storage = {
	getAIId: function() {
		//return 'PhU3ki2QQV';
		return '1E5T8KLWbF'; 
	},
	getGroupId: function() {
		//return '7SDMDWUPFh';
		return 'qjm7IQwids'; 
	},
	sendMessage: function(from, to, msg, notify) {
		console.log('send message', from, to, msg, notify);
		var session = new ParseSession();
		session.save({
			from: from,
			to: to,
			msg: msg,
			notify: (notify != null) ? notify : false
		}, {
			success: function(data) {
				console.log('send session ok', data.get('msg'));
			},
			error: function(data, error) {
				console.log('send session ng, with error code: ' + error.description);
			}
		});
	},
	getUserById: function(id) {
		console.log('getUserById', id);
		var userQuery = new Parse.Query('User');
		userQuery.equalTo('objectId', id);
		return userQuery.find();
	},
	getUserByName: function(name) {
		console.log('getUserByName', name);
		var userQuery = new Parse.Query('User');
		userQuery.equalTo('username', name);
		return userQuery.find();
	}
}

////////////////////////////////////////////////////////////////
// export
////////////////////////////////////////////////////////////////
module.exports = Storage;