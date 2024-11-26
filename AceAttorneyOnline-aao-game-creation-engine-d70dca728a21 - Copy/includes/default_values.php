<?php
/*
Ace Attorney Online - Values of default elements

*/

function place_positions($id='ALL', $language='PHP')
{
	static $default_place_positions = array(
		POSITION_CENTER => array(
				'id' => POSITION_CENTER,
				'name' => 'center',
				'align' => ALIGN_CENTER, //position to center
				'shift' => 0 //do not shift from position
			),
		POSITION_LEFTALIGN => array(
				'id' => POSITION_LEFTALIGN,
				'name' => 'left_align',
				'align' => ALIGN_LEFT, //position to left
				'shift' => 0 //do not shift from position
			),
		POSITION_RIGHTALIGN => array(
				'id' => POSITION_RIGHTALIGN,
				'name' => 'right_align',
				'align' => ALIGN_RIGHT, //position to right
				'shift' => 0 //do not shift from position
			),
		POSITION_AAI_SINGLE_LEFT => array(
				'id' => POSITION_AAI_SINGLE_LEFT,
				'name' => 'aai_single_left',
				'align' => ALIGN_LEFT, //position to left
				'shift' => -84 //shift 84 px to the left
			),
		POSITION_AAI_SINGLE_RIGHT => array(
				'id' => POSITION_AAI_SINGLE_RIGHT,
				'name' => 'aai_single_right',
				'align' => ALIGN_RIGHT, 
				'shift' => 84 //shift 84 px to the right
			),
		POSITION_AAI_DOUBLE_LEFT_LEFT => array(
				'id' => POSITION_AAI_DOUBLE_LEFT_LEFT,
				'name' => 'aai_double_left_leftmost',
				'align' => ALIGN_LEFT, 
				'shift' => -65 //shift 65 px to the left
			),
		POSITION_AAI_DOUBLE_LEFT_RIGHT => array(
				'id' => POSITION_AAI_DOUBLE_LEFT_RIGHT,
				'name' => 'aai_double_left_rightmost',
				'align' => ALIGN_LEFT, 
				'shift' => 32 //shift 32 px to the right
			),
		POSITION_AAI_DOUBLE_RIGHT_LEFT => array(
				'id' => POSITION_AAI_DOUBLE_RIGHT_LEFT,
				'name' => 'aai_double_right_leftmost',
				'align' => ALIGN_RIGHT, 
				'shift' => -32 //shift 32 px to the left
			),
		POSITION_AAI_DOUBLE_RIGHT_RIGHT => array(
				'id' => POSITION_AAI_DOUBLE_RIGHT_RIGHT,
				'name' => 'aai_double_right_rightmost',
				'align' => ALIGN_RIGHT, 
				'shift' => 65 //shift 65 px to the right
			),
		POSITION_AAI_DOUBLE_CENTER_LEFT => array(
				'id' => POSITION_AAI_DOUBLE_CENTER_LEFT,
				'name' => 'aai_double_center_leftmost',
				'align' => ALIGN_CENTER, 
				'shift' => -65 //shift 65 px to the left
			),
		POSITION_AAI_DOUBLE_CENTER_RIGHT => array(
				'id' => POSITION_AAI_DOUBLE_CENTER_RIGHT,
				'name' => 'aai_double_center_rightmost',
				'align' => ALIGN_CENTER, 
				'shift' => 65 //shift 65 px to the right
			)
	);
	
	if($id == 'ALL')
	{
		switch($language)
		{
			case 'JS' :
				return json_encode($default_place_positions);
				break;
			
			default :
				return $default_place_positions;
				break;
		}
	}
	else
	{
		switch($language)
		{
			case 'JS' :
				return json_encode($default_place_positions[$id]);
				break;
			
			default :
				return $default_place_positions[$id];
				break;
		}
	}
}

