//start of the cache name (used even in comparing in deleting cache)
const cacheNameStartWith = 'restaurant-reviews-cache-';
//name of a cache - as a constant
const cacheNameFullStatic = cacheNameStartWith+'v5';

//install sw
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheNameFullStatic)
    .then(cache => {
      return cache.addAll([
        '/',
        './dist/styles-extra-large.css',
        './dist/styles-large.css',
        './dist/styles-medium.css',
        './dist/styles-small.css',
        './dist/styles.css',
        './dist/styles-detail.css',
        './dist/styles-extra-large-detail.css',
        './dist/styles-large-detail.css',
        './dist/styles-medium-detail.css',
        './img/1.webp',
        './img/2.webp',
        './img/3.webp',
        './img/4.webp',
        './img/5.webp',
        './img/6.webp',
        './img/7.webp',
        './img/8.webp',
        './img/9.webp',
        './img/10.webp',
        './dist/detail.min.js',
        './dist/app.min.js',
        './dist/vendors.min.js',
        './index.html',
        './restaurant.html'
      ]);
    }).catch(error => console.log(error))
  );
});

//get rid off old caches
self.addEventListener('activate',  event => {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => {
            return name.startsWith(cacheNameStartWith) && name != cacheNameFullStatic;
          }).map(name => {
            return caches.delete(name);
          })
        )
      })
    );
  });

//fetching of sw
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(cacheNameFullStatic).then(cache => {
      return cache.match(event.request, {ignoreSearch:true}).then(response => {
        if(response) {
          return response;
        } else {
          return fetch(event.request).then(fetchResponse => {
            return fetchResponse;
          }).catch(error => {
            console.log("error in fetching data from " + event.request.url);
            console.log(error);
          })
        }
      })
    }).catch(error => {
      console.log("error in fetching data with sw");
      console.log(error);
    })
  );
});