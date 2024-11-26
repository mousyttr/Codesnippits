<?php
/*
Abstract class defining methods to manipulate a trial record in database.
*/

abstract class TrialMetadataHandler extends SequenceElement
{
	// Cache generated handlers to avoid multiple DB queries
	private static $result_cache = array();
	
	public static function getHandlerFor($trial_id)
	{
		if(!$trial_id)
		{
			return null;
		}
		
		if(array_key_exists($trial_id, self::$result_cache))
		{
			return self::$result_cache[$trial_id];
		}
		
		try 
		{
			$trial_handler = new TrialMetadataHandlerV5($trial_id);
			if($trial_handler->exists())
			{
				self::$result_cache[$trial_id] = $trial_handler;
				return $trial_handler;
			}
			else
			{
				self::$result_cache[$trial_id] = null;
				return null;
			}
		}
		catch(Exception $e)
		{
			return null;
		}
	}
	// Cache a provided trial instance manually, if it was instantiated elsewhere
	public static function cache($trial_handler)
	{
		return (self::$result_cache[$trial_handler->getId()] = $trial_handler);
	}
	
	// Create a new trial
	public static function create($author, $title, $language)
	{
		if(!UserDataHandler::getCurrentUser()->isActive())
		{
			throw new Exception('error_user_inactive');
		}
		
		if(!in_array($language, getListTrialLanguages()))
		{
			throw new Exception('error_user_language_unavailable');
		}
		
		if(UserDataHandler::getCurrentUser()->getId() != $author->getId()
			AND !self::isUserAdminOver(UserDataHandler::getCurrentUser(), $language)
		)
		{
			throw new Exception('error_perms_trial_create_someone_else');
		}
		
		TrialMetadataHandlerV5::create($author, $title, $language);
	}
	
	/*
	 * Get relationship between this trial and a user
	 */
	public function isUserCollaborator($user)
	{
		foreach($this->getCollaborators() as $collab)
		{
			if($collab->getId() == $user->getId())
			{
				return true;
			}
		}
		return false;
	}
	public function isUserPlaytester($user)
	{
		foreach($this->getPlaytesters() as $collab)
		{
			if($collab->getId() == $user->getId())
			{
				return true;
			}
		}
		return false;
	}
	private static function isUserAdminOver($user, $language)
	{
		$user_id = $user->getId();
		$admins = getCfg('admins');
		return in_array($user_id, $admins[$language]) OR in_array($user_id, $admins['all']);
	}
	public final function isUserAdmin($user)
	{
		return self::isUserAdminOver($user, $this->getLanguage());
	}
	public final function isUserOwner($user)
	{
		return ($this->getAuthor()->getId() == $user->getId());
	}
	
	/*
	 * Get permissions of a user over this trial
	 */
	public final function canUserRead($user)
	{
		return
			$this->isPublic() OR (
				$user->isActive() AND (
					$this->isUserPlaytester($user) OR
					$this->isUserCollaborator($user) OR
					$this->isUserOwner($user) OR
					$this->isUserAdmin($user)
				)
			);
	}
	
	public final function canUserWriteContents($user)
	{
		return
			$user->isActive() AND (
				$this->isUserCollaborator($user) OR
				$this->isUserOwner($user) OR
				$this->isUserAdmin($user)
			);
	}
	
	public final function canUserWriteMetadata($user)
	{
		return
			$user->isActive() AND (
				$this->isUserOwner($user) OR
				$this->isUserAdmin($user)
			);
	}
	
	/*
	 * Check if the trial actually exists
	 */
	public abstract function exists();
	
	/*
	 * Get data about the trial itself
	 */
	public abstract function getId();
	public abstract function getTitle();
	public abstract function getLanguage();
	public abstract function getAuthor();
	public abstract function getCreationDate();
	public abstract function getReleaseDate();
	public abstract function isPublic();
	public abstract function isFeatured();
	public abstract function getCollaborators();
	public abstract function getPlaytesters();
	
	protected abstract function getSequenceId();
	
	private $sequence = -1;
	public final function getParentSequence()
	{
		if($this->sequence === -1)
		{
			$this->sequence = TrialSequenceHandler::getHandlerFor($this->getSequenceId());
		}
		return $this->sequence;
	}
	
