var map;

function initMap(centerLonLat, initialZoom, zoomExtent) {
  var osm = new ol.layer.Tile({
    source: new ol.source.OSM()
  });
  
  var scaleLineControl = new ol.control.ScaleLine();
  
  map = new ol.Map({
    layers: [osm],
    target: 'map',
    controls: ol.control.defaults({
      attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
  	  collapsible: false
      })
    }).extend([
      scaleLineControl
    ]),
    view: new ol.View({
      center: ol.proj.fromLonLat(centerLonLat),
      zoom: initialZoom,
      minZoom: zoomExtent[0],
      maxZoom: zoomExtent[1]
    })
  });
  
}

function addLayer(url, title) {
  $.get(url, function(data) { 
    var vectorSource = new ol.source.Vector({
      features: (new ol.format.GeoJSON()).readFeatures(data)
    });

	var vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });
	map.addLayer(vectorLayer);
    addToLegend(title, vectorLayer);
	enableSwipe(vectorLayer);
  });
}

function addToLegend(title, layer) {
  var legendItem = $('<h4>' + title + '</h4>');
  legendItem.on("click", function(evt) {
	var isVisible = layer.getVisible();
    layer.setVisible(!isVisible);
  });

  $('#legend').append(legendItem);
}

function enableSwipe(layer) {
  var swipe = document.getElementById('swipe');
  
  layer.on('precompose', function(event) {
    var ctx = event.context;
    var width = ctx.canvas.width * (swipe.value / 100);
  
    ctx.save();
    ctx.beginPath();
    ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
    ctx.clip();
  });
  
  layer.on('postcompose', function(event) {
    var ctx = event.context;
    ctx.restore();
  });
  
  swipe.addEventListener('input', function() {
    map.render();
  }, false);

}
