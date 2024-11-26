"use strict";
/*
Ace Attorney Online - Editor music rows data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_music',
	dependencies : ['trial', 'nodes', 'events', 'form_elements', 'editor_cell_section', 'editor_locate_depending'],
	init : function() 
	{
		if(!trial_data)
		{
			//if no trial data has been loaded, editor won't run anyway
			return;
		}
		
		music_section_descriptor = new Object({
			list : trial_data.music,
			offset : 1,
			generator : getMusicRow,
			insert_generator: getMusicInsertRow
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

function getMusicRow(music_index)
{
	var music_data = trial_data.music[music_index];
	
	//Outer row
	var outer_cell = document.createElement('div');
	outer_cell.className = 'audio-cell';
		
		//generate insert-before link
		var insert_link = document.createElement('a');
		addClass(insert_link, 'insert');
		var insert_link_text = document.createElement('span');
		insert_link_text.setAttribute('data-locale-content', 'add_music');
		insert_link.appendChild(insert_link_text);
		translateNode(insert_link);
	
		registerEventHandler(insert_link, 'click', function()
		{
			createAndInsertDataRow('music', getRowIndexById('music', music_data.id));
			reInitCellSectionContent();
		}, false);
		outer_cell.appendChild(insert_link);
	
		//Inner row
		var inner_cell = document.createElement('div');
		addClass(inner_cell, 'audio-elt');
		inner_cell.id = 'music_'+music_data.id;
		outer_cell.appendChild(inner_cell);
		
			//Id box
			var small = document.createElement('small');
			setNodeTextContents(small, music_data.id);
			inner_cell.appendChild(small);
			
			var delete_button = document.createElement('button');
			addClass(delete_button, 'box-delete');
			delete_button.setAttribute('data-locale-content', 'delete');
			registerEventHandler(delete_button, 'click', function()
			{
				var depending_frames = getFramesDependingOnMusic(music_data.id);
				
				if(depending_frames.length == 0)
				{
					deleteDataRow('music', getRowIndexById('music', music_data.id));
					reInitCellSectionContent();
				}
				else
				{
					alert(lr('cannot_delete_dependance', new Object({frames: depending_frames.join(', ')})));
				}
			}, false);
			inner_cell.appendChild(delete_button);
			
			var name_input = createFormElement('string', music_data.name);
			name_input.setAttribute('data-locale-placeholder', 'music_name_hint');
			registerEventHandler(name_input, 'change', function()
			{
				outer_cell.getData().name = name_input.getValue();
			}, false);
			var name = createLabel(name_input, 'music_name');
			inner_cell.appendChild(name);
			
			var path_div = document.createElement('div');
			
				var path_radio = createFormElement('sound_file_source', music_data.external);
				
				registerEventHandler(path_radio, 'change', function(e)
				{
					var music_data = outer_cell.getData();
					
					music_data.external = this.getValue();
					
					if(music_data.external)
					{
						path_input_label.style.display = '';
						path_select_label.style.display = 'none';
						music_data.path = path_input.getValue();
					}
					else
					{
						path_input_label.style.display = 'none';
						path_select_label.style.display = '';
						music_data.path = path_select.getValue();
					}
				}, false);
				
				path_div.appendChild(path_radio);
				
				var path_select = createFormElement('default_music', music_data.external ? '' : music_data.path);
				registerEventHandler(path_select, 'change', function()
				{
					var music_data = outer_cell.getData();
					music_data.path = path_select.getValue();
					var loop_val = music_data.path in default_loop_start ? default_loop_start[music_data.path] : 0; 
					loop_start_input.setValue(loop_val);
				}, false);
				var path_select_label = createLabel(path_select, 'music_track');
				
				if(music_data.external)
				{
					path_select_label.style.display = 'none';
				}
				path_div.appendChild(path_select_label);
				
				
				var path_input = createFormElement('sound_uri', music_data.external ? music_data.path : '');
				
				registerEventHandler(path_input, 'change', function()
				{
					var music_data = outer_cell.getData();
					music_data.path = path_input.getValue();
				}, false);
				var path_input_label = createLabel(path_input, 'music_uri');
				
				if(!music_data.external)
				{
					path_input_label.style.display = 'none';
				}
				path_div.appendChild(path_input_label);
			
			inner_cell.appendChild(path_div);
			
			var volume_input = createFormElement('percent', music_data.volume);
			volume_input.setAttribute('data-locale-placeholder', 'music_volume_hint');
			registerEventHandler(volume_input, 'change', function()
			{
				outer_cell.getData().volume = volume_input.getValue();
			}, false);
			var volume = createLabel(volume_input, 'music_volume');
			inner_cell.appendChild(volume);
			
			var loop_start_input = createFormElement('integer', music_data.loop_start);
			loop_start_input.setAttribute('data-locale-placeholder', 'music_loop_start_hint');
			registerEventHandler(loop_start_input, 'change', function()
			{
				outer_cell.getData().loop_start = loop_start_input.getValue();
			}, false);
			var loop_start = createLabel(loop_start_input, 'music_loop_start');
			inner_cell.appendChild(loop_start);
			
	translateNode(outer_cell);
	
	outer_cell.getData = function()
	{
		return getRowById('music', music_data.id);
	};
	
	return outer_cell;
}

function getMusicInsertRow()
{
	//generate insert link
	var insert_link = document.createElement('div');
	addClass(insert_link, 'last insert');
	insert_link.setAttribute('data-locale-content', 'add_music');
	
	registerEventHandler(insert_link, 'click', function(){
		createAndInsertDataRow('music');
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
var music_section_descriptor;

//EXPORTED FUNCTIONS
function initMusicTab(section, content_div)
{
	setCellSectionDisplay(section, content_div);
	initCellSectionContent(music_section_descriptor);
}

//END OF MODULE
Modules.complete('editor_music');
