////////////////////////////////////////////////////////////////
// Usage
////////////////////////////////////////////////////////////////
//明天北京的天气怎么样
//告诉孙立文，明天上午九点到十一点开会
//明天中午十二点和同学聚餐
//今天有什么体育新闻（娱乐、国际、科技、政治）
//告诉黄涵，明天去上海
//明天去上海

////////////////////////////////////////////////////////////////
// common functions
////////////////////////////////////////////////////////////////
var Storage = require('./store');
var request = require('request');
var sync = require('simplesync');
var xmlParseString = require('xml2js').parseString;

function sendRequest(url, callback, params) {
	console.log(url);
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log('ok');
			callback(body, params);
		} else {
			console.log('ng', body);
		}
	});
}

function Trim(str, is_global) {
	return str.replace(/(^\s+)|(\s+$)/g, "");
}

function TrimAll(str) {
	return str.replace(/\s/g, "");
}

function GetTimeStr(date) {
	var str = (date.getMonth()+1) + '月' + date.getDate() + '日 ' + date.getHours() + ':';
	str += (date.getMinutes() > 9) ? date.getMinutes() : ('0'+date.getMinutes());
	return str;
}

function GetDateStr(date) {
	return (date.getMonth()+1) + '月' + date.getDate() + '日 ';
}

////////////////////////////////////////////////////
var iconv = require('iconv-lite');

function chinese2Gb2312_pad (number, length, pos) {
	var str = '' + number;
	while (str.length < length) {
		//向右边补0
		if ('r' == pos) {
			str = str + '0';
		} else {
			str = '0' + str;
		}
	}
	return str;
}
function chinese2Gb2312_toHex (chr, padLen) {
	if (null == padLen) {
		padLen = 2;
	}
	return chinese2Gb2312_pad(chr.toString(16), padLen);
}
function chinese2Gb2312(data) {
	var gb2312 = iconv.encode(data.toString('UCS2'), 'GB2312');
	var gb2312Hex = '';
	for (var i = 0; i < gb2312.length; ++i) {
		gb2312Hex += '%';
		gb2312Hex += chinese2Gb2312_toHex(gb2312[i]);
	}
	return gb2312Hex;
}

////////////////////////////////////////////////////////////////
// LUIS functions
////////////////////////////////////////////////////////////////
const URL_LUIS = 'https://api.projectoxford.ai/luis/v1/application?id=c27c4af7-d44a-436f-a081-841bb834fa29&subscription-key=853fd10078354e6a9ba12facbb850996&q=';

//const URL_LUIS = 'https://api.projectoxford.ai/luis/v1/application?id=94027f50-2ec8-460c-b702-2f239ff98cb6&subscription-key=853fd10078354e6a9ba12facbb850996&q=';

const URL_NEWS = 'https://bingapis.azure-api.net/api/v5/news/?mkt=zh-cn&count=10';
const PARAM_NEWS_CATG = '&Category=';

const URL_WEATHER = 'http://php.weather.sina.com.cn/xml.php?password=DJOYnieT8234jlsK';

const INTENT_WEATHER = 'builtin.intent.weather.check_weather';
const INTENT_WEATHER_FACTS = 'builtin.intent.weather.check_weather_facts';
const TYPE_WEATHER_DATE = 'builtin.weather.date_range';
const TYPE_WEATHER_LOCA = 'builtin.weather.absolute_location';

const INTENT_ALARM = 'builtin.intent.alarm.set_alarm';
const INTENT_CALENDAR = 'builtin.intent.calendar.create_calendar_entry';
const INTENT_CALENDAR_CHECK = 'builtin.intent.calendar.check_availability';
const TYPE_CONTACT = 'builtin.calendar.contact_name';
const TYPE_STARTDATE = 'builtin.calendar.start_date';
const TYPE_STARTTIME = 'builtin.calendar.start_time';
const TYPE_ENDTIME = 'builtin.calendar.end_time';
const TYPE_TITLE = 'builtin.calendar.title';

const INTENT_SEND = 'builtin.intent.communication.send_text';
const TYPE_SENDTO = 'builtin.communication.contact_name';
const TYPE_MESSAGE = 'builtin.communication.message';

const INTENT_PLACE = 'builtin.intent.places.get_route';
const TYPE_PLACE_NAME = 'builtin.places.place_name';
const TYPE_PLACE_DATE = 'builtin.places.date';
const TYPE_PLACE_LOAC = 'builtin.places.absolute_location';

