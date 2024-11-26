<?php
/*
Ace Attorney Online - Export trial data to Javascript

*/

if(!defined('ALREADY_INCLUDED'))
{
	include('common_render.php');
	
	header('Content-type: text/javascript; charset=UTF-8');
}

$trial_id = intval($_GET['trial_id']);

?>
/*
Ace Attorney Online - Trial data module

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'trial',
	dependencies : ['trial_object_model', 'objects_diff'],
	init : function() {
		// initial_trial_data is extended according to model, and then set to readonly mode.
		if(!initial_trial_data) return;
		
		extendObjectWithModel(initial_trial_data, trial_object_model);
		Object.freeze(initial_trial_data);
		
		if('trialdata_diff' in _GET)
		{
			// Handle trial data diff if given : apply it onto the trial data.
			trial_data = patch(initial_trial_data, JSON.parse(_GET['trialdata_diff']));
		}
		else
		{
			// Else, trial_data is defined as a clone of initial_trial_data to keep original as reference.
			trial_data = objClone(initial_trial_data);
		}
	}
}));


//INDEPENDENT INSTRUCTIONS


//EXPORTED VARIABLES
<?php

$trial = TrialMetadataHandler::getHandlerFor($trial_id);

if($trial == null OR !$trial->canUserRead(UserDataHandler::getCurrentUser()))
{
	echo 'var trial_information;';
	echo 'var initial_trial_data;';
}
else
{
	if(isset($_GET['trial_backup_type']) AND isset($_GET['trial_backup_date']))
	{
		$backups = ($_GET['trial_backup_type'] == 'auto') ? $trial->getAutoBackups() : $trial->getManualBackups();
		
		if(array_key_exists($_GET['trial_backup_date'], $backups))
		{
			$trial_file = $backups[$_GET['trial_backup_date']];
		}
	}
	else
	{
		$trial_file = $trial->getTrialFile();
	}
	
	if($trial_file == null)
	{
		echo 'var trial_information;';
		echo 'var initial_trial_data;';
	}
	else
	{
		$sequence = $trial->getParentSequence();
		
		$trial_information = array(
			'id' => $trial->getId(),
			'title' => $trial->getTitle(),
			'author_id' => $trial->getAuthor()->getId(),
			'author' => $trial->getAuthor()->getName(),
			'language' => $trial->getLanguage(),
			'sequence' => $sequence == null ? null : $sequence->export(),
			'can_read' => true,
			'can_write' => $trial->canUserWriteContents(UserDataHandler::getCurrentUser()),
			'last_edit_date' => $trial_file->getLastModificationDate(),
			'format' => $trial_file->getFormat()
		);
		
		if($trial_file->getFilePath() != null)
		{
			$trial_information['file_path'] = $trial_file->getFilePath();
		}
		
		echo 'var trial_information = JSON.parse("' . escapeJSON(json_encode($trial_information)) . '");' . "\n";
		echo 'var initial_trial_data = JSON.parse("' . escapeJSON($trial_file->getTrialData()) . '");';
	}
}
//print_r($trial_file->query->getTrialData(TRIALDATA_AS_ARRAY));
?>
// trial_data variable is null at first, to avoid any modification until properly initialised.
var trial_data = null;


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('trial');
