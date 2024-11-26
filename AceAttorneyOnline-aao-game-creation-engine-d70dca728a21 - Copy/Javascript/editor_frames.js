"use strict";
/*
Ace Attorney Online - Handling frames section

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'editor_frames',
	dependencies : ['trial', 'trial_data', 'editor_frames_ce', 'editor_frames_scene', 'editor_frame_rows', 'editor_row_section' + (_GET['rs_engine'] ? '_' + _GET['rs_engine'] : ''), 'editor_rowmaps_frames'], // TODO : rowmaps_frames shouldn't be a direct dependency !
	init : function() 
	{
		frames_section_descriptor = new Object({
			type : 'frames',
			generator : getGenericFrameRow,
			populator : populateGenericFrameRow,
			unpopulator : unpopulateGenericFrameRow
		});
	}
}));

//INDEPENDENT INSTRUCTIONS

function frameInsert(endOfBlock, frame_index, frame_data) 
{
	if(!frame_data)
	{
		// No frame data : insert new frame
		var new_frame = createAndInsertDataRow('frames', frame_index);
	}
	else if(frame_data.id == null)
	{
		// Frame data but null id : insert a frame preset
		var new_frame = createAndInsertDataRowFromPreset('frames', frame_index, frame_data);
	}
	else
	{
		// Actual frame data : paste a cut frame
		var new_frame = insertDataRow('frames', frame_index, frame_data);
	}
	
	rowSectionMapEdit({
		edit_type: 'Row_Insert',
		row_index: frame_index,
		end_of_block: endOfBlock
	});
}

function frameDelete(frame_index)
{
	deleteDataRow('frames', frame_index);
	
	rowSectionMapEdit({
		edit_type: 'Row_Delete',
		row_index: frame_index
	});
}

function framesMove(endOfBlock, start_index, end_index, target_index)
{
	moveDataRowInterval('frames', start_index, end_index, target_index);
	
	rowSectionMapEdit({
		edit_type: 'Row_Move',
		start_index: start_index,
		end_index: end_index,
		target_index: target_index,
		end_of_block: endOfBlock
	});
}

function insertFrameBefore(endOfBlock, frame_id, frame_data)
{
	frameInsert(endOfBlock, getRowIndexById('frames', frame_id), frame_data);
}

function deleteFrame(frame_id)
{
	frameDelete(getRowIndexById('frames', frame_id));
}

function getFrameInsertRow()
{
	//generate insert link
	var insert_link = document.createElement('div');
	addClass(insert_link, 'last insert');
	insert_link.setAttribute('data-locale-content', 'add_frame');
	
	registerEventHandler(insert_link, 'click', function(){
		frameInsert(true, trial_data.frames.length);
	}, false);
	
	
	//generate outer row
	var outer_row = document.createElement('div'); 
	outer_row.className = 'storyboard-row ';
	outer_row.appendChild(insert_link);
	
	translateNode(outer_row);
	
	return outer_row;
}

//generic storyboard row generator
// This generates header/footer elements, in addition to the frame rows defined in editor_frame_rows
function getGenericFrameRow(row_position_descriptor)
{
	if(!row_position_descriptor)
	{
		//No descriptor : generate a basic row used to fetch row height
		var test_row = document.createElement('div'); 
		test_row.className = 'storyboard-row ';
		return test_row;
	}
	else 
	{
		var map_block = row_position_descriptor.block;
		var position = row_position_descriptor.position_rel_to_block;
		
		switch(map_block.type)
		{
			case 'outer_interval' :
				var frame_data = trial_data.frames[map_block.mappedInterval.start + position];
				
				return getFrameRow(frame_data, new Object({
					row_class: map_block.rowClass + ' outer-frame',
					insert_fct: insertFrameBefore.bind(undefined, false, frame_data.id),
					block_insert_enabled: true,
					delete_fct: deleteFrame.bind(undefined, frame_data.id),
					flow_controls_enabled: true,
					action: {
						type: 'regular'
					}
				}));
				break;
			
			case 'interval' :
				var frame_data = trial_data.frames[map_block.mappedInterval.start + position];
				
				switch(map_block.subtype)
				{
					case 'pressing_conv':
					case 'optional_conv':
					case 'cocouncil_conv':
					case 'failure_conv':
						return getFrameRow(frame_data, new Object({
							row_class: map_block.rowClass,
							insert_fct: insertFrameBefore.bind(undefined, false, frame_data.id),
							block_insert_enabled: false,
							delete_fct: getCEConvDeleteFunction(map_block.subtype, map_block.block_id, map_block.statement_index, frame_data.id),
							flow_controls_enabled: true,
							action: {
								type: 'regular'
							}
						}));
						break;
						
					default:
					
						var rowBehaviour = new Object({
							row_class: map_block.rowClass,
							insert_fct: insertFrameBefore.bind(undefined, false, frame_data.id),
							block_insert_enabled: false,
							delete_fct: deleteFrame.bind(undefined, frame_data.id),
							flow_controls_enabled: true,
							action: {
								type: 'regular'
							}
						});
						if(map_block.section_type == 'dialogues')
						{
							var dialogue_descriptor = new Object({
								scene_type: map_block.scene_type,
								scene_id: map_block.scene_id,
								section_type: map_block.section_type,
								section_id: map_block.section_id
							});
							
							rowBehaviour.action.context = prefixRawParameters(new Object({
								parent_dialogue: dialogue_descriptor
							}));
							
							if(map_block.conv_type == 'locks_conversation')
							{
								rowBehaviour.action.context.in_locks = prefixRawParameters(true);
							}
						}
						
						return getFrameRow(frame_data, rowBehaviour);
						break;
				}
				break;
			
			case 'insert_link' :
				return getFrameInsertRow();
				break;
			
			//CE rows
		
			case 'ce_header' :
				return getCEHeader(map_block.block_id, map_block.display);
				break;
			
			case 'ce_footer' :
				return getCEFooter(map_block.block_id, map_block.display);
				break;
			
			case 'ce_statement' :
				var ce = getRowById('cross_examinations', map_block.block_id);
				var statement = ce.statements[map_block.statement_index];
				var new_row = getFrameRow(getRowById('frames', statement.id), new Object({
					row_class: map_block.rowClass,
					insert_fct: null,
					block_insert_enabled: false,
					delete_fct: null,
					flow_controls_enabled: false,
					action: {
						type: 'contradiction',
						contradictions : statement.contradictions
					}
				}));
				
				return new_row;
				break;
			
			//Scene rows
			
			case 'scene_header' :
				return getSceneHeader(map_block.block_id, map_block.display);
				break;
			
			case 'scene_footer' :
				return getSceneFooter(map_block.block_id, map_block.display);
				break;
			
			case 'scene_dialogue_header' :
				return getSceneDialogueHeader('scenes', map_block.scene_id, map_block.dialogue_id, map_block.display);
				break;
			
			case 'scene_examination_header' :
				return getSceneExaminationHeader('scenes', map_block.scene_id, map_block.examination_id, map_block.display);
				break;
		}
	}
}

// Generic storyboard row populator
// Rows other than frame rows of editor_frame_rows have no data-filled, so are skipped
function populateGenericFrameRow(row)
{
	if(row.getAttribute('data-filled') == 0)
	{
		populateFrameRow(row);
	}
}

// Generic storyboard row unpopulator
// Rows other than frame rows of editor_frame_rows have no data-filled, so are skipped
function unpopulateGenericFrameRow(row)
{
	if(row.getAttribute('data-filled') == 1)
	{
		unpopulateFrameRow(row);
	}
}

//EXPORTED VARIABLES
var frames_section_descriptor;

//EXPORTED FUNCTIONS
function initFramesTab(section, content_div)
{
	setRowSectionDisplay(section, content_div);
	initRowSectionContent(frames_section_descriptor);
}

function insertNewFrameBefore(endOfBlock, frame_id)
{
	insertFrameBefore(endOfBlock, frame_id, null);
}

//END OF MODULE
Modules.complete('editor_frames');