function places($id='ALL', $language='PHP')
{
	static $default_places;

	if(!$default_places) 
	{
		$default_places = array(
			
			//black screen erasing previous place
			PLACE_ERASER => array(
				'id' => PLACE_ERASER,
				'lang' => 'defaultplaces_black_bg',
				'background' => array(
					'colour' => 'black',
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//PW courtroom view
			PLACE_PW_COURTROOM => array(
				'id' => PLACE_PW_COURTROOM,
				'lang' => 'defaultplaces_pw_courtroom',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_courtroom.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array(
					array(
						'id' => 1,
						'lang' => 'pw_courtroom_benches',
						'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'foreground_objects/pw_courtroom_benches.gif',
						'external' => 1,
						'hidden' => 0,
						'x' => 0,
						'y' => 0
					)
				)
			),
		
			//PW Judge bench
			PLACE_PW_JUDGE => array(
				'id' => PLACE_PW_JUDGE,
				'lang' => 'defaultplaces_pw_judge',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_judge.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array(
					array(
						'id' => 1,
						'lang' => 'pw_judge_bench',
						'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'foreground_objects/pw_judge_bench.gif',
						'external' => 1,
						'hidden' => 0,
						'x' => 0,
						'y' => 0
					)
				)
			),
		
			//PW co council view
			PLACE_PW_COCOUNCIL => array(
				'id' => PLACE_PW_COCOUNCIL,
				'lang' => 'defaultplaces_pw_cocouncil',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_cocouncil.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//PW agitated courtroom
			PLACE_PW_COURT_AGITATED => array(
				'id' => PLACE_PW_COURT_AGITATED,
				'lang' => 'defaultplaces_pw_court_agitated',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_court_agitated.gif',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//PW still courtroom
			PLACE_PW_COURT_STILL => array(
				'id' => PLACE_PW_COURT_STILL,
				'lang' => 'defaultplaces_pw_court_still',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_court_still.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//PW defense lobby
			PLACE_PW_LOBBY => array(
				'id' => PLACE_PW_LOBBY,
				'lang' => 'defaultplaces_pw_lobby',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_lobby.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
			
			//PW detention center (behind)
			PLACE_PW_DETENTION_CENTER_BEHIND => array(
				'id' => PLACE_PW_DETENTION_CENTER_BEHIND,
				'lang' => 'defaultplaces_pw_detention_center_behind',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_detention_center.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array(
					array(
						'id' => 1,
						'lang' => 'pw_detention_center_glass',
						'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'foreground_objects/pw_detention_center.gif',
						'external' => 1,
						'hidden' => 0,
						'x' => 0,
						'y' => 0
					)
				)
			),
			
			//PW detention center (ahead)
			PLACE_PW_DETENTION_CENTER_AHEAD => array(
				'id' => PLACE_PW_DETENTION_CENTER_AHEAD,
				'lang' => 'defaultplaces_pw_detention_center_ahead',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_detention_center.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
			
			//AJ courtroom view
			PLACE_AJ_COURTROOM => array(
				'id' => PLACE_AJ_COURTROOM,
				'lang' => 'defaultplaces_aj_courtroom',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_courtroom.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array(
					array(
						'id' => 1,
						'lang' => 'aj_courtroom_benches',
						'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'foreground_objects/aj_courtroom_benches.gif',
						'external' => 1,
						'hidden' => 0,
						'x' => 0,
						'y' => 0
					)
				)
			),
		
			//AJ Judge bench
			PLACE_AJ_JUDGE => array(
				'id' => PLACE_AJ_JUDGE,
				'lang' => 'defaultplaces_aj_judge',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_judge.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array(
					array(
						'id' => 1,
						'lang' => 'aj_judge_bench',
						'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'foreground_objects/aj_judge_bench.gif',
						'external' => 1,
						'hidden' => 0,
						'x' => 0,
						'y' => 0
					)
				)
			),
		
			//AJ co council view
			PLACE_AJ_COCOUNCIL => array(
				'id' => PLACE_AJ_COCOUNCIL,
				'lang' => 'defaultplaces_aj_cocouncil',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_cocouncil.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//AJ agitated courtroom
			PLACE_AJ_COURT_AGITATED => array(
				'id' => PLACE_AJ_COURT_AGITATED,
				'lang' => 'defaultplaces_aj_court_agitated',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_court_agitated.gif',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//AJ still courtroom
			PLACE_AJ_COURT_STILL => array(
				'id' => PLACE_AJ_COURT_STILL,
				'lang' => 'defaultplaces_aj_court_still',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_court_still.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//AJ defense lobby
			PLACE_AJ_LOBBY => array(
				'id' => PLACE_AJ_LOBBY,
				'lang' => 'defaultplaces_aj_lobby',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_lobby.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
			
			//AJ detention center (behind)
			PLACE_AJ_DETENTION_CENTER_BEHIND => array(
				'id' => PLACE_AJ_DETENTION_CENTER_BEHIND,
				'lang' => 'defaultplaces_aj_detention_center_behind',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_detention_center.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array(
					array(
						'id' => 1,
						'lang' => 'aj_detention_center_glass',
						'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'foreground_objects/aj_detention_center.gif',
						'external' => 1,
						'hidden' => 0,
						'x' => 0,
						'y' => 0
					)
				)
			),
			
			//AJ detention center (ahead)
			PLACE_AJ_DETENTION_CENTER_AHEAD => array(
				'id' => PLACE_AJ_DETENTION_CENTER_AHEAD,
				'lang' => 'defaultplaces_aj_detention_center_ahead',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/aj_detention_center.jpg',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//PW defense scrolling background
			PLACE_PW_SCROLLING_DEFENSE => array(
				'id' => PLACE_PW_SCROLLING_DEFENSE,
				'lang' => 'defaultplaces_pw_scrolling_defense',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_scrolling_defense.gif',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//PW defense scrolling background
			PLACE_PW_SCROLLING_PROSECUTION => array(
				'id' => PLACE_PW_SCROLLING_PROSECUTION,
				'lang' => 'defaultplaces_pw_scrolling_prosecution',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_scrolling_prosecution.gif',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
			
			//PW judge's hammer
			PLACE_PW_HAMMER => array(
				'id' => PLACE_PW_HAMMER,
				'lang' => 'defaultplaces_pw_hammer',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_hammer.gif',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			),
		
			//PW judge's hammer x3
			PLACE_PW_HAMMER_TRIPLE => array(
				'id' => PLACE_PW_HAMMER_TRIPLE,
				'lang' => 'defaultplaces_pw_hammer_triple',
				'background' => array(
					'image' => getCfg('picture_dir') . getCfg('defaultplaces_subdir') . 'backgrounds/pw_hammer_triple.gif',
					'external' => 1
				),
				'positions' => array(),
				'background_objects' => array(),
				'foreground_objects' => array()
			)
		);
	}
	
	if($id == 'ALL')
	{
		switch($language)
		{
			case 'JS' :
				return json_encode($default_places);
				break;
			
			default :
				return $default_places;
				break;
		}
	}
	else
	{
		switch($language)
		{
			case 'JS' :
				return json_encode($default_places[$id]);
				break;
			
			default :
				return $default_places[$id];
				break;
		}
	}
}

// Light profiles, containing information a frame might need when using a default profile
function profiles($id='ALL', $language='PHP')
{
	static $default_profiles = array(
		PROFILE_JUDGE => array(
			'id' => PROFILE_JUDGE,
			'short_name' => '',
			'base' => 'Juge',
			'icon' => '',
			'custom_sprites' => array(),
			'voice' => VOICE_MALE,
			'auto_place_position' => '',
			'auto_place' => '',
			'auto_colour' => ''
		),
		PROFILE_UNKNOWN => array(
			'id' => PROFILE_UNKNOWN,
			'short_name' => '???',
			'base' => 'Inconnu',
			'icon' => '',
			'custom_sprites' => array(),
			'voice' => VOICE_MALE,
			'auto_place_position' => '',
			'auto_place' => '',
			'auto_colour' => ''
		),
		PROFILE_EMPTY => array(
			'id' => PROFILE_EMPTY,
			'short_name' => '',
			'base' => 'Inconnu',
			'icon' => '',
			'custom_sprites' => array(),
			'voice' => VOICE_MALE,
			'auto_place_position' => '',
			'auto_place' => '',
			'auto_colour' => ''
		)
	);
	
	if($id == 'ALL')
	{
		switch($language)
		{
			case 'JS' :
				return json_encode($default_profiles);
				break;
			
			default :
				return $default_profiles;
				break;
		}
	}
	else
	{
		switch($language)
		{
			case 'JS' :
				return json_encode($default_profiles[$id]);
				break;
			
			default :
				return $default_profiles[$id];
				break;
		}
	}
}

?>
