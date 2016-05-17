//const URL_BING = 'https://bingapis.azure-api.net/api/v5/search/?q=';

///////////////////////////////////////////////////////////////////
// common functions
///////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////
// LUIS functions
///////////////////////////////////////////////////////////////////
const URL_LUIS = 'https://api.projectoxford.ai/luis/v1/application?id=c27c4af7-d44a-436f-a081-841bb834fa29&subscription-key=853fd10078354e6a9ba12facbb850996&q=';

const URL_WEATHER = 'http://php.weather.sina.com.cn/xml.php?password=DJOYnieT8234jlsK';

const INTENT_WEATHER = 'builtin.intent.weather.check_weather';
const INTENT_WEATHER_FACTS = 'builtin.intent.weather.check_weather_facts';
const TYPE_WEATHER_DATE = 'builtin.weather.date_range';
const TYPE_WEATHER_LOCA = 'builtin.weather.absolute_location';

const INTENT_ALARM = 'builtin.intent.alarm.set_alarm';
const INTENT_CALENDAR = 'builtin.intent.calendar.create_calendar_entry';
const TYPE_CONTACT = 'builtin.calendar.contact_name';
const TYPE_STARTDATE = 'builtin.calendar.start_date';
const TYPE_STARTTIME = 'builtin.calendar.start_time';
const TYPE_ENDTIME = 'builtin.calendar.end_time';
const TYPE_TITLE = 'builtin.calendar.title';

const INTENT_SEND = 'builtin.intent.communication.send_text';
const TYPE_SENDTO = 'builtin.communication.contact_name';
const TYPE_MESSAGE = 'builtin.communication.message';

const INTENT_NONE = 'builtin.intent.none';

var LUISMgr = {
	requestAsync: function(params) {
		console.log('requestAsync', params);
		sendRequest(encodeURI(URL_LUIS+params.text), this.parseCB, params);
	},
	request: function(params) {
		var text = params.text;
		console.log('LUIS request: ', text);
		sync.block(function() {
			var result = sync.wait(sendRequest(encodeURI(URL_LUIS+text), sync.cb("body")));
			result = LUISMgr.parseCB(result.body, params);
		});
	},
	parseCB: function(data, params) {
		data = JSON.parse(data);
		var resData = {
			text: ''
		}
		
		sync.block(function() {
			var intent = LUISMgr.parseIntents(data);
			if (intent === INTENT_NONE) {
				console.log('none');
				resData.text = '对不起，我不太明白您的意思';

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

			} else if (intent === INTENT_ALARM || intent == INTENT_CALENDAR) {
				console.log('set alarm');
				var reqType = LUISMgr.parseAlarm(data);
				console.log('reqType', reqType);
				resData.text = '收到指令';
				
			} else if (intent === INTENT_SEND) {
				console.log('send message');
				var reqType = LUISMgr.parseSendMessage(data);
				resData.text = '收到指令';
				
			} else {
				console.log('unknown');
				resData.text = '对不起，这个功能暂时还没有开放';
			}
			console.log('resData', resData);
			
			params.callback(resData);
		});
	},
	parseIntents: function(data) {
		//for demo, only support one intent
		return data.intents[0].intent;
	},
	parseWeather: function(data) {
		var reqType = {
			dateNum: null,
			city: null
		};
		for (var i=0; i<data.entities.length; i++) {
			var item = data.entities[i];
			if (item.type == TYPE_WEATHER_DATE) {
				var dstDate = new Date(item.resolution.date);
				
				var curDate = new Date();
				dstDate.setHours(curDate.getHours());
				dstDate.setMinutes(curDate.getMinutes());
				dstDate.setSeconds(curDate.getSeconds());
				dstDate.setMilliseconds(curDate.getMilliseconds());
				reqType.dateNum = (dstDate - curDate) / 86400000;
			} else if (item.type == TYPE_WEATHER_LOCA) {
				reqType.city = item.entity;
			}
		}
		return reqType;
	},
	parseWeatherXML: function(result) {
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
		return text;
	},
	parseAlarm: function(data) {
		var reqType = {
			title: null,
			contact: null,
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
		
		if (reqType.title == null) {
			reqType.title = data.query;
		}
		return reqType;
	},
	parseSendMessage: function(data) {
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
		return reqType;
	}
	
}

var TodoList = {
	data: {	
	},
	addTodo(date) {
		
	}
}

///////////////////////////////////////////////////////////////////
// main
///////////////////////////////////////////////////////////////////
//var result = null;
//LUISMgr.request('明天北京的天气怎么样');
//LUISMgr.request('告诉孙立文，明天上午九点到十一点开会');
//result = LUISMgr.request('明天中午十二点和同学聚餐');
//LUISMgr.request('今天有什么体育新闻？');
//console.log(result);

///////////////////////////////////////////////////////////////////
// export
///////////////////////////////////////////////////////////////////
module.exports = LUISMgr;