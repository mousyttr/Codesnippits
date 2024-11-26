"use strict";
/*
Ace Attorney Online - Handling Scenes in the storyboard

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_frames_scene',
	dependencies : ['trial', 'trial_data', 'form_elements', 'editor_form_places', 'editor_form_area', 'frame_data', 'editor_frame_rows', 'actions_parameters'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES


//EXPORTED FUNCTIONS

//Scene or dialogue conversation add link
function getSceneConvAddLink(scene_type, scene_id, section_type, section_id, subsection_type, subsection_index, conv_type, conv_index)
{
	var scene = getRowById(scene_type, scene_id);
	var section = getById(scene[section_type], section_id);
	
	var getInsertionIndex;
	switch(section_type)
	{
		case 'dialogues':
			getInsertionIndex = getInsertionIndexInDialogue;
			break;
		
		case 'examinations':
			getInsertionIndex = getInsertionIndexInExamination;
			break;
	}
	
	var insert_link = document.createElement('a');
	addClass(insert_link, 'insert');
	insert_link.setAttribute('data-locale-content', 'add_' + conv_type);
	
	registerEventHandler(insert_link, 'click', function(){
		
		//Find position for the new conversation
		var target_index = getInsertionIndex(section, conv_type, conv_index);
		
		// Generate convesation ending with return action
		var conv_descriptor = createNewConversationAt(target_index, new Object({
			action_name: 'GoTo',
			action_parameters: prefixRawParameters({
				global: {
					target: 
						(conv_type == 'talk_topics' ? section.talk : 
						(conv_type == 'present_conversations' ? section.present : 
						(conv_type == 'examine_conversations' ? section.examine :
						(conv_type == 'deduce_conversations' ? section.examine : null))))
				}
			})
		}));
		
		//Fill conversation descriptor with correct additional info
		switch(conv_type)
		{
			case 'present_conversations':
				conv_descriptor.elt = new Object({
					type: 'none',
					id: 0
				});
				break;
			
			case 'talk_topics':
				conv_descriptor.id = getNewId(section[conv_type], 0);
				conv_descriptor.title = '';
				conv_descriptor.hidden = 0;
				conv_descriptor.icon = 0;
				break;
			
			case 'examine_conversations':
				conv_descriptor.area = "rect:0,0,0,0";
				break;
			
			case 'deduce_conversations':
				conv_descriptor.area = "rect:0,0,0,0";
				conv_descriptor.elt = new Object({
					type: 'none',
					id: 0
				});
				break;
		}
		
		//Insert new conversation descriptor in the dialogue
		section[conv_type].splice(conv_index, 0, conv_descriptor);
		
		rowSectionMapEdit({
			edit_type: 'Scene_Section_Conv_Insert',
			scene_type: scene_type,
			scene_id: scene_id,
			section_type: section_type,
			section_id: section_id,
			subsection_type: subsection_type,
			subsection_index: subsection_index,
			conv_type: conv_type,
			conv_index: conv_index,
			frame_index: target_index
		});
	}, false);
	translateNode(insert_link);
	
	return insert_link;
}

//Scene section header generator.
//In contrast to populateFrameRow, this takes the inner row as an argument for simplicity.
function populateSceneSectionHeader(row)
{
	// Define variables for certain pieces of data we'll be using a lot.
	emptyNode(row);
	var row_data = row.getData();
	var section_desc = row_data.scene_section_descriptor;
	var subsections = row_data.subsections;
	var display = row_data.display;
	//var preview = row_data.preview;

	var scene = getRowById(section_desc.scene_type, section_desc.scene_id);
	var section = getById(scene[section_desc.section_type], section_desc.section_id);
	
	var tabs, contents;
	
	function editSectionRowMapOnClick(element, message)
	{
		registerEventHandler(element, 'click', (function(e){
			rowSectionMapEdit(message);
		}), false);
	}
	
	function openSectionOnClick(element, tab_index, contents_div)
	{
		registerEventHandler(element, 'click', function(e){
			Section_Open(tab_index, contents_div);
		}, false);
	}
	
	function Section_Open(tab_index, contents_div)
	{
		//Close all other tabs
		for(var i = 0; i < tabs.childNodes.length; i++)
		{
			removeClass(tabs.childNodes[i], 'open');		
		}
		
		//Open requested tab
		addClass(tabs.childNodes[tab_index], 'open');
		
		//Update contents div
		emptyNode(contents_div);
		contents_div.appendChild(getSubsectionContents(tab_index));
	}
	
	function getSubsectionContents(subsection_index)
	{
		var subsection = subsections[subsection_index];
		switch(subsection.type)
		{
			case 'single_conversation':
				
				var container = document.createElement('div');
				addClass(container, 'single_opener');
				
				//Display open button
				var open_button_container = document.createElement('div');
				addClass(open_button_container, 'button_container');
				var open_button = document.createElement('button');
				open_button.setAttribute('data-locale-content', 'open');
				editSectionRowMapOnClick(open_button, new Object({
					edit_type: 'Scene_Section_Conv_Open',
					scene_type: section_desc.scene_type,
					scene_id: section_desc.scene_id,
					section_type: section_desc.section_type,
					section_id: section_desc.section_id,
					subsection_index: subsection_index,
					subsection_type: subsection.type,
					conv_type: subsection.conv_type
				}));
				translateNode(open_button);
				open_button_container.appendChild(open_button);
				container.appendChild(open_button_container);
				
				//Display description
				var description = document.createElement('p');
				description.setAttribute('data-locale-content', subsection.locale + '_description');
				translateNode(description);
				container.appendChild(description);
				
				return container;
				
				break;
			
			case 'conversation_list':
			
				//Put conversation select list
				var conv_list = document.createElement('ul');
				addClass(conv_list, 'entity_list');
				addClass(conv_list, 'conversation');
				
				var convs = section[subsection.conv_type];
				for(var i = 0; i < convs.length; i++)
				{
					var conv = convs[i];
					var conv_item = document.createElement('li');
					
					var conv_item_content = document.createElement('div');
					addClass(conv_item_content, 'content');
					conv_item.appendChild(conv_item_content);
					
					if(conv.id)
					{
						//If there is an id property, display it
						var conv_id = document.createElement('small');
						setNodeTextContents(conv_id, conv.id);
						conv_item_content.appendChild(conv_id);
					}
					
					var is_deletable = subsection.appendConvControls(conv_item_content, scene, section, subsection.conv_type, conv);
					
					var conv_open = document.createElement('button');
					conv_open.setAttribute('data-locale-content', 'open');
					addClass(conv_open, 'open');
					editSectionRowMapOnClick(conv_open, new Object({
						edit_type: 'Scene_Section_Conv_Open',
						scene_type: section_desc.scene_type,
						scene_id: section_desc.scene_id,
						section_type: section_desc.section_type,
						section_id: section_desc.section_id,
						subsection_index: subsection_index,
						subsection_type: subsection.type,
						conv_type: subsection.conv_type,
						conv_index: i
					}));
					conv_item_content.appendChild(conv_open);
					
					if(is_deletable)
					{
						var conv_delete = document.createElement('button');
						conv_delete.setAttribute('data-locale-content', 'delete');
						addClass(conv_delete, 'delete');
						registerEventHandler(conv_delete, 'click', (function(i, conv, e){
							//Remove frames
							deleteDataRowInterval('frames', getRowIndexById('frames', conv.start), getRowIndexById('frames', conv.end));
							
							//Remove conversation
							section[subsection.conv_type].splice(i, 1);
							
							//Update row map
							rowSectionMapEdit({
								edit_type: 'Scene_Section_Conv_Delete',
								scene_type: section_desc.scene_type,
								scene_id: section_desc.scene_id,
								section_type: section_desc.section_type,
								section_id: section_desc.section_id,
								subsection_index: subsection_index,
								subsection_type: subsection.type,
								conv_type: subsection.conv_type,
								conv_index: i
							});
						}).bind(undefined, i, conv), false);
						conv_item_content.appendChild(conv_delete);
						
						conv_item.insertBefore(getSceneConvAddLink(section_desc.scene_type, section_desc.scene_id, section_desc.section_type, section_desc.section_id, subsection.type, subsection_index, subsection.conv_type, i), conv_item_content);
					}
					
					translateNode(conv_item_content);
					conv_list.appendChild(conv_item);
				}
				var conv_insert = document.createElement('li');
				var insert_link = getSceneConvAddLink(section_desc.scene_type, section_desc.scene_id, section_desc.section_type, section_desc.section_id, subsection.type, subsection_index, subsection.conv_type, section[subsection.conv_type].length);
				addClass(insert_link, 'last');
				conv_insert.appendChild(insert_link);
				conv_list.appendChild(conv_insert);
				return conv_list;
			
				break;
			
			case 'settings':
				
				var settings = document.createElement('div');
				
				for(var i = 0; i < subsection.fields.length; i++)
				{
					var field = subsection.fields[i];
					
					if(field.type == 'button')
					{
						// Type 'button' : a button executing the function passed as 'action' on click.
						var button = document.createElement('button');
						button.setAttribute('data-locale-content', field.locale);
						translateNode(button);
						registerEventHandler(button, 'click', field.action, false);
						settings.appendChild(button);
					}
					else if(field.type == 'node')
					{
						// Type 'node' : directly include a DOM node.
						settings.appendChild(field.node);
					}
					else
					{
						// Form element types : a form element bound to the property passed as 'name'. 
						var form_element = createFormElement(field.type, section[field.name]);
						registerEventHandler(form_element, 'change', (function(form_element, field) {
							section[field.name] = form_element.getValue();
						}).bind(undefined, form_element, field), false);
						settings.appendChild(createLabel(form_element, field.locale));
					}
				}
				
				return settings;
				
				break;
			
			default:
				debugger;
				break;
		}
	}
	
	
	/* TODO: display previews properly.
	if(preview)
	{
		row.appendChild(preview);
	}
	*/
	
	if(subsections.length > 1)
	{
		tabs = document.createElement('div');
		addClass(tabs, 'panel-tabs');
		contents = document.createElement('div');
		addClass(contents, 'panel-tab-contents');
		
		for(var i = 0; i < subsections.length; i++)
		{
			//Click on tab opens corresponding subsection
			var tab = document.createElement('a');
			tab.setAttribute('data-locale-content', subsections[i].locale);
			openSectionOnClick(tab, i, contents);
			tabs.appendChild(tab);
		}
		
		translateNode(tabs);
		row.appendChild(tabs);
		row.appendChild(contents);
		
		//Open correct tab
		if(display.section_mode == 'subsection')
		{
			Section_Open(display.subsection_index, contents);
		}
	}
	else
	{
		row.appendChild(getSubsectionContents(0));
	}
	
	//Conversation title
	if(display.section_mode == 'subsection' && display.subsection_mode == 'open')
	{
		var title = document.createElement('h2');
		var subsection = subsections[display.subsection_index];
		
		title.setAttribute('data-locale-content', subsection.conv_type + '_title');
		switch(subsection.type)
		{
			case 'single_conversation':
				subsection.setConvTitle(title);
				break;
			
			case 'conversation_list':
				subsection.setConvTitle(title, subsection.conv_type, section[subsection.conv_type][display.conv_index]);
				break;
		}
		translateNode(title);
		row.appendChild(title);
	}
	
}

