"use strict";
/*
Ace Attorney Online - Form elements related to the storyboard elements

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_form_storyboard',
	dependencies : ['form_elements', 'form_select', 'trial', 'trial_data', 'default_data'],
	init : function() {
		var createNaturalInput = createIntegerInput.bind(undefined, true);
		
		registerFormElementGenerator('frame_descriptor', createNaturalInput);
		
		registerFormElementGenerator('ce_descriptor', createNaturalInput);
		
		registerFormElementGenerator('scene_descriptor', createSceneSelect);
		registerFormElementGenerator('dialogue_descriptor', createDialogueSelect);
		registerFormElementGenerator('talk_topic_descriptor', createTalkTopicSelect);
		registerFormElementGenerator('lock_descriptor', createLockSelect);
		
		registerFormElementGenerator('lock_type', createLockTypeSelect);
		
		registerFormElementGenerator('trial_part_descriptor', createTrialPartSelect);
		
		registerFormElementGenerator('block_type', createBlockTypeSelect);
		registerFormElementGenerator('frame_preset', createFramePresetSelect);
	}
}));

//INDEPENDENT INSTRUCTIONS
function createSceneSelect(parameters)
{
	var scenes = new Array();
	
	//Classic AA scenes
	scenes.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'scenes'
	}));
	
	for(var i = 1; i < trial_data.scenes.length; i++)
	{
		if(parameters && parameters.require_dialogues && trial_data.scenes[i].dialogues.length == 0)
		{
			//Skip scenes without dialogues if required
			continue;
		}
		
		scenes.push(new Object({
			type: SELECT_OPTION,
			name: '#' + trial_data.scenes[i].id + ' : ' + trial_data.scenes[i].name,
			value: new Object({
				scene_type: 'scenes',
				scene_id: trial_data.scenes[i].id
			})
		}));
	}
	
	/* Enable when AAI scenes are launched
	scenes.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'aai_scenes'
	}));
	for(var i = 1; i < trial_data.aai_scenes.length; i++)
	{
		scenes.push(new Object({
			type: SELECT_OPTION,
			name: '#' + trial_data.aai_scenes[i].id + ' : ' + trial_data.aai_scenes[i].name,
			value: new Object({
				scene_type: 'aai_scenes',
				scene_id: trial_data.aai_scenes[i].id
			})
		}));
	}
	*/
	
	return createSelect(scenes);
}

function createDialogueSelect(parameters)
{
	var dialogues = new Array();
	
	if(parameters.scene_descriptor)
	{
		var scene_descriptor = parameters.scene_descriptor;
		var scene = getRowById(scene_descriptor.scene_type, scene_descriptor.scene_id);
		
		for(var i = 0; i < scene.dialogues.length; i++)
		{
			if(parameters && parameters.require_locks && !scene.dialogues[i].locks)
			{
				//Skip dialogues without locks if required
				continue;
			}
			else if(parameters && parameters.require_talk_topics && scene.dialogues[i].talk_topics.length == 0)
			{
				//Skip dialogues without talk topics if required
				continue;
			}
			
			dialogues.push(new Object({
				type: SELECT_OPTION,
				name: '#' + scene.dialogues[i].id + ' : ' + scene.dialogues[i].name,
				value: new Object({
					scene_type: 'scenes',
					scene_id: scene.id,
					section_type: 'dialogues',
					section_id: scene.dialogues[i].id
				})
			}));
		}
	}
	
	return createSelect(dialogues);
}

function createExaminationSelect(scene_descriptor)
{
	var scene_descriptor = parameters.scene_descriptor;
	var scene = getRowById(scene_descriptor.scene_type, scene_descriptor.scene_id);
	
	var examinations = new Array();
	for(var i = 0; i < scene.examinations.length; i++)
	{
		examinations.push(new Object({
			type: SELECT_OPTION,
			name: '#' + scene.examinations[i].id + ' : ' + scene.examinations[i].name,
			value: new Object({
				scene_type: 'scenes',
				scene_id: scene.id,
				section_type: 'examinations',
				section_id: scene.examinations[i].id
			})
		}));
	}
	
	return createSelect(examinations);
}

