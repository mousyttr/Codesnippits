<?php
/*
Manipulate a trial record in V5 database.
*/

class TrialMetadataHandlerV5 extends TrialMetadataHandler
{
	// Constants related to trial data DB
	public static $DBV5_TRIALS_TABLE = 'liste_proces';
	public static $DBV5_TRIALS_ID = 'id';
	public static $DBV5_TRIALS_TITLE = 'titre';
	public static $DBV5_TRIALS_AUTHOR = 'auteur';
	public static $DBV5_TRIALS_COLLAB = 'collaborateurs';
	public static $DBV5_TRIALS_LANG = 'langue';
	public static $DBV5_TRIALS_FILENAME = 'fichier';
	public static $DBV5_TRIALS_PUBLIC = 'jouable';
	public static $DBV5_TRIALS_FEATURED = 'star';
	public static $DBV5_TRIALS_GROUP = 'groupe';
	public static $DBV5_TRIALS_POSITION = 'position';
	
	public static function decodeV5String($string)
	{
		$convmap = array(0x0, 0x2FFFF, 0, 0xFFFF);
		
		// In V5 Database, non ascii characters are encoded as HTML entities. Decode them.
		$decoded_string = mb_decode_numericentity($string, $convmap, 'UTF-8');
		$decoded_string = str_replace('&apos;', "'", $decoded_string);
		$decoded_string = html_entity_decode($decoded_string, ENT_COMPAT, 'UTF-8');
		
		return $decoded_string;
	}
	
	public static function encodeV5String($string)
	{
		$convmap = array(0xFF, 0x2FFFF, 0, 0xFFFF);
		
		$html_encoded_string = htmlentities($string, ENT_COMPAT, 'UTF-8');
		$html_encoded_string = str_replace("'", '&apos;', $html_encoded_string);
		$html_encoded_string = mb_encode_numericentity($html_encoded_string, $convmap, 'UTF-8');
		
		return $html_encoded_string;
	}
	
	private $trial_id;
	private $trial_db_entry = null;
	private $trial_exists = null;
	
	function __construct($trial_id, $preloaded_trial_data = null)
	{
		$this->trial_id = intval($trial_id);
		
		if($preloaded_trial_data != null)
		{
			$this->trial_db_entry = $preloaded_trial_data;
		}
		else
		{
			$this->trial_db_entry = array(self::$DBV5_TRIALS_ID => $this->trial_id);
		}
	}
	
	public function exists()
	{
		if($this->trial_exists === null)
		{
			$this->refreshData();
		}
		return $this->trial_exists;
	}
	
	public function getId()
	{
		return $this->trial_id;
	}
	
	public function getTitle()
	{
		return self::decodeV5String($this->getField(self::$DBV5_TRIALS_TITLE));
	}
	
	public function getLanguage()
	{
		return $this->getField(self::$DBV5_TRIALS_LANG);
	}
	
	private $author = null;
	public function getAuthor()
	{
		if($this->author == null)
		{
			$author_id = $this->getField(self::$DBV5_TRIALS_AUTHOR);
			
			if(isset($this->trial_db_entry[UserDataHandler::$DB_USERS_NAME]))
			{
				// If author name is already known, include it as preloaded
				$author_name = $this->getField(UserDataHandler::$DB_USERS_NAME);
				
				$this->author = UserDataHandler::getHandlerFor($author_id, array(UserDataHandler::$DB_USERS_ID => $author_id, UserDataHandler::$DB_USERS_NAME => $author_name));
			}
			else
			{
				// Otherwise, just create a minimal user handler, it will load required info only when needed
				$this->author = UserDataHandler::getHandlerFor($author_id);
			}
		}
		
		return $this->author;
	}
	
	public function getCreationDate()
	{
		$creation_time = explode('_', $this->getFileName());
		return intval($creation_time[0]);
	}
	
	public function getReleaseDate()
	{
		return $this->getTrialFile()->getLastModificationDate();
	}
	
	public function isPublic()
	{
		return ($this->getField(self::$DBV5_TRIALS_PUBLIC) == 1);
	}
	
