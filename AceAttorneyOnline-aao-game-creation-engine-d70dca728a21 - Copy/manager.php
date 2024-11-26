<?php
/*
Ace Attorney Online - Trial manager

*/

include('common_render.php');
includeScript('layout/common.php');
includeScript('layout/trial.php');

language_load_file('manager');

layout_header(array('style_trial'), 'manager');

?>

<nav class="section-tabs"></nav>

<?php

/*
 * DISPLAY LIST OF TRIALS
 */

/*
 * Returns structured data from list of trials.
 * Structure is :
 * array(
 * 	'independant' => array(of TrialMetadataHandler)
 * 	'sequences' => array(of array(
 * 		'element' => TrialSequenceHandler
 * 		'children' => array(indexed on position, of array(
 * 			'element' => ISequenceElement
 * 			'children' => ...
 * 		))
 * 	))
 * )
 */
function buildStructuredTrialList($trials)
{
	// List of independant trial objects
	$independant_trials = array();
	
	// List of included children position for each sequence to be included
	$sequences_included_children = array();
	
	// List of root sequences indexed by sequence ID
	$root_sequences = array();
	
	foreach($trials as $trial)
	{
		$sequence = $trial->getParentSequence();
		if($sequence === null)
		{
			// No sequence : ungrouped trial
			$independant_trials[] = $trial;
		}
		else
		{
			// In a sequence
			
			// Mark current trial as included in its sequence
			if(!isset($sequences_included_children[$sequence->getId()]))
			{
				$sequences_included_children[$sequence->getId()] = array();
			}
			$sequences_included_children[$sequence->getId()][] = $sequence->getPositionOf($trial);
			
			// Mark parent sequence as included in its own parent, and so on
			$current_sequence = $sequence;
			while($parent_sequence = $current_sequence->getParentSequence())
			{
				if(!isset($sequences_included_children[$parent_sequence->getId()]))
				{
					$sequences_included_children[$parent_sequence->getId()] = array();
				}
				$sequences_included_children[$parent_sequence->getId()][] = $parent_sequence->getPositionOf($current_sequence);
				
				$current_sequence = $parent_sequence;
			}
			
			// $parent_sequence is null; $current_sequence is a root sequence, note it down.
			if(!in_array($current_sequence->getId(), $root_sequences))
			{
				$root_sequences[$current_sequence->getId()] = $current_sequence;
			}
		}
	}
	
	// Build sequences data structure
	$sequences = array();
	
	foreach($root_sequences as $root_id => $root_seq)
	{
		$sequences[] = buildStructuredDataLevel($root_seq, $sequences_included_children);
	}
	
	return array(
		'independant' => $independant_trials,
		'sequences' => $sequences
	);
}

function buildStructuredDataLevel(ISequenceElement $element, $included_children_positions)
{
	$children = null;
	
	if($element instanceof TrialSequenceHandler)
	{
		// If it is a sequence, include children recursively
		$children = array();
		
		foreach($included_children_positions[$element->getId()] as $position)
		{
			$child = $element->getEltAt($position);
			$children[$position] = buildStructuredDataLevel($child, 
				isset($included_children_positions[$child->getId()]) ? 
				$included_children_positions[$child->getId()] : 
				null
			);
		}
	}
	
	return array(
		'element' => $element,
		'children' => $children
	);
}

function layoutStructuredTrialList($trials)
{
?>
<h3><?php el('independant_trials'); ?></h3>
<ul class="trial-list">
<?php
	foreach($trials['independant'] as $trial)
	{
?><li class="trial top">
<?php 
	layout_trialCard($trial);
	layout_trialMoreInfo($trial);
?>
</li><?php
	}
?>
</ul>
<h3><?php el('trial_sequences'); ?></h3>
<ul>
<?php
	foreach($trials['sequences'] as $sequence)
	{
		layoutStructuredDataLevel($sequence);
	}
?>
</ul>
<?php
}

function layoutStructuredDataLevel($level)
{
	if($level['element'] instanceof TrialSequenceHandler)
	{
?>
<li class="sequence">
	<h4><?php e($level['element']->getTitle());?> <a href="manager.php?edit_sequence_id=<?php eu($level['element']->getId());?>" class="edit button"><?php el('edit'); ?></a></h4>
	<ol class="trial-list">
<?php 
	foreach($level['children'] as $child)
	{
		layoutStructuredDataLevel($child);
	}
?>
	</ol>
</li>
<?php
	}
	else
	{
?><li class="trial left">
<?php 
	layout_trialCard($level['element']);
	layout_trialMoreInfo($level['element']);
?>
</li><?php
	}
}

