"use strict";
/*
Ace Attorney Online - Modules for frame management in the editor

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_rowmaps',
	dependencies : [],
	init : function() 
	{
		
	}
}));

//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES


//EXPORTED FUNCTIONS

// This file contains the classes used by editor_row_section to display sequences of "rows"
// Rows are an abstraction used to solve the following problem:
// You want to display a large number of elements but have three constraints.
// 1. For performance reasons, you may not be able to fully display these at once.
// 2. Further, some elements may be hidden and others visible.
// 3. The elements have some structure, and you may need to display elements in very different ways,
//	potentially displaying some elements that correspond to a change in structure rather than one special element.
// The prototypical example is the frame system. You may have thousands of frames, want to hide press conversations
// 	that aren't currently selected, and cross-examinations have their special display elements.
// Rows are not defined in this file, because we normally need concrete instances of them, and we don't have enough
// 	examples of them to create a stable abstract class. This file only defines structural elements of the row map.
// The row map is used for other code to figure out the structure of the elements they need to create.

// RowMapNavigator
// Created for its GoTo method. Used to convert the index of a row in the map to a position descriptor
// consumed, for example, by row generator functions.
// The internal state is performance critical (according to timing benchmarks when the class was created.
// Having this as its own class rather than part of the RowMap allows us to create multiple navigators.
// Handy if we need to refresh multiple parts of the map, but also means we need to worry about linked vs unlinked navigators.


function RowMapNavigator(row_map)
{
	var nav = this;
	
	nav.row_map = row_map;
	nav.current_block = null;
	nav.current_block_start = -1;
	nav.current_position = -1;
	
	//Initialise the navigator on the first visible row
	nav.init = function()
	{
		var i = 0;
		
		while(i < nav.row_map.blocks.length && !nav.row_map.blocks[i].isVisible())
		{
			i++;
		}
		
		nav.current_block = nav.row_map.blocks[i];
		if(!nav.current_block) { throw "NavigatorOnNullBlock"; } //TODO : remove debug call
		nav.current_block_start = 1;
		nav.current_position = 1;
	};
	
	//Move the navigator to a given row position
	nav.goTo = function(new_position)
	{
		if(new_position > nav.current_position)
		{
			return nav.goToNext(new_position);
		}
		else
		{
			return nav.goToPrevious(new_position);
		}
	};
	
	//Move the navigator to a following row (the next one if no target given)
	nav.goToNext = function(target_position)
	{
		var target = target_position || nav.current_position + 1;
		while(!nav.current_block.isVisible() || nav.current_block_start + nav.current_block.height <= target)
		{
			nav.current_block_start += nav.current_block.visible ? nav.current_block.height : 0;
			nav.current_block = nav.row_map.blocks[nav.current_block.index + 1];
			if(!nav.current_block) { throw "NavigatorOnNullBlock"; } //TODO : remove debug call
		}
		nav.current_position = target;
		
		return nav.getPosition();
	};
	
	//Move the navigator to a previous row (the previous one if no target given)
	nav.goToPrevious = function(target_position)
	{
		var target = target_position || nav.current_position - 1;
		while(!nav.current_block.isVisible() || nav.current_block_start > target)
		{
			nav.current_block = nav.row_map.blocks[nav.current_block.index - 1];
			nav.current_block_start -= nav.current_block.visible ? nav.current_block.height : 0;
			if(!nav.current_block) { throw "NavigatorOnNullBlock"; } //TODO : remove debug call
		}
		nav.current_position = target;
		
		return nav.getPosition();
	};
	
	//Get the current position of the navigator
	nav.getPosition = function()
	{
		return new Object({
			row_index: nav.current_position,
			block: nav.current_block,
			position_rel_to_block: nav.current_position - nav.current_block_start
		});
	};
	
	//Get another navigator at the same position
	nav.clone = function()
	{
		var cl = nav.row_map.getNewNavigator();
		cl.current_block = nav.current_block;
		if(!cl.current_block) { throw "NavigatorOnNullBlock"; } //TODO : remove debug call
		cl.current_block_start = nav.current_block_start;
		cl.current_position = nav.current_position;
		return cl;
	};
	
	//Unlink unused navigator
	nav.unlink = function()
	{
		var i = nav.row_map.navigators.indexOf(nav);
		nav.row_map.navigators.splice(i, 1);
		
		nav.row_map = null;
		
		nav.goTo = nav.goToNext = nav.goToPrevious = function()
		{
			debugger;
			throw "UsingUnlinkedNavigator";
		};
	};
}

// RowMap
// Specifies how blocks come together to form the sequence in which elements should be displayed.

function RowMap()
{
	var row_map = this;
	
	row_map.blocks = new Array(); //List of the blocks in the map
	row_map.total_height = 0; //Number of rows in the map, including hidden blocks
	row_map.height = 0; //Number of visible rows in the map
	
	/*
		LOGGING REFRESH ACTIONS OF THE ROW MAP
		It's a sequence of actions, each represented by an object with the fields
		- type (insert, delete)
		- index (position of the first row affected by this action)
		- number (number of rows affected)
		
		Null if nothing logged since last flush.
	*/
	row_map.refresh_actions = null;
	row_map.logRefreshAction = function(action)
	{
		if(!row_map.refresh_actions)
		{
			row_map.refresh_actions = new Array();
		}
		
		// Check if new action affects the indices of previously logged actions, and fix those accordingly.
		// NOTE : This assumes that the new action does not intersect a previously logged one,
		// eg. not deleting a frame which was just inserted, or inserting inside of an interval which was just inserted...
		for(var i = 0; i < row_map.refresh_actions.length; i++)
		{
			var logged_action = row_map.refresh_actions[i];
			if(action.index < logged_action.index)
			{
				switch(action.type)
				{
					case 'insert' :
						logged_action.index += action.number;
						break;
					case 'delete' :
						logged_action.index -= action.number;
						break;
				}
			}
		}
		
		row_map.refresh_actions.push(action);
	};
	row_map.flushRefreshAction = function()
	{
		var refresh_actions = row_map.refresh_actions;
		row_map.refresh_actions = null;
		return refresh_actions;
	};
	
	/*
		EDITING THE ROW MAP
	*/
	
	//Updates the indexes of all blocks
	row_map.updateBlockIndexes = function()
	{
		for(var i = 0; i < row_map.blocks.length; i++)
		{
			row_map.blocks[i].index = i;
		}
	};
	
	//Shift all intervals starting after a given index.
	row_map.shiftIntervals = function(index, shift_value)
	{
		var interval;
		for(var i = 0; i < row_map.blocks.length; i++)
		{
			if(interval = row_map.blocks[i].mappedInterval)
			{
				//If the block maps an interval
				if(interval.start >= index)
				{
					//If interval starts after the shift index
					interval.shift(shift_value);
				}
			}
		}
	};
	
	//Applies an insertion of rows by shifting indexes of all data blocks in the row map.
	//If endOfBlock, edge cases will result in insertion at the end of previous block.
	row_map.insertRows = function(index, nb_rows, endOfBlock)
	{
		if(nb_rows <= 0)
		{
			return;
		}
		
		var interval;
		var current_block_start = 1;
		for(var i = 0; i < row_map.blocks.length; i++)
		{
			if(interval = row_map.blocks[i].mappedInterval)
			{
				//If the block maps an interval
				
				//Edit the interval if needed, and update the block.
				interval.updateAfterRowInsert(index, nb_rows, endOfBlock);
				var new_height = interval.getLength();
				if(new_height != row_map.blocks[i].height)
				{
					row_map.blocks[i].setHeight(new_height);
					
					if(row_map.blocks[i].isVisible())
					{
						//Log insertions at the proper position relative to the beginning of the interval.
						row_map.logRefreshAction({
							type: 'insert',
							index: (index - interval.start) + current_block_start,
							number: nb_rows
						});
					}
				}
			}
			
			if(row_map.blocks[i].isVisible())
			{
				current_block_start += row_map.blocks[i].height;
			}
		}
	};
	
	//Applies a deletion of rows by shifting indexes of all data blocks in the row map.
	//Returns the list of all blocks emptied and removed by the operation
	row_map.deleteRows = function(index, nb_rows)
	{
		if(nb_rows <= 0)
		{
			return new Array();
		}
		
		var emptyBlocks = new Array();

		var interval;
		var current_block_start = 1;
		for(var i = 0; i < row_map.blocks.length; i++)
		{
			if(interval = row_map.blocks[i].mappedInterval)
			{
				interval.updateAfterRowDelete(index, nb_rows);
				var new_height = interval.getLength();
				if(new_height != row_map.blocks[i].height)
				{
					if(row_map.blocks[i].isVisible())
					{
						//Log deletions at the proper position relative to the beginning of the interval.
						row_map.logRefreshAction({
							type: 'delete',
							index: (index - interval.start) + current_block_start,
							number: nb_rows
						});
					}
					
					row_map.blocks[i].setHeight(new_height);
					if(new_height == 0)
					{
						emptyBlocks.push(row_map.blocks[i]);
					}
				}
			}
			
			if(row_map.blocks[i].isVisible())
			{
				current_block_start += row_map.blocks[i].height;
			}
		}
		
		/*/ Remove empty blocks
		for(var i = 0; i < emptyBlocks.length; i++)
		{
			emptyBlocks[i].remove();
		}
		//*/
		
		return emptyBlocks;
	};
	
	//Modify the map : insert a new data block - default height is number of data rows contained
	row_map.insertDataBlock = function(block_index, visible, mappedInterval)
	{
		return (new RowMapBlock(row_map, block_index, visible, mappedInterval.empty ? 0 : (1 + mappedInterval.end - mappedInterval.start), mappedInterval)).insert();
	};
	
	//Modify the map : insertsa new non-data block - default height is 1
	row_map.insertNonDataBlock = function(block_index, visible, height)
	{
		return (new RowMapBlock(row_map, block_index, visible, height || 1)).insert();
	};
	
	//Generate the map : append a new data block
	row_map.addDataBlock = function(visible, mappedInterval)
	{
		return (new RowMapBlock(row_map, row_map.blocks.length, visible, mappedInterval.empty ? 0 : (1 + mappedInterval.end - mappedInterval.start), mappedInterval)).addToMap();
	};
	
	//Generate the map : append a new non-data block
	row_map.addNonDataBlock = function(visible, height)
	{
		return (new RowMapBlock(row_map, row_map.blocks.length, visible, height || 1)).addToMap();
	};
	
	//Reads event data and edits the map accordingly. Should be overridden by concrete map.
	row_map.edit = function(edit_data)
	{
		return;
	};

	//Exports the row map as a JSON object
	row_map.exportCopyBase = function()
	{
		var copy = new Object();
		copy.height = row_map.height;
		copy.total_height = row_map.total_height;
		copy.blocks = new Array();
		
		for(var i = 0; i < row_map.blocks.length; i++)
		{
			copy.blocks.push(row_map.blocks[i].exportCopy());
		}
		
		return copy;
	};

	//Exports the row map as a JSON object (used for debugging)
	//This function can be overridden in concrete row map.
	row_map.exportCopy = function()
	{
		return row_map.exportCopyBase();
	};
	
	/*
		NAVIGATING IN THE ROW MAP
	*/
	
	row_map.navigators = new Array(); //TODO : make sure any unused navigator is removed from this array to be freed
	row_map.getNewNavigator = function()
	{
		var nav = new RowMapNavigator(row_map);
		row_map.navigators.push(nav);
		nav.init();
		return nav;
	};
	
	row_map.reinitNavigators = function()
	{
		for(var i = 0; i < row_map.navigators.length; i++)
		{
			row_map.navigators[i].init();
		}
	};
	
	row_map.removeNavigators = function()
	{
		while(row_map.navigators.length > 0)
		{
			row_map.navigators[0].unlink();
		}
	};
}

