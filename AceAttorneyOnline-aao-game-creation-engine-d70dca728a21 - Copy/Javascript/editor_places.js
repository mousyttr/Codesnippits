"use strict";
/*
Ace Attorney Online - Editor frame rows data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_places',
	dependencies : ['trial', 'editpanels', 'nodes', 'events', 'form_elements', 'objects', 'editor_cell_section', 'display_engine_place', 'editor_locate_depending'],
	init : function() 
	{
		if(!trial_data)
		{
			//if no trial data has been loaded, editor won't run anyway
			return;
		}
		
		places_section_descriptor = new Object({
			list : trial_data.places,
			offset : 1,
			generator : getPlaceRow,
			insert_generator: getPlaceInsertRow
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

function getPlaceRow(place_index)
{
	var place_data = trial_data.places[place_index];
	
	//Outer row
	var outer_cell = document.createElement('div');
	outer_cell.className = 'places-cell';
		
		//generate insert-before link
		var insert_link = document.createElement('a');
		addClass(insert_link, 'insert');
		var insert_link_text = document.createElement('span');
		insert_link_text.setAttribute('data-locale-content', 'add_place');
		
		insert_link.appendChild(insert_link_text);
		translateNode(insert_link);
		
		registerEventHandler(insert_link, 'click', function()
		{
			var new_place = createAndInsertDataRow('places', getRowIndexById('places', place_data.id));
			new_place.background = {
				image:"",
				external: false,
				hidden: false
			};
			reInitCellSectionContent();
		}, false);
		outer_cell.appendChild(insert_link);
	
		//Inner row
		var inner_cell = document.createElement('div');
		addClass(inner_cell, 'places-elt');
		inner_cell.id = 'place_'+place_data.id;
		outer_cell.appendChild(inner_cell);
		
			//Id box
			var small = document.createElement('small');
			setNodeTextContents(small, place_data.id);
			inner_cell.appendChild(small);
			
			// Delete button
			var delete_button = document.createElement('button');
			addClass(delete_button, 'box-delete');
			delete_button.setAttribute('data-locale-content', 'delete');
			registerEventHandler(delete_button, 'click', function()
			{
				var depending_frames = getFramesDependingOnPlace(place_data.id);
				
				if(depending_frames.length == 0)
				{
					deleteDataRow('places', getRowIndexById('places', place_data.id));
					reInitCellSectionContent();
				}
				else
				{
					alert(lr('cannot_delete_dependance', new Object({frames: depending_frames.join(', ')})));
				}
			}, false);
			inner_cell.appendChild(delete_button);
			
			// Place preview
			var preview_container = document.createElement('div');
			addClass(preview_container, 'preview-container');
				var preview_screen = new PlaceDisplay();
				preview_screen.setPlace(place_data);
				preview_container.appendChild(preview_screen.render);
			inner_cell.appendChild(preview_container);
			
			// Place name
			var name_input = createFormElement('string', place_data.name);
			name_input.setAttribute('data-locale-placeholder', 'place_name_hint');
			registerEventHandler(name_input, 'change', function()
			{
				outer_cell.getData().name = name_input.getValue();
			}, false);
			var name = createLabel(name_input, 'place_name');
			inner_cell.appendChild(name);
			
			var place_edit = document.createElement('button');
			addClass(place_edit, 'wide');
			place_edit.setAttribute('data-locale-content', 'place_editor');
			inner_cell.appendChild(place_edit);
			
			//set event to open action edition panel
			registerEventHandler(place_edit, 'click', function()
			{
				editorBuild(placeEditor(outer_cell), inner_cell);
			}, false);
						
	translateNode(outer_cell);
	
	outer_cell.getData = function()
	{
		return getRowById('places', place_data.id);
	};
	
	return outer_cell;
}

function getPlaceInsertRow()
{
	//generate insert link
	var insert_link = document.createElement('div');
	addClass(insert_link, 'last insert');
	insert_link.setAttribute('data-locale-content', 'add_place');
	
	registerEventHandler(insert_link, 'click', function(){
		var new_place = createAndInsertDataRow('places');
		new_place.background = {
			image:"",
			external: false,
			hidden: false
		};
		reInitCellSectionContent();
	}, false);
	
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'places-cell';
	outer_row.appendChild(insert_link);
	
	translateNode(outer_row);
	
	return outer_row;
}

function placeEditor(cell)
{
	var bg_external;
	var bg_select_label;
	var bg_input_label;
	function updateBgSource()
	{
		if(bg_external.getValue())
		{
			bg_select_label.style.display = 'none';
			bg_input_label.style.display = '';
		}
		else
		{
			bg_select_label.style.display = '';
			bg_input_label.style.display = 'none';
		}
	}
	
	var place_data = cell.getData();
	
	//Dummy place data row to hold the information about the current changes
	var dummy_place_data = new objClone(place_data);
	
	var editor = document.createElement('div');
	
	var title = document.createElement('h2');
	title.setAttribute('data-locale-content', 'place_editor');
	editor.appendChild(title);
	
	// Select background
	
	bg_external = createFormElement('checkbox', dummy_place_data.background.external);
	editor.appendChild(createLabel(bg_external, 'background_external'));
	
	registerEventHandler(bg_external, 'change', function(){
		dummy_place_data.background.external = bg_external.getValue();
		updateBgSource();
	}, false);
	
	var bg_select = createFormElement('default_background', dummy_place_data.background.image);
	bg_select_label = createLabel(bg_select, 'background');
	editor.appendChild(bg_select_label);
	
	registerEventHandler(bg_select, 'change', function(){
		dummy_place_data.background.image = bg_select.getValue();
	}, false);
	
	var bg_input = createFormElement('image_uri', dummy_place_data.background.image);
	bg_input_label = createLabel(bg_input, 'background');
	editor.appendChild(bg_input_label);
	
	registerEventHandler(bg_input, 'change', function(){
		dummy_place_data.background.image = bg_input.getValue();
	}, false);
	
	updateBgSource();
	
	// Set background and foreground objects
	function updateObjects(objs_container)
	{
		emptyNode(objs_container);
		for(var obj_type in {background_objects: 0, foreground_objects:0})
		{
			(function(obj_type){
				var type_container = document.createElement('div');
				addClass(type_container, 'section');
				
				// Section title
				var title = document.createElement('h3');
				title.setAttribute('data-locale-content', obj_type);
				type_container.appendChild(title);
				
				// Section entities
				for(var i = 0; i < dummy_place_data[obj_type].length; i++)
				{
					(function(i) {
						var elt_container = document.createElement('div');
						addClass(elt_container, 'block');
						
						var elt_id = document.createElement('small');
						setNodeTextContents(elt_id, dummy_place_data[obj_type][i].id);
						elt_container.appendChild(elt_id);
						
						// Fields
						var name_input = createFormElement('string', dummy_place_data[obj_type][i].name);
						registerEventHandler(name_input, 'change', function() {
							dummy_place_data[obj_type][i].name = name_input.getValue();
						}, false);
						elt_container.appendChild(createLabel(name_input, 'object_name'));
						
						var uri_input = createFormElement('image_uri', dummy_place_data[obj_type][i].image);
						registerEventHandler(uri_input, 'change', function() {
							dummy_place_data[obj_type][i].image = uri_input.getValue();
						}, false);
						elt_container.appendChild(createLabel(uri_input, 'picture_uri'));
						
						var x_input = createFormElement('integer', dummy_place_data[obj_type][i].x);
						registerEventHandler(x_input, 'change', function() {
							dummy_place_data[obj_type][i].x = x_input.getValue();
						}, false);
						elt_container.appendChild(createLabel(x_input, 'x'));
						
						var y_input = createFormElement('integer', dummy_place_data[obj_type][i].y);
						registerEventHandler(y_input, 'change', function() {
							dummy_place_data[obj_type][i].y = y_input.getValue();
						}, false);
						elt_container.appendChild(createLabel(y_input, 'y'));
						
						var hidden = createFormElement('checkbox', dummy_place_data[obj_type][i].hidden);
						registerEventHandler(hidden, 'change', function() {
							dummy_place_data[obj_type][i].hidden = hidden.getValue();
						}, false);
						elt_container.appendChild(createLabel(hidden, 'hidden'));
						
						// Delete button
						var delete_button = document.createElement('button');
						delete_button.setAttribute('data-locale-content', 'delete');
						addClass(delete_button, 'delete');
						registerEventHandler(delete_button, 'click', (function(index)
						{
							dummy_place_data[obj_type].splice(index, 1);
							updateObjects(objs_container);
						}).bind(undefined, i), false);
						elt_container.appendChild(delete_button);
						
						type_container.appendChild(elt_container);
					})(i);
				}
				
				// Section insert
				var insert = document.createElement('a');
				addClass(insert, 'insert');
				insert.setAttribute('data-locale-content', 'add_' + obj_type);
				registerEventHandler(insert, 'click', function()
				{
					dummy_place_data[obj_type].push(new Object({
						id: getNewId(dummy_place_data[obj_type], 0),
						name: '',
						image: '',
						external: 1,
						hidden: 0,
						x: 0,
						y: 0
					}));
					updateObjects(objs_container);
				}, false);
				type_container.appendChild(insert);
				
				objs_container.appendChild(type_container);
			})(obj_type);
		}
		translateNode(objs_container);
	}
	
	var objs_container = document.createElement('div');
	addClass(objs_container, 'root');
	editor.appendChild(objs_container);
	updateObjects(objs_container);
	
	//Cancel and confirm functions
	editor.cancel = function()
	{
		editor.close();
	};
	editor.confirm = function()
	{
		// Save dummy place data
		trial_data.places[getRowIndexById('places', place_data.id)] = dummy_place_data;
		editor.close();
	};
	editor.refresh = function()
	{
		reInitCellSectionContent();
	};
	
	translateNode(editor);
	
	return editor;
}

//EXPORTED VARIABLES
var places_section_descriptor;

//EXPORTED FUNCTIONS
function initPlacesTab(section, content_div)
{
	setCellSectionDisplay(section, content_div);
	initCellSectionContent(places_section_descriptor);
}

//END OF MODULE
Modules.complete('editor_places');