if(UserDataHandler::getCurrentUser()->isActive())
{
?>
<section>
	<h1><?php el('trial_manager'); ?></h1>
	
	<section>
		<h2><?php el('own_trials'); ?></h2>
<?php
$user_author_trials = TrialSearchQuery::searchFor()
	->authorId()->is(UserDataHandler::getCurrentUser()->getId())
	->getAll();

layoutStructuredTrialList(buildStructuredTrialList($user_author_trials));
?>
	</section>
	
	<section>
		<h2><?php el('collaborating_trials'); ?></h2>
<?php
$user_collab_trials = TrialSearchQuery::searchFor()
	->collabsId()->has(UserDataHandler::getCurrentUser()->getId())
	->getAll();

layoutStructuredTrialList(buildStructuredTrialList($user_collab_trials));
?>
	</section>
	
	<section>
		<h2><?php el('trial_create'); ?></h2>
		
		<form method="get" action="db_op.php">
			<input type="hidden" name="user_session_id" value="<?php e($user->data['session_id']); ?>" />
			<input type="hidden" name="redirect" value="<?php e(getCurrentPageRedirectUrl()); ?>" />
			<input type="hidden" name="mode" value="create_trial" />
			
			<label>
				<?php el('trial_title');?>
				<input type="text" name="trial_title" value="" />
			</label>
			
			<label>
				<?php el('trial_language');?>
				<select name="trial_language">
<?php
			foreach(getListTrialLanguages() as $language)
			{
?>					<option value="<?php e($language);?>" <?php if(UserDataHandler::getCurrentUser()->getLanguage() == $language) { ?>selected="selected"<?php } ?>>
						<?php el('language_'.$language);?>
					</option>
<?php
			}
?>
				</select>
			</label>

			<?php
			$rules_cfg = getCfg('case_rules');
			// Don't enable this checkbox until the case_rules config is added.
			if (isset($rules_cfg) && isset($rules_cfg[language_backend('#CURRENT_LANG#')]))
			{
				$rules_link = getCfg('forum_path') . 'viewtopic.php?t=' . getCfg('case_rules')[language_backend('#CURRENT_LANG#')];
			?>
			<label>
				<input type="checkbox" required name="accepted_rules">
				<?php echo lr('case_rules', array('url' => $rules_link));?>
			</label>
			<?php
			}
			?>
			
			<div class="centered">
				<input type="submit" class="big button" value="<?php el('trial_create'); ?>" />
			</div>
			
		</form>
	</section>
	
	<section>
		<h2><?php el('sequence_create'); ?></h2>
		
		<form method="get" action="db_op.php">
			<input type="hidden" name="user_session_id" value="<?php e($user->data['session_id']); ?>" />
			<input type="hidden" name="redirect" value="<?php e(getCurrentPageRedirectUrl()); ?>" />
			<input type="hidden" name="mode" value="create_sequence" />
			
			<label>
				<?php el('sequence_title');?>
				<input type="text" name="sequence_title" value="" />
			</label>
			
			<label>
				<?php el('sequence_items');?>
				<input class="trial-input"
					data-criteria="<?php e(json_encode(array(
						'authorId-is' => UserDataHandler::getCurrentUser()->getId()
					)));?>"
					type="number" name="sequence_trials[]" />
			</label>
			
			<div class="centered">
				<input type="submit" class="big button" value="<?php el('sequence_create'); ?>" />
			</div>
			
		</form>
	</section>
</section>
<?php
}

/*
 * DISPLAY SEQUENCE EDITION PANEL
 */

