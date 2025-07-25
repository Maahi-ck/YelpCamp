mapboxgl.accessToken = mapToken; 

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: campData.coordinates,
  zoom: 10
});

new mapboxgl.Marker()
  .setLngLat(campData.coordinates)
  .setPopup(
        new mapboxgl.Popup( { offset:25})
        .setHTML(
            `<h3>${campground.title}</h3>`
        )
  )
  .addTo(map);
  
