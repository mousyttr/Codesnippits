"use strict";
/*
Ace Attorney Online - Form elements related to places and backgrounds.

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_form_places',
	dependencies : ['form_elements', 'form_select', 'trial', 'trial_data', 'default_data'],
	init : function() {
		registerFormElementGenerator('place_descriptor', createPlaceSelect.bind(undefined, false));
		registerFormElementGenerator('place_select', createPlaceSelect.bind(undefined, true));
		registerFormElementGenerator('default_background', createDefaultBackgroundSelect);
		registerFormElementGenerator('background_descriptor', createBackgroundSelect);
	}
}));

//INDEPENDENT INSTRUCTIONS
function appendPlacesToSelectList(list)
{
	//user defined places
	list.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'custom_places'
	}));
	for(var i = 1; i < trial_data.places.length; i++)
	{
		(function(i){
			list.push(new Object({
				type: SELECT_OPTION,
				name: trial_data.places[i].name,
				value: trial_data.places[i].id,
				previewGen: function(container) {
					var obj_desc = getObjectDescriptor(trial_data.places[i].background, 'bg_subdir');
					if(obj_desc.colour)
					{
						container.style.background = obj_desc.colour;
						setNodeTextContents(container, '\u00A0');
					}
					else
					{
						var image = new Image();
						image.src = obj_desc.uri;
						container.appendChild(image);
					}
				}
			}));
		})(i);
	}
	
	//default places
	list.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'default_places'
	}));
	for(var i in default_places)
	{
		(function(i){
			list.push(new Object({
				type: SELECT_OPTION,
				lang: default_places[i].lang,
				value: default_places[i].id,
				previewGen: function(container) {
					var obj_desc = getObjectDescriptor(default_places[i].background, 'bg_subdir');
					if(obj_desc.colour)
					{
						container.style.background = obj_desc.colour;
						setNodeTextContents(container, '\u00A0');
					}
					else
					{
						var image = new Image();
						image.src = obj_desc.uri;
						container.appendChild(image);
					}
				}
			}));
		})(i);
	}
}

function appendDefaultBackgroundsToSelectList(list)
{
	//available backgrounds for quick place creation
	for(var album in default_backgrounds)
	{
		list.push(new Object({
			type: SELECT_OPTGROUP,
			name: album
		}));
		
		for(var i = 0; i < default_backgrounds[album].length; i++)
		{
			(function(i, album){
				list.push(new Object({
					type: SELECT_OPTION,
					lang: 'default_backgrounds_' + default_backgrounds[album][i],
					value: default_backgrounds[album][i],
					previewGen: function(container) {
						var image_desc = getObjectDescriptor(new Object({
							image: default_backgrounds[album][i], 
							external: false}
						), 'bg_subdir');
						var image = new Image();
						image.src = image_desc.uri;
						container.appendChild(image);
					}
				}));
			})(i, album);
		}
	}
}

function createPlaceSelect(include_bg_list)
{
	var places = new Array();
	
	//none
	places.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: 0
	}));
	
	appendPlacesToSelectList(places);
	
	if(include_bg_list)
	{
		appendDefaultBackgroundsToSelectList(places);
	}
	
	var select = createSelect(places);
	addClass(select, 'picture-select');
	
	return select;
}

function createDefaultBackgroundSelect()
{
	var bgs = new Array();
	
	//none
	bgs.push(new Object({
		type: SELECT_OPTION,
		lang: 'none',
		value: 0
	}));
	
	appendDefaultBackgroundsToSelectList(bgs);
	
	var select = createSelect(bgs);
	addClass(select, 'picture-select');
	
	return select;
}

function createBackgroundSelect()
{
	var backgrounds = new Array();
	
	appendPlacesToSelectList(backgrounds);
	
	backgrounds.push(new Object({
		type: SELECT_OPTGROUP,
		lang: 'custom_picture'
	}));
	
	backgrounds.push(new Object({
		type: SELECT_INPUT,
		lang: 'custom_picture',
		input_type: 'uri',
		input_parameters: new Object({
			type: 'image'
		})
	}));
	
	return createSelect(backgrounds);
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('editor_form_places');