	public function isFeatured()
	{
		return ($this->getField(self::$DBV5_TRIALS_FEATURED) == 1);
	}
	
	private function buildCollabList($delimiter)
	{
		$split_collabs_field = explode(',', self::decodeV5String($this->getField(self::$DBV5_TRIALS_COLLAB)));
		$collabs = array();
		
		foreach($split_collabs_field as $collab_string)
		{
			$collab_data = explode($delimiter, $collab_string);
			if(count($collab_data) == 2)
			{
				$collab_name = $collab_data[0];
				$collab_id = intval($collab_data[1]);
				
				if($collab_id > 0)
				{
					$collabs[] = UserDataHandler::getHandlerFor($collab_id, array(UserDataHandler::$DB_USERS_ID => $collab_id, UserDataHandler::$DB_USERS_NAME => $collab_name));
				}
			}
		}
		
		return $collabs;
	}
	
	public function getCollaborators()
	{
		return $this->buildCollabList('[');
	}
	
	public function getPlaytesters()
	{
		return $this->buildCollabList('[!');
	}
	
	public static function getV5SequenceId($author_id, $lang, $title)
	{
		return $author_id . '_' . $lang . '_' . $title;
	}
	
	protected function getSequenceId()
	{
		if($this->getField(self::$DBV5_TRIALS_GROUP) == '')
		{
			return '';
		}
		else
		{
			return self::getV5SequenceId($this->getField(self::$DBV5_TRIALS_AUTHOR), $this->getField(self::$DBV5_TRIALS_LANG), self::decodeV5String($this->getField(self::$DBV5_TRIALS_GROUP)));
		}
	}
	
