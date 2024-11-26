<?php
/*
Default implementation of a sequence element
*/

abstract class SequenceElement implements ISequenceElement
{
	public function getPreviousElt()
	{
		$sequence = $this->getParentSequence();
		if($sequence !== null)
		{
			return $sequence->getEltBefore($this);
		}
	}
	public function getNextElt()
	{
		$sequence = $this->getParentSequence();
		if($sequence !== null)
		{
			return $sequence->getEltAfter($this);
		}
	}
}

?>
