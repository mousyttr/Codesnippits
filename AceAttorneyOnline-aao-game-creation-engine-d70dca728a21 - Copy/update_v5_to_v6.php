<?php
/*
Ace Attorney Online - Update system from V5 to V6

*/

if(!isset($_GET['confirm']) OR $_GET['confirm'] != 1)
{
	exit;
}

include('common_render.php');

function updateFilePositions($from, $nbentries)
{
	global $db;
	
	$query = 'SELECT id, fichier, langue FROM liste_proces ORDER BY id LIMIT ' . $from . ', ' . $nbentries;
	$trial_files = $db->sql_query($query);
	
	$nbfound = 0;
	
	while($file_entry = $db->sql_fetchrow($trial_files))
	{
		$trial = new TrialFileHandler($file_entry);
		
		$current_path = $trial->getTrialFilePath();
		$target_dir = $trial->getTrialFileDirectory($file_entry);
		$target_path = $target_dir . $file_entry['fichier'] . '.txt';
		
		if($current_path != $target_path)
		{
			@mkdir($target_dir, 0777, true);
			rename($current_path, $target_path);
		}
		
		$nbfound++;
	}
	
	return ($nbfound == $nbentries);
}

define('CV_MOVE_FILES', 0);
define('CV_UPDATE_DB', 1);

define('NUM_ROWS_BY_STEP', 3);

$mode = intval($_GET['mode']);

switch($mode)
{
	case CV_MOVE_FILES :
		
		$start = intval($_GET['start']);
		
		if(updateFilePositions($start, NUM_ROWS_BY_STEP))
		{
			header('Location: ?mode='.$mode.'&start='.($start + NUM_ROWS_BY_STEP));
			exit;
		}
		
		break;
}

updateFilePositions(0, 3);



?>