// Psyche locks editor
function locksEditor(dialogue)
{
	var dummy_locks_data = new objClone(dialogue.locks);
	
	// Make sure locks data is well formed - it must contain a list of locks to display
	if(!('locks_to_display' in dummy_locks_data))
	{
		dummy_locks_data.locks_to_display = [];
	}
	
	var editor = document.createElement('div');
	
	locksEditorContents(editor, dummy_locks_data);
	
	//Cancel and confirm functions
	editor.cancel = function()
	{
		editor.close();
	};
	editor.confirm = function()
	{
		dialogue.locks = dummy_locks_data;
		editor.close();
	};
	editor.refresh = function()
	{
		
	};
	
	return editor;
}

function locksEditorContents(editor, locks_data)
{
	emptyNode(editor);
	
	var title = document.createElement('h2');
	title.setAttribute('data-locale-content', 'locks_editor');
	editor.appendChild(title);
	
	var editor_contents = document.createElement('div');
	addClass(editor_contents, 'content-panel');
	editor.appendChild(editor_contents);
	
	var left_panel = document.createElement('div');
	addClass(left_panel, 'left-panel');
	editor_contents.appendChild(left_panel);
	
	//locks preview
	var preview = new LocksDisplay();
	var preview_container = document.createElement('div');
	addClass(preview_container, 'display_engine_screen');
	preview_container.appendChild(preview.render);
	left_panel.appendChild(preview_container);
	preview.showLocks(null, locks_data.locks_to_display);
	
	var right_panel = document.createElement('div');
	addClass(right_panel, 'right-panel');
	editor_contents.appendChild(right_panel);
	
	// Generate popups selector
	var locks_panel = document.createElement('div');
	right_panel.appendChild(locks_panel);
	
	var locks_hidden = createFormElement('checkbox', locks_data.hidden);
	registerEventHandler(locks_hidden, 'change', function(){
		locks_data.hidden = locks_hidden.getValue();
	}, false);
	locks_panel.appendChild(createLabel(locks_hidden, 'hidden'));
	
	var locks_list = document.createElement('div');
	for(var i = 0; i < locks_data.locks_to_display.length; i++)
	{
		(function(i){
			var lock_info = locks_data.locks_to_display[i];
			
			var lock_row = document.createElement('div');
			addClass(lock_row, 'char_row');
			
			var id = document.createElement('small');
			setNodeTextContents(id, lock_info.id);
			lock_row.appendChild(id);
			
			var x_input = createFormElement('integer', lock_info.x);
			registerEventHandler(x_input, 'change', function() {
				lock_info.x = x_input.getValue();
				preview.showLocks(null, locks_data.locks_to_display);
			}, false);
			lock_row.appendChild(createLabel(x_input, 'x'));
			
			var y_input = createFormElement('integer', lock_info.y);
			registerEventHandler(y_input, 'change', function() {
				lock_info.y = y_input.getValue();
				preview.showLocks(null, locks_data.locks_to_display);
			}, false);
			lock_row.appendChild(createLabel(y_input, 'y'));
			
			/* TODO : enable different lock types
			var lock_type_select = createFormElement('lock_type', lock_info.type);
			registerEventHandler(lock_type_select, 'change', function() {
				lock_info.type = lock_type_select.getValue();
				preview.showLocks(null, locks_data.locks_to_display);
			}, false);
			lock_row.appendChild(createLabel(lock_type_select, 'lock_type'));
			*/
			
			var remove = document.createElement('button');
			addClass(remove, 'remove_button');
			remove.setAttribute('data-locale-content', 'remove');
			
			registerEventHandler(remove, 'click', function()
			{
				locks_data.locks_to_display.splice(i, 1); //remove lock from the array
				
				locksEditorContents(editor, locks_data);
			}, false);
			lock_row.appendChild(remove);
			
			locks_list.appendChild(lock_row);
		})(i);
	}
	locks_panel.appendChild(locks_list);
	
	// Display add lock menu
	var lock_add_row = document.createElement('div');
	addClass(lock_add_row, 'char_row');
	
	var add_button = document.createElement('button');
	add_button.setAttribute('data-locale-content', 'add_dialogue_locks');
	lock_add_row.appendChild(add_button);
	
	locks_panel.appendChild(lock_add_row);
	
	registerEventHandler(add_button, 'click', function()
	{
		//add new lock
		var lock_info = createDataRow('lock_info', getNewId(locks_data.locks_to_display, 0));
		locks_data.locks_to_display.push(lock_info);
		
		var center_x = 128;
		var center_y = 96;
		
		switch(lock_info.id)
		{
			case 1:
				lock_info.x = center_x;
				lock_info.y = center_y + 32;
				break;
			
			case 2:
				lock_info.x = center_x + 96;
				lock_info.y = center_y - 32;
				break;
			
			case 3:
				lock_info.x = center_x - 96;
				lock_info.y = center_y - 32;
				break;
			
			case 4:
				lock_info.x = center_x + 48;
				lock_info.y = center_y + 64;
				break;
			
			case 5:
				lock_info.x = center_x - 48;
				lock_info.y = center_y + 64;
				break;
			
			default:
				lock_info.x = center_x;
				lock_info.y = center_y;
				break;
		}
		
		locksEditorContents(editor, locks_data);
	}, false);
	
	translateNode(editor);
}

