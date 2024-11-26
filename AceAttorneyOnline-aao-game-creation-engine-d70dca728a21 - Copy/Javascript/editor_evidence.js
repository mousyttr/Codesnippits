"use strict";
/*
Ace Attorney Online - Editor frame rows data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_evidence',
	dependencies : ['trial', 'editpanels', 'frame_data', 'nodes', 'events', 'form_elements', 'editor_form_cr', 'objects', 'editor_cell_section'],
	init : function() 
	{
		if(!trial_data)
		{
			//if no trial data has been loaded, editor won't run anyway
			return;
		}
		
		evidence_section_descriptor = new Object({
			list : trial_data.evidence,
			offset : 1,
			generator : getEvidenceRow,
			insert_generator: getEvidenceInsertRow
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

function getEvidenceRow(evidence_index)
{
	var evidence_data = trial_data.evidence[evidence_index];
	
	//Outer row
	var outer_cell = document.createElement('div');
	outer_cell.className = 'cr-cell';
		
		//generate insert-before link
		var insert_link = document.createElement('a');
		addClass(insert_link, 'insert');
		var insert_link_text = document.createElement('span');
		insert_link_text.setAttribute('data-locale-content', 'add_evidence');
		
		insert_link.appendChild(insert_link_text);
		translateNode(insert_link);
		
		registerEventHandler(insert_link, 'click', function()
		{
			createAndInsertDataRow('evidence', getRowIndexById('evidence', evidence_data.id));
			reInitCellSectionContent();
		}, false);
		outer_cell.appendChild(insert_link);
	
		//Inner row
		var inner_cell = document.createElement('div');
		addClass(inner_cell, 'cr-elt');
		inner_cell.id = 'evidence_'+evidence_data.id;
		outer_cell.appendChild(inner_cell);
		
			//Id box
			var small = document.createElement('small');
			setNodeTextContents(small, evidence_data.id);
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
				createAndInsertDataRowFromPreset('evidence', getRowIndexById('evidence', evidence_data.id) + 1, evidence_data);
				reInitCellSectionContent();
			}, false);
			cr_elt_actions.appendChild(clone_button);
			
			// Delete button
			var delete_button = document.createElement('button');
			addClass(delete_button, 'box-delete');
			delete_button.setAttribute('data-locale-content', 'delete');
			registerEventHandler(delete_button, 'click', function()
			{
				var depending_frames = getFramesDependingOnEvidence(evidence_data.id);
				
				if(depending_frames.length == 0)
				{
					deleteDataRow('evidence', getRowIndexById('evidence', evidence_data.id));
					reInitCellSectionContent();
				}
				else
				{
					alert(lr('cannot_delete_dependance', new Object({frames: depending_frames.join(', ')})));
				}
			}, false);
			cr_elt_actions.appendChild(delete_button);
			
			//Evidence overview data
			var overview_div = document.createElement('div');
			addClass(overview_div, 'evidence_display');
				
				var summary = document.createElement('div');
				addClass(summary, 'summary');
				
					var evidence_icon = new Image();
					evidence_icon.src = getEvidenceIconUrl(evidence_data);
					summary.appendChild(evidence_icon);
					
					var name = createFormElement('string', evidence_data.name);
					addClass(name, 'name');
					name.setAttribute('data-locale-placeholder', 'name_hint');
					registerEventHandler(name, 'change', function()
					{
						outer_cell.getData().name = name.getValue();
					}, false);
					summary.appendChild(name);
					
					var metadata = createFormElement('text', evidence_data.metadata);
					addClass(metadata, 'civil_status');
					metadata.setAttribute('data-locale-placeholder', 'metadata_hint');
					registerEventHandler(metadata, 'change', function()
					{
						outer_cell.getData().metadata = metadata.getValue();
					}, false);
					summary.appendChild(metadata);
					
				overview_div.appendChild(summary);
				
				var description = createFormElement('text', evidence_data.description);
				addClass(description, 'description');
				description.setAttribute('data-locale-placeholder', 'description_hint');
				registerEventHandler(description, 'change', function()
				{
					outer_cell.getData().description = description.getValue();
				}, false);
				overview_div.appendChild(description);
			
			inner_cell.appendChild(overview_div);
			
			var hidden_checkbox = createFormElement('checkbox', evidence_data.hidden);
			registerEventHandler(hidden_checkbox, 'change', function()
			{
				outer_cell.getData().hidden = hidden_checkbox.getValue();
			}, false);
			var hidden_label = createLabel(hidden_checkbox, 'hidden');
			inner_cell.appendChild(hidden_label);
				
			inner_cell.appendChild(document.createElement('hr'));
			
			
			var icon_div = document.createElement('div');
			
				var icon_radio = createFormElement('cr_icon_source', evidence_data.icon_external);
				
				registerEventHandler(icon_radio, 'change', function(e)
				{
					var evidence_data = outer_cell.getData();
					
					evidence_data.icon_external = this.getValue();
					
					if(evidence_data.icon_external)
					{
						icon_input_label.style.display = '';
						icon_select_label.style.display = 'none';
						evidence_data.icon = icon_input.getValue();
					}
					else
					{
						icon_input_label.style.display = 'none';
						icon_select_label.style.display = '';
						evidence_data.icon = icon_select.getValue();
					}
					
					evidence_icon.src = getEvidenceIconUrl(evidence_data);
				}, false);
				
				icon_div.appendChild(icon_radio);
				
				var icon_select = createFormElement('evidence_icon', evidence_data.icon_external ? '' : evidence_data.icon);
				registerEventHandler(icon_select, 'change', function()
				{
					var evidence_data = outer_cell.getData();
					evidence_data.icon = icon_select.getValue();
					evidence_icon.src = getEvidenceIconUrl(evidence_data);
				}, false);
				var icon_select_label = createLabel(icon_select, 'icon');
				
				if(evidence_data.icon_external)
				{
					icon_select_label.style.display = 'none';
				}
				icon_div.appendChild(icon_select_label);
				
				
				var icon_input = createFormElement('image_uri', evidence_data.icon_external ? evidence_data.icon : '');
				
				registerEventHandler(icon_input, 'change', function()
				{
					var evidence_data = outer_cell.getData();
					evidence_data.icon = icon_input.getValue();
					evidence_icon.src = getEvidenceIconUrl(evidence_data);
				}, false);
				var icon_input_label = createLabel(icon_input, 'picture_uri');
				
				if(!evidence_data.icon_external)
				{
					icon_input_label.style.display = 'none';
				}
				icon_div.appendChild(icon_input_label);
			
			inner_cell.appendChild(icon_div);
			
			inner_cell.appendChild(document.createElement('hr'));
			
			var check_button_data_edit = document.createElement('button');
			addClass(check_button_data_edit, 'wide');
			check_button_data_edit.setAttribute('data-locale-content', 'check_button_data');
			//set event to open check button data edition panel
			registerEventHandler(check_button_data_edit, 'click', function()
			{
				editorBuild(checkButtonDataEditor(outer_cell), outer_cell);
			}, false);
			inner_cell.appendChild(check_button_data_edit);
			
	translateNode(outer_cell);
	
	outer_cell.getData = function()
	{
		return getRowById('evidence', evidence_data.id);
	};
	
	return outer_cell;
}

function getEvidenceInsertRow()
{
	//generate insert link
	var insert_link = document.createElement('div');
	addClass(insert_link, 'last insert');
	insert_link.setAttribute('data-locale-content', 'add_evidence');
	
	registerEventHandler(insert_link, 'click', function(){
		createAndInsertDataRow('evidence');
		reInitCellSectionContent();
	}, false);
	
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'cr-cell';
	outer_row.appendChild(insert_link);
	
	translateNode(outer_row);
	
	return outer_row;
}

function updateCheckDataPagesList(body, pages)
{
	emptyNode(body);
	
	var title = document.createElement('h3');
	title.setAttribute('data-locale-content', 'pages');
	body.appendChild(title);
	
	for(var i =0; i < pages.length; i++)
	{
		(function(i){
			var page = pages[i];
			
			var page_row = document.createElement('div');
			addClass(page_row, 'block');
			
			// Delete button
			var delete_button = document.createElement('button');
			addClass(delete_button, 'box-delete');
			delete_button.setAttribute('data-locale-content', 'delete');
			registerEventHandler(delete_button, 'click', function()
			{
				pages.splice(i, 1);
				updateCheckDataPagesList(body, pages);
			}, false);
			page_row.appendChild(delete_button);
			
			var page_type = createFormElement('evidence_check_page_type', page.type);
			page_row.appendChild(createLabel(page_type, 'page_type'));
			
			registerEventHandler(page_type, 'change', function()
			{
				page.type = page_type.getValue();
				updateCheckDataPagesList(body, pages);
			}, false);
			
			var type;
			switch(page.type)
			{
				case 'text':
					type = 'text';
					break;
				case 'image':
					type = 'image_uri';
					break;
				case 'sound':
					type = 'sound_uri';
					break;
				default:
					type = page.type;
					break;
			}
			
			var page_contents = createFormElement(type, page.content);
			registerEventHandler(page_contents, 'change', function()
			{
				page.content = page_contents.getValue();
			}, false);
			
			page_row.appendChild(createLabel(page_contents, 'page_contents'));
			
			body.appendChild(page_row);
			
		})(i);
	}
	
	var page_add = document.createElement('a');
	addClass(page_add, 'insert');
	page_add.setAttribute('data-locale-content', 'add_page');
	registerEventHandler(page_add, 'click', function()
	{
		pages.push(new Object({type: 'text', content: ''}));
		updateCheckDataPagesList(body, pages);
	}, false);
	body.appendChild(page_add);
	
	translateNode(body);
}

function checkButtonDataEditor(cell)
{
	var evidence_data = cell.getData();
	var dummy_evidence_data = new objClone(evidence_data);
	
	var editor = document.createElement('div');
	
	var title = document.createElement('h2');
	title.setAttribute('data-locale-content', 'check_button_data');
	editor.appendChild(title);
	
	var data_editor = document.createElement('div');
	addClass(data_editor, 'root');
	editor.appendChild(data_editor);
	
	var pages_list = document.createElement('div');
	addClass(pages_list, 'section');
	data_editor.appendChild(pages_list);
	
	updateCheckDataPagesList(pages_list, dummy_evidence_data.check_button_data);
	
	translateNode(editor);
	
	//Cancel and confirm functions
	editor.cancel = function()
	{
		editor.close();
	};
	editor.confirm = function()
	{
		trial_data.evidence[getRowIndexById('evidence', evidence_data.id)] = dummy_evidence_data;
		editor.close();
	};
	editor.refresh = function(){};
	
	return editor;
}

//EXPORTED VARIABLES
var evidence_section_descriptor;

//EXPORTED FUNCTIONS
function initEvidenceTab(section, content_div)
{
	setCellSectionDisplay(section, content_div);
	initCellSectionContent(evidence_section_descriptor);
}

//END OF MODULE
Modules.complete('editor_evidence');
