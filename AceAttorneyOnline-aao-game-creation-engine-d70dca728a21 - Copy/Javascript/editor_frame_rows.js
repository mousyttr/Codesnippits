"use strict";
/*
Ace Attorney Online - Editor frame rows data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_frame_rows',
	dependencies : ['editpanels', 'editor_actions', 'display_engine_screen', 'display_engine_text', 'frame_data', 'nodes', 'events', 'form_elements', 'editor_form_framedata', 'editor_form_storyboard', 'editor_form_sound', 'actions_parameters', 'objects', 'expression_engine', 'var_environments'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS

/*
A preset frame is a frame data row with arbitrary content (and a null id) that can be inserted instead of an empty frame where needed.
The frame ID will be set at insertion time.
*/
var preset_frames = [];

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
/*
Returns a frame row.
A frame row is the element displayed in-editor that represents a single frame.
rowBehaviour contains the following properties, that can be defined differently for each row:
	- row_class : specific classes to apply to the row
	- insert_fct : the function to insert a frame before - null if insertion not supported.
		If not null, this function must accept 1 optional argument, which is the frame data to insert. If argument is null, create a new frame.
	- block_insert_enabled : if true, block insert menu will be added
	- delete_fct : the function to delete the frame - null if deletion not supported
	- flow_controls_enabled : if true, wait and merge controls are enabled
	- action : specific data for the action

WARNING : row contents are not complete until populateFrameRow is called.
*/
function getFrameRow(frame_data, rowBehaviour)
{
	// Generate outer row
	var outer_row = document.createElement('div');
	outer_row.className = 'storyboard-row ' + (rowBehaviour.row_class ? rowBehaviour.row_class : '');
	
	// Attach data required to populate the row
	outer_row.getData = function()
	{
		return getRowById('frames', frame_data.id);
	};
	outer_row.rowBehaviour = rowBehaviour;
	
	
	// Start actual content generation logic.
	
	
	//If frame is merged, apply class to the row
	if(frame_data.merged_to_next)
	{
		addClass(outer_row, 'merged');
	}
	
	
		if(rowBehaviour.insert_fct)
		{
			// If insertion function given, add insert row
			
			// Allow dropping : if you can insert, you can also drop.
			outer_row.setAttribute('drop-target', 1);
			
			//generate insert-before link
			var insert_link = document.createElement('a');
			addClass(insert_link, 'insert');
			insert_link.setAttribute('data-locale-content', 'add_frame');
			registerEventHandler(insert_link, 'click', rowBehaviour.insert_fct.bind(undefined, null), false);
			
			translateNode(insert_link);
			outer_row.appendChild(insert_link);
		}
	
		//Inner row
		var inner_row = document.createElement('div');
		addClass(inner_row, 'frame');
		inner_row.id = 'frame_'+frame_data.id;
		outer_row.appendChild(inner_row);
		
			//Id box
			var small = document.createElement('small');
			setNodeTextContents(small, frame_data.id);
			inner_row.appendChild(small);
			
			//Screen cell
			var screen = document.createElement('div'); 
			addClass(screen, 'frame-screen');
			inner_row.appendChild(screen);
				
				//Insert a light screen preview until frame is populated
				var preview_screen = lightScreenPreview(frame_data);
				screen.appendChild(preview_screen);
			
			//Audio cell
			var audio = document.createElement('div');
			addClass(audio, 'frame-audio');
			inner_row.appendChild(audio);
			
				var music = document.createElement('div');
				addClass(music, 'music_cell');
				audio.appendChild(music);
				
				var sfx = document.createElement('div');
				addClass(sfx, 'sfx_cell');
				audio.appendChild(sfx);
			
			
			//Dialogue cell
			var dialogue = document.createElement('div'); 
			addClass(dialogue, 'frame-dialogue');
			inner_row.appendChild(dialogue);
			
				var textbox = document.createElement('div'); 
				addClass(textbox, 'textbox');
				addClass(textbox, 'bottom');
				dialogue.appendChild(textbox);
				
					var speaker_name = getSpeakerName(frame_data);
					
					var dialogue_name = document.createElement('div'); 
					addClass(dialogue_name, 'name');
					setNodeTextContents(dialogue_name, speaker_name);
					textbox.appendChild(dialogue_name);
					
					var dialogue_sync = document.createElement('div');
					addClass(dialogue_sync, 'sync');
					textbox.appendChild(dialogue_sync);
					
					var dialogue_dialogue = createFormElement('text', frame_data.text_content);
					addClass(dialogue_dialogue, 'dialogue');
					dialogue_dialogue.style.color = frame_data.text_colour;
					dialogue_dialogue.setColour = function(value)
					{
						this.style.color = value;
						outer_row.getData().text_colour = value;
					};
					dialogue_dialogue.insertText = function(text)
					{
						if(!isNaN(this.selectionStart))
						{
							//if the cursor is somewhere in the text area, insert there
							var sel_start = this.selectionStart;
							var currVal = this.getValue();
							this.setValue(currVal.substr(0, sel_start) + text + currVal.substr(sel_start));
							this.selectionStart = sel_start + text.length;
						}
						else
						{
							//else, insert at the end
							this.setValue(this.getValue() + text);
						}
					};
					dialogue_dialogue.wrapSelectedText = function(text_before, text_after)
					{
						if(!isNaN(this.selectionStart) && !isNaN(this.selectionEnd))
						{
							//if something is selected in the textarea, wrap it.
							var sel_start = this.selectionStart;
							var sel_end = this.selectionEnd;
							var currVal = this.getValue();
							this.setValue(currVal.substring(0, sel_start) + text_before + currVal.substring(sel_start, sel_end) + text_after + currVal.substring(sel_end));
							this.selectionStart = sel_start + text_before.length;
							this.selectionEnd = sel_end + text_before.length;
						}
						else
						{
							//else, insert at the end
							this.setValue(this.getValue() + text_before + text_after);
						}	
					};
					
					//update data when editing
					registerEventHandler(dialogue_dialogue, 'change', function()
					{
						outer_row.getData().text_content = dialogue_dialogue.getValue();
					}, false);
					textbox.appendChild(dialogue_dialogue);
			
			var dialogue_controls = document.createElement('div'); 
			addClass(dialogue_controls, 'frame-controls');
			inner_row.appendChild(dialogue_controls);
			
			//Controls cell
			var controls = document.createElement('div');
			addClass(controls, 'frame-controls');
			inner_row.appendChild(controls);
			
			if(rowBehaviour.delete_fct)
			{
				// If row has a delete function, add delete button
				var delete_button = document.createElement('button');
				addClass(delete_button, 'box-delete');
				delete_button.setAttribute('data-locale-content', 'delete');
				
				registerEventHandler(delete_button, 'click', rowBehaviour.delete_fct, false);
				
				translateNode(delete_button);
				inner_row.appendChild(delete_button);
			}
			
			//Action cell
			var action = document.createElement('div'); 
			addClass(action, 'frame-action');
			inner_row.appendChild(action);
			
			var action_name;
			var action_edit;
			var action_links;
			if(rowBehaviour.action.type == 'contradiction')
			{
				action_name = document.createElement('div');
				action_name.setAttribute('data-locale-content', 'contradicts');
				addClass(action_name, 'action_name');
				action.appendChild(action_name);
				
				action_edit = document.createElement('button');
				action_edit.setAttribute('data-locale-content', 'expand');
				addClass(action_edit, 'action_edit');
				action.appendChild(action_edit);
				
				action_links = document.createElement('ul');
				addClass(action_links, 'action_links');
				action.appendChild(action_links);
			}
			else
			{
				action_name = document.createElement('div');
				if(frame_data.action_name)
				{
					setNodeTextContents(action_name, l('action_' +frame_data.action_name));
				}
				else
				{
					setNodeTextContents(action_name, '');
				}
				addClass(action_name, 'action_name');
				action.appendChild(action_name);
				
				action_edit = document.createElement('button');
				action_edit.setAttribute('data-locale-content', 'set_action');
				addClass(action_edit, 'action_edit');
				action.appendChild(action_edit);
				
				action_links = document.createElement('ul');
				addClass(action_links, 'action_links');
				action.appendChild(action_links);
			}
			
			translateNode(action);
	
	//Add data about population status
	outer_row.populationStatus = new Object({
		special_inserts: null,
		special_inserts_set: false,
		
		handle: small,
		handle_event_set: false,
		
		screen_cell: screen,
		screen_editor_set: false,
		screen_preview: null,
		
		music_cell: music,
		music_editor_set: false,
		
		sound_cell: sfx,
		sound_editor_set: false,
		
		dialogue_cell: dialogue,
		dialogue_name: dialogue_name,
		dialogue_sync: dialogue_sync,
		dialogue_dialogue: dialogue_dialogue,
		dialogue_editor_set: false,
		dialogue_preview_set: false,
		
		dialogue_controls_cell: dialogue_controls,
		
		controls_cell: controls,
		
		action_cell: action,
		action_name: action_name,
		action_links: action_links,
		action_edit: action_edit,
		action_edit_set: false
	});
	
	outer_row.setAttribute('data-filled', 0);
	
	return outer_row;
}