function createTalkTopicSelect(parameters)
{
	var talk_topics = new Array();
	
	if(parameters.dialogue_descriptor)
	{
		var dialogue_descriptor = parameters.dialogue_descriptor;
		var scene = getRowById(dialogue_descriptor.scene_type, dialogue_descriptor.scene_id);
		var dialogue = getById(scene.dialogues, dialogue_descriptor.section_id);
		
		for(var i = 0; i < dialogue.talk_topics.length; i++)
		{
			talk_topics.push(new Object({
				type: SELECT_OPTION,
				name: '#' + dialogue.talk_topics[i].id + ' : ' + dialogue.talk_topics[i].title,
				value: new Object({
					scene_type: dialogue_descriptor.scene_type,
					scene_id: scene.id,
					section_type: 'dialogues',
					section_id: dialogue.id,
					conv_type: 'talk_topics',
					conv_id: dialogue.talk_topics[i].id
				})
			}));
		}
	}
	
	return createSelect(talk_topics);
}

function createLockSelect(parameters)
{
	var locks = new Array();
	
	if(parameters.dialogue_descriptor)
	{
		var dialogue_descriptor = parameters.dialogue_descriptor;
		var scene = getRowById(dialogue_descriptor.scene_type, dialogue_descriptor.scene_id);
		var dialogue = getById(scene.dialogues, dialogue_descriptor.section_id);
		
		if(dialogue.locks)
		{
			// Auto mode : first non-broken lock
			locks.push(new Object({
				type: SELECT_OPTION,
				lang: 'locks_auto',
				value: new Object({
					scene_type: dialogue_descriptor.scene_type,
					scene_id: scene.id,
					section_type: 'dialogues',
					section_id: dialogue.id,
					lock_id: 0
				})
			}));
			
			// Select a specific lock in the list
			for(var i = 0; i < dialogue.locks.locks_to_display.length; i++)
			{
				locks.push(new Object({
					type: SELECT_OPTION,
					name: '#' + dialogue.locks.locks_to_display[i].id,
					value: new Object({
						scene_type: dialogue_descriptor.scene_type,
						scene_id: scene.id,
						section_type: 'dialogues',
						section_id: dialogue.id,
						lock_id: dialogue.locks.locks_to_display[i].id 
					})
				}));
			}
		}
	}
	
	return createSelect(locks);
}

function createLockTypeSelect()
{
	var lock_types = new Array();
	
	for(var type in {jfa: ''})
	{
		lock_types.push(new Object({
			type: SELECT_OPTION,
			lang: type + '_lock',
			value: type + '_lock',
			previewGen: function(container){
				var image = new Image();
				image.src = cfg.picture_dir + cfg.locks_subdir + type + '_lock_appears.gif';
				container.appendChild(image);
			}
		}));
	}
	
	var select = createSelect(lock_types);
	addClass(select, 'picture-select');
	
	return select;
}

function createTrialPartSelect()
{
	var parts = new Array();
	
	parts.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: 0
	}));
	
	if(trial_information.sequence)
	{
		parts.push(new Object({
			type: SELECT_OPTGROUP,
			name: trial_information.sequence.title
		}));
		
		for(var i = 0; i < trial_information.sequence.list.length; i++)
		{
			parts.push(new Object({
				type: SELECT_OPTION,
				name: '#' + (i + 1) + ' : ' + trial_information.sequence.list[i].title,
				value: trial_information.sequence.list[i].id
			}));
		}
	}
	
	return createSelect(parts);
}

function createBlockTypeSelect()
{
	var block_types = [
		new Object({
			type: SELECT_OPTION,
			lang: 'insert_block',
			value: ''
		}),
		new Object({
			type: SELECT_OPTION,
			lang: 'cross_examination',
			value: 'ce'
		}),
		new Object({
			type: SELECT_OPTION,
			lang: 'scene',
			value: 'scene'
		})
	];
	return createSelect(block_types);
}

function createFramePresetSelect(parameters)
{
	var presets = [
		new Object({
			type: SELECT_OPTION,
			lang: 'insert_preset',
			value: ''
		}),
		new Object({
			type: SELECT_OPTION,
			lang: 'frame_save_preset',
			value: 'save'
		})
	];
	
	for(var i = 0; i < parameters.presets.length; i++)
	{
		presets.push(new Object({
			type: SELECT_OPTION,
			name: parameters.presets[i].text_content,
			value: i
		}));
	}
	
	return createSelect(presets);
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('editor_form_storyboard');
