<?php
/*
Ace Attorney Online - Def1 formatting handler

*/

includeScript('includes/action_descriptions.php');
includeScript('includes/legacy_blocks.php');

function implodeWithUnderscore($array)
{
	if(is_array($array))
	{
		return implode('_', $array);
	}
	else
	{
		return $array;
	}
}

class FormattingDef1 extends FormattingBase
{
	private $profile_ids_by_name, $custom_sprites_by_url = array();
	
	private function decode(&$array)
	{
		foreach($array as $key => $value)
		{
			$array[$key] = iconv("CP1252", "UTF-8", (str_replace('\n', "\n", str_replace("''", "'", $value)))); //simple quotes were doubled, \n represented line breaks, and text wasn't in UTF-8
		}
	}
	
	protected function getProfileByLineNb($profile_line_nb, $output_type=TRIALDATA_AS_ARRAY)
	{
		$line = $this->file_contents[$profile_line_nb];
		
		preg_match('#\\(\'\' \\| \'(?<longname>.*)\'\\| \'(?<shortname>.*)\'\\| \'(?<description>.*)\'\\| \'(?<base>.*)\'\\| (?<first_appearance>\\d*)\\),#', $line, $match);
		$this->decode($match);
		
		$profile_data = array();
		$profile_data['id'] = $profile_line_nb - $this->profile_start + 1;
		
		$profile_data['long_name'] = $match['longname'];
		$profile_data['short_name'] = $match['shortname'];
		$profile_data['description'] = $match['description'];
		$profile_data['civil_status'] = '';
		$profile_data['hidden'] = ($match['first_appearance'] > 1) ? true : false;
		
		//prepare the custom sprites field
		$profile_data['custom_sprites'] = array();
		
		//analyse the base field
		if(strpos($match['base'], 'http://') === 0) //custom profile
		{
			$custom_profile_data = explode('\\', $match['base']);
			$profile_data['icon'] = $custom_profile_data[0];
			$profile_data['base'] = ''; //in Def1, custom profiles couldn't have a base
			
			//retrieve custom sprites
			array_shift($custom_profile_data);
		
			for($i = 0; $i < count($custom_profile_data); $i++)
			{
				$profile_data['custom_sprites'][] = array(
					'id' => intval($i) + 1, //ID can't be 0 : increase by 1
					'name' => intval($id) + 1,
					'talking' => $custom_profile_data[$i],
					'still' => $custom_profile_data[$i],
					'startup' => '',
					'startup_duration' => 0
				);
				
				$this->custom_sprites_by_url[$custom_profile_data[$i]] = array(
					'profile' => $profile_data['id'],
					'pic_id' => $i
				);
			}
		}
		else
		{
			$profile_data['icon'] = '';
			$profile_data['base'] = $match['base'];
		}
		
		$profile_data['voice'] = VOICE_MALE;
		
		$profile_data['auto_place'] = $profile_data['auto_place_position'] = $profile_data['auto_colour'] = '' ;
		
		//store the assocation between name and id
		$this->profile_ids_by_name[$profile_data['short_name']] = intval($profile_data['id']);
		
		if($output_type == TRIALDATA_AS_JSON)
		{
			return json_encode($profile_data);
		}
		else
		{
			return $profile_data;
		}
	}
	
