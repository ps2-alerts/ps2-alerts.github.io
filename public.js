var worlds, init;

var worldNames = {
	1: 'Connery',
	9: 'Woodman',
	10: 'Miller',
	11: 'Ceres',
	13: 'Cobalt',
	17: 'Emerald',
	25: 'Briggs'
};

var eventNames = {
	0: 'Territory',
	2: 'Amp Stations',
	3: 'Biolabs',
	4: 'Tech Plants'
};

var zoneNames = {
	2: 'Indar',
	4: 'Hossin',
	6: 'Amerish',
	8: 'Esamir'
};

var factionAbbrevs = [
	'vs',
	'nc',
	'tr'
];

var facilityNames = {
	// Indar
	2105: 'Peris',
	2107: 'Dahaka',
	2109: 'Zurvan',
	2103: 'Allatum',
	2104: 'Saurva',
	2106: 'Rashnu',
	2101: 'Hvar',
	2102: 'Mao',
	2108: 'Tawrich',

	// Hossin
	4140: 'Naum',
	4150: 'Hurakan',
	4160: 'Ixtab',
	4170: 'Acan',
	4180: 'Bitol',
	4190: 'Zotz',
	4200: 'Ghanan',
	4210: 'Mulac',
	4220: 'Chac',

	// Amerish
	6101: 'Kwahtee',
	6111: 'Sungrey',
	6121: 'Wokuk',
	6102: 'Ikanam',
	6113: 'Onatha',
	6123: 'Xelas',
	6103: 'Heyoka',
	6112: 'Mekala',
	6122: 'Tumas',

	// Esamir
	18023: 'Elli',
	18024: 'Freyr',
	18027: 'Nott',
	18022: 'Andvari',
	18026: 'Mani',
	18028: 'Ymir',
	18025: 'Eisa'
};

var updateTime = function(){
	var now = Date.now();

	for(var id in worlds){
		var alert = worlds[id].alert;
		if(alert.active){
			var date = new Date(alert.start - now);
			date.setUTCHours(date.getUTCHours() + alert.duration);

			var h = date.getUTCHours();
			var m = ('0' + date.getUTCMinutes()).slice(-2);
			var s = ('0' + date.getUTCSeconds()).slice(-2);

			if(h > 2 || (h + +m + +s) < 0){
				alert.active = false;
				updateAlert(id, alert);
			} else
				$('#world-' + id + ' .state').html(h + ':' + m + ':' + s);
		}
	}
};

var updateDetails = function(id, details){
	var field = $('#world-' + id + ' .details');
	field.html('');

	var alert = worlds[id].alert;
	if(!alert.active)
		return;

	if(!alert.type){
		var total = details[1].length + details[2].length + details[3].length;
		for(var factionId in details){
			var percentage = (details[factionId].length / total) * 100;

			$('<div></div>', {
				class: factionAbbrevs[factionId - 1],
				'data-title': Math.floor(percentage) + '%'
			}).css('width', (216 * percentage) / 100 + 'px').appendTo(field);
		}
	} else {
		for(var factionId in details){
			var regions = details[factionId];
			for(var regionId = 0; regionId < regions.length; regionId++){
				var region = regions[regionId];

				$('<div></div>', {
					class: factionAbbrevs[factionId - 1],
					'data-title': facilityNames[region]
				}).css({
					'background-image': 'url(images/' + alert.type + '-' + factionId + '.png)'
				}).appendTo(field);
			}
		}
	}
};

var updateState = function(id){
	var state = worlds[id].state;
	state = state == 'online' ? 'no alert' : state;

	$('#world-' + id + ' .state').html(state.charAt(0).toUpperCase() + state.slice(1));
}

var updateAlert = function(id, alert){
	var schema = '#world-' + id;
	if(alert.active){
		$(schema).addClass('active');
		$(schema).addClass(eventNames[alert.type].toLowerCase().replace(' ', ''));
		$(schema + ' .state').html('Active alert!');
		$(schema + ' .type').html(eventNames[alert.type]);
		$(schema + ' .zone').html(zoneNames[alert.zone]);

		updateTime();
	} else {
		$(schema).removeClass();
		$(schema + ' .type').html('');
		$(schema + ' .zone').html('');
		$(schema + ' .details').html('');

		updateState(id);
	}
};

var processData = function(data){
	if(data.worlds){
		worlds = data.worlds;

		if(!init){
			init = true;

			var array = [];
			for(var id in worlds)
				array.push({name: worldNames[id], id: id});

			array.sort(function(a, b){
				return a.name > b.name;
			});

			for(var index in array){
				var item = array[index];
				$('table').append('<tr id="world-' + item.id + '"></tr>');
				$('tr:last').append('<td>' + item.name + '</td>');
				$('tr:last').append('<td class="state"></td>');
				$('tr:last').append('<td class="type"></td>');
				$('tr:last').append('<td class="zone"></td>');
				$('tr:last').append('<td class="details"></td>');

				var world = worlds[item.id];
				updateAlert(item.id, world.alert);

				if(world.alert.active)
					updateDetails(item.id, world.details);
			}
		} else {
			for(var id in worlds){
				var world = worlds[id];
				updateAlert(id, world.alert);

				if(world.alert.active)
					updateDetails(id, world.details);
			}
		}
	} else if(data.state){
		worlds[data.id].state = data.state;
		updateState(data.id);
	} else if(data.alert){
		worlds[data.id].alert = data.alert;
		updateAlert(data.id, data.alert);
	} else if(data.details)
		updateDetails(data.id, data.details);
};

var interval;
var connect = function(url){
	var socket = new WebSocket(url);
	socket.onmessage = function(event){
		if(event.data == 'ping')
			socket.send('pong');
		else
			processData(JSON.parse(event.data));
	}

	socket.onopen = function(){
		if(interval){
			clearInterval(interval);
			interval = null;
		}
	}

	socket.onclose = function(){
		if(!interval){
			interval = setInterval(function(){
				connect(url);
			}, 15000);
		}
	}
};

$(document).ready(function(){
	if('WebSocket' in window){
		setInterval(updateTime, 1000);
		connect('ws://ps2-alerts.herokuapp.com');
	} else
		$('body').html('<h1>Your browser is too old!</h1>');
});
