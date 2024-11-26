<?php

language_load_file('trial');

function echoDbOpEditTrialUrl($trial)
{
	echoDbOpUrl();?>&amp;mode=edit_trial&amp;trial_id=<?php eu($trial->getId());
}

function echoDbOpDeleteTrialUrl($trial)
{
	echoDbOpUrl();?>&amp;mode=delete_trial&amp;trial_id=<?php eu($trial->getId());
}

function echoDbOpCreateBackupUrl($trial)
{
	echoDbOpUrl();?>&amp;mode=create_backup&amp;trial_id=<?php eu($trial->getId());
}

function echoDbOpDeleteBackupUrl($trial, $backup_date)
{
	echoDbOpUrl();?>&amp;mode=delete_backup&amp;trial_id=<?php eu($trial->getId());?>&amp;backup_date=<?php eu($backup_date);
}

function echoDbOpEditSequenceUrl($sequence)
{
	echoDbOpUrl();?>&amp;mode=edit_sequence&amp;sequence_id=<?php eu($sequence->getId());
}

function echoDbOpDeleteSequenceUrl($sequence)
{
	echoDbOpUrl();?>&amp;mode=delete_sequence&amp;sequence_id=<?php eu($sequence->getId());
}

// Featured trial icon
function echoFeaturedIcon($trial)
{
	if($trial->isUserAdmin(UserDataHandler::getCurrentUser()))
	{
		if($trial->isFeatured())
		{
			$icon = '★';
			$target_value = 0;
		}
		else
		{
			$icon = '☆';
			$target_value = 1;
		}
		
?>	<a class="featured-icon" href="<?php echoDbOpEditTrialUrl($trial); ?>&amp;operations[setFeatured]=<?php eu($target_value); ?>"><?php e($icon); ?></a>
<?php
	}
	elseif($trial->isFeatured())
	{
?>	<span class="featured-icon">★</span>
<?php
	}
}
 
// Trial card
function layout_trialCard($trial)
{
?>
	<div class="trial-card">
<?php
	echoFeaturedIcon($trial)
?>
		<h4><?php e($trial->getTitle());?></h4>
		<dl class="trial-data">
			<dt><?php el('trial_author');?></dt>
			<dd>
				<?php echoUserLink($trial->getAuthor());?>
			</dd>
<?php
	$collabs = $trial->getCollaborators();
	if(count($collabs) > 0)
	{
?>			<dt><?php el('trial_collabs');?></dt>
			<dd class="link-list">
<?php
		foreach($collabs as $collab)
		{
			echoUserLink($collab);
		}
?>
			</dd>
<?php
	}
?>
		</dl>
		<div class="trialCard_buttons">
<?php
	if($trial->canUserWriteMetadata(UserDataHandler::getCurrentUser())
		OR $trial->canUserWriteContents(UserDataHandler::getCurrentUser()))
	{
		// If permission to edit trial, link to manager edit page
?>
			<a href="manager.php?edit_trial_id=<?php eu($trial->getId());?>" class="edit button"><?php el('edit'); ?></a>
			<a href="player.php?trial_id=<?php eu($trial->getId());?>&amp;debug" class="playtest button"><?php el('playtest');?></a>
<?php
	}
	
	if($trial->canUserRead(UserDataHandler::getCurrentUser()))
	{
?>
			<a href="player.php?trial_id=<?php eu($trial->getId());?>" class="play button"><?php el('play'); ?></a>
<?php
	}
?>
		</div>
	</div>
<?php
}

function layout_trialMoreInfo($trial)
{
?>
	<dl class="trial-data more-info">
<?php
	if(($sequence = $trial->getParentSequence()) != null)
	{
?>
		<dt><?php el('trial_sequence');?></dt>
		<dd>
			<a href="search.php?search&amp;criteria[sequenceId-is]=<?php eu($sequence->getId()); ?>">
			<?php e($sequence->getTitle());?>
			</a>
		</dd>
<?php
	}
?>
		<dt><?php el('trial_language');?></dt>
		<dd><?php e($trial->getLanguage());?></dd>
		<dt><?php el('trial_creation_date');?></dt>
		<dd><?php e(date(l('date_format'), $trial->getCreationDate()));?></dd>
<?php
	if($trial->isPublic())
	{
?>
		<dt><?php el('trial_release_date');?></dt>
		<dd><?php e(date(l('date_format'), $trial->getReleaseDate()));?></dd>
<?php
	}
?>
	</dl>
<?php
}


function layout_sequence($sequence, $depth=-1)
{
?>
	<h4>
<?php
	e($sequence->getTitle());
	
	if($sequence->canUserWrite(UserDataHandler::getCurrentUser()))
	{
?>
		<a href="manager.php?edit_sequence_id=<?php eu($sequence->getId());?>" class="edit button"><?php el('edit'); ?></a>
<?php
	}
?>
	</h4>
<?php
	if($depth != 0)
	{
?>
	<ol class="trial-list">
<?php
		for($i = 0; $i < $sequence->getNumElts(); $i++)
		{
			$elt = $sequence->getEltAt($i);
			if($elt->canUserRead(UserDataHandler::getCurrentUser()))
			{
				if($elt instanceof TrialSequenceHandler)
				{
?>
		<li class="sequence">
<?php
					layout_sequence($elt, $depth - 1);
?>
		</li>
<?php
				}
				else
				{
?>
		<li class="trial left">
<?php
					layout_trialCard($elt);
					layout_trialMoreInfo($elt);
?>
		</li>
<?php
				}
			}
		}
?>
	</ol>
<?php
	}
?>
<?php
}
?>
