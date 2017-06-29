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

function addLayer(url, title, colorramp, styleFunction, swipe, promise) {
  if (promise == undefined) {
	promise = $.Deferred();
	promise.resolve();
  }
  var myPromise = $.Deferred();
  $.when(promise).then(function() {
    $.get(url, function(data) { 
      var vectorSource = new ol.source.Vector({
  	    features: (new ol.format.GeoJSON()).readFeatures(data)
  	  });
  
  	  var vectorLayer = new ol.layer.Vector({
  	    source: vectorSource,
  	    style: styleFunction
  	  });
  	  map.addLayer(vectorLayer);
  	  addToLegend(title, vectorLayer, colorramp);
  	  if (swipe) {enableSwipe(vectorLayer);}
	  myPromise.resolve();
    });
  });
  return myPromise;
}

function addToLegend(title, layer, colorramp) {
  var legendItem = $('<button class="visible"></button>');
  $('#legend').append(legendItem);
  
  var legendLabel = $('<span>' + title + '</span>');
  legendItem.after(legendLabel)

  var legendScale = $('<ul class="legend-labels"></ul>');
  legendLabel.after(legendScale);
  
  for(var i = 0; i<colorramp.length;i++){
	var li = '<li><span style="background:' + colorramp[i]['color'] + ';"></span>' +
	colorramp[i]['label'] + '</li>';
	legendScale.append($(li));
  }
  
  legendItem.on("click", function(evt) {
	var isVisible = layer.getVisible();
    layer.setVisible(!isVisible);
	$(evt.target).toggleClass("visible");
	$(evt.target).toggleClass("invisible");	
  });

  
}

// optimization
var styleCache = {
  default: new ol.style.Style({
    fill: new ol.style.Fill({
	  color: [255,255,255,0.5]
	}),
    stroke: new ol.style.Stroke({
      color: [255,255,255,1],
	  width: 1
	}),
    image: new ol.style.Circle({
	  fill: new ol.style.Fill({
	    color: [0,0,0,0.5]
	  }),
	  stroke: new ol.style.Stroke({
		color: [255,255,255,1],
	    width: 1
	  }),
	  radius: 3 
	})
  })
};
function categoricalStyle(feature, resolution) {
  var id = feature.get('CITY_LIMIT');
  if (!id) {
    return [styleCache.default];
  }
  if (!styleCache[id]) {
	var color = [255,255,255,1];
	if (id == 1) {
		color = [244, 241, 66, 1];
	} else if (id == 2) {
		color = [244, 166, 65, 1];
	} else if (id == 3) {
		color = [244, 65, 65, 1];
	} else if (id == 5) {
		color = [184, 65, 244, 1];
	} else {
		color = [255, 255, 255, 1];
	}
	var fillColor = color;
	var strokeColor = color;
	fillColor[3] = 0.5;
    styleCache[id] = new ol.style.Style({
      fill: new ol.style.Fill({
        color: fillColor
      }),
      stroke: new ol.style.Stroke({
	    color: strokeColor,
		width: 1
	  })
    });
  }
  return [styleCache[id]];
}

function historicalStyle(feature, resolution) {
  if (!styleCache["historical"]) {
	var color = [0,0,255,1];
	
	var fillColor = color;
	var strokeColor = color;
	fillColor[3] = 0.5;
    styleCache["historical"] = new ol.style.Style({
      fill: new ol.style.Fill({
        color: fillColor
      }),
      stroke: new ol.style.Stroke({
	    color: strokeColor,
		width: 1
	  })
    });
  }
  return [styleCache["historical"]];
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
