var $ = jQuery.noConflict(); 
var map, type_of_resto = 'japanese' , infowindow, service, request, markers = {}, iconMarker = '', markerCounter = 0, directionsDisplay, userPos, theDestination = null, directionsService;
var cebuLatLlng = new google.maps.LatLng(10.31524117, 123.88578562), radius = 10000, circleRadius = 1000, cebuCircle=null, markerCenter, circleLatLng = cebuLatLlng, bounds;

$(window).load(function(){
	create_map();
}); 
 
 //initialize map creation and services
function create_map() {

	//set cebu location
	var mapOptions = {
		zoom: 13,
		center: cebuLatLlng
	};

	map = new google.maps.Map(document.getElementById('resto-map'), mapOptions);

	/* 
	map.data.loadGeoJson('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.8670522,151.1957362&radius=500&types=food&key=AIzaSyCQR23tv-0xsoukBUWgFrO5DSO9rCPUCZ0');
	*/

	//set the default requestoptions
	request = {
		keyword: type_of_resto,
		location: cebuLatLlng,
		radius: radius,
		types: ['restaurant']
	};

	//initialize the needed services
	infowindow = new google.maps.InfoWindow();
	service = new google.maps.places.PlacesService(map);
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsService = new google.maps.DirectionsService();
	directionsDisplay.setMap(map);
	
	
	//get the user's current geolocation : must have HTML 5
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			userPos = new google.maps.LatLng(position.coords.latitude,
			position.coords.longitude);
			
		}, function() {
			alert('Browser doesn\'t support Geolocation');
		});
		
	} else { 
		alert('Browser doesn\'t support Geolocation');
	}  
	  
	makeSearch();
}

//make a search request
function makeSearch(){
	service.nearbySearch(request, callbackRequest);  
}

//callback function after the search request
function callbackRequest(results, status){
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		deleteMarkers();
		$('.keywordType').html( ucfirst(request.keyword) + "( " + results.length + ")" );
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i]);
		}
	}else if( status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS ) {
		alert('No results found.');
	}
	
	if( $('#circleBtn').hasClass('btn-primary') ){
		addMapCircle(false); 
	} 
}

//create a marker based on the passed "place"
function createMarker(place){
	var placeLoc = place.geometry.location;
	var marker = new google.maps.Marker({
		icon: iconMarker,
		map: map,
		position: place.geometry.location
	});
	markers.push(marker);
	markerCounter++;
	addResultButton(place,marker);  
	var currentIndex = markerCounter - 1;
	google.maps.event.addListener(marker, 'click', function() { 
		setInfoWindow(place,marker, currentIndex);
	});
}

//set the infowindow to the currently clicked marker
function setInfoWindow(place,marker,markerID){   
	theDestination = marker.getPosition();
	infowindow.setContent( getInfoContentHtml(place,markerID) );
	infowindow.open(map, marker);
	map.panTo(marker.getPosition());
}

//add a result button on each places
function addResultButton(place,marker){ 
	var markerID = markerCounter - 1;
	$('.restoList').append(' <button type="button" data-marker="'+ markerID +'" class="btn btn-primary btn-xs marker-' + markerID +'">' + place.name + '</button><br/>');
	$('.marker-' + markerID).click(function(){
		setInfoWindow(place,marker);
		calcRoute(markerID);
	});
}

//get infoview content based from the place
function getInfoContentHtml(place,markerID){ 
	var html_left =  "<div style='float: left;width:10%;' ><br/> <img style='width: 100%;' src='" + place.icon + "' /></div>";
	var rating_html = '';
	if(place.rating){
		rating_html = '<br/>Rating: ' + place.rating;
	}
	var html_right = "<div style='float: right;width:90%;' > <b>" + place.name + "</b><br/><b>Address: </b> " + place.vicinity + rating_html + " <br/><br/><a href='#' onclick='calcRoute(" + markerID + "); return false;' class='getDirectionLink'>Get Directions</a></div> <div style='clear:both;'></div>";

	return html_left + html_right;
}

