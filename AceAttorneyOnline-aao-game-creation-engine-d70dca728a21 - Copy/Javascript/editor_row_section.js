"use strict";
/*
Ace Attorney Online - Library to handle sections that are sequences of rows.

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_row_section',
	dependencies : ['editor_rowmaps'],
	init : function()
	{
	}
}));

//INDEPENDENT INSTRUCTIONS
var row_section; // The element containing the scrolling bar, used to scroll through rows.
var parent_container; // Element containing the rows on screen
var row_containers = new Object(); // Maps from a type of row to the object containing the rows of that type.
var row_heights = new Object(); // The screen space available for rows. Used to calculate which to populate/unpopulate.
var row_section_content; // Describes the rows currently on-screen.

var row_section_row_map;

// Set a timeout, with the possibility of changing the time later
// This function is more general than the row system, but is needed with row (un)population
function bufferBeforeFunction(func, buffer_time)
{
	if(!bufferBeforeFunction.buffers)
	{
		bufferBeforeFunction.buffers = new Object();
	}
	
	if(bufferBeforeFunction.buffers[func])
	{
		window.clearTimeout(bufferBeforeFunction.buffers[func]);
	}
	bufferBeforeFunction.buffers[func] = window.setTimeout(func, buffer_time);
}

// Re-construct the row_container, generating all the rows
function rebuildRowSectionContents()
{
	var scroll_value = row_section.scrollTop;
	
	emptyNode(row_containers[row_section_content.type]);
	
	row_section_row_map.removeNavigators();
	var navigator = row_section_row_map.getNewNavigator();
	for(var index = 1; index <= row_section_row_map.height; index++)
	{
		var new_row = row_section_content.generator(navigator.goTo(index));
		row_containers[row_section_content.type].appendChild(new_row);
	}
	
	row_section.scrollTop = scroll_value;
}

function populateAroundVisibleRows()
{
	var row_height = row_heights[row_section_content.type];
	var nb_rows = row_containers[row_section_content.type].children.length;
	
	var viewport_top = row_section.scrollTop;
	var viewport_bottom = viewport_top + row_section.clientHeight;
	
	var first_to_populate = Math.max(1, Math.floor(viewport_top / row_height) + 1);
	var last_to_populate = Math.min(nb_rows, Math.floor(viewport_bottom / row_height) + 2);
	
	var to_populate_selector = 'div[data-filled="0"]:nth-child(n+' + first_to_populate + '):nth-last-child(n+' + (nb_rows - last_to_populate) + ')';
	var to_populate = row_containers[row_section_content.type].querySelectorAll(to_populate_selector);
	for(var i = 0; i < to_populate.length; i++)
	{
		row_section_content.populator(to_populate[i]);
	}
}

function unpopulateFarFromVisibleRows()
{
	var row_height = row_heights[row_section_content.type];
	var nb_rows = row_containers[row_section_content.type].children.length;
	
	var viewport_top = row_section.scrollTop;
	var viewport_bottom = viewport_top + row_section.clientHeight;
	
	var first_to_leave_untouched = Math.max(1, Math.floor(viewport_top / row_height) - 99);
	var last_to_leave_untouched = Math.min(nb_rows, Math.floor(viewport_bottom / row_height) + 102);
	
	var to_unpopulate_selector = 'div[data-filled="1"]:nth-last-child(n+' + (2 + nb_rows - first_to_leave_untouched) + '), div[data-filled="1"]:nth-child(n+' + (last_to_leave_untouched + 1) + ')';
	var to_unpopulate = row_containers[row_section_content.type].querySelectorAll(to_unpopulate_selector);
	for(var i = 0; i < to_unpopulate.length; i++)
	{
		row_section_content.unpopulator(to_unpopulate[i]);
	}
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
/*
API Definition : 
	section : the element that has the scrolling bar
	container : the element that contains all rows

	content_descriptor is an object with the following properties :
		type : the type of the rows in the trial data
		generator : function to create row DOM elements. Any row that exists should be generated once and only once as long
			as a user can get to it by scrolling. New or newly created rows should be generated.
			Information useful to a user scrolling by but without a big performance hit should be set in the generator.
			Generated information can be replaced with populated information if needed.
		populator : function to edit existing row DOM elements with additional information.
			This information may need to be updated upon changes to the trial data, in which case, re-populate.
			Not all rows need be populated. If the section has many rows, populating all rows may be bad for performance.
			Information not in the generator or that may need to be refreshed should be set in the populator.
		unpopulator : function to "undo" the populator, usually for performance reasons.
			If an unpopulator exists, a populator should exist.
			If a populator exists, it does not necessarily mean an unpopulator should exist.
*/
function setRowSectionDisplay(section, container)
{
	row_section = section;
	addClass(row_section, 'row-section');
	
	parent_container = container;
	
	registerEventHandler(row_section, 'scroll', function() {
		bufferBeforeFunction(populateAroundVisibleRows, 400);
		bufferBeforeFunction(unpopulateFarFromVisibleRows, 2000);
		
	}, false);
	
	closeTab = function()
	{
		unregisterEvent(row_section, 'scroll');
		
		row_containers[row_section_content.type].scroll_value = row_section.scrollTop;
		parent_container.removeChild(row_containers[row_section_content.type]);
		
		removeClass(row_section, 'row-section');
		row_section = null;
	};
}

