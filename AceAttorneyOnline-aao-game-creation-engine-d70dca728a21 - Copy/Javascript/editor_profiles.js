"use strict";
/*
Ace Attorney Online - Editor profile rows data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_profiles',
	dependencies : ['trial', 'trial_data', 'editpanels', 'frame_data', 'nodes', 'events', 'form_elements', 'editor_form_cr', 'objects', 'editor_cell_section', 'editor_locate_depending'],
	init : function() 
	{
		if(!trial_data)
		{
			//if no trial data has been loaded, editor won't run anyway
			return;
		}
		
		profiles_section_descriptor = new Object({
			list : trial_data.profiles,
			offset : 1,
			generator : getProfileRow,
			insert_generator: getProfileInsertRow
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

function getProfileRow(profile_index)
{
	var profile_data = trial_data.profiles[profile_index];
	
	//Outer row
	var outer_cell = document.createElement('div');
	outer_cell.className = 'cr-cell';
	
	outer_cell.getData = function()
	{
		return getRowById('profiles', profile_data.id);
	};
		
		//generate insert-before link
		var insert_link = document.createElement('a');
		addClass(insert_link, 'insert');
		var insert_link_text = document.createElement('span');
		insert_link_text.setAttribute('data-locale-content', 'add_profile');
		insert_link.appendChild(insert_link_text);
		translateNode(insert_link);
	
		registerEventHandler(insert_link, 'click', function()
		{
			createAndInsertDataRow('profiles', getRowIndexById('profiles', profile_data.id));
			reInitCellSectionContent();
		}, false);
		outer_cell.appendChild(insert_link);
	
		//Inner row
		var inner_cell = document.createElement('div');
		addClass(inner_cell, 'cr-elt');
		inner_cell.id = 'profile_'+profile_data.id;
		outer_cell.appendChild(inner_cell);
		
			//Id box
			var small = document.createElement('small');
			setNodeTextContents(small, profile_data.id);
			inner_cell.appendChild(small);

			// Button container
			var cr_elt_actions = document.createElement('div');
			addClass(cr_elt_actions, 'cr-elt-actions-box');
			inner_cell.appendChild(cr_elt_actions);

			// Clone button
			var clone_button = document.createElement('button');
			addClass(clone_button, 'box-clone');
			clone_button.setAttribute('data-locale-content', 'clone');
			registerEventHandler(clone_button, 'click', function()
			{
				createAndInsertDataRowFromPreset('profiles', getRowIndexById('profiles', profile_data.id) + 1, profile_data);
				reInitCellSectionContent();
			}, false);
			cr_elt_actions.appendChild(clone_button);
			
			// Delete button
			var delete_button = document.createElement('button');
			addClass(delete_button, 'box-delete');
			delete_button.setAttribute('data-locale-content', 'delete');
			registerEventHandler(delete_button, 'click', function()
			{
				var depending_frames = getFramesDependingOnProfile(profile_data.id);
				
				if(depending_frames.length == 0)
				{
					deleteDataRow('profiles', getRowIndexById('profiles', profile_data.id));
					reInitCellSectionContent();
				}
				else
				{
					alert(lr('cannot_delete_dependance', new Object({frames: depending_frames.join(', ')})));
				}
			}, false);
			cr_elt_actions.appendChild(delete_button);
			
			//Profile data
			var profile_div = document.createElement('div');
			addClass(profile_div, 'evidence_display');
				
				var summary = document.createElement('div');
				addClass(summary, 'summary');
				
					var profile_icon = new Image();
					profile_icon.src = getProfileIconUrl(profile_data);
					summary.appendChild(profile_icon);
					
					var long_name = createFormElement('string', profile_data.long_name);
					addClass(long_name, 'name');
					long_name.setAttribute('data-locale-placeholder', 'long_name_hint');
					registerEventHandler(long_name, 'change', function()
					{
						outer_cell.getData().long_name = long_name.getValue();
					}, false);
					summary.appendChild(long_name);
					
					var civil_status = createFormElement('text', profile_data.civil_status);
					addClass(civil_status, 'civil_status');
					civil_status.setAttribute('data-locale-placeholder', 'civil_status_hint');
					registerEventHandler(civil_status, 'change', function()
					{
						outer_cell.getData().civil_status = civil_status.getValue();
					}, false);
					summary.appendChild(civil_status);
					
				profile_div.appendChild(summary);
				
				var description = createFormElement('text', profile_data.description);
				addClass(description, 'description');
				description.setAttribute('data-locale-placeholder', 'description_hint');
				registerEventHandler(description, 'change', function()
				{
					outer_cell.getData().description = description.getValue();
				}, false);
				profile_div.appendChild(description);
			
			inner_cell.appendChild(profile_div);
			
			var hidden_checkbox = createFormElement('checkbox', profile_data.hidden);
			registerEventHandler(hidden_checkbox, 'change', function()
			{
				outer_cell.getData().hidden = hidden_checkbox.getValue();
			}, false);
			var hidden_label = createLabel(hidden_checkbox, 'hidden');
			inner_cell.appendChild(hidden_label);
				
			inner_cell.appendChild(document.createElement('hr'));
			
			//Character data
			var char_div = document.createElement('div');
				
				var short_name_input = createFormElement('string', profile_data.short_name);
				short_name_input.setAttribute('data-locale-placeholder', 'short_name_hint');
				registerEventHandler(short_name_input, 'change', function()
				{
					outer_cell.getData().short_name = short_name_input.getValue();
				}, false);
				var short_name = createLabel(short_name_input, 'short_name');
				char_div.appendChild(short_name);
				
				var voice_select = createFormElement('profile_voice', profile_data.voice);
				registerEventHandler(voice_select, 'change', function()
				{
					outer_cell.getData().voice = voice_select.getValue();
				}, false);
				var voice = createLabel(voice_select, 'voice');
				char_div.appendChild(voice);
				
				var base_select = createFormElement('profile_base', profile_data.base);
				registerEventHandler(base_select, 'change', function()
				{
					var profile_data = outer_cell.getData();
					profile_data.base = base_select.getValue();
					profile_icon.src = getProfileIconUrl(profile_data);
				}, false);
				var base = createLabel(base_select, 'base');
				char_div.appendChild(base);
				
				var custom_pictures = document.createElement('button');
				addClass(custom_pictures, 'wide');
				custom_pictures.setAttribute('data-locale-content', 'custom_pictures');
				//set event to open custom pictures edition panel
				registerEventHandler(custom_pictures, 'click', function()
				{
					editorBuild(customProfileEditor(outer_cell), outer_cell);
				}, false);
				char_div.appendChild(custom_pictures);
				
			inner_cell.appendChild(char_div);
			
			
	translateNode(outer_cell);
	
	outer_cell.subelts = new Object({
		profile_icon: profile_icon
	});
	
	return outer_cell;
}

function getProfileInsertRow()
{
	//generate insert link
	var insert_link = document.createElement('div');
	addClass(insert_link, 'last insert');
	insert_link.setAttribute('data-locale-content', 'add_profile');
	
	registerEventHandler(insert_link, 'click', function(){
		createAndInsertDataRow('profiles');
		reInitCellSectionContent();
	}, false);
	
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'cr-cell';
	outer_row.appendChild(insert_link);
	
	translateNode(outer_row);
	
	return outer_row;
}

function customProfileEditor(cell)
{
	var profile_data = cell.getData();
	var dummy_profile_data = new objClone(profile_data);
	
	var editor = document.createElement('div');
	
	var title = document.createElement('h2');
	title.setAttribute('data-locale-content', 'custom_pictures');
	editor.appendChild(title);
	
	var icon_div = document.createElement('div');
	addClass(icon_div, 'icon_div');
	
	var profile_icon = new Image();
	profile_icon.src = getProfileIconUrl(dummy_profile_data);
	icon_div.appendChild(profile_icon);
	
	var icon_radio = createFormElement('cr_icon_source', dummy_profile_data.icon != "");
	registerEventHandler(icon_radio, 'change', function()
	{
		if(icon_radio.getValue())
		{
			icon_input_label.style.display = '';
		}
		else
		{
			icon_input_label.style.display = 'none';
			dummy_profile_data.icon = "";
			profile_icon.src = getProfileIconUrl(dummy_profile_data);
		}
	}, false);
	icon_div.appendChild(icon_radio);
	
	var icon_input = createFormElement('image_uri', dummy_profile_data.icon);
	
	registerEventHandler(icon_input, 'change', function()
	{
		dummy_profile_data.icon = icon_input.getValue();
		profile_icon.src = getProfileIconUrl(dummy_profile_data);
	}, false);
	var icon_input_label = createLabel(icon_input, 'picture_uri');
					
	if(dummy_profile_data.icon == "")
	{
		icon_input_label.style.display = 'none';
	}
	icon_div.appendChild(icon_input_label);
	
	editor.appendChild(icon_div);
	
	var sprites_table = document.createElement('div');
	addClass(sprites_table, 'root');
	
	var sprites_table_body = document.createElement('div');
	addClass(sprites_table_body, 'section');
	updateCustomSpritesList(sprites_table_body, dummy_profile_data);
	sprites_table.appendChild(sprites_table_body);
	
	editor.appendChild(sprites_table);
	
	translateNode(editor);
	
	//Cancel and confirm functions
	editor.cancel = function()
	{
		editor.close();
	};
	editor.confirm = function()
	{
		trial_data.profiles[getRowIndexById('profiles', profile_data.id)] = dummy_profile_data;
		editor.close();
	};
	editor.refresh = function()
	{
		cell.subelts.profile_icon.src = getProfileIconUrl(dummy_profile_data);
	};
	
	return editor;
}

function updateCustomSpritesList(body, profile_data)
{
	var sprites = profile_data.custom_sprites;
	emptyNode(body);
	
	var title = document.createElement('h3');
	title.setAttribute('data-locale-content', 'custom_poses');
	body.appendChild(title);
	
	for(var i =0; i < sprites.length; i++)
	{
		(function(i){
			var sprite = sprites[i];
			
			var row = document.createElement('div');
			addClass(row, 'block');
			
				var delete_button = document.createElement('button');
				delete_button.setAttribute('data-locale-content', 'delete');
				addClass(delete_button, 'box-delete');
				registerEventHandler(delete_button, 'click', function() {
					var depending_frames = getFramesDependingOnSprite(profile_data.id, sprite.id);
				
					if(depending_frames.length == 0)
					{
						sprites.splice(i, 1);
						updateCustomSpritesList(body, profile_data);
					}
					else
					{
						alert(lr('cannot_delete_dependance', new Object({frames: depending_frames.join(', ')})));
					}
				}, false);
				row.appendChild(delete_button);
			
				var input_name = createFormElement('string', sprite.name);
				registerEventHandler(input_name, 'change', function()
				{
					sprite.name = this.getValue();
				}, false);	
				row.appendChild(createLabel(input_name, 'pose_name'));
				
				var sprites_table = document.createElement('table');
				addClass(sprites_table, 'custom_sprites_table');
				
				var sprites_thead = document.createElement('thead');
				sprites_table.appendChild(sprites_thead);
					var sprites_row_titles = document.createElement('tr');
					sprites_thead.appendChild(sprites_row_titles);
				
				var sprites_tbody = document.createElement('tbody');
				sprites_table.appendChild(sprites_tbody);
					var sprites_row_img = document.createElement('tr');
					sprites_tbody.appendChild(sprites_row_img);
					var sprites_row_fields = document.createElement('tr');
					addClass(sprites_row_fields, 'custom_sprites_fields');
					sprites_tbody.appendChild(sprites_row_fields);
				
				// Talking sprite
				
				var header_talking = document.createElement('th');
				header_talking.setAttribute('data-locale-content', 'talking_sprite');
				sprites_row_titles.appendChild(header_talking);
			
				var img_talking_cell = document.createElement('td');
				sprites_row_img.appendChild(img_talking_cell);
					var img_talking = new Image();
					img_talking.src = sprite.talking;
					img_talking_cell.appendChild(img_talking);
				
				var fields_talking_cell = document.createElement('td');
				sprites_row_fields.appendChild(fields_talking_cell);
					var input_talking = createFormElement('image_uri', sprite.talking);
					registerEventHandler(input_talking, 'change', function()
					{
						sprite.talking = this.getValue();
						img_talking.src = sprite.talking;
					}, false);	
					fields_talking_cell.appendChild(createLabel(input_talking, 'picture_uri'));
				
				// Still sprite
				
				var header_still = document.createElement('th');
				header_still.setAttribute('data-locale-content', 'still_sprite');
				sprites_row_titles.appendChild(header_still);
				
				var img_still_cell = document.createElement('td');
				sprites_row_img.appendChild(img_still_cell);
					var img_still = new Image();
					img_still.src = sprite.still;
					img_still_cell.appendChild(img_still);
				
				var fields_still_cell = document.createElement('td');
				sprites_row_fields.appendChild(fields_still_cell);
					var input_still = createFormElement('image_uri', sprite.still);
					registerEventHandler(input_still, 'change', function()
					{
						sprite.still = this.getValue();
						img_still.src = sprite.still;
					}, false);
					fields_still_cell.appendChild(createLabel(input_still, 'picture_uri'));
				
				// Startup sprite
				
				var header_startup = document.createElement('th');
				header_startup.setAttribute('data-locale-content', 'startup_sprite');
				sprites_row_titles.appendChild(header_startup);
				
				var img_startup_cell = document.createElement('td');
				sprites_row_img.appendChild(img_startup_cell);
					var img_startup = new Image();
					img_startup.src = sprite.startup;
					img_startup_cell.appendChild(img_startup);
				
				var fields_startup_cell = document.createElement('td');
				sprites_row_fields.appendChild(fields_startup_cell);
				
					var input_startup = createFormElement('image_uri', sprite.startup);
					registerEventHandler(input_startup, 'change', function()
					{
						sprite.startup = this.getValue();
						img_startup.src = sprite.startup;
					}, false);
					fields_startup_cell.appendChild(createLabel(input_startup, 'picture_uri'));
					
					var input_startup_duration = createFormElement('natural', sprite.startup_duration);
					registerEventHandler(input_startup_duration, 'change', function()
					{
						sprite.startup_duration = this.getValue();
					}, false);
					fields_startup_cell.appendChild(createLabel(input_startup_duration, 'startup_duration'));
			
				row.appendChild(sprites_table);
				
			body.appendChild(row);
		})(i);
	}
	
	var sprites_add = document.createElement('a');
	addClass(sprites_add, 'insert');
	sprites_add.setAttribute('data-locale-content', 'add_sprite');
	registerEventHandler(sprites_add, 'click', function()
	{
		sprites.push(createDataRow('sprite', getNewId(profile_data.custom_sprites, 0)));
		updateCustomSpritesList(body, profile_data);
	}, false);
	body.appendChild(sprites_add);
	
	translateNode(body);
}

//EXPORTED VARIABLES
var profiles_section_descriptor;

//EXPORTED FUNCTIONS
function initProfilesTab(section, content_div)
{
	setCellSectionDisplay(section, content_div);
	initCellSectionContent(profiles_section_descriptor);
}

//END OF MODULE
Modules.complete('editor_profiles');
