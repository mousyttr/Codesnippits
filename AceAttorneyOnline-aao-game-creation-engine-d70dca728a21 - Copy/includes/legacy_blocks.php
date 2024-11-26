<?php

includeScript('includes/action_descriptions.php');

define('NORMAL_FRAME', 0);

define('SCENE_STARTED', 1);
define('SCENE_EXAMINE', 2);

define('DIALOGUE_STARTED', 3);
define('DIALOGUE_TALK', 4);
define('DIALOGUE_PRESENT', 5);

define('LOCKS_CONVERSATIONS', 6);

define('CE_STARTED', 7);
define('CE_COCOUNCIL', 8);
define('CE_PRESSING', 9);
define('CE_FAILURE_CONV', 10);
define('CE_LAST_PRESSING', 11);

function buildStructure(&$frame_data, &$scenes, &$cross_examinations)
{
	static $frame_mode = NORMAL_FRAME;
	static $last_statement_with_press = 0;
	static $current_pressing_cv, $current_conv_id = 0;
	
	//echo $frame_data['id'] . " " . $frame_mode . "\n";
	
	switch($frame_mode)
	{
		case NORMAL_FRAME :
			
			switch($frame_data['action_name'])
			{
			
				case 'LancerCI' :
					
					$frame_mode = CE_STARTED;
					$last_statement_with_press = -1;
					
					$contradiction_frames = isset($frame_data['action_parameters'][0]) ? 
						explode('_', $frame_data['action_parameters'][0]) : array();
					$contradiction_elt_types = isset($frame_data['action_parameters'][1]) ? 
						explode('_', $frame_data['action_parameters'][1]) : array();
					$contradiction_elt_ids = isset($frame_data['action_parameters'][2]) ?
						explode('_', $frame_data['action_parameters'][2]) : array();
					$contradiction_success_frames = isset($frame_data['action_parameters'][3]) ?
						explode('_', $frame_data['action_parameters'][3]) : array();
					
					//create new CE
					$ce_id = count($cross_examinations);
					$cross_examinations[$ce_id] = array(
						'id' => $ce_id,
						'start' => $frame_data['id'],
						'end' => 0,
						'cocouncil_start' => 0,
						'cocouncil_end' => 0,
						'statements' => array(),
						'contradictions' => array(),
						'failure_conv_start' => isset($frame_data['action_parameters'][4]) ? getFrameDescriptor($frame_data['action_parameters'][4]) : 0,
						'failure_conv_end' => 0
					);
					
					foreach($contradiction_frames as $ind => $frame_id)
					{
						$cross_examinations[$ce_id]['contradictions'][] = array(
							'id' => $ind,
							'contrad_frame' => getFrameDescriptor($frame_id),
							'contrad_elt' => getCrEltDescriptor($contradiction_elt_types[$ind], $contradiction_elt_ids[$ind]),
							'destination' => getFrameDescriptor($contradiction_success_frames[$ind])
						);
					}
					
					//change the action to the new basic one
					$frame_data['action_name'] = 'CEStart';
					$frame_data['action_parameters'] = array();
					
					break;
				
				case 'CreerLieu' :
				
					$frame_mode = DIALOGUE_STARTED;
					
					$new_scene = array(
						'id' => intval($frame_data['action_parameters'][0]),
						'name' => $frame_data['action_parameters'][1],
						'hidden' => intval($frame_data['action_parameters'][2]),
						
						'dialogues' => array(array(
							'id' => 1,
							
							'start' => $frame_data['id'] + 1,
							'main' => 0,
							'talk' => 0,
							'present' => 0,
							'end' => 0,
							
							'intro_start' => $frame_data['id'] + 1,
							'intro_end' => 0,
							
							'talk_topics' => array(),
							'present_conversations' => array(),
							'locks' =>  null
						)),
						'current_dialogue' => 1,
						
						'examinations' => array(array(
							'id' => 1,
							
							'start' => 0,
							'examine' => 0,
							'end' => 0,
							
							'place' => 0,
							
							'examine_conversations' => array(),
							'deduce_conversations' => array(),
							
							'enable_deduction' => false
						)),
						'current_examination' => 1,
						
						'start' => $frame_data['id'],
						'move' => 0,
						'end' => getFrameDescriptor($frame_data['action_parameters'][3]) - 1,
						
						'move_list' => array()
					);
					$scenes[] = $new_scene;
					
					//change the action to the new basic one
					$frame_data['action_name'] = 'SceneStart';
					$frame_data['action_parameters'] = array(
						'context' => array(
							'scene' => array(
								'scene_type' => 'scenes',
								'scene_id' => $new_scene['id']
							)
						)
					);
					
					break;
				
				case 'LancerVerrous' :
					
					$scene = &$scenes[count($scenes) - 1];
					$locks = &$scene['dialogues'][0]['locks'];
					
					// Fill in information about the locks position, from V5 defaults
					$number_of_locks = $frame_data['action_parameters'][1];
					$center = array('x' => 128, 'y' => 96);
					$default_locks = array(
						array(
							'type' => 'jfa_lock',
							'x' => $center['x'],
							'y' => $center['y'] + 32
						),
						array(
							'type' => 'jfa_lock',
							'x' => $center['x'] + 96,
							'y' => $center['y'] - 32
						),
						array(
							'type' => 'jfa_lock',
							'x' => $center['x'] - 96,
							'y' => $center['y'] - 32
						),
						array(
							'type' => 'jfa_lock',
							'x' => $center['x'] + 48,
							'y' => $center['y'] + 64
						),
						array(
							'type' => 'jfa_lock',
							'x' => $center['x'] - 48,
							'y' => $center['y'] + 64
						),
					);
					$start = ($number_of_locks % 2 == 0) ? 1 : 0;
					
					for($i = $start; $i < $number_of_locks + $start; $i++)
					{
						$default_locks[$i]['id'] = $i + (1 - $start);
						$locks['locks_to_display'][] = $default_locks[$i];
					}
					
					// Switch mode to read locks conversations
					$frame_mode = LOCKS_CONVERSATIONS;
					
					//remove action : none necessary at start of psyche locks conversation
					$frame_data['action_name'] = '';
					$frame_data['action_parameters'] = array();
					
					break;
			}
			
			
			break;
		
		/*
		BEGIN PLACE STRUCTURE HANDLING
		*/
		
		//dialogue handling
		case DIALOGUE_STARTED :
		
			switch($frame_data['action_name'])
			{
				case 'AllerMessage' :
					$scene = &$scenes[count($scenes) - 1];
					
					$scene['dialogues'][0]['main'] = getFrameDescriptor($frame_data['action_parameters'][0]);
					$scene['dialogues'][0]['intro_end'] = $frame_data['id'];
					break;
				
				case 'ChoixEntre4' :
					$scene = &$scenes[count($scenes) - 1];
					
					$scene['place'] = $frame_data['place'];
					$scene['examinations'][0]['place'] = $frame_data['place'];
					
					if($scene['dialogues'][0]['main'] == $frame_data['id'])
					{
						$scene['dialogues'][0]['talk'] = getFrameDescriptor($frame_data['action_parameters'][6]);
						$scene['dialogues'][0]['present'] = getFrameDescriptor($frame_data['action_parameters'][7]);
						$scene['examinations'][0]['examine'] = ($scene['examinations'][0]['start'] = getFrameDescriptor($frame_data['action_parameters'][4]));
						$scene['move'] = getFrameDescriptor($frame_data['action_parameters'][5]);
					}
					
					//change the action to the new basic one
					$frame_data['action_name'] = 'DialogueMenu';
					$frame_data['action_parameters'] = array(
						'context' => array(
							'dialogue' => array(
								'scene_type' => 'scenes',
								'scene_id' => $scene['id'],
								'section_type' => 'dialogues',
								'section_id' => 1
							)
						)
					);
					
					break;
				
				case 'DiscussionEnquete' :
			
					$frame_mode = DIALOGUE_TALK;
					
					$scene = &$scenes[count($scenes) - 1];
					
					$scene['dialogues'][0]['talk'] = $frame_data['id'];
					
					for($i = 0; $i < count($frame_data['action_parameters']); $i++)
					{
						$disc = explode('_', $frame_data['action_parameters'][$i]);
						
						$scene['dialogues'][0]['talk_topics'][] = array(
							'id' => $i + 1,
							'title' => $disc[1],
							'start' => getFrameDescriptor($disc[0]),
							'end' => 0,
							'hidden' => intval($disc[2]),
							'icon' => 0
						);
					}
					
					//change the action to the new basic one
					$frame_data['action_name'] = 'DialogueTalk';
					$frame_data['action_parameters'] = array(
						'context' => array(
							'dialogue' => array(
								'scene_type' => 'scenes',
								'scene_id' => $scene['id'],
								'section_type' => 'dialogues',
								'section_id' => 1
							)
						)
					);
				
					break;
					
					
				case 'DiscussionEnqueteV2' :
				
					$frame_mode = DIALOGUE_TALK;
					
					$scene = &$scenes[count($scenes) - 1];
					
					$scene['dialogues'][0]['talk'] = $frame_data['id'];
					
					if($frame_data['action_parameters'][3] > 0)
					{
						$scene['dialogues'][0]['locks'] = array(
							'start' => getFrameDescriptor($frame_data['action_parameters'][3]),
							'end' => 0,
							'hidden' => intval($frame_data['action_parameters'][4]),
							'locks_to_display' => array() // To be filled on LancerVerrous action
						);
					}
					
					for($i = 0; $i < count($frame_data['action_parameters'][0]); $i++)
					{
						$scene['dialogues'][0]['talk_topics'][] = array(
							'id' => $i + 1,
							'title' => $frame_data['action_parameters'][1][$i],
							'start' => getFrameDescriptor($frame_data['action_parameters'][0][$i]),
							'end' => 0,
							'hidden' => intval($frame_data['action_parameters'][2][$i]),
							'icon' => 0
						);
					}
					
					//change the action to the new basic one
					$frame_data['action_name'] = 'DialogueTalk';
					$frame_data['action_parameters'] = array(
						'context' => array(
							'dialogue' => array(
								'scene_type' => 'scenes',
								'scene_id' => $scene['id'],
								'section_type' => 'dialogues',
								'section_id' => 1
							)
						)
					);
					
					break;
			}
			
			break;
		
		case DIALOGUE_TALK :
			
			$scene = &$scenes[count($scenes) - 1];
			
			if($frame_data['id'] == $scene['dialogues'][0]['present'])
			{
				$frame_mode = DIALOGUE_PRESENT;
				
				//conversation if failure
				$scene['dialogues'][0]['present_conversations'][0] = array(
					'elt' => null,
					'start' => getFrameDescriptor($frame_data['action_parameters'][2]),
					'end' => 0
				);
				
				//all successful present conversations
				for($i = 0; $i < count($frame_data['action_parameters'][1]); $i++)
				{
					$scene['dialogues'][0]['present_conversations'][] = array(
						'elt' => getCrEltDescriptor($frame_data['action_parameters'][0][$i], $frame_data['action_parameters'][1][$i]),
						'start' => getFrameDescriptor($frame_data['action_parameters'][3][$i]),
						'end' => 0
					);
				}
				
				//change the action to the new basic one
				$frame_data['action_name'] = 'DialoguePresent';
				$frame_data['action_parameters'] = array(
					'context' => array(
						'dialogue' => array(
							'scene_type' => 'scenes',
							'scene_id' => $scene['id'],
							'section_type' => 'dialogues',
							'section_id' => 1
						)
					)
				);
			
			}
			else
			{
				foreach($scene['dialogues'][0]['talk_topics'] as $talk_topic)
				{
					if($talk_topic['start'] == $frame_data['id'])
					{
						$current_conv_id = $talk_topic['id'];
					}
				}
				
				if($frame_data['action_name'] == 'AllerMessage' AND $frame_data['action_parameters'][0] == $scene['dialogues'][0]['talk'])
				{
					foreach($scene['dialogues'][0]['talk_topics'] as $index => $talk_topic)
					{
						if($talk_topic['id'] == $current_conv_id)
						{
							$scene['dialogues'][0]['talk_topics'][$index]['end'] = $frame_data['id'];
						}
					}
				}
			}
			
			break;
		
		case DIALOGUE_PRESENT :
			
			$scene = &$scenes[count($scenes) - 1];
			
			if($frame_data['id'] == $scene['examinations'][0]['examine'])
			{
				$scene['dialogues'][0]['end'] = $frame_data['id'] - 1;
				$frame_mode = SCENE_EXAMINE;
				
				//insert the failure conv
				$scene['examinations'][0]['examine_conversations'][0] = array(
						'area' => null,
						'start' => getFrameDescriptor($frame_data['action_parameters'][5]),
						'end' => 0
					);
				
				//manage all successful pointings
				for($i = 0; $i < count($frame_data['action_parameters'][1]); $i++)
				{
					$scene['examinations'][0]['examine_conversations'][] = array(
						'area' => 'rect:' . $frame_data['action_parameters'][1][$i] . ','
						. $frame_data['action_parameters'][2][$i] . ','
						. $frame_data['action_parameters'][3][$i] . ','
						. $frame_data['action_parameters'][4][$i],
						'start' => getFrameDescriptor($frame_data['action_parameters'][6][$i]),
						'end' => 0
					);
				}
				
				//change the action to the new basic one
				$frame_data['action_name'] = 'ExaminationExamine';
				$frame_data['action_parameters'] = array(
					'context' => array(
						'examination' => array(
							'scene_type' => 'scenes',
							'scene_id' => $scene['id'],
							'section_type' => 'examinations',
							'section_id' => 1
						)
					)
				);
			}
			else
			{
				foreach($scene['dialogues'][0]['present_conversations'] as $index => $present_conversation)
				{
					if($present_conversation['start'] == $frame_data['id'])
					{
						$current_conv_id = $index;
					}
				}
				
				if($frame_data['action_name'] == 'AllerMessage' AND $frame_data['action_parameters'][0] == $scene['dialogues'][0]['main'])
				{
					$scene['dialogues'][0]['present_conversations'][$current_conv_id]['end'] = $frame_data['id'];
				}
			}
			
			break;
		
		//Additional AA place attributes handling
		case SCENE_EXAMINE :
			
			$scene = &$scenes[count($scenes) - 1];
			
			if($frame_data['action_name'] == 'SeDeplacer')
			{
				$frame_mode = NORMAL_FRAME;
				
				$scene['move'] = $frame_data['id'];
				
				$scene['move_list'] = array();
				for($i = 0; $i < count($frame_data['action_parameters']); $i++)
				{
					$split = explode("_", $frame_data['action_parameters'][$i], 2);
					$scene['move_list'][] = array(
						'scene_type' => 'scenes',
						'scene_id' => $split[0],
						'name_override' => ''
					);
				}
				
				//change the action to the new basic one
				$frame_data['action_name'] = 'SceneMove';
				$frame_data['action_parameters'] = array(
					'context' => array(
						'scene' => array(
							'scene_type' => 'scenes',
							'scene_id' => $scene['id']
						)
					)
				);
			}
			else
			{
				foreach($scene['examinations'][0]['examine_conversations'] as $index => $examine_conversation)
				{
					if($examine_conversation['start'] == $frame_data['id'])
					{
						$current_conv_id = $index;
					}
				}
				
				if($frame_data['action_name'] == 'AllerMessage' AND $frame_data['action_parameters'][0] == $scene['dialogues'][0]['main'])
				{
					$scene['examinations'][0]['examine_conversations'][$current_conv_id]['end'] = $frame_data['id'];
					$scene['examinations'][0]['end'] = max($scene['examinations'][0]['end'], $frame_data['id']);
				}
			}
			
			break;
		
		case LOCKS_CONVERSATIONS :
			
			$scene = &$scenes[count($scenes) - 1];
			$dialogue = &$scene['dialogues'][0];
			$locks = &$dialogue['locks'];
			$dialogue_descriptor = array(
				'scene_type' => 'scenes',
				'scene_id' => $scene['id'],
				'section_type' => 'dialogues',
				'section_id' => 1
			);
			
			
			// Convert actions. FinVerrous action will indicate end of locks conversation.
			switch($frame_data['action_name'])
			{
				case 'DemanderEltVerrous':
					$frame_data['action_name'] = 'AskForEvidence';
					$new_params = array(
						'context' => array(
							'parent_dialogue' => $dialogue_descriptor,
							'in_locks' => 'true'
						),
						'global' => array(
							'locks_show_return' => 'true',
							'type_lock' => 'all',
							'failure_dest' => getFrameDescriptor($frame_data['action_parameters'][2])
						),
						'multiple' => array(
							'element' => array()
						)
					);
					
					for($i = 0; $i < count($frame_data['action_parameters'][0]); $i++)
					{
						//Go through all accepted elements
						$new_params['multiple']['element'][] = array(
							'element_desc' => getCrEltDescriptor($frame_data['action_parameters'][0][$i], $frame_data['action_parameters'][1][$i]),
							'element_dest' => getFrameDescriptor($frame_data['action_parameters'][3])
						);
					}
					
					$frame_data['action_parameters'] = $new_params;
					break;
				
				case 'afficherVerrous':
					$frame_data['action_name'] = 'LocksShow';
					$frame_data['action_parameters'] = array(
						'context' => array(
							'parent_dialogue' => $dialogue_descriptor
						)
					);
					
					break;
				
				case 'briserVerrou':
					$frame_data['action_name'] = 'LocksBreak';
					$frame_data['action_parameters'] = array(
						'context' => array(
							'parent_dialogue' => $dialogue_descriptor
						),
						'multiple' => array(
							'lock' => array(
								array(
									'lock_desc' => array(
										'scene_type' => $dialogue_descriptor['scene_type'],
										'scene_id' => $dialogue_descriptor['scene_id'],
										'section_type' => $dialogue_descriptor['section_type'],
										'section_id' => $dialogue_descriptor['section_id'],
										'lock_id' => 0 // Auto mode : first non-broken lock
									)
								)
							)
						)
					);
					break;
				
				case 'FinVerrous':
					// End of the locks block
					$locks['end'] = $dialogue['end'] = $frame_data['id'];
					$frame_mode = NORMAL_FRAME;
					
					$frame_data['action_name'] = 'LocksEnd';
					$frame_data['action_parameters'] = array(
						'context' => array(
							'parent_dialogue' => array(
								'scene_type' => 'scenes',
								'scene_id' => $scene['id'],
								'section_type' => 'dialogues',
								'section_id' => 1
							)
						)
					);
					
					$frame_data['wait_time'] = 1;
					break;
			}
			
			// If reaching the end of the scene without a LocksEnd action...
			// (this happens in locks conversations without a single key statement)
			if($frame_data['id'] == $scene['end'] AND $frame_data['action_name'] != 'LocksEnd') {
				// Resume normal flow (LocksEnd action frame will be introduced by fixStructure later).
				$locks['end'] = $dialogue['end'] = $frame_data['id'];
				$frame_mode = NORMAL_FRAME;
			}
			
			break;
			
		/*
		END OF PLACE STRUCTURE HANDLING
		BEGIN CE STRUCTURE HANDLING
		*/
		
		case CE_STARTED :
			
			$ce_id = end($cross_examinations);
			$ce_id = $ce_id['id'];
			
			if($frame_data['action_name'] == 'pauseCI')
			{
				$frame_mode = CE_COCOUNCIL;
				
				$cross_examinations[$ce_id]['cocouncil_start'] = $frame_data['id'];
			}
			else
			{
				//Contradictions were previously saved at CE properties in CE start frame.
				//Import them as statement property.
				$contradictions = array();
				
				if(isset($cross_examinations[$ce_id]['contradictions']))
				{
					//Check that the array of contradictions exists : if it doesn't, it was already emptied previously.
					$ce_contrad_empty = true;
					foreach($cross_examinations[$ce_id]['contradictions'] as $index => $contradiction)
					{
						if($contradiction)
						{
							//Only consider non null contradictions
							if($contradiction['contrad_frame'] == $frame_data['id'])
							{
								//Copy contrad data to the statement if it matches
								$contradictions[] = array(
									'contrad_elt' => $contradiction['contrad_elt'],
									'destination' => $contradiction['destination']
								);
								
								//Remove the CE contrad property
								$cross_examinations[$ce_id]['contradictions'][$index] = null;
							}
							else
							{
								//Found another non null contrad : not empty
								$ce_contrad_empty = false;
							}
						}
					}
					//If the array of CE contradictions is empty, all have been transferred : remove it.
					if($ce_contrad_empty)
					{
						unset($cross_examinations[$ce_id]['contradictions']);
					}
				}
				
				$cross_examinations[$ce_id]['statements'][] = array(
					'id' => $frame_data['id'],
					
					'contradictions' => $contradictions,
					
					'pressing_conv_start' => 0,
					'pressing_conv_end' => 0,
					
					'optional_conv_start' => 0,
					'optional_conv_end' => 0
				);
				
				if($frame_data['action_name'] == 'AllerCI')
				{
					$statement_pos = count($cross_examinations[$ce_id]['statements']) - 1;
					$cross_examinations[$ce_id]['statements'][$statement_pos]['pressing_conv_start'] = getFrameDescriptor($frame_data['action_parameters'][0]);
					$last_statement_with_press = $statement_pos;
				}
				
				// CE statement action is generic and refers to statement properties
				$frame_data['action_name'] = 'CEStatement';
				$frame_data['action_parameters'] = array(
					'context' => array(
						'statement_desc' => array(
							'ce_id' => $ce_id,
							'statement_id' => $frame_data['id']
						)
					)
				);
			}
			break;
			
		case CE_COCOUNCIL :
			
			if($frame_data['action_name'] == 'RetourCI')
			{
				$ce_id = end($cross_examinations);
				$ce_id = $ce_id['id'];
				
				$cross_examinations[$ce_id]['cocouncil_end'] = $frame_data['id'];
				
				if($last_statement_with_press == -1)
				{
					if($cross_examinations[$ce_id]['failure_conv_start'] == 0)
					{
						$frame_mode = NORMAL_FRAME;
						$cross_examinations[$ce_id]['end'] = $frame_data['id'];
					}
					else
					{
						$frame_mode = CE_FAILURE_CONV;
					}
				}
				else
				{
					$frame_mode = CE_PRESSING;
				}
				
				// Update action to return to beginning of CE
				$frame_data['action_name'] = 'CERestart';
				$frame_data['action_parameters'] = array(
					'context' => array(
						'ce_desc' => $ce_id
					)
				);
				// Auto skip frame
				$frame_data['wait_time'] = 1;
			}
			
			break;
		
		case CE_PRESSING :
			
			$ce_id = end($cross_examinations);
			$ce_id = $ce_id['id'];
			
			if($frame_data['action_name'] == 'pauseCI')
			{
				foreach($cross_examinations[$ce_id]['statements'] as $pos => $statement)
				{
					if($statement['pressing_conv_start'] == $frame_data['id'])
					{
						$source_statement = $pos;
					}
				}
			
				$current_pressing_cv = $source_statement;
			}
			elseif($frame_data['action_name'] == 'RetourCI')
			{
				$cross_examinations[$ce_id]['statements'][$current_pressing_cv]['pressing_conv_end'] = $frame_data['id'];
				
				if($current_pressing_cv == $last_statement_with_press)
				{
					if($cross_examinations[$ce_id]['failure_conv_start'] == 0)
					{
						$frame_mode = NORMAL_FRAME;
						$cross_examinations[$ce_id]['end'] = $frame_data['id'];
					}
					else
					{
						$frame_mode = CE_FAILURE_CONV;
					}
				}
				
				// Update action to return to next statement
				$frame_data['action_name'] = 'CEReturnAfter';
				$frame_data['action_parameters'] = array(
					'context' => array(
						'statement_desc' => array(
							'ce_id' => $ce_id,
							'statement_id' => $cross_examinations[$ce_id]['statements'][$current_pressing_cv]['id']
						)
					)
				);
				// Auto skip frame
				$frame_data['wait_time'] = 1;
			}
			
			break;
		
		case CE_FAILURE_CONV :
			
			if($frame_data['action_name'] == 'RetourCI')
			{
				$ce_id = end($cross_examinations);
				$ce_id = $ce_id['id'];
				
				$frame_mode = NORMAL_FRAME;
				$cross_examinations[$ce_id]['failure_conv_end'] = $frame_data['id'];
				$cross_examinations[$ce_id]['end'] = $frame_data['id'];
				
				// Update action to return to beginning of CE
				$frame_data['action_name'] = 'CERestart';
				$frame_data['action_parameters'] = array(
					'context' => array(
						'ce_desc' => $ce_id
					)
				);
				// Auto skip frame
				$frame_data['wait_time'] = 1;
			}
			
			break;
		/*
		END OF CE STRUCTURE HANDLING
		*/
	}
}