if(isset($_GET['edit_sequence_id']))
{
	$sequence = TrialSequenceHandler::getHandlerFor($_GET['edit_sequence_id']);
	if($sequence != null AND $sequence->canUserWrite(UserDataHandler::getCurrentUser()))
	{
?>

<section class="open">
	
	<a class="close button" href="manager.php">×</a>
	
	<h1>
		<?php e($sequence->getTitle());?>
	</h1>
	
	<div class="column c2">
	<h2><?php el('sequence_metadata');?></h2>
	
	<form method="get" action="db_op.php">
		<input type="hidden" name="user_session_id" value="<?php e($user->data['session_id']); ?>" />
		<input type="hidden" name="redirect" value="<?php e(getCurrentPageRedirectUrl()); ?>" />
		<input type="hidden" name="mode" value="edit_sequence" />
		<input type="hidden" name="sequence_id" value="<?php e($sequence->getId()); ?>" />
		
		<label>
			<?php el('sequence_title');?>
			<input type="text" name="operations[setTitle]" value="<?php e($sequence->getTitle()); ?>" />
		</label>
		
		<input type="submit" class="big" value="<?php el('save');?>" />
	</form>
	</div>
	
	<div class="column c2">
	<h2><?php el('sequence_items'); ?></h2>
	
	<ol>
<?php
		for($position = 0; $position < $sequence->getNumElts(); $position++)
		{
			$elt = $sequence->getEltAt($position);
?>		<li>
			<?php e($elt->getTitle()); ?>

			<a class="button" href="<?php echoDbOpEditSequenceUrl($sequence); ?>&amp;operations[moveUpEltAt]=<?php e($position); ?>">↑</a>
			<a class="button" href="<?php echoDbOpEditSequenceUrl($sequence); ?>&amp;operations[moveDownEltAt]=<?php e($position); ?>">↓</a>
			<a class="button" href="<?php echoDbOpEditSequenceUrl($sequence); ?>&amp;operations[removeEltAt]=<?php e($position); ?>">×</a>
		</li>
<?php
		}
?>
	</ol>
	
	<form method="get" action="db_op.php">
		<input type="hidden" name="user_session_id" value="<?php e($user->data['session_id']); ?>" />
		<input type="hidden" name="redirect" value="<?php e(getCurrentPageRedirectUrl()); ?>" />
		<input type="hidden" name="mode" value="edit_sequence" />
		<input type="hidden" name="sequence_id" value="<?php e($sequence->getId()); ?>" />
		
		<?php el('sequence_append_trial');?>
		<input class="trial-input"
			data-criteria="<?php e(json_encode(array(
				'authorId-is' => $sequence->getAuthor()->getId(),
				'language-is' => $sequence->getLanguage()
			)));?>"
			type="number" name="operations[appendTrial]" />
		<input type="submit" value="→" />
	</form>
	
	</div>
	
	<div class="centered">
		<a href="<?php echoDbOpDeleteSequenceUrl($sequence); ?>" class="big delete button"><?php el('sequence_delete'); ?></a>
	</div>

</section>
<?php
	}
}

/*
 * DISPLAY TRIAL EDITION PANEL
 */