// Generate the row contents from the actual data
function populateFrameRow(row)
{
	var frame_data = row.getData();
	var rowBehaviour = row.rowBehaviour;
	var status = row.populationStatus;
	
	// Block insert select
	if(!status.special_inserts_set)
	{
		status.special_inserts = [];
		
		if(rowBehaviour.insert_fct)
		{
			// If insertion function given, allow inserting preset frames.
			var insert_preset_select = createFormElement('frame_preset', '', { presets: preset_frames });
			addClass(insert_preset_select, 'insert-preset-select');
			addClass(insert_preset_select, 'insert');
			registerEventHandler(insert_preset_select, 'change', function() {
				var frame_index = getRowIndexById('frames', frame_data.id);
				var new_frame_data = row.getData();
				var clicked_value = insert_preset_select.getValue();
				
				switch(clicked_value)
				{
					case '':
						break;
					
					case 'save' :
						insert_preset_select.setValue('');
						
						// Save frame as a preset.
						var new_preset = objClone(new_frame_data);
						new_preset.id = null;
						preset_frames.push(new_preset);
						
						refreshDisplayedRows();
						
						break;
						
					default :
					
						insert_preset_select.setValue('');
						
						// Insert the selected preset.
						rowBehaviour.insert_fct(preset_frames[clicked_value]);
						
						break;
				}
			}, false);
			translateNode(insert_preset_select);
			row.insertBefore(insert_preset_select, row.firstChild);
			status.special_inserts.push(insert_preset_select);
		}
		
		if(rowBehaviour.block_insert_enabled)
		{
			//generate insert block before menu
			var insert_block_select = createFormElement('block_type');
			addClass(insert_block_select, 'insert-block-select');
			addClass(insert_block_select, 'insert');
			registerEventHandler(insert_block_select, 'change', function() {
				var frame_index = getRowIndexById('frames', frame_data.id);
				
				switch(insert_block_select.getValue())
				{
					case '':
						break;
					
					case 'ce' :
						insert_block_select.setValue('');
						
						//Create the real data for the CE
						createNewCrossExamination(frame_index);
						//Update the row map
						updateSectionRowMap();
						break;
					
					case 'scene' :
						insert_block_select.setValue('');
						
						//Create the real data for the scene
						createNewScene(frame_index);
						//Update the row map
						updateSectionRowMap();
						break;
						
					default :
						break;
				}
			}, false);
			translateNode(insert_block_select);
			row.insertBefore(insert_block_select, row.firstChild);
			status.special_inserts.push(insert_block_select);
		}
		status.special_inserts_set = true;
	}
	
	// Drag and drop handle
	if(!status.handle_event_set)
	{
		if(rowBehaviour.delete_fct)
		{
			// If you can delete the frame, you can drag it away.
			addClass(status.handle, 'draggable');
			
			registerEventHandler(status.handle, 'mousedown', function(mousedownEvent) {
				addClass(document.body, 'dragging');
				addClass(row, 'drag-source');
				
				registerEventHandler(document.body, 'mouseover', function(mouseoverEvent) {
					mouseoverEvent.preventDefault();
					mouseoverEvent.stopPropagation();
					return false;
				}, true);
				
				registerEventHandler(document.body, 'mouseup', function(mouseupEvent) {
					// Determine if the evend was fired on a drop target
					var drop_target = mouseupEvent.target;
					while(drop_target.tagName && (drop_target.getAttribute('drop-target') != 1))
					{
						drop_target = drop_target.parentNode;
					}
					
					if(drop_target.tagName)
					{
						// If on a drop target...
						var moved_frame_data = row.getData();
						if(moved_frame_data.id != drop_target.getData().id)
						{
							// ...AND the target frame for the insertion is not the one being deleted, proceed.
							// (otherwise, not only is the dropping useless but this would be harmful : it would delete the frame used as a beacon for insertion...)
							row.rowBehaviour.delete_fct();
							drop_target.rowBehaviour.insert_fct(moved_frame_data);
						}
					}
					
					// Whether the move has been completed or not, stop dragging.
					removeClass(row, 'drag-source');
					removeClass(document.body, 'dragging');
					
					unregisterEvent(document.body, 'mouseover');
					unregisterEvent(document.body, 'mouseup');
				}, false);
				
				mousedownEvent.preventDefault();
				return false;
			}, false);
		}
		
		status.handle_event_set = true;
	}
	
	// Screen cell
	if(!status.screen_editor_set)
	{
		//Add the screen minieditor on hover
		registerEventHandler(status.screen_cell, 'mouseover', function()
		{
			miniEditorBuild(status.screen_cell, function()
			{
				return screenMiniEditor(row);
			});
		}, false);
		
		status.screen_editor_set = true;
	}
	if(!status.screen_preview)
	{
		emptyNode(status.screen_cell);
		
		var preview_screen = new ScreenDisplay();
		addClass(preview_screen.render, 'half-size');
		status.screen_cell.appendChild(preview_screen.render);
		
		status.screen_preview = preview_screen;
	}
	status.screen_preview.loadFrameGraphics(frame_data, true);
	
	// Music cell
	if(!status.music_editor_set)
	{
		registerEventHandler(status.music_cell, 'mouseover', function()
		{
			miniEditorBuild(status.music_cell, function()
			{
				return musicMiniEditor(status.music_cell, row.getData(), row);
			});
		}, false);
		
		status.music_editor_set = true;
	}
	
	emptyNode(status.music_cell);
	var music_title = document.createElement('span');
	switch(frame_data.music)
	{
		case MUSIC_STOP :
			if(frame_data.music_fade) {
				setNodeTextContents(music_title, l('music_row_fadeout'));
				removeClass(status.music_cell, 'stop');
			} else {
				setNodeTextContents(music_title, l('stop'));
				addClass(status.music_cell, 'stop');
			}
			removeClass(status.music_cell, 'set');
			break;
		
		case MUSIC_UNCHANGED :
			setNodeTextContents(music_title, l('unchanged'));
			removeClass(status.music_cell, 'stop');
			removeClass(status.music_cell, 'set');
			break;
			
		default :
			if(frame_data.music_fade) {
				setNodeTextContents(music_title, l('music_row_crossfade') + getRowById('music', frame_data.music).name);
			} else {
				setNodeTextContents(music_title, getRowById('music', frame_data.music).name);
			}
			removeClass(status.music_cell, 'stop');
			addClass(status.music_cell, 'set');
			break;
	}
	status.music_cell.appendChild(music_title);
	
	// Sound cell
	if(!status.sound_editor_set)
	{
		registerEventHandler(status.sound_cell, 'mouseover', function()
		{
			miniEditorBuild(status.sound_cell, function()
			{
				return soundMiniEditor(status.sound_cell, row.getData(), row);
			});
		}, false);
		
		status.sound_editor_set = true;
	}
	
	emptyNode(status.sound_cell);
	switch(frame_data.sound)
	{
		case SOUND_NONE :
			var sound_title = document.createElement('span');
			setNodeTextContents(sound_title, l('none'));
			status.sound_cell.appendChild(sound_title);
			
			removeClass(status.sound_cell, 'set');
			break;
		
		default :
			var sound_title = document.createElement('span');
			setNodeTextContents(sound_title, getRowById('sounds', frame_data.sound).name);
			status.sound_cell.appendChild(sound_title);
			
			addClass(status.sound_cell, 'set');
			break;
	}
	
	// Text cell
	if(!status.dialogue_editor_set)
	{
		registerEventHandler(status.dialogue_dialogue, 'focus', function()
		{
			miniEditorBuild(status.dialogue_cell, function()
			{
				return textMiniEditor(status.dialogue_dialogue, row.getData());
			}, status.dialogue_dialogue);
		}, false);
		
		status.dialogue_editor_set = true;
	}
	if(!status.dialogue_preview_set)
	{
		var text_preview_toggle = createFormElement('checkbox');
		var text_preview_toggle_label = createLabel(text_preview_toggle, 'text_preview');
		var text_preview_screen;
		registerEventHandler(text_preview_toggle, 'change', function(){
			if(text_preview_screen)
			{
				status.dialogue_cell.removeChild(text_preview_screen.render);
				text_preview_screen = null;
			}
			
			if(text_preview_toggle.getValue())
			{
				text_preview_screen = new TextDisplay();
				addClass(text_preview_screen.render, 'text_preview');
				status.dialogue_cell.insertBefore(text_preview_screen.render, text_preview_toggle_label);
				text_preview_screen.setInstantMode(true);
				text_preview_screen.loadFrameText(row.getData());
			}
		}, false);
		
		status.dialogue_cell.appendChild(text_preview_toggle_label);
		
		status.dialogue_preview_set = true;
	}
	fillFrameSpeaker(status.dialogue_name, status.dialogue_sync, frame_data, row);
	
	// Dialogue controls cell
	emptyNode(status.dialogue_controls_cell);
	var voice_select = createFormElement('voice_mode', frame_data.speaker_voice);
	registerEventHandler(voice_select, 'change', function(){
		row.getData().speaker_voice = voice_select.getValue();
	}, false);
	status.dialogue_controls_cell.appendChild(createLabel(voice_select, 'voice'));

	var speed_input = createFormElement('posfloat', frame_data.text_speed);
		registerEventHandler(speed_input, 'change', function(){
			row.getData().text_speed = speed_input.getValue();
		}, false);
	status.dialogue_controls_cell.appendChild(createLabel(speed_input, 'text_speed'));
	
	// Controls cell
	emptyNode(status.controls_cell);
	var hidden_field = createFormElement('checkbox', frame_data.hidden);
	registerEventHandler(hidden_field, 'change', function()
	{
		row.getData().hidden = hidden_field.getValue();
	}, false);
	var hidden = createLabel(hidden_field, 'hidden');
	status.controls_cell.appendChild(hidden);
	
	if(rowBehaviour.flow_controls_enabled)
	{
		var timer_field = createFormElement('natural', frame_data.wait_time);
		timer_field.setAttribute('data-locale-placeholder', 'timer_hint');
		registerEventHandler(timer_field, 'change', function()
		{
			row.getData().wait_time = timer_field.getValue();
		}, false);
		var timer = createLabel(timer_field, 'timer');
		status.controls_cell.appendChild(timer);
		
		if(frame_data.merged_to_next)
		{
			// Timer field should be disabled on merged frames.
			timer_field.disabled = true;
		}
		
		var merged_field = createFormElement('checkbox', frame_data.merged_to_next);
		registerEventHandler(merged_field, 'change', function()
		{
			var value = merged_field.getValue();
			row.getData().merged_to_next = value;
			if(value)
			{
				addClass(row, 'merged');
				timer_field.setValue(0);
				timer_field.disabled = true;
			}
			else
			{
				removeClass(row, 'merged');
				timer_field.disabled = false;
			}
		}, false);
		var merged = createLabel(merged_field, 'merged');
		status.controls_cell.appendChild(merged);
	}
	
	translateNode(status.controls_cell);
	
	// Action cell
	if(!status.action_edit_set)
	{
		if(rowBehaviour.action.type == 'contradiction')
		{
			registerEventHandler(status.action_edit, 'click', function()
			{
				if(hasClass(status.action_cell, 'expanded'))
				{
					removeClass(status.action_cell, 'expanded');
					status.action_edit.setAttribute('data-locale-content', 'expand');
				}
				else
				{
					addClass(status.action_cell, 'expanded');
					status.action_edit.setAttribute('data-locale-content', 'collapse');
				}
				
				translateNode(status.action_edit);
			}, false);
		}
		else
		{
			registerEventHandler(status.action_edit, 'click', function()
			{
				var context = objClone(rowBehaviour.action.context || new Object({}));
				if(!frame_data.merged_to_next) 
				{
					context.not_merged = prefixRawParameters(true);
				}
				editorBuild(actionEditor(row, context), status.action_cell);
			}, false);
		}
		status.action_edit_set = true;
	}
	
	if(rowBehaviour.action.type == 'contradiction')
	{
		emptyNode(status.action_links);
		
		for(var i = 0; i < rowBehaviour.action.contradictions.length; i++)
		{
			var contrad_row = document.createElement('li');
			contrad_row.contrad_index = i;
			
			var cr_select = createFormElement('cr_element_descriptor');
			if(rowBehaviour.action.contradictions[i].contrad_elt)
			{
				//If contradictory element is not null, select it in the list
				cr_select.setValue(rowBehaviour.action.contradictions[i].contrad_elt);
			}
			else
			{
				//If it's null, then apply the default value from the list
				rowBehaviour.action.contradictions[i].contrad_elt = cr_select.getValue();
			}
			var cr_select_label = createLabel(cr_select, 'contrad_element');
			contrad_row.appendChild(cr_select_label);
			
			registerEventHandler(cr_select, 'change', (function(contrad_row)
			{
				var contrad = rowBehaviour.action.contradictions[contrad_row.contrad_index];
				contrad.contrad_elt = this.getValue();
			}).bind(cr_select, contrad_row), false);
			
			var dest_select = createFormElement('frame_descriptor', rowBehaviour.action.contradictions[i].destination);
			var dest_select_label = createLabel(dest_select, 'contrad_redirects_to');
			contrad_row.appendChild(dest_select_label);
			
			registerEventHandler(dest_select, 'change', (function(contrad_row)
			{
				var contrad = rowBehaviour.action.contradictions[contrad_row.contrad_index];
				contrad.destination = this.getValue();
			}).bind(dest_select, contrad_row), false);
			
			var del_contrad_button = document.createElement('button');
			del_contrad_button.setAttribute('data-locale-content', 'del_contradiction');
			contrad_row.appendChild(del_contrad_button);
			
			registerEventHandler(del_contrad_button, 'click', (function(contrad_row)
			{
				rowBehaviour.action.contradictions.splice(contrad_row.contrad_index, 1);
				populateFrameRow(row);
			}).bind(del_contrad_button, contrad_row), false);
			
			status.action_links.appendChild(contrad_row);
		}
		
		var add_contrad_row = document.createElement('li');
		
		var add_contrad_button = document.createElement('button');
		add_contrad_button.setAttribute('data-locale-content', 'add_contradiction');
		add_contrad_row.appendChild(add_contrad_button);
		
		registerEventHandler(add_contrad_button, 'click', function()
		{
			var contrad = createDataRow('contradiction');
			rowBehaviour.action.contradictions.push(contrad);
			populateFrameRow(row);
		}, false);
		
		status.action_links.appendChild(add_contrad_row);
		
		translateNode(status.action_links);
	}
	else
	{
		if(frame_data.action_name)
		{
			setNodeTextContents(status.action_name, l('action_' +frame_data.action_name));
		}
		else
		{
			setNodeTextContents(status.action_name, '');
		}
	}
	
	row.setAttribute('data-filled', 1);
}