	protected function getEvidenceByLineNb($evidence_line_nb, $output_type=TRIALDATA_AS_ARRAY)
	{
		$line = $this->file_contents[$evidence_line_nb];
		
		preg_match('#\\(\'\' \\| \'(?<name>.*)\'\\| \'(?<icon>.*)\'\\| \'(?<description>.*)\'\\| (?<first_appearance>\\d*)\\),#', $line, $match);
		$this->decode($match);
		
		$evidence_data = array();
		$evidence_data['id'] = $evidence_line_nb - $this->evidence_start + 1;
		$evidence_data['name'] = $match['name'];
		$evidence_data['description'] = $match['description'];
		$evidence_data['metadata'] = '';
		$evidence_data['hidden'] = ($match['first_appearance'] > 1) ? true : false;
		$evidence_data['icon'] = $match['icon'];
		$evidence_data['icon_external'] = (strpos($match['icon'], 'http://') === 0) ? true : false;
		$evidence_data['check_button_data'] = array();
		
		// Manage legacy [IMG_PHOTO:*] tags : convert them into check pages
		preg_match_all('#\[IMG_PHOTO:(.*?)\]#', $evidence_data['description'], $photo_tags);
		for($i = 0; $i < count($photo_tags[1]); $i++)
		{
			$evidence_data['check_button_data'][] = array(
				'type' => 'image',
				'content' => $photo_tags[1][$i]
			);
		}
		$evidence_data['description'] = preg_replace('#\[IMG_PHOTO:(.*?)\]#', '', $evidence_data['description']);
		
		if($output_type == TRIALDATA_AS_JSON)
		{
			return json_encode($evidence_data);
		}
		else
		{
			return $evidence_data;
		}
	}
	
