<?php
/*
Ace Attorney Online - Abstract class defining methods to handle formatting of legacy trials

*/

abstract class FormattingBase
{
	protected $file_contents;
	protected $profile_start, $evidence_start, $script_start;
	protected $places = array(0 => 0), $sounds = array(0 => 0), $music = array(0 => 0), $popups = array(0 => 0), $scenes = array(0 => 0), $cross_examinations = array(0 => 0); //placeholder element at 0 to keep JS export as arrays
	protected $place_ids, $sounds_by_url, $music_by_url, $popups_by_url = array();
	protected $all_profiles_fetched, $last_frame_fetched = false;
	
	protected $parent_sequence = null;
	
	public function __construct($file_path, $trial_id, $parent_sequence = null)
	{
		$this->parent_sequence = $parent_sequence;
		$this->trial_id = $trial_id;
		$this->file_contents = file($file_path, FILE_IGNORE_NEW_LINES);
		
		//set delimiters
		//pointing to the first row of each type
		$this->profile_start = 0;

		foreach($this->file_contents as $index => $line)
		{
			if(strpos($line, '!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!-!') === 0)
			{
				$delimiters[] = $index;
			}
			elseif(strpos($line, '//Definition//') === 0)
			{
				//Def2-5 should have this once, as their first line
				$this->profile_start = 1;
			}
		}
		
		$delimiters[0] = isset($delimiters[0]) ? $delimiters[0] : 0;
		$delimiters[1] = isset($delimiters[1]) ? $delimiters[1] : 0;
		
		$this->evidence_start = $delimiters[0] + 1;
		$this->script_start = $delimiters[1] + 1;
		
		$this->last_frame_fetched = $delimiters[1];
	}

	protected function convertColourTags($string)
	{
		if(strpos($string, '<span') !== FALSE)
		{
			//Quickly check for the presence of colour tags to avoid processing the regexp if not needed
			return preg_replace('!<span.+?style=".*?color:(.+?);?".*?>(.*?)</span>!', '[#/instant:$1]$2[/#][#r200]', $string);
		}
		else
		{
			return $string;
		}
	}
	
	// Now that fetchAllFrames is only ever called with $frame_line_nb -1, can I reduce this, at all?
	protected function fetchAllFrames($until = -1)
	{
		$until = ($until == -1) ? count($this->file_contents) - 1 : $until;
		
		for($i = $this->last_frame_fetched + 1; $i <= $until; $i++)
		{
			$this->getFrameByLineNb($i, NO_OUTPUT);
			$this->last_frame_fetched = $i;
		}
	}
	
	protected abstract function getProfileByLineNb($profile_line_nb, $output_type);
	
	protected abstract function getEvidenceByLineNb($evidence_line_nb, $output_type);
	
	protected abstract function getFrameByLineNb($frame_line_nb, $output_type);
	
	public function getTrialData($output_type=TRIALDATA_AS_ARRAY)
	{
		$trialData = array(
			'profiles' => array(),
			'evidence' => array(),
			'places' => array(),
			'sounds' => array(),
			'music' => array(),
			'popups' => array(),
			'cross_examinations' => array(),
			'scenes' => array(),
			'scenes_aai' => array(0 => 0), //placeholder to keep js export as an array
			'frames' => array(),
			'ui' => array(
				'base' => 'classic',
				'elements' => array()
			)
		);
		
		$trialData['profiles'][0] = 0; //placeholder to keep js export as an array
		for($i = $this->profile_start; $i < $this->evidence_start - 1; $i++)
		{
			$current_profile = $this->getProfileByLineNb($i);
			$trialData['profiles'][] = $current_profile;
		}
		$this->all_profiles_fetched = true;
		
		$trialData['evidence'][0] = 0; //placeholder to keep js export as an array
		for($i = $this->evidence_start; $i < $this->script_start - 1; $i++)
		{
			$current_evidence = $this->getEvidenceByLineNb($i);
			$trialData['evidence'][] = $current_evidence;
		}
		
		$trialData['frames'][0] = 0; //placeholder to keep js export as an array
		for($i = $this->script_start; $i < count($this->file_contents); $i++)
		{
			$current_frame = $this->getFrameByLineNb($i);
			$trialData['frames'][] = $current_frame;
			$this->last_frame_fetched = $i;
		}
		
		$trialData['places'] = $this->places;
		$trialData['cross_examinations'] = $this->cross_examinations;
		$trialData['scenes'] = $this->scenes;
		$trialData['sounds'] = $this->sounds;
		$trialData['music'] = $this->music;
		$trialData['popups'] = $this->popups;
		
		fixStructure($trialData);
		
		if($output_type == TRIALDATA_AS_JSON)
		{
			return json_encode($trialData);
		}
		else
		{
			return $trialData;
		}
	}
}

?>