function unpopulateFrameRow(row)
{
	var frame_data = row.getData();
	var rowBehaviour = row.rowBehaviour;
	var status = row.populationStatus;
	
	// Special inserts
	if(status.special_inserts_set)
	{
		for(var i = 0; i < status.special_inserts.length; i++)
		{
			var special_insert = status.special_inserts[i];
			special_insert.parentNode.removeChild(special_insert);
		}
		status.special_inserts_set = false;
		status.special_inserts = null;
	}
	
	// Drag and drop handle event
	if(status.handle_event_set)
	{
		unregisterEvent(status.handle, 'mousedown');
		status.handle_event_set = false;
	}
	
	// Screen cell
	if(status.screen_editor_set)
	{
		unregisterEvent(status.screen_cell, 'mouseover');
		status.screen_editor_set = false;
	}
	if(status.screen_preview)
	{
		emptyNode(status.screen_cell);
		status.screen_cell.appendChild(lightScreenPreview(frame_data));
		status.screen_preview = null;
	}
	
	// Music cell
	if(status.music_editor_set)
	{
		unregisterEvent(status.music_cell, 'mouseover');
		status.music_editor_set = false;
	}
	
	// Sound cell
	if(status.sound_editor_set)
	{
		unregisterEvent(status.sound_cell, 'mouseover');
		status.sound_editor_set = false;
	}
	
	// Dialogue cell
	if(status.dialogue_editor_set)
	{
		unregisterEvent(status.dialogue_dialogue, 'focus');
		status.dialogue_editor_set = false;
	}
	
	// Dialogue controls cell
	emptyNode(status.dialogue_controls_cell);
	
	// Controls cell
	emptyNode(status.controls_cell);
	
	row.setAttribute('data-filled', 0);
}

