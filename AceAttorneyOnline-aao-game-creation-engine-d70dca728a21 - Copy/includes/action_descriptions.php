<?php

function getActionParametersType($action_name, $language='PHP')
{
	static $action_parameters = array();
	
	if(empty($action_parameters))
	{
		//Court records manipulation
		$action_parameters['CourtRecords'] = array();
		$action_parameters['CourtRecords']['DisplayElements'] = array(
			'multiple' => array(
				'element' => array(
					'element_desc' => array(
						'type' => 'cr_element_descriptor'
					),
					'position' => array(
						'type' => 'select',
						'values' => array(
							'auto' => array(
								'name' => 'auto'
							),
							'topright' => array(
								'name' => 'topright'
							),
							'topleft' => array(
								'name' => 'topleft'
							),
							'bottomright' => array(
								'name' => 'bottomright'
							),
							'bottomleft' => array(
								'name' => 'bottomleft'
							)
						)
					)
				)
			)
		);

		$action_parameters['CourtRecords']['RevealElements'] = $action_parameters['CourtRecords']['HideElements'] = array(
			'multiple' => array(
				'element' => array(
					'element_desc' => array(
						'type' => 'cr_element_descriptor'
					)
				)
			)
		);
		
		//Game flow
		$action_parameters['GameFlow'] = array();
		$action_parameters['GameFlow']['GoTo'] = $action_parameters['GameFlow']['SetGameOver'] = array(
			'context' => array( // Action not available for merged frames
				'not_merged' => array(
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'target' => array(
					'type' => 'frame_descriptor'
				)
			)
		);
		
		$action_parameters['GameFlow']['RevealFrame'] = $action_parameters['GameFlow']['HideFrame'] = array(
			'multiple' => array(
				'frame' => array(
					'target' => array(
						'type' => 'frame_descriptor'
					)
				)
			)
		);
		
		$action_parameters['GameFlow']['GameOver'] = array(
			'context' => array( // Action not available for merged frames
				'not_merged' => array(
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'action' => array(
					'type' => 'select',
					'values' => array(
						0 => array(
							'name' => 'GameOver_nothing'
						),
						1 => array(
							'name' => 'GameOver_next'
						),
						2 => array(
							'name' => 'GameOver_other'
						),
					)
				),
				'target_part' => array(
					'precondition' => "action = 2",
					'type' => 'trial_part_descriptor'
				),
				'target_frame' => array(
					'precondition' => "action = 2",
					'type' => 'natural'
				),
				'data_transfer' => array(
					'precondition' => "action ! 0",
					'type' => 'select',
					'values' => array(
						0 => array(
							'name' => 'GameOverData_nothing'
						),
						1 => array(
							'name' => 'GameOverData_vars'
						),
						2 => array(
							'name' => 'GameOverData_full'
						),
					)
				)
			)
		);
		
		$action_parameters['GameFlow']['CEStart'] = $action_parameters['GameFlow']['CEPause'] = array(
			'context' => array( // Private action, not to be shown to the user
				'out_of_editor' => array(
					'type' => 'boolean',
					'required' => true
				)
			)
		);
		
		$action_parameters['GameFlow']['CERestart'] = array(
			'context' => array( // Private action, not to be shown to the user
				'out_of_editor' => array(
					'type' => 'boolean',
					'required' => true
				),
				'not_merged' => array( // Action not available for merged frames
					'type' => 'boolean',
					'required' => true
				),
				'ce_desc' => array(
					'type' => 'ce_descriptor',
					'required' => true
				)
			)
		);
		
		$action_parameters['GameFlow']['CEStatement'] = $action_parameters['GameFlow']['CEReturnAfter'] = array(
			'context' => array( // Private action, not to be shown to the user
				'out_of_editor' => array(
					'type' => 'boolean',
					'required' => true
				),
				'not_merged' => array( // Action not available for merged frames
					'type' => 'boolean',
					'required' => true
				),
				'statement_desc' => array(
					'type' => 'statement_descriptor',
					'required' => true
				)
			)
		);
		
		$action_parameters['GameFlow']['SceneStart'] = 
		$action_parameters['GameFlow']['SceneMove'] = array(
			'context' => array(
				'out_of_editor' => array(
					'type' => 'boolean',
					'required' => true
				),
				'scene' => array(
					'type' => 'scene_descriptor',
					'required' => true
				)
			)
		);
		
		$action_parameters['GameFlow']['DialogueMenu'] = 
		$action_parameters['GameFlow']['DialogueTalk'] = 
		$action_parameters['GameFlow']['DialoguePresent'] = array(
			'context' => array(
				'out_of_editor' => array(
					'type' => 'boolean',
					'required' => true
				),
				'dialogue' => array(
					'type' => 'dialogue_descriptor',
					'required' => true
				)
			)
		);
		
		$action_parameters['GameFlow']['ExaminationExamine'] = array(
			'context' => array(
				'out_of_editor' => array(
					'type' => 'boolean',
					'required' => true
				),
				'examination' => array(
					'type' => 'examination_descriptor',
					'required' => true
				)
			)
		);
		
		//Edit game environment
		$action_parameters['EditEnvironment']['RevealObject'] = $action_parameters['EditEnvironment']['HideObject'] = array(
			'multiple' => array(
				'object' => array(
					'place_desc' => array(
						'type' => 'place_descriptor'
					),
					'object_desc' => array(
						'type' => 'object_descriptor',
						'type_param' => array(
							'place_descriptor' => array(
								'type' => 'var', 
								'var_name' => 'place_desc'
							)
						)
					)
				)
			)
		);
		
		$action_parameters['EditEnvironment']['RevealScene'] = $action_parameters['EditEnvironment']['HideScene'] = array(
			'global' => array(
				'scene' => array(
					'type' => 'scene_descriptor'
				)
			)
		);
		
		$action_parameters['EditEnvironment']['RevealDialogueIntro'] = $action_parameters['EditEnvironment']['HideDialogueIntro'] = array(
			'global' => array(
				'scene' => array(
					'type' => 'scene_descriptor',
					'type_param' => array(
						'require_dialogues' => array(
							'type' => 'const',
							'const_value' => true
						)
					)
				),
				'dialogue' => array(
					'type' => 'dialogue_descriptor',
					'type_param' => array(
						'scene_descriptor' => array(
							'type' => 'var', 
							'var_name' => 'scene'
						)
					)
				)
			)
		);
		
		$action_parameters['EditEnvironment']['RevealTalkTopic'] = $action_parameters['EditEnvironment']['HideTalkTopic'] = array(
			'global' => array(
				'scene' => array(
					'type' => 'scene_descriptor',
					'type_param' => array(
						'require_dialogues' => array(
							'type' => 'const',
							'const_value' => true
						)
					)
				),
				'dialogue' => array(
					'type' => 'dialogue_descriptor',
					'type_param' => array(
						'scene_descriptor' => array(
							'type' => 'var', 
							'var_name' => 'scene'
						),
						'require_talk_topics' => array(
							'type' => 'const',
							'const_value' => true
						)
					)
				),
				'talk_topic' => array(
					'type' => 'talk_topic_descriptor',
					'type_param' => array(
						'dialogue_descriptor' => array(
							'type' => 'var', 
							'var_name' => 'dialogue'
						)
					)
				)
			)
		);
		
		$action_parameters['EditEnvironment']['RevealDialogueLocks'] = $action_parameters['EditEnvironment']['HideDialogueLocks'] = array(
			'global' => array(
				'scene' => array(
					'type' => 'scene_descriptor',
					'type_param' => array(
						'require_dialogues' => array(
							'type' => 'const',
							'const_value' => true
						)
					)
				),
				'dialogue' => array(
					'type' => 'dialogue_descriptor',
					'type_param' => array(
						'scene_descriptor' => array(
							'type' => 'var', 
							'var_name' => 'scene'
						),
						'require_locks' => array(
							'type' => 'const',
							'const_value' => true
						)
					)
				)
			)
		);
		
		//Psyche locks actions
		$action_parameters['Locks'] = array();
		$action_parameters['Locks']['LocksEnd'] = array(
			'context' => array( //Parameters to fill automatically when in psyche locks conversation, hidden from the user.
				'out_of_editor' => array(
					'type' => 'boolean',
					'required' => true
				),
				'parent_dialogue' => array(
					'type' => 'dialogue_descriptor',
					'required' => true
				)
			)
		);
		
		$action_parameters['Locks']['LocksShow'] = $action_parameters['Locks']['LocksHide'] = array(
			'context' => array( //Parameters to fill automatically when in psyche locks conversation, hidden from the user.
				'parent_dialogue' => array(
					'type' => 'dialogue_descriptor',
					'required' => true
				)
			)
		);
		
		$action_parameters['Locks']['LocksBreak'] = array(
			'context' => array( //Parameters to fill automatically when in psyche locks conversation, hidden from the user.
				'parent_dialogue' => array(
					'type' => 'dialogue_descriptor',
					'required' => true
				)
			),
			'multiple' => array(
				'lock' => array(
					'lock_desc' => array(
						'type' => 'lock_descriptor',
						'type_param' => array(
							'dialogue_descriptor' => array(
								'type' => 'var', 
								'var_name' => 'parent_dialogue'
							),
						)
					)
				)
			)
		);
		
		//Health points
		$action_parameters['Health'] = array();
		$action_parameters['Health']['ReduceHealth'] = 
		$action_parameters['Health']['SetHealth'] = array(
			'context' => array( // Action not available for merged frames
				'not_merged' => array(
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'points' => array(
					'type' => 'natural',
					'postcondition' => 'points <= 120'
				)
			)
		);
		
		$action_parameters['Health']['IncreaseHealth'] = 
		$action_parameters['Health']['FlashHealth'] = array(
			'global' => array(
				'points' => array(
					'type' => 'natural',
					'postcondition' => 'points <= 120'
				)
			)
		);
		
		//User input
		$action_parameters['Input'] = array();
		$action_parameters['Input']['MultipleChoices'] = array(
			'context' => array( //Parameters to fill automatically when in psyche locks conversation, hidden from the user.
				'parent_dialogue' => array(
					'type' => 'dialogue_descriptor',
					'default_value' => null
				),
				'in_locks' => array(
					'type' => 'boolean',
					'default_value' => 'false'
				),
				'not_merged' => array( // Action not available for merged frames
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'locks_show_return' => array(
					'precondition' => "in_locks",
					'type' => 'boolean'
				)
			),
			'multiple' => array(
				'answer' => array(
					'answer_text' => array(
						'type' => 'string'
					),
					'answer_dest' => array(
						'type' => 'frame_descriptor'
					)
				)
			)
		);
		
		$action_parameters['Input']['AskForEvidence'] = array(
			'context' => array( //Parameters to fill automatically when in psyche locks conversation, hidden from the user.
				'parent_dialogue' => array(
					'type' => 'dialogue_descriptor',
					'default_value' => null
				),
				'in_locks' => array(
					'type' => 'boolean',
					'default_value' => 'false'
				),
				'not_merged' => array( // Action not available for merged frames
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'locks_show_return' => array(
					'precondition' => "in_locks",
					'type' => 'boolean',
				),
				'type_lock' => array(
					'type' => 'select',
					'values' => array(
						'all' => array(
							'name' => 'PresentType_all'
						),
						'evidence' => array(
							'name' => 'PresentType_evidence'
						),
						'profiles' => array(
							'name' => 'PresentType_profiles'
						)
					)
				),
				'failure_dest' => array(
					'type' => 'frame_descriptor'
				)
			),
			'multiple' => array(
				'element' => array(
					'element_desc' => array(
						'type' => 'cr_element_descriptor'
					),
					'element_dest' => array(
						'type' => 'frame_descriptor'
					)
				)
			)
		);
		
		$action_parameters['Input']['PointArea'] = array(
			'context' => array( //Parameters to fill automatically when in psyche locks conversation, hidden from the user.
				'parent_dialogue' => array(
					'type' => 'dialogue_descriptor',
					'default_value' => null
				),
				'in_locks' => array(
					'type' => 'boolean',
					'default_value' => 'false'
				),
				'not_merged' => array( // Action not available for merged frames
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'locks_show_return' => array(
					'precondition' => "in_locks",
					'type' => 'boolean',
				),
				'background' => array(
					'type' => 'background_descriptor' // Either a place or a URI
				),
				'failure_dest' => array(
					'type' => 'frame_descriptor'
				)
			),
			'multiple' => array(
				'area' => array(
					'area_def' => array(
						'type' => 'area_descriptor', // The area_descriptor type requires the place, if any, as parameter, to display the list of objects
						'type_param' => array(
							'background' => array(
								'type' => 'var', 
								'var_name' => 'background'
							)
						)
					),
					'area_dest' => array(
						'type' => 'frame_descriptor'
					)
				)
			)
		);
		
		//Variable management
		$action_parameters['Vars'] = array();
		$action_parameters['Vars']['InputVars'] = array(
			'context' => array( // Action not available for merged frames
				'not_merged' => array(
					'type' => 'boolean',
					'required' => true
				)
			),
			'multiple' => array(
				'variable' => array(
					'var_name' => array(
						'type' => 'string'
					),
					'var_type' => array(
						'type' => 'select',
						'values' => array(
							'string' => array(
								'name' => 'string'
							),
							'word' => array(
								'name' => 'word'
							),
							'float' => array(
								'name' => 'float'
							),
						)
					),
					'var_password' => array(
						'type' => 'boolean'
					)
				)
			)
		);
		
		$action_parameters['Vars']['DefineVars'] = array(
			'multiple' => array(
				'variable' => array(
					'var_name' => array(
						'type' => 'string'
					),
					'var_value' => array(
						'type' => 'string'
					)
				)
			)
		);
		
		$action_parameters['Vars']['TestExprValue'] = array(
			'context' => array( // Action not available for merged frames
				'not_merged' => array(
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'expr_type' => array(
					'type' => 'select',
					'values' => array(
						'expression' => array(
							'name' => 'testType_expression'
						),
						'var_name' => array(
							'name' => 'testType_var_name'
						)
					)
				),
				'var_name' => array(
					'precondition' => "expr_type = 'var_name'",
					'type' => 'string'
				),
				'expression' => array(
					'precondition' => "expr_type = 'expression'",
					'type' => 'expression'
				),
				'failure_dest' => array(
					'type' => 'frame_descriptor'
				)
			),
			'multiple' => array(
				'values' => array(
					'value' => array(
						'type' => 'string'
					),
					'value_dest' => array(
						'type' => 'frame_descriptor'
					)
				)
			)
		);
		
		$action_parameters['Vars']['EvaluateConditions'] = array(
			'context' => array( // Action not available for merged frames
				'not_merged' => array(
					'type' => 'boolean',
					'required' => true
				)
			),
			'global' => array(
				'failure_dest' => array(
					'type' => 'frame_descriptor'
				)
			),
			'multiple' => array(
				'condition' => array(
					'expression' => array(
						'type' => 'expression'
					),
					'cond_dest' => array(
						'type' => 'frame_descriptor'
					)
				)
			)
		);
	}
	
	if($action_name == 'ALL')
	{
		switch($language)
		{
			case 'JS' :
				echo json_encode($action_parameters) . "\n";
				break;
			
			default :
				return $action_parameters;
				break;
		}
	}
	else
	{
		$output = null;
		
		foreach($action_parameters as $category)
		{
			if(isset($category[$action_name]))
			{
				$output = $category[$action_name];
			}
		}
		
		switch($language)
		{
			case 'JS' :
				echo json_encode($output) . "\n";
				break;
			
			default :
				return $output;
				break;
		}
	}
}

function getTypeDefinition($type_name, $language='PHP')
{
	static $type_definitions = array();
	
	if(empty($type_definitions))
	{
		$type_definitions['cr_element_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'type' => array(
					'nature' => 'scalar',
					'type' => 'string'
				),
				'id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		
		$type_definitions['frame_descriptor'] = array(
			'nature' => 'scalar',
			'type' => 'natural'
		);
		$type_definitions['trial_part_descriptor'] = array(
			'nature' => 'scalar',
			'type' => 'natural'
		);
		
		$type_definitions['ce_descriptor'] = array(
			'nature' => 'scalar',
			'type' => 'natural'
		);
		$type_definitions['statement_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'ce_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'statement_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		
		$type_definitions['scene_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'scene_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'scenes'
				),
				'scene_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		$type_definitions['dialogue_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'scene_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'scenes'
				),
				'scene_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'section_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'dialogues'
				),
				'section_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		$type_definitions['talk_topic_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'scene_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'scenes'
				),
				'scene_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'section_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'dialogues'
				),
				'section_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'conv_type' => array(
					'nature' => 'scalar',
					'type' => 'string'
				),
				'conv_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		$type_definitions['lock_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'scene_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'scenes'
				),
				'scene_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'section_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'dialogues'
				),
				'section_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'lock_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		$type_definitions['examination_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'scene_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'scenes'
				),
				'scene_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'section_type' => array(
					'nature' => 'scalar',
					'type' => 'string',
					'constant' => 'examinations'
				),
				'section_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		
		$type_definitions['place_descriptor'] = array(
			'nature' => 'scalar',
			'type' => 'integer'
		);
		$type_definitions['background_descriptor'] = array(
			'nature' => 'scalar',
			'type' => 'string'
		);
		$type_definitions['object_descriptor'] = array(
			'nature' => 'object',
			'fields' => array(
				'place_id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				'layer' => array(
					'nature' => 'scalar',
					'type' => 'string'
				),
				'id' => array(
					'nature' => 'scalar',
					'type' => 'natural'
				)
			)
		);
		$type_definitions['area_descriptor'] = array(
			'nature' => 'alternative',
			'alternatives' => array(
				array(
					'nature' => 'scalar',
					'type' => 'natural'
				),
				array(
					'nature' => 'scalar',
					'type' => 'string'
				),
				array(
					'nature' => 'object',
					'fields' => array(
						'shape' => array(
							'nature' => 'scalar',
							'type' => 'string'
						),
						'coords' => array(
							'nature' => 'array',
							'content' => array(
								'nature' => 'scalar',
								'type' => 'integer'
							)
						)
					)
				)
			)
		);
	}
	
	if($type_name == 'ALL')
	{
		switch($language)
		{
			case 'JS' :
				echo json_encode($type_definitions) . "\n";
				break;
			
			default :
				return $type_definitions;
				break;
		}
	}
	else
	{
		switch($language)
		{
			case 'JS' :
				echo json_encode($type_definitions[$type_name]) . "\n";
				break;
			
			default :
				return $type_definitions[$type_name];
				break;
		}
	}
}


