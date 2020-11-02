import React from 'react';
import { Nav, Spinner } from 'react-bootstrap';
import mapboxgl from 'mapbox-gl';
import { bbox } from '@turf/turf';
import { calcHex, getECE, getHERE, getIso } from './utils';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

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
  
    let ece = await getECE()
    console.log('geojson is',ece)

    map.addSource("ece-src", {
      "type": "geojson",
      "data": ece
    });
    map.addLayer({
      "id": "ece-lyr",
      "type": "circle",
      "source": "ece-src",
      'minzoom': 8,
      'maxzoom': 22,
      'paint': {
        'circle-color': ['get','hex'],
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#000'
      },
    });

    // Change to a pointer
    map.on('mouseenter', 'ece-lyr', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'ece-lyr', () => {
      map.getCanvas().style.cursor = '';
    });

    // Create a popup, but don't add it to the map yet.
    var pop = new mapboxgl.Popup({
      // closeButton: false,
      // closeOnClick: false,
      offset: 6
    });

    map.on('click', 'ece-lyr', async function (e) {
      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = 'pointer';

      var description = 
        "<strong>Early Childhood Centre</strong><br/>" +
        "Name: " + e.features[0].properties.Org_Name + "<br/>" +
        "Address: " + e.features[0].properties.Add1_Line1 + ",<br/>" +
        e.features[0].properties.Add1_Suburb + ", " + 
        e.features[0].properties.Add1_City + "<br/>" +
        "Total Enrolled: " + e.features[0].properties.All_Children + "<br/>";

      // Populate the popup and set its coordinates
      // based on the feature found.
      pop
        .setLngLat(e.lngLat)
        .setHTML(description)
        .addTo(map);

      console.log('clicked',e.lngLat,e.features[0])

      console.log('getting iso')
      that.activity(true);
      var isojson = await getIso(e.lngLat);
      console.log('isojson',isojson)
      that.addIsoLayer(isojson);
    });

    this.activity(false);
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
    map.addLayer({
        "id": "iso-lyr-fill",
        "type": "fill",
        "source": "iso-src",
        'minzoom': 11,
        'maxzoom': 22,
        "paint": {
            "fill-outline-color": "#000",
            "fill-color": "#000",
            "fill-opacity": 0.1,
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

    this.activity(false);

    var lyrcoords = bbox(iso)
    map.fitBounds(lyrcoords, {
      padding: 150
    });
  }

  addLyrListControls = () => {
    const map = this.state.map;
    // Handle layers within layer toggle control
    var toggleableLayerIds = [
      // Map cadastral layers
      { id: 'ece-lyr', label: 'Early Childhood', legend: '<span class="dot-legend" style="background-color: #ecf0f1"></span>' },
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

  showExample = () => {
    // fly to point
    // simulate click 
    // gnerate isoline
    // query demographics
    const ll = new mapboxgl.LngLat(174.6830667437393, -36.88391158772749)
    const map = this.state.map;
    console.log('firing',ll)
    map.fire('click', { lngLat: ll })
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
      this.addLyrListControls();
      // getHERE();
      // this.showExample();
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