function lightScreenPreview(frame_data)
{
	
	var preview_screen = document.createElement('div');
	preview_screen.style.height = '100%';
	preview_screen.style.overflow = 'hidden';
	preview_screen.style.background = '';
	
	var place_data = getPlace(frame_data.place);
	if(place_data)
	{
		var bg_desc = getObjectDescriptor(place_data.background, 'bg_subdir');
		if('uri' in bg_desc)
		{
			preview_screen.style.backgroundImage = 'url("' + bg_desc.uri + '")';
			preview_screen.style.backgroundSize = 'cover';
			
			var position = getPosition(frame_data.place_position, place_data);
			
			switch(position.align)
			{
				case ALIGN_LEFT :
					preview_screen.style.backgroundPosition = 'left';
					break;
				
				case ALIGN_CENTER :
					preview_screen.style.backgroundPosition = 'center';
					break;
				
				case ALIGN_RIGHT : 
					preview_screen.style.backgroundPosition = 'right';
					break;
			}
		}
		else if('colour' in bg_desc)
		{
			preview_screen.style.background = bg_desc.colour;
		}
	}
	
	if(frame_data.characters.length == 1)
	{
		var char_desc = getCharacterDescriptor(frame_data.characters[0], 'still');
		if('uri' in char_desc)
		{
			var char = new Image();
			char.style.width = '100%';
			char.style.height = '100%';
			char.src = char_desc.uri;
			preview_screen.appendChild(char);
		}
	}
	else if(frame_data.characters.length > 1)
	{
		for(var i = 0; i < frame_data.characters.length; i++)
		{
			var profile_icon_uri = getProfileIconUrl(getRowById('profiles', frame_data.characters[i].profile_id));
			var char = new Image();
			char.style.width = '40px';
			char.style.height = '40px';
			char.style.margin = '2.5px';
			char.src = profile_icon_uri;
			preview_screen.appendChild(char);
		}
	}
	
	for(var i = 0; i < frame_data.popups.length; i++)
	{
		if(frame_data.popups[i].popup_id !== 0)
		{
			var popup = new Image();
			popup.style.width = '100%';
			popup.style.height = '100%';
			popup.style.position = 'absolute';
			popup.style.top = '0';
			popup.style.left = '0';
			popup.src = getPopupDescriptor(frame_data.popups[i]).uri;
			preview_screen.appendChild(popup);
		}
	}
	
	return preview_screen;
}

function fillFrameSpeaker(cell_name, cell_sync, frame_data, row)
{
	//clear previous contents and events
	unregisterAllEvents(cell_sync);
	emptyNode(cell_sync);
	unregisterAllEvents(cell_name);
	emptyNode(cell_name);
	
	if(frame_data.speaker_use_name)
	{
		//build cell for synchronised character
		addClass(cell_sync, 'active');
		
		var sync_select = createFormElement('profile_descriptor', frame_data.speaker_id, {include_unknown: false, include_judge: false});
		var sync_label = createLabel(sync_select, 'sync_with');
		cell_sync.appendChild(sync_label);
		var unsync_button = document.createElement('button');
		setNodeTextContents(unsync_button, '✕');
		cell_sync.appendChild(unsync_button);
		
		translateNode(cell_sync);
		
		registerEventHandler(sync_select, 'change', function()
		{
			frame_data.speaker_id = sync_select.getValue();
		}, false);
		
		registerEventHandler(unsync_button, 'click', function()
		{
			frame_data.speaker_name = "";
			frame_data.speaker_use_name = 0;
			fillFrameSpeaker(cell_name, cell_sync, frame_data);
		}, false);
		
		//build cell for displayed name
		var entry = createFormElement('string', getSpeakerName(frame_data));
		cell_name.appendChild(entry);
		
		registerEventHandler(entry, 'change', function()
		{
			frame_data.speaker_name = entry.getValue();
		}, false);
	}
	else
	{
		//build cell for synchronised character
		removeClass(cell_sync, 'active');
		var button_sync = document.createElement('button');
		button_sync.setAttribute('data-locale-content', 'sync_set');
		translateNode(button_sync);
		cell_sync.appendChild(button_sync);
		registerEventHandler(button_sync, 'click', function()
		{
			frame_data.speaker_name = getSpeakerName(frame_data);
			frame_data.speaker_use_name = 1;
			fillFrameSpeaker(cell_name, cell_sync, frame_data);
		}, false);
		
		//build cell for displayed name
		var speaker_select = createFormElement('profile_descriptor', frame_data.speaker_id, {include_unknown: true, include_judge: false});
		cell_name.appendChild(speaker_select);
		
		registerEventHandler(speaker_select, 'change', function()
		{
			frame_data.speaker_id = speaker_select.getValue();
			frame_data.speaker_name = getSpeakerName(frame_data);
			
			if(frame_data.place == PLACE_NONE)
			{
				frame_data.characters = [];
				populateFrameRow(row);
			}
		}, false);
	}
}

//Minieditors
function screenMiniEditor(row)
{
	var frame_data = row.getData();
	
	var place_minieditor = document.createElement('div');
	
	var place_select = createFormElement('place_descriptor', frame_data.place);
	place_minieditor.appendChild(createLabel(place_select, 'place'));
	
	var position_select = createFormElement('place_position', frame_data.place_position, {place: getPlace(frame_data.place)});
	place_minieditor.appendChild(createLabel(position_select, 'screen_position'));

	var transition_select = createFormElement('screen_transition_mode', frame_data.place_transition);
	place_minieditor.appendChild(createLabel(transition_select, 'place_transition'));
	
	registerEventHandler(place_select, 'change', function()
	{
		var new_position_select = createFormElement('place_position', frame_data.place_position, {place: getPlace(parseInt(place_select.getValue()))});
		position_select.parentNode.replaceChild(new_position_select, position_select);
		position_select = new_position_select;
		
		if(place_select.getValue() != PLACE_NONE)
		{
			// If selected an actual place, default to erasing the characters.
			frame_data.characters_erase_previous = true;
		}
	}, false);
	
	var screen_editor_button = document.createElement('button');
	addClass(screen_editor_button, 'wide');
	screen_editor_button.setAttribute('data-locale-content', 'screen_editor');
	translateNode(screen_editor_button);
	//set event to open screen edition panel
	registerEventHandler(screen_editor_button, 'click', function()
	{
		editorBuild(screenEditor(frame_data, row), screen_editor_button);
	}, false);
	place_minieditor.appendChild(screen_editor_button);
	
	place_minieditor.closeMinieditor = function()
	{
		frame_data.place = parseInt(place_select.getValue());
		frame_data.place_position = parseInt(position_select.getValue());
		frame_data.place_transition = parseInt(transition_select.getValue());
		populateFrameRow(row);
		return true;
	};
	
	return place_minieditor;
}

function musicMiniEditor(music, frame_data, row)
{
	var frame_data = row.getData();
	
	var music_minieditor = document.createElement('div');
	
	var music_select = createFormElement('music_select', frame_data.music);

	music_minieditor.appendChild(createLabel(music_select, 'music'));

	var music_editor_button = document.createElement('button');
	addClass(music_editor_button, 'wide');
	music_editor_button.setAttribute('data-locale-content', 'music_editor');
	translateNode(music_editor_button);
	registerEventHandler(music_editor_button, 'click', function()
	{
		editorBuild(musicEditor(frame_data, row), music_editor_button);
	}, false);
	music_minieditor.appendChild(music_editor_button);

	music_minieditor.closeMinieditor = function()
	{
		var value = music_select.getValue();
		var title = music_select.getTitle();
		frame_data.music = getMusicId(value, title);

		if(frame_data.music == MUSIC_UNCHANGED)
		{
			frame_data.music_fade = null;
		}
		
		populateFrameRow(row);
		
		return true;
	};
	
	return music_minieditor;
}

