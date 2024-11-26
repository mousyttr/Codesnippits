<?php
/*
Ace Attorney Online - Database search webservice entry point

*/

include('common_render.php');
includeScript('includes/search_engine.php');

if(isset($_GET['search_key']) AND isset($_GET['search_text']))
{
	$results = array();
	
	switch($_GET['search_key'])
	{
		case 'users_by_name':
			
			$escaped_text = $db->sql_escape($_GET['search_text']);
			
			$query = 'SELECT *, 
					LOCATE(\'' . $escaped_text . '\' COLLATE utf8_general_ci, ' . UserDataHandler::$DB_USERS_NAME . ') as match_pos
				FROM 
					' . USERS_TABLE . '
				WHERE 
					' . UserDataHandler::$DB_USERS_TYPE . ' IN (' . USER_NORMAL . ', ' . USER_FOUNDER . ')
					AND ' . UserDataHandler::$DB_USERS_NAME . ' COLLATE utf8_general_ci LIKE \'%' . $escaped_text . '%\'
				ORDER BY match_pos, CHAR_LENGTH(' . UserDataHandler::$DB_USERS_NAME . ')
				LIMIT 0, 10';
			
			$query_results = $db->sql_query($query);
			
			while($result_row = $db->sql_fetchrow($query_results))
			{
				$results[] = array(
					'value' => $result_row[UserDataHandler::$DB_USERS_ID],
					'label' => $result_row[UserDataHandler::$DB_USERS_NAME]
				);
			}
			
			break;
		
		case 'trials_by_title':
			
			// If parameters given, they correspond to the additional search criteria
			$criteria = isset($_GET['parameters']) ? $_GET['parameters'] : array();
			
			$query = getSearchQueryFor($criteria, true)
				->title()->contains($_GET['search_text']);
			
			$trials = $query->get(0, 10);
			
			foreach($trials as $trial)
			{
				$results[] = array(
					'value' => $trial->getId(),
					'label' => $trial->getTitle()
				);
			}
			
			break;
		
		default:
			break;
	}
	
	echo json_encode($results);
}

?>