//Dialogue header generator
function getSceneDialogueHeader(scene_type, scene_id, dialogue_id, display)
{
	var scene_section_descriptor = {
		'scene_type': scene_type,
		'scene_id': scene_id,
		'section_type': 'dialogues',
		'section_id': dialogue_id
	};

	var outer_row = getSceneSectionHeader(scene_section_descriptor);
	var inner_row = outer_row.firstChild;

	var scene = getRowById(scene_type, scene_id);
	var dialogue = getById(scene.dialogues, dialogue_id);

	// Generate the list of settings fields.
	var dialogue_setting_fields = new Array();
	
	// Choices for the dialogue's main frame.
	var main_frame = getRowById('frames', dialogue.main);
	
	// Screen data
	var place_select = createFormElement('place_descriptor', main_frame.place);
	registerEventHandler(place_select, 'change', function(){
		main_frame.place = place_select.getValue();
	}, false);

	dialogue_setting_fields.push({
		type: 'button',
		locale: 'dialogue_main_screen',
		action: function() {
			var fresh_main_frame = getRowById('frames', dialogue.main);
			var editor = screenEditor(fresh_main_frame);
			// The screenEditor's usual refresh action will do nothing for header rows and must be redefined.
			editor.refresh = populateSceneSectionHeader.bind(undefined, inner_row);
			editorBuild(editor);
		}
	});
	
	// Music
	dialogue_setting_fields.push({
		type: 'button',
		locale: 'dialogue_main_music',
		action: function() {
			var fresh_main_frame = getRowById('frames', dialogue.main);
			var editor = musicEditor(fresh_main_frame);

			// The musicEditor's usual refresh action will do nothing for header rows and must be redefined.
			editor.refresh = populateSceneSectionHeader.bind(undefined, inner_row);
			editorBuild(editor);
		}
	});
	
	if(dialogue.locks)
	{
		// If psyche locks are enabled, include locks edition tools
		
		// Button to open locks editor
		dialogue_setting_fields.push({
			type: 'button',
			locale: 'locks_edit',
			action: function() {
				editorBuild(locksEditor(dialogue));
			}
		});
		
		// Button to remove the locks entirely
		dialogue_setting_fields.push({
			type: 'button',
			locale: 'locks_remove',
			action: function() {
				if(confirm(l('locks_remove_confirm')))
				{
					deleteConversation(dialogue.locks);
					dialogue.locks = null;
					
					// Remove the row map block
					rowSectionMapEdit({
						edit_type: 'Scene_Dialogue_Locks_Delete',
						scene_type: scene_type,
						scene_id: scene_id,
						dialogue_id: dialogue_id
					});
				}
			}
		});
	}
	else
	{
		// If psyche locks are disabled, add button to enable them.
		dialogue_setting_fields.push({
			type: 'button',
			locale: 'locks_add',
			action:  function() {
				var target_index = getInsertionIndexInDialogue(dialogue, 'locks_conversation');
				
				// Create locks conversation with return action
				dialogue.locks = createNewConversationAt(target_index, new Object({
					action_name: 'LocksEnd',
					action_parameters: prefixRawParameters({
						context: {
							parent_dialogue: new Object({
								scene_type: scene_type,
								scene_id: scene_id,
								section_type: 'dialogues',
								section_id: dialogue_id
							})
						}
					})
				}));
				
				// Add hidden status to the descriptor
				dialogue.locks.hidden = false;
				
				// Add locks list to the descriptor
				dialogue.locks.locks_to_display = [];
				
				//Add the row map block
				rowSectionMapEdit({
					edit_type: 'Scene_Dialogue_Locks_Insert',
					scene_type: scene_type,
					scene_id: scene_id,
					dialogue_id: dialogue_id,
					frame_index: target_index
				});
			}
		});
	}
	
	var subsections = [
		{
			type: 'settings',
			locale: 'dialogue_settings',
			fields: dialogue_setting_fields
		},
		{
			type: 'single_conversation',
			conv_type: 'intro_conversation' ,
			locale: 'dialogue_intro',
			setConvTitle: function(title) {
				title.setAttribute('data-locale-content', 'dialogue_intro');
			}
		},
		{
			type: 'conversation_list',
			conv_type: 'talk_topics',
			locale: 'dialogue_talk',
			appendConvControls: function(element, scene, section, conv_type, conv) {
				var topic_hidden_box = createFormElement('checkbox', conv.hidden);
				registerEventHandler(topic_hidden_box, 'change', function() {
					conv.hidden = topic_hidden_box.getValue();
				}, false);
				var topic_hidden = createLabel(topic_hidden_box, 'topic_hidden');
				element.appendChild(topic_hidden);
				
				var topic_title = createFormElement('string', conv.title);
				topic_title.setAttribute('data-locale-placeholder', 'topic_title');
				registerEventHandler(topic_title, 'change', function() {
					conv.title = topic_title.getValue();
				}, false);
				element.appendChild(topic_title);
				
				return true;
			},
			setConvTitle: function(title, conv_type, conv) {
				title.setAttribute('data-locale-content', 'dialogue_talk_topic');
				title.setAttribute('data-localevar-topic', conv.title);
			}
		},
		{
			type: 'conversation_list',
			conv_type: 'present_conversations',
			locale: 'dialogue_present',
			appendConvControls: function(element, scene, section, conv_type, conv) {
				if(conv.elt)
				{
					var present_elt = createFormElement('cr_element_descriptor', conv.elt);
					registerEventHandler(present_elt, 'change', function(){
						conv.elt = present_elt.getValue();
					}, false);
					element.appendChild(createLabel(present_elt, 'present_elt'));
					return true;
				}
				else
				{
					var present_elt = document.createElement('p');
					present_elt.setAttribute('data-locale-content', 'dialogue_present_others');
					element.appendChild(present_elt);
					return false;
				}
			},
			setConvTitle: function(title, conv_type, conv) {
				var elt_desc = conv.elt;
				if(elt_desc)
				{
					title.setAttribute('data-locale-content', 'dialogue_present_elt');
					switch(elt_desc.type)
					{
						case 'evidence':
							title.setAttribute('data-localevar-elt', getRowById('evidence', elt_desc.id).name);
							break;
						case 'profiles':
							title.setAttribute('data-localevar-elt', getRowById('profiles', elt_desc.id).long_name);
							break;
					}
				}
				else
				{
					title.setAttribute('data-locale-content', 'dialogue_present_others');
				}
			}
		}
	];
	
	if(dialogue.locks)
	{
		subsections.push({
			type: 'single_conversation',
			conv_type: 'locks_conversation',
			locale: 'dialogue_locks',
			setConvTitle: function(title) {
				title.setAttribute('data-locale-content', 'dialogue_locks_conv');
			}
		});
	}
	
	/*
	var preview = new ScreenDisplay();
	preview.loadFrame(getRowById('frames', dialogue.main), true);
	*/

	inner_row.getData = function() {
		return {
			'scene_section_descriptor': scene_section_descriptor,
			'subsections': subsections,
			'display': display
		}
	};

	populateSceneSectionHeader(inner_row);

	return outer_row;
}