/*Generate a row map block. Takes the following parameters :
	row_map : Map this block belongs to
	block_index : index of the block in the map
	visible : whether the block is visible at first
	height : number of rows this block should take on screen if mappedInterval is null.
		Otherwise the length of the interval is used.
	mappedInterval : null, or Object with the following properties :
		empty : false if there is at least one row in the interval, true otherwise
		start : if not empty, index of the first row of the mapped interval
		end : if not empty, index of the last

	Blocks are modified after construction to supply the information needed to display them.
	That "information" is dependent on the concrete problem and not supplied in this class.
*/
function RowMapBlock(row_map, block_index, visible, height, mappedInterval)
{
	var block = this;
	
	block.row_map = row_map; 
	block.index = block_index; 
	
	block.visible = visible; 
	block.height = 0; //Number of rows this block will take on screen; set later

	block.mappedInterval = mappedInterval || null;
	
	//Get block start
	block.getStart = function()
	{
		var current_block_start = 1;
		for(var i = 0; i < block.index; i++)
		{
			if(block.row_map.blocks[i].isVisible())
			{
				current_block_start += block.row_map.blocks[i].height;
			}
		}
		return current_block_start;
	};
	
	//Insert block in the map
	//TO BE USED WHEN MODIFYING THE MAP ONLY
	block.insert = function()
	{
		// If has a mapped interval, shift the intervals after it.
		if(block.mappedInterval)
		{
			block.row_map.shiftIntervals(block.mappedInterval.start, block.mappedInterval.getLength());
		}
		
		//Update row map height
		block.setHeight(height);
		
		//Actually insert the block in the list
		block.row_map.blocks.splice(block.index, 0, block);
		//Update all block indexes
		block.row_map.updateBlockIndexes();
		
		if(this.isVisible())
		{
			//Log deletions at the proper position relative to the beginning of the interval.
			row_map.logRefreshAction({
				type: 'insert',
				index: this.getStart(),
				number: this.height
			});
		}
		
		return this;
	};
	
	//Add block to the map, without all insertion treatment.
	//TO BE USED WHEN BUILDING THE MAP ONLY
	block.addToMap = function()
	{
		//Update row map height
		block.setHeight(height);
		
		//Actually insert the block in the list
		block.row_map.blocks.splice(block.index, 0, block);
		
		return this;
	};
	
	//Delete the block from the map
	block.remove = function()
	{
		if(!block.row_map)
		{
			//If block was already removed, throw exception
			throw 'BlockAlreadyRemoved';
		}
		
		block.setHeight(0);
		
		//Actually remove the block from the list
		block.row_map.blocks.splice(block.index, 1);
		//Update all block indexes
		block.row_map.updateBlockIndexes();
		
		block.row_map = null;
	};
	
	//Delete block and all its rows
	block.deleteBlock = function()
	{
		if(block.mappedInterval)
		{
			//If data block, delete contained intervals
			block.row_map.deleteRows(block.mappedInterval.start, block.mappedInterval.getLength());
		}
		else
		{
			//Update height
			this.remove();
		}
	};
	
	//Change block height
	block.changeHeight = function(diff)
	{
		//Update row map height
		block.row_map.total_height += diff;
		if(block.visible)
		{
			block.row_map.height += diff;
		}
		
		block.height += diff;
	};
	
	//Set block height
	//If beingRemoved, do not throw height exception
	block.setHeight = function(height, beingRemoved)
	{
		if(!beingRemoved && height < 0)
		{
			throw 'NegativeBlockHeight';
		}
		
		var diff = height - block.height;
		
		block.changeHeight(diff);
	};
	
	//Make block hidden
	block.hide = function()
	{
		if(block.visible)
		{
			block.row_map.height -= block.height;
			block.visible = false;
			
			//Log deletions at the proper position relative to the beginning of the interval.
			row_map.logRefreshAction({
				type: 'delete',
				index: this.getStart(),
				number: this.height
			});
		}
	};
	
	//Make block visible
	block.reveal = function()
	{
		if(!block.visible)
		{
			block.row_map.height += block.height;
			block.visible = true;
			
			//Log deletions at the proper position relative to the beginning of the interval.
			row_map.logRefreshAction({
				type: 'insert',
				index: this.getStart(),
				number: this.height
			});
		}
	};
	
	//Log block update
	block.update = function()
	{
		if(block.visible)
		{
			row_map.logRefreshAction({
				type: 'update',
				index: this.getStart(),
				number: this.height
			});
		}
	};

	//Is block visible ?
	block.isVisible = function()
	{
		//If set as visible and not empty.
		return block.visible && (block.height > 0);
	};
	
	//Make a JSON-able copy without back reference
	block.exportCopyBase = function()
	{
		return new Object({
			index: block.index,
			visible: block.visible,
			height: block.height,
			mappedInterval: (block.mappedInterval ? block.mappedInterval.export() : null)
		});
	};
	
	//Overridable export function for extending blocks
	block.exportCopy = function()
	{
		return block.exportCopyBase();
	};
}

