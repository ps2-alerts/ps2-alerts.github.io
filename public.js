var worlds = {};

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
			} else {
				$('#world-' + world.id + ' .state').html(h + ':' + m + ':' + s);
			}
		}
	}
}

var updateAlert = function(world){
	var row = '#world-' + world.id;
	if(world.active){
		$(row).addClass('active');
		$(row + ' .type').html(world.alert.eventName);
		$(row + ' .zone').html(world.alert.zoneName);
		$(row + ' .state').html('Active alert!');

		updateTime();
	} else {
		var state = world.state == 'online' ? 'no alert' : world.state;

		$(row).removeClass();
		$(row + ' .type').html('');
		$(row + ' .zone').html('');
		$(row + ' .details').html('');
		$(row + ' .state').html(state.charAt(0).toUpperCase() + state.slice(1));
	}
}

var updateDetails = function(id, details){
	var selecter = '#world-' + id + ' .details';
	$(selecter).html('');

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
}

$(document).ready(function(){
	var socket = new WebSocket(location.origin.replace(/^http/, 'ws'));
	socket.onmessage = function(event){
		var data = JSON.parse(event.data);
		if(data.ping){
			socket.send('pong');
		} else if(data.init){
			worlds = data.worlds;

			var array = [];
			for(var index in data.worlds){
				array.push(data.worlds[index]);
			}

			array.sort(function(a, b){
				return a.name > b.name;
			});

			for(var index = 0; index < array.length; index++){
				var world = array[index];
				$('table').append('<tr id="world-' + world.id + '"></tr>');
				$('tr:last').append('<td>' + world.name + '</td>');
				$('tr:last').append('<td class="state"></td>');
				$('tr:last').append('<td class="type"></td>');
				$('tr:last').append('<td class="zone"></td>');
				$('tr:last').append('<td class="details"></td>');

				updateAlert(world);

				if(world.active)
					updateDetails(world.id, world.details);
			}

			array.length = 0;
		} else if(data.world){
			worlds[data.world.id] = data.world;
			updateAlert(data.world);
		} else if(data.details){
			updateDetails(data.id, data.details);
		}
	}

	setInterval(updateTime, 1000);
});