function getSceneExaminationHeader(scene_type, scene_id, examination_id, display)
{
	var scene_section_descriptor = {
		'scene_type': scene_type,
		'scene_id': scene_id,
		'section_type': 'examinations',
		'section_id': examination_id
	};
	var outer_row = getSceneSectionHeader(scene_section_descriptor);
	var inner_row = outer_row.firstChild;

	var subsections = [
		{
			type: 'settings',
			locale: 'examination_settings',
			fields: [
				{
					name: 'place',
					type: 'place_descriptor',
					locale: 'examination_place'
				}/*,
				{
					name: 'enable_deduction',
					type: 'checkbox',
					locale: 'enable_deduction'
				}*/
			]
		},
		{
			type: 'conversation_list',
			conv_type: 'examine_conversations',
			locale: 'examination_examine',
			appendConvControls: function(element, scene, section, conv_type, conv) {
				if(conv.area)
				{
					var examine_area = createFormElement('area_descriptor', conv.area, {background: section.place});
					registerEventHandler(examine_area, 'change', function(){
						conv.area = examine_area.getValue();
					}, false);
					element.appendChild(createLabel(examine_area, 'examine_area'));
					return true;
				}
				else
				{
					var examine_area = document.createElement('p');
					examine_area.setAttribute('data-locale-content', 'examination_examine_others');
					element.appendChild(examine_area);
					return false;
				}
			},
			setConvTitle: function(title, conv_type, conv) {
				var area_desc = conv.area;
				if(area_desc)
				{
					title.setAttribute('data-locale-content', 'examination_examine_area'); //TODO: add reference to what is being examined
				}
				else
				{
					title.setAttribute('data-locale-content', 'examination_examine_others');
				}
			}
		}/*,
		{
			type: 'conversation_list',
			conv_type: 'deduce_conversations',
			locale: 'examination_deduce',
			appendConvControls: function(element, scene, section, conv_type, conv) {
				if(conv.area)
				{
					var deduce_elt = createFormElement('cr_element_descriptor', conv.elt);
					registerEventHandler(deduce_elt, 'change', function(){
						conv.elt = deduce_elt.getValue();
					}, false);
					element.appendChild(createLabel(deduce_elt, 'deduce_elt'));
					
					var deduce_area = createFormElement('area_descriptor', conv.area, {background: section.place});
					registerEventHandler(deduce_area, 'change', function(){
						conv.area = deduce_area.getValue();
					}, false);
					element.appendChild(createLabel(deduce_area, 'deduce_area'));
					
					return true;
				}
				else
				{
					var deduce_area = document.createElement('p');
					deduce_area.setAttribute('data-locale-content', 'examination_deduce_others');
					element.appendChild(deduce_area);
					return false;
				}
			},
			setConvTitle: function(title, conv_type, conv) {
				var area_desc = conv.area;
				if(area_desc)
				{
					title.setAttribute('data-locale-content', 'examination_deduce_area'); //TODO: add reference to what is being examined
				}
				else
				{
					title.setAttribute('data-locale-content', 'examination_deduce_others');
				}
			}
		}*/
	];

	inner_row.getData = function() {
		return {
			'scene_section_descriptor': scene_section_descriptor,
			'subsections': subsections,
			'display': display
		}
	};

	populateSceneSectionHeader(inner_row);

	return outer_row;
}

