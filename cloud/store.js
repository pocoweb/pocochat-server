var ParseSession = Parse.Object.extend('Messages');
var ParseAITodos = Parse.Object.extend('AITodos');

var L_IS_DEBUG = false;

var Storage = {
	getAIId: function() {
        return L_IS_DEBUG ? '1E5T8KLWbF' : 'kEuEOeRLL8';
	},
	getGroupId: function() {
        return L_IS_DEBUG ? 'qjm7IQwids' : 'rtJkLAuZU9';
	},
	sendMessage: function(from, to, msg, notify) {
		console.log('send message', from, to, msg, notify);
		var session = new ParseSession();
		session.save({
			from: from,
			to: to,
			msg: msg,
			notify: (notify != undefined) ? notify : false
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
	},
	addAITodo: function(obj) {
		console.log('add AI todo', obj);
		var todo = new ParseAITodos();
		todo.save(obj, {
			success: function(data) {
				console.log('add AI todo ok');
			},
			error: function(data, error) {
				console.log('add AI todo ng, with error code: ' + error.description);
			}
		});
	},
	setAITodo: function(obj) {
		console.log('set AI todo', obj);
		obj.save();
	},
	getAITodo: function() {
		console.log('getAITodo');
		var query = new Parse.Query(ParseAITodos);
		query.equalTo('done', false);
		return query.find();
	}
}

////////////////////////////////////////////////////////////////
// export
////////////////////////////////////////////////////////////////
module.exports = Storage;