function getMusicId(value, title) 
{
	var int_value = parseInt(value);
	if(!int_value && int_value !== 0)
	{
		//data is not a number : it's a string corresponding to a default music track
		
		// Check if music is already used
		var music_found = false;
		for(var i = 1; !music_found && i < trial_data.music.length; i++)
		{
			if(!trial_data.music[i].external
				&& trial_data.music[i].path == value)
			{
				// If found, use its ID and return
				return trial_data.music[i].id;
			}
		}
		//otherwise, create the new music automatically
		var new_music = createDataRow('music');
		new_music.name = title;
		new_music.path = value;
		trial_data.music.push(new_music);
		
		return new_music.id;
	}
	else
	{
		return int_value;
	}
}

function soundMiniEditor(sfx, frame_data, row)
{
	var sound_minieditor = document.createElement('div');
	
	var sound_select = createFormElement('sound_select', frame_data.sound, true);
	sound_minieditor.appendChild(createLabel(sound_select, 'sound'));
	
	sound_minieditor.closeMinieditor = function()
	{
		var value = sound_select.getValue();
		var int_value = parseInt(value);
		if(!int_value && int_value !== 0)
		{
			//data is not a number : it's a string corresponding to a default sound
			
			// Check if sound is already used
			var sound_found = false;
			for(var i = 1; !sound_found && i < trial_data.sounds.length; i++)
			{
				if(!trial_data.sounds[i].external
					&& trial_data.sounds[i].path == value)
				{
					// If found, use its ID and stop iterating
					frame_data.sound = trial_data.sounds[i].id;
					sound_found = true;
				}
			}
			
			if(!sound_found)
			{
				//otherwise, create the new sound automatically
				var new_sound = createDataRow('sounds');
				new_sound.name = sound_select.getTitle();
				new_sound.path = value;
				trial_data.sounds.push(new_sound);
				
				frame_data.sound = new_sound.id;
			}
		}
		else
		{
			frame_data.sound = int_value;
		}
		
		populateFrameRow(row);
		
		return true;
	};
	
	return sound_minieditor;
}

function speakerMiniEditor(speaker, frame_data, include_unknown)
{
	var speaker_minieditor = document.createElement('div');
	
	var speaker_select = createFormElement('profile_descriptor', frame_data.speaker_id, {include_unknown: include_unknown, include_judge: false});
	speaker_minieditor.appendChild(speaker_select);
	
	speaker_minieditor.closeMinieditor = function()
	{
		frame_data.speaker_id = parseInt(speaker_select.getValue());
		
		var name = getSpeakerName(frame_data, frame_data.speaker_use_name);
		setNodeTextContents(speaker, name);
		speaker.appendChild(speaker.minieditor); 
		
		return true;
	};
	
	return speaker_minieditor;
}

function textMiniEditor(text_area, frame_data)
{
	var available_colours = [{name: 'white', value: 'white'}, {name: 'red', value: '#F77337'}, {name: 'green', value: '#00F61C'}, {name: 'blue', value: '#6BC7F6'}];
	var available_effects = [{name: 'pause', value: ''}, {name: 'flash', value: 'fb'}, {name: 'shake', value: 'sb'}];
	
	var text_minieditor = document.createElement('div');
	addClass(text_minieditor, 'frame-toolbox');
	
	var colours = document.createElement('div');
	addClass(colours, 'controls');
	var colours_title = document.createElement('span');
	colours_title.setAttribute('data-locale-content', 'colours');
	colours.appendChild(colours_title);
	for(var i = 0; i < available_colours.length; i++)
	{
		var colour_button = document.createElement('button');
		colour_button.setAttribute('data-locale-content', available_colours[i].name);
		var colour_value = available_colours[i].value;
		colour_button.style.color = colour_value;
		colour_button.colour_value = colour_value;
		registerEventHandler(colour_button, 'click', function()
		{
			if(!isNaN(text_area.selectionStart) && !isNaN(text_area.selectionEnd) && text_area.selectionEnd > text_area.selectionStart)
			{
				// If at least one character is selected, wrap it in a colour tag.
				text_area.wrapSelectedText('[#/colour:' + this.colour_value + ']', '[/#]');
			}
			else
			{
				// Otherwise, set global frame text colour.
				text_area.setColour(this.colour_value);
			}
		}, false);
		colours.appendChild(colour_button);
	}
	text_minieditor.appendChild(colours);
	
	var colour_picker = document.createElement('div');
	addClass(colour_picker, 'controls');
	var colour_picker_title = document.createElement('span');
	colour_picker_title.setAttribute('data-locale-content', 'colour_picker');
	colour_picker.appendChild(colour_picker_title);
	var colour_input = document.createElement('input');
	colour_input.type = "color";
	colour_input.defaultValue = "#ffffff";
	registerEventHandler(colour_input, 'change', function()
	{
		if(!isNaN(text_area.selectionStart) && !isNaN(text_area.selectionEnd) && text_area.selectionEnd > text_area.selectionStart)
		{
			// If at least one character is selected, wrap it in a colour tag.
			text_area.wrapSelectedText('[#/colour:' + this.value + ']', '[/#]');
		}
		else
		{
			// Otherwise, set global frame text colour.
			text_area.setColour(this.value);
		}
	}, false);
	colour_picker.appendChild(colour_input);
	text_minieditor.appendChild(colour_picker);
	
	var effects = document.createElement('div');
	addClass(effects, 'controls');
	var effects_title = document.createElement('span');
	effects_title.setAttribute('data-locale-content', 'effects');
	effects.appendChild(effects_title);
	for(var i in available_effects)
	{
		var effect_button = document.createElement('button');
		effect_button.setAttribute('data-locale-content', available_effects[i].name);
		effect_button.effect_value = available_effects[i].value;
		registerEventHandler(effect_button, 'click', function()
		{
			text_area.insertText('[#'+this.effect_value+']');
		}, false);
		effects.appendChild(effect_button);
	}
	text_minieditor.appendChild(effects);
	
	text_minieditor.closeMinieditor = function()
	{
		return true;
	};
	
	translateNode(text_minieditor);
	return text_minieditor;
}

//Full editors

function screenEditor(frame_data, row)
{	
	//Dummy frame data row to hold the information about the current changes
	var dummy_frame_data = new objClone(frame_data);
	
	var editor = document.createElement('div');
	
	var subelements = screenEditorContents(editor, dummy_frame_data);
	
	//Cancel and confirm functions
	editor.cancel = function()
	{
		subelements.preview.clearScreen();
		editor.close();
	};
	editor.confirm = function()
	{
		//Check selected place
		var value = dummy_frame_data.place;
		var int_value = parseInt(value);
		if(!int_value && int_value !== 0)
		{
			//data is not a number : it's a string corresponding to a default background
			
			//Check if a place with this background already exists
			var bg_found = false;
			for(var i = 1; !bg_found && i < trial_data.places.length; i++)
			{
				if(!trial_data.places[i].background.external
					&& trial_data.places[i].background.image == value)
				{
					// If found, use its ID and stop iterating
					dummy_frame_data.place = trial_data.places[i].id;
					bg_found = true;
				}
			}
			
			if(!bg_found)
			{
				//otherwise create the new place automatically
				var new_place = createDataRow('places');
				new_place.name = subelements.place_select.getTitle();
				new_place.background = {
					image: value,
					external: false,
					hidden: false
				};
				trial_data.places.push(new_place);
				
				dummy_frame_data.place = new_place.id;
			}
		}
		
		//Check selected popups
		for(var i = 0; i < dummy_frame_data.popups.length; i++)
		{
			var popup_info = dummy_frame_data.popups[i];
			
			var int_value = parseInt(popup_info.popup_id);
			if(!int_value && int_value !== 0)
			{
				//popup_id is not a number : it's a string corresponding to a default popup
				
				//Check this popup is already set
				var popup_found = false;
				for(var i = 1; !popup_found && i < trial_data.popups.length; i++)
				{
					if(!trial_data.popups[i].external
						&& trial_data.popups[i].path == popup_info.popup_id)
					{
						// If found, use its ID and stop iterating
						popup_info.popup_id = trial_data.popups[i].id;
						popup_found = true;
					}
				}
				
				if(!popup_found)
				{
					//otherwise, create the new popup automatically
					var new_popup = createDataRow('popups');
					new_popup.name = popup_info.popup_id;
					new_popup.external = false;
					new_popup.path = popup_info.popup_id;
					trial_data.popups.push(new_popup);
					
					popup_info.popup_id = new_popup.id; 
				}
			}
		}
		
		var frame_index = getRowIndexById('frames', frame_data.id);
		trial_data.frames[frame_index] = dummy_frame_data;
		subelements.preview.clearScreen();
		editor.close();
	};
	editor.refresh = function()
	{
		if(row)
		{
			populateFrameRow(row);
		}
	};
	
	return editor;
}