//Get the ID of a new frame to be inserted
function getNewFrameId($trial_data)
{
	static $last_id = 0;
	
	if($last_id == 0)
	{
		for($i = 1; $i < count($trial_data['frames']); $i++)
		{
			$last_id = max($last_id, $trial_data['frames'][$i]['id']);
		}
	}
	
	$last_id++;
	
	return $last_id;
}

//Create an empty frame and insert it at a given index
function createAndInsertFrame(&$trial_data, $index)
{
	$new_frame = array(
		'id' => getNewFrameId($trial_data),
		'speaker_name' => "",
		'speaker_use_name' => 0,
		'speaker_id' => PROFILE_EMPTY,
		'sound' => SOUND_NONE,
		'music' => MUSIC_UNCHANGED,
		'place' => PLACE_NONE,
		'place_position' => -1,
		'characters' => array(),
		'characters_erase_previous' => 0,
		'popups' => array(),
		'action_name' => "",
		'action_parameters' => array(),
		'text_colour' => "white",
		'text_content' => "",
		'text_speed' => 1,
		'hidden' => 0,
		'wait_time' => 1,
		'merged_to_next' => 0
	);
	
	array_splice($trial_data['frames'], $index, 0, array($new_frame));
	
	return $new_frame;
}

function getFrameIndexById($trial_data, $frame_id)
{
	$nb_frames = count($trial_data['frames']) - 1;
	
	if(isset($trial_data['frames'][$frame_id]) AND $trial_data['frames'][$frame_id]['id'] == $frame_id)
	{
		return $frame_id;
	}
	else
	{
		for($i = $frame_id + 1; $i != $frame_id; $i = ($i % $nb_frames) + 1)
		{
			if($trial_data['frames'][$i]['id'] == $frame_id)
			{
				return $i;
			}
		}
	}
}