// Sets the map on all markers in the array.
function setAllMap(map) {
	var markers_count = markers.length;
	for (var i = 0; i < markers_count; i++) {
		markers[i].setMap(map);
	}
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setAllMap(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setAllMap(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
	$('.restoList').html('');
	directionsDisplay.setDirections({routes: []});
	clearMarkers();
	markers = [];
	theDestination= null;
}
//converts the first char of the String to uppercase
function ucfirst(str) { 
  str += '';
  var f = str.charAt(0)
    .toUpperCase();
  return f + str.substr(1);
}
 
 //calculate the route from the user's origin to selected resto currently selected
function calcRoute(markerID) {
	if( ! userPos ){
		alert('User Location not found. \n\nYou should have HTML 5 on your browser \n and allow this app to share your location. ');
		return false;
	}
	
	if(markerID){
		theDestination = markers[markerID].getPosition();
	}
	
	if( theDestination ){
	  /* var selectedMode = $('#modeDirection').val(); */
	  var selectedMode = 'DRIVING';
	  var request = {
		  origin: userPos,
		  destination: theDestination, 
		  travelMode: google.maps.TravelMode[selectedMode]
	  };
	  directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
		  directionsDisplay.setDirections(response);
		}
	  });
   }else{
		alert('No destination. \n\n Please select a restaurant on the map to set a destination.');
   }
  
}

function addMapCircle(first){
 
	var circleOption = {
      strokeColor: '#313131',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#fff',
      fillOpacity: 0.35,
      map: map,
      center: circleLatLng,
      radius: circleRadius
    };
	var markerOpts = {
            position: circleLatLng,
			icon: 'images/gray-center-icon.png',
            title: 'The Center',
            map: map,
            draggable: true
        };
	
    // Add the circle for Cebu to the map.
	if(first){ 
        markerCenter = new google.maps.Marker(markerOpts); 
		cebuCircle = new google.maps.Circle(circleOption);
		
		google.maps.event.addListener(markerCenter, 'dragend', function() {
			circleLatLng = new google.maps.LatLng(markerCenter.position.lat(), markerCenter.position.lng());
			checkBounds();
		});
		
		google.maps.event.addListener(markerCenter, 'click', function() { 
			infowindow.setContent( 'Drag here to find results inside the circle.' );
			infowindow.open(map, markerCenter);
			map.panTo(markerCenter.getPosition());
		});
			

	}else{
		markerCenter.setOptions(markerOpts);
		cebuCircle.setOptions(circleOption);
	}
     
	cebuCircle.bindTo('center', markerCenter, 'position'); 
	checkBounds();
}

function checkBounds(){  
	circleBounds = cebuCircle.getBounds();
	var markers_count = markers.length;
	var found = 0;
	for (var i = 0; i < markers_count; i++) { 
		if( circleBounds.contains(markers[i].getPosition()) ){
			found++;
		} 
	}  
	$('#foundResto').html("No. of " + type_of_resto + ": " + found + " results (w/in " + circleRadius + " radius)"); 
}


//trigger the search from input forms
function doSearch(){ 
	type_of_resto = $('#txtType').val();
	request.keyword = type_of_resto;
	makeSearch(); 
}
 
$(document).ready(function(){

	$('#btnSearchMap').click(function(){
		doSearch();
	});
	
	$('#txtType').keyup(function(event){
		if ( event.which == 13 ) {
			doSearch();
		}
	}); 
	
	$('.predefined').find('.btn').each(function(){
		$(this).click(function(){ 
			type_of_resto = $(this).html(); 
			request.keyword = type_of_resto;
			makeSearch(); 
		});
	});
	
	$('#modeDirection').change(function(){ 
		if( theDestination ){
			calcRoute(null);
		}else{
			alert('No destination. \n\n Please select a restaurant on the map to set a destination.');
		}
	});
	
	$('#circleBtn').click(function(){
		if( $(this).hasClass('btn-default') ){
			if(cebuCircle == null){
				addMapCircle(true);
			}else{
				addMapCircle(false);
			}
			$(this).removeClass('btn-default');
			$(this).addClass('btn-primary');
		}else{
			cebuCircle.setMap(null);
			markerCenter.setMap(null);
			$('#foundResto').html("");
			$(this).removeClass('btn-primary');
			$(this).addClass('btn-default');
		} 
	});
	
	
  
	var slider  = $('#slider'),tooltip = $('.tooltipRad'); 
	tooltip.hide(); 
	slider.slider({
		//Config
		range: "min",
		min: 1,
		value: 10,

		start: function(event,ui) {
			tooltip.fadeIn('fast');
		}, 
		slide: function(event, ui) {   
			var value  = slider.slider('value'),
			volume = $('.volume'); 
			tooltip.css('left', value).text(ui.value);  
			
			circleRadius = 100 * value;
			if( $('#circleBtn').hasClass('btn-primary') ){
				addMapCircle(false); 
			}
		}, 
		stop: function(event,ui) {
			tooltip.fadeOut('fast'); 
			var value  = slider.slider('value');
			circleRadius = 100 * value;
			if( $('#circleBtn').hasClass('btn-primary') ){
				addMapCircle(false); 
			}
		},
	});



});

 