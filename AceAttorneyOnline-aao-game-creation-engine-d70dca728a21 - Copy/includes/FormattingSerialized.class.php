<?php
/*
Ace Attorney Online - Def2 - Def5 formatting handler

*/

includeScript('includes/legacy_blocks.php');

class FormattingSerialized extends FormattingBase
{
	private $custom_sprites_by_id = array();

	private function decode(&$array)
	{
		$convmap = array(0x0, 0x2FFFF, 0, 0xFFFF);
		
		foreach($array as $key => $value)
		{
			if(is_array($value))
			{
				$this->decode($array[$key]);
			}
			else
			{
				$array[$key] = str_replace('\n', "\n", html_entity_decode(mb_decode_numericentity($value, $convmap, 'UTF-8'), ENT_QUOTES, 'UTF-8')); // \n represented line breaks, and text was all in entities : back to regular characters
			}
		}
	}
	
	protected function getProfileByLineNb($profile_line_nb, $output_type=TRIALDATA_AS_ARRAY)
	{
		$line = unserialize($this->file_contents[$profile_line_nb]);
		$this->decode($line);
		
		$profile_data = array();
		$profile_data['id'] = intval($line['id']);
		
		$profile_data['long_name'] = $line['nomlong'];
		$profile_data['short_name'] = $line['nomcourt'];
		$profile_data['description'] = $line['description'];
		$profile_data['civil_status'] = '';
		$profile_data['hidden'] = ($line['apparition'] > 1) ? true : false;
		$profile_data['base'] = $line['base'];
		$profile_data['icon'] = $line['icone'];
		
		$profile_data['custom_sprites'] = array();
		if(isset($line['images_externes_id']))
		{
			$this->custom_sprites_by_id[$profile_data['id']] = array();
			
			//Not necessarily set in Def 2, 3, 4; Set in Def5
			for($i = 0; $i < count($line['images_externes_id']); $i++)
			{
				$id = $line['images_externes_id'][$i];
				$this->custom_sprites_by_id[$profile_data['id']][] = intval($id) + 1; //ID can't be 0 : increase by 1
				$profile_data['custom_sprites'][] = array(
					'id' => intval($id) + 1,
					'name' => intval($id) + 1,
					'talking' => $line['images_externes_norm'][$i] ? $line['images_externes_norm'][$i] : $line['images_externes_muet'][$i],
					'still' => $line['images_externes_muet'][$i] ? $line['images_externes_muet'][$i] : $line['images_externes_norm'][$i],
					'startup' => $line['images_externes_spec'][$i],
					'startup_duration' => intval($line['images_externes_spec_duree'][$i]) * 10
				);
			}
		}
		
		if(isset($line['auto_voice']))
		{
			//Def 5
			//Let us assume that the auto voice is really the voice of the character
			$profile_data['voice'] = ($line['auto_voice'] == 0) ? VOICE_MALE : ($line['auto_voice'] == -1 ? VOICE_NONE : (- $line['auto_voice'])) ; 
			//Could be improved by selecting the voice most used by the profile during the trial...
		}
		else
		{
			//Def 2, 3, or 4
			$profile_data['voice'] = VOICE_MALE; //No information : use male sound
		}
		
		$profile_data['auto_place'] = $profile_data['auto_place_position'] = '';
		$profile_data['auto_colour'] = $line['auto_color'];
		
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
		$line = unserialize($this->file_contents[$evidence_line_nb]);
		$this->decode($line);
		
		$evidence_data = array();
		$evidence_data['id'] = intval($line['id']);
		$evidence_data['name'] = $line['nom'];
		$evidence_data['description'] = $line['description'];
		$evidence_data['metadata'] = '';
		$evidence_data['hidden'] = ($line['apparition'] > 1) ? true : false;
		$evidence_data['icon'] = $line['base'];
		$evidence_data['icon_external'] = (strpos($line['base'], 'http://') === 0) ? true : false;
		$evidence_data['check_button_data'] = array();
		
		for($i = 0; $i < count($line['media_verifier']); $i++)
		{
			$type = substr($line['media_verifier'][$i], 0, 3);
			switch($type)
			{
				case 'txt':
					$type = 'text';
					break;
				case 'img':
					$type = 'image';
					break;
				case 'son':
					$type = 'sound';
					break;
			}
			$content = substr($line['media_verifier'][$i], 3);
			$evidence_data['check_button_data'][] = array(
				'type' => $type,
				'content' => $content ? $content : ''
			);
		}
		
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
		//Ensure all profiles are fetched, so we can prune calls to non-existent sprite IDs later
		if(!$this->all_profiles_fetched)
		{
			$this->fetchAllProfiles();
		}
		
		$line = unserialize($this->file_contents[$frame_line_nb]);
		$this->decode($line);
		
		$frame_data = array();
		$frame_data['id'] = $frame_line_nb - $this->script_start + 1;
		
		if(isset($line['infos_auteur']))
		{
			//Def5
			$speaker_info = $line['infos_auteur'];
			$frame_data['speaker_name'] = $speaker_info['nom_auteur'];
			$frame_data['speaker_use_name'] = $speaker_info['utiliser_nom'] ? true : false;
		}
		else
		{
			//Def2-4
			$speaker_info = $line;
			$frame_data['speaker_name'] = '';
			$frame_data['speaker_use_name'] = 0;
		}

		$frame_data['speaker_id'] = ($speaker_info['id_auteur'] == -4 || $speaker_info['id_auteur'] == -2) ? PROFILE_EMPTY : intval($speaker_info['id_auteur']);
		
		
		$this->fetchAllFrames($frame_line_nb - 1);
		
		//analyse the sound data
		if($line['son']['chemin_son'] == '')
		{
			$frame_data['sound'] = SOUND_NONE;
			$frame_data['music'] = MUSIC_UNCHANGED;
		}
		elseif($line['son']['chemin_son'] == 'STOP')
		{
			$frame_data['sound'] = SOUND_NONE;
			$frame_data['music'] = MUSIC_STOP;
		}
		elseif($line['son']['musique'])
		{
			if(isset($this->music_by_url[$line['son']['chemin_son']]))
			{
				$frame_data['sound'] = SOUND_NONE;
				$frame_data['music'] = $this->music_by_url[$line['son']['chemin_son']];
			}
			else
			{
				$id = count($this->music);
				$this->music[$id] = array(
					'id' => $id,
					'name' => basename($line['son']['chemin_son']),
					'path' => $line['son']['chemin_son'],
					'external' => $line['son']['son_externe'] ? true : false,
					'volume' => 100,
					'loop_start' => 0
				);
				$this->music_by_url[$line['son']['chemin_son']] = $id;
				
				$frame_data['sound'] = SOUND_NONE;
				$frame_data['music'] = $id;
			}
		}
		else
		{
			if(isset($this->sounds_by_url[$line['son']['chemin_son']]))
			{
				$frame_data['sound'] = $this->sounds_by_url[$line['son']['chemin_son']];
				$frame_data['music'] = MUSIC_UNCHANGED;
			}
			else
			{
				$id = count($this->sounds);
				$this->sounds[$id] = array(
					'id' => $id,
					'name' => basename($line['son']['chemin_son']),
					'path' => $line['son']['chemin_son'],
					'external' => $line['son']['son_externe'] ? true : false,
					'volume' => 100
				);
				$this->sounds_by_url[$line['son']['chemin_son']] = $id;
				
				$frame_data['sound'] = $id;
				$frame_data['music'] = MUSIC_UNCHANGED;
			}
		}
		
		//manage backgrounds as places
		list($defaultplace, $defaultpos) = convertLegacyPlace($line['fond']['chemin_fond']);
		
		if($defaultplace < 0)
		{
			$frame_data['place'] = $defaultplace;
			$frame_data['place_position'] = $defaultpos;
		}
		else 
		{
			if($line['fond']['chemin_fond'] == '')
			{
				$frame_data['place'] = PLACE_NONE;
				$frame_data['place_position'] = POSITION_NONE;
			}
			elseif($line['fond']['chemin_fond'] == 'no')
			{
				$frame_data['place'] = PLACE_ERASER;
				$frame_data['place_position'] = POSITION_CENTER;
			}
			else
			{
				//fix the previously hardcoded background path
				$line['fond']['chemin_fond'] = (strpos($line['fond']['chemin_fond'], 'cinematiques/') === 0) ? substr($line['fond']['chemin_fond'], 13) : $line['fond']['chemin_fond'];
				
				if(isset($this->place_ids[$line['fond']['chemin_fond']]))
				{
					$frame_data['place'] = $this->place_ids[$line['fond']['chemin_fond']];
				}
				else
				{
					$id = count($this->places);
					$this->places[$id] = array(
						'id' => $id,
						'name' => $line['fond']['chemin_fond'],
						'background' => array(
							'image' => $line['fond']['chemin_fond'],
							'external' => $line['fond']['fond_externe'] ? true : false
						),
						'positions' => array(),
						'background_objects' => array(),
						'foreground_objects' => array()
					);
					
					if(!empty($line['fond']['banc']))
					{
						//Def5 may have this; Def2-4 never will
						$this->places[$id]['foreground_objects'][] = array(
							'image' => $line['fond']['banc'],
							'external' => (strpos($line['fond']['banc'], 'http://') === 0) ? true : false,
							'hidden' => 0
						);
					}
					
					$this->place_ids[$line['fond']['chemin_fond']] = $id;
					
					$frame_data['place'] = $id;
				}
				$frame_data['place_position'] = POSITION_CENTER;
			}
		}
		$frame_data['place_transition'] = TRANSITION_NO;
		
		
		//convert the character images
		if($line['perso']['chemin_perso'] == 'no' OR $speaker_info['id_auteur'] == -2)
		{
			$frame_data['popups'] = array();
			$frame_data['characters'] = array();
			$frame_data['characters_erase_previous'] = true;
		}
		//no person or an invalid external sprite - which should be treated as no person
		elseif($line['perso']['chemin_perso'] == '' OR
			($line['perso']['perso_externe'] &&
			isset($this->custom_sprites_by_id[$frame_data['speaker_id']]) &&
			!in_array(intval($line['perso']['chemin_perso']) + 1, $this->custom_sprites_by_id[$frame_data['speaker_id']])))
		{
			$frame_data['popups'] = array();
			$frame_data['characters'] = array();
			$frame_data['characters_erase_previous'] = false;
		}
		elseif($speaker_info['id_auteur'] == -4)
		{
			//Special pictures
			if(isset($this->popups_by_url[$line['perso']['chemin_perso']]))
			{
				$frame_data['popups'] = array(
					0 => array(
						'popup_id' => $this->popups_by_url[$line['perso']['chemin_perso']],
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
					'name' => basename($line['perso']['chemin_perso']),
					'path' => $line['perso']['chemin_perso'],
					'external' => $line['perso']['perso_externe'] ? true : false
				);
				$this->popups_by_url[$line['perso']['chemin_perso']] = $id;
				
				$frame_data['popups'] = array(
					0 => array(
						'popup_id' => $id,
						'position' => $frame_data['place_position'], 
						'mirror_effect' => false
					)
				);
			}
			
			$frame_data['characters'] = array();
			$frame_data['characters_erase_previous'] = false;
		}
		else
		{
			$frame_data['popups'] = array();
			//Def2-4 never had mode_animation set, but V5 always does
			$sync_mode = isset($line['perso']['mode_animation']) ? $line['perso']['mode_animation'] : 0;
			$frame_data['characters'] = array(
				0 => array(
					'profile_id' => $frame_data['speaker_id'],
					'sprite_id' => $line['perso']['perso_externe'] ? intval($line['perso']['chemin_perso']) + 1 : - intval($line['perso']['chemin_perso']),
					'sync_mode' => $sync_mode % 10 ? $sync_mode % 10 : SYNC_AUTO,
					'startup_mode' => intval($sync_mode / 10),
					'position' => $frame_data['place_position'], 
					'mirror_effect' => false,
					'visual_effect_appears' => EFFECT_NONE,
					'visual_effect_appears_mode' => 0, //automatic : trigger animation under system defined conditions
					'visual_effect_disappears' => EFFECT_NONE,
					'visual_effect_disappears_mode' => 0
				)
			);
			
			$frame_data['characters_erase_previous'] = true; // In V5, one character only : always replace the previous one
		}
		
		
		$frame_data['action_name'] = $line['tableau_action']['nom_action'];
		$frame_data['action_parameters'] = $line['tableau_action']['param_action'];
		
		$frame_data['text_colour'] = $line['donnees_texte']['couleur'];
		$frame_data['text_content'] = $this->convertColourTags($line['donnees_texte']['texte']);
		$frame_data['text_speed'] = round($line['donnees_texte']['vitesse_texte'] / 1.5, 2);
		
		$text_voice = $line['donnees_texte']['son_texte'];
		if($frame_data['speaker_id'] == PROFILE_EMPTY 
			AND (($text_voice == 0 AND $frame_data['text_colour'] == 'lime') 
				OR $text_voice == 4))
		{
			//green texts in auto or typewriter mode come from the typewriter
			$frame_data['speaker_voice'] = VOICE_TYPEWRITER;
		}
		elseif($text_voice == 0)
		{
			$frame_data['speaker_voice'] = VOICE_AUTO;
		}
		else
		{
			$frame_data['speaker_voice'] = ($text_voice == -1 ? VOICE_NONE : (- $text_voice));
		}
		
		$frame_data['hidden'] = $line['cache'] ? true : false;
		$frame_data['wait_time'] = intval($line['delai']) * 10;
		$frame_data['merged_to_next'] = $line['lie_au_suivant'] ? true : false;
		
		buildStructure($frame_data, $this->scenes, $this->cross_examinations);
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
		for($i = $this->profile_start; $i < $this->evidence_start - 1; $i++)
		{
			$this->getProfileByLineNb($i, NO_OUTPUT);
		}
	
		$this->all_profiles_fetched = true;
	}
}

?>
