"use strict";
/*
Ace Attorney Online - Form elements related to sounds and music.

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_form_sound',
	dependencies : ['form_elements', 'form_select', 'trial', 'trial_data', 'default_data', 'sound-howler'],
	init : function() {
		registerFormElementGenerator('music_descriptor', createMusicSelect.bind(undefined, false, false));
		registerFormElementGenerator('music_select', createMusicSelect.bind(undefined, true, false, false));
		registerFormElementGenerator('default_music', createMusicSelect.bind(undefined, true, true, false));
		registerFormElementGenerator('music_crossfade_select', createMusicSelect.bind(undefined, true, false, true));
		registerFormElementGenerator('sound_descriptor', createSoundSelect.bind(undefined, false));
		registerFormElementGenerator('sound_select', createSoundSelect.bind(undefined, true, false));
		registerFormElementGenerator('default_sound', createSoundSelect.bind(undefined, true, true));
		registerFormElementGenerator('sound_file_source', createSoundFileSourceSelect);
	}
}));

//INDEPENDENT INSTRUCTIONS
function generateSoundPreview(sound_id, sound_url)
{
	return function(container) {
		setNodeTextContents(container, '\u00a0');
		
		registerEventHandler(container, 'mouseover', function(e){
			SoundHowler.registerSound(sound_id, {
				url: sound_url,
				onload: function() {
					if(hasClass(container, 'playing')) // Should the sound still be playing?
					{
						SoundHowler.playSound(sound_id);
					}
				}
			});
			addClass(container, 'playing');
			
			e.stopPropagation();
			e.preventDefault();
		}, false);
		
		registerEventHandler(container, 'mouseout', function(e){
			var sound = SoundHowler.getSoundById(sound_id);
			if(sound)
			{
				SoundHowler.unloadSound(sound_id);
				sound.stop();
			}
			removeClass(container, 'playing');
		}, false);
	};
}

function createMusicSelect(include_default, default_only, music_only)
{
	var music = new Array();
	
	if(!default_only)
	{
		if(!music_only) {
			music.push(new Object({
				type: SELECT_OPTION,
				lang: 'unchanged',
				value: MUSIC_UNCHANGED
			}));
			
			music.push(new Object({
				type: SELECT_OPTION,
				lang: 'stop',
				value: MUSIC_STOP
			}));
		}
		
		//user-defined music
		music.push(new Object({
			type: SELECT_OPTGROUP,
			lang: 'custom_music'
		}));
		for(var i = 1; i < trial_data.music.length; i++)
		{
			var sound_id = 'custom_music/' + trial_data.music[i].id;
			music.push(new Object({
				type: SELECT_OPTION,
				name: trial_data.music[i].name,
				value: trial_data.music[i].id,
				previewGen: generateSoundPreview(sound_id, getMusicUrl(trial_data.music[i]))
			}));
		}
	}
	
	if(include_default)
	{
		//default music
		
		if(default_only && !music_only)
		{
			music.push(new Object({
				type: SELECT_OPTION,
				lang: 'none',
				value: ''
			}));
		}
		
		for(var album in default_music)
		{
			music.push(new Object({
				type: SELECT_OPTGROUP,
				name: album
			}));
			
			for(var i = 0; i < default_music[album].length; i++)
			{
				var sound_id = 'default_music/' + default_music[album][i];
				music.push(new Object({
					type: SELECT_OPTION,
					lang: 'default_music_' + default_music[album][i],
					value: default_music[album][i],
					previewGen: generateSoundPreview(sound_id, getMusicUrl({
						external: false,
						path: default_music[album][i]
					}))
				}));
			}
		}
	}
	
	var select = createSelect(music);
	addClass(select, 'sound-select');
	
	return select;
}

function createSoundSelect(include_default, default_only)
{
	if(!createSoundSelect.sorted_default_sounds)
	{
		createSoundSelect.sorted_default_sounds = new Array();
		
		createSoundSelect.sorted_default_sounds.push(new Object({
			type: SELECT_OPTGROUP,
			lang: 'default_sounds'
		}));
		for(var i = 0; i < default_sounds.length; i++)
		{
			var sound_id = 'default_sounds/' + default_sounds[i];
			createSoundSelect.sorted_default_sounds.push(new Object({
				type: SELECT_OPTION,
				lang: 'default_sounds_' + default_sounds[i],
				value: default_sounds[i],
				previewGen: generateSoundPreview(sound_id, getSoundUrl({
					external: false,
					path: default_sounds[i]
				}))
			}));
		}
		
		languageSortAndClassifyOptionList(createSoundSelect.sorted_default_sounds);
	}
	
	var sounds = new Array();
	
	if(!default_only)
	{
		sounds.push(new Object({
			type: SELECT_OPTION,
			lang: 'none',
			value: SOUND_NONE
		}));
		
		//user-defined sounds
		sounds.push(new Object({
			type: SELECT_OPTGROUP,
			lang: 'custom_sounds'
		}));
		for(var i = 1; i < trial_data.sounds.length; i++)
		{
			var sound_id = 'custom_sounds/' + trial_data.sounds[i].id;
			sounds.push(new Object({
				type: SELECT_OPTION,
				name: trial_data.sounds[i].name,
				value: trial_data.sounds[i].id,
				previewGen: generateSoundPreview(sound_id, getSoundUrl(trial_data.sounds[i]))
			}));
		}
	}
	
	//default sounds
	sounds.push.apply(sounds, createSoundSelect.sorted_default_sounds);
	
	var select = createSelect(sounds);
	addClass(select, 'sound-select');
	
	return select;
}

function createSoundFileSourceSelect()
{
	var sources = new Array();
	sources.push(new Object({
		type: SELECT_OPTION,
		lang: 'sound_use_local',
		value: false
	}));
	sources.push(new Object({
		type: SELECT_OPTION,
		lang: 'sound_use_external',
		value: true
	}));
	
	return createRadio().fill(sources);
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('editor_form_sound');
