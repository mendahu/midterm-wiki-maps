let map;
let service;
let infoWindow = null;
let mapCentre;
let bounds;
let searchBox;
let testMarker;
let defaultPos = {};
let activePoints = [];


  //Function to loop through markers
  const placeMarkersPoints = function(markerPoints){
    console.log("in place markers")
    markerPoints.forEach(point => {
      const location = {lat: point.latitude, lng: point.longitude};
      placeMarker(location, point, map);
      activePoints.push(location);

      //extends bounds of all points
      bounds.extend(location);
    });
  }
  //Function to clear markers
  const clearMarkers = function(activePoints) {
    console.log("in clear markers")
    console.log("acitve points before: ", activePoints)
    for (var i = 0; i < activePoints.length; i++) {
      activePoints[i]=null;
    }
    activePoints = [];
    console.log("active points after: ", activePoints)
  }


//Get user's location to set map center if there are no active points
const userLocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      defaultPos["lat"] = position.coords.latitude;
      defaultPos["lng"] = position.coords.longitude;
    })
  }
}

userLocation();

//builds an infoWindow class for display on a map given data from a point
const buildInfoWindow = function(title, desc, imgUrl) {
  infoWindow = null;

  const contentString =
    '<div id="content">' +
    '<div id="siteNotice">' +
    '</div>' +
    `<img src="${imgUrl}" style="width: 40%; float: right;">` +
    `<h1 id="firstHeading" class="firstHeading">${title}</h1>` +
    '<div id="bodyContent">' +
    `<p>${desc}</p>` +
    '</div>' +
    '</div>';

  infoWindow = new google.maps.InfoWindow({
    content: contentString
  });

  return infoWindow;
};

//places a marker from a list of points on a list
const placeMarker = function(marker, point, map) {

  //newMarker is the marker object
  const newMarker = new google.maps.Marker({position: marker, map: map});

  //adds an event listener on click to craete an info window and display it
  google.maps.event.addListener(newMarker, 'click', function() {
    if (infoWindow) infoWindow.close();
    buildInfoWindow(point.title, point.description, point.img_url);
    infoWindow.open(map, newMarker);
  });

  return newMarker;
};

//renders the map given a centre point and a list of map points
const initMap = function(mapCentre, markerPoints) {
  //sets map variable to map class
  map = new google.maps.Map(document.getElementById('map'), {zoom: 10, center: mapCentre});


  //loops through points and places a marker for each
  if (markerPoints.length) {
    placeMarkersPoints(markerPoints)
    map.fitBounds(bounds, 5);
  }

  //autocomplete function
  var input = document.getElementById('autocomplete');

  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  autocomplete.addListener('place_changed', function() {
      //testMarker.setVisible(false);
      var place = autocomplete.getPlace();
      if (!place.geometry) {
          window.alert("Autocomplete's returned place contains no geometry");
          return;
        }

      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
        const newLocation = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()};

        testMarker = new google.maps.Marker({
          position: newLocation,
          map: map
        });
        bounds.extend(newLocation)

        google.maps.event.addListener(testMarker, 'click', function() {
          $(".add-new-point").slideDown();
          $(".form-latitude").val(place.geometry.location.lat())
          $(".form-longitude").val(place.geometry.location.lng())

        });

        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
    });


};

const getBounds = function() {
  return $.get(`/lists/${listId}/bounds`, data => data);
};

$(document).ready(function() {
  getBounds()
    .then(value => {
      if (value.east !== null) {
        bounds = new google.maps.LatLngBounds({lat: value["south"], lng: value["west"]}, {lat: value["north"], lng: value["east"]});
      }
      return;
    })
    .then(() => {
      return getPoints();
    })
    .then(value => {
      if (bounds === undefined) {
        initMap(defaultPos, value)
      } else {
        initMap(bounds.getCenter(), value);
      }
    });

  // //sets the search box
  // searchBox = new google.maps.places.SearchBox(document.getElementById('autocomplete'), {bounds: bounds});

  // //sets the Places service for searching
  // service = new google.maps.places.PlacesService(map);
});
