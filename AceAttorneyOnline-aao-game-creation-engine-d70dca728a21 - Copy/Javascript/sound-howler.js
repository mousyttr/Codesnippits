/*
Ace Attorney Online - Load and use the howler.js sound library

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'sound-howler',
	dependencies : [],
	init : function() {}
}));

//INDEPENDENT INSTRUCTIONS
includeScript('howler.js/howler.min', false, '', function(){
	Howler.autoSuspend = false;
	Howler.autoUnlock = true;
	Modules.complete('sound-howler');
});

window.SoundHowler = new SoundHowler();

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS
function SoundHowler() {
	var self = this;
	self.registeredSounds = [];

	// PRIVATE METHODS
	self.getSoundIndexById = function(id)
	{
		for(var i = 0; i < self.registeredSounds.length; i++)
		{
			if(self.registeredSounds[i].id == id)
			{
				return i;
			}
		}

		return MUSIC_STOP;
	};

	// PUBLIC METHODS
	self.registerSound = function(id, args) {
		// if sound already exists, return the existing sound
		var existing_sound = self.getSoundById(id);
		if(existing_sound) return existing_sound;

		var srcs = [];
		if(args.urls) {
			srcs = args.urls;
		}
		if(args.url){
			srcs.push(args.url);
		}

		var loop, onload_new;

		// To get a loop starting at a specific time, we need sprites.
		if (args.loop && args.loop.start) {
			onload_new = function() {
				this._sprite = {
					intro: [0, args.loop.start],
					loop: [args.loop.start, this._duration * 1000 - args.loop.start, true]
				}
				args.onload(this);
			}
			loop = false;
		} else {
			onload_new = args.onload;
			loop = !!args.loop;
		}

		// Define the Howl. Other arguments could be passed, if applicable.
		var newHowl = new Howl({
			src: srcs,
			volume: args.volume ? Math.min(1.0, args.volume / 100) : 1.0,
			loop: loop,
			onload: onload_new ? onload_new : undefined,
			onloaderror: args.onloaderror ? args.onloaderror : undefined,
			onplay: args.onplay ? args.onplay : undefined,
			preload: true
		});

		var newSound = new Object({
			id: id,
			howl: newHowl
		});

		self.registeredSounds.push(newSound);

		return newSound.howl;
	};

	self.playSound = function(id, from_loop)
	{
		var sound = self.getSoundById(id);
		if (sound._sprite.intro) {
			if(from_loop) {
				sound.play("loop");
			}
			else {
				sound._onend = [
				{ fn:
				  function(x) {
					  sound.play("loop");
					  sound._onend = [];
				  }
				}
				]
				sound.play("intro");
			}
		} else if (sound !== null) sound.play();
	};

	self.pauseSound = function(id)
	{
		var sound = self.getSoundById(id);
		if (sound !== null) sound.pause();
	};

	self.stopSound = function(id)
	{
		var sound = self.getSoundById(id);
		if (sound !== null) sound.stop();
	};

	self.setSoundVolume = function(id, volume)
	{
		var sound = self.getSoundById(id);
		// Remember to cap volume at 1.0. HTML5 won't allow anything more, and Howler hangs
		if (sound !== null) sound.volume(Math.min(1.0, volume / 100));
	};

	self.setSoundPlaybackRate = function(id, rate)
	{
		var sound = self.getSoundById(id);
		if (sound !== null) sound.rate(rate);
	};

	self.unloadSound = function(id)
	{
		var sound_index = self.getSoundIndexById(id);
		if(sound_index != MUSIC_STOP)
		{
			// kill and then remove the sound
			self.registeredSounds[sound_index].howl.unload();
			self.registeredSounds.splice(sound_index, 1);
		}
	};

	self.fadeSound = function(id, duration, to_volume, endFadeCallback)
	{
		var sound = self.getSoundById(id);
		if (sound !== null) {
			var from_volume = sound.volume();
			to_volume = Math.min(1.0, to_volume / 100);

			if(endFadeCallback !== null)
			{
			   sound.once("fade", endFadeCallback);
			}
			sound.fade(from_volume, to_volume, duration);
		}
	};

	self.getSoundById = function(id)
	{
		for(var sound in self.registeredSounds)
		{
			if(self.registeredSounds[sound].id == id)
			{
				return self.registeredSounds[sound].howl;
			}
		}

		return null;
	};
}

//END OF MODULE

