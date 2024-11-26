"use strict";
/*
Ace Attorney Online - Editor frame rows data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_popups',
	dependencies : ['trial', 'nodes', 'events', 'form_elements', 'editor_form_framedata', 'editor_cell_section', 'editor_locate_depending'],
	init : function() 
	{
		if(!trial_data)
		{
			//if no trial data has been loaded, editor won't run anyway
			return;
		}
		
		popups_section_descriptor = new Object({
			list : trial_data.popups,
			offset : 1,
			generator : getPopupRow,
			insert_generator: getPopupInsertRow
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

function getPopupRow(popup_index)
{
	var popup_data = trial_data.popups[popup_index];
	
	//Outer row
	var outer_cell = document.createElement('div');
	outer_cell.className = 'popups-cell';
		
		//generate insert-before link
		var insert_link = document.createElement('a');
		addClass(insert_link, 'insert');
		var insert_link_text = document.createElement('span');
		insert_link_text.setAttribute('data-locale-content', 'add_popup');
		
		insert_link.appendChild(insert_link_text);
		translateNode(insert_link);
		
		registerEventHandler(insert_link, 'click', function()
		{
			createAndInsertDataRow('popups', getRowIndexById('popups', popup_data.id));
			reInitCellSectionContent();
		}, false);
		outer_cell.appendChild(insert_link);
	
		//Inner row
		var inner_cell = document.createElement('div');
		addClass(inner_cell, 'popups-elt');
		inner_cell.id = 'popup_'+popup_data.id;
		outer_cell.appendChild(inner_cell);
		
			//Id box
			var small = document.createElement('small');
			setNodeTextContents(small, popup_data.id);
			inner_cell.appendChild(small);
			
			// Delete button
			var delete_button = document.createElement('button');
			addClass(delete_button, 'box-delete');
			delete_button.setAttribute('data-locale-content', 'delete');
			registerEventHandler(delete_button, 'click', function()
			{
				var depending_frames = getFramesDependingOnPopup(popup_data.id);
				
				if(depending_frames.length == 0)
				{
					deleteDataRow('popups', getRowIndexById('popups', popup_data.id));
					reInitCellSectionContent();
				}
				else
				{
					alert(lr('cannot_delete_dependance', new Object({frames: depending_frames.join(', ')})));
				}
			}, false);
			inner_cell.appendChild(delete_button);
			
			// Popup preview
			var preview_picture = new Image();
			addClass(preview_picture, 'popup-preview');
			preview_picture.src = getPopupDescriptor(new Object({popup_id: popup_data.id})).uri;
			inner_cell.appendChild(preview_picture);
			
			// Popup name
			var name_input = createFormElement('string', popup_data.name);
			name_input.setAttribute('data-locale-placeholder', 'popup_name_hint');
			registerEventHandler(name_input, 'change', function()
			{
				outer_cell.getData().name = name_input.getValue();
			}, false);
			var name = createLabel(name_input, 'popup_name');
			inner_cell.appendChild(name);
			
			var path_div = document.createElement('div');
			
				var path_radio = createFormElement('cr_icon_source', popup_data.external);
				
				registerEventHandler(path_radio, 'change', function(e)
				{
					var popup_data = outer_cell.getData();
					
					popup_data.external = this.getValue();
					
					if(popup_data.external)
					{
						path_input_label.style.display = '';
						path_select_label.style.display = 'none';
						popup_data.path = path_input.getValue();
					}
					else
					{
						path_input_label.style.display = 'none';
						path_select_label.style.display = '';
						popup_data.path = path_select.getValue();
					}
					
					preview_picture.src = getPopupDescriptor(new Object({popup_id: popup_data.id})).uri;
				}, false);
				
				path_div.appendChild(path_radio);
				
				var path_select = createFormElement('default_popup', popup_data.external ? '' : popup_data.path);
				registerEventHandler(path_select, 'change', function()
				{
					var popup_data = outer_cell.getData();
					popup_data.path = path_select.getValue();
					preview_picture.src = getPopupDescriptor(new Object({popup_id: popup_data.id})).uri;
				}, false);
				var path_select_label = createLabel(path_select, 'popup_image');
				
				if(popup_data.external)
				{
					path_select_label.style.display = 'none';
				}
				path_div.appendChild(path_select_label);
				
				
				var path_input = createFormElement('image_uri', popup_data.external ? popup_data.path : '');
				
				registerEventHandler(path_input, 'change', function()
				{
					var popup_data = outer_cell.getData();
					popup_data.path = path_input.getValue();
					preview_picture.src = getPopupDescriptor(new Object({popup_id: popup_data.id})).uri;
				}, false);
				var path_input_label = createLabel(path_input, 'popup_uri');
				
				if(!popup_data.external)
				{
					path_input_label.style.display = 'none';
				}
				path_div.appendChild(path_input_label);
			
			inner_cell.appendChild(path_div);
						
	translateNode(outer_cell);
	
	outer_cell.getData = function()
	{
		return getRowById('popups', popup_data.id);
	};
	
	return outer_cell;
}

function getPopupInsertRow()
{
	//generate insert link
	var insert_link = document.createElement('div');
	addClass(insert_link, 'last insert');
	insert_link.setAttribute('data-locale-content', 'add_popup');
	
	registerEventHandler(insert_link, 'click', function(){
		createAndInsertDataRow('popups');
		reInitCellSectionContent();
	}, false);
	
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'popups-cell';
	outer_row.appendChild(insert_link);
	
	translateNode(outer_row);
	
	return outer_row;
}

//EXPORTED VARIABLES
var popups_section_descriptor;

//EXPORTED FUNCTIONS
function initPopupsTab(section, content_div)
{
	setCellSectionDisplay(section, content_div);
	initCellSectionContent(popups_section_descriptor);
}

//END OF MODULE
Modules.complete('editor_popups');