//Scene header and footer generators
function getGenericSceneHeader(scene_type, scene_id, section_blocks, display)
{
	var scene = getRowById(scene_type, scene_id);
	
	//generate insert link
	var insert_link = document.createElement('a');
	insert_link.className = "insert";
	insert_link.setAttribute('data-locale-content', 'add_frame');
	registerEventHandler(insert_link, 'click', insertNewFrameBefore.bind(undefined, true, scene.start), false);
	translateNode(insert_link);
	
	//generate header contents
	var tabs, contents;
	
	function editSectionRowMapOnClick(element, message)
	{
		registerEventHandler(element, 'click', (function(e){
			rowSectionMapEdit(message);
		}), false);
	}
	
	function openSectionBlockOnClick(element, tab_index, contents_div)
	{
		registerEventHandler(element, 'click', function(e){
			SectionBlock_Open(tab_index, contents_div);
		}, false);
	}
	
	function SectionBlock_Open(tab_index, contents_div)
	{
		//Close all other tabs
		for(var i = 0; i < tabs.childNodes.length; i++)
		{
			removeClass(tabs.childNodes[i], 'open');		
		}
		
		//Open requested tab
		addClass(tabs.childNodes[tab_index], 'open');
		
		//Update contents div
		emptyNode(contents_div);
		contents_div.appendChild(getSectionContents(tab_index));
	}
	
	var row = document.createElement('div');
	row.id = 'Scene_'+scene_id+'_header';
	addClass(row, 'panel-section-header');
	
	var title = document.createElement('h1');
	title.setAttribute('data-localevar-n', scene.id);
	title.setAttribute('data-locale-before', 'scene_n');
	
		var scene_title = createFormElement('string', scene.name);
		scene_title.setAttribute('data-locale-placeholder', 'scene_name');
		registerEventHandler(scene_title, 'change', function()
		{
			scene.name = scene_title.getValue();
		}, false);
		title.appendChild(scene_title);
		
	translateNode(title);
	row.appendChild(title);
	
	var delete_button = document.createElement('button');
	addClass(delete_button, 'box-delete');
	delete_button.setAttribute('data-locale-content', 'delete');
	registerEventHandler(delete_button, 'click', function(){
		if(confirm(l('scene_delete')))
		{
			deleteFramesBlock(scene_type, scene_id);
			updateSectionRowMap();
		}
	}, false);
	translateNode(delete_button);
	row.appendChild(delete_button);
	
	function getSectionContents(section_block_index)
	{
		var section_block = section_blocks[section_block_index];
		
		switch(section_block.type)
		{
			case 'single_section':
			
				var container = document.createElement('div');
				addClass(container, 'single_opener');
				
				//Display open button
				var open_button_container = document.createElement('div');
				addClass(open_button_container, 'button_container');
				var open_button = document.createElement('button');
				open_button.setAttribute('data-locale-content', 'open');
				editSectionRowMapOnClick(open_button, new Object({
					edit_type: 'Scene_Section_Open',
					scene_type: scene_type,
					scene_id: scene_id,
					section_block_index: section_block_index,
					section_type: section_block.section_type,
					section_id: 1
				}));
				translateNode(open_button);
				open_button_container.appendChild(open_button);
				container.appendChild(open_button_container);
				
				//Display description
				var description = document.createElement('p');
				description.setAttribute('data-locale-content', section_block.section_type + '_description');
				translateNode(description);
				container.appendChild(description);
				
				return container;
				
				break;
			
			case 'settings':
			
				// Build a list of data fields linked to a setting
				var settings = document.createElement('div');
					
				for(var i = 0; i < section_block.fields.length; i++)
				{
					var field = section_block.fields[i];
					var form_element = createFormElement(field.type, scene[field.name]);
					registerEventHandler(form_element, 'change', (function(form_element, field) {
						scene[field.name] = form_element.getValue();
					}).bind(undefined, form_element, field), false);
					
					settings.appendChild(createLabel(form_element, field.locale));
				}
				
				return settings;
				break;
			
			case 'element':
			
				// Simply include an element directly
				return section_block.element;
				break;
				
		}
	}
	
	if(section_blocks.length > 1)
	{
		tabs = document.createElement('div');
		addClass(tabs, 'panel-tabs');
		contents = document.createElement('div');
		addClass(contents, 'panel-tab-contents');
		
		for(var i = 0; i < section_blocks.length; i++)
		{
			switch(section_blocks[i].type)
			{
				case 'single_section':
				
					//Click on tab opens section block
					var tab = document.createElement('a');
					tab.setAttribute('data-locale-content', section_blocks[i].section_type);
					openSectionBlockOnClick(tab, i, contents);
					tabs.appendChild(tab);
					
					break;
				
				case 'settings':
				case 'element':
				
					//Click on tab just opens the panel
					var tab = document.createElement('a');
					tab.setAttribute('data-locale-content', section_blocks[i].locale);
					openSectionBlockOnClick(tab, i, contents);
					tabs.appendChild(tab);
					break;
			}
		}
		
		translateNode(tabs);
		row.appendChild(tabs);
		row.appendChild(contents);
		
		//Open correct tab
		if(display.mode == 'section')
		{
			SectionBlock_Open(display.section_block_index, contents);
		}
	}
	else
	{
		row.appendChild(getSectionContents(0));
	}
	
	//generate outer row
	var outer_row = document.createElement('div');
	outer_row.className = 'storyboard-row panel-header';
	outer_row.appendChild(insert_link);
	outer_row.appendChild(row);
	
	return outer_row;
}

