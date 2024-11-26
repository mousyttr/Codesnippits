<?php
/*
Abstract class defining methods to manipulate a sequence in database.
*/

abstract class TrialSequenceHandler extends SequenceElement
{
	// Cache generated handlers to avoid multiple DB queries
	private static $result_cache = array();
	
	public static function getHandlerFor($sequence_id)
	{
		if(!$sequence_id)
		{
			return null;
		}
		
		if(array_key_exists($sequence_id, self::$result_cache))
		{
			return self::$result_cache[$sequence_id];
		}
		
		try 
		{
			$sequence_handler = new TrialSequenceHandlerV5($sequence_id);
			self::$result_cache[$sequence_id] = $sequence_handler;
			return $sequence_handler;
		}
		catch(Exception $e)
		{
			self::$result_cache[$sequence_id] = null;
			return null;
		}
	}
	
	public static function create($author, $title, $trials=null)
	{
		if(!UserDataHandler::getCurrentUser()->isActive())
		{
			throw new Exception('error_user_inactive');
		}
		
		if(!is_string($title) || strlen(trim($title)) == 0)
		{
			
		}
		
		if(is_array($trials))
		{
			foreach($trials as $trial)
			{
				if(!$trial->canUserWriteMetadata(UserDataHandler::getCurrentUser()))
				{
					throw new Exception('error_perms_sequence_add_trial');
				}
				if($trial->getParentSequence() != null)
				{
					throw new Exception('error_user_sequence_trial_already_taken');
				}
			}
		}
		
		TrialSequenceHandlerV5::create($author, $title, $trials);
	}
	
	public abstract function getId();
	public abstract function getTitle();
	public abstract function getAuthor();
	public abstract function getLanguage();
	public abstract function getEltAt($position);
	public abstract function getNumElts();
	public function getPositionOf(ISequenceElement $searched_element)
	{
		for($position = 0; $position < $this->getNumElts(); $position++)
		{
			$element = $this->getEltAt($position);
			if(get_class($element) === get_class($searched_element)
				AND $element->getId() === $searched_element->getId())
			{
				return $position;
			}
		}
		
		return -1;
	}
	public function getEltBefore(ISequenceElement $searched_element)
	{
		$position = $this->getPositionOf($searched_element);
		
		if($position >= 1 AND $position < $this->getNumElts())
		{
			return $this->getEltAt($position - 1);
		}
		
		return null;
	}
	public function getEltAfter(ISequenceElement $searched_element)
	{
		$position = $this->getPositionOf($searched_element);
		
		if($position >= 0 AND $position < $this->getNumElts() - 1)
		{
			return $this->getEltAt($position + 1);
		}
		
		return null;
	}
	
	/* 
	 * Fetch ID of the element at a given position.
	 * Do NOT use this method unless strictly necessary - it can be overridden with a behaviour inconsistent with the actual sequence structure.
	 */
	public function getIdOfEltAt($position)
	{
		return $this->getEltAt($position)->getId();
	}
	
	public function export()
	{
		$exported_list = array();
		
		for($position = 0; $position < $this->getNumElts(); $position++)
		{
			$element = $this->getEltAt($position);
			
			$exported_list[] = array(
				'id' => $element->getId(),
				'title' => $element->getTitle()
			);
		}
		
		return array(
			'title' => $this->getTitle(),
			'list' => $exported_list
		);
	}
	
	/*
	 * Get permissions of a user over this sequence
	 */
	public function isUserAdmin($user)
	{
		$user_id = $user->getId();
		// Is user admin over this trial's language section ?
		$admins = getCfg('admins');
		return in_array($user_id, $admins[$this->getLanguage()]) OR in_array($user_id, $admins['all']);
	}
	public function isUserOwner($user)
	{
		return ($this->getAuthor()->getId() == $user->getId());
	}
	
	public function canUserRead($user)
	{
		for($i = 0; $i < $this->getNumElts(); $i++)
		{
			if($this->getEltAt($i)->canUserRead($user))
			{
				return true;
			}
		}
		
		return false;
	}
	public function canUserWrite($user)
	{
		return
			$user->isActive() AND (
				$this->isUserOwner($user) OR
				$this->isUserAdmin($user)
			);
	}
	
	/*
	 * Check permissions for protected methods
	 */
	public function __call($method_name, $args)
	{
		switch($method_name)
		{
			case 'save':
				if(!$this->canUserWrite(UserDataHandler::getCurrentUser()))
				{
					throw new Exception('error_perms_sequence_edit');
				}
				break;
			
			case 'delete':
				if(!$this->canUserWrite(UserDataHandler::getCurrentUser()))
				{
					throw new Exception('error_perms_sequence_delete');
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
	 * Update sequence
	 */
	public abstract function setTitle($title);
	
	public abstract function moveUpEltAt($position);
	public abstract function moveDownEltAt($position);
	public abstract function removeEltAt($position);
	
	public abstract function appendTrialToSequence($trial);
	public function appendTrial($trial)
	{
		if($trial == null OR !$trial->canUserWriteMetadata(UserDataHandler::getCurrentUser()))
		{
			throw new Exception('error_perms_sequence_add_trial');
		}
		
		if($trial->getParentSequence() != null)
		{
			throw new Exception('error_user_sequence_trial_already_taken');
		}
		
		$this->appendTrialToSequence($trial);
	}
	public abstract function appendSequenceToSequence($sequence);
	public function appendSequence($sequence)
	{
		if($sequence == null OR !$sequence->canUserWrite(UserDataHandler::getCurrentUser()))
		{
			throw new Exception('error_perms_sequence_add_sequence');
		}
		
		if($sequence->getParentSequence() != null)
		{
			throw new Exception('error_user_sequence_sequence_already_taken');
		}
		
		$this->appendSequenceToSequence();
	}
	
	protected abstract function save();
	
	/*
	 * Delete sequence
	 */
	protected abstract function delete();
}
?>