//Move an interval of frames to a new position
function moveFrames(&$trial_data, $start, $end, $target)
{
	$moved_frames = array_splice($trial_data['frames'], $start, 1 + $end - $start);
	array_splice($trial_data['frames'], $target, 0, $moved_frames);
}

//Fix structure by adding frames/moving frames around
function fixStructure(&$trial_data)
{
	//Fix the structure of investigation scenes
	for($i = count($trial_data['scenes']) - 1; $i >= 1; $i--)
	{
		$scene = &$trial_data['scenes'][$i];
		
		//Fix examination blocks
		for($j = count($scene['examinations']) - 1; $j >= 0; $j--)
		{
			$examination = &$scene['examinations'][$j];
			
			$target_index = end($examination['examine_conversations']);
			$target_index = $target_index['end'] + 1;
			
			//Add examination end frame
			$new_frame_end = createAndInsertFrame($trial_data, $target_index);
			$examination['end'] = $new_frame_end['id'];
			
			//Add wrong deduction conversation
			$new_frame_after = createAndInsertFrame($trial_data, $target_index);
			$new_frame_before = createAndInsertFrame($trial_data, $target_index);
			// With return action
			$new_frame_after['action_name'] = 'GoTo';
			$new_frame_after['action_parameters'] = array(
				'global' => array(
					'target' => $examination['examine']
				)
			);
			
			$examination['deduce_conversations'][] = array(
				'start' => $new_frame_before['id'],
				'end' => $new_frame_after['id'],
				'area_def' => null,
				'elt' => null
			);
			
			//Add invisible starting frame to examine conversations
			for($k = count($examination['examine_conversations']) - 1; $k >= 0; $k--)
			{
				$examine_conversation = &$examination['examine_conversations'][$k];
				
				$new_frame = createAndInsertFrame($trial_data, $examine_conversation['start']);
				
				$examine_conversation['start'] = $new_frame['id'];
			}
		}
		
		//Fix dialogue blocks
		for($j = count($scene['dialogues']) - 1; $j >= 0; $j--)
		{
			$dialogue = &$scene['dialogues'][$j];
			
			$target_index = end($dialogue['present_conversations']);
			$target_index = $target_index['end'] + 1;
			
			//Add dialogue end frame
			$new_frame_end = createAndInsertFrame($trial_data, $target_index);
			$dialogue['end'] = $new_frame_end['id'];
			
			//Add invisible starting frame to present conversations
			for($k = count($dialogue['present_conversations']) - 1; $k >= 0; $k--)
			{
				$present_conversation = &$dialogue['present_conversations'][$k];
				
				$new_frame = createAndInsertFrame($trial_data, $present_conversation['start']);
				
				$present_conversation['start'] = $new_frame['id'];
			}
			
			//Add invisible starting frame to talk topics
			for($k = count($dialogue['talk_topics']) - 1; $k >= 0; $k--)
			{
				$talk_topic = &$dialogue['talk_topics'][$k];
				
				$new_frame = createAndInsertFrame($trial_data, $talk_topic['start']);
				
				$talk_topic['start'] = $new_frame['id'];
			}
			
			//Handle messed up psyche locks structure
			if($dialogue['locks'] != null)
			{
				// Insert frame with LocksEnd action if necessary.
				$last_locks_frame_index = getFrameIndexById($trial_data, $dialogue['locks']['end']);
				$last_locks_frame = $trial_data['frames'][$last_locks_frame_index];
				if($last_locks_frame['action_name'] != 'LocksEnd')
				{
					$new_frame = createAndInsertFrame($trial_data, $last_locks_frame_index + 1);
					
					$new_frame['action_name'] = 'LocksEnd';
					$new_frame['action_parameters'] = array(
						'context' => array(
							'parent_dialogue' => array(
								'scene_type' => 'scenes',
								'scene_id' => $scene['id'],
								'section_type' => 'dialogues',
								'section_id' => 1
							)
						)
					);
					$new_frame['wait_time'] = 1;
					
					$dialogue['locks']['end'] = $dialogue['end'] = $new_frame['id'];
				}
				
				//Move locks back into dialogue block
				moveFrames($trial_data, 
					getFrameIndexById($trial_data, $dialogue['locks']['start']), 
					getFrameIndexById($trial_data, $dialogue['locks']['end']), 
					getFrameIndexById($trial_data, $new_frame_end['id'])
				);
			}
		}
		
		// Fix scene end, always the move frame once the locks have been moved into the dialogue.
		$scene['end'] = $scene['move'];
	}
}