//Fills the screen editor with the frame data. Returns as subelements the place select element and the screen preview generated
function screenEditorContents(editor, frame_data)
{
	emptyNode(editor);
	
	var title = document.createElement('h2');
	title.setAttribute('data-locale-content', 'screen_editor');
	editor.appendChild(title);
	
	var editor_contents = document.createElement('div');
	addClass(editor_contents, 'content-panel');
	editor.appendChild(editor_contents);
	
	var left_panel = document.createElement('div');
	addClass(left_panel, 'left-panel');
	editor_contents.appendChild(left_panel);
	
	//screen preview (loading delayed until consistency of the frame is ensured)
	var preview = new ScreenDisplay();
	left_panel.appendChild(preview.render);
	
	//place selector
	var place_select = createFormElement('place_select', frame_data.place);
	var place_select_label = createLabel(place_select, 'place');
	left_panel.appendChild(place_select_label);
	
	registerEventHandler(place_select, 'change', function()
	{
		frame_data.place = place_select.getValue();
		
		if(frame_data.place != PLACE_NONE)
		{
			// If selected an actual place, default to erasing the characters.
			frame_data.characters_erase_previous = true;
		}
		
		screenEditorContents(editor, frame_data);
	}, false);
	
	// Generate right position select
	var position_select;
	if(frame_data.place == PLACE_NONE)
	{
		//If no place is set, select position mode
		position_select = createFormElement('screen_position_mode', frame_data.place_position);
	}
	else
	{
		//If place is set, select actual position
		position_select = createFormElement('place_position', frame_data.place_position, {place: getPlace(frame_data.place)});
	}
	
	var position_select_label = createLabel(position_select, 'screen_position');
	left_panel.appendChild(position_select_label);
	registerEventHandler(position_select, 'change', function()
	{
		frame_data.place_position = position_select.getValue();
		preview.loadFrame(frame_data, true);
	}, false);
	
	//Check frame data consistency and load preview
	frame_data.place_position = position_select.getValue();
	preview.loadFrame(frame_data, true);
	
	// Transition checkbox
	var place_transition = createFormElement('screen_transition_mode', frame_data.place_transition);
	registerEventHandler(place_transition, 'change', function(){
		frame_data.place_transition = place_transition.getValue();
	}, false);
	var place_transition_label = createLabel(place_transition, 'place_transition');
	left_panel.appendChild(place_transition_label);
	
	// Clear checkbox
	var characters_erase_previous = createFormElement('checkbox');
	characters_erase_previous.setValue(frame_data.characters_erase_previous);
	registerEventHandler(characters_erase_previous, 'change', function(){
		frame_data.characters_erase_previous = characters_erase_previous.getValue();
	}, false);
	var characters_erase_previous_label = createLabel(characters_erase_previous, 'characters_erase_previous');
	left_panel.appendChild(characters_erase_previous_label);
	
	var right_panel = document.createElement('div');
	addClass(right_panel, 'right-panel');
	editor_contents.appendChild(right_panel);
	
	// Generate character selector
	var characters_panel = document.createElement('div');
	right_panel.appendChild(characters_panel);
	
	if(frame_data.place == PLACE_NONE)
	{
		//If no place is set, show a light frame editor that only enables setting the sprite of the talking character
		screenEditorLightFrame(characters_panel, frame_data, preview);
	}
	else
	{
		//If a place is set, show a full frame editor that enables to place all characters on the place
		screenEditorFullFrame(characters_panel, frame_data, preview);
	}
	
	// Generate popups selector
	var popups_panel = document.createElement('div');
	right_panel.appendChild(popups_panel);
	screenEditorPopups(popups_panel, frame_data, preview);

	// Generate fade selector
	var fades_panel = document.createElement('div');
	right_panel.appendChild(fades_panel);
	screenEditorFades(fades_panel, frame_data, preview);
	
	translateNode(editor);
	
	return new Object({
		place_select: place_select,
		preview: preview
	});
}

function screenEditorLightFrame(editor, frame_data, preview)
{
	var frame_type = document.createElement('h3');
	frame_type.setAttribute('data-locale-content', 'frame_light');
	editor.appendChild(frame_type);
	
	// Display set character menu
	var char_set_row = document.createElement('div');
	addClass(char_set_row, 'char_row');
	editor.appendChild(char_set_row);
	
	var char_select = createFormElement('profile_descriptor', frame_data.speaker_id, {include_unknown: true, include_judge: false});
	var char_select_label = createLabel(char_select, 'talking_character_select');
	char_set_row.appendChild(char_select_label);
	
	var char_row = document.createElement('div');
	addClass(char_row, 'char_row');
	editor.appendChild(char_row);
	
	function buildCharRow()
	{
		if(frame_data.speaker_id >= 0)
		{
			var character_info;
			
			//Check if an instance of this character already exists in this frame
			for(var i = 0; i < frame_data.characters.length; i++)
			{
				if(frame_data.characters[i].profile_id == frame_data.speaker_id)
				{
					character_info = frame_data.characters[i];
				}
			}
			
			if(!character_info)
			{
				//if not, create a new instance
				character_info = createDataRow('character_info');
				character_info.profile_id = char_select.getValue();
				character_info.sprite_id = 0;
				frame_data.characters = [];
			}
			
			//include the instance in the frame
			frame_data.characters = [character_info];

			screenEditorCharacterEditor(char_row, character_info, frame_data, preview);
		}
		else
		{
			frame_data.characters = [];
			emptyNode(char_row);
		}
	}
	
	registerEventHandler(char_select, 'change', function()
	{
		frame_data.speaker_id = char_select.getValue();
		buildCharRow();
		preview.loadFrame(frame_data, true); //clear screen and load frame
	}, false);
	
	buildCharRow();
}

function screenEditorFullFrame(editor, frame_data, preview)
{
	var frame_type = document.createElement('h3');
	frame_type.setAttribute('data-locale-content', 'frame_full');
	editor.appendChild(frame_type);
	
	var char_div = document.createElement('div');
	screenEditorCharacters(char_div, frame_data, preview);
	editor.appendChild(char_div);
}

function screenEditorCharacters(char_div, frame_data, preview)
{
	emptyNode(char_div);
	
	//generate list of profiles already displayed to exclude them from the select choices
	var exclude_list = new Array();
	for(var i = 0; i < frame_data.characters.length; i++)
	{
		exclude_list.push(frame_data.characters[i].profile_id);
	}
	
	// Display character list
	var char_list = document.createElement('div');
	screenEditorCharacterList(char_list, frame_data, preview, char_div);
	char_div.appendChild(char_list);
	
	// Display add character menu
	var char_add_row = document.createElement('div');
	addClass(char_add_row, 'char_row');
	
	var char_select = createFormElement('profile_descriptor', 0, {include_unknown: false, exclude_list: exclude_list, include_judge: false});
	char_add_row.appendChild(char_select);
	
	var add_button = document.createElement('button');
	add_button.setAttribute('data-locale-content', 'add_character');
	char_add_row.appendChild(add_button);
	
	char_div.appendChild(char_add_row);
	
	registerEventHandler(add_button, 'click', function()
	{
		if(char_select.getValue() >= 0)
		{
			var char_instance = getCharacterIndexById(char_select.getValue(), frame_data.characters);
			if(char_instance < 0)
			{
				// Create new character
				var character_info = createDataRow('character_info');
				character_info.profile_id = char_select.getValue();
				
				// Set position of the new character
				var screen_position_taken = false;
				for(var i = 0; !screen_position_taken && i < frame_data.characters.length; i++)
				{
					if(frame_data.characters[i].position == frame_data.place_position)
					{
						screen_position_taken = true;
					}
				}
				if(!screen_position_taken)
				{
					// If no character uses the current screen position, use it by default.
					character_info.position = frame_data.place_position;
				}
				
				// Append new character to the frame
				frame_data.characters.push(character_info);
				
				screenEditorCharacters(char_div, frame_data, preview);
				preview.loadFrame(frame_data, true);
			}
		}
	}, false);
	
	translateNode(char_div);
}

