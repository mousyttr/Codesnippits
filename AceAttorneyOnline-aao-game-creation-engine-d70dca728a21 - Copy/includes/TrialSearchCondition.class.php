<?php

abstract class TrialSearchCondition
{
	protected static $OP_EQUALS = 1;
	protected static $OP_NOT_EQUALS = 2;
	protected static $OP_CONTAINS = 3;
	protected static $OP_NOT_CONTAINS = 4;
	protected static $OP_HAS_EQUAL = 5;
	protected static $OP_NOT_HAS_EQUAL = 6;
	protected static $OP_HAS_CONTAINING = 7;
	protected static $OP_NOT_HAS_CONTAINING = 8;
	protected static $OP_IS_TRUE = 9;
	protected static $OP_IS_FALSE = 10;
	
	private static $FIELD_TYPE_BOOL = 1;
	private static $FIELD_TYPE_STRING = 2;
	private static $FIELD_TYPE_ID = 3;
	private static $FIELD_TYPE_LIST_STRING = 4;
	private static $FIELD_TYPE_LIST_ID = 5;
	
	/*
	 * List of operators applicable to each field type.
	 */
	private static $field_types_ops;
	/*
	 * List of types of each search field
	 */
	private static $search_field_types;
	
	public static function initStatic()
	{
		self::$field_types_ops = array(
			self::$FIELD_TYPE_BOOL => array(self::$OP_IS_TRUE, self::$OP_IS_FALSE),
			self::$FIELD_TYPE_STRING => array(self::$OP_CONTAINS, self::$OP_NOT_CONTAINS, self::$OP_EQUALS, self::$OP_NOT_EQUALS),
			self::$FIELD_TYPE_ID => array(self::$OP_EQUALS, self::$OP_NOT_EQUALS),
			self::$FIELD_TYPE_LIST_STRING => array(self::$OP_HAS_EQUAL, self::$OP_NOT_HAS_EQUAL, self::$OP_HAS_CONTAINING, self::$OP_NOT_HAS_CONTAINING),
			self::$FIELD_TYPE_LIST_ID => array(self::$OP_HAS_EQUAL, self::$OP_NOT_HAS_EQUAL),
		);
		
		self::$search_field_types = array(
			TrialSearchQuery::$SEARCH_FIELD_TITLE => self::$FIELD_TYPE_STRING,
			TrialSearchQuery::$SEARCH_FIELD_LANG => self::$FIELD_TYPE_ID,
			TrialSearchQuery::$SEARCH_FIELD_AUTHOR_NAME => self::$FIELD_TYPE_STRING,
			TrialSearchQuery::$SEARCH_FIELD_AUTHOR_ID => self::$FIELD_TYPE_ID,
			TrialSearchQuery::$SEARCH_FIELD_PUBLIC => self::$FIELD_TYPE_BOOL,
			TrialSearchQuery::$SEARCH_FIELD_FEATURED => self::$FIELD_TYPE_BOOL,
			TrialSearchQuery::$SEARCH_FIELD_SEQUENCE_ID => self::$FIELD_TYPE_ID,
			TrialSearchQuery::$SEARCH_FIELD_COLLABS_NAME => self::$FIELD_TYPE_LIST_STRING,
			TrialSearchQuery::$SEARCH_FIELD_COLLABS_ID => self::$FIELD_TYPE_LIST_ID,
			TrialSearchQuery::$SEARCH_FIELD_AUTHOR_OR_COLLABS_ID => self::$FIELD_TYPE_LIST_ID
		);
	}
	
	protected $parent_query;
	protected $field;
	protected $operator;
	protected $value;
	
	/*
	 * Set operator for condition, and return the parent query for chaining
	 */
	private function setOperator($operator, $value)
	{
		if(!in_array($operator, self::$field_types_ops[self::$search_field_types[$this->field]]))
		{
			throw new Exception('Operator ' . $operator . ' not applicable to field ' . $this->field);
		}
		
		$this->operator = $operator;
		$this->value = $value;
		
		return $this->parent_query;
	}
	
	public function is($value)
	{
		return $this->setOperator(self::$OP_EQUALS, $value);
	}
	public function isNot($value)
	{
		return $this->setOperator(self::$OP_NOT_EQUALS, $value);
	}
	public function isTrue($value=null)
	{
		return $this->setOperator(self::$OP_IS_TRUE, $value);
	}
	public function isFalse($value=null)
	{
		return $this->setOperator(self::$OP_IS_FALSE, $value);
	}
	public function contains($value)
	{
		return $this->setOperator(self::$OP_CONTAINS, $value);
	}
	public function doesNotContain($value)
	{
		return $this->setOperator(self::$OP_NOT_CONTAINS, $value);
	}
	public function has($value)
	{
		return $this->setOperator(self::$OP_HAS_EQUAL, $value);
	}
	public function doesNotHave($value)
	{
		return $this->setOperator(self::$OP_NOT_HAS_EQUAL, $value);
	}
	public function hasValueContaining($value)
	{
		return $this->setOperator(self::$OP_HAS_CONTAINING, $value);
	}
	public function doesNotHaveValueContaining($value)
	{
		return $this->setOperator(self::$OP_NOT_HAS_CONTAINING, $value);
	}
	
	/*
	 * Actually output the condition as a string for the DB query - depends on the implementation
	 */
	public abstract function getAsString();
}
TrialSearchCondition::initStatic();

?>
