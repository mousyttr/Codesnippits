"use strict";
/*
Ace Attorney Online - Editor sounds rows data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_sounds',
	dependencies : ['trial', 'nodes', 'events', 'form_elements', 'editor_cell_section', 'editor_locate_depending'],
	init : function() 
	{
		if(!trial_data)
		{
			//if no trial data has been loaded, editor won't run anyway
			return;
		}
		
		sounds_section_descriptor = new Object({
			list : trial_data.sounds,
			offset : 1,
			generator : getSoundRow,
			insert_generator: getSoundInsertRow
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

function getSoundRow(sound_index)
{
	var sound_data = trial_data.sounds[sound_index];
	
	//Outer row
	var outer_cell = document.createElement('div');
	outer_cell.className = 'audio-cell';
		
		//generate insert-before link
		var insert_link = document.createElement('a');
		addClass(insert_link, 'insert');
		var insert_link_text = document.createElement('span');
		insert_link_text.setAttribute('data-locale-content', 'add_sound');
		insert_link.appendChild(insert_link_text);
		translateNode(insert_link);
	
		registerEventHandler(insert_link, 'click', function()
		{
			createAndInsertDataRow('sounds', getRowIndexById('sounds', sound_data.id));
			reInitCellSectionContent();
		}, false);
		outer_cell.appendChild(insert_link);
	
		//Inner row
		var inner_cell = document.createElement('div');
		addClass(inner_cell, 'audio-elt');
		inner_cell.id = 'sound_'+sound_data.id;
		outer_cell.appendChild(inner_cell);
		
			//Id box
			var small = document.createElement('small');
			setNodeTextContents(small, sound_data.id);
			inner_cell.appendChild(small);
			
			var delete_button = document.createElement('button');
			addClass(delete_button, 'box-delete');
			delete_button.setAttribute('data-locale-content', 'delete');
			registerEventHandler(delete_button, 'click', function()
			{
				var depending_frames = getFramesDependingOnSound(sound_data.id);
				
				if(depending_frames.length == 0)
				{
					deleteDataRow('sounds', getRowIndexById('sounds', sound_data.id));
					reInitCellSectionContent();
				}
				else
				{
					alert(lr('cannot_delete_dependance', new Object({frames: depending_frames.join(', ')})));
				}
			}, false);
			inner_cell.appendChild(delete_button);
			
			var name_input = createFormElement('string', sound_data.name);
			name_input.setAttribute('data-locale-placeholder', 'sound_name_hint');
			registerEventHandler(name_input, 'change', function()
			{
				outer_cell.getData().name = name_input.getValue();
			}, false);
			var name = createLabel(name_input, 'sound_name');
			inner_cell.appendChild(name);
			
			var path_div = document.createElement('div');
			
				var path_radio = createFormElement('sound_file_source', sound_data.external);
				
				registerEventHandler(path_radio, 'change', function(e)
				{
					var sound_data = outer_cell.getData();
					
					sound_data.external = this.getValue();
					
					if(sound_data.external)
					{
						path_input_label.style.display = '';
						path_select_label.style.display = 'none';
						sound_data.path = path_input.getValue();
					}
					else
					{
						path_input_label.style.display = 'none';
						path_select_label.style.display = '';
						sound_data.path = path_select.getValue();
					}
				}, false);
				
				path_div.appendChild(path_radio);
				
				var path_select = createFormElement('default_sound', sound_data.external ? '' : sound_data.path);
				registerEventHandler(path_select, 'change', function()
				{
					var sound_data = outer_cell.getData();
					sound_data.path = path_select.getValue();
				}, false);
				var path_select_label = createLabel(path_select, 'sound_track');
				
				if(sound_data.external)
				{
					path_select_label.style.display = 'none';
				}
				path_div.appendChild(path_select_label);
				
				
				var path_input = createFormElement('sound_uri', sound_data.external ? sound_data.path : '');
				
				registerEventHandler(path_input, 'change', function()
				{
					var sound_data = outer_cell.getData();
					sound_data.path = path_input.getValue();
				}, false);
				var path_input_label = createLabel(path_input, 'sound_uri');
				
				if(!sound_data.external)
				{
					path_input_label.style.display = 'none';
				}
				path_div.appendChild(path_input_label);
			
			inner_cell.appendChild(path_div);
			
			var volume_input = createFormElement('percent', sound_data.volume);
			volume_input.setAttribute('data-locale-placeholder', 'sound_volume_hint');
			registerEventHandler(volume_input, 'change', function()
			{
				outer_cell.getData().volume = volume_input.getValue();
			}, false);
			var volume = createLabel(volume_input, 'sound_volume');
			inner_cell.appendChild(volume);
			
	translateNode(outer_cell);
	
	outer_cell.getData = function()
	{
		return getRowById('sounds', sound_data.id);
	};
	
	return outer_cell;
}

function getSoundInsertRow()
{
	//generate insert link
	var insert_link = document.createElement('div');
	addClass(insert_link, 'last insert');
	insert_link.setAttribute('data-locale-content', 'add_sound');
	
	registerEventHandler(insert_link, 'click', function(){
		createAndInsertDataRow('sounds');
		reInitCellSectionContent();
	}, false);
	
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'audio-cell';
	outer_row.appendChild(insert_link);
	
	translateNode(outer_row);
	
	return outer_row;
}

//EXPORTED VARIABLES
var sounds_section_descriptor;

//EXPORTED FUNCTIONS
function initSoundsTab(section, content_div)
{
	setCellSectionDisplay(section, content_div);
	initCellSectionContent(sounds_section_descriptor);
}

//END OF MODULE
Modules.complete('editor_sounds');