function screenEditorCharacterList(char_list_container, frame_data, preview, char_div)
{
	emptyNode(char_list_container);
	
	var char_list = document.createElement('ul');
	addClass(char_list, 'screen_editor_chars');
	
	for(var i = 0; i < frame_data.characters.length; i++)
	{
		var char_row = document.createElement('li');
		addClass(char_row, 'char_row');
		screenEditorCharacterEditor(char_row, frame_data.characters[i], frame_data, preview, char_list_container, char_div);
		char_list.appendChild(char_row);
	}
	
	char_list_container.appendChild(char_list);
}

//in full frame mode, char_list and char_div are pointers to the areas to update. null otherwise
function screenEditorCharacterEditor(char_row, character_info, frame_data, preview, char_list, char_div)
{
	emptyNode(char_row);
	
	//pictures of the character (empty : filled later)
	var pictures = document.createElement('span');
	addClass(pictures, 'previews');
	char_row.appendChild(pictures);
	
	//Select sprite
	var sprite_select = createFormElement('character_sprite', character_info.sprite_id, {profile_id: character_info.profile_id, include_none: !char_list});
	char_row.appendChild(createLabel(sprite_select, 'character_sprite'));
	
	registerEventHandler(sprite_select, 'change', function()
	{
		var value = sprite_select.getValue();
		var char_instance = getCharacterIndexById(character_info.profile_id, frame_data.characters);
		
		//if a sprite is set
		if(char_instance < 0)
		{
			//if the character isn't defined yet, add it to the frame
			frame_data.characters.push(character_info);
		}
		//update pictures and character info
		pictures = updateCharacterSprites(char_row, pictures, character_info, sprite_select, startup_mode_select_label);
		preview.loadFrame(frame_data, true);
	}, false);
	
	//display position select only if in full frame mode
	if(char_list)
	{
		//generate list of excluded positions (positions that are used by other people on the scene)
		var exclude_list = new Array();
		for(var i = 0; i < frame_data.characters.length; i++)
		{
			if(frame_data.characters[i].profile_id != character_info.profile_id)
			{
				exclude_list.push(frame_data.characters[i].position);
			}
		}
		
		//Select position
		var position_select = createFormElement('place_position', character_info.position, {place: getPlace(frame_data.place), exclude_list: exclude_list});
		char_row.appendChild(createLabel(position_select, 'character_position'));
		character_info.position = position_select.getValue();
		
		registerEventHandler(position_select, 'change', function()
		{
			character_info.position = position_select.getValue();
			preview.loadFrame(frame_data, true);
			screenEditorCharacterList(char_list, frame_data, preview);
		}, false);
	}
	else
	{
		//else use auto positioning mode : character inserted if not present
		character_info.position = POSITION_NONE;
	}
	
	//Select startup mode
	var startup_mode_select = createFormElement('character_startup_mode', character_info.startup_mode);
	var startup_mode_select_label = createLabel(startup_mode_select, 'character_startup_mode');
	char_row.appendChild(startup_mode_select_label);
	
	registerEventHandler(startup_mode_select, 'change', function()
	{
		character_info.startup_mode = startup_mode_select.getValue();
		preview.loadFrame(frame_data, true);
	}, false);
	
	//Select sync mode
	var sync_mode_select = createFormElement('character_sync_mode', character_info.sync_mode);
	char_row.appendChild(createLabel(sync_mode_select, 'character_sync_mode'));
	
	registerEventHandler(sync_mode_select, 'change', function()
	{
		character_info.sync_mode = sync_mode_select.getValue();
		preview.loadFrame(frame_data, true);
	}, false);
	
	// Apply mirror effect
	var mirror_effect_checkbox = createFormElement('checkbox', character_info.mirror_effect);
	char_row.appendChild(createLabel(mirror_effect_checkbox, 'character_mirror_effect'));
	
	registerEventHandler(mirror_effect_checkbox, 'change', function()
	{
		character_info.mirror_effect = mirror_effect_checkbox.getValue();
		preview.loadFrame(frame_data, true);
	}, false);
	
	// Select appearance transition mode.
	var effect_appears_select = createFormElement('character_visual_effect_appears', character_info.visual_effect_appears);
	char_row.appendChild(createLabel(effect_appears_select, 'character_visual_effect_appears'));
	
	registerEventHandler(effect_appears_select, 'change', function()
	{
		character_info.visual_effect_appears = effect_appears_select.getValue();
		preview.loadFrame(frame_data, true);
	}, false);
	
	// Select disappearance transition mode.
	var effect_disappears_select = createFormElement('character_visual_effect_disappears', character_info.visual_effect_disappears);
	char_row.appendChild(createLabel(effect_disappears_select, 'character_visual_effect_disappears'));
	
	registerEventHandler(effect_disappears_select, 'change', function()
	{
		character_info.visual_effect_disappears = effect_disappears_select.getValue();
		preview.loadFrame(frame_data, true);
	}, false);
	
	// Update sprites display.
	pictures = updateCharacterSprites(char_row, pictures, character_info, sprite_select, startup_mode_select_label);
	
	//display remove button only if in full frame mode
	if(char_div)
	{
		var remove = document.createElement('button');
		addClass(remove, 'remove_button');
		remove.setAttribute('data-locale-content', 'remove');
		
		registerEventHandler(remove, 'click', function()
		{
			var char_instance = getCharacterIndexById(character_info.profile_id, frame_data.characters);
			frame_data.characters.splice(char_instance, 1); //remove character from the array
			preview.loadFrame(frame_data, true); //clear screen and load frame
			
			screenEditorCharacters(char_div, frame_data, preview);
		}, false);
		char_row.appendChild(remove);
	}
	
	translateNode(char_row);
}

function characterSprites(character_info)
{
	var pose_desc = getPoseDesc(character_info);
	
	var pictures = document.createElement('span');
	addClass(pictures, 'previews');
	var img_talking = new Image();
	img_talking.src = pose_desc.talking;
	pictures.appendChild(img_talking);
	var img_still = new Image();
	img_still.src = pose_desc.still;
	pictures.appendChild(img_still);
	
	if(pose_desc.startup)
	{
		var img_startup = new Image();
		img_startup.src = pose_desc.startup;
		pictures.appendChild(img_startup);
	}
	
	return pictures;
}

function updateCharacterSprites(elt, pictures, character_info, sprite_select, startup_mode_select_label)
{
	character_info.sprite_id = sprite_select.getValue();
	
	var new_pictures;
	
	if(character_info.sprite_id == 0)
	{
		new_pictures = document.createElement('span');
		elt.replaceChild(new_pictures, pictures);
		
		startup_mode_select_label.style.display = 'none';
	}
	else
	{
		new_pictures = characterSprites(character_info);
		elt.replaceChild(new_pictures, pictures);
		
		var startup_uri = getPoseDesc(character_info).startup;
		if(startup_uri)
		{
			startup_mode_select_label.style.display = '';
		}
		else if(!startup_uri)
		{
			startup_mode_select_label.style.display = 'none';
		}
	}
	
	return new_pictures;
}

