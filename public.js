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
	6: 'Amerish',
	8: 'Esamir'
};

var updateTime = function(){
	var now = Date.now();

	for(var id in worlds){
		var world = worlds[id];
		if(world.active){
			var date = new Date(world.alert.start - now);
			date.setUTCHours(date.getUTCHours() + world.alert.duration);

			var h = date.getUTCHours();
			var m = ('0' + date.getUTCMinutes()).slice(-2);
			var s = ('0' + date.getUTCSeconds()).slice(-2);

			if(h > 2 || (h + +m + +s) < 0){
				world.active = false;
				updateAlert(world);
			} else
				$('#world-' + world.id + ' .state').html(h + ':' + m + ':' + s);
		}
	}
};

var updateDetails = function(id, details){
	var selecter = '#world-' + id + ' .details';
	$(selecter).html('');

	if(!worlds[id].active)
		return;

	if(worlds[id].alert.type == 0){
		$(selecter).append('<div class="bar vs bar-vs-' + id + '" style="width: ' + (216 * details[1]) / 100 + 'px"></div>');
		if(details[1] > 15)
			$('.bar-vs-' + id).append('<span>' + Math.floor(details[1]) + '%</span>');

		$(selecter).append('<div class="bar nc bar-nc-' + id + '" style="width: ' + (216 * details[2]) / 100 + 'px"></div>');
		if(details[2] > 15)
			$('.bar-nc-' + id).append('<span>' + Math.floor(details[2]) + '%</span>');

		$(selecter).append('<div class="bar tr bar-tr-' + id + '" style="width: ' + (216 * details[3]) / 100 + 'px"></div>');
		if(details[3] > 15)
			$('.bar-tr-' + id).append('<span>' + Math.floor(details[3]) + '%</span>');
	} else {
		for(var index = 0; index < details[1].length; index++){
			$(selecter).append('<div class="facility vs facility-vs-' + id + '-' + index + '"></div>');
			$('.facility-vs-' + id + '-' + index).attr('title', details[1][index]);
		}

		for(var index = 0; index < details[2].length; index++){
			$(selecter).append('<div class="facility nc facility-nc-' + id + '-' + index + '"></div>');
			$('.facility-nc-' + id + '-' + index).attr('title', details[2][index]);
		}

		for(var index = 0; index < details[3].length; index++){
			$(selecter).append('<div class="facility tr facility-tr-' + id + '-' + index + '"></div>');
			$('.facility-tr-' + id + '-' + index).attr('title', details[3][index]);
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
