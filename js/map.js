var map;
var overlay;

function initMap(centerLonLat, initialZoom, zoomExtent) {
  var osm = new ol.layer.Tile({
    source: new ol.source.OSM()
  });
  
  var scaleLineControl = new ol.control.ScaleLine();
  
  overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
    element: document.getElementById('photopopup'),
    autoPan: true,
    autoPanAnimation: {
      duration: 250
    }
  }));
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
	overlays: [overlay],
    view: new ol.View({
      center: ol.proj.fromLonLat(centerLonLat),
      zoom: initialZoom,
      minZoom: zoomExtent[0],
      maxZoom: zoomExtent[1]
    })
  });
  
}

function addLayer(url, title, colorramp, styleFunction, swipe, promise, swatchFunction, popupSelector) {
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
	  if (popupSelector != undefined) {
        var click = new ol.interaction.Select({
		  layers: [vectorLayer]
		});
        click.on("select", popupSelector);
		map.addInteraction(click);
	  }
  	  addToLegend(title, vectorLayer, colorramp, swatchFunction);
  	  if (swipe) {enableSwipe(vectorLayer);}
	  myPromise.resolve();
    });
  });
  return myPromise;
}

function addToLegend(title, layer, colorramp, swatchFunction) {
  var legendItem = $('<button class="visible"></button>');
  $('#legend').append(legendItem);
  
  var legendLabel = $('<span style="padding: 10px">' + title + '</span>');
  legendItem.after(legendLabel)
  
  var legendCol = $('<button class="minus"></button>');
  legendLabel.after(legendCol)

  var legendScale = $('<ul class="legend-labels"></ul>');
  legendCol.after(legendScale);
  
  for(var i = 0; i<colorramp.length;i++){
    li = swatchFunction(colorramp[i]);
	legendScale.append($(li));
  }
  
  legendItem.on("click", function(evt) {
	var isVisible = layer.getVisible();
    layer.setVisible(!isVisible);
	$(evt.target).toggleClass("visible");
	$(evt.target).toggleClass("invisible");	
  });

  legendCol.on("click", function(evt) {
	var isExpand = layer.getExpand();
	layer.setExpand(!isExpand);
	$(evt.target).toggleClass("plus");
	$(evt.target).toggleClass("minus");
  })
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
		color: [0,0,0,1],
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
function photoStyle(feature, resolution) {
  if (!styleCache["Photo"]) {
    styleCache["Photo"] = new ol.style.Style({
    image: new ol.style.Circle({
	  fill: new ol.style.Fill({
	    color: [255,0,0,0.5]
	  }),
	  stroke: new ol.style.Stroke({
		color: [0,0,0,1],
	    width: 1
	  }),
	  radius: 3 
	})
    });
  }
  return [styleCache["Photo"]];
}
function areaSwatch(swatch) {
  var li = '<li><span style="background:' + swatch.color + ';" class="margin"></span>' + swatch.label + '</li>';
  return li;
}

// these are dots on legend
function pointSwatch(swatch) {
  var li = "";
  if (swatch.type && swatch.type == "FAQ") {
	  li = $('<li/>');
	  var img = $('<a href="#' + swatch.id + '"><img src="images/FAQ-icon.png" class="FAQ margin"/></a>');
	  var closePopup = $('<a class="close" href="#">&times;</a>');
	  var popup = $('<div id="' + swatch.id + '" class="popup">' + swatch.text + '</div>');
	  $(li).append(img);
	  $(li).append(swatch.label);
	  $(popup).append(closePopup);
	  $(li).append(popup);
	  
  } else {
    var svg = '<svg height="15" width="15" class="margin">' +
		  '<circle cx="7" cy="7" r="4" stroke="' + swatch.strokecolor +
		  '" stroke-width="1" fill="' + swatch.color +
		  '" fill-opacity="' + swatch.opacity + '" /></svg>';
    li = '<li>' + svg + swatch.label + '</li>';
  }
  return li;
}


/* Create an overlay to anchor the popup to the map.*/
function photopopup (event){
	var feature = event.target.getFeatures().getArray()[0];
	var coordinate = feature.getGeometry().getCoordinates();
	var photo = feature.get("Photo_Lo_1");
	var water = feature.get("Where_is_w");
	var gage = feature.get("Nearest__1");
	var gagereading = feature.get("Gage_Readi");
	var photoHtml = '<img src="' + photo + '" class = "popup-photo" />';
	var waterHtml = '<p>Where is water: ' + water + '</p>';
	var usgsHtml = '<p>Nearest USGS gage:' + gage + '</p>';
	var readingHtml = '<p>Gage reading at time of photo:' + gagereading + '</p>';
	var html = photoHtml + waterHtml + usgsHtml + readingHtml;
	/* old code var html = '<img src = "' + photo + '" class = "popup-photo" />' +
		'<p>Where is water: ' + water + '</p>' +
		'<p>Nearest USGS gage: ' + gage + '</p>' +
		'<p>Gage reading at time of photo: ' + gagereading + '</p>';*/
	$('#photopopup-content').html(html);
	overlay.setPosition(coordinate);
  	$('#popup-closer').on('click', function() {
  	  overlay.setPosition(undefined);
	  this.blur();
	  return false;
    });
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