// Prepend "val=" to all parameters that are not xpr=.
function updateParametersType(&$params)
{
	foreach($params as &$value)
	{
		if(is_array($value))
		{
			updateParametersType($value);
		}
		elseif(strpos($value, 'xpr=') !== 0)
		{
			$value = 'val=' . $value;
		}
	}
}

function convertActions(&$frame_data, $trial_id, $parent_sequence)
{
	switch($frame_data['action_name'])
	{
		//Court records manipulation
		
		case 'AfficherElement' :
			$frame_data['action_name'] = 'DisplayElements';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'element' => array(
						array(
							'element_desc' => getCrEltDescriptor($frame_data['action_parameters'][0], $frame_data['action_parameters'][1]),
							'position' => 'auto'
						)
					)
				)
			);
			break;
		
		case 'DevoilerElement' : 
			$frame_data['action_name'] = 'RevealElements';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'element' => array(
						array(
							'element_desc' => getCrEltDescriptor($frame_data['action_parameters'][0], $frame_data['action_parameters'][1])
						)
					)
				)
			);
			break;
		
		case 'MasquerElement' : 
			$frame_data['action_name'] = 'HideElements';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'element' => array(
						array(
							'element_desc' => getCrEltDescriptor($frame_data['action_parameters'][0], $frame_data['action_parameters'][1])
						)
					)
				)
			);
			break;
		
		case 'DevoilerElements' : 
			$frame_data['action_name'] = 'RevealElements';
			$new_params = array(
				'multiple' => array(
					'element' => array()
				)
			);
			
			foreach($frame_data['action_parameters'][0] as $index => $param_val)
			{
				$new_params['multiple']['element'][] = array(
					'element_desc' => getCrEltDescriptor($frame_data['action_parameters'][0][$index], 
						$frame_data['action_parameters'][1][$index])
				);
			}
			
			$frame_data['action_parameters'] = $new_params;
			break;
		
		case 'MasquerElements' : 
			$frame_data['action_name'] = 'HideElements';
			$new_params = array(
				'multiple' => array(
					'element' => array()
				)
			);
			
			foreach($frame_data['action_parameters'][0] as $index => $param_val)
			{
				$new_params['multiple']['element'][] = array(
					'element_desc' => getCrEltDescriptor($frame_data['action_parameters'][0][$index], 
						$frame_data['action_parameters'][1][$index])
				);
			}
			
			$frame_data['action_parameters'] = $new_params;
			break;
		
		//Game flow
		
		case 'AllerMessage' :
			$frame_data['action_name'] = 'GoTo';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'target' => getFrameDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
		
		case 'ReglerGameOver' :
			$frame_data['action_name'] = 'SetGameOver';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'target' => getFrameDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
		
		case 'AjouterCI' : 
			$frame_data['action_name'] = 'RevealFrame';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'frame' => array(
						array(
							'target' => getFrameDescriptor($frame_data['action_parameters'][0])
						)
					)
				)
			);
			break;
		
		case 'MasquerMessage' : 
			$frame_data['action_name'] = 'HideFrame';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'frame' => array(
						array(
							'target' => getFrameDescriptor($frame_data['action_parameters'][0])
						)
					)
				)
			);
			break;
		
		//CE Game flow
		
		case 'pauseCI' :
			$frame_data['action_name'] = 'CEPause';
			$frame_data['action_parameters'] = array();
			break;
		
		//Scene game flow
		case 'DevoilerLieu' :
			$frame_data['action_name'] = 'RevealScene';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
			
		case 'MasquerLieu' :
			$frame_data['action_name'] = 'HideScene';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
		
		case 'DevoilerIntroLieu' : 
			$frame_data['action_name'] = 'RevealDialogueIntro';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0]),
					'dialogue' => getDialogueDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
		
		case 'MasquerIntroLieu' : 
			$frame_data['action_name'] = 'HideDialogueIntro';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0]),
					'dialogue' => getDialogueDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
		
		case 'DevoilerVerrousLieu' : 
			$frame_data['action_name'] = 'RevealDialogueLocks';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0]),
					'dialogue' => getDialogueDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
		
		case 'MasquerVerrousLieu' : 
			$frame_data['action_name'] = 'HideDialogueLocks';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0]),
					'dialogue' => getDialogueDescriptor($frame_data['action_parameters'][0])
				)
			);
			break;
			
		case 'DevoilerConversation' : 
			$frame_data['action_name'] = 'RevealTalkTopic';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0]),
					'dialogue' => getDialogueDescriptor($frame_data['action_parameters'][0]),
					'talk_topic' => getTalkTopicDescriptor($frame_data['action_parameters'][0], $frame_data['action_parameters'][1])
				)
			);
			break;
		
		case 'MasquerConversation' :
			$frame_data['action_name'] = 'HideTalkTopic';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'scene' => getSceneDescriptor($frame_data['action_parameters'][0]),
					'dialogue' => getDialogueDescriptor($frame_data['action_parameters'][0]),
					'talk_topic' => getTalkTopicDescriptor($frame_data['action_parameters'][0], $frame_data['action_parameters'][1])
				)
			);
			break;
		
		//Health points
		case 'PerteVie' : 
			$points = intval($frame_data['action_parameters'][0]);
			if($points >= 0)
			{
				$frame_data['action_name'] = 'ReduceHealth';
				$frame_data['action_parameters'] = array(
					'global' => array(
						'points' => $points
					)
				);
			}
			else
			{
				$frame_data['action_name'] = 'IncreaseHealth';
				$frame_data['action_parameters'] = array(
					'global' => array(
						'points' =>  - $points
					)
				);
			}
			break;
		
		case 'ReglerVie' :
			$frame_data['action_name'] = 'SetHealth';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'points' => max(0, intval($frame_data['action_parameters'][0]))
				)
			);
			break;
		
		case 'FaireClignoterVie' :
			$frame_data['action_name'] = 'FlashHealth';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'points' => max(0, intval($frame_data['action_parameters'][0]))
				)
			);
			break;
		
		case 'FinDuJeu' :
			$frame_data['action_name'] = 'GameOver';
			$action = isset($frame_data['action_parameters'][0]) ? $frame_data['action_parameters'][0] : 0;
			switch($action)
			{
				case 0:
					$frame_data['action_parameters'] = array(
						'global' => array(
							'action' => 0
						)
					);
					break;
				
				case 1:
					$frame_data['action_parameters'] = array(
						'global' => array(
							'action' => 2,
							'target_part' => getTargetPartDescriptorFromId($trial_id, $parent_sequence, 1),
							'target_frame' => isset($frame_data['action_parameters'][2]) ? $frame_data['action_parameters'][2] : 0,
							'data_transfer' => isset($frame_data['action_parameters'][3]) ? $frame_data['action_parameters'][3] : 0
						)
					);
					break;
				
				case 2:
					$frame_data['action_parameters'] = array(
						'global' => array(
							'action' => 2,
							'target_part' => isset($frame_data['action_parameters'][1]) ? getTargetPartDescriptor($frame_data['action_parameters'][1], $parent_sequence) : 0,
							'target_frame' => isset($frame_data['action_parameters'][2]) ? $frame_data['action_parameters'][2] : 0,
							'data_transfer' => isset($frame_data['action_parameters'][3]) ? $frame_data['action_parameters'][3] : 0
						)
					);
					break;
			}
			break;
		
		//User input
		case 'ChoixEntre2' :
			$frame_data['action_name'] = 'MultipleChoices';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'answer' => array(
						array(
							'answer_text' => $frame_data['action_parameters'][0],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][2])
						),
						array(
							'answer_text' => $frame_data['action_parameters'][1],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][3])
						)
					)
				)
			);
			break;
		
		case 'RepondreQuestion' :
			$frame_data['action_name'] = 'MultipleChoices';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'answer' => array(
						array(
							'answer_text' => $frame_data['action_parameters'][0],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][3])
						),
						array(
							'answer_text' => $frame_data['action_parameters'][1],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][4])
						),
						array(
							'answer_text' => $frame_data['action_parameters'][2],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][5])
						)
					)
				)
			);
			break;
		
		case 'ChoixEntre4' :
			$frame_data['action_name'] = 'MultipleChoices';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'answer' => array(
						array(
							'answer_text' => $frame_data['action_parameters'][0],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][4])
						),
						array(
							'answer_text' => $frame_data['action_parameters'][1],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][5])
						),
						array(
							'answer_text' => $frame_data['action_parameters'][2],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][6])
						),
						array(
							'answer_text' => $frame_data['action_parameters'][3],
							'answer_dest' => getFrameDescriptor($frame_data['action_parameters'][7])
						)
					)
				)
			);
			break;
		
		case 'DemanderPreuve' :
			$frame_data['action_name'] = 'AskForEvidence';
			$new_params = array(
				'global' => array(
					'type_lock' => 
						(!isset($frame_data['action_parameters'][4]) ? 'all' :
						($frame_data['action_parameters'][4] == 'profils' ? 'profiles' :
						($frame_data['action_parameters'][4] == 'preuves' ? 'evidence' :
						'all'))),
					'failure_dest' => getFrameDescriptor($frame_data['action_parameters'][2])
				),
				'multiple' => array(
					'element' => array()
				)
			);
			
			for($i = 0; $i < count($frame_data['action_parameters'][0]); $i++)
			{
				$new_params['multiple']['element'][] = array(
					'element_desc' => getCrEltDescriptor($frame_data['action_parameters'][0][$i], 
						$frame_data['action_parameters'][1][$i]),
					'element_dest' => getFrameDescriptor($frame_data['action_parameters'][3][$i])
				);
			}
			
			$frame_data['action_parameters'] = $new_params;
			break;
		
		case 'PointerImage' :
			$frame_data['action_name'] = 'PointArea';
			
			$new_params = array(
				'global' => array(
					'background' => $frame_data['action_parameters'][0],
					'failure_dest' => (isset($frame_data['action_parameters'][5]) && $frame_data['action_parameters'][5] != -1) ? getFrameDescriptor($frame_data['action_parameters'][5]) : null
				),
				'multiple' => array(
					'area' => array()
				)
			);
			
			for($i=0; $i < count($frame_data['action_parameters'][1]); $i ++)
			{
				$destination = isset($frame_data['action_parameters'][6]) ? $frame_data['action_parameters'][6][$i] : $frame_data['id'] + 1;
				$new_params['multiple']['area'][] = array(
					'area_def' => 'rect:' . $frame_data['action_parameters'][1][$i] . ','
						. $frame_data['action_parameters'][2][$i] . ','
						. $frame_data['action_parameters'][3][$i] . ','
						. $frame_data['action_parameters'][4][$i],
					'area_dest' => getFrameDescriptor($destination)
				);
			}
			
			$frame_data['action_parameters'] = $new_params;
			break;
		
		//Variable management
		case 'InputVar' :
			$var_type = '';
			switch($frame_data['action_parameters'][1])
			{
				case 'nb':
					$var_type = 'float';
					break;
					
				case 'chaine':
					$var_type = 'string';
					break;
				
				case 'mot':
					$var_type = 'word';
					break;
				
				default:
					$var_type = $frame_data['action_parameters'][1];
			}
			
			$frame_data['action_name'] = 'InputVars';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'variable' => array(
						array(
							'var_name' => $frame_data['action_parameters'][0],
							'var_type' => $var_type,
							'var_password' => $frame_data['action_parameters'][2]
						)
					)
				)
			);
			break;
		
		case 'DefinirVar' :
			$frame_data['action_name'] = 'DefineVars';
			$frame_data['action_parameters'] = array(
				'multiple' => array(
					'variable' => array(
						array(
							'var_name' => $frame_data['action_parameters'][0],
							'var_value' => $frame_data['action_parameters'][1]
						)
					)
				)
			);
			break;
		
		case 'TesterVar' :
			$frame_data['action_name'] = 'TestExprValue';
			
			if(strpos($frame_data['action_parameters'][0], 'xpr=') === 0)
			{
				//Loading an expression
				$new_params = array(
					'global' => array(
						'expr_type' => 'expression',
						'expression' => substr($frame_data['action_parameters'][0], 4),
						'failure_dest' => getFrameDescriptor($frame_data['action_parameters'][3])
					),
					'multiple' => array(
						'values' => array()
					)
				);
			}
			else
			{
				//Loading a variable
				$new_params = array(
					'global' => array(
						'expr_type' => 'var_name',
						'var_name' => $frame_data['action_parameters'][0],
						'failure_dest' => getFrameDescriptor($frame_data['action_parameters'][3])
					),
					'multiple' => array(
						'values' => array()
					)
				);
			}
			
			for($i = 0; $i < count($frame_data['action_parameters'][1]); $i++)
			{
				$new_params['multiple']['values'][] = array(
					'value' => $frame_data['action_parameters'][1][$i],
					'value_dest' => getFrameDescriptor($frame_data['action_parameters'][2][$i])
				);
			}
			
			$frame_data['action_parameters'] = $new_params;
			break;
		
		case 'EvaluerCondition' :
			$frame_data['action_name'] = 'EvaluateConditions';
			$frame_data['action_parameters'] = array(
				'global' => array(
					'failure_dest' => $frame_data['action_parameters'][2]
				),
				'multiple' => array(
					'condition' => array(
						array(
							'expression' => preg_replace('#^xpr=#', '', $frame_data['action_parameters'][0]), // Here, if there was an xpr tag, it's a mistake : V5 didn't support defining an expression by another expression
							'cond_dest' => $frame_data['action_parameters'][1]
						)
					)
				)
			);
			break;
		
		case '' :
			// If no action, only enforce no parameters.
			$frame_data['action_parameters'] = array();
			break;
		
		default :
			// If there is an action but it was not matched...
			
			// Make sure action is not a V6 one already converted for some reason.
			$action_desc = getActionParametersType($frame_data['action_name']);
			if($action_desc == null)
			{
				// If action really does not exist, remove it.
				$frame_data['action_name'] = '';
				$frame_data['action_parameters'] = array();
			}
			
			break;
	}
	
	updateParametersType($frame_data['action_parameters']);
}