	/*
	 * Check permissions for protected methods
	 */
	public function __call($method_name, $args)
	{
		switch($method_name)
		{
			case 'getTrialFile':
				if(!$this->canUserRead(UserDataHandler::getCurrentUser()))
				{
					throw new Exception('error_perms_trial_read');
				}
				break;
			
			case 'getAutoBackups':
			case 'deleteAutoBackup':
			case 'getNewAutoBackup':
			case 'getManualBackups':
			case 'deleteManualBackup':
			case 'getNewManualBackup':
				if(!$this->canUserWriteContents(UserDataHandler::getCurrentUser()))
				{
					throw new Exception('error_perms_trial_manage_backups');
				}
				break;
			
			case 'setAuthor':
			case 'setFeatured':
				if(!$this->isUserAdmin(UserDataHandler::getCurrentUser()))
				{
					throw new Exception('error_perms_trial_edit_secured_metadata');
				}
				break;
			
			case 'save':
			case 'delete':
				if(!$this->canUserWriteMetadata(UserDataHandler::getCurrentUser()))
				{
					throw new Exception('error_perms_trial_edit_metadata');
				}
				break;
			
			default:
				throw new Exception('Method ' . $method_name . ' does not exist or is not visible.');
				break;
		}
		
		// If call not intercepted, forward it to the real method.
		return call_user_func_array(array($this, $method_name), $args);
	}
	
	/*
	 * File and backup management
	 */
	protected abstract function getTrialFile();
	protected abstract function getAutoBackups();
	protected abstract function deleteAutoBackup($backup_date);
	protected abstract function getNewAutoBackupFile();
	protected final function getNewAutoBackup()
	{
		$backups = $this->getAutoBackups();
		$backup_dates = array_keys($backups);
		
		if(empty($backup_dates) || time() - max($backup_dates) > getCfg('backups_auto_min_delay'))
		{
			// Check enough time since last backup before actually creating the file.
			$new_backup = $this->getNewAutoBackupFile();
			
			// Delete old backups to preserve max number of auto backups.
			$backups = $this->getAutoBackups();
			$backup_dates = array_keys($backups);
			sort($backup_dates);
			for($i = 0; $i < count($backup_dates) - getCfg('backups_auto_max_num'); $i++)
			{
				$this->deleteAutoBackup($backup_dates[$i]);
			}
		}
		else
		{
			return null;
		}
	}
	protected abstract function getManualBackups();
	protected abstract function deleteManualBackup($backup_date);
	protected abstract function getNewManualBackupFile();
	protected final function getNewManualBackup()
	{
		$backups = $this->getManualBackups();
		if(count($backups) >= getCfg('backups_man_max_num'))
		{
			throw new Exception('error_user_trial_backup_no_slot');
		}
		
		return $this->getNewManualBackupFile();
	}
	
	/*
	 * Set trial's metadata
	 */
	private $updates = array();
	
	public final function setTitle($title)
	{
		if($title == $this->getTitle())
		{
			return;
		}
		
		$this->updates['title'] = $title;
	}
	
	public final function setLanguage($lang)
	{
		if($lang == $this->getLanguage())
		{
			return;
		}
		
		if(!in_array($lang, getListTrialLanguages()))
		{
			throw new Exception('error_user_language_unavailable');
		}
		$this->updates['lang'] = $lang;
	}
	
	public final function setAuthor($user)
	{
		if($user->getId() == $this->getAuthor()->getId())
		{
			return;
		}
		
		$this->updates['author'] = $user;
	}
	
	public final function setPublic($public)
	{
		if($public == $this->isPublic())
		{
			return;
		}
		
		$this->updates['public'] = $public;
	}
	
	public final function setFeatured($featured)
	{
		if($featured == $this->isFeatured())
		{
			return;
		}
		
		$this->updates['featured'] = $featured;
	}
	
	private function ensureUpdateArrayIsSet($lvl1, $lvl2)
	{
		if(!isset($this->updates[$lvl1]))
		{
			$this->updates[$lvl1] = array();
		}
		if(!isset($this->updates[$lvl1][$lvl2]))
		{
			$this->updates[$lvl1][$lvl2] = array();
		}
	}
	
	public final function addCollaborator($user)
	{
		if($this->isUserCollaborator($user))
		{
			return;
		}
		
		$this->ensureUpdateArrayIsSet('collab', 'add');
		$this->updates['collab']['add'][] = $user;
	}
	
	public final function removeCollaborator($user)
	{
		$this->ensureUpdateArrayIsSet('collab', 'remove');
		$this->updates['collab']['remove'][] = $user;
	}
	
	public final function addPlaytester($user)
	{
		if($this->isUserPlaytester($user))
		{
			return;
		}
		
		$this->ensureUpdateArrayIsSet('playtester', 'add');
		$this->updates['playtester']['add'][] = $user;
	}
	
	public final function removePlaytester($user)
	{
		$this->ensureUpdateArrayIsSet('playtester', 'remove');
		$this->updates['playtester']['remove'][] = $user;
	}
	
	protected final function save()
	{
		$this->commitChanges($this->updates);
		$this->updates = array();
	}
	
	// The way of actually committing changes to the DB depends on the implementation
	protected abstract function commitChanges($updates);
	
	/*
	 * Delete trial
	 */
	protected abstract function delete();
}

?>
