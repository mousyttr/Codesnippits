"use strict";
/*
Ace Attorney Online - Editor functions to locate depending frames

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_locate_depending',
	dependencies : ['trial'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS
function actionDependsOnCrElt(action_name, params, type, id)
{
	var action_def = getActionDescription(action_name);
	
	if(!action_def) { return false; }
	
	for(var param_name in action_def.global)
	{
		if(
			action_def.global[param_name].type == 'cr_element_descriptor'
			&& params.global[param_name].type == type 
			&& params.global[param_name].id == id
		)
		{
			return true;
		}
	}
	
	for(var entity_name in action_def.multiple)
	{
		for(var param_name in action_def.multiple[entity_name])
		{
			if(action_def.multiple[entity_name][param_name].type == 'cr_element_descriptor')
			{
				for(var i = 0; i < params.multiple[entity_name].length; i++)
				{
					var param_val = params.multiple[entity_name][i][param_name];
					if(areOnlyRawParameters(param_val))
					{
						var param_real_val = computeParameters(param_val, global_env);
						if(param_real_val.type == type && param_real_val.id == id)
						{
							return true;
						}
					}
				}
			}
		}
	}
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
function getFramesDependingOnProfile(profile_id)
{
	var result_frames = new Array();
	
	for(var i = 1; i < trial_data.frames.length; i++)
	{
		var frame_data = trial_data.frames[i];
		
		// If this profile is the speaker's
		if(frame_data.speaker_id == profile_id)
		{
			result_frames.push(frame_data.id);
		}
		else
		{
			// If this profile is used in displayed characters
			var char_match = false;
			
			for(var j = 0; !char_match && j < frame_data.characters.length; j++)
			{
				var char_data = frame_data.characters[j];
				
				if(char_data.profile_id == profile_id)
				{
					char_match = true;
				}
			}
			
			if(char_match)
			{
				result_frames.push(frame_data.id);
			}
			else
			{
				// If this profile is referred to in action params
				if(actionDependsOnCrElt(frame_data.action_name, frame_data.action_parameters, 'profiles', profile_id))
				{
					result_frames.push(frame_data.id);
				}
			}
		}
	}
	
	return result_frames;
}

function getFramesDependingOnSprite(profile_id, sprite_id)
{
	var result_frames = new Array();
	
	for(var i = 1; i < trial_data.frames.length; i++)
	{
		var frame_data = trial_data.frames[i];
		
		var sprite_match = false;
		for(var j = 0; !sprite_match && j < frame_data.characters.length; j++)
		{
			var char_data = frame_data.characters[j];
			
			if(char_data.profile_id == profile_id && char_data.sprite_id == sprite_id)
			{
				sprite_match = true;
			}
		}
		
		if(sprite_match)
		{
			result_frames.push(frame_data.id);
		}
	}
	
	return result_frames;
}

function getFramesDependingOnEvidence(evidence_id)
{
	var result_frames = new Array();
	
	for(var i = 1; i < trial_data.frames.length; i++)
	{
		var frame_data = trial_data.frames[i];
		
		// If this piece of evidence is referred to in action params
		if(actionDependsOnCrElt(frame_data.action_name, frame_data.action_parameters, 'evidence', evidence_id))
		{
			result_frames.push(frame_data.id);
		}
	}
	
	return result_frames;
}

function getFramesDependingOnPlace(place_id)
{
	var result_frames = new Array();
	
	for(var i = 1; i < trial_data.frames.length; i++)
	{
		var frame_data = trial_data.frames[i];
		
		if(frame_data.place == place_id)
		{
			result_frames.push(frame_data.id);
		}
	}
	
	// TODO : check for actions that alter places (show/hide object)
	
	return result_frames;
}

function getFramesDependingOnPopup(popup_id)
{
	var result_frames = new Array();
	
	for(var i = 1; i < trial_data.frames.length; i++)
	{
		var frame_data = trial_data.frames[i];
		
		for(var j = 0; j < frame_data.popups.length; j++)
		{
			if(frame_data.popups[j].popup_id == popup_id)
			{
				result_frames.push(frame_data.id);
			}
		}
	}
	
	return result_frames;
}

function getFramesDependingOnMusic(music_id)
{
	var result_frames = new Array();
	
	for(var i = 1; i < trial_data.frames.length; i++)
	{
		var frame_data = trial_data.frames[i];
		
		if(frame_data.music == music_id)
		{
			result_frames.push(frame_data.id);
		}
	}
	
	return result_frames;
}

function getFramesDependingOnSound(sound_id)
{
	var result_frames = new Array();
	
	for(var i = 1; i < trial_data.frames.length; i++)
	{
		var frame_data = trial_data.frames[i];
		
		if(frame_data.sound == sound_id)
		{
			result_frames.push(frame_data.id);
		}
	}
	
	return result_frames;
}

//END OF MODULE
Modules.complete('editor_locate_depending');
