"use strict";
/*
Ace Attorney Online - Worker to manage screen updates for row sections in the background

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_row_section_worker',
	dependencies : ['trial_data', 'editor_rowmaps'],
	init : function()
	{
	}
}));

//Config
var preload_length = 30; //Number of rows to preload on each side
var preload_batch = 8; //Number of preloading instructions
var preload_time = 50; //Number of ms between each flush

//Interval to trigger the flush
var interval;

//Copy of the trial's data
var trial_data;

//Row map navigation
var rowMap;
var rowMapCache; //RowMap cache, with data for each row for fast read

//Layout data
var row_height;

//Current state
var loaded_rows;

//Current objectives
var first_visible_target;
var last_visible_target;
var first_preload_target;
var last_preload_target;

//Task queue
function generateRowQueue()
{
	var queue = new Object();
	queue.sub_queues = new Array(); //The task queue is divided in sub queues
	queue.sq_by_row_index = new Object(); //Given the index of a row, returns the subqueue containing it
	
	queue.reinit = false; //If true, next flush will start by a reinit
	
	queue.remove = function(row_index)
	{
		if(queue.sq_by_row_index[row_index])
		{
			queue.sq_by_row_index[row_index].remove(row_index);
		}
	};
	
	queue.appendSubQueue = function()
	{
		var sq = generateSubRowQueue(queue);
		queue.sub_queues.push(sq);
		return sq;
	};
	
	queue.clear = function()
	{
		for(var i = 0; i < queue.sub_queues.length; i++)
		{
			queue.sub_queues[i].clear();
		}
		
		queue.reinit = false;
	};
	
	return queue;
}

function generateSubRowQueue(queue)
{
	var sq = new Object();
	sq.queue = queue;
	sq.sequence = new Array(); //Sequence of row location descriptors
	sq.seq_indexes = new Array(); //Sequence of row indexes in the same order
	
	sq.append = function(row_index)
	{
		sq.queue.remove(row_index); //Remove row from any other place in the queue
		sq.queue.sq_by_row_index[row_index] = sq; //Mark the row as belonging to this sub queue
		var locator = rowMapCache.goTo(row_index);
		
		//append it to the sequence and store its index
		sq.seq_indexes.push(row_index); 
		sq.sequence.push(locator);
	};
	
	sq.remove = function(row_index)
	{
		var seq_index = sq.seq_indexes.indexOf(row_index);
		sq.sequence.splice(seq_index, 1);
		sq.seq_indexes.splice(seq_index, 1);
		delete sq.queue.sq_by_row_index[row_index];
	};
	
	sq.clear = function()
	{
		while(sq.seq_indexes.length > 0)
		{
			sq.remove(sq.seq_indexes[0]);
		}
	};
	
	return sq;
}

//Initialise the row queue
var queue = generateRowQueue();

var priorityInserts = queue.appendSubQueue();
var removals = queue.appendSubQueue();
var preloadInserts = queue.appendSubQueue();

function getFastRowMap(rowMap)
{
	var fastRowMap = new Object();
	fastRowMap.rows = new Array(1 + rowMap.height);
	fastRowMap.rows[0] = null;
	fastRowMap.nav = rowMap.getNewNavigator();
	
	fastRowMap.locatorExportCopy = function(locator)
	{
		return new Object({
			row_index: locator.row_index,
			block: locator.block.exportCopy(),
			position_rel_to_block: locator.position_rel_to_block,
			offset_top: (locator.row_index - 1) * row_height
		});
	};
	
	fastRowMap.goTo = function(index)
	{
		return fastRowMap.rows[index] || (fastRowMap.rows[index] = fastRowMap.locatorExportCopy(fastRowMap.nav.goTo(index)));
	};
	
	fastRowMap.clear = function()
	{
		fastRowMap.rows = new Array(1 + rowMap.height);
		fastRowMap.rows[0] = null;
	};
	
	return fastRowMap;
}

//Message handler
self.onmessage = function(event)
{
	switch(event.data.type)
	{
		case 'init' : 
			
			//Set row height
			row_height = event.data.row_height;
			
			constructorName = event.data.objectType[0].toUpperCase() + event.data.objectType.slice(1).toLowerCase() + "RowMap";
			if(!self[constructorName])
			{
				/*
				Import script to generate the rowMap locally
				*/
				Modules.request('editor_rowmaps_' + event.data.objectType);
			}
			
			break;
		
		case 'initRowMap' :
			
			//Load trial data
			trial_data = event.data.trial_data;
			
			if(rowMap)
			{
				//Destroy all row map navigators
				rowMap.removeNavigators();
			}
			
			//Clear all pending events on the old map
			queue.clear();
			
			//Generate row map and its buffer
			rowMap = eval('new ' + constructorName + "();");
			rowMapCache = getFastRowMap(rowMap);
			
			break;
		
		case 'set' :
		
			//Save the current state of the interface
			loaded_rows = event.data.loaded_rows;
			
			//calculate the indexes of the rows that will be visible on screen
			first_visible_target = Math.min(rowMap.height, Math.max(1, Math.floor(event.data.scroll_top / row_height) + 1));
			last_visible_target = Math.min(rowMap.height, Math.floor(event.data.scroll_bottom / row_height) + 1);
			
			//rows to be generated
			first_preload_target = Math.max(1, first_visible_target - preload_length);
			last_preload_target = Math.min(rowMap.height, last_visible_target + preload_length);
			
			updateTasks(event.data.emergency);
			
			break;
		
		case 'edit' :
		
			//Forget all pending events
			queue.clear();
			
			//Perform the edit
			rowMap.edit(event.data);
			
			//Empty the row map cache
			rowMapCache.clear();
			
			//Reinitialise the section display
			self.postMessage(new Object({
				type: 'tasks',
				tasks: [{
					type: 'reinit',
					height: row_height * rowMap.height
				}]
			}));
			
			break;
		
		case 'start' :
		
			self.postMessage(new Object({
				type: 'tasks',
				tasks: [{
					type: 'reinit',
					height: row_height * rowMap.height
				}]
			}));
			
			interval = setInterval(flushQueue, preload_time);
			break;
		
		case 'pause' :
			clearInterval(interval);
			break;
	}
};


