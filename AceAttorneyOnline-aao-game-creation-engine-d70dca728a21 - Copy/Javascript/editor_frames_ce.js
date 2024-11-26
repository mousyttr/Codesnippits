"use strict";
/*
Ace Attorney Online - Handling CEs in the storyboard

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_frames_ce',
	dependencies : ['trial', 'trial_data', 'editor_frame_rows', 'actions_parameters'],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS

//Update the end frame pointer of a CE
function CE_updateEndFrame(ce)
{
	if(ce.failure_conv_end)
	{
		//If there is a failure conversation, its end is the end of the CE.
		ce.end = ce.failure_conv_end;
		return;
	}
	
	if(ce.statements.length > 0)
	{
		//Loop through statement conversations
		for(var i = ce.statements.length - 1; i >= 0; i--)
		{
			var statement = ce.statements[i];
			if(statement.optional_conv_end)
			{
				//If there is an optional conv, take its end
				ce.end = statement.optional_conv_end;
				return;
			}
			else if(statement.pressing_conv_end)
			{
				//If there is a pressing conv, take its end
				ce.end = statement.pressing_conv_end;
				return;
			}
		}
	}
	
	//Check cocouncil conversation
	if(ce.cocouncil_end)
	{
		ce.end = ce.cocouncil_end;
		return;
	}
	
	//Check last statement
	if(ce.statements.length > 0)
	{
		ce.end = ce.statements[ce.statements.length - 1].id;
		return;
	}
	
	//If no statement, use the start
	ce.end = ce.start;
	return;
}

//Get the id of start and end frames of a CE conversation
function getCEConvData(type, ce, statement_index)
{
	switch(type)
	{
		case 'pressing_conv':
			var statement = ce.statements[statement_index];
			return new Object({
				start: statement.pressing_conv_start,
				end: statement.pressing_conv_end
			});
			break;
		
		case 'optional_conv':
			var statement = ce.statements[statement_index];
			return new Object({
				start: statement.optional_conv_start,
				end: statement.optional_conv_end
			});
			break;
		
		case 'cocouncil_conv':
			return new Object({
				start: ce.cocouncil_start,
				end: ce.cocouncil_end
			});
			break;
		
		case 'failure_conv':
			return new Object({
				start: ce.failure_conv_start,
				end: ce.failure_conv_end
			});
			break;
		
		default:
			throw "UnknownConvType";
	}
}

//Set the id of start and end frames of a CE conversation
function setCEConvData(type, ce, statement_index, conv_descriptor)
{
	switch(type)
	{
		case 'pressing_conv':
			ce.statements[statement_index].pressing_conv_start = conv_descriptor.start;
			ce.statements[statement_index].pressing_conv_end = conv_descriptor.end;
			break;
		
		case 'optional_conv':
			ce.statements[statement_index].optional_conv_start = conv_descriptor.start;
			ce.statements[statement_index].optional_conv_end = conv_descriptor.end;
			break;
		
		case 'cocouncil_conv':
			ce.cocouncil_start = conv_descriptor.start;
			ce.cocouncil_end = conv_descriptor.end;
			break;
		
		case 'failure_conv':
			ce.failure_conv_start = conv_descriptor.start;
			ce.failure_conv_end = conv_descriptor.end;
			break;
		
		default:
			throw "UnknownConvType";
	}
}

//Generate the link to insert a new conversation in a CE from the CE footer
function getCEConvInsertLink(type, CE_id, statement_index)
{
	var insert_link;
	
	var ce = getRowById('cross_examinations', CE_id);
	var conv = getCEConvData(type, ce, statement_index);
	
	if(conv.start)
	{
		//If conversation exists
		insert_link = document.createElement('a');
		insert_link.className = "insert";
		
		insert_link.setAttribute('data-locale-content', 'add_frame');
		registerEventHandler(insert_link, 'click', insertNewFrameBefore.bind(undefined, true, conv.end), false);
		translateNode(insert_link);
	}
	else
	{
		insert_link = document.createElement('a');
		addClass(insert_link, 'insert');
		insert_link.setAttribute('data-locale-content', 'add_' + type);
		
		registerEventHandler(insert_link, 'click', function(){
			
			//Find position for the new conversation
			var target_index = getInsertionIndexInCE(type, ce, statement_index || -1);
			
			//Conversation starts with a frame with CEPause action
			var first_frame_properties = {
				action_name: 'CEPause',
				action_parameters: {}
			};
			
			// Conversation ends with correct return action
			var last_frame_properties = {};
			if(type == 'pressing_conv' || type == 'optional_conv')
			{
				// If statement conv, return after current statement
				last_frame_properties.action_name = 'CEReturnAfter';
				last_frame_properties.action_parameters = prefixRawParameters(new Object({
					context: new Object({
						statement_desc: new Object({
							ce_id: ce.id,
							statement_id: ce.statements[statement_index].id
						})
					})
				}));
			}
			else
			{
				// Else, restart CE
				last_frame_properties.action_name = 'CERestart';
				last_frame_properties.action_parameters = prefixRawParameters(new Object({
					context: new Object({
						ce_desc: ce.id
					})
				}));
			}
			
			// Get empty conversation descriptor
			var conv_descriptor = createNewConversationAt(target_index, last_frame_properties, first_frame_properties);
			
			// Insert first real frame
			var new_frame = createAndInsertDataRow('frames', target_index + 1);
			
			setCEConvData(type, ce, statement_index, conv_descriptor);
			
			CE_updateEndFrame(ce);
			
			rowSectionMapEdit({
				edit_type: 'CE_Conversation_Insert',
				conv_type: type,
				CE_id: CE_id,
				statement_index: statement_index,
				frame_index: target_index + 1
			});
		}, false);
		translateNode(insert_link);
	}
	
	return insert_link;
}

//Returns the first frame where to insert a new statement or conversation in a CE
function getInsertionIndexInCE(frame_type, ce, statement_index)
{
	switch(frame_type)
	{
		case 'failure_conv' :
			
			//Insert just after last optional or pressing conv
			statement_index = ce.statements.length;
		
		case 'optional_conv' :
			
			//Insert just after pressing conv of the current statement
			if(statement_index < ce.statements.length && ce.statements[statement_index].pressing_conv_start)
			{
				return getRowIndexById('frames', ce.statements[statement_index].pressing_conv_end) + 1;
			}
		
		case 'pressing_conv' :
			
			//Insert just after the optional conv or pressing conv of the previous statements
			for(var i = statement_index - 1; i >= 0; i--)
			{
				if(ce.statements[i].optional_conv_start)
				{
					return getRowIndexById('frames', ce.statements[i].optional_conv_end) + 1;
				}
				else if(ce.statements[i].pressing_conv_start)
				{
					return getRowIndexById('frames', ce.statements[i].pressing_conv_end) + 1;
				}
			}
			
			//Insert just after the cocouncil conversation
			if(ce.cocouncil_start)
			{
				return getRowIndexById('frames', ce.cocouncil_end) + 1;
			}
		
		case 'cocouncil_conv' :
			
			//Insert just after the last statement
			statement_index = ce.statements.length;
			
		case 'statement' :
			
			if(ce.statements.length > statement_index)
			{
				//Insert just before given statement
				return getRowIndexById('frames', ce.statements[statement_index].id);
			}
			else if(ce.statements.length > 0)
			{
				//Insert just after the last statement
				return getRowIndexById('frames', ce.statements[ce.statements.length - 1].id) + 1;
			}
			
			//Insert just after CE start frame
			return getRowIndexById('frames', ce.start) + 1;
	}
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS

//CE header and footer generators

function getCEHeader(CE_id, display)
{
	var ce = getRowById('cross_examinations', CE_id);
	
	var row = document.createElement('div');
	row.id = 'CE_'+CE_id+'_header';
	addClass(row, 'panel-section-header last');
	
	var title = document.createElement('h1');
	title.setAttribute('data-localevar-n', CE_id);
	title.setAttribute('data-locale-content', 'cross_examination_n');
	
	row.appendChild(title);
	translateNode(title);
	
	var delete_button = document.createElement('button');
	addClass(delete_button, 'box-delete');
	delete_button.setAttribute('data-locale-content', 'delete');
	registerEventHandler(delete_button, 'click', function(){
		if(confirm(l('ce_delete')))
		{
			deleteFramesBlock('cross_examinations', CE_id);
			updateSectionRowMap();
		}
	}, false);
	translateNode(delete_button);
	row.appendChild(delete_button);
	
	// TODO : make something less ugly when I'll have time...
	function openTab(name)
	{
		removeClass(tab_statements, 'open');
		removeClass(tab_cocouncil, 'open');
		removeClass(tab_failure, 'open');
		
		tab_statements_contents.style.display = 'none';
		tab_cocouncil_contents.style.display = 'none';
		tab_failure_contents.style.display = 'none';
		
		addClass(eval('tab_'+name), 'open');
		eval('tab_'+name+'_contents').style.display = '';
	}
	
	var tabs = document.createElement('div');
	addClass(tabs, 'panel-tabs');
	row.appendChild(tabs);
	
		var tab_statements = document.createElement('a');
		tab_statements.setAttribute('data-locale-content', 'statements');
		registerEventHandler(tab_statements, 'click', function(e){
			openTab('statements');
		}, false);
		tabs.appendChild(tab_statements);
		
		var tab_cocouncil = document.createElement('a');
		tab_cocouncil.setAttribute('data-locale-content', 'cocouncil_conv');
		registerEventHandler(tab_cocouncil, 'click', function(e){
			openTab('cocouncil');
		}, false);
		tabs.appendChild(tab_cocouncil);
		
		var tab_failure = document.createElement('a');
		tab_failure.setAttribute('data-locale-content', 'failure_conv');
		registerEventHandler(tab_failure, 'click', function(e){
			openTab('failure');
		}, false);
		tabs.appendChild(tab_failure);
	
	translateNode(tabs);
	
	var tab_contents = document.createElement('div');
	addClass(tab_contents, 'panel-tab-contents small');
	row.appendChild(tab_contents);
	
		var tab_statements_contents = document.createElement('div');
		var statement_list = document.createElement('ul');
		addClass(statement_list, 'entity_list conversation');
		
		for(var i = 0; i < ce.statements.length; i++)
		{
			var statement_data = ce.statements[i];
			
			var statement_item = document.createElement('li');
			
			var insert_link = document.createElement('a');
			addClass(insert_link, 'insert');
			insert_link.setAttribute('data-locale-content', 'add_statement');
			translateNode(insert_link);
			registerEventHandler(insert_link, 'click', CE_createStatementBefore.bind(undefined, CE_id, statement_data.id), false);
			statement_item.appendChild(insert_link);
			
			var content = document.createElement('div');
			addClass(content, 'content');
			statement_item.appendChild(content);
			
				var statement_id = document.createElement('small');
				setNodeTextContents(statement_id, statement_data.id);
				content.appendChild(statement_id);
				
				var statement_text = document.createElement('p');
				addClass(statement_text, 'small');
				setNodeTextContents(statement_text, getRowById('frames', statement_data.id).text_content);
				content.appendChild(statement_text);
				
				var statement_open = document.createElement('button');
				addClass(statement_open, 'open');
				statement_open.setAttribute('data-locale-content', 'open');
				registerEventHandler(statement_open, 'click', (function(CE_id, statement_index){
					rowSectionMapEdit({
						edit_type: 'CE_Statement_Open_Pressing',
						CE_id: CE_id,
						statement_index: statement_index
					});
				}).bind(undefined, CE_id, i), false);
				content.appendChild(statement_open);
				
				var statement_delete = document.createElement('button');
				addClass(statement_delete, 'delete');
				statement_delete.setAttribute('data-locale-content', 'delete');
				registerEventHandler(statement_delete, 'click', CE_deleteStatement.bind(undefined, CE_id, statement_data.id), false);
				content.appendChild(statement_delete);
				
				translateNode(content);
			
			statement_list.appendChild(statement_item);
		}
		
		var statement_insert = document.createElement('li');
		var insert_link = document.createElement('a');
		addClass(insert_link, 'last insert');
		
		insert_link.setAttribute('data-locale-content', 'add_statement');
		registerEventHandler(insert_link, 'click', function(){
			CE_createStatementBefore(CE_id, -1);
		}, false);
		translateNode(insert_link);
		
		statement_insert.appendChild(insert_link);
		statement_list.appendChild(statement_insert);
		
		tab_statements_contents.appendChild(statement_list);
		tab_contents.appendChild(tab_statements_contents);
		
		var tab_cocouncil_contents = document.createElement('div');
		addClass(tab_cocouncil_contents, 'single_opener');
		tab_contents.appendChild(tab_cocouncil_contents);
				
			//Display open button
			var open_button_container = document.createElement('div');
			addClass(open_button_container, 'button_container');
			var open_button = document.createElement('button');
			open_button.setAttribute('data-locale-content', 'open');
			registerEventHandler(open_button, 'click', rowSectionMapEdit.bind(undefined, {
				edit_type: 'CE_Open_Cocouncil',
				CE_id: CE_id
			}), false);
			translateNode(open_button);
			open_button_container.appendChild(open_button);
			tab_cocouncil_contents.appendChild(open_button_container);
			
			//Display description
			var tab_cocouncil_description = document.createElement('p');
			tab_cocouncil_description.setAttribute('data-locale-content', 'cocouncil_conv_desc');
			translateNode(tab_cocouncil_description);
			tab_cocouncil_contents.appendChild(tab_cocouncil_description);
		
		var tab_failure_contents = document.createElement('div');
		addClass(tab_failure_contents, 'single_opener');
		tab_contents.appendChild(tab_failure_contents);
				
			//Display open button
			var open_button_container = document.createElement('div');
			addClass(open_button_container, 'button_container');
			var open_button = document.createElement('button');
			open_button.setAttribute('data-locale-content', 'open');
			registerEventHandler(open_button, 'click', rowSectionMapEdit.bind(undefined, {
				edit_type: 'CE_Open_Failure',
				CE_id: CE_id
			}), false);
			translateNode(open_button);
			open_button_container.appendChild(open_button);
			tab_failure_contents.appendChild(open_button_container);
			
			//Display description
			var tab_failure_description = document.createElement('p');
			tab_failure_description.setAttribute('data-locale-content', 'failure_conv_desc');
			translateNode(tab_failure_description);
			tab_failure_contents.appendChild(tab_failure_description);
	
	// Open correct section for current display
	switch(display.mode)
	{
		case 'cocouncil_conv':
			openTab('cocouncil');
			
			var content_title = document.createElement('h2');
			content_title.setAttribute('data-locale-content', 'cocouncil_conv');
			translateNode(content_title);
			row.appendChild(content_title);
			break;
		
		case 'failure_conv':
			openTab('failure');
			
			var content_title = document.createElement('h2');
			content_title.setAttribute('data-locale-content', 'failure_conv');
			translateNode(content_title);
			row.appendChild(content_title);
			break;
		
		default:
			openTab('statements');
			break;
	}
	
	//generate insert link
	var insert_link = document.createElement('a');
	insert_link.className = "insert";
	insert_link.setAttribute('data-locale-content', 'add_frame');
	registerEventHandler(insert_link, 'click', insertNewFrameBefore.bind(undefined, true, ce.start), false);
	translateNode(insert_link);
	
	//generate outer row
	var outer_row = document.createElement('div');
	outer_row.className = 'storyboard-row panel-header';
	outer_row.appendChild(insert_link);
	outer_row.appendChild(row);
	
	return outer_row;
}

function getCEFooter(CE_id, display)
{
	var row = document.createElement('div');
	row.id = 'CE_'+CE_id+'_footer';
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'storyboard-row panel-footer';
	
	//generate insert link
	switch(display.mode)
	{
		case 'closed':
			//CE closed : nothing to display
			break;
		
		case 'overview':
			//CE overview : add statement
			var insert_link = document.createElement('a');
			insert_link.className = "insert";
			
			insert_link.setAttribute('data-locale-content', 'add_statement');
			registerEventHandler(insert_link, 'click', function(){
				CE_createStatementBefore(CE_id, -1);
			}, false);
			translateNode(insert_link);
			
			row.appendChild(insert_link);
			
			break;
		
		default:
		
			//Default case : all CE conversations
			var insert_link = getCEConvInsertLink(display.mode, CE_id, display.statement_index);
			row.appendChild(insert_link);
			
			break;
	}
	
	outer_row.appendChild(row);
	
	return outer_row;
}

//Deletion function for frames belonging to a CE conversation
function getCEConvDeleteFunction(type, CE_id, statement_index, frame_id)
{
	return function(){
		
		var remove_conversation = false;
		var ce, conv, conv_end, conv_start;
		
		if(type == 'cocouncil_conv')
		{
			// Cocouncil conversation cannot be removed
			remove_conversation = false;
		}
		else
		{
			// For other conversations :
			//Check whether it's emptying the conversation
			ce = getRowById('cross_examinations', CE_id);
			conv = getCEConvData(type, ce, statement_index);
			
			conv_end = getRowIndexById('frames', conv.end);
			conv_start = getRowIndexById('frames', conv.start);
			
			remove_conversation = (conv_end - conv_start <= 2) ? true : false;
		}
		
		if(remove_conversation)
		{
			//Emptying the conversation : remove it.
			deleteConversation(conv);
			
			setCEConvData(type, ce, statement_index, {start: 0, end: 0});
			
			CE_updateEndFrame(ce);
			
			rowSectionMapEdit({
				edit_type: 'CE_Conversation_Delete',
				conv_type: type,
				CE_id: CE_id,
				statement_index: statement_index
			});
		}
		else
		{
			//Just delete the row
			deleteFrame(frame_id);
		}
	};
}

//Function to create a new statement
function CE_createStatementBefore(CE_id, statement_id)
{
	var ce = getRowById('cross_examinations', CE_id);
	var statement_index;
	if(statement_id < 0)
	{
		//-1 means append
		statement_index = ce.statements.length;
	}
	else
	{
		statement_index = getIndexById(ce.statements, statement_id);
	}
	
	var frame_index = getInsertionIndexInCE('statement', ce, statement_index);
	
	var new_statement_frame = createAndInsertDataRow('frames', frame_index);
	// Set statement frame action
	new_statement_frame.action_name = 'CEStatement';
	new_statement_frame.action_parameters = prefixRawParameters(new Object({
		context: new Object({
			statement_desc: new Object({
				ce_id: CE_id,
				statement_id: new_statement_frame.id
			})
		})
	}));
	
	//Create new statement object
	ce.statements.splice(statement_index, 0, new Object({
		id : new_statement_frame.id,
		contradictions: new Array(),
		pressing_conv_start: 0,
		pressing_conv_end: 0,
		optional_conv_start: 0,
		optional_conv_end: 0
	}));
	
	CE_updateEndFrame(ce);
	
	//Create blocks for that statement in the row map and the statement frame itself
	rowSectionMapEdit({
		edit_type: 'CE_Statement_Insert',
		CE_id: ce.id,
		statement_index: statement_index,
		frame_index: frame_index
	});
}

//Delete a given statement
function CE_deleteStatement(CE_id, statement_id)
{
	var ce = getRowById('cross_examinations', CE_id);
	var statement_index = getIndexById(ce.statements, statement_id);
	var statement = ce.statements[statement_index];
	
	//Delete pressing conv
	if(statement.pressing_conv_start)
	{
		var pressing_conv_start = getRowIndexById('frames', statement.pressing_conv_start);
		var pressing_conv_end = getRowIndexById('frames', statement.pressing_conv_end);
		trial_data.frames.splice(pressing_conv_start, pressing_conv_end - pressing_conv_start + 1);
	}
	
	//Delete optional conv
	if(statement.optional_conv_start)
	{
		var optional_conv_start = getRowIndexById('frames', statement.optional_conv_start);
		var optional_conv_end = getRowIndexById('frames', statement.optional_conv_end);
		trial_data.frames.splice(optional_conv_start, optional_conv_end - optional_conv_start + 1);
	}
	
	//Delete statement frame
	var statement_row_index = getRowIndexById('frames', statement.id);
	deleteDataRow('frames', statement_row_index);
	
	//Delete statement object
	ce.statements.splice(statement_index, 1);
	
	//Delete all blocks related to the statement structure from the map
	rowSectionMapEdit({
		edit_type: 'CE_Statement_Delete',
		CE_id: CE_id,
		statement_index: statement_index
	});
	
	CE_updateEndFrame(ce);
}

//END OF MODULE
Modules.complete('editor_frames_ce');
