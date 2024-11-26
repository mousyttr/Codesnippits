"use strict";
/*
Ace Attorney Online - Form elements related to the court records.

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_form_cr',
	dependencies : ['form_elements', 'form_select', 'trial', 'trial_data', 'default_data'],
	init : function() {
		registerFormElementGenerator('cr_element_descriptor', createCrElementSelect);
		registerFormElementGenerator('profile_base', createBaseProfileSelect);
		registerFormElementGenerator('profile_voice', createVoiceSelect);
		registerFormElementGenerator('cr_icon_source', createIconSourceSelect);
		registerFormElementGenerator('evidence_icon', createEvidenceIconSelect);
		registerFormElementGenerator('evidence_check_page_type', createEvidenceCheckPageTypeSelect);
	}
}));

//INDEPENDENT INSTRUCTIONS
function createCrElementSelect()
{
	var cr_elements = new Array();
	
	cr_elements.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: new Object({
			type: 'none',
			id: 0
		})
	}));
	
	cr_elements.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'evidence'
	}));
	for(var i  = 1; i < trial_data.evidence.length; i++)
	{
		cr_elements.push(new Object({
			type: SELECT_OPTION,
			name: trial_data.evidence[i].name,
			value: new Object({
				type: 'evidence',
				id: trial_data.evidence[i].id
			})
		}));
	}
	
	cr_elements.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'profiles'
	}));
	for(var i  = 1; i < trial_data.profiles.length; i++)
	{
		cr_elements.push(new Object({
			type: SELECT_OPTION,
			name: trial_data.profiles[i].long_name,
			value: new Object({
				type: 'profiles',
				id: trial_data.profiles[i].id
			})
		}));
	}
	
	return createSelect(cr_elements);
}

function createBaseProfileSelect()
{
	// Cache sorted array as a static variable to avoid resorting it each time
	if(!createBaseProfileSelect.sorted_bases)
	{
		createBaseProfileSelect.sorted_bases = new Array();
		
		for(var i in default_profiles_nb)
		{
			if(i != 'Cour')
			{
				createBaseProfileSelect.sorted_bases.push(new Object({
					type: SELECT_OPTION,
					lang: 'profile_' + i,
					value: i,
					previewGen: (function(i, container){
						var image = new Image();
						image.src = cfg['picture_dir'] + cfg['icon_subdir'] + i + '.png';
						container.appendChild(image);
					}).bind(undefined, i)
				}));
			}
		}
		
		languageSortAndClassifyOptionList(createBaseProfileSelect.sorted_bases);
	}
	
	var select = createSelect(createBaseProfileSelect.sorted_bases);
	addClass(select, 'picture-select');
	addClass(select, 'icons');
	
	return select;
}

function createVoiceSelect()
{
	var values = new Array();
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_male',
		value: VOICE_MALE
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_female',
		value: VOICE_FEMALE
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_typewriter',
		value: VOICE_TYPEWRITER
	}));
	values.push(new Object({
		type: SELECT_OPTION,
		lang: 'voice_none',
		value: VOICE_NONE
	}));
	
	return createSelect(values);
}

function createIconSourceSelect()
{
	var sources = new Array();
	sources.push(new Object({
		type: SELECT_OPTION,
		lang: 'icon_use_local',
		value: false
	}));
	sources.push(new Object({
		type: SELECT_OPTION,
		lang: 'icon_use_external',
		value: true
	}));
	
	return createRadio().fill(sources);
}

function createEvidenceIconSelect()
{
	// Cache sorted array as a static variable to avoid resorting it each time
	if(!createEvidenceIconSelect.sorted_icons)
	{
		createEvidenceIconSelect.sorted_icons = new Array();
		
		createEvidenceIconSelect.sorted_icons.push(new Object({
			type: SELECT_OPTION,
			lang: 'none',
			value: ''
		}));
		
		for(var i =0; i < default_evidence.length; i++)
		{
			createEvidenceIconSelect.sorted_icons.push(new Object({
				type: SELECT_OPTION,
				lang: 'evidence_'+default_evidence[i],
				value: default_evidence[i],
				previewGen: (function(evidence, container){
					var image = new Image();
					image.src = cfg['picture_dir'] + cfg['evidence_subdir'] + evidence + '.png';
					container.appendChild(image);
				}).bind(undefined, default_evidence[i])
			}));
		}
		
		languageSortAndClassifyOptionList(createEvidenceIconSelect.sorted_icons);
	}
	
	var select = createSelect(createEvidenceIconSelect.sorted_icons);
	addClass(select, 'picture-select');
	addClass(select, 'icons');
	
	return select;
}

function createEvidenceCheckPageTypeSelect()
{
	var types = new Array();
	types.push(new Object({
		type: SELECT_OPTION,
		lang: 'page_type_text',
		value: 'text'
	}));
	types.push(new Object({
		type: SELECT_OPTION,
		lang: 'page_type_image',
		value: 'image'
	}));
	types.push(new Object({
		type: SELECT_OPTION,
		lang: 'page_type_sound',
		value: 'sound'
	}));
	
	return createRadio().fill(types);
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('editor_form_cr');
