<?php

class TrialSearchQueryV5 extends TrialSearchQuery
{
	protected function getCondition($field)
	{
		return new TrialSearchConditionV5($this, $field);
	}
	
	private function buildQuery($selector='*')
	{
		global $db;
		
		$query_select = 'SELECT ' . $selector . ' FROM ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '
			LEFT JOIN ' . USERS_TABLE . '
			ON ' . TrialMetadataHandlerV5::$DBV5_TRIALS_TABLE . '.' . TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR .' = ' . USERS_TABLE . '.' . UserDataHandler::$DB_USERS_ID;
		
		$query_where = ' WHERE 1';
		
		foreach($this->conditions as $condition)
		{
			$query_where .= ' AND ' . $condition->getAsString();
		}
		
		return $query_select . $query_where . ' ORDER BY id DESC ';
	}
	
	public function getFirst()
	{
		global $db;
		
		$db_results = $db->sql_query($this->buildQuery() . ' LIMIT 0,1');
		$db_result = $db->sql_fetchrow($db_results);
		
		$trial_id = $db_result[TrialMetadataHandlerV5::$DBV5_TRIALS_ID];
		return new TrialMetadataHandlerV5($trial_id, $db_result);
	}
	
	private function getResults($query)
	{
		global $db;
		
		$db_results = $db->sql_query($query);
		
		$trial_results = array();
		while($db_result = $db->sql_fetchrow($db_results))
		{
			$trial_id = $db_result[TrialMetadataHandlerV5::$DBV5_TRIALS_ID];
			$trial_results[] = new TrialMetadataHandlerV5($trial_id, $db_result);
		}
		
		return $trial_results;
	}
	
	public function getAll()
	{
		return $this->getResults($this->buildQuery());
	}
	
	public function get($start, $length)
	{
		return $this->getResults($this->buildQuery() . ' LIMIT ' . intval($start) . ',' . intval($length));
	}
	
	public function getNbResults()
	{
		global $db;
		
		$db_results = $db->sql_query($this->buildQuery('COUNT(' . TrialMetadataHandlerV5::$DBV5_TRIALS_ID . ') as c'));
		$db_result = $db->sql_fetchrow($db_results);
		
		return intval($db_result['c']);
	}
	
	public function getRandom()
	{
		global $db;
		
		$nb_results = $this->getNbResults();
		if($this->getNbResults() == 0)
		{
			return null;
		}
		$random_index = rand(0, $nb_results - 1);
		
		$db_results = $db->sql_query($this->buildQuery() . ' LIMIT ' . $random_index . ',1');
		$db_result = $db->sql_fetchrow($db_results);
		
		$trial_id = $db_result[TrialMetadataHandlerV5::$DBV5_TRIALS_ID];
		return new TrialMetadataHandlerV5($trial_id, $db_result);
	}
}

?>
