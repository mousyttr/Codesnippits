<?php
/*
Manipulate a trial sequence in V5 database.
*/

class TrialSequenceHandlerV5 extends TrialSequenceHandler
{
	private static function extractV5SequenceInfo($sequence_id)
	{
		$elements = explode('_', $sequence_id, 3);
		$elements[2] = TrialMetadataHandlerV5::encodeV5String($elements[2]);
		return $elements;
	}
	
	private $id;
	private $title;
	private $author;
	private $lang;
	private $trial_list;
	
	function __construct($sequence_id)
	{
		global $db;
		
		$this->id = $sequence_id;
		
		list($author_id, $lang, $group_name) = self::extractV5SequenceInfo($sequence_id);
		
		$query = 'SELECT * FROM ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			LEFT JOIN ' . USERS_TABLE . '
			ON ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '.' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR .' = ' . USERS_TABLE . '.' . UserDataHandler::$DB_USERS_ID . '
			WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR . ' = ' . $author_id . '
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_LANG . ' = \'' . $db->sql_escape($lang) . '\'
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . ' = \'' . $db->sql_escape($group_name) . '\'
			ORDER BY ' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION;
		
		$trial_list_result = $db->sql_query($query);
		
		$this->trial_list = array();
		while($trial_row = $db->sql_fetchrow($trial_list_result))
		{
			$this->trial_list[] = TrialMetadataHandler::cache(new TrialMetadataHandlerV5($trial_row[TrialMetadataHandlerV5::$DBV5_TRIALS_ID], $trial_row));
		}
		
		if(count($this->trial_list) == 0)
		{
			throw new Exception('error_tech_v5_sequence_empty');
		}
		
		$this->title = $group_name;
		$this->author = UserDataHandler::getHandlerFor($author_id);
		$this->lang = $lang;
	}
	
	public function getId()
	{
		return $this->id;
	}
	
	public function getTitle()
	{
		return TrialMetadataHandlerV5::decodeV5String($this->title);
	}
	
	public function getAuthor()
	{
		return $this->author;
	}
	
	public function getLanguage()
	{
		return $this->lang;
	}
	
	public function getEltAt($position)
	{
		return $this->trial_list[$position];
	}
	
	public function getNumElts()
	{
		return count($this->trial_list);
	}
	
	/*
	 * Create maps from ID to database position, and back.
	 * Do NOT use this method unless strictly necessary - its behaviour is inconsistent with the actual sequence structure.
	 */
	public function createIdPosMap()
	{
		global $db;
		
		// Build the map of trial IDs by given position using the ugly V5 player algorithm.
		// Multiple trials can have the same position, so the maps don't invert.
		
		$this->trial_id_by_pos = array();
		$this->trial_pos_by_id = array();
		
		$query = 'SELECT * FROM ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			LEFT JOIN ' . USERS_TABLE . '
			ON ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '.' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR .' = ' . USERS_TABLE . '.' . UserDataHandler::$DB_USERS_ID . '
			WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR . ' = ' . intval($this->author->getId()) . '
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . ' = \'' . $db->sql_escape($this->title) . '\'
			ORDER BY ' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION;
		
		$trial_list_result = $db->sql_query($query);
		while($trial_row = $db->sql_fetchrow($trial_list_result))
		{
			$this->trial_id_by_pos[$trial_row[TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION]] = $trial_row[TrialMetadataHandlerV5::$DBV5_TRIALS_ID];
			$this->trial_pos_by_id[$trial_row[TrialMetadataHandlerV5::$DBV5_TRIALS_ID]] = $trial_row[TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION];
			}
	}
	
	/* 
	 * Fetch ID of the element at a given position.
	 * Do NOT use this method unless strictly necessary - its behaviour is inconsistent with the actual sequence structure.
	 */
	public function getIdOfEltAt($position)
	{
		if(!isset($this->trial_id_by_pos))
		{
			self::createIdPosMap();
		}

		if(isset($this->trial_id_by_pos[$position]))
		{
			return $this->trial_id_by_pos[$position];
		}
		else
		{
			return 0;
		}
	}
	
	/*
	 * Fetch database position of the element at a given position.
	 * Do NOT use this method unless strictly necessary - its behaviour is inconsistent with the actual sequence structure.
	 * Consider using the getPositionOf function.
	*/
	public function getDbPositionOf($trial_id)
	{
		if(!isset($this->trial_pos_by_id))
		{
			self::createIdPosMap();
		}
		
		if(isset($this->trial_pos_by_id[$trial_id]))
		{
			return $this->trial_pos_by_id[$trial_id];
		}
		else
		{
			return 0;
		}
	}
	
	public function getParentSequence()
	{
		return null; // No parent sequences in V5
	}
	
	/*
	 * Update sequence
	 */
	private $queries = array();
	
