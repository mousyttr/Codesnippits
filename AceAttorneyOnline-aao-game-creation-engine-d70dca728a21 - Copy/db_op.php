<?php
/*
Ace Attorney Online - Database operations webservice entry point

*/

include('common_render.php');

if(!isset($_GET['user_session_id']) OR $_GET['user_session_id'] != $user->data['session_id'])
{
	die('Possible hacking attempt : Session ID does not match');
}

// Return the requested redirection URL, or null if none requested.
// Die if forbidden redirection attempted.
function getRedirectionUrl()
{
	if(isset($_GET['redirect']))
	{
		$url = $_GET['redirect'];
		$aao_root = dirname($_SERVER['PHP_SELF']);
		if(strpos($url, $aao_root) === 0)
		{
			// Redirect to another AAO root page : OK
			return $url;
		}
		else
		{
			// Else, not OK, fail with fatal error
			die('Possible hacking attempt : attempted bad redirection to ' . htmlentities($url));
		}
	}
	return null;
}

function handleDbOpException($exception)
{
	includeScript('layout/common.php');
	language_load_file('db_op_errors');
	
	layout_header();
	
?>	
	<section class="centered">
		<p class="error">
			<?php el($exception->getMessage()); ?>
		</p>
<?php
	if($redirect_url = getRedirectionUrl())
	{
?>		<a class="big error button" href="<?php e($redirect_url); ?>">⇐</a>
<?php
	}
?>	</section>
<?php
	
	layout_footer();
}

set_exception_handler('handleDbOpException');

if(isset($_GET['mode']))
{
	switch($_GET['mode'])
	{
		// Edit a trial's metadata
		case 'edit_trial':
			
			$trial = TrialMetadataHandler::getHandlerFor(intval($_GET['trial_id']));
			if($trial != null AND isset($_GET['operations']))
			{
				foreach($_GET['operations'] as $op => $val)
				{
					switch($op)
					{
						case 'setTitle':
						case 'setLanguage':
						case 'setPublic':
						case 'setFeatured':
						
							$trial->$op($val);
						
							break;
						
						case 'setAuthor':
							
							$trial->$op(UserDataHandler::getHandlerFor($val));
							
							break;
							
						case 'addCollaborator':
						case 'removeCollaborator':
						case 'addPlaytester':
						case 'removePlaytester':
							
							foreach($val as $user_id)
							{
								if(is_numeric($user_id))
								{
									$trial->$op(UserDataHandler::getHandlerFor($user_id));
								}
							}
						
							break;
					}
				}
				
				$trial->save();
			}
			
			break;
		
		case 'create_trial':
			
			if(isset($_GET['trial_title']) AND isset($_GET['trial_language']))
			{
				TrialMetadataHandler::create(UserDataHandler::getCurrentUser(), $_GET['trial_title'], $_GET['trial_language']);
			}
			
			break;
		
		case 'delete_trial':
		
			$trial = TrialMetadataHandler::getHandlerFor($_GET['trial_id']);
			if($trial != null)
			{
				$trial->delete();
			}
			
			break;
		
		// Create a manual backup
		case 'create_backup':
			$trial = TrialMetadataHandler::getHandlerFor(intval($_GET['trial_id']));
			if($trial != null)
			{
				$trial->getNewManualBackup();
			}
			
			break;
		
		// Delete a manual backup
		case 'delete_backup':
			$trial = TrialMetadataHandler::getHandlerFor(intval($_GET['trial_id']));
			if($trial != null AND isset($_GET['backup_date']))
			{
				$trial->deleteManualBackup($_GET['backup_date']);
			}
			break;
		
		// Edit a sequence's structure
		case 'edit_sequence':
			
			$sequence = TrialSequenceHandler::getHandlerFor($_GET['sequence_id']);
			if($sequence != null AND isset($_GET['operations']))
			{
				foreach($_GET['operations'] as $op => $val)
				{
					switch($op)
					{
						case 'setTitle':
							$sequence->$op($val);
							break;
						
						case 'moveUpEltAt':
						case 'moveDownEltAt':
						case 'removeEltAt':
							$sequence->$op(intval($val));
							break;
						
						case 'appendTrial':
							$sequence->$op(TrialMetadataHandler::getHandlerFor($val));
							break;
						
						case 'appendSequence':
							$sequence->$op(TrialSequenceHandler::getHandlerFor($val));
							break;
					}
				}
				
				$sequence->save();
			}
			
			break;
		
		case 'create_sequence':
			
			if(isset($_GET['sequence_title']) AND isset($_GET['sequence_trials']) AND is_array($_GET['sequence_trials']))
			{
				$trials = array();
				foreach($_GET['sequence_trials'] as $trial_id)
				{
					if($trial_id)
					{
						$trials[] = TrialMetadataHandler::getHandlerFor($trial_id);
					}
				}
				
				TrialSequenceHandler::create(UserDataHandler::getCurrentUser(), $_GET['sequence_title'], $trials);
			}
			
			break;
		
		case 'delete_sequence':
		
			$sequence = TrialSequenceHandler::getHandlerFor($_GET['sequence_id']);
			if($sequence != null)
			{
				$sequence->delete();
			}
			
			break;
	}
}


// Check whether a redirection is required and send HTTP header as required
if($redirect_url = getRedirectionUrl())
{
	header('Location: ' . $redirect_url);
	exit;
}

?>