const INTENT_NONE = 'builtin.intent.none';

var LUISMgr = {
	requestAsync: function(params) {
		console.log('requestAsync', params);
		sendRequest(encodeURI(URL_LUIS+params.job.msg), this.parseCB, params);
	},
	request: function(params) {
		var text = params.job.msg;
		console.log('LUIS request: ', text);
		sync.block(function() {
			var result = sync.wait(sendRequest(encodeURI(URL_LUIS+text), sync.cb("body")));
			result = LUISMgr.parseCB(result.body, params);
		});
	},
	parseCB: function(data, params) {
		console.log('parseCB', data);
		data = JSON.parse(data);
		var resData = {
			text: ''
		}
		
		sync.block(function() {
			var intent = LUISMgr.parseIntents(data);
			if (intent === INTENT_NONE) {
				var reqType = LUISMgr.parseNewsIntent(data);
				if (reqType.isNews) {
					var url = URL_NEWS;
					if (reqType.category != null) {
						url += PARAM_NEWS_CATG;
						url += reqType.category;
					}
					var options = {
						url: url,
						headers: {
							'Ocp-Apim-Subscription-Key': '4128a206b0fe4296a802a88fd937c865'
						}
					};
					var result = sync.wait(sendRequest(options, sync.cb("body")));
					resData.text = LUISMgr.parseNewsResp(result.body);
					
				} else {
					console.log('none');
					resData.text = '对不起，我不太明白您的意思';	
				}
				params.callback(resData);

			} else if (intent === INTENT_WEATHER || intent == INTENT_WEATHER_FACTS) {
				console.log('weather');
				var reqType = LUISMgr.parseWeather(data);
				console.log('reqType', reqType);

				if (reqType.dateNum == null) {
					resData.text = '天气千变万化，您想查询哪一天的天气呢？';
				} else if (reqType.city == null) {
					resData.text = '天气千变万化，您想查询哪个城市的天气呢？';
				} else if (reqType.dateNum < 0 || reqType.dateNum > 2) {
					resData.text = '不好意思，我暂时还不知道这一天的天气情况';
				} else {					
					var url = URL_WEATHER + '&day=' + reqType.dateNum + '&city=' + chinese2Gb2312(reqType.city);
					var result = sync.wait(sendRequest(url, sync.cb("body")));
					result = sync.wait(xmlParseString(result.body, sync.cb("err", "json")));
					resData.text = LUISMgr.parseWeatherXML(result.json);
				}
				params.callback(resData);

			} else if (intent === INTENT_ALARM || intent == INTENT_CALENDAR || intent === INTENT_CALENDAR_CHECK) {
				console.log('set alarm');
				LUISMgr.parseAlarm(params, data);
				
			} else if (intent === INTENT_SEND) {
				console.log('send message');
				LUISMgr.parseSendMessage(params, data);
				
			} else if (intent === INTENT_PLACE) {
				console.log('place message');
				LUISMgr.parsePlace(params, data);
				
			} else {
				console.log('unknown');
				resData.text = '对不起，这个功能暂时还没有开放';
				params.callback(resData);
			}
			console.log('resData', resData);

		});
	},
	parseIntents: function(data) {
		//for demo, only support one intent
		return data.intents[0].intent;
	},
	parseNewsIntent: function(data) {
		var reqType = {
			isNews: false,
			category: null
		}
		if( data.query.indexOf("新闻") >= 0 ) {
			reqType.isNews = true;
			
			if (data.query.indexOf("娱乐") >= 0) {
				reqType.category = 'Entertainment';
			} else if (data.query.indexOf("商业") >= 0 
								 || data.query.indexOf("商务") >= 0 
								 || data.query.indexOf("经济") >= 0) {
				reqType.category = 'Business';
			} else if (data.query.indexOf("政治") >= 0) {
				reqType.category = 'Politics';
			} else if (data.query.indexOf("科技") >= 0
								|| data.query.indexOf("技术") >= 0
								|| data.query.indexOf("科学") >= 0) {
				reqType.category = 'ScienceAndTechnology';
			} else if (data.query.indexOf("体育") >= 0) {
				reqType.category = 'Sports';
			} else if (data.query.indexOf("国际") >= 0) {
				reqType.category = 'World';
			} 
		}
		return reqType;
	},
	parseNewsResp: function(data) {
		data = JSON.parse(data);
		/*
		var ret = {
			type: 'news',
			infos: []
		};
		for (var i=0; i<data.value.length; i++) {
			var item = data.value[i];
			ret.infos.push({
				name: item.name,
				url: item.url,
				datePublished: item.datePublished
			});
		}
		return JSON.stringify(ret);
		*/
		
		var ret = '';
		for (var i=0; i<data.value.length; i++) {
			ret += (i+1) + '. ' + data.value[i].name + '; ';
		}
		return ret;
	},
	getWeatherDateNum: function(dstDate) {
		var curDate = new Date();
		dstDate.setHours(curDate.getHours());
		dstDate.setMinutes(curDate.getMinutes());
		dstDate.setSeconds(curDate.getSeconds());
		dstDate.setMilliseconds(curDate.getMilliseconds());
		return (dstDate - curDate) / 86400000;
	},
	parseWeather: function(data) {
		var reqType = {
			dateNum: null,
			city: null
		};
		for (var i=0; i<data.entities.length; i++) {
			var item = data.entities[i];
			if (item.type == TYPE_WEATHER_DATE) {
				reqType.dateNum = getWeatherDateNum(new Date(item.resolution.date));
			} else if (item.type == TYPE_WEATHER_LOCA) {
				reqType.city = item.entity;
			}
		}
		return reqType;
	},
	parseWeatherXML: function(result) {
		if (result.Profiles.Weather !== undefined && result.Profiles.Weather.length > 0) {
			var info = result.Profiles.Weather[0];
			var text = info.city[0];
			text = text + ',' + info.savedate_weather[0];
			text = text + ',' + info.status1[0];
			if (info.status1[0] != info.status2[0]) {
				text = text + '到' + info.status2[0];
			}
			text = text + ',' + info.direction1[0];
			text = text + ',' + info.power1[0] + '级';
			text = text + ',' + info.temperature1[0];
			text = text + '到' + info.temperature2[0] + '度';
			if (info.chy_shuoming[0] != '') {
				text = text + ',穿衣指数: ' + info.chy_shuoming[0];
			}
			text = text + ',更新时间' + info.udatetime[0];
		} else {
			text = '不好意思，暂时还没有这个的天气信息';
		}
		return text;
	},
	parseAlarm: function(params, data) {
		var reqType = {
			query: data.query,
			title: null,
			contact: '',
			startdate: null,
			enddate: null
		};
		
		for (var i=0; i<data.entities.length; i++) {
			var item = data.entities[i];
			if (item.type == TYPE_CONTACT) {
				reqType.contact = TrimAll(item.entity);
				
			} else if (item.type == TYPE_STARTDATE) {
				reqType.startdate = new Date(item.resolution.date);
				
			} else if (item.type == TYPE_STARTTIME) {
				var time = item.resolution.time;
				time = time.substr(time.indexOf('T')+1);
				if (reqType.startdate == null) {
					reqType.startdate = new Date();
					reqType.startdate.setMinutes(0);
					reqType.startdate.setSeconds(0);
					reqType.startdate.setMilliseconds(0);
				}
				reqType.startdate.setHours(parseInt(time));
				
			} else if (item.type == TYPE_ENDTIME) {
				var time = item.resolution.time;
				if (reqType.enddate == null) {
					reqType.enddate = new Date(reqType.startdate);
				}
				time = time.substr(time.indexOf('T')+1);
				reqType.enddate.setHours(parseInt(time));
				
			} else if (item.type == TYPE_TITLE) {
				reqType.title = TrimAll(item.entity);
			}
		}
		
		if (reqType.title === null) {
			reqType.title = data.query;
		}
		this.transMessage(params, reqType, true);
		return reqType;
	},
	parseSendMessage: function(params, data) {
		var reqType = {
			contact: null,
			message: null
		};
		for (var i=0; i<data.entities.length; i++) {
			var item = data.entities[i];
			if (item.type == TYPE_SENDTO) {
				reqType.contact = TrimAll(item.entity);
			} else if (item.type == TYPE_MESSAGE) {
				reqType.message = TrimAll(item.entity);
			}
		}
		if (reqType.contact !== null) {
			this.transMessage(params, reqType, false);
		} else {
			params.callback({text: '对不起，这个功能暂时还没有开放'});
		}
	},
	parsePlace: function(params, data) {
		var reqType = {
			contact: null,
			date: null,
			location: null,
			message: null
		};
		for (var i=0; i<data.entities.length; i++) {
			var item = data.entities[i];
			if (item.type == TYPE_PLACE_NAME) {
				reqType.contact = TrimAll(item.entity);
			} else if (item.type == TYPE_PLACE_DATE) {
				reqType.date = new Date(item.resolution.date);
			} else if (item.type == TYPE_PLACE_LOAC) {
				reqType.location = TrimAll(item.entity);
			}
		}
		
		sync.block(function() {
			reqType.message = '您的预定行程：';
			if (reqType.date !== null) {
				reqType.message += GetDateStr(reqType.date);
			}
			if (reqType.location !== null) {
				reqType.message += '，前往：' + reqType.location;
			}
			if (reqType.date !== null && reqType.location !== null) {
				var url = URL_WEATHER + '&day=' + LUISMgr.getWeatherDateNum(reqType.date) + '&city=' + chinese2Gb2312(reqType.location);
				var result = sync.wait(sendRequest(url, sync.cb("body")));
				result = sync.wait(xmlParseString(result.body, sync.cb("err", "json")));
				reqType.message += '，当地天气情况：' +  LUISMgr.parseWeatherXML(result.json);
			}
			
			if (reqType.location === null) {
				params.callback({text: '对不起，这个功能暂时还没有开放'});
			} else if (reqType.contact !== null) {
				LUISMgr.transMessage(params, reqType, false);
			} else {
				params.callback({text: reqType.message});
			}
		});
	},
	transMessage: function(params, reqType, isAlarm) {
		Storage.getUserById(params.job.from).then(function(users) {
			if (users.length == 1) {
				var fromUserName = users[0].get('username');
				if (isAlarm) {
					if (reqType.contact === '') {
						reqType.message = '您设定了一个定时任务，';
					} else {
						reqType.message = fromUserName + '给您设定了一个定时任务，';
					}
					if (reqType.startdate) {
						reqType.message += GetTimeStr(reqType.startdate);
					}
					if (reqType.enddate) {
						reqType.message += ' 到 ' + GetTimeStr(reqType.enddate);
					}
					if (reqType.message.length > 0) {
						reqType.message += '， ';
					}
					reqType.message += '原话是：【' + reqType.query + '】';
					
				} else {
					reqType.message = fromUserName + '让我告诉您，' + reqType.message;	
				}
			}
			return Storage.getUserByName(reqType.contact);
		}).then(function(users) {
			console.log('get user ok', users);
			if (isAlarm && reqType.contact === '') {
				params.callback({text: reqType.message});
				TodoList.addTodo(params, reqType);
				
			} else if (users.length === 1) {
				params.callback({text: '好的，您的要求我知道啦'});
				Storage.sendMessage(params.job.to, users[0].id, reqType.message, true);
				if (isAlarm) {
					TodoList.addTodo(params, reqType);
				}
				
			} else {
				params.callback({text: '对不起，这个功能暂时还没有开放'});
			}
		}, function(error) {
			console.log('get user ng', error);
			params.callback({text: '对不起，这个功能暂时还没有开放'});
		});
	}
	
}

