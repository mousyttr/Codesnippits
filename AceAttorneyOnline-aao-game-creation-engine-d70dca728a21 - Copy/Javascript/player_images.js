"use strict";
/*
Ace Attorney Online - Player image loader

*/

//MODULE DESCRIPTOR
Modules.load(new Object({
	name : 'player_images',
	dependencies : ['trial', 'default_data', 'frame_data', 'events', 'page_loaded', 'loading_bar'],
	init : function()
	{
		if(trial_data)
		{
			// If there is data to preload...
			// Set preload object
			var loading_screen = document.getElementById('screen-loading');
			var images_loading_label = document.createElement('p');
			images_loading_label.setAttribute('data-locale-content', 'loading_images');
			loading_screen.appendChild(images_loading_label);
			images_loading = new LoadingBar();
			loading_screen.appendChild(images_loading.element);
			translateNode(images_loading_label);
			
			var img_container = document.createElement('div');
			img_container.style.width = '1px';
			img_container.style.height = '1px';
			img_container.style.overflow = 'hidden';
			document.body.appendChild(img_container);
			
			// Load all evidence icons
			for(var i = 1; i < trial_data.evidence.length; i++)
			{
				preloadImage(getEvidenceIconUrl(trial_data.evidence[i]), img_container);
			}
			
			// Load all profile images
			for(var i = 1; i < trial_data.profiles.length; i++)
			{
				var profile = trial_data.profiles[i];
				preloadImage(getProfileIconUrl(profile), img_container); // Profile icon
				
				for(var j = 0; j < profile.custom_sprites.length; j++) // Custom sprites
				{
					preloadImage(profile.custom_sprites[j].talking, img_container);
					preloadImage(profile.custom_sprites[j].still, img_container);
					if(profile.custom_sprites[j].startup)
					{
						preloadImage(profile.custom_sprites[j].startup, img_container);
					}
				}
				
				for(var j = 1; j <= default_profiles_nb[profile.base]; j++) // Default sprites
				{
					preloadImage(getDefaultSpriteUrl(profile.base, j, 'talking'), img_container);
					preloadImage(getDefaultSpriteUrl(profile.base, j, 'still'), img_container);
					if(default_profiles_startup[profile.base + '/' + j])
					{
						preloadImage(getDefaultSpriteUrl(profile.base, j, 'startup'), img_container);
					}
				}
			}
			
			// Load all place images
			for(var i = 1; i < trial_data.places.length; i++) // Custom places
			{
				preloadPlaceImages(trial_data.places[i], img_container);
			}
			
			for(var i in default_places) // Default places
			{
				preloadPlaceImages(default_places[i], img_container);
			}
			
			// Load all popup images
			for(var i = 1; i < trial_data.popups.length; i++) // Custom places
			{
				preloadImage(getPopupUrl(trial_data.popups[i]), img_container);
			}
		}
	}
}));

//INDEPENDENT INSTRUCTIONS
var images_loading;
var nb_images_to_load = 0;
var nb_images_loaded = 0;
var nb_images_failed = 0;

function preloadImage(uri, img_container)
{
	images_loading.addOne();
	
	var img = new Image();
	registerEventHandler(img, 'load', images_loading.loadedOne, false);
	registerEventHandler(img, 'error', images_loading.failedOne, false);
	
	img.src = uri;
	
	if(img_container)
	{
		img_container.appendChild(img);
	}
}

function preloadPlaceImages(place, img_container)
{
	var background = getObjectDescriptor(place.background, 'bg_subdir');
	if(background.uri) // Place background if it's a picture
	{
		preloadImage(background.uri, img_container); 
	}
			
	for(var j = 0; j < place.background_objects.length; j++) // Backgroud objects
	{
		preloadImage(getObjectDescriptor(place.background_objects[j], img_container).uri, img_container);
	}
	
	for(var j = 0; j < place.foreground_objects.length; j++) // Backgroud objects
	{
		preloadImage(getObjectDescriptor(place.foreground_objects[j], img_container).uri, img_container);
	}
}

//EXPORTED VARIABLES


//EXPORTED FUNCTIONS


//END OF MODULE
Modules.complete('player_images');
