
let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  if(document.getElementById('map-container').style.display == 'none' || map) return;
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const div = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    div.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const div = document.createElement('div');

  var imageSrc = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  if(imageSrc)
    image.src = imageSrc;
  image.alt = DBHelper.imageAltText(restaurant);
  div.append(image);

  const div2 = document.createElement('div');
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  div2.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  div2.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  div2.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  var role = document.createAttribute('role');
  role.value = 'button';
  more.setAttributeNode(role);  
  var tabi = document.createAttribute('tabindex');
  tabi.value = 0;
  more.setAttributeNode(tabi);  
  var label = document.createAttribute('aria-label');
  label.value = 'detail for ' + restaurant.name + ' restaurant';
  more.setAttributeNode(label); 
  div2.append(more)

  div.append(div2);
  return div
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  if(!self.map) return;
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

hamIconClick = () => {
  var icon = document.getElementById('ham_icon');
  icon.parentNode.removeChild(icon);
  
  var map = document.getElementById('map-container');
  map.style.display = 'block';
  if(!map) {
    initMap();
  }
}
//name of the database name
const dbName = 'restaurants';
//name of the store name with restaurants
const storeName = 'restaurants';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * API URL
   */
  static get API_URL() {
    const port = 1337 // Change this to YOUR server port
    //url to server with restaurant data
    return `http://127.0.0.1:${port}/restaurants`;
  }

  /**
   * Promise for indexdb db.
   */
  static get dbPromise() {    
    //if there is no service worker available, just return
    if(!navigator.serviceWorker) return Promise.resolve();
    //opening db
    return idb.open(dbName, 1, (db) => {
      db.createObjectStore(storeName, {keyPath:'id'});
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.dbPromise.then(db => {
      //there is no db, so first fetching of data
      if(!db) {
        //fetch data from server
        DBHelper.xhrForRestaurant(callback);
      } else {
        //db exists, just get data from there
        const tx = db.transaction(dbName);
        const store = tx.objectStore(storeName);
        store.getAll().then(restaurants => {
          if(!restaurants || restaurants.length === 0) {
            //no restaurants available?
            DBHelper.xhrForRestaurant(callback);
          } else {
            //we have restaurants, yay, send them through
            callback(null, restaurants)
          }
        });
      }
    });    
  }

  /**
   * Fetch data throught xmlhttprequest
   */
  static xhrForRestaurant(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.API_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurantsFromJson = JSON.parse(xhr.responseText);
        //save restaurants to db
        DBHelper.storeRestaurantsDB(restaurantsFromJson);
        callback(null, restaurantsFromJson);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }              
    };
    xhr.send();
  }

  /**
   * Store all fetched restaurants in indexDB.
   */
  static storeRestaurantsDB(restaurants) {
    DBHelper.dbPromise.then(db => {
      if(!db) return;
      const tx = db.transaction(dbName, "readwrite");
      const store = tx.objectStore(storeName);
      restaurants.forEach(restaurant => {
        store.put(restaurant);
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(!restaurant || restaurant.photograph === undefined) return null;
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static imageAltText(restaurant) {
    return restaurant.name + ' restaurant in ' + restaurant.neighborhood + ' offers ' + restaurant.cuisine_type + ' cuisine type';
  }
}