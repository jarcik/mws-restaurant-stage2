self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('restaurant-reviews-cache')
    .then(cache => {
      return cache.addAll([
        '/',
        './css/styles-extra-large.css',
        './css/styles-large.css',
        './css/styles-medium.css',
        './css/styles.css',
        './data/restaurants.json',
        './img/1.jpg',
        './img/2.jpg',
        './img/3.jpg',
        './img/4.jpg',
        './img/5.jpg',
        './img/6.jpg',
        './img/7.jpg',
        './img/8.jpg',
        './img/9.jpg',
        './img/10.jpg',
        './js/dbhelper.js',
        './js/main.js',
        './js/restaurant_info.js',
        './index.html',
        './restaurant.html'
      ]);
    }).catch(error => console.log(error))
  );
});
  
self.addEventListener('activate',  event => {
    event.waitUntil(self.clients.claim());
  });
  
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});