function screenEditorPopups(editor, frame_data, preview)
{
	emptyNode(editor);
	
	var popups_title = document.createElement('h3');
	popups_title.setAttribute('data-locale-content', 'frame_popups');
	editor.appendChild(popups_title);
	
	// Display popup list
	var popups_list = document.createElement('div');
	for(var i = 0; i < frame_data.popups.length; i++)
	{
		(function(i){
			var popup_info = frame_data.popups[i];
			
			var popup_row = document.createElement('div');
			addClass(popup_row, 'char_row');
			
			// Popup preview
			var previews = document.createElement('div');
			addClass(previews, 'previews');
			if(popup_info.popup_id !== 0)
			{
				var popup_img = new Image();
				
				popup_img.src = getPopupDescriptor(popup_info).uri;
				previews.appendChild(popup_img);
			}
			popup_row.appendChild(previews);
			
			// Popup select
			var popup_select = createFormElement('popup_descriptor', popup_info.popup_id);
			registerEventHandler(popup_select, 'change', function(){
				popup_info.popup_id = popup_select.getValue();
				screenEditorPopups(editor, frame_data, preview);
				preview.loadFrame(frame_data, true);
			}, false);
			popup_row.appendChild(popup_select);
			
			var remove = document.createElement('button');
			addClass(remove, 'remove_button');
			remove.setAttribute('data-locale-content', 'remove');
			
			registerEventHandler(remove, 'click', function()
			{
				frame_data.popups.splice(i, 1); //remove popup from the array
				preview.loadFrame(frame_data, true); //clear screen and load frame
				
				screenEditorPopups(editor, frame_data, preview);
			}, false);
			popup_row.appendChild(remove);
			
			popups_list.appendChild(popup_row);
		})(i);
	}
	editor.appendChild(popups_list);
	
	// Display add popup menu
	var popup_add_row = document.createElement('div');
	addClass(popup_add_row, 'char_row');
	
	var add_button = document.createElement('button');
	add_button.setAttribute('data-locale-content', 'add_frame_popups');
	popup_add_row.appendChild(add_button);
	
	editor.appendChild(popup_add_row);
	
	registerEventHandler(add_button, 'click', function()
	{
		//add new popup
		var popup_info = createDataRow('popup_info');	
		frame_data.popups.push(popup_info);
				
		screenEditorPopups(editor, frame_data, preview);
		preview.loadFrame(frame_data, true);
	}, false);
	
	translateNode(editor);
}

function screenEditorFades(editor, frame_data, preview) {
	emptyNode(editor);
	
	var fades_title = document.createElement('h3');
	fades_title.setAttribute('data-locale-content', 'frame_fades');
	editor.appendChild(fades_title);
	
	// Display fade if exists
	var fade_info = frame_data.fade;

	if(fade_info) {
		var fade_row = document.createElement('div');
		addClass(fade_row, 'char_row');

		var fade_type_select = createFormElement('fade_type', fade_info.fade_type);
		fade_row.appendChild(createLabel(fade_type_select, 'fade_type'));

		registerEventHandler(fade_type_select, 'change', function() 
		{
			fade_info.fade_type = fade_type_select.getValue();
			preview.loadFrame(frame_data, true);
		}, false);

		var fade_colour_picker = createFormElement('colour', fade_info.fade_colour);
		fade_row.appendChild(createLabel(fade_colour_picker, 'fade_colour'));

		registerEventHandler(fade_colour_picker, 'change', function()
		{
			fade_info.fade_colour = fade_colour_picker.getValue();
			preview.loadFrame(frame_data, true);
		}, false);
		
		var fade_duration_input = createFormElement('integer', fade_info.fade_duration);
		fade_row.appendChild(createLabel(fade_duration_input, 'fade_duration'));

		registerEventHandler(fade_duration_input, 'change', function()
		{
			fade_info.fade_duration = fade_duration_input.getValue();
			preview.loadFrame(frame_data, true);
		}, false);

		var fade_placement_select = createFormElement('fade_placement', fade_info.fade_placement);
		fade_row.appendChild(createLabel(fade_placement_select, 'fade_placement'));

		registerEventHandler(fade_placement_select, 'change', function()
		{
			fade_info.fade_placement = fade_placement_select.getValue();
			preview.loadFrame(frame_data, true);
		}, false);

		var fade_remove_button = document.createElement('button');
		addClass(fade_remove_button, 'remove_button');
		fade_remove_button.setAttribute('data-locale-content', 'remove_frame_fade');
		fade_row.appendChild(fade_remove_button);

		registerEventHandler(fade_remove_button, 'click', function() 
		{
			frame_data.fade = null;
			preview.loadFrame(frame_data, true);

			screenEditorFades(editor, frame_data, preview);
		});

		editor.appendChild(fade_row);
	}
	
	// Display add color fade menu if none already exists
	if(!fade_info) {
		var fade_add_row = document.createElement('div');
		addClass(fade_add_row, 'char_row');

		var fade_add_button = document.createElement('button');
		fade_add_button.setAttribute('data-locale-content', 'add_frame_fades');
		fade_add_row.appendChild(fade_add_button);

		editor.appendChild(fade_add_row);
		
		registerEventHandler(fade_add_button, 'click', function() 
		{
			//add new fade
			var fade_info = createDataRow('fade_info');
			frame_data.fade = fade_info;

			screenEditorFades(editor, frame_data, preview);
			preview.loadFrame(frame_data, true);
		}, false);
	}
	
	translateNode(editor);
}

function musicEditor(frame_data, row)
{
	var dummy_frame_data = new objClone(frame_data);

	var editor = document.createElement('div');

	musicEditorContents(editor, dummy_frame_data);

	editor.cancel = function()
	{
		editor.close();
	};

	editor.confirm = function()
	{
		var frame_index = getRowIndexById('frames', frame_data.id);
		trial_data.frames[frame_index] = dummy_frame_data;
		editor.close();
	};

	editor.refresh = function()
	{
		if(row)
		{
			populateFrameRow(row);
		}
	};

	return editor;
}

function musicEditorContents(editor, frame_data) 
{
	emptyNode(editor);

	var editor_title = document.createElement('h2');
	editor_title.setAttribute('data-locale-content', 'music_editor');
	editor.appendChild(editor_title);

	var editor_contents = document.createElement('div');
	addClass(editor_contents, 'content-panel');
	editor.appendChild(editor_contents);

	var music_title = document.createElement('h3');
	music_title.setAttribute('data-locale-content', 'music_editor_music');
	editor_contents.appendChild(music_title);

	var music_row = document.createElement('div');
	addClass(music_row, 'char_row');

	var music_select = createFormElement('music_select', frame_data.music);
	music_row.appendChild(createLabel(music_select, 'music_editor_select_track'));

	registerEventHandler(music_select, 'change', function()
	{
		var value = music_select.getValue();
		var title = music_select.getTitle();
		frame_data.music = getMusicId(value, title);

		if(frame_data.music != MUSIC_UNCHANGED)
		{
			frame_data.music_fade = null;
		}

		musicEditorContents(editor, frame_data);
	}, false);

	if(frame_data.music != MUSIC_UNCHANGED)
	{
		var fade_checkbox = createFormElement('checkbox', frame_data.music_fade);
		music_row.appendChild(createLabel(fade_checkbox, 'music_fade'));

		registerEventHandler(fade_checkbox, 'change', function()
		{
			if(fade_checkbox.getValue())
			{
				frame_data.music_fade = createDataRow('music_fade');
			}
			else
			{
				frame_data.music_fade = null;
			}

			musicEditorContents(editor, frame_data);
		}, false);
	}

	editor_contents.appendChild(music_row);

	if(frame_data.music_fade)
	{
		var fade_title = document.createElement('h3');
		fade_title.setAttribute('data-locale-content', 'music_fade_settings');
		editor_contents.appendChild(fade_title);

		var fade_row = document.createElement('div');
		addClass(fade_row, 'char_row');

		var fade_duration = createFormElement('integer', frame_data.music_fade.duration);
		fade_row.appendChild(createLabel(fade_duration, 'music_fade_duration'));

		registerEventHandler(fade_duration, 'change', function()
		{
			frame_data.music_fade.duration = fade_duration.getValue();
		}, false);

		if (frame_data.music != MUSIC_STOP) {
			var fade_volume = createFormElement('integer', frame_data.music_fade.to_volume);
			fade_row.appendChild(createLabel(fade_volume, 'music_fade_volume'));

			registerEventHandler(fade_volume, 'change', function()
			{
				frame_data.music_fade.to_volume = fade_volume.getValue();
			}, false);

			var crossfade_same_position_checkbox = createFormElement('checkbox', frame_data.music_fade.same_position);
			fade_row.appendChild(createLabel(crossfade_same_position_checkbox, 'music_crossfade_same_position'));

			registerEventHandler(crossfade_same_position_checkbox, 'change', function()
			{
				frame_data.music_fade.same_position = crossfade_same_position_checkbox.getValue();
			}, false);
		}

		editor_contents.appendChild(fade_row);
	}

	translateNode(editor);
}

//END OF MODULE
Modules.complete('editor_frame_rows');
