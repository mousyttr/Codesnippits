"use strict";
/*
Ace Attorney Online - Function to generate the row map for the frames tab

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_rowmaps_frames',
	dependencies : ['editor_rowmaps'],
	init : function()
	{
	}
}));

//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
// Superblocks are elements that display as part of a "special" block in the storyboard.
//		This is easiest understood by looking at block_types.
// Frames RowMap Blocks:
// 	outer_interval: contiguous 'normal' frames not in a superblock
// 	interval: contiguous 'normal' frames in a superblock, e.g., press conversation
//  The remaining types are self-descriptive but are not 'normal' frames.
//  These include a link to insert a frame, CE statements, and headers/footers.
//  More technically, a 'normal' frame is a frame row. See (get/populate)FrameRow.
function FramesRowMap()
{
	function containsInterval(start, end)
	{
		if(start == 0
			|| end == 0
			|| end - start < 0)
		{	
			return false;
		}
		else
		{
			return true;
		}
	}

	function getIntervalBlock(start, end, visible)
	{
		if(containsInterval(start, end))
		{
			return turnIntoFramesRowMapBlock(row_map.addDataBlock(visible, new Interval(false, start, end)));
		}
		else
		{
			return turnIntoFramesRowMapBlock(row_map.addDataBlock(visible, new Interval(true, start)));
		}
	}
	
	RowMap.apply(this);
	var row_map = this;
	
	row_map.super_blocks = new Object();
	
	//Determine the block limits
	var block_starts = new Array();
	
	var block_types = ['cross_examinations', 'scenes', 'scenes_aai']; //only top level super blocks that can't be included in each other
	for(var j = 0; j < block_types.length; j++)
	{
		//create sub_block locator for this type of super block
		row_map.super_blocks[block_types[j]] = new Object();
		
		//get data about the starting point of this super block
		var trial_data_block_rows = trial_data[block_types[j]];
		
		for(var i = 1; i < trial_data[block_types[j]].length; i++)
		{
			var block = trial_data_block_rows[i];
			
			block_starts.push(new Object({
				index: getRowIndexById('frames', block.start),
				type: block_types[j],
				block: trial_data_block_rows[i]
			}));
		}
	}
	
	//order the limits properly
	block_starts.sort(function(a, b){
		return a.index - b.index;
	});
	
	
	//based on these limits, build the map
	var currentIndex = 1;
	
	var conv_start_index;
	var conv_end_index;
	
	for(var i = 0; i < block_starts.length; i++)
	{
		//map interval before super block start
		var block = getIntervalBlock(currentIndex, block_starts[i].index - 1, true);
		block.type = 'outer_interval';
		block.subtype = 'normal';
		block.rowClass = '';
		
		//map different elements of the super block
		if(block_starts[i].type == 'cross_examinations')
		{
			var ce_id = block_starts[i].block.id;
			row_map.super_blocks.cross_examinations[ce_id] = new Object();
			
			row_map.super_blocks.cross_examinations[ce_id].display = new Object({
				ce_id: ce_id,
				mode: 'closed'
			});
			
			//map block header
			var block = turnIntoFramesRowMapBlock(row_map.addNonDataBlock(true));
			block.type = 'ce_header';
			block.block_id = ce_id;
			block.display = row_map.super_blocks.cross_examinations[ce_id].display;
			
			row_map.super_blocks.cross_examinations[ce_id].block_header = block;
			
			row_map.super_blocks.cross_examinations[ce_id].statements = new Array();
			//map statements and their conversations
			for(var j = 0; j < block_starts[i].block.statements.length; j++)
			{
				row_map.super_blocks.cross_examinations[ce_id].statements[j] = new Object();
				
				//map the statement
				var statement_row_index = getRowIndexById('frames', block_starts[i].block.statements[j].id);
				var block = getIntervalBlock(statement_row_index, statement_row_index, false);
				block.type = 'ce_statement';
				block.rowClass = 'panel-frame statement';
				block.block_id = ce_id;
				block.statement_index = j;
				
				row_map.super_blocks.cross_examinations[ce_id].statements[j].statement = block;
				
				//map its pressing conversation
				conv_start_index = getRowIndexById('frames', block_starts[i].block.statements[j].pressing_conv_start) + 1;
				conv_end_index = getRowIndexById('frames', block_starts[i].block.statements[j].pressing_conv_end) - 1;
				if(containsInterval(conv_start_index, conv_end_index))
				{
					var block = getIntervalBlock(conv_start_index, conv_end_index);
					block.type = 'interval';
					block.subtype = 'pressing_conv';
					block.rowClass = 'panel-frame pressing_cv';
					block.block_id = ce_id;
					block.statement_index = j;
					row_map.super_blocks.cross_examinations[ce_id].statements[j].pressing_conv = block;
				}
				
				
				//map its optional conversation
				conv_start_index = getRowIndexById('frames', block_starts[i].block.statements[j].optional_conv_start) + 1;
				conv_end_index = getRowIndexById('frames', block_starts[i].block.statements[j].optional_conv_end) - 1;
				if(containsInterval(conv_start_index, conv_end_index))
				{
					var block = getIntervalBlock(conv_start_index, conv_end_index);
					block.type = 'interval';
					block.subtype = 'optional_conv';
					block.rowClass = 'panel-frame optional_cv';
					block.block_id = ce_id;
					block.statement_index = j;
					row_map.super_blocks.cross_examinations[ce_id].statements[j].optional_conv = block;
				}
			}
			
			//map co-council conversation
			conv_start_index = getRowIndexById('frames', block_starts[i].block.cocouncil_start) + 1;
			conv_end_index = getRowIndexById('frames', block_starts[i].block.cocouncil_end) - 1;
			// Cocouncil conv is always here, even if empty
			var block = getIntervalBlock(conv_start_index, conv_end_index);
			block.type = 'interval';
			block.subtype = 'cocouncil_conv';
			block.rowClass = 'panel-frame';
			block.block_id = ce_id;
			row_map.super_blocks.cross_examinations[ce_id].cocouncil_conv = block;
			
			//map failure conversation
			conv_start_index = getRowIndexById('frames', block_starts[i].block.failure_conv_start) + 1;
			conv_end_index = getRowIndexById('frames', block_starts[i].block.failure_conv_end) - 1;
			if(containsInterval(conv_start_index, conv_end_index))
			{
				var block = getIntervalBlock(conv_start_index, conv_end_index);
				block.type = 'interval';
				block.subtype = 'failure_conv';
				block.rowClass = 'panel-frame';
				block.block_id = ce_id;
				row_map.super_blocks.cross_examinations[ce_id].failure_conv = block;
			}
			
			//map block_footer
			var block = turnIntoFramesRowMapBlock(row_map.addNonDataBlock(true));
			block.type = 'ce_footer';
			block.block_id = ce_id;
			block.display = row_map.super_blocks.cross_examinations[ce_id].display;
			row_map.super_blocks.cross_examinations[ce_id].block_footer = block;
		}
		else if(block_starts[i].type == 'scenes')
		{
			var scene_id = block_starts[i].block.id;
			row_map.super_blocks.scenes[scene_id] = new Object();
			
			row_map.super_blocks.scenes[scene_id].display = new Object({
				scene_id: scene_id,
				mode: 'closed'
			});
			
			//map block header
			var block = turnIntoFramesRowMapBlock(row_map.addNonDataBlock(true));
			block.type = 'scene_header';
			block.block_id = scene_id;
			block.display = row_map.super_blocks.scenes[scene_id].display;
			row_map.super_blocks.scenes[scene_id].block_header = block;
			
			row_map.super_blocks.scenes[scene_id].dialogues = new Object();
			for(var j = 0; j < block_starts[i].block.dialogues.length; j++)
			{
				//Map all dialogues attached to the scene.
				var dialogue = block_starts[i].block.dialogues[j];
				row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id] = new Object();
				
				row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].display = new Object({
					scene_id: scene_id,
					dialogue_id: dialogue.id,
					mode: 'closed'
				});
				
				//Dialogue header
				var block = turnIntoFramesRowMapBlock(row_map.addNonDataBlock(false));
				block.type = 'scene_dialogue_header';
				block.scene_id = scene_id;
				block.dialogue_id = dialogue.id;
				block.display = row_map.super_blocks.scenes[scene_id].display;
				row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].header = block;
				
				//Dialogue introduction conversation
				conv_start_index = getRowIndexById('frames', dialogue.intro_start) + 2;
				conv_end_index = getRowIndexById('frames', dialogue.intro_end) - 1;
				var block = getIntervalBlock(conv_start_index, conv_end_index);
				block.type = 'interval';
				block.rowClass = 'panel-frame';
				block.scene_type = 'scenes';
				block.scene_id = scene_id;
				block.section_type = 'dialogues';
				block.section_id = dialogue.id;
				block.conv_type = 'intro_conversation';
				row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].intro_conversation = block;
				
				//Talk conversations
				row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].talk_topics = new Array();
				for(var k = 0; k < dialogue.talk_topics.length; k++)
				{
					conv_start_index = getRowIndexById('frames', dialogue.talk_topics[k].start) + 1;
					conv_end_index = getRowIndexById('frames', dialogue.talk_topics[k].end) - 1;
					
					var block = getIntervalBlock(conv_start_index, conv_end_index);
					block.type = 'interval';
					block.rowClass = 'panel-frame';
					block.scene_type = 'scenes';
					block.scene_id = scene_id;
					block.section_type = 'dialogues';
					block.section_id = dialogue.id;
					block.conv_type = 'talk_topics';
					block.conv_index = k;
					row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].talk_topics[k] = block;
				}
				
				//Present conversations
				row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].present_conversations = new Array();
				for(var k = 0; k < dialogue.present_conversations.length; k++)
				{
					if(!dialogue.present_conversations[k]) { debugger; }
					conv_start_index = getRowIndexById('frames', dialogue.present_conversations[k].start) + 1;
					conv_end_index = getRowIndexById('frames', dialogue.present_conversations[k].end) - 1;
					
					var block = getIntervalBlock(conv_start_index, conv_end_index);
					block.type = 'interval';
					block.rowClass = 'panel-frame';
					block.scene_type = 'scenes';
					block.scene_id = scene_id;
					block.section_type = 'dialogues';
					block.section_id = dialogue.id;
					block.conv_type = 'present_conversations';
					block.conv_index = k;
					row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].present_conversations[k] = block;
				}
				
				if(dialogue.locks)
				{
					//Psyche locks conversation
					conv_start_index = getRowIndexById('frames', dialogue.locks.start) + 1;
					conv_end_index = getRowIndexById('frames', dialogue.locks.end) - 1;
					var block = getIntervalBlock(conv_start_index, conv_end_index);
					block.type = 'interval';
					block.rowClass = 'panel-frame';
					block.scene_type = 'scenes';
					block.scene_id = scene_id;
					block.section_type = 'dialogues';
					block.section_id = dialogue.id;
					block.conv_type = 'locks_conversation';
					row_map.super_blocks.scenes[scene_id].dialogues[dialogue.id].locks_conversation = block;
				}
			}
			
			row_map.super_blocks.scenes[scene_id].examinations = new Object();
			for(var j = 0; j < block_starts[i].block.examinations.length; j++)
			{
				//Map all examinations attached to the scene.
				var examination = block_starts[i].block.examinations[j];
				row_map.super_blocks.scenes[scene_id].examinations[examination.id] = new Object();
				
				row_map.super_blocks.scenes[scene_id].examinations[examination.id].display = new Object({
					scene_id: scene_id,
					examination_id: examination.id,
					mode: 'closed'
				});
				
				//Examination header
				var block = turnIntoFramesRowMapBlock(row_map.addNonDataBlock(false));
				block.type = 'scene_examination_header';
				block.scene_id = scene_id;
				block.examination_id = examination.id;
				block.display = row_map.super_blocks.scenes[scene_id].display;
				row_map.super_blocks.scenes[scene_id].examinations[examination.id].header = block;
				
				//Examination conversations
				row_map.super_blocks.scenes[scene_id].examinations[examination.id].examine_conversations = new Array();
				for(var k = 0; k < examination.examine_conversations.length; k++)
				{
					if(!examination.examine_conversations[k]) { debugger; }
					conv_start_index = getRowIndexById('frames', examination.examine_conversations[k].start) + 1;
					conv_end_index = getRowIndexById('frames', examination.examine_conversations[k].end) - 1;
					
					var block = getIntervalBlock(conv_start_index, conv_end_index);
					block.type = 'interval';
					block.rowClass = 'panel-frame';
					block.scene_type = 'scenes';
					block.scene_id = scene_id;
					block.section_type = 'examinations';
					block.section_id = examination.id;
					block.conv_type = 'examine_conversations';
					block.conv_index = k;
					row_map.super_blocks.scenes[scene_id].examinations[examination.id].examine_conversations[k] = block;
				}
				
				//Deduction conversations
				row_map.super_blocks.scenes[scene_id].examinations[examination.id].deduce_conversations = new Array();
				for(var k = 0; k < examination.deduce_conversations.length; k++)
				{
					if(!examination.deduce_conversations[k]) { debugger; }
					conv_start_index = getRowIndexById('frames', examination.deduce_conversations[k].start) + 1;
					conv_end_index = getRowIndexById('frames', examination.deduce_conversations[k].end) - 1;
					
					var block = getIntervalBlock(conv_start_index, conv_end_index);
					block.type = 'interval';
					block.rowClass = 'panel-frame';
					block.scene_type = 'scenes';
					block.scene_id = scene_id;
					block.section_type = 'examinations';
					block.section_id = examination.id;
					block.conv_type = 'deduce_conversations';
					block.conv_index = k;
					row_map.super_blocks.scenes[scene_id].examinations[examination.id].deduce_conversations[k] = block;
				}
			}
			
			//map block footer
			var block = turnIntoFramesRowMapBlock(row_map.addNonDataBlock(true));
			block.type = 'scene_footer';
			block.block_id = scene_id;
			block.display = row_map.super_blocks.scenes[scene_id].display;
			row_map.super_blocks.scenes[scene_id].block_footer = block;
		}
		
		currentIndex = getRowIndexById('frames', block_starts[i].block.end) + 1;
	}
	
	//map interval before end
	var block = getIntervalBlock(currentIndex, trial_data.frames.length - 1, true);
	block.type = 'outer_interval';
	block.subtype = 'normal';
	block.rowClass = '';
	
	//insert link row
	var block = turnIntoFramesRowMapBlock(row_map.addNonDataBlock(true));
	block.type = 'insert_link';
	
	//Set edition function
	row_map.edit = function(edit_data)
	{
		// Forget leftover refresh actions that may not have been consumed.
		row_map.flushRefreshAction();
		
		switch(edit_data.edit_type)
		{
			case 'Row_Insert' :
			
				//Insert a new row in the map
				row_map.insertRows(edit_data.row_index, 1, edit_data.end_of_block);
				break;
			
			case 'Row_Delete' :
				
				if(edit_data.start_index)
				{
					row_map.deleteRows(edit_data.start_index, edit_data.length);
				}
				else
				{
					row_map.deleteRows(edit_data.row_index, 1);
				}
				break;
			
			case 'Row_Move' :
			
				var nb_moved_rows = 1 + edit_data.end_index - edit_data.start_index;
				var target_index = edit_data.target_index;
			
				if(target_index > edit_data.start_index)
				{
					// If target index after the removed interval, shift to the new target index before inserting.
					target_index -= nb_moved_rows;
				}
				
				row_map.deleteRows(edit_data.start_index, nb_moved_rows);
				row_map.insertRows(target_index, nb_moved_rows, edit_data.end_of_block);
				break;
			
			case 'CE_Conversation_Insert':
				//Find target CE
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
			
				switch(edit_data.conv_type)
				{
					case 'pressing_conv':
						//Find target statement
						var statement = ce.statements[edit_data.statement_index];
						
						//Insert conv block after statement, containing the given frame
						var block = CE_Conversation_Insert(row_map, edit_data.frame_index, statement.statement.index + 1);
						block.subtype = 'pressing_conv';
						block.rowClass = 'panel-frame pressing_cv';
						block.block_id = edit_data.CE_id;
						block.statement_index = edit_data.statement_index;
						
						//Link conv to statement
						statement.pressing_conv = block;
						break;
					
					case 'optional_conv':
						//Find target statement
						var statement = ce.statements[edit_data.statement_index];
						
						//Insert conv block after pressing conv or statement, containing the given frame
						var block_index = (statement.pressing_conv ? statement.pressing_conv.index : statement.statement.index) + 1;
						var block = CE_Conversation_Insert(row_map, edit_data.frame_index, block_index);
						
						block.subtype = 'optional_conv';
						block.rowClass = 'panel-frame optional_cv';
						block.block_id = edit_data.CE_id;
						block.statement_index = edit_data.statement_index;
						
						//Link conv to statement
						statement.optional_conv = block;
						break;
					
					case 'cocouncil_conv':
						//Insert conv block after last statement's convs, or header
						var block_index;
						
						if(ce.statements.length > 0)
						{
							var last_statement = ce.statements[ce.statements.length - 1];
							block_index = (last_statement.optional_conv ? last_statement.optional_conv.index : 
								(last_statement.pressing_conv ? last_statement.pressing_conv.index : last_statement.statement.index)) + 1;
						}
						else
						{
							block_index = ce.block_header.index + 1;
						}
						
						var block = CE_Conversation_Insert(row_map, edit_data.frame_index, block_index);
						block.subtype = 'cocouncil_conv';
						block.rowClass = 'panel-frame';
						block.block_id = edit_data.CE_id;
						
						//Link conv to CE
						ce.cocouncil_conv = block;
						break;
					
					case 'failure_conv':
						//Insert conv block after cocouncil, last statement's convs, or header
						var block_index;
						
						if(ce.cocouncil_conv)
						{
							block_index = ce.cocouncil_conv.index + 1;
						}
						else if(ce.statements.length > 0)
						{
							var last_statement = ce.statements[ce.statements.length - 1];
							block_index = (last_statement.optional_conv ? last_statement.optional_conv.index : 
								(last_statement.pressing_conv ? last_statement.pressing_conv.index : last_statement.statement.index)) + 1;
						}
						else
						{
							block_index = ce.block_header.index + 1;
						}
						
						var block = CE_Conversation_Insert(row_map, edit_data.frame_index, block_index);
						block.subtype = 'failure_conv';
						block.rowClass = 'panel-frame';
						block.block_id = edit_data.CE_id;
						
						//Link conv to CE
						ce.failure_conv = block;
						break;
						
					default:
						throw "UnknownConvType";
				}
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'CE_Conversation_Delete':
				//Find the target CE
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
			
				switch(edit_data.conv_type)
				{
					case 'pressing_conv':
						//Find the target statement
						var statement = ce.statements[edit_data.statement_index];
						
						//Delete and unlink
						CE_Conversation_Delete(statement.pressing_conv);
						statement.pressing_conv = null;
						break;
					
					case 'optional_conv':
						//Find the target statement
						var statement = ce.statements[edit_data.statement_index];
						
						//Delete and unlink
						CE_Conversation_Delete(statement.optional_conv);
						statement.optional_conv = null;
						break;
					
					case 'cocouncil_conv':
						//Delete and unlink
						CE_Conversation_Delete(ce.cocouncil_conv);
						ce.cocouncil_conv = null;
						break;
					
					case 'failure_conv':
						//Delete and unlink
						CE_Conversation_Delete(ce.failure_conv);
						ce.failure_conv = null;
						break;
					
					default:
						throw "UnknownConvType";
				}
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'CE_Close' :
				
				CE_Close(row_map, edit_data.CE_id);
				
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
				
				ce.display.mode = 'closed';
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'CE_Open_Overview' :
				
				CE_Close(row_map, edit_data.CE_id);
				
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
				
				for(var i = 0; i < ce.statements.length; i++)
				{
					ce.statements[i].statement.reveal();
				}
				
				ce.display.mode = 'overview';
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'CE_Open_Cocouncil' :
				
				CE_Close(row_map, edit_data.CE_id);
				
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
				
				if(ce.cocouncil_conv)
				{
					ce.cocouncil_conv.reveal();
				}
				ce.display.mode = 'cocouncil_conv';
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'CE_Open_Failure' :
				
				CE_Close(row_map, edit_data.CE_id);
				
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
				
				if(ce.failure_conv)
				{
					ce.failure_conv.reveal();
				}
				ce.display.mode = 'failure_conv';
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'CE_Statement_Open_Pressing' :
				
				CE_Statement_Open_Pressing(row_map, edit_data.CE_id, edit_data.statement_index);
				
				break;
			
			case 'CE_Statement_Open_Optional' :
				
				CE_Close(row_map, edit_data.CE_id);
				
				var statement_data = row_map.super_blocks.cross_examinations[edit_data.CE_id].statements[edit_data.statement_index];
				statement_data.statement.reveal();
				if(statement_data.optional_conv)
				{
					statement_data.optional_conv.reveal();
				}
				
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
				
				ce.display.mode = 'optional_conv';
				ce.display.statement_index = edit_data.statement_index;			
				
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'CE_Statement_Insert' :
				
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
				var statements = ce.statements;
				var statement_block_index;
				
				if(edit_data.statement_index < statements.length)
				{
					//Inserting before an existing statement : take its block index.
					statement_block_index = statements[edit_data.statement_index].statement.index;
				}
				else
				{
					//Inserting at the end
					if(statements.length > 0)
					{
						//There are statements already : after optional conv of last statement
						var last_statement = statements[statements.length - 1];
						statement_block_index = (last_statement.optional_conv ? last_statement.optional_conv.index :
							(last_statement.pressing_conv ? last_statement.pressing_conv.index :
							last_statement.statement.index)) + 1;
					}
					else
					{
						//First statement : after CE header.
						statement_block_index = ce.block_header.index + 1;
					}
				}
				
				//Create new block
				var statement = turnIntoFramesRowMapBlock(row_map.insertDataBlock(statement_block_index, true, new Interval(false, edit_data.frame_index, edit_data.frame_index)));
				statement.type = 'ce_statement';
				statement.rowClass = 'panel-frame statement';
				statement.block_id = edit_data.CE_id;
				statement.statement_index = edit_data.statement_index;
				
				//Insert the new statement object
				statements.splice(edit_data.statement_index, 0, {statement: statement, pressing_conv: null, optional_conv: null});
				
				CE_UpdateStatementIndexes(statements);
				
				CE_Statement_Open_Pressing(row_map, edit_data.CE_id, edit_data.statement_index);
				
				break;
			
			case 'CE_Statement_Delete' :
				
				var statements = row_map.super_blocks.cross_examinations[edit_data.CE_id].statements;
				var statement_data = statements[edit_data.statement_index];
				
				//Remove the blocks from the row map.				
				statement_data.statement.deleteBlock();
				if(statement_data.pressing_conv)
				{
					CE_Conversation_Delete(statement_data.pressing_conv);
				}
				if(statement_data.optional_conv)
				{
					CE_Conversation_Delete(statement_data.optional_conv);
				}
				
				//Remove the statement object
				statements.splice(edit_data.statement_index, 1);
				
				//Fix statement indexes
				CE_UpdateStatementIndexes(statements);
				
				var ce = row_map.super_blocks.cross_examinations[edit_data.CE_id];
				
				ce.display.mode = 'overview';
				
				ce.block_header.update();
				ce.block_footer.update();
				
				break;
			
			case 'Scene_Section_Open' :
			
				var scene = row_map.super_blocks[edit_data.scene_type][edit_data.scene_id];
				var section = scene[edit_data.section_type][edit_data.section_id];
				
				switch(edit_data.scene_type)
				{
					case 'scenes':
						Scene_Close(row_map, edit_data.scene_id);
						break;
				}
				
				scene.display.mode = 'section';
				scene.display.section_block_index = edit_data.section_block_index;
				scene.display.section_type = edit_data.section_type;
				scene.display.section_id = edit_data.section_id;
				
				switch(edit_data.section_type)
				{
					case 'dialogues':
						section.header.reveal();
						break;
					
					case 'examinations':
						section.header.reveal();
						break;
				}
				
				scene.display.section_mode = 'closed';
				
				scene.block_header.update();
				section.header.update();
				scene.block_footer.update();
				
				break;
			
			case 'Scene_Section_Conv_Open' :
				
				Scene_Section_Conv_Open(row_map, edit_data.scene_type, edit_data.scene_id, edit_data.section_type, edit_data.section_id, 
					edit_data.subsection_type, edit_data.subsection_index, edit_data.conv_type, edit_data.conv_index);
				
				break;
				
			case 'Scene_Dialogue_Locks_Insert':
				var scene = row_map.super_blocks[edit_data.scene_type][edit_data.scene_id];
				var dialogue = scene.dialogues[edit_data.dialogue_id];
				
				//After the last present conversation (there is at least one)
				var conv_block_index = dialogue.present_conversations[dialogue.present_conversations.length - 1].index + 1;
				
				//Insert invisible start and ending frames
				row_map.insertRows(edit_data.frame_index, 2, false);
				
				//Create new block for conversation frames
				var conv = turnIntoFramesRowMapBlock(row_map.insertDataBlock(conv_block_index, false, new Interval(true, edit_data.frame_index + 1)));
				conv.type = 'interval';
				conv.rowClass = 'panel-frame';
				conv.scene_type = edit_data.scene_type;
				conv.scene_id = edit_data.scene_id;
				conv.section_type = 'dialogues';
				conv.section_id = edit_data.dialogue_id;
				conv.conv_type = 'locks_conversation';
								
				dialogue.locks_conversation = conv;
				
				break;
			
			case 'Scene_Dialogue_Locks_Delete' :
				
				var scene = row_map.super_blocks[edit_data.scene_type][edit_data.scene_id];
				var dialogue = scene.dialogues[edit_data.dialogue_id];
				
				scene.display.mode = 'section';
				scene.display.section_type = 'dialogues';
				scene.display.section_id = edit_data.dialogue_id;
				scene.display.section_mode = 'closed';
				
				dialogue.locks_conversation.deleteBlock();
				//Also delete invisible start and ending frame
				row_map.deleteRows(dialogue.locks_conversation.mappedInterval.start - 1, 2);
				
				dialogue.locks_conversation = null;
				
				scene.block_header.update();
				dialogue.header.update();
				scene.block_footer.update();
				
				break;
			
			case 'Scene_Section_Conv_Insert' :
				
				var scene = row_map.super_blocks[edit_data.scene_type][edit_data.scene_id];
				var section = scene[edit_data.section_type][edit_data.section_id];
				
				var convs = section[edit_data.conv_type];
				var conv_block_index;
				if(edit_data.conv_index < convs.length)
				{
					//Inserting before an existing conv : take its block index.
					conv_block_index = convs[edit_data.conv_index].index;
				}
				else
				{
					//Inserting at the end
					if(convs.length > 0)
					{
						//There are convs already : after last conv
						conv_block_index = convs[convs.length - 1].index + 1;
					}
					else
					{
						//First statement : after section header.
						conv_block_index = section.header.index + 1;
					}
				}
				
				//Insert invisible start and ending frame
				row_map.insertRows(edit_data.frame_index, 2, false);
				
				//Create new block for conversation frames
				var conv = turnIntoFramesRowMapBlock(row_map.insertDataBlock(conv_block_index, false, new Interval(true, edit_data.frame_index + 1)));
				conv.type = 'interval';
				conv.rowClass = 'panel-frame';
				conv.scene_type = edit_data.scene_type;
				conv.scene_id = edit_data.scene_id;
				conv.section_type = edit_data.section_type;
				conv.section_id = edit_data.section_id;
				conv.conv_type = edit_data.conv_type;
				conv.conv_index = edit_data.conv_index;
				
				//Insert the new conversation object
				convs.splice(edit_data.conv_index, 0, conv);
				
				//Open the new conversation
				Scene_Section_Conv_Open(row_map, edit_data.scene_type, edit_data.scene_id, edit_data.section_type, edit_data.section_id, 
					edit_data.subsection_type, edit_data.subsection_index, edit_data.conv_type, edit_data.conv_index);
				
				break;
			
			case 'Scene_Section_Conv_Delete' :
				
				var scene = row_map.super_blocks[edit_data.scene_type][edit_data.scene_id];
				var section = scene[edit_data.section_type][edit_data.section_id];
				
				scene.display.mode = 'section';
				scene.display.section_type = edit_data.section_type;
				scene.display.section_id = edit_data.section_id;
				scene.display.section_mode = 'subsection';
				scene.display.subsection_index = edit_data.subsection_index;
				scene.display.subsection_mode = 'closed';
				
				//Delete the block
				section[edit_data.conv_type][edit_data.conv_index].deleteBlock();
				//Also delete invisible start and ending frames
				row_map.deleteRows(section[edit_data.conv_type][edit_data.conv_index].mappedInterval.start - 1, 2);
				
				section[edit_data.conv_type].splice(edit_data.conv_index, 1);
				
				scene.block_header.update();
				section.header.update();
				scene.block_footer.update();
				
				break;
		}
		
		row_map.reinitNavigators();
		return row_map.flushRefreshAction();
	};
	
	return row_map;
}

// CE map management

function CE_Conversation_Insert(row_map, real_frame_index, target_block_index)
{
	//Insert the real frame with the 2 conv limit frames : one before the real frame, and one after.
	row_map.shiftIntervals(real_frame_index - 1, 2);
	
	//Create conversation block with the real frame
	var block = turnIntoFramesRowMapBlock(row_map.insertDataBlock(target_block_index, true, new Interval(false, real_frame_index, real_frame_index)));
	block.type = 'interval';
	
	return block;
}

function CE_Conversation_Delete(conv)
{
	var row_map = conv.row_map;
	//Remove the block
	conv.deleteBlock();
	//Remove the 2 limit frames
	row_map.deleteRows(conv.mappedInterval.start - 1, 2);
}

function CE_Close(row_map, CE_id)
{
	var CE_data = row_map.super_blocks.cross_examinations[CE_id];
	if(CE_data.cocouncil_conv)
	{
		CE_data.cocouncil_conv.hide();
	}
	if(CE_data.failure_conv)
	{
		CE_data.failure_conv.hide();
	}
	
	for(var i = 0; i < CE_data.statements.length; i++)
	{
		CE_data.statements[i].statement.hide();
		if(CE_data.statements[i].pressing_conv)
		{
			CE_data.statements[i].pressing_conv.hide();
		}
		if(CE_data.statements[i].optional_conv)
		{
			CE_data.statements[i].optional_conv.hide();
		}
	}
}

function CE_Statement_Open_Pressing(row_map, CE_id, statement_index)
{
	CE_Close(row_map, CE_id);
	
	var ce = row_map.super_blocks.cross_examinations[CE_id];
	
	var statement_data = ce.statements[statement_index];
	statement_data.statement.reveal();
	if(statement_data.pressing_conv)
	{
		statement_data.pressing_conv.reveal();
	}
	
	ce.display.mode = 'pressing_conv';
	ce.display.statement_index = statement_index;
	
	ce.block_header.update();
	ce.block_footer.update();
}

function CE_UpdateStatementIndexes(statements)
{
	for(var i = 0; i < statements.length; i++)
	{
		statements[i].statement.statement_index = i;
		if(statements[i].pressing_conv)
		{
			statements[i].pressing_conv.statement_index = i;
		}
		if(statements[i].optional_conv)
		{
			statements[i].optional_conv.statement_index = i;
		}
	}
}

// Dialogue map management

function Dialogue_Close(dialogue)
{
	dialogue.header.hide();
	dialogue.intro_conversation.hide();
	for(var i = 0; i < dialogue.talk_topics.length; i++)
	{
		dialogue.talk_topics[i].hide();
	}
	for(var i = 0; i < dialogue.present_conversations.length; i++)
	{
		dialogue.present_conversations[i].hide();
	}
	
	if(dialogue.locks_conversation)
	{
		dialogue.locks_conversation.hide();
	}
}

function Examination_Close(examination)
{
	examination.header.hide();
	for(var i = 0; i < examination.examine_conversations.length; i++)
	{
		examination.examine_conversations[i].hide();
	}
	for(var i = 0; i < examination.deduce_conversations.length; i++)
	{
		examination.deduce_conversations[i].hide();
	}
}

// Scene map management

function Scene_Close(row_map, scene_id)
{
	var scene_data = row_map.super_blocks.scenes[scene_id];
	
	for(var i in scene_data.dialogues)
	{
		Dialogue_Close(scene_data.dialogues[i]);
	}
	
	for(var i in scene_data.examinations)
	{
		Examination_Close(scene_data.examinations[i]);
	}
}

function Scene_Section_Conv_Open(row_map, scene_type, scene_id, section_type, section_id, 
	subsection_type, subsection_index, conv_type, conv_index)
{
	var scene = row_map.super_blocks[scene_type][scene_id];
	var section = scene[section_type][section_id];
	
	scene.display.mode = 'section';
	scene.display.section_type = section_type;
	scene.display.section_id = section_id;
	scene.display.section_mode = 'subsection';
	scene.display.subsection_index = subsection_index;
	scene.display.subsection_type = subsection_type;
	scene.display.subsection_mode = 'open';
	scene.display.conv_type = conv_type;
	
	switch(section_type)
	{
		case 'dialogues':
			Dialogue_Close(section);
			section.header.reveal();
			break;
		
		case 'examinations':
			Examination_Close(section);
			section.header.reveal();
			break;
	}
	
	switch(subsection_type)
	{
		case 'single_conversation':
			section[conv_type].reveal();
			break;
		
		case 'conversation_list':
			section[conv_type][conv_index].reveal();
			scene.display.conv_index = conv_index;
			break;
	}
	
	scene.block_header.update();
	section.header.update();
	scene.block_footer.update();
}

function turnIntoFramesRowMapBlock(block)
{
	block.exportCopy = function()
	{
		var export_base = block.exportCopyBase();
		for(var field in {
			type: 0, subtype: 0, rowClass: 0, 
			block_id: 0, statement_index: 0, 
			scene_type: 0, scene_id: 0, section_block_index: 0, section_type: 0, section_id: 0,
			conv_type: 0, conv_index: 0,
			dialogue_id: 0, examination_id: 0,
			display: 0
		})
		{
			if(typeof block[field] != 'undefined')
			{
				export_base[field] = block[field];
			}
		}
		return export_base;
	};
	
	return block;
}

//END OF MODULE
Modules.complete('editor_rowmaps_frames');