/*
	Update the list of tasks
*/
function updateTasks(emergency)
{
	//Insert rows that are visible but not loaded yet
	for(var i = first_visible_target; i <= last_visible_target; i++)
	{
		if(!loaded_rows[i])
		{
			priorityInserts.append(i);
		}
	}
	
	if(emergency)
	{
		//If we are in an "emergency", trigger an immediate flush
		flushQueue();
	}
	
	//Insert rows that are to be preloaded, starting with the closest ones
	for(var i = 1; i <= preload_length; i++)
	{
		var top_index = first_visible_target - i;
		if(top_index >= first_preload_target && !loaded_rows[top_index])
		{
			preloadInserts.append(top_index);
		}
		var bottom_index = last_visible_target + i;
		if(bottom_index <= last_preload_target && !loaded_rows[bottom_index])
		{
			preloadInserts.append(bottom_index);
		}
	}
	
	//If rows are loaded out of the preload interval, remove them
	for(var i in loaded_rows)
	{
		if(i < first_preload_target || i > last_preload_target)
		{
			removals.append(i);
		}
	}
}


function flushQueue()
{
	var tasks = new Array();
	
	//Check if reinit needed
	if(queue.reinit)
	{
		tasks.push(new Object({
			type: 'reinit',
			height: row_height * rowMap.height
		}));
		queue.reinit = false;
	}
	
	//Insert all priority rows
	while(priorityInserts.seq_indexes.length > 0)
	{
		tasks.push(new Object({
			type: 'insert',
			locator: priorityInserts.sequence[0]
		}));
		priorityInserts.remove(priorityInserts.seq_indexes[0]);
	}
	
	//Preload rows as needed
	while(tasks.length < preload_batch && preloadInserts.seq_indexes.length > 0)
	{
		tasks.push(new Object({
			type: 'insert',
			locator: preloadInserts.sequence[0]
		}));
		preloadInserts.remove(preloadInserts.seq_indexes[0]);
	}
	
	//Remove rows as needed
	while(tasks.length < preload_batch && removals.seq_indexes.length > 0)
	{
		tasks.push(new Object({
			type: 'remove',
			locator: removals.sequence[0]
		}));
		removals.remove(removals.seq_indexes[0]);
	}
	
	
	//If there are tasks to execute, pass them to the editor
	if(tasks.length > 0)
	{
		self.postMessage(new Object({
			type: 'tasks',
			tasks: tasks
		}));
	}
}

//END OF MODULE
Modules.complete('editor_row_section_worker');