	protected function getFrameByLineNb($frame_line_nb, $output_type=TRIALDATA_AS_ARRAY)
	{
		$line = $this->file_contents[$frame_line_nb];
		
		preg_match('#\\(\'\' \\| \'(?<speaker_name>.*)\'\\| \'(?<images>.*)\'\\| \'(?<sound>.*)\'\\| \'(?<colour>.*)\'\\| \'(?<text>.*)\'\\| (?<wait_time>\\d*)\\| \'(?<action>.*)\'\\| (?<hidden>.*)\\),#', $line, $match);
		$this->decode($match);
		
		
		if(!$this->all_profiles_fetched)
		{
			$this->fetchAllProfiles();
		}
		
		$frame_data = array();
		$frame_data['id'] = $frame_line_nb - $this->script_start + 1;
		
		$frame_data['speaker_name'] = '';
		$frame_data['speaker_use_name'] = false;
		//get the speaker id
		if(isset($this->profile_ids_by_name[$match['speaker_name']]))
		{
			$frame_data['speaker_id'] = $this->profile_ids_by_name[$match['speaker_name']];
		}
		else
		{
			switch($match['speaker_name'])
			{
				case 'Juge' : $frame_data['speaker_id'] = PROFILE_JUDGE; break;
				case '???' : $frame_data['speaker_id'] = PROFILE_UNKNOWN; break;
				default : $frame_data['speaker_id'] = PROFILE_EMPTY; break;
			}
		}
		
		$this->fetchAllFrames($frame_line_nb - 1);
		
		
		//analyse the sound field
		if(strpos($match['sound'], 'Son') === 0)
		{
			$sound = substr($match['sound'], 3);
			$sound_is_music = 0;
		}
		else
		{
			$sound = $match['sound'];
			$sound_is_music = 1;
		}
		
		$sound_is_external = (strpos($sound, 'http://') === 0) ? true : false;
		
		if($sound == '')
		{
			$frame_data['sound'] = SOUND_NONE;
			$frame_data['music'] = MUSIC_UNCHANGED;
		}
		elseif($sound == 'STOP')
		{
			$frame_data['sound'] = SOUND_NONE;
			$frame_data['music'] = MUSIC_STOP;
		}
		elseif($sound_is_music)
		{
			if(isset($this->music_by_url[$sound]))
			{
				$frame_data['sound'] = SOUND_NONE;
				$frame_data['music'] = $this->music_by_url[$sound];
			}
			else
			{
				$id = count($this->music);
				$this->music[$id] = array(
					'id' => $id,
					'name' => basename($sound),
					'path' => $sound,
					'external' => $sound_is_external,
					'volume' => 100,
					'loop_start' => 0
				);
				$this->music_by_url[$sound] = $id;
				
				$frame_data['sound'] = SOUND_NONE;
				$frame_data['music'] = $id;
			}
		}
		else
		{
			if(isset($this->sounds_by_url[$sound]))
			{
				$frame_data['sound'] = $this->sounds_by_url[$sound];
				$frame_data['music'] = MUSIC_UNCHANGED;
			}
			else
			{
				$id = count($this->sounds);
				$this->sounds[$id] = array(
					'id' => $id,
					'name' => basename($sound),
					'path' => $sound,
					'external' => $sound_is_external,
					'volume' => 100
				);
				$this->sounds_by_url[$sound] = $id;
				
				$frame_data['sound'] = $id;
				$frame_data['music'] = MUSIC_UNCHANGED;
			}
		}
		
		//analyse the images field
		if(($separatorpos = strpos($match['images'], ',')) !== false)
		{
			$background = substr($match['images'], 0, $separatorpos);
			$character = substr($match['images'], $separatorpos + 1);
		}
		elseif(strpos($match['images'], 'PER') === 0 OR is_numeric($match['images']) OR $match['speaker_name'] == 'Cour')
		{
			$background = '';
			$character = $match['images'];
		}
		else if($match['images'] == 'no')
		{
			$background = 'no';
			$character = 'no';
		}
		else
		{
			$background = $match['images'];
			$character = '';
		}
		
		$background_external = (strpos($background, 'http://') === 0) ? true : false;
		$character_external = (strpos($character, 'PER') === 0) ? true : false;
		
		//manage backgrounds as places
		list($defaultplace, $defaultpos) = convertLegacyPlace($background);
		
		if($defaultplace < 0)
		{
			$frame_data['place'] = $defaultplace;
			$frame_data['place_position'] = $defaultpos;
		}
		else 
		{
			if($background == '')
			{
				$frame_data['place'] = PLACE_NONE;
				$frame_data['place_position'] = POSITION_NONE;
			}
			elseif($background == 'no' OR $character == 'no')
			{
				$frame_data['place'] = PLACE_ERASER;
				$frame_data['place_position'] = POSITION_CENTER;
			}
			else
			{
				//fix the previously hardcoded background path
				$background = (strpos($background, 'cinematiques/') === 0) ? substr($background, 13) : $background;
				
				if(isset($this->place_ids[$background]))
				{
					$frame_data['place'] = $this->place_ids[$background];
				}
				else
				{
					$id = count($this->places);
					$this->places[$id] = array(
						'id' => $id,
						'name' => $background,
						'background' => array(
								'image' => $background,
								'external' => $background_external
						),
						'positions' => array(),
						'background_objects' => array(),
						'foreground_objects' => array()
					);
					$this->place_ids[$background] = $id;
					
					$frame_data['place'] = $id;
				}
				$frame_data['place_position'] = POSITION_CENTER;
			}
		}
		$frame_data['place_transition'] = TRANSITION_NO;
		
		
		//manage character
		if($character == '')
		{
			$frame_data['popups'] = array();
			$frame_data['characters'] = array();
			$frame_data['characters_erase_previous'] = false;
		}
		elseif($character == 'no')
		{
			$frame_data['popups'] = array();
			$frame_data['characters'] = array();
			$frame_data['characters_erase_previous'] = true;
		}
		else
		{
			if($character_external)
			{
				$character_url = substr($character, 3);
				if(isset($this->custom_sprites_by_url[$character_url]))
				{
					$character = $this->custom_sprites_by_url[$character_url];
					$profile_id = $character['profile'];
					$sprite_id = $character['pic_id'];
				}
				else // A non-existent external sprite is a (possible) bug in the old editor! Treat it as having no profile to set.
				{
					$profile_id = null;
				}
			}
			else
			{
				$profile_id = $frame_data['speaker_id'];
				$sprite_id = $character;
			}
			
			if($profile_id == -4)
			{
				//Special pictures
				$frame_data['characters'] = array();
				
				if(isset($this->popups_by_url[$sprite_id]))
				{
					$frame_data['popups'] = array(
						0 => array(
							'popup_id' => $this->popups_by_url[$sprite_id],
							'position' => $frame_data['place_position'], 
							'mirror_effect' => false
						)
					);
				}
				else
				{
					$id = count($this->popups);
					$this->popups[$id] = array(
						'id' => $id,
						'name' => basename($sprite_id),
						'path' => $sprite_id,
						'external' => $character_external
					);
					$this->popups_by_url[$sprite_id] = $id;
					
					$frame_data['popups'] = array(
						0 => array(
							'popup_id' => $id,
							'position' => $frame_data['place_position'], 
							'mirror_effect' => false
						)
					);
				}
			}
			elseif(!is_null($profile_id))
			{
				$frame_data['popups'] = array();
				$frame_data['characters'] = array(
					0 => array(
						'profile_id' => $profile_id,
						'sprite_id' => $character_external ? intval($sprite_id) + 1 : - intval($sprite_id),
						'sync_mode' => SYNC_AUTO,
						'startup_mode' => 0,
						'position' => $frame_data['place_position'], 
						'mirror_effect' => false,
						'visual_effect_appears' => EFFECT_NONE,
						'visual_effect_appears_mode' => 0, //automatic : trigger animation under system defined conditions
						'visual_effect_disappears' => EFFECT_NONE, 
						'visual_effect_disappears_mode' => 0,
					)
				);
			}
			else
			{
				$frame_data['popups'] = array();
				$frame_data['characters'] = array();
			}
			
			$frame_data['characters_erase_previous'] = true; // In V5, one character only : always replace the previous one
		}
		
		//analyse action field
		$action_table = explode(',', $match['action']);
		$frame_data['action_name'] = $action_table[0];
		$frame_data['action_parameters'] = array();
		$action_parameters_type = getLegacyActionsParameters($frame_data['action_name']);
		array_shift($action_table);
		foreach($action_table as $index => $parameter)
		{
			if($action_parameters_type != -1 AND $action_parameters_type[$index]['mult'] !== 0)
			{
				$frame_data['action_parameters'][$index] = explode('_', $parameter);
				
				foreach($frame_data['action_parameters'][$index] as $ind => $param)
				{
					//profiles started at 0 and now start at 1
					if($action_parameters_type[$index]['type'] == 'elt_id' AND $action_parameters_type[$index-1]['type'] == 'elt_type' AND $frame_data['action_parameters'][$index-1][$ind] == 'profil')
					{
						$frame_data['action_parameters'][$index][$ind]++;
					}
				}
			}
			else
			{
				$frame_data['action_parameters'][$index] = $parameter;
				//profiles started at 0 and now start at 1
				if($action_parameters_type[$index]['type'] == 'elt_id' AND $action_parameters_type[$index-1]['type'] == 'elt_type' AND $frame_data['action_parameters'][$index-1] == 'profil')
				{
					$frame_data['action_parameters'][$index]++;
				}
			}
		}
		
		if($frame_data['action_name'] == 'LancerCI')
		{
			$frame_data['action_parameters'] = array_map("implodeWithUnderscore", $frame_data['action_parameters']);
		}
		
		$frame_data['text_colour'] = $match['colour'];
		$frame_data['text_content'] = $this->convertColourTags($match['text']);
		$frame_data['text_speed'] = 0.67;
		$frame_data['speaker_voice'] = VOICE_AUTO;
		
		if($frame_data['speaker_id'] == PROFILE_EMPTY 
			AND $frame_data['text_colour'] == 'lime')
		{
			//green texts not spoken by a character come from the typewriter
			$frame_data['speaker_voice'] = VOICE_TYPEWRITER;
		}
		
		$frame_data['hidden'] = $match['hidden'] ? 1 : 0;
		$frame_data['wait_time'] = intval($match['wait_time']) * 10;
		$frame_data['merged_to_next'] = 0;
		
		buildStructure($frame_data, $this->places, $this->cross_examinations);
		convertActions($frame_data, $this->trial_id, $this->parent_sequence);
		
		if($output_type == TRIALDATA_AS_JSON)
		{
			return json_encode($frame_data);
		}
		else
		{
			return $frame_data;
		}
	}
	
	protected function fetchAllProfiles()
	{
		$this->profile_ids_by_name['Juge'] = PROFILE_JUDGE;
		$this->profile_ids_by_name['???'] = PROFILE_UNKNOWN;
		$this->profile_ids_by_name[''] = PROFILE_EMPTY;
		
		for($i = $this->profile_start; $i < $this->evidence_start - 1; $i++)
		{
			$this->getProfileByLineNb($i, NO_OUTPUT);
		}
		
		$this->all_profiles_fetched = true;
	}
}

?>