	// Get trial file handler for this trial
	private function getFileName()
	{
		return $this->getField(self::$DBV5_TRIALS_FILENAME);
	}
	private function getFilePath()
	{
		return getCfg('trialdata_dir') . $this->getFileName() . '.txt';
	}
	private function getBackupListFilePath($list_type)
	{
		return getCfg('trialdata_backups_dir') . $this->getFileName() . '_' . $list_type . '.txt';
	}
	private function getBackupFilePath($file_type, $backup_date)
	{
		return getCfg('trialdata_backups_dir') . $this->getFileName() . '_' . $file_type . '_' . $backup_date . '.txt';
	}
	private function getBackups($list_type, $file_type)
	{
		if(!file_exists($this->getBackupListFilePath($list_type)))
		{
			return array();
		}
		$backup_list = file($this->getBackupListFilePath($list_type), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		
		$backups_by_date = array();
		foreach($backup_list as $backup_date)
		{
			$backups_by_date[$backup_date] = new TrialFileHandler($this->getBackupFilePath($file_type, $backup_date), $this, true);
		}
		
		return $backups_by_date;
	}
	private function getNewBackup($list_type, $file_type)
	{
		$backup_list_path = $this->getBackupListFilePath($list_type);
		if(!file_exists($backup_list_path))
		{
			// In case backup does not exist yet, create it, and create new backup file.
			mkdir(dirname($backup_list_path), 0777, true);
			touch($backup_list_path);
		}
		$backups = $this->getBackups($list_type, $file_type);
		
		// Determine backup date
		$new_backup_date = time();
		while(array_key_exists($new_backup_date, $backups))
		{
			// Make sure key is unique, so tweak date if necessary.
			$new_backup_date++;
		}
		
		// Create backup by copying current trial file.
		$new_file_path = $this->getBackupFilePath($file_type, $new_backup_date);
		copy($this->getFilePath(), $new_file_path);
		
		// Update backup list and return new backup handler
		$backups[$new_backup_date] = new TrialFileHandler($new_file_path, $this, true);
		file_put_contents($backup_list_path, implode("\n", array_keys($backups)));
		return $backups[$new_backup_date];
	}
	private function deleteBackup($list_type, $file_type, $backup_date)
	{
		$backups = $this->getBackups($list_type, $file_type);
		
		if(array_key_exists($backup_date, $backups))
		{
			$backups[$backup_date]->delete();
			unset($backups[$backup_date]);
			file_put_contents($this->getBackupListFilePath($list_type), implode("\n", array_keys($backups)));
		}
	}
	
	protected function getTrialFile()
	{
		return new TrialFileHandler($this->getFilePath(), $this);
	}
	
	protected function getAutoBackups()
	{
		return $this->getBackups('backups', 'backup');
	}
	protected function deleteAutoBackup($backup_date)
	{
		return $this->deleteBackup('backups', 'backup', $backup_date);
	}
	protected function getNewAutoBackupFile()
	{
		return $this->getNewBackup('backups', 'backup');
	}
	protected function getManualBackups()
	{
		return $this->getBackups('backups_manuels', 'backup_man');
	}
	protected function deleteManualBackup($backup_date)
	{
		return $this->deleteBackup('backups_manuels', 'backup_man', $backup_date);
	}
	protected function getNewManualBackupFile()
	{
		return $this->getNewBackup('backups_manuels', 'backup_man');
	}
	
	// Override parent method to improve performance
	public function isUserCollaborator($user)
	{
		return (strpos($this->getField(self::$DBV5_TRIALS_COLLAB), $this->getEncapsulatedCollabId('collab', $user)) !== false);
	}
	
	// Override parent method to improve performance
	public function isUserPlaytester($user)
	{
		return (strpos($this->getField(self::$DBV5_TRIALS_COLLAB), $this->getEncapsulatedCollabId('playtester', $user)) !== false);
	}
	
	
	/*
	 * Methods to read data from the database when needed
	 */
	private function refreshData()
	{
		global $db;
		
		$query = 'SELECT * FROM ' . self::$DBV5_TRIALS_TABLE . '
			LEFT JOIN ' . USERS_TABLE . '
			ON ' . self::$DBV5_TRIALS_TABLE . '.' . self::$DBV5_TRIALS_AUTHOR .' = ' . USERS_TABLE . '.' . UserDataHandler::$DB_USERS_ID . '
			WHERE ' . self::$DBV5_TRIALS_ID . '=' . $this->trial_id;
		
		$trial_result = $db->sql_query($query);
		$this->trial_db_entry = $db->sql_fetchrow($trial_result);
		
		$this->trial_exists = ($this->trial_db_entry != null);
	}
	
	private function getField($field_name)
	{
		// If field is not loaded, reload all trial data
		if(!isset($this->trial_db_entry[$field_name]))
		{
			$this->refreshData();
		}
		
		return $this->trial_db_entry[$field_name];
	}
	
	/*
	 * Commit a list of changes to the V5 database
	 */
	protected function commitChanges($updates)
	{
		global $db;
		
		$query_fields = '';
		
		if(isset($updates['title']))
		{
			$query_fields .= self::$DBV5_TRIALS_TITLE . '= \'' . $db->sql_escape(self::encodeV5String($updates['title'])) . '\',';
		}
		if(isset($updates['lang']))
		{
			if($this->getField(self::$DBV5_TRIALS_GROUP) != '')
			{
				throw new Exception('error_tech_v5_trial_language_edit_in_sequence');
			}
			$query_fields .= self::$DBV5_TRIALS_LANG . '= \'' . $db->sql_escape($updates['lang']) . '\',';
		}
		if(isset($updates['public']))
		{
			$query_fields .= self::$DBV5_TRIALS_PUBLIC . '= \'' . ($updates['public'] ? 1 : 0) . '\',';
		}
		if(isset($updates['featured']))
		{
			$query_fields .= self::$DBV5_TRIALS_FEATURED . '= \'' . ($updates['featured'] ? 1 : 0) . '\',';
		}
		if(isset($updates['author']))
		{
			if($this->getField(self::$DBV5_TRIALS_GROUP) != '')
			{
				throw new Exception('error_tech_v5_trial_author_edit_in_sequence');
			}
			$query_fields .= self::$DBV5_TRIALS_AUTHOR . '= \'' . $updates['author']->getId() . '\',';
		}
		$collab_update = $this->getNewCollabFieldValue($updates);
		if($collab_update !== null)
		{
			$query_fields .= self::$DBV5_TRIALS_COLLAB . '= \'' . $db->sql_escape(self::encodeV5String($collab_update)) . '\',';
		}
		
		if($query_fields != '')
		{
			$query_fields = trim($query_fields, ',');
			
			$query = 'UPDATE ' . self::$DBV5_TRIALS_TABLE . '
				SET ' . $query_fields . '
				WHERE ' . self::$DBV5_TRIALS_ID . '=' . $this->trial_id;
			
			$db->sql_query($query);
		}
	}
	
	// Return null if no change required
	private function getNewCollabFieldValue($updates)
	{
		$current_value = $this->getField(self::$DBV5_TRIALS_COLLAB);
		
		$new_value = $current_value;
		
		foreach(array('collab', 'playtester') as $collab_type)
		{
			if(isset($updates[$collab_type]))
			{
				if(isset($updates[$collab_type]['remove']))
				{
					foreach($updates[$collab_type]['remove'] as $collab)
					{
						$new_value = preg_replace('#(?<=^|,)[^,\\[\\]]+' . preg_quote(self::getEncapsulatedCollabId($collab_type, $collab), '#') . '(,|$)#', '', $new_value);
					}
				}
				
				if(isset($updates[$collab_type]['add']))
				{
					foreach($updates[$collab_type]['add'] as $collab)
					{
						$new_value = self::getCollabString($collab_type, $collab) . ',' . $new_value;
					}
				}
			}
		}
		
		if($new_value == $current_value)
		{
			return null;
		}
		else
		{
			return trim($new_value, ',');
		}
	}
	
	private static function getEncapsulatedCollabId($collab_type, $collab)
	{
		switch($collab_type)
		{
			case 'collab':
				return '[' . $collab->getId() . ']';
				break;
			case 'playtester':
				return '[!' . $collab->getId() . '!]';
				break;
		}
	}
	
	public static function cleanCollabName($name)
	{
		return str_replace(array('[', ']', ','), array('', '', ''), $name);
	}
	
	private static function getCollabString($collab_type, $collab)
	{
		$clean_collab_name = self::cleanCollabName($collab->getName());
		
		return $clean_collab_name . self::getEncapsulatedCollabId($collab_type, $collab);
	}
	
	/*
	 * Create a new trial in V5 DB and file system
	 */
	public static function create($author, $title, $language)
	{
		global $db;
		
		$filename = time() . '_' . md5(md5($author->getId() . $title) . time());
		
		$query = 'INSERT INTO ' . self::$DBV5_TRIALS_TABLE . '
			VALUES(
				NULL,
				"' . $db->sql_escape(self::encodeV5String($title)) . '",
				' . intval($author->getId()) . ',
				"' . $db->sql_escape($filename) . '",
				0,
				"",
				"' . $db->sql_escape($language) . '",
				0,
				"",
				0
			)';
		
		$db->sql_query($query);
		
		$filepath = getCfg('trialdata_dir') . $filename . '.txt';
		touch($filepath);
	}
	
	/*
	 * Delete this trial
	 */
	protected function delete()
	{
		global $db;
		
		$auto_backups_file_path = $this->getBackupListFilePath('backups');
		if(file_exists($auto_backups_file_path))
		{
			foreach($this->getAutoBackups() as $backup)
			{
				$backup->delete();
			}
			
			unlink($auto_backups_file_path);
		}
		
		$man_backups_file_path = $this->getBackupListFilePath('backups_manuels');
		if(file_exists($man_backups_file_path))
		{
			foreach($this->getManualBackups() as $backup)
			{
				$backup->delete();
			}
			
			unlink($man_backups_file_path);
		}
		
		$this->getTrialFile()->delete(true, $this->getAuthor()->getId() . '_');
		
		$query = 'DELETE FROM ' . self::$DBV5_TRIALS_TABLE . '
			WHERE ' . self::$DBV5_TRIALS_ID . '=' . intval($this->trial_id);
		
		$db->sql_query($query);
		
		$this->trial_id = null;
		$this->trial_db_entry = null;
		$this->trial_exists = false;
	}
}

?>
