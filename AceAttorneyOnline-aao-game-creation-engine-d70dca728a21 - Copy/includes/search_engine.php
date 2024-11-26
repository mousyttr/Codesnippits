<?php

function isQueryPublicOnly($criteria, $show_private)
{
	if($show_private)
	{
		// User requesting showing private trials. Check permissions before complying.
		$user_id = UserDataHandler::getCurrentUser()->getId();
		$admins = getCfg('admins');
		
		if(in_array($user_id, $admins['all']))
		{
			// Global admin : can always show private trials
			return false;
		}
		
		if(isset($criteria['language-is']) AND 
			isset($admins[$criteria['language-is']]) AND
			in_array($user_id, $admins[$criteria['language-is']]))
		{
			// Search is restricted to a language section, of which current user is admin : can show private trials
			return false;
		}
		
		if(isset($criteria['authorId-is']) AND $criteria['authorId-is'] == UserDataHandler::getCurrentUser()->getId())
		{
			// Search is restricted to a the current user : can show his own private trials
			return false;
		}
	}
	
	// User is not requesting private trials : do not show them by default
	return true;
}

function getSearchQueryFor($criteria, $show_private=false)
{
	$query = TrialSearchQuery::searchFor();
	foreach($criteria as $key => $value)
	{
		$field = explode('-', $key, 2);
		$op = $field[1];
		$field = $field[0];
		
		if(!method_exists($query, $field))
		{
			throw new Exception('Unknown field ' . $field);
		}
		$condition = $query->$field();
		
		if(!method_exists($condition, $op))
		{
			throw new Exception('Unknown op ' . $op);
		}
		$condition->$op($value);
	}
	
	if(isQueryPublicOnly($criteria, $show_private))
	{
		$query->publicTrial()->isTrue();
	}
	
	return $query;
}

?>
