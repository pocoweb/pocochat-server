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
	sendMessage: function(from, to, msg) {
		var session = new ParseSession();
		session.save({
			from: from,
			to: to,
			msg: msg
		}, {
			success: function(data) {
				console.log('send session ok', data);
			},
			error: function(data, error) {
				console.log('send session ng, with error code: ' + error.description);
			}
		});
	}
}

/////////////////////////////////////////////////////////////////
// export
/////////////////////////////////////////////////////////////////
module.exports = Storage;