// Construct the actual row for this header.
function getSceneSectionHeader(scene_section_descriptor)
{
	var outer_row = document.createElement('div');
	outer_row.className = 'storyboard-row panel-row';

	var row = document.createElement('div');
	addClass(row, 'panel-section-header');
	addClass(row, 'last');
	outer_row.appendChild(row);

	var title = document.createElement('h1');
	title.setAttribute('data-localevar-n', scene_section_descriptor.section_id);
	title.setAttribute('data-locale-content', scene_section_descriptor.section_type);

	translateNode(title);
	row.appendChild(title);

	return outer_row;
}

function generateMoveListBuilder(scene_type, scene_id)
{
	function refreshElement(element, scene_type, scene_id)
	{
		emptyNode(element);
		
		var scene = getRowById(scene_type, scene_id);
		
		var list_elt = document.createElement('ul');
		addClass(list_elt, 'entity_list');
		for(var i = 0; i < scene.move_list.length; i++)
		{
			(function(index){
				var move_entry = scene.move_list[index];
				
				var list_item = document.createElement('li');
				
				var list_item_content = document.createElement('div');
				addClass(list_item_content, 'content');
				list_item.appendChild(list_item_content);
				
				var override_input = createFormElement('string', move_entry.name_override);
				registerEventHandler(override_input, 'change', function(){
					move_entry.name_override = override_input.getValue();
				}, false);
				
				var target_scene = getRowById(move_entry.scene_type, move_entry.scene_id);
				override_input.setAttribute('placeholder', target_scene ? target_scene.name : '');
				
				list_item_content.appendChild(override_input);
				
				var delete_button = document.createElement('button');
				delete_button.setAttribute('data-locale-content', 'delete');
				registerEventHandler(delete_button, 'click', function(){
					scene.move_list.splice(index, 1);
					refreshElement(element, scene_type, scene_id);
				}, false);
				translateNode(delete_button);
				list_item_content.appendChild(delete_button);
				
				list_elt.appendChild(list_item);
			})(i);
		}
		
		var add_item = document.createElement('li');
		var scene_select = createFormElement('scene_descriptor');
		add_item.appendChild(scene_select);
		var add_button = document.createElement('button');
		add_button.setAttribute('data-locale-content', 'add_move_target');
		registerEventHandler(add_button, 'click', function(){
			var target_scene_desc = scene_select.getValue();
			if(target_scene_desc)
			{
				scene.move_list.push(new Object({
					scene_type: target_scene_desc.scene_type,
					scene_id: target_scene_desc.scene_id,
					name_override: ''
				}));
				refreshElement(element, scene_type, scene_id);
			}
		}, false);
		translateNode(add_button);
		add_item.appendChild(add_button);
		list_elt.appendChild(add_item);
		
		element.appendChild(list_elt);
	}
	
	var element = document.createElement('div');
	refreshElement(element, scene_type, scene_id); 
	
	return element;
}

