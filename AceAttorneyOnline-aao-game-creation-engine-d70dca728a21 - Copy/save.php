<?php
/*
Ace Attorney Online - Save trial

*/

include('common_render.php');

if(isset($_POST['trial_id']) AND isset($_POST['trial_contents']))
{
	$trial_id = intval($_POST['trial_id']);
	$trial = TrialMetadataHandler::getHandlerFor($trial_id);

	if($trial != null AND $trial->canUserWriteContents(UserDataHandler::getCurrentUser()))
	{
		// User is authentified and can write on this trial
		
		// In manual input, all major browsers have gone the crappy IE way, which is adding CR characters AFTER all JS processing, so they aren't taken into account in the length... Get rid of them.
		if(isset($_POST['manual_input']) && isset($_POST['trial_contents']))
		{
			$_POST['trial_contents'] = str_replace(array("\r\n", "\r"), array("\n", "\n"), $_POST['trial_contents']);
		}
		
		// Check integrity of the trial contents
		$expected_length = isset($_POST['trial_contents_length']) ? intval($_POST['trial_contents_length']) : -1;
		$received_length = isset($_POST['trial_contents']) ? mb_strlen($_POST['trial_contents'], 'UTF-8') : -1;
		if($expected_length < 0 OR $received_length !== $expected_length)
		{
			// If lengths do not match, inform user of malformed request
			header('HTTP/1.1 400 Bad Request');
			// And echo debug information : relative lengths and last characters before break
			if($received_length >= 0)
			{
				$ten_last_received_chars = mb_substr($_POST['trial_contents'], $received_length - 10, 10, 'UTF-8');
			}
			else
			{
				$ten_last_received_chars = '';
			}
			echo 'Debug:' . $received_length . '/' . $expected_length . '|' . $ten_last_received_chars;
			exit;
		}
		
		try
		{
			// Create backup if needed and write file contents
			$trial->getNewAutoBackup();
			$trial->getTrialFile()->writeContents($_POST['trial_contents']);
			
			echo '1';
		}
		catch(Exception $e)
		{
			header('HTTP/1.1 500 Internal Server Error'); // Give out server error
			var_dump($e->getMessage());
			exit;
		}
	}
	else
	{
		header('HTTP/1.1 403 Forbidden'); // Forbid access to the page
		echo 'You don\'t have permission to edit this trial.';
		exit;
	}
}
else
{
	includeScript('layout/common.php');
	
	layout_header();
?>
<section>
	<h1>Rescue trial saver</h1>
	<p>
		The normal way of saving a trial is through the editor. Using this page directly is dangerous. Be warned !
	</p>
	<form action="" method="post" onsubmit="
		this.trial_contents.value = this.trial_contents.value.replace(/(\\r\\n|\\r)/g, '\n'); // Remove ugly CR characters added by browsers if we're lucky enough for them to be added before processing...
		// We want UTF-8 length for consistency with PHP. c.f. https://stackoverflow.com/a/49599723
		this.trial_contents_length.value = [...this.trial_contents.value].length; // And compute proper length
	">
		<label>Id of the trial to save : <input name="trial_id" type="number" min="0" /></label><br />
		<label>Contents of the trial file : <textarea name="trial_contents" rows="15" cols="80"></textarea></label><br />
		<input name="trial_contents_length" type="hidden" />
		<input name="manual_input" type="hidden" value="1" />
		<input type="submit" />
	</form>
</section>
<?php
	layout_footer();
}

?>
