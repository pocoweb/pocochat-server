var Storage = require('./store');
var LUISMgr = require('./ai');
var ParseSession = Parse.Object.extend('Messages');

var L_USE_KUE = false;

if (!L_USE_KUE) {
	
	Parse.Cloud.afterSave("Messages", function(request) {
		if (request.object.get('to') === Storage.getAIId()) {
			LUISMgr.requestAsync({
				job: {
					from: request.object.get('from'),
					to: request.object.get('to'),
					msg: request.object.get('msg'),
				},
				callback: function(result) {
					Storage.sendMessage(this.job.to, this.job.from, result.text);
				}
			});
		}
	});
	
} else {
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

	queue.process('PocoChatAI', function(job, done){
		console.log('process job %s', job.id);
		LUISMgr.request({
			job: job,
			done: done,
			callback: function(result) {
				Storage.sendMessage(this.job.to, this.job.from, result.text);
				this.done();
			}
		});
	});
	
	Parse.Cloud.afterSave("Messages", function(request) {
		if (request.object.get('to') === Storage.getAIId()) {
			var job = queue.create('PocoChatAI', {
				from: request.object.get('from'),
				to: request.object.get('to'),
				msg: request.object.get('msg')
			}).save( function(err){
				 if( !err ) console.log( job.id );
			});
		}
	});
	
} 

