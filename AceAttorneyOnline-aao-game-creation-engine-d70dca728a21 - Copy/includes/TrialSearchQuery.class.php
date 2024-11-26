<?php
/*
Abstract class representing a database trial search query
*/

abstract class TrialSearchQuery
{
	public static function searchFor()
	{
		return new TrialSearchQueryV5();
	}
	
	/*
	 * List of possible search criterias
	 */
	public static $SEARCH_FIELD_TITLE = 1;
	public static $SEARCH_FIELD_LANG = 2;
	public static $SEARCH_FIELD_AUTHOR_NAME = 3;
	public static $SEARCH_FIELD_AUTHOR_ID = 4;
	public static $SEARCH_FIELD_PUBLIC = 5;
	public static $SEARCH_FIELD_FEATURED = 6;
	public static $SEARCH_FIELD_SEQUENCE_ID = 7;
	public static $SEARCH_FIELD_COLLABS_NAME = 8;
	public static $SEARCH_FIELD_COLLABS_ID = 9;
	public static $SEARCH_FIELD_AUTHOR_OR_COLLABS_ID = 10;
	
	protected $conditions = array();
	
	protected abstract function getCondition($field);
	
	public function title()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_TITLE));
	}
	public function language()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_LANG));
	}
	public function authorId()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_AUTHOR_ID));
	}
	public function authorName()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_AUTHOR_NAME));
	}
	public function publicTrial()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_PUBLIC));
	}
	public function featuredTrial()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_FEATURED));
	}
	public function sequenceId()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_SEQUENCE_ID));
	}
	public function collabsName()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_COLLABS_NAME));
	}
	public function collabsId()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_COLLABS_ID));
	}
	public function authorOrCollabsId()
	{
		return ($this->conditions[] = $this->getCondition(self::$SEARCH_FIELD_AUTHOR_OR_COLLABS_ID));
	}
	
	public abstract function getFirst();
	public abstract function getAll();
	public abstract function get($start, $length);
	public abstract function getNbResults();
	public abstract function getRandom();
}

?>
