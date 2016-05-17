
const KEY_AI_ID = 'PhU3ki2QQV';
const KEY_GROUP_ID = '7SDMDWUPFh';

//local test
//const KEY_AI_ID = '1E5T8KLWbF';
//const KEY_GROUP_ID = 'qjm7IQwids';

var LUISMgr = require('./ai');
var ParseSession = Parse.Object.extend('Messages');

var L_USE_KUE = false;

if (L_USE_KUE) {
	var kue = require('kue');
	var queue = kue.createQueue();

	queue.on('job enqueue', function(id, type){
		console.log( 'Job %s got queued of type %s', id, type );

	}).on('job complete', function(id, result){
		kue.Job.get(id, function(err, job){
			if (err) return;
			job.remove(function(err){
				if (err) throw err;
				console.log('removed completed job #%d', job.id);
			});
		});
	});

	queue.process('ai', function(job, done){
		console.log('process job %s', job.id);
		LUISMgr.request({
			job: job,
			done: done,
			text: job.data.msg,
			callback: function(result) {
				var session = new ParseSession();
				session.save({
					from: this.job.data.to,
					to: this.job.data.from,
					msg: result.text
				}, {
					success: function(data) {
						console.log('send session ok', data);
					},
					error: function(data, error) {
						console.log('send session ng, with error code: ' + error.description);
					}
				});
				this.done();
			}
		});
	});

	function processAIRequest(job) {
		LUISMgr.requestAsync({
			job: job,
			text: job.msg,
			callback: function(result) {
				var session = new ParseSession();
				session.save({
					from: this.job.to,
					to: this.job.from,
					msg: result.text
				}, {
					success: function(data) {
						console.log('send session ok', data);
					},
					error: function(data, error) {
						console.log('send session ng, with error code: ' + error.description);
					}
				});
			}
		});
	}
	
	Parse.Cloud.afterSave("Messages", function(request) {
		if (request.object.get('to') === KEY_AI_ID) {
			var job = queue.create('ai', {
				from: request.object.get('from'),
				to: request.object.get('to'),
				msg: request.object.get('msg')
			}).save( function(err){
				 if( !err ) console.log( job.id );
			});
		}
	});
	
} else { // is use kue
	
	Parse.Cloud.afterSave("Messages", function(request) {
		if (request.object.get('to') === KEY_AI_ID) {
			processAIRequest({
				from: request.object.get('from'),
				to: request.object.get('to'),
				msg: request.object.get('msg')			
			});
		}
	});
}