function getSceneHeader(scene_id, display)
{
	return getGenericSceneHeader('scenes', scene_id, [
		{
			type: 'settings',
			locale: 'scene_settings',
			fields: [
				{
					name: 'hidden',
					type: 'checkbox',
					locale: 'hidden'
				}
			]
		},
		{
			type: 'single_section',
			section_type: 'dialogues',
		},
		{
			type: 'single_section',
			section_type: 'examinations',
		},
		{
			type: 'element',
			locale: 'move',
			element: generateMoveListBuilder('scenes', scene_id)
		}
	], display);	
}

function getSceneFooter(scene_id, display)
{
	var scene = getRowById('scenes', scene_id);
	
	var row = document.createElement('div');
	row.id = 'Scene_'+scene_id+'_footer';
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'storyboard-row panel-footer';
	
	//generate insert link
	switch(display.mode)
	{
		case 'closed':
			//Scene closed : nothing to display
			break;
			
		case 'section':
			//A section is opened
			var section = getById(scene[display.section_type], display.section_id);
			
			switch(display.section_mode)
			{
				case 'closed':
					break;
				
				case 'subsection':
					if(display.subsection_mode == 'open')
					{
						var insertFunction;
						
						//Insert function depends on conv type
						switch(display.subsection_type)
						{
							case 'single_conversation':
								
								var frame_id;
								
								//TODO : avoid switch; make things more generic
								switch(display.conv_type)
								{
									case 'intro_conversation':
										frame_id = section.intro_end;
										break;
									
									case 'locks_conversation':
										frame_id = section.locks.end;
										break;
								}
								insertFunction = insertNewFrameBefore.bind(undefined, true, frame_id);
								break;
							
							case 'conversation_list':
								var conv = section[display.conv_type][display.conv_index];
								insertFunction = insertNewFrameBefore.bind(undefined, true, conv.end);
								break;
						}
						
						//Generate insert link
						var insert_link = document.createElement('a');
						insert_link.className = "insert";
						
						insert_link.setAttribute('data-locale-content', 'add_frame');
						registerEventHandler(insert_link, 'click', 
							insertFunction, 
							false);
						translateNode(insert_link);
						
						row.appendChild(insert_link);
					}
					break;
			}
			break;
	}
	
	outer_row.appendChild(row);
	
	return outer_row;
}

