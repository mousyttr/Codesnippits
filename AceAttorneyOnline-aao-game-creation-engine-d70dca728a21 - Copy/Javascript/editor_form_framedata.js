"use strict";
/*
Ace Attorney Online - Form elements related to frame display.

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_form_framedata',
	dependencies : ['form_elements', 'form_select', 'trial', 'trial_data', 'default_data'],
	init : function() {
		registerFormElementGenerator('place_position', createPositionSelect);
		registerFormElementGenerator('screen_position_mode', createScreenPositionModeSelect);
		registerFormElementGenerator('screen_transition_mode', createScreenTransitionSelect);
		registerFormElementGenerator('profile_descriptor', createProfileSelect);
		registerFormElementGenerator('character_sprite', createSpriteSelect);
		registerFormElementGenerator('character_startup_mode', createStartupModeSelect);
		registerFormElementGenerator('character_sync_mode', createSyncModeSelect);
		registerFormElementGenerator('character_visual_effect_appears', createVisualEffectAppearsModeSelect);
		registerFormElementGenerator('character_visual_effect_disappears', createVisualEffectDisppearsModeSelect);
		registerFormElementGenerator('popup_descriptor', createPopupSelect);
		registerFormElementGenerator('fade_type', createFadeTypeSelect);
		registerFormElementGenerator('fade_placement', createFadePlacementSelect);
		registerFormElementGenerator('default_popup', createDefaultPopupSelect);
		registerFormElementGenerator('voice_mode', createVoiceSelect);
		registerFormElementGenerator('action', createActionSelect);
	}
}));

//INDEPENDENT INSTRUCTIONS
function createPositionSelect(parameters)
{
	var place = parameters.place;
	var exclude_list = parameters.exclude_list;
	
	var positions = new Array();
	
	if(place)
	{
		if(place.positions.length > 0)
		{
			//custom positions
			positions.push(new Object({
				type: SELECT_OPTGROUP,
				lang: 'custom_positions'
			}));
			for(var i = 0; i < place.positions.length; i++)
			{
				if(!exclude_list || exclude_list.indexOf(place.positions[i].id) == -1)
				{
					positions.push(new Object({
						type: SELECT_OPTION,
						name: place.positions[i].name,
						value: place.positions[i].id
					}));
				}
			}
			
			//default positions header, displayed only if there are custom positions too
			positions.push(new Object({
				type: SELECT_OPTGROUP,
				lang: 'default_positions'
			}));
		}
		
		//default positions
		for(var i in default_positions)
		{
			if(!exclude_list || exclude_list.indexOf(default_positions[i].id) == -1)
			{
				positions.push(new Object({
					type: SELECT_OPTION,
					lang: 'position_' + default_positions[i].name,
					value: default_positions[i].id
				}));
			}
		}
	}
	else
	{
		positions.push(new Object({
			type: SELECT_OPTION,
			lang: 'none',
			value: POSITION_NONE
		}));
	}
	
	return createSelect(positions);
}

function createScreenPositionModeSelect()
{
	var positions = new Array();
	
	//Auto position : apply talking character's alignment, but not its shift, to stay inside the screen.
	positions.push(new Object({
		type: SELECT_OPTION,
		lang: 'position_align_on_talking',
		value: POSITION_NONE
	}));
	//Do not move the screen at all
	positions.push(new Object({
		type: SELECT_OPTION,
		lang: 'position_do_not_move',
		value: POSITION_DO_NOT_MOVE
	}));
	//Center on talking character
	positions.push(new Object({
		type: SELECT_OPTION,
		lang: 'position_center_on_talking',
		value: POSITION_CENTER_ON_TALKING
	}));
	
	return createSelect(positions);
}

function createScreenTransitionSelect() {
	var transitions = new Array();
	
	// No transition at all
	transitions.push(new Object({
		type: SELECT_OPTION,
		lang: 'transition_option_none',
		value: TRANSITION_NO
	}));
	
	// Linear transition
	transitions.push(new Object({
		type: SELECT_OPTION,
		lang: 'transition_option_linear',
		value: TRANSITION_LINEAR
	}));
	
	// Eased Bézier Transition
	transitions.push(new Object({
		type: SELECT_OPTION,
		lang: 'transition_option_bezier',
		value: TRANSITION_BEZIER
	}));
	
	// Ease-In Transition
	transitions.push(new Object({
		type: SELECT_OPTION,
		lang: 'transition_option_easein',
		value: TRANSITION_EASE_IN
	}));
	
	// Ease-Out Transition
	transitions.push(new Object({
		type: SELECT_OPTION,
		lang: 'transition_option_easeout',
		value: TRANSITION_EASE_OUT
	}));
	
	return createSelect(transitions);
}

function createProfileSelect(parameters)
{
	var include_unknown = parameters.include_unknown;
	var include_judge = parameters.include_judge;
	var exclude_list = parameters.exclude_list;
	
	var profiles = new Array();
	
	profiles.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: PROFILE_EMPTY
	}));
	
	// ??? profile isn't always in the list
	if(include_unknown)
	{
		profiles.push(new Object({
			type: SELECT_OPTION,
			name: '???',
			value: PROFILE_UNKNOWN
		}));
	}
	
	// Default judge is not visible in new trials
	if(include_judge)
	{
		if(!exclude_list || exclude_list.indexOf(PROFILE_JUDGE) == -1)
		{
			profiles.push(new Object({
				type: SELECT_OPTION,
				lang: 'profile_judge',
				value: PROFILE_JUDGE
			}));
		}
	}
	
	//user-defined profiles
	for(var i = 1; i < trial_data.profiles.length; i++)
	{
		if(!exclude_list || exclude_list.indexOf(trial_data.profiles[i].id) == -1)
		{
			profiles.push(new Object({
				type: SELECT_OPTION,
				name: trial_data.profiles[i].short_name,
				value: trial_data.profiles[i].id
			}));
		}
	}
	
	return createSelect(profiles);
}

function createSpriteSelect(parameters)
{
	var profile_id = parameters.profile_id;
	var include_none = parameters.include_none;
	
	var sprites = new Array();
	
	if(profile_id > 0) //user-defined profile
	{
		var profile = getRowById('profiles', profile_id);
		
		if(include_none)
		{
			sprites.push(new Object({
				type: SELECT_OPTION,
				lang: 'none',
				value: 0
			}));
		}
		
		//custom sprites
		if(profile.custom_sprites.length > 0)
		{
			if(default_profiles_nb[profile.base])
			{
				// Show optgroup only if there also are default sprites
				sprites.push(new Object({
					type: SELECT_OPTGROUP,
					lang: 'custom_sprites'
				}));
			}
			
			for(var i = 0; i < profile.custom_sprites.length; i++)
			{
				(function(i){
					sprites.push(new Object({
						type: SELECT_OPTION,
						name: profile.custom_sprites[i].name,
						value: profile.custom_sprites[i].id,
						previewGen: function(container){
							var char_desc = getCharacterDescriptor(new Object({
								profile_id: profile_id,
								sprite_id: profile.custom_sprites[i].id
							}), 'talking');
							var image = new Image();
							image.src = char_desc.uri;
							container.appendChild(image);
						}
					}));
				})(i);
			}
		}
		
		//default sprites - displayed only if there is a profile base
		if(default_profiles_nb[profile.base])
		{
			if(profile.custom_sprites.length > 0)
			{
				// Show optgroup only if there also are custom sprites
				sprites.push(new Object({
					type: SELECT_OPTGROUP,
					lang: 'default_sprites'
				}));
			}
			
			for(var i = 1; i <= default_profiles_nb[profile.base]; i++)
			{
				(function(i){
					sprites.push(new Object({
						type: SELECT_OPTION,
						lang: 'default_sprites_'+profile.base+'_'+i,
						value: -i,
						previewGen: function(container){
							var char_desc = getCharacterDescriptor(new Object({
								profile_id: profile_id,
								sprite_id: -i
							}), 'talking');
							var image = new Image();
							image.src = char_desc.uri;
							container.appendChild(image);
						}
					}));
				})(i);
			}
		}
	}
	else if(profile_id == 0) //default judge
	{
		if(include_none)
		{
			sprites.push(new Object({
				type: SELECT_OPTION,
				lang: 'none',
				value: 0
			}));
		}
		
		sprites.push(new Object({
			type: SELECT_OPTGROUP,
			lang: 'default_sprites'
		}));
		for(var i = 1; i <= default_profiles_nb['Juge']; i++)
		{
			(function(i){
				sprites.push(new Object({
					type: SELECT_OPTION,
					lang: 'default_sprites_Juge_'+i,
					value: -i,
					previewGen: function(container){
						var char_desc = getCharacterDescriptor(new Object({
							profile_id: profile_id,
							sprite_id: -i
						}), 'talking');
						var image = new Image();
						image.src = char_desc.uri;
						container.appendChild(image);
					}
				}));
			})(i);
		}
	}
	
	var select = createSelect(sprites);
	addClass(select, 'picture-select');
	
	return select;
}

function createStartupModeSelect()
{
	var values = new Array();
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'startup_skip',
		value: STARTUP_SKIP
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'startup_play_before',
		value: STARTUP_PLAY_BEFORE
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'startup_play_during',
		value: STARTUP_PLAY_DURING
	}));
	
	return createSelect(values);
}

function createSyncModeSelect()
{
	var values = new Array();
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'sync_auto',
		value: SYNC_AUTO
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'sync_still',
		value: SYNC_STILL
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'sync_talk',
		value: SYNC_TALK
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'sync_sync',
		value: SYNC_SYNC
	}));
	
	return createSelect(values);
}

function createVisualEffectAppearsModeSelect()
{
	var values = new Array();
	
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_none',
		value: EFFECT_NONE
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_slide_from_left',
		value: EFFECT_SLIDE_LEFT
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_slide_from_right',
		value: EFFECT_SLIDE_RIGHT
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_fade_in',
		value: EFFECT_FADING
	}));
	
	return createSelect(values);
}

function createVisualEffectDisppearsModeSelect()
{
	var values = new Array();
	
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_auto',
		value: EFFECT_AUTO
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_none',
		value: EFFECT_NONE
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_slide_to_left',
		value: EFFECT_SLIDE_LEFT
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_slide_to_right',
		value: EFFECT_SLIDE_RIGHT
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'visual_effect_fade_out',
		value: EFFECT_FADING
	}));
	
	return createSelect(values);
}

function appendDefaultPopupsToPopupsList(popups)
{
	// Cache sorted array as a static variable to avoid resorting it each time
	if(!appendDefaultPopupsToPopupsList.sorted_popups)
	{
		appendDefaultPopupsToPopupsList.sorted_popups = new Array();
	
		for(var i = 0; i < default_popups.length; i++)
		{
			(function(i){
				appendDefaultPopupsToPopupsList.sorted_popups.push(new Object({
					type: SELECT_OPTION,
					lang: 'default_popups_' + default_popups[i],
					value: default_popups[i],
					previewGen: function(container){
						var popup_desc = getPopupDescriptor(new Object({
							popup_id: default_popups[i]
						}));
						var image = new Image();
						image.src = popup_desc.uri;
						container.appendChild(image);
					}
				}));
			})(i);
		}
		
		languageSortAndClassifyOptionList(appendDefaultPopupsToPopupsList.sorted_popups);
	}
	
	popups.push.apply(popups, appendDefaultPopupsToPopupsList.sorted_popups);
}

function createPopupSelect()
{
	var popups = new Array();
	
	// No popup
	popups.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: 0
	}));
	
	// Used popups
	popups.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'used_popups'
	}));
	for(var i = 1; i < trial_data.popups.length; i++)
	{
		(function(i){
			popups.push(new Object({
				type: SELECT_OPTION,
				name: trial_data.popups[i].name,
				value: trial_data.popups[i].id,
				previewGen: function(container){
					var popup_desc = getPopupDescriptor(new Object({
						popup_id: trial_data.popups[i].id
					}));
					var image = new Image();
					image.src = popup_desc.uri;
					container.appendChild(image);
				}
			}));
		})(i);
	}
	
	// Default popups
	popups.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'default_popups'
	}));
	appendDefaultPopupsToPopupsList(popups);
	
	var select = createSelect(popups);
	addClass(select, 'picture-select');
	
	return select;
}

function createDefaultPopupSelect()
{
	var popups = new Array();
	
	appendDefaultPopupsToPopupsList(popups);
	
	var select = createSelect(popups);
	addClass(select, 'picture-select');
	
	return select;
}

function createFadeTypeSelect() 
{
	var values = new Array();
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'fade_fadein',
		value: FADEMODE_FADEIN
	}));

	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'fade_fadeout',
		value: FADEMODE_FADEOUT
	}));

	return createSelect(values);
}

function createFadePlacementSelect() 
{
	var values = new Array();
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'fade_bgonly',
		value: FADEPOS_BGONLY
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'fade_bgcharacter',
		value: FADEPOS_BGCHARACTER
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'fade_behindtext',
		value: FADEPOS_BEHINDTEXT
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'fade_everything',
		value: FADEPOS_EVERYTHING
	}));
	
	return createSelect(values);
}

function createVoiceSelect()
{
	var voices = new Array();
	
	voices.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_auto',
		value: VOICE_AUTO
	}));
	voices.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_none',
		value: VOICE_NONE
	}));
	voices.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_male',
		value: VOICE_MALE
	}));
	voices.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_female',
		value: VOICE_FEMALE
	}));
	voices.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_typewriter',
		value: VOICE_TYPEWRITER
	}));
	
	return createSelect(voices);
}

function createActionSelect(parameters)
{
	var actions = new Array();
	
	actions.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: ''
	}));
	
	for(var category in action_descriptions)
	{
		var header_index = actions.length;
		
		for(var action_name in action_descriptions[category])
		{
			var action_desc = action_descriptions[category][action_name];
			
			//Check required context variables
			var failed_requirement = false;
			if(action_desc.context)
			{
				for(var var_name in action_desc.context)
				{
					if(action_desc.context[var_name].required && !parameters.context_env.isSet(var_name))
					{
						failed_requirement = true;
					}
				}
			}
			
			if(!failed_requirement)
			{
				actions.push(new Object({
					type: SELECT_OPTION,
					lang: 'action_'+action_name,
					value: action_name
				}));
			}
		}
		
		if(header_index < actions.length)
		{
			//If at least one action was added to the category, show the header
			actions.splice(header_index, 0, new Object({
				type: SELECT_OPTGROUP,
				lang: 'actionCategory_'+category
			}));
		}
	}
	
	return createSelect(actions);
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('editor_form_framedata');
