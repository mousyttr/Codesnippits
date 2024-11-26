<?php
/*
Read data from a phpBB user record.
*/

class UserDataHandler
{
	// Constants related to user DB
	public static $DB_USERS_ID = 'user_id';
	public static $DB_USERS_NAME = 'username';
	public static $DB_USERS_LANGUAGE = 'user_lang';
	public static $DB_USERS_TYPE = 'user_type';
	
	// Cache generated handlers to avoid multiple DB queries
	private static $result_cache = array();
	
	public static function getHandlerFor($user_id, $preloaded_data = null)
	{
		if(!$user_id)
		{
			return null;
		}
		
		if(array_key_exists($user_id, self::$result_cache))
		{
			return self::$result_cache[$user_id];
		}
		
		try 
		{
			$user_handler = new UserDataHandler($user_id);
			self::$result_cache[$user_id] = $user_handler;
			return $user_handler;
		}
		catch(Exception $e)
		{
			return null;
		}
	}
	
	// Intantiate data handler for current user
	private static $current_user = null;
	public static function getCurrentUser()
	{
		global $user;
		
		return self::getHandlerFor($user->data['user_id'], $user->data);
	}
	
	// Actual description of the class
	private $user_data;
	private $user_id;
	
	function __construct($user_id, $preloaded_user_data = null)
	{
		$this->user_id = intval($user_id);
		
		if($preloaded_user_data != null)
		{
			$this->user_data = $preloaded_user_data;
		}
		else
		{
			$this->user_data = array(self::$DB_USERS_ID => $this->user_id);
		}
	}
	
	public function getId()
	{
		return $this->user_id;
	}
	
	public function getName()
	{
		return $this->getField(self::$DB_USERS_NAME);
	}
	
	public function getLanguage()
	{
		return $this->getField(self::$DB_USERS_LANGUAGE);
	}
	
	public function isActive()
	{
		// TODO : check for banned users ?
		return in_array($this->getField(self::$DB_USERS_TYPE), array(USER_NORMAL, USER_FOUNDER));
	}
	
	
	/*
	 * Methods to read data from the database when needed
	 */
	private function refreshData()
	{
		global $db;
	
		$query = 'SELECT * FROM ' . USERS_TABLE . '
			WHERE ' . self::$DB_USERS_ID . '=' . $this->user_id;
		
		$user_row = $db->sql_query($query);
		$this->user_data = $db->sql_fetchrow($user_row);
	}
	
	private function getField($field_name)
	{
		// If field is not loaded, reload all user data
		if(!isset($this->user_data[$field_name]))
		{
			$this->refreshData();
		}
		
		return $this->user_data[$field_name];
	}
}

?>
