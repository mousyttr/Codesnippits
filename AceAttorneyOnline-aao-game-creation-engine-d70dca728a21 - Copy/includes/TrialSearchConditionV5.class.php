<?php

class TrialSearchConditionV5 extends TrialSearchCondition
{
	private static $TYPE_STRING = 1;
	private static $TYPE_INT = 2;
	private static $TYPE_BOOLEAN = 3;
	
	/*
	 * Field types on the db side : determine the way to write the values in queries
	 */
	private static $search_field_types;
	
	/*
	 * Field designations on db side : determine the way to fetch the data for a record
	 */
	private static $search_field_designations;
	
	public static function initStatic()
	{
		self::$search_field_types = array(
			TrialSearchQuery::$SEARCH_FIELD_TITLE => self::$TYPE_STRING,
			TrialSearchQuery::$SEARCH_FIELD_LANG => self::$TYPE_STRING,
			TrialSearchQuery::$SEARCH_FIELD_AUTHOR_NAME => self::$TYPE_STRING,
			TrialSearchQuery::$SEARCH_FIELD_AUTHOR_ID => self::$TYPE_INT,
			TrialSearchQuery::$SEARCH_FIELD_PUBLIC => self::$TYPE_BOOLEAN,
			TrialSearchQuery::$SEARCH_FIELD_FEATURED => self::$TYPE_BOOLEAN,
			TrialSearchQuery::$SEARCH_FIELD_SEQUENCE_ID => self::$TYPE_STRING
		);
		
		self::$search_field_designations = array(
			TrialSearchQuery::$SEARCH_FIELD_TITLE => TrialMetadataHandlerV5::$DBV5_TRIALS_TITLE,
			TrialSearchQuery::$SEARCH_FIELD_LANG => TrialMetadataHandlerV5::$DBV5_TRIALS_LANG,
			TrialSearchQuery::$SEARCH_FIELD_AUTHOR_NAME => UserDataHandler::$DB_USERS_NAME,
			TrialSearchQuery::$SEARCH_FIELD_AUTHOR_ID => TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR,
			TrialSearchQuery::$SEARCH_FIELD_PUBLIC => TrialMetadataHandlerV5::$DBV5_TRIALS_PUBLIC,
			TrialSearchQuery::$SEARCH_FIELD_FEATURED => TrialMetadataHandlerV5::$DBV5_TRIALS_FEATURED,
			TrialSearchQuery::$SEARCH_FIELD_SEQUENCE_ID => 'CONCAT_WS(\'_\',' . 
				TrialMetadataHandlerV5::$DBV5_TRIALS_AUTHOR . ',' .
				TrialMetadataHandlerV5::$DBV5_TRIALS_LANG . ',' .
				TrialMetadataHandlerV5::$DBV5_TRIALS_GROUP . ')'
		);
	}
	
	public function __construct($parent_query, $field)
	{
		$this->parent_query = $parent_query;
		$this->field = $field;
	}
	
	private static function opEquals($type, $source, $value, $negative)
	{
		global $db;
		
		$op = $negative ? '<>' : '=';
		
		$comparison_value;
		switch($type)
		{
			case self::$TYPE_INT:
				$comparison_value = intval($value);
				break;
			case self::$TYPE_STRING:
				$comparison_value = '\'' . $db->sql_escape(TrialMetadataHandlerV5::encodeV5String($value)) . '\'';
				break;
		}
		
		return $source.$op.$comparison_value;
	}
	
	private static function opContains($source, $value, $negative)
	{
		global $db;
		
		$any_char = (method_exists($db, 'get_any_char') ? $db->get_any_char() : $db->any_char);
		
		return $source. ($negative ? ' NOT ' : ' ') . $db->sql_like_expression($any_char . TrialMetadataHandlerV5::encodeV5String($value) . $any_char);
	}
	