if(isset($_GET['edit_trial_id']))
{
	$trial = TrialMetadataHandler::getHandlerFor(intval($_GET['edit_trial_id']));
	if($trial != null AND $trial->canUserRead(UserDataHandler::getCurrentUser()))
	{
?>

<section class="open">
	
	<a class="close button" href="manager.php">×</a>
	
	<h1>
		<?php e($trial->getTitle());?>
	</h1>

<?php
		// Link to editor if user has permission
		if($trial->canUserWriteContents(UserDataHandler::getCurrentUser()))
		{
?>
	<div class="centered">
		<a href="editor.php?trial_id=<?php eu($trial->getId());?>" class="big edit button"><?php el('open_editor'); ?></a>
	</div>
<?php
		}
		
		// Show metadata edition form if user has permission
		if($trial->canUserWriteMetadata(UserDataHandler::getCurrentUser()))
		{
?>
	<div class="column c2">
	<h2><?php el('trial_metadata');?></h2>
	
	<form method="get" action="db_op.php">
		<input type="hidden" name="user_session_id" value="<?php e($user->data['session_id']); ?>" />
		<input type="hidden" name="redirect" value="<?php e(getCurrentPageRedirectUrl()); ?>" />
		<input type="hidden" name="mode" value="edit_trial" />
		<input type="hidden" name="trial_id" value="<?php e($trial->getId()); ?>" />
		
		<label>
			<?php el('trial_title');?>
			<input type="text" name="operations[setTitle]" value="<?php e($trial->getTitle()); ?>" />
		</label>
			
		<label>
			<?php el('trial_language');?>
			<select name="operations[setLanguage]">
<?php
			foreach(getListTrialLanguages() as $language)
			{
?>				<option value="<?php e($language);?>" <?php if($trial->getLanguage() == $language) { ?>selected="selected"<?php } ?>>
					<?php el('language_'.$language);?>
				</option>
<?php
			}
?>
			</select>
		</label>
			
		<label>
			<?php el('trial_released');?>
			<select name="operations[setPublic]">
				<option value="0"><?php el('no');?></option>
				<option value="1" <?php if($trial->isPublic()){ ?>selected="selected"<?php }?>><?php el('yes');?></option>
			</select>
		</label>
		
		<input type="submit" class="big" value="<?php el('save');?>" />
	</form>
	</div>
	
	<div class="column c2">
	<h2><?php el('trial_collabs');?></h2>
<?php
			$collabs = $trial->getCollaborators();
			foreach($collabs as $collab)
			{
				echoUserLink($collab);
?>
				<a class="delete button" href="<?php echoDbOpEditTrialUrl($trial); ?>&amp;operations[removeCollaborator][]=<?php e($collab->getId()); ?>">×</a><br />
<?php
			}
?>

	<form method="get" action="db_op.php">
		<input type="hidden" name="user_session_id" value="<?php e($user->data['session_id']); ?>" />
		<input type="hidden" name="redirect" value="<?php e(getCurrentPageRedirectUrl()); ?>" />
		<input type="hidden" name="mode" value="edit_trial" />
		<input type="hidden" name="trial_id" value="<?php eu($trial->getId()); ?>" />
		
		<?php el('trial_add_collab');?>
		<input class="user-input" type="number" name="operations[addCollaborator][]" />
		<input type="submit" value="→" />
	</form>
	
	<h2><?php el('trial_playtesters');?></h2>
<?php
			$playtesters = $trial->getPlaytesters();
			foreach($playtesters as $playtester)
			{
				echoUserLink($playtester);
?>
				<a class="delete button" href="<?php echoDbOpEditTrialUrl($trial); ?>&amp;operations[removePlaytester][]=<?php e($playtester->getId()); ?>">×</a><br />
<?php
			}
?>

	<form method="get" action="db_op.php">
		<input type="hidden" name="user_session_id" value="<?php e($user->data['session_id']); ?>" />
		<input type="hidden" name="redirect" value="<?php e(getCurrentPageRedirectUrl()); ?>" />
		<input type="hidden" name="mode" value="edit_trial" />
		<input type="hidden" name="trial_id" value="<?php eu($trial->getId()); ?>" />
		
		<?php el('trial_add_playtester');?>
		<input class="user-input" type="number" name="operations[addPlaytester][]" />
		<input type="submit" value="→" />
	</form>
	</div>
	
	<div class="centered">
		<a href="<?php echoDbOpDeleteTrialUrl($trial); ?>" class="big delete button"><?php el('trial_delete'); ?></a>
	</div>
<?php
		}
		
		// Backup management if user has permission
		if($trial->canUserWriteContents(UserDataHandler::getCurrentUser()))
		{
?>
	<div>
	<h2><?php el('trial_backups'); ?></h2>
	<h3><?php el('backups_auto');?></h3>
	<ul>
<?php
			foreach($trial->getAutoBackups() as $date => $backup)
			{
?>		<li>
			<?php e(date("d/m/Y - H:i", $date)); ?> <a href="editor.php?trial_id=<?php eu($trial->getId());?>&amp;trial_backup_type=auto&amp;trial_backup_date=<?php eu($date);?>" class="edit button"><?php el('open_editor'); ?></a>
		</li>
<?php
			}
?>	</ul>
	
	<h3><?php el('backups_manual');?></h3>
	<ul>
<?php
			foreach($trial->getManualBackups() as $date => $backup)
			{
?>		<li>
			<?php e(date("d/m/Y - H:i", $date)); ?> 
			<a href="editor.php?trial_id=<?php eu($trial->getId());?>&amp;trial_backup_type=manual&amp;trial_backup_date=<?php eu($date);?>" class="edit button"><?php el('open_editor'); ?></a>
			<a href="<?php echoDbOpDeleteBackupUrl($trial, $date); ?>" class="delete button">×</a>
		</li>
<?php
			}
?>	</ul>
	
	<a class="edit button" href="<?php echoDbOpCreateBackupUrl($trial); ?>"><?php el('backups_manual_create'); ?></a>
	
	</div>
<?php
		}
?>
</section>
<?php
	}
}

/*
 * END OF MANAGER DISPLAY
 */

layout_footer();

?>