var TodoList = {
	addTodo(params, mission) {
		if (mission.contact !== '') {
			Storage.getUserByName(mission.contact).then(function(users) {
				console.log('addTodo get user ok', users);
				if (users.length == 1) {
					Storage.addAITodo({
						done: false,
						to: users[0].id,
						msg: mission.message,
						startdate: mission.startdate
					});
				}
			}, function(error) {
				console.log('addTodo get user ng', error);
			});
		} else {
			Storage.addAITodo({
				done: false,
				to: params.job.from,
				msg: mission.message,
				startdate: mission.startdate
			});
		}
	},
	process() {
		Storage.getAITodo().then(function(todos) {
			console.log('get AI todo ok', todos.length);
			for (var i=0; i<todos.length; i++) {
				var item = todos[i];
				var currentDate = new Date();
				if (item.get('startdate').getTime() - currentDate.getTime() < 1800000) 
				{
					Storage.sendMessage(Storage.getAIId(), item.get('to'), '【定时提醒】 ' + item.get('msg'), true);
                    item.set('done', true);
					Storage.setAITodo(item);
				}
			}
		}, function(error) {
			console.log('get AI todo ng', error);
		})
	}
}
setInterval(TodoList.process, 10000); 

////////////////////////////////////////////////////////////////
// export
////////////////////////////////////////////////////////////////
module.exports = LUISMgr;