	public function setTitle($title)
	{
		global $db;
		
		$author_id = intval($this->author->getId());
		
		$future_sequence_id = TrialMetadataHandlerV5::getV5SequenceId($author_id, $this->lang, $title);
		if(TrialSequenceHandler::getHandlerFor($future_sequence_id) != null)
		{
			throw new Exception('error_tech_v5_sequence_id_already_used');
		}
		
		$query = 'UPDATE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			SET
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . '=\'' . $db->sql_escape(TrialMetadataHandlerV5::encodeV5String($title)) . '\'
			WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . '=\'' . $db->sql_escape($this->title) . '\'
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR . ' = ' . $author_id . '
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_LANG . ' = \'' . $db->sql_escape($this->lang) . '\'';
		
		$db->sql_query($query);
	}
	
	private function swapTrials($pos1, $pos2)
	{
		global $db;
		
		$trial1 = $this->getEltAt($pos1);
		$trial2 = $this->getEltAt($pos2);
		
		$query = 'UPDATE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . ' as trials1
				JOIN ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . ' as trials2
				ON (trials1.' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ' = ' . intval($trial1->getId()) . '
					AND trials2.' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ' = ' . intval($trial2->getId()) . ')
			SET
				trials1.' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . ' = trials2.' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . ',
				trials2.' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . ' = trials1.' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION;
		
		$this->queries[] = $query;
	}
	
	public function moveUpEltAt($position)
	{
		if($position > 0)
		{
			$this->swapTrials($position, $position - 1);
		}
	}
	
	public function moveDownEltAt($position)
	{
		if($position < $this->getNumElts() - 1)
		{
			$this->swapTrials($position, $position + 1);
		}
	}
	
	public function removeEltAt($position)
	{
		if($this->getNumElts() <= 1)
		{
			throw new Exception('error_tech_v5_sequence_empty');
		}
		
		$trial = $this->getEltAt($position);
		
		$query = 'UPDATE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			SET
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . '=\'\',
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . '=0
			WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ' = ' . intval($trial->getId());
		
		$this->queries[] = $query;
	}
	
	public function appendTrialToSequence($trial)
	{
		global $db;
		
		list($author_id, $lang, $group_name) = self::extractV5SequenceInfo($this->getId());
		
		if($author_id != $trial->getAuthor()->getId())
		{
			throw new Exception('error_tech_v5_sequence_incorrect_trial_author');
		}
		else if($lang != $trial->getLanguage())
		{
			throw new Exception('error_tech_v5_sequence_incorrect_trial_language');
		}
		
		$last_trial = $this->getEltAt($this->getNumElts() - 1);
		
		$query = 'UPDATE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			SET
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . '=\'' . $db->sql_escape($group_name) . '\',
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . '=
					(SELECT ' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . ' FROM (
						SELECT ' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . '
						FROM ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
						WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ' = ' . intval($last_trial->getId()) . '
					) AS pos)  + 1
			WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ' = ' . intval($trial->getId());
		
		$this->queries[] = $query;
	}
	
	public function appendSequenceToSequence($sequence)
	{
		throw new Exception('error_tech_v5_sequence_nested');
	}
	
	/*
	 * Commit buffered changes to the V5 database
	 */
	protected function save()
	{
		global $db;
		
		foreach($this->queries as $query)
		{
			$db->sql_query($query);
		}
		
		$this->queries = array();
	}
	
	/*
	 * Create a new sequence in V5 DB
	 */
	public static function create($author, $title, $trials=null)
	{
		global $db;
		
		if(!is_array($trials) OR count($trials) == 0)
		{
			throw new Exception('error_tech_v5_sequence_empty');
		}
		
		$author_id = $author->getId();
		$sequence_language = $trials[0]->getLanguage();
		
		$trial_ids_by_pos = array();
		
		foreach($trials as $trial)
		{
			if($trial->getLanguage() != $sequence_language)
			{
				throw new Exception('error_tech_v5_sequence_incorrect_trial_language');
			}
			if($trial->getAuthor()->getId() != $author_id)
			{
				throw new Exception('error_tech_v5_sequence_incorrect_trial_author');
			}
			
			$trial_ids_by_pos[] = intval($trial->getId());
		}
		
		$trial_id_set = implode(',', $trial_ids_by_pos);
		
		$query = 'UPDATE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			SET
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . '=\'' . $db->sql_escape(TrialMetadataHandlerV5::encodeV5String($title)) . '\',
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . '= FIND_IN_SET(' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ', \'' . $trial_id_set . '\')
			WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ' IN (' . $trial_id_set . ')
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR . ' = ' . $author_id . '
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_LANG . ' = \'' . $db->sql_escape($sequence_language) . '\'';
		
		$db->sql_query($query);
		
		return TrialSequenceHandler::getHandlerFor(TrialMetadataHandlerV5::getV5SequenceId($author_id, $sequence_language, $title));
	}
	
	/*
	 * Delete this sequence
	 */
	protected function delete()
	{
		global $db;
		
		$query = 'UPDATE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			SET
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . '=\'\',
				' . TrialMetadataHandlerV5::$DBV5_TRIALS_POSITION . '= 0
			WHERE ' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR . ' = ' . $this->author->getId() . '
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_LANG . ' = \'' . $db->sql_escape($this->lang) . '\'
				AND ' . TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . ' = \'' . $db->sql_escape($this->title) . '\'';
		
		$db->sql_query($query);
		
		
		$this->id = null;
		$this->author = null;
		$this->lang = null;
		$this->title = null;
		$this->trial_list = null;
	}
}
?>
