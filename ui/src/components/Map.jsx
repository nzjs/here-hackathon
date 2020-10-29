import React from 'react';
import { Nav } from 'react-bootstrap';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import axios from 'axios';

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
    this.state = {
      map: null,
      selection: [],
      popup: null,
    }
  }

  sendToParent = (selection) => {
    this.props.callback(selection);
  }

  // componentDidUpdate(prevProps, prevState) {

  // }

  getECE = async () => {
    const ece = 'https://catalogue.data.govt.nz/api/3/action/datastore_search?resource_id=f65dfeb4-94be-4879-957c-e081d9570216&limit=5000'
    const qry = '?sql=SELECT * from "f65dfeb4-94be-4879-957c-e081d9570216" WHERE Add1_City IN ("Auckland","Wellington","Christchurch")'
    const feats = []
    let gjson = await axios.get(ece)
      .then(resp => {
        console.log(resp)
        let records = resp.data.result.records;
        for (let i = 0; i < records.length; i++) {
          let geom = [records[i].Longitude, records[i].Latitude]
          feats.push({
            "type": "Feature",
            "properties": {
              ...records[i] 
            },
            "geometry": {
              "type": "Point",
              "coordinates": geom
            }
          });  
        }
        let geojson = {
          "type": "FeatureCollection",
          "features": feats
        }
        return geojson;
      })
      .catch(e => {
        console.log(e)
      })
    return gjson;
  }
  

  addLayers = async (map) => {
    let ece = await this.getECE()
    console.log('geojson is',ece)

    map.addSource("ece-src", {
      "type": "geojson",
      "data": ece
    });
    map.addLayer({
      "id": "ece-lyr",
      "type": "circle",
      "source": "ece-src",
      'minzoom': 10,
      'maxzoom': 22,
      'paint': {
        'circle-color': '#ecf0f1',
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#000'
      },
    });

    map.on('mouseenter', 'ece-lyr', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'ece-lyr', () => {
      map.getCanvas().style.cursor = '';
    });

  }

  updateLayers = (map) => {

  }

  addLyrListControls = (map) => {
    // Handle layers within layer toggle control
    var that = this;
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

  componentDidMount() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoib3JiaWNhIiwiYSI6ImNqcmxhazIwZzA2ajA0YW11cHc3OGM3M3AifQ.wTbR1Nh5HxJi8xLu0HLREQ';
    const HERE = '8A2g5AjfRMpTn59J9SB0m_AWBgO6B0lzzGtNsArwCt4'
    // Set initial view state to Auckland
    const vw = {
      longitude: 174.763641,
      latitude: -36.860944,
      zoom: 10,
      style: 'mapbox://styles/mapbox/dark-v9'
      //'mapbox://styles/mapbox/satellite-streets-v11'
      //mapbox.mapbox-streets-v8
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

    // map.on('load', () => this.updateLyrSources(map));
    // map.on('styledata', () => this.updateLyrSources(map));

    map.on('load', () => {
      // Initialise layers with bbox
      this.addLayers(map);
      this.addLyrListControls(map);
    })

    map.on('moveend', () => {
      // Update layers with bbox after moveend
      this.updateLayers(map);
    })

    // When a click event occurs on a feature in the ai points layer, display the ai data.
    // map.on('click', 'ai-point', (e) => {
    //   // Pass data back to parent for displaying in panel - pass obj key/value to array
    //   //var selection = Object.entries(e.features[0].properties)
    //   var selection = []
    //   selection.push(e.features[0].properties)
    //   selection.push(e.features[0].geometry.coordinates.slice())
    //   this.setState({
    //     selection: selection
    //   }, () => {
    //     this.sendToParent(selection)

    //     // Pass index values to panel for arrow forward/back
    //     var currentIndex = this.getCurrentSelectionIndex(selection, this.state.currentData.features)
    //     this.sendCurrentIndexToParent(currentIndex)

    //     // Display a basic popup as well
    //     var coordinates = e.features[0].geometry.coordinates.slice();
    //     // var popImg = `https://${e.features[0].properties.s3_bucket}.s3-ap-southeast-2.amazonaws.com/${e.features[0].properties.s3_key}`
    //     // var description = '<img src="'+popImg+'" class="img-popup"/><br/>'+
    //     //   '<strong>Image Captured</strong><br/>' + e.features[0].properties.uploaded_orig;
    //     var description = '<strong>Image Captured</strong><br/>' + e.features[0].properties.uploaded_orig;

    //     // Ensure that if the map is zoomed out such that multiple
    //     // copies of the feature are visible, the popup appears
    //     // over the copy being pointed to.
    //     while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    //       coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    //     }

    //     var popup = new mapboxgl.Popup()
    //       .setLngLat(coordinates)
    //       .setHTML(description)
    //       .addTo(map);
    //     this.setState({
    //       popup: popup
    //     })
    //   })
    // });

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