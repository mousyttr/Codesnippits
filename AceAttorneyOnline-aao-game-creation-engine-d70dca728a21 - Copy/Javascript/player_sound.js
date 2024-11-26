"use strict";
/*
Ace Attorney Online - Player sound loader

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'player_sound',
	dependencies : ['trial', 'frame_data', 'sound-howler', 'loading_bar', 'language'],
	init : function()
	{
		if(trial_data)
		{
			// If there is data to preload...
			
			// Set preload object
			var loading_screen = document.getElementById('screen-loading');
			var sounds_loading_label = document.createElement('p');
			sounds_loading_label.setAttribute('data-locale-content', 'loading_sounds');
			loading_screen.appendChild(sounds_loading_label);
			var sounds_loading = new LoadingBar();
			loading_screen.appendChild(sounds_loading.element);
			translateNode(sounds_loading_label);
			
			// Load all music files
			for(var i = 1; i < trial_data.music.length; i++)
			{
				sounds_loading.addOne();
				var music_id = 'music_' + trial_data.music[i].id;
				SoundHowler.registerSound(music_id, {
					url: getMusicUrl(trial_data.music[i]),
					onload: sounds_loading.loadedOne,
					onloaderror: sounds_loading.failedOne,
					loop: {
						start: trial_data.music[i].loop_start
					},
					volume: trial_data.music[i].volume
				});
			}
			
			// Load all sound files
			for(var i = 1; i < trial_data.sounds.length; i++)
			{
				sounds_loading.addOne();
				var sound_id = 'sound_' + trial_data.sounds[i].id;
				SoundHowler.registerSound(sound_id, {
					url: getSoundUrl(trial_data.sounds[i]),
					onload: sounds_loading.loadedOne,
					onloaderror: sounds_loading.failedOne,
					volume: trial_data.sounds[i].volume
				});
			}
			
			// Load all voices
			for(var i = 1; i <= 3; i++)
			{
				sounds_loading.addOne();
				var voice_id = 'voice_-' + i;
				SoundHowler.registerSound(voice_id, {
					urls: getVoiceUrls(-i),
					loop: false,
					onload: sounds_loading.loadedOne,
					onloaderror: sounds_loading.failedOne,
					volume: 70
				});
			}
		}
	}
}));

//INDEPENDENT INSTRUCTIONS
var current_music_id;

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
function playSound(sound_id)
{
	SoundHowler.playSound('sound_' + sound_id);
}

function playMusic(music_id)
{
	if(current_music_id != music_id)
	{
		stopMusic();
		var howler_id = 'music_' + music_id;
		// Reset the volume, if a fade changed it.
		SoundHowler.setSoundVolume(howler_id, getRowById('music', music_id).volume);
		SoundHowler.playSound(howler_id);
		current_music_id = music_id;
	}
}

function crossfadeMusic(to_music_id, same_position, to_volume, duration)
{
	if(current_music_id == to_music_id)
	{
		// All we need is to adjust the volume.
		fadeMusic(to_volume, duration);
	}

	else if(current_music_id == MUSIC_STOP)
	{
		// Fade into having music.
		current_music_id = to_music_id;
		SoundHowler.setSoundVolume('music_' + to_music_id, 0);
		SoundHowler.playSound('music_' + to_music_id);
		fadeMusic(to_volume, duration);
	}

	else
	{
		// Fade from track to another.
		var prev_music_id = current_music_id;

		var current_music_obj = SoundHowler.getSoundById('music_' + current_music_id);
		var to_music_obj = SoundHowler.getSoundById('music_' + to_music_id);

		if(!to_music_obj.playing()) 
		{
			to_music_obj.volume(0);
		}

		SoundHowler.fadeSound('music_' + prev_music_id, duration, 0, function()
		{
			SoundHowler.stopSound('music_' + prev_music_id);
		});

		if(same_position) 
		{
			var newPosition = current_music_obj.seek() % to_music_obj.duration();
			var playFromLoop = (to_music_obj._sprite.loop) && (newPosition * 1000 >= to_music_obj._sprite.loop[0]);

			SoundHowler.playSound('music_' + to_music_id, playFromLoop);
			to_music_obj.seek(newPosition);
		}
		else {
			SoundHowler.playSound('music_' + to_music_id);
		}

		var base_volume = getRowById('music', to_music_id).volume;
		var end_volume = base_volume * (to_volume / 100);
		SoundHowler.fadeSound('music_' + to_music_id, duration, end_volume);

		current_music_id = to_music_id;
	}
}

function fadeMusic(to_volume, duration, callback)
{
	if(current_music_id && current_music_id != MUSIC_STOP)
	{
		var base_volume = getRowById('music', current_music_id).volume;
		var end_volume = base_volume * (to_volume / 100);
		SoundHowler.fadeSound('music_' + current_music_id, duration, end_volume, callback);
	}
}

function stopMusic()
{
	SoundHowler.stopSound('music_' + current_music_id);
	current_music_id = MUSIC_STOP;
}

// All "sound player" functions are needed for a minimalist music player.
// Currently, this is needed for audio evidence in the Court Record.
function updateSoundPlayerProgress(sound) {
	position_bar.max = sound.duration();
	position_bar.value = sound.seek();
}

function createSoundPlayer(url, sound_id)
{
	var player = document.createElement('div');
	addClass(player, 'sound_player');
	
	var play_button = document.createElement('button');
	setNodeTextContents(play_button, '▶');
	player.appendChild(play_button);
	
	var pause_button = document.createElement('button');
	setNodeTextContents(pause_button, '▮▮');
	player.appendChild(pause_button);
	
	var position_bar = document.createElement('progress');
	player.appendChild(position_bar);
	
	var sound = SoundHowler.getSoundById(sound_id) || SoundHowler.registerSound(sound_id, {
		url: url
	});
	
	if(sound.seek() > 0)
	{
		updateSoundPlayerProgress(sound);
	}
	else
	{
		position_bar.max = 1;
		position_bar.value = 0;
	}

	var playAndUpdatePositionBar = function(sound) {
		sound.play();
		if(!updateInterval) {
			updateInterval = setInterval(function() {
				updateSoundPlayerProgress(sound);
				if(!sound.playing())
				{
					clearInterval(updateInterval);
					updateInterval = null;
				}
			}, 100);
		}
	}

	// Every 100 ms, update the current audio position displayed on the player.
	registerEventHandler(play_button, 'click', playAndUpdatePositionBar.bind(sound), false);
	registerEventHandler(pause_button, 'click', sound.pause, false);
	registerEventHandler(position_bar, 'click', function(e) {
		var bar_screen_pos = this.getBoundingClientRect();
		var new_ratio_position = (e.screenX - bar_screen_pos.left) / this.clientWidth;
		var new_position = Math.floor(new_ratio_position * position_bar.max);

		sound.seek(new_position);
		playAndUpdatePositionBar(sound);
	}, false);
	
	return player;
}

//END OF MODULE
Modules.complete('player_sound');
