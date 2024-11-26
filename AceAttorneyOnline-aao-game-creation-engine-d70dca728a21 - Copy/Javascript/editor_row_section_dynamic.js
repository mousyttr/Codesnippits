"use strict";
/*
Ace Attorney Online - Library to handle sections that are sequences of rows.
(Dynamic version : only display a few rows and update when scrolling. Delegate row map calculations to a worker to improve performance)

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_row_section_dynamic',
	dependencies : ['nodes'],
	init : function()
	{
	}
}));

//INDEPENDENT INSTRUCTIONS
var workers = new Object();
var row_section_type;
var tab_opened;
var pending_deletion = new Array();

//Functions to determine positioning of a row relative to scrolling window
function topPosition(row)
{
	return row.offsetTop - row_section_display.container.offsetTop;
}

function bottomPosition(row)
{
	return topPosition(row) + row.offsetHeight;
}

function scrollTopPosition(scrollValue)
{
	return scrollValue - row_section_display.container.offsetTop;
}

function scrollBottomPosition(scrollValue)
{
	return scrollTopPosition(scrollValue) + row_section_display.section.offsetHeight;
}

function isAboveVisibleArea(row, scrollValue)
{
	return bottomPosition(row) < scrollTopPosition(scrollValue);
}

function isBelowVisibleArea(row, scrollValue)
{
	return topPosition(row) > scrollBottomPosition(scrollValue);
}

function isPartlyAboveVisibleArea(row, scrollValue)
{
	return topPosition(row) <= scrollTopPosition(scrollValue);
}

function isPartlyBelowVisibleArea(row, scrollValue)
{
	return bottomPosition(row) >= scrollBottomPosition(scrollValue);
}

//Get row height of the current panel
function getRowHeight()
{
	var test_row = row_section_content.generator();
	
	row_section_display.container.appendChild(test_row);
	var row_height = test_row.clientHeight;
	row_section_display.container.removeChild(test_row);
	
	return row_height;
}

//Updates buffer
function RowUpdateBuffer(updateTriggerDelay)
{
	var self = this;
	
	//Manage row generation
	self.lastUpdate = 0;
	self.updatePending = false;
	self.updateTriggerDelay = updateTriggerDelay;
	self.updateTimer;
	
	self.triggerUpdate = function()
	{
		var time = (new Date()).getTime();
		if(time - self.lastUpdate >= self.updateTriggerDelay)
		{
			self.lastUpdate = time;
			updateSection();
		}
		else
		{
			window.clearTimeout(self.updateTimer);
			self.updateTimer = window.setTimeout(self.triggerUpdate, self.updateTriggerDelay - (time - self.lastUpdate));
		}
	};
	
	return self;
}

//Function to actually display rows according to worker message
function handleWorkerMessage(event)
{
	if(!tab_opened)
	{
		//If the tab is closed, ignore
		return;
	}
	
	switch(event.data && event.data.type)
	{
		case 'tasks':
			
			//Run worker tasks
			for(var i = 0; i < event.data.tasks.length; i++)
			{
				//If rows are pending deletion, proceed immediately : worker tasks assume they are already deleted
				while(pending_deletion.length > 0)
				{
					var to_delete = pending_deletion.shift();
					if(to_delete.parentNode == row_section_display.container)
					{
						row_section_display.container.removeChild(to_delete);
					}
				}
				
				var task = event.data.tasks[i];
				switch(task.type)
				{
					case 'reinit' :
						
						//Empty the whole section
						for(var j in loaded_rows)
						{
							pending_deletion.push(loaded_rows[j]); //Rows will be deleted with next task to avoid flickering
							//But let the worker know that they are deleted
							delete loaded_rows[j];
							delete loaded_rows_export[j];
						}
						
						//Set the new height for the container
						row_section_display.container.style.height = task.height+ 'px';
						
						//Request immediate content rebuilding
						updateSection(true);
						
						break;
					
					case 'insert':
						var new_row = row_section_content.generator(task.locator);
						new_row.style.position = 'absolute';
						new_row.style.left = '0';
						new_row.style.right = '0';
						new_row.style.top = task.locator.offset_top + 'px';
						row_section_display.container.appendChild(new_row);
						
						if(loaded_rows[task.locator.row_index])
						{
							//If a row is already loaded for that index, mark it for deletion.
							pending_deletion.push(loaded_rows[task.locator.row_index]);
						}
					
						loaded_rows[task.locator.row_index] = new_row;
						loaded_rows_export[task.locator.row_index] = true;
						
						// Populate the row immediately
						row_section_content.populator(new_row);
						
						break;
					
					case 'remove':
						row_section_display.container.removeChild(loaded_rows[task.locator.row_index]);
						
						delete loaded_rows[task.locator.row_index];
						delete loaded_rows_export[task.locator.row_index];
						
						break;
				}
			}
			
			break;
		
		default:
			console.log(event.data);
			break;
	}
}

//Send a message to the current worker
function rowSectionPostMessage(message)
{
	workers[row_section_type].postMessage(message);
}

//Update the contents of the section element
function updateSection(emergency)
{
	var scrollValue = row_section_display.section.scrollTop;
	
	workers[row_section_type].postMessage({
		type: 'set',
		scroll_top: Math.max(0, scrollTopPosition(scrollValue)),
		scroll_bottom: Math.max(0, scrollBottomPosition(scrollValue)),
		loaded_rows: loaded_rows_export,
		emergency: emergency ? true : false
	});
}

//EXPORTED VARIABLES
var row_section_display;
var row_section_content;

var updateBuffer = new RowUpdateBuffer(1000);
var loaded_rows; //Links to each loaded row by its index
var loaded_rows_export; //Tells the worker which rows are loaded

//EXPORTED FUNCTIONS
/*
API Definition : 
	section : the element that has the scrolling bar
	container : the element that contains all rows

	content_descriptor is an object with the following properties :
                type : the type of the rows in the trial data
                generator : function to generate rows
*/
function setRowSectionDisplay(section, container)
{
	row_section_display = new Object({
		section: section,
		container: container
	});
	
	tab_opened = true;
	registerEventHandler(section, 'scroll', updateBuffer.triggerUpdate, false);
	addClass(section, 'row-section');
	
	closeTab = function()
	{
		tab_opened = false;
		workers[row_section_type].postMessage({type: 'pause'});
		removeClass(section, 'row-section');
		unregisterEvent(section, 'scroll');
		emptyNode(container);
		container.style.height = '';
	};
}