//Generates a mapping interval. Used to represent an interval of rows, usually to form a block.
//For a non-empty interval, start and end are the indexes of the first and last rows of the interval.
//For an empty interval, start is the index of the first frame that would be inserted.
function Interval(empty, start, end)
{
	this.empty = empty;
	this.start = start;
	this.end = empty ? start - 1 : end;

	this.getLength = function()
	{
		return this.empty ? 0 : (1 + this.end - this.start);
	};

	this.shift = function(nb_rows)
	{
		this.start += nb_rows;
		this.end += nb_rows;
	};

	// endOfBlock controls what happens if index = start. If endOfBlock,
	// insert above this interval. Otherwise, merge the inserted row into it.
	this.updateAfterRowInsert = function(index, nb_rows, endOfBlock)
	{
		if(nb_rows <= 0) { return; }
		
		var limit_shift = endOfBlock ? -1 : 0;
		
		if(this.start > index + (this.empty ? 0 : limit_shift))
		{
			//If block starts after insertion index, shift it.
			this.shift(nb_rows);
		}
		else if(this.end >= index + limit_shift)
		{
			//If block ends after the insertion index, it gains the new rows.
			this.empty = false;
			this.end += nb_rows;
		}

		//Else, block is completely before the insertion : nothing to change.
	};

	this.updateAfterRowDelete = function(index, nb_rows)
	{
		if(nb_rows <= 0) { return; }
		
		if(this.start > index)
		{
			//If block starts after deletion index, shift it.
			this.shift(-nb_rows);
		}
		else if(this.end >= index)
		{
			//If block ends after the deletion index, it loses the deleted rows.
			if(!this.empty)
			{
				//Cannot delete row from empty block; only manage non-empty ones.
				this.end -= nb_rows;

				if(this.end < this.start)
				{
					//If new end is before start, the block is made empty.
					this.end = this.start - 1;
					this.empty = true;
				}
			}
		}

		//Else, block is completely before the deletion : nothing to change.
	};

	this.export = function()
	{
		return new Object({
			empty: this.empty,
			start: this.start,
			end: this.end
		});
	};
}

//END OF MODULE
Modules.complete('editor_rowmaps');