function getLegacyActionsParameters($action_name)
{
	switch($action_name)
	{
		case 'AfficherElement' : case 'DevoilerElement' : case 'MasquerElement' : 
			return array(
				array(
					'name' => 'parametre_type',
					'type' => 'elt_type',
					'mult' => 0
				),
				array(
					'name' => 'Id',
					'type' => 'elt_id',
					'mult' => 0
				)
			);
			break;
		
		case 'RepondreQuestion' :
			return array(
				array(
					'name' => 'parametre_reponse,1',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_reponse,2',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_reponse,3',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,1',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,2',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,3',
					'type' => 'mess',
					'mult' => 0
				)
			);
		
		case 'ChoixEntre2' :
			return array(
				array(
					'name' => 'parametre_reponse,1',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_reponse,2',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,1',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,2',
					'type' => 'mess',
					'mult' => 0
				),
			);
		
		case 'ChoixEntre4' : 
			return array(
				array(
					'name' => 'parametre_reponse,1',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_reponse,2',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_reponse,3',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_reponse,4',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,1',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,2',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,3',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_cible,4',
					'type' => 'mess',
					'mult' => 0
				)
			);
		
		case 'DemanderPreuve' :
			return array(
				array(
					'name' => 'parametre_type',
					'type' => 'elt_type',
					'mult' => 'evidence'
				),
				array(
					'name' => 'Id',
					'type' => 'elt_id',
					'mult' => 'evidence'
				),
				array(
					'name' => 'parametre_message_echec',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_succes',
					'type' => 'mess',
					'mult' => 'evidence'
				),
				array(
					'name' => 'parametre_verr_pres',
					'type' => 'select',
					'values' => array(
						'' => '',
						'preuves' => '',
						'profils' => ''
					),
					'mult' => 0
				),
			);
			
		case 'PointerImage' :
			return array(
				array(
					'name' => 'parametre_adresse_image',
					'type' => 'lien',
					'mult' => 0
				),
				array(
					'name' => 'x1',
					'type' => 'num',
					'mult' => 'zone'
				),
				array(
					'name' => 'y1',
					'type' => 'num',
					'mult' => 'zone'
				),
				array(
					'name' => 'x2',
					'type' => 'num',
					'mult' => 'zone'
				),
				array(
					'name' => 'y2',
					'type' => 'num',
					'mult' => 'zone'
				),
				array(
					'name' => 'parametre_message_echec',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'parametre_message_succes',
					'type' => 'mess',
					'mult' => 'zone'
				),
			);
		
		case 'LancerCI' : 
			return array(
				array(
					'name' => 'parametre_message_contradictoire',
					'type' => 'mess',
					'mult' => 'contradiction'
				),
				array(
					'name' => 'parametre_type_piece_contradictoire',
					'type' => 'elt_type',
					'mult' => 'contradiction'
				),
				array(
					'name' => 'parametre_id_piece_contradictoire',
					'type' => 'elt_id',
					'mult' => 'contradiction'
				),
				array(
					'name' => 'parametre_message_succes',
					'type' => 'mess',
					'mult' => 'contradiction'
				),
				array(
					'name' => 'parametre_message_echec',
					'type' => 'mess',
					'mult' => 0
				),
			);
		
		case 'CreerLieu' :
			return array(
				array(
					'name' => 'id_lieu',
					'type' => 'num',
					'mult' => 0
				),
				array(
					'name' => 'nom_lieu',
					'type' => 'text',
					'mult' => 0
				),
				array(
					'name' => 'lieu_cache',
					'type' => 'select',
					'values' => array(
							0 => 'non',
							1 => 'oui'
						),
					'mult' => 0
				),
				array(
					'name' => 'message_sortie',
					'type' => 'mess',
					'mult' => 0
				)
			);
		
		case 'DiscussionEnqueteV2' :
			return array(
				array(
					'name' => 'debut_discussion',
					'type' => 'mess',
					'mult' => 'discussion'
				),
				array(
					'name' => 'titre_discussion',
					'type' => 'text',
					'mult' => 'discussion'
				),
				array(
					'name' => 'cache_discussion',
					'type' => 'select',
					'values' => array(
							0 => 'non',
							1 => 'oui'
						),
					'mult' => 'discussion'
				),
				array(
					'name' => 'mess_verrous',
					'type' => 'mess',
					'mult' => 0
				),
				array(
					'name' => 'verrous_caches',
					'type' => 'select',
					'values' => array(
							0 => 'non',
							1 => 'oui'
						),
					'mult' => 0
				),
			);
		
		case 'LancerVerrous' : 
			return array();
		
		default :
			return -1;
	}
}

?>