function initRowSectionContent(content_descriptor)
{
	row_section_content = content_descriptor;
	
	//Empty section
	emptyNode(row_section_display.container);
	
	//Empty loaded rows
	loaded_rows = new Object();
	loaded_rows_export = new Object();
	
	if(content_descriptor.type != row_section_type)
	{
		//If type changed
		
		//Make sure the old worker is not running
		if(workers[row_section_type])
		{
			workers[row_section_type].postMessage({type: 'pause'});
		}
		
		//Create a new worker if needed
		if(!workers[content_descriptor.type])
		{
			var row_height = getRowHeight();
			
			workers[content_descriptor.type] = new Worker('bridge.js.php?main=editor_row_section_worker');
			workers[content_descriptor.type].onmessage = handleWorkerMessage;
			workers[content_descriptor.type].postMessage({
				type: 'init', 
				objectType: content_descriptor.type, 
				cfg: cfg,
				file_versions: file_versions,
				row_height: row_height
			});
			workers[content_descriptor.type].postMessage({
				type: 'initRowMap', 
				trial_data: JSON.parse(JSON.stringify(trial_data)) // TODO : remove JSON calls when Chromium issue 278883 is fixed
			});
		}
		
		row_section_type = content_descriptor.type;
	}
	
	//Send first update to worker
	updateSection();
	
	//Start worker
	workers[row_section_type].postMessage({type: 'start'});
}

//Edit the section row map
function rowSectionMapEdit(edit_data)
{
	edit_data.type = 'edit';
	rowSectionPostMessage(edit_data);
}

//Force immediate update of the section row map
function updateSectionRowMap()
{
	rowSectionPostMessage({ 
		type: 'pause'
	});
	
	//Remove rows pending deletion from the list : they will be removed by the emptyNode function below
	while(pending_deletion.length > 0) { pending_deletion.shift(); }
	
	//Empty section
	emptyNode(row_section_display.container);
	
	//Empty loaded rows
	loaded_rows = new Object();
	loaded_rows_export = new Object();
	
	rowSectionPostMessage({ 
		type: 'initRowMap', 
		trial_data: JSON.parse(JSON.stringify(trial_data)) // TODO : remove JSON calls when Chromium issue 278883 is fixed
	});
	rowSectionPostMessage({ 
		type: 'start'
	});
	updateSection(true);
}

//Refresh all displayed rows : unpopulate and repopulate
function refreshDisplayedRows()
{
	var to_refresh_selector = 'div[data-filled="1"]';
	var to_refresh = row_section_display.container.querySelectorAll(to_refresh_selector);
	for(var i = 0; i < to_refresh.length; i++)
	{
		row_section_content.unpopulator(to_refresh[i]);
		row_section_content.populator(to_refresh[i]);
	}
}

//END OF MODULE
Modules.complete('editor_row_section_dynamic');