function convertLegacyPlace($background_url)
{
	switch($background_url)
	{
		case 'salle_d_audience/salledattente' :
			return array(PLACE_PW_LOBBY, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/salle_agitee.gif' :
			return array(PLACE_PW_COURT_AGITATED, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/salle_immobile' :
			return array(PLACE_PW_COURT_STILL, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/place_juge' :
			return array(PLACE_PW_JUDGE, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/banc_defense' :
			return array(PLACE_PW_COURTROOM, POSITION_LEFTALIGN);
			break;
		
		case 'salle_d_audience/banc_temoin' :
			return array(PLACE_PW_COURTROOM, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/banc_accusation' :
			return array(PLACE_PW_COURTROOM, POSITION_RIGHTALIGN);
			break;
		
		case 'salle_d_audience/conseil_defense' :
			return array(PLACE_PW_COCOUNCIL, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/salledattente_aa4' :
			return array(PLACE_AJ_LOBBY, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/salle_agitee_aa4.gif' :
			return array(PLACE_AJ_COURT_AGITATED, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/salle_immobile_aa4' :
			return array(PLACE_AJ_COURT_STILL, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/place_juge_aa4' :
			return array(PLACE_AJ_JUDGE, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/banc_defense_aa4' :
			return array(PLACE_AJ_COURTROOM, POSITION_LEFTALIGN);
			break;
		
		case 'salle_d_audience/banc_temoin_aa4' :
			return array(PLACE_AJ_COURTROOM, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/banc_accusation_aa4' :
			return array(PLACE_AJ_COURTROOM, POSITION_RIGHTALIGN);
			break;
		
		case 'salle_d_audience/conseil_defense_aa4' :
			return array(PLACE_AJ_COCOUNCIL, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/marteau.gif' :
			return array(PLACE_PW_HAMMER, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/marteauTriple.gif' :
			return array(PLACE_PW_HAMMER_TRIPLE, POSITION_CENTER);
			break;
		
		case 'salle_d_audience/fond_defilant_defense.gif' :
			return array(PLACE_PW_SCROLLING_DEFENSE, POSITION_LEFTALIGN);
			break;
		
		case 'salle_d_audience/fond_defilant_accusation.gif' :
			return array(PLACE_PW_SCROLLING_PROSECUTION, POSITION_RIGHTALIGN);
			break;
		
		case 'cinematiques/Ace Attorney 1/ParloirDerriere' :
			return array(PLACE_PW_DETENTION_CENTER_BEHIND, POSITION_CENTER);
			break;
		
		case 'cinematiques/Ace Attorney 1/Parloir' :
			return array(PLACE_PW_DETENTION_CENTER_AHEAD, POSITION_CENTER);
			break;
		
		case 'cinematiques/Ace Attorney 4/ParloirDerriere' :
			return array(PLACE_AJ_DETENTION_CENTER_BEHIND, POSITION_CENTER);
			break;
		
		case 'cinematiques/Ace Attorney 4/Parloir' :
			return array(PLACE_AJ_DETENTION_CENTER_AHEAD, POSITION_CENTER);
			break;
		
		default :
			return array(0, 0);
			break;
	}
}

function getIntOrXpr($val)
{
	if(substr($val, 0, 4) === 'xpr=')
	{
		return $val;
	}
	else
	{
		return intval($val);
	}
}

function getCrEltDescriptor($type, $id)
{
	return array(
		'type' => ($type == 'profil' ? 'profiles' : 'evidence'),
		'id' => getIntOrXpr($id)
	);
}

function getSceneDescriptor($id)
{
	return array(
		'scene_type' => 'scenes',
		'scene_id' => getIntOrXpr($id)
	);
}

function getDialogueDescriptor($id)
{
	return array(
		'scene_type' => 'scenes',
		'scene_id' => getIntOrXpr($id),
		'section_type' => 'dialogues',
		'section_id' => 1
	);
}

function getTalkTopicDescriptor($scene_id, $topic_id)
{
	return array(
		'scene_type' => 'scenes',
		'scene_id' => getIntOrXpr($scene_id),
		'section_type' => 'dialogues',
		'section_id' => 1,
		'conv_type' => 'talk_topics',
		'conv_id' => getIntOrXpr($topic_id)
	);
}

function getFrameDescriptor($id)
{
	return getIntOrXpr($id);
}

function getTargetPartDescriptor($target_position, $parent_sequence)
{
	if($parent_sequence === null)
	{
		return 0;
	}
	else
	{
		return $parent_sequence->getIdOfEltAt($target_position);
	}
}

function getTargetPartDescriptorFromId($target, $parent_sequence, $shift)
{
	if($parent_sequence === null)
	{
		$trial_pos = 0;
	}
	elseif($parent_sequence instanceof TrialSequenceHandlerV5)
	{
		$trial_pos = $parent_sequence->getDbPositionOf($target);
	}
	else
	{
		$trial_pos = $parent_sequence->getPositionOf($target);
	}
	
	return getTargetPartDescriptor($trial_pos + $shift, $parent_sequence);
}

?>