//Returns the first frame where to insert a new conversation in a dialogue
function getInsertionIndexInDialogue(dialogue, frame_type, conv_index)
{
	switch(frame_type)
	{
		case 'locks_conversation':
			
			return getRowIndexById('frames', dialogue.present_conversations[dialogue.present_conversations.length - 1].end) + 1;
		
		case 'present_conversations' :
		
			if(conv_index > 0)
			{
				return getRowIndexById('frames', dialogue.present_conversations[conv_index - 1].end) + 1;
			}
			else
			{
				return getRowIndexById('frames', dialogue.present) + 1;
			}
		
		case 'talk_topics' :
			
			if(conv_index > 0)
			{
				return getRowIndexById('frames', dialogue.talk_topics[conv_index - 1].end) + 1;
			}
			else
			{
				return getRowIndexById('frames', dialogue.talk) + 1;
			}
	}
}

//Returns the first frame where to insert a new conversation in an examination
function getInsertionIndexInExamination(examination, frame_type, conv_index)
{
	switch(frame_type)
	{
		case 'examine_conversations' :
		
			if(conv_index > 0)
			{
				return getRowIndexById('frames', examination.examine_conversations[conv_index - 1].end) + 1;
			}
			else
			{
				return getRowIndexById('frames', examination.examine) + 1;
			}
			break;
		
		case 'deduce_conversations' :
			
			if(conv_index > 0)
			{
				return getRowIndexById('frames', examination.deduce_conversations[conv_index - 1].end) + 1;
			}
			else
			{
				if(examination.examine_conversations.length > 0)
				{
					return getRowIndexById('frames', examination.examine_conversations[examination.examine_conversations.length - 1].end) + 1;
				}
				else
				{
					return getRowIndexById('frames', examination.examine) + 1;
				}
			}
			break;
	}
}

//END OF MODULE
Modules.complete('editor_frames_scene');
