import React from 'react';
import { Nav, Spinner } from 'react-bootstrap';
import mapboxgl from 'mapbox-gl';
import { bbox } from '@turf/turf';
import { getClinics, getIso, getStatistics, transformBbox } from './utils';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { LINZ } from './constants';

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
    this.state = {
      map: null,
      selection: [],
      popup: null,
      activity: true
    }
  }

  sendToParent = (selection) => {
    this.props.callback(selection);
  }  

  addLayers = async () => {
    const that = this;
    const map = this.state.map;
  
    ////////////////////////////////////////
    // SA2s
    var bbox2193 = transformBbox(2193, map.getBounds().toArray())
    var fields = 'SHAPE,SA12018_V1_00,C18_OccPrivDwelDamp_Always,C18_OccPrivDwelDamp_Sometimes,C18_OccPrivDwelDamp_TotalWith,C18_OccPrivDwelDamp_Not_Damp,C18_OccPrivDwelDamp_TStated,C18_OccPrivDwelDamp_NEI,C18_OccPrivDwelDamp_Total,C18_OccPrivDwelMould_Always,C18_OccPrivDwelMould_Sometimes,C18_OccPrivDwelMould_TotalWith,C18_OccPrivDwelMould_No_mould,C18_OccPrivDwelMould_TStated,C18_OccPrivDwelMould_NEI,C18_OccPrivDwelMould_Total'
    var sa2 = `https://datafinder.stats.govt.nz/services;key=${LINZ}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=layer-104628&SRSName=EPSG:4326&BBOX=${bbox2193}&PropertyName=${fields}&outputformat=json`
    map.addSource("sa2-src", {
      "type": "geojson",
      "data": sa2
    });
    map.addLayer({
        "id": "sa2-lyr",
        "type": "line",
        "source": "sa2-src",
        'minzoom': 12,
        'maxzoom': 22,
        "paint": {
            "line-color": "#ddd",
            "line-width": 1
        }
    });
    map.addLayer({
        "id": "sa2-lyr-fill",
        "type": "fill",
        "source": "sa2-src",
        'minzoom': 12,
        'maxzoom': 22,
        "paint": {
            "fill-outline-color": "#ddd",
            "fill-color": "#ddd",
            "fill-opacity": 0.05,
        }
    });

    ////////////////////////////////////////
    // Clinics
    var clinics = await getClinics()
    // console.log('geojson is',clinics)
    var img = './assets/svgs/hospital-15.svg.png'
    map.loadImage(img, function(err,gp) {
      if (err) throw err;
      map.addImage('gp', gp)
    });
    map.addSource("clinics-src", {
      "type": "geojson",
      "data": clinics
    });
    map.addLayer({
      "id": "clinics-lyr",
      "type": "symbol",
      "source": "clinics-src",
      'minzoom': 8,
      'maxzoom': 22,
      'layout': {
        'icon-image': 'gp',
        'icon-size': 1.05,
        'icon-allow-overlap': true,
      },
    });
    this.addLyrListControls();

    // Change to a pointer
    map.on('mouseenter', 'clinics-lyr', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'clinics-lyr', () => {
      map.getCanvas().style.cursor = '';
    });
    // Create a popup, but don't add it to the map yet.
    var pop = new mapboxgl.Popup({
      // closeButton: false,
      closeOnClick: false,
      offset: 6
    });
    map.on('click', 'clinics-lyr', async function (e) {
      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = 'pointer';

      var description = 
        "<h6>GP / Health Clinic</h6>" +
        "<strong>Name:</strong> " + e.features[0].properties.Name + "<br/>" +
        "<strong>Address:</strong> " + e.features[0].properties.Address + ",<br/>" +
        "<strong>DHB:</strong> " + e.features[0].properties.DHB_Name + "<br/>" +
        "<strong>PHO:</strong> " + e.features[0].properties.PHO;

      // Populate the popup and set its coordinates
      // based on the feature found.
      pop
        .setLngLat(e.lngLat)
        .setHTML(description)
        .addTo(map);

      // console.log('clicked',e.lngLat,e.features[0])

      // Add isochrone layer
      that.activity(true);
      var isojson = await getIso(e.lngLat);
      // console.log('isojson',isojson)
      that.addIsoLayer(isojson);

      // Fit map to the isochrone/service area layer
      var lyrcoords = bbox(isojson)
      map.fitBounds(lyrcoords, {
        padding: 150
      })

      // Run intersection and analyse the results 
      var results = await getStatistics(isojson);
      that.addStatisticsLayer(results);

    });

    this.activity(false);
  }

  updateLayers = () => {
    // Handle bbox changes
    var map = this.state.map;
    var fields = 'SHAPE,SA12018_V1_00,C18_OccPrivDwelDamp_Always,C18_OccPrivDwelDamp_Sometimes,C18_OccPrivDwelDamp_TotalWith,C18_OccPrivDwelDamp_Not_Damp,C18_OccPrivDwelDamp_TStated,C18_OccPrivDwelDamp_NEI,C18_OccPrivDwelDamp_Total,C18_OccPrivDwelMould_Always,C18_OccPrivDwelMould_Sometimes,C18_OccPrivDwelMould_TotalWith,C18_OccPrivDwelMould_No_mould,C18_OccPrivDwelMould_TStated,C18_OccPrivDwelMould_NEI,C18_OccPrivDwelMould_Total'
    var bbox2193 = transformBbox(2193, map.getBounds().toArray())
      if (map.getSource("sa2-src")) {
        var lyr = map.getSource("sa2-src");
        var sa2 = `https://datafinder.stats.govt.nz/services;key=${LINZ}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=layer-104628&SRSName=EPSG:4326&BBOX=${bbox2193}&PropertyName=${fields}&outputformat=json`;
        lyr.setData(sa2);
      }
  }

  addIsoLayer = (iso) => {
    // Add isoline layer on user selection
    const map = this.state.map;
    if (map.getLayer("iso-lyr")) map.removeLayer("iso-lyr");
    if (map.getLayer("iso-lyr-fill")) map.removeLayer("iso-lyr-fill");
    if (map.getSource("iso-src")) map.removeSource("iso-src");

    map.addSource("iso-src", {
      "type": "geojson",
      "data": iso
    });
    map.addLayer({
      "id": "iso-lyr",
      "type": "line",
      "source": "iso-src",
      'minzoom': 2,
      'maxzoom': 22,
      "paint": {
          "line-color": "#000",
          "line-width": 2
      }
    });

    // Change to a pointer
    map.on('mouseenter', 'iso-lyr', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'iso-lyr', () => {
      map.getCanvas().style.cursor = '';
    });
    map.moveLayer('clinics-lyr')
    this.activity(false);

  }

  addStatisticsLayer = (results) => {
    // Add results layer and respective data viz
    this.activity(true);
    const map = this.state.map;
    if (map.getLayer("results-lyr")) map.removeLayer("results-lyr");
    if (map.getLayer("results-lyr-fill")) map.removeLayer("results-lyr-fill");
    if (map.getSource("results-src")) map.removeSource("results-src");

    map.addSource("results-src", {
      "type": "geojson",
      "data": results
    });
    map.addLayer({
      "id": "results-lyr",
      "type": "line",
      "source": "results-src",
      'minzoom': 2,
      'maxzoom': 22,
      "paint": {
          "line-color": "#000",
          "line-width": 1
      },
    });
    map.addLayer({
      "id": "results-lyr-fill",
      "type": "fill",
      "source": "results-src",
      'minzoom': 2,
      'maxzoom': 22,
      "paint": {
        "fill-color": ['get','hex_colour'],
        "fill-opacity": 0.85,
      }
    });

    // Create a popup, but don't add it to the map yet.
    var hoverPop = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    // Change to a pointer
    map.on('mousemove', 'results-lyr-fill', (e) => {
      map.getCanvas().style.cursor = 'pointer';

      // Hover popup with basic stats
      var description = 
        "According to the 2018 Census,<br/>" +
        "<strong>" + e.features[0].properties.hex_percent.toFixed(0) + "%</strong> " +
        "of homes in this area were<br/>" +
        "reported as damp or mouldy.";
      
      // Populate the popup and set its coordinates based on the feature found.
      hoverPop
        .setLngLat(e.lngLat)
        .setHTML(description)
        .addTo(map);
    });
    map.on('mouseenter', 'results-lyr', (e) => {
      map.getCanvas().style.cursor = 'pointer';

      // Hover popup with basic stats
      var description = 
        "According to the 2018 Census,<br/>" +
        "<strong>" + e.features[0].properties.hex_percent.toFixed(0) + "%</strong> " +
        "of homes in this area were<br/>" +
        "reported as damp or mouldy.";
      
      // Populate the popup and set its coordinates based on the feature found.
      hoverPop
        .setLngLat(e.lngLat)
        .setHTML(description)
        .addTo(map);
    });
    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'results-lyr-fill', () => {
      map.getCanvas().style.cursor = '';
      hoverPop.remove();
    });
    map.on('mouseleave', 'results-lyr', () => {
      map.getCanvas().style.cursor = '';
      hoverPop.remove();
    });
    map.moveLayer('iso-lyr')
    map.moveLayer('clinics-lyr')
    this.activity(false);

  }

  addLyrListControls = () => {
    const map = this.state.map;
    // Handle layers within layer toggle control
    var toggleableLayerIds = [
      // Map cadastral layers
      { id: 'clinics-lyr', label: 'GP / Health Clinics', legend: '<span class="dot-legend" style="background-color: #fff"></span>' },
    ];
    // Set up the corresponding toggle button for each layer
    for (var i = 0; i < toggleableLayerIds.length; i++) {
      var id = toggleableLayerIds[i]['id'];
      var label = toggleableLayerIds[i]['label'];
      var legendVal = toggleableLayerIds[i]['legend'];
      var legend = legendVal ? legendVal : '';

      var link = document.createElement('a');
      var vis = map.getLayoutProperty(toggleableLayerIds[i]['id'], 'visibility');
      link.href = '#';
      link.className = (vis === 'none') ? '' : 'active';
      link.innerHTML = label + legend;
      link.id = id;

      link.onclick = function (e) {
        var clickedLayer = this.id;
        e.preventDefault();
        e.stopPropagation();
        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        // Toggle layer visibility by changing the layout object's visibility property
        if (visibility === 'none') { // Display it
          map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
          this.className = 'active';
        }
        else { // Hide it
          map.setLayoutProperty(clickedLayer, 'visibility', 'none');
          this.className = '';
        }
      };
      var layers = document.getElementById('menu');
      layers.appendChild(link);
    }

  }

  componentDidMount() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoib3JiaWNhIiwiYSI6ImNqcmxhazIwZzA2ajA0YW11cHc3OGM3M3AifQ.wTbR1Nh5HxJi8xLu0HLREQ';
    // Set initial view state to Auckland
    const vw = {
      longitude: 174.763641,
      latitude: -36.860944,
      zoom: 10,
      style: 
      'mapbox://styles/mapbox/light-v9'
      // 'mapbox://styles/mapbox/dark-v9'
    }

    // Init Mapbox.gl map canvas
    const map = new mapboxgl.Map({
      container: 'map',
      style: vw.style,
      center: [vw.longitude, vw.latitude],
      zoom: vw.zoom,
    });
    this.setState({
      map: map
    });

    map.on('load', () => {
      // Initialise layers with bbox
      this.addLayers();
    })

    map.on('moveend', () => {
      // Re fetch upon map move
      this.updateLayers();
    })

    this.addCustomControls(map);
  }

  addCustomControls = (map) => {
    var geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      countries: 'nz',
      placeholder: 'Find address or place'
    });
    var nav = new mapboxgl.NavigationControl();
    var scale = new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    });
    map.addControl(geocoder, 'top-left');
    map.addControl(nav, 'top-left');
    map.addControl(scale);
  }

  activity = (bool) => {
    this.setState({activity: bool})
  }

  fly = (loc) => {
    switch(loc) {
      case 'akl':
        this.state.map.flyTo({center: [174.763641,-36.860944], zoom: 10})
        break;
      case 'wgn':
        this.state.map.flyTo({center: [174.778404,-41.287739], zoom: 11})
        break;
      case 'chc':
        this.state.map.flyTo({center: [172.635405,-43.525003], zoom: 11})
        break;
      default:
        break;
    }
  }

  render() {
    return (
      <div id='container'>
        <div id='map'>
          {this.state.activity ? <Spinner variant="primary" animation="border" id="acty" /> : null }
          <div id="shortcuts">
            <Nav className="justify-content-center">
              <Nav.Item><Nav.Link href="#akl" className='short' onClick={(e) => this.fly('akl')}>Auckland</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link href="#wgn" className='short' onClick={(e) => this.fly('wgn')}>Wellington</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link href="#chc" className='short' onClick={(e) => this.fly('chc')}>Christchurch</Nav.Link></Nav.Item>
            </Nav>
          </div>
          <nav id='menu'>
            <span id='menu-title'>Map Layers</span>
          </nav>
        </div>
      </div>
    );
  }
}

export default Map;