	public function getAsString()
	{
		global $db;
		
		switch($this->operator)
		{
			case TrialSearchCondition::$OP_EQUALS:
			case TrialSearchCondition::$OP_NOT_EQUALS:
				return self::opEquals(
					self::$search_field_types[$this->field],
					self::$search_field_designations[$this->field],
					$this->value,
					($this->operator == TrialSearchCondition::$OP_NOT_EQUALS)
				);
				break;
			
			case TrialSearchCondition::$OP_CONTAINS:
			case TrialSearchCondition::$OP_NOT_CONTAINS:
				return self::opContains(
					self::$search_field_designations[$this->field],
					$this->value,
					($this->operator == TrialSearchCondition::$OP_NOT_CONTAINS)
				);
				break;
			
			case TrialSearchCondition::$OP_IS_TRUE:
				return self::$search_field_designations[$this->field] . '=1';
				break;
			case TrialSearchCondition::$OP_IS_FALSE:
				return self::$search_field_designations[$this->field] . '=0';
				break;
			
			case TrialSearchCondition::$OP_HAS_EQUAL:
			case TrialSearchCondition::$OP_NOT_HAS_EQUAL:
				
				switch($this->field)
				{
					case TrialSearchQuery::$SEARCH_FIELD_COLLABS_ID:
						return self::opContains(
							TrialMetadataHandlerV5::$DBV5_TRIALS_COLLAB,
							'[' . intval($this->value) . ']',
							($this->operator == TrialSearchCondition::$OP_NOT_HAS_EQUAL)
						);
						break;
					
					case TrialSearchQuery::$SEARCH_FIELD_COLLABS_NAME:
						
						$clean_value = TrialMetadataHandlerV5::encodeV5String(TrialMetadataHandlerV5::cleanCollabName($this->value));
						
						$name_at_start_pattern = TrialMetadataHandlerV5::$DBV5_TRIALS_COLLAB . ' ' .
							$db->sql_like_expression($clean_value . '[' . chr(0) . '%');
						$name_inside_pattern = TrialMetadataHandlerV5::$DBV5_TRIALS_COLLAB . ' ' .
							$db->sql_like_expression(chr(0) . '%,' . $clean_value . '[' . chr(0) . '%');
						
						$name_pattern = ($this->operator == TrialSearchCondition::$OP_NOT_HAS_EQUAL ? 'NOT': '') .
							'(' . $name_at_start_pattern . ' OR ' . $name_inside_pattern . ')';
						
						return $name_pattern;
						break;
					
					case TrialSearchQuery::$SEARCH_FIELD_AUTHOR_OR_COLLABS_ID:
						
						$author_condition = new TrialSearchConditionV5($this->parent_query, TrialSearchQuery::$SEARCH_FIELD_AUTHOR_ID);
						$author_condition->is($this->value);
						
						$collab_condition = new TrialSearchConditionV5($this->parent_query, TrialSearchQuery::$SEARCH_FIELD_COLLABS_ID);
						$collab_condition->has($this->value);
						
						return '(' . $author_condition->getAsString() . ' OR ' . $collab_condition->getAsString() . ')';
						
						break;
				}
				
				break;
			
			case TrialSearchCondition::$OP_HAS_CONTAINING:
			case TrialSearchCondition::$OP_NOT_HAS_CONTAINING:
				
				switch($this->field)
				{
					case TrialSearchQuery::$SEARCH_FIELD_COLLABS_NAME:
						return self::opContains(
							TrialMetadataHandlerV5::$DBV5_TRIALS_COLLAB,
							TrialMetadataHandlerV5::encodeV5String(TrialMetadataHandlerV5::cleanCollabName($this->value)),
							($this->operator == TrialSearchCondition::$OP_NOT_HAS_CONTAINING)
						);
						break;
				}
				
				break;
			
			default:
				throw new Exception('Operator ' . $this->operator . ' is not handled.');
				break;
		}
		
		throw new Exception('Operator ' . $this->operator . ' failed to match arguments.');
	}
}
TrialSearchConditionV5::initStatic();

?>
