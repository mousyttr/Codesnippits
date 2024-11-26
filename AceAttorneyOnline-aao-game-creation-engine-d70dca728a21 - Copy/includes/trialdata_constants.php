<?php
/*
Ace Attorney Online - Constants used in trial data

*/

function defineConstants($language='PHP')
{
	$constants = array();
	
	//block type
	$constants['AA_SCENE'] = 0;
	$constants['AAI_SCENE'] = 1;
	
	//Possible align values
	$constants['ALIGN_CENTER'] = 0;
	$constants['ALIGN_LEFT'] = -1;
	$constants['ALIGN_RIGHT'] = 1;
	
	//Transition modes for a frame
	$constants['TRANSITION_NO'] = 0;
	$constants['TRANSITION_LINEAR'] = 1;
	$constants['TRANSITION_BEZIER'] = 2;
	$constants['TRANSITION_EASE_IN'] = 3;
	$constants['TRANSITION_EASE_OUT'] = 4;

	//Possible animations for character display/hiding
	$constants['EFFECT_NONE'] = 0; // Appear instantaneously (no effect)
	$constants['EFFECT_AUTO'] = 1; // Automatic : Preserve the effect previously set for the character, or none.
	$constants['EFFECT_SLIDE_LEFT'] = 2; // Slide from/to the left side
	$constants['EFFECT_SLIDE_RIGHT'] = 3; // Slide from/to the right side
	$constants['EFFECT_FADING'] = 4; // Fading in/out

	//DOM position for screen fades
	$constants['FADEPOS_BGONLY'] = 0;
	$constants['FADEPOS_BGCHARACTER'] = 1;
	$constants['FADEPOS_BEHINDTEXT'] = 2;
	$constants['FADEPOS_EVERYTHING'] = 3;

	//Fade modes
	$constants['FADEMODE_FADEIN'] = 0;
	$constants['FADEMODE_FADEOUT'] = 1;
	
	//Animation synchronisation modes for a sprite
	$constants['SYNC_SYNC'] = 0; //Synchronise with text typing
	$constants['SYNC_STILL'] = 1; //Stay still all the time
	$constants['SYNC_TALK'] = 2; //Keep talking all the time
	$constants['SYNC_AUTO'] = 3; //Let the player decide the synchronisation
	
	//Startup animation modes
	$constants['STARTUP_SKIP'] = 0;
	$constants['STARTUP_PLAY_DURING'] = 1;
	$constants['STARTUP_PLAY_BEFORE'] = 2;

	//Default profiles
	$constants['PROFILE_JUDGE'] = 0;
	$constants['PROFILE_UNKNOWN'] = -1;
	$constants['PROFILE_EMPTY'] = -3;

	//Default positions
	//Real positions
	$constants['POSITION_CENTER'] = -1;
	$constants['POSITION_LEFTALIGN'] = -2;
	$constants['POSITION_RIGHTALIGN'] = -3;
	$constants['POSITION_AAI_SINGLE_LEFT'] = -4;
	$constants['POSITION_AAI_SINGLE_RIGHT'] = -5;
	$constants['POSITION_AAI_DOUBLE_LEFT_LEFT'] = -6;
	$constants['POSITION_AAI_DOUBLE_LEFT_RIGHT'] = -7;
	$constants['POSITION_AAI_DOUBLE_RIGHT_LEFT'] = -8;
	$constants['POSITION_AAI_DOUBLE_RIGHT_RIGHT'] = -9;
	$constants['POSITION_AAI_DOUBLE_CENTER_LEFT'] = -10;
	$constants['POSITION_AAI_DOUBLE_CENTER_RIGHT'] = -11;
	//Position modes
	$constants['POSITION_NONE'] = 0; //Auto : Determines whether to center on talking depending on position of the talking character.
	$constants['POSITION_CENTER_ON_TALKING'] = -100;
	$constants['POSITION_DO_NOT_MOVE'] = -101;

	//Default places
	$constants['PLACE_NONE'] = 0;
	$constants['PLACE_ERASER'] = -1;
	$constants['PLACE_PW_COURTROOM'] = -2;
	$constants['PLACE_PW_COCOUNCIL'] = -3;
	$constants['PLACE_PW_SCROLLING_DEFENSE'] = -4;
	$constants['PLACE_PW_SCROLLING_PROSECUTION'] = -5;
	$constants['PLACE_PW_JUDGE'] = -6;
	$constants['PLACE_PW_HAMMER'] = -7;
	$constants['PLACE_PW_COURT_AGITATED'] = -8;
	$constants['PLACE_PW_COURT_STILL'] = -9;
	$constants['PLACE_PW_LOBBY'] = -10;
	$constants['PLACE_PW_HAMMER_TRIPLE'] = -11;
	$constants['PLACE_AJ_COURTROOM'] = -12;
	$constants['PLACE_AJ_COCOUNCIL'] = -13;
	$constants['PLACE_AJ_JUDGE'] = -14;
	$constants['PLACE_AJ_COURT_AGITATED'] = -15;
	$constants['PLACE_AJ_COURT_STILL'] = -16;
	$constants['PLACE_AJ_LOBBY'] = -17;
	$constants['PLACE_PW_DETENTION_CENTER_BEHIND'] = -18;
	$constants['PLACE_PW_DETENTION_CENTER_AHEAD'] = -19;
	$constants['PLACE_AJ_DETENTION_CENTER_BEHIND'] = -20;
	$constants['PLACE_AJ_DETENTION_CENTER_AHEAD'] = -21;
	
	//Default sounds
	$constants['SOUND_NONE'] = 0;

	//Default music
	$constants['MUSIC_UNCHANGED'] = 0;
	$constants['MUSIC_STOP'] = -1;
	
	//Default voices
	$constants['VOICE_NONE'] = 0;
	$constants['VOICE_MALE'] = -1;
	$constants['VOICE_FEMALE'] = -2;
	$constants['VOICE_TYPEWRITER'] = -3;
	$constants['VOICE_AUTO'] = -4;

	//Default voice delays
	$constants['VOICE_MALE_DELAY'] = 64;
	$constants['VOICE_FEMALE_DELAY'] = 64;
	$constants['VOICE_TYPEWRITER_DELAY'] = 131;
	
	switch($language)
	{
		case 'JS' :
			foreach($constants as $name => $value)
			{
				echo "var " . $name . " = " . json_encode($value) . ";\n";
			}
			break;
		
		default :
			foreach($constants as $name => $value)
			{
				define($name, $value);
			}
			break;
	}
}

defineConstants();

?>