function initRowSectionContent(content_descriptor)
{
	row_section_content = content_descriptor;
	
	emptyNode(parent_container);
	if(!row_containers[row_section_content.type])
	{
		row_containers[row_section_content.type] = document.createElement('div');
		parent_container.appendChild(row_containers[row_section_content.type]);
		Modules.request('editor_rowmaps_' + row_section_content.type, updateSectionRowMap);
	}
	else
	{
		parent_container.appendChild(row_containers[row_section_content.type]);
	}
	
	row_section.scrollTop = row_containers[row_section_content.type].scroll_value || 0;
}

//Edit the section row map
function rowSectionMapEdit(edit_data)
{
	var updatesToPerform = row_section_row_map.edit(edit_data);
	
	if(updatesToPerform)
	{
		for(var i = 0; i < updatesToPerform.length; i++)
		{
			var update = updatesToPerform[i];
			switch(update.type)
			{
				case 'insert':
					row_section_row_map.removeNavigators();
					var navigator = row_section_row_map.getNewNavigator();
					
					for(var index = update.index; index < update.index + update.number; index++)
					{
						var new_row = row_section_content.generator(navigator.goTo(index));
						
						row_containers[row_section_content.type].insertBefore(
							new_row,
							row_containers[row_section_content.type].children[index - 1]
						);
					}
					populateAroundVisibleRows();
					break;
				
				case 'delete':
					for(var nb_rows = 0; nb_rows < update.number; nb_rows++)
					{
						row_containers[row_section_content.type].removeChild(row_containers[row_section_content.type].children[update.index - 1]);
					}
					break;
				
				case 'update':
					row_section_row_map.removeNavigators();
					var navigator = row_section_row_map.getNewNavigator();
				
					for(var index = update.index; index < update.index + update.number; index++)
					{
						var new_row = row_section_content.generator(navigator.goTo(index));
						
						row_containers[row_section_content.type].replaceChild(
							new_row,
							row_containers[row_section_content.type].children[index - 1]
						);
					}
					populateAroundVisibleRows();
					break;
			}
		}
	}
	else
	{
		// The edition did not return a list of specific updates to perform.
		// Let's update everything then.
		rebuildRowSectionContents();
	}
}

//Force immediate update of the section row map
function updateSectionRowMap()
{
	var objectType = row_section_content.type;
	var constructorName = objectType[0].toUpperCase() + objectType.slice(1).toLowerCase() + "RowMap";
	row_section_row_map = eval('new ' + constructorName + '();');
	rebuildRowSectionContents();
	row_heights[row_section_content.type] = row_containers[row_section_content.type].children[0].clientHeight;
	populateAroundVisibleRows();
}

//Refresh all displayed rows : unpopulate and repopulate
function refreshDisplayedRows()
{
	var to_refresh_selector = 'div[data-filled="1"]';
	var to_refresh = row_containers[row_section_content.type].querySelectorAll(to_refresh_selector);
	for(var i = 0; i < to_refresh.length; i++)
	{
		row_section_content.unpopulator(to_refresh[i]);
		row_section_content.populator(to_refresh[i]);
	}
}

//END OF MODULE
Modules.complete('editor_row_section');
