import decode from './polyline';
import axios from 'axios';
import proj4 from 'proj4';
import querystring from 'querystring';
import { parse, stringify } from 'wellknown';
import { point, feature, featureCollection, 
  polygon, booleanOverlap } from '@turf/turf';
import { HERE, H_DATA_ID, H_DATA, LINZ } from './constants';

// Proj4 defs for projection transformation
proj4.defs("EPSG:2193", "+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:4167", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");

// Utils
export async function getClinics () {
  const clinics = 'https://services2.arcgis.com/9V7Qc4NIcvZBm0io/ArcGIS/rest/services/New_Zealand_Enrolled_General_Practitioner_Facilities/FeatureServer/0'
  const qry = '/query?where=1%3D1&outFields=*&returnGeometry=true&resultRecordCount=5000&f=pgeojson'
  let gjson = await axios.get(clinics+qry)
    .then(resp => {
      // console.log(resp)
      let geojson = resp.data;
      return geojson;
    })
    .catch(e => {
      console.log(e)
    })
  return gjson;
}

export async function getHERE () {
  // Add geojson from HERE Studio
  const ID = H_DATA_ID
  const token = H_DATA
  const admin_bdy = `https://xyz.api.here.com/hub/spaces/${ID}/search?access_token=${token}`

  let data = await axios.get(admin_bdy)
    .then(resp => {
      console.log(resp)
      var gjson = resp.data;
      return gjson;
    })
    .catch(e => {
      console.log(e)
    })
  return data;
}

export async function getIso (geom) {
  var iso_api = 
    `https://isoline.router.hereapi.com/v8/isolines?apiKey=${HERE}&transportMode=car&origin=${geom['lat']},${geom['lng']}&range[type]=distance&range[values]=3000&routingMode=fast`

  let iso = await axios.get(iso_api)
    .then(resp => {
      var outer = decode(resp.data.isolines[0].polygons[0].outer)
      var gjson = isolineToJson(outer)
      return gjson;
    })
    .catch(e => {
      console.log(e)
    })
  return iso;
}

export function isolineToJson (iso) {
  const coords = [];
  for (let i = 0; i < iso.polyline.length; i++) {
    coords.push(iso.polyline[i].reverse());
  }
  coords.push(iso.polyline[0])
  const poly = polygon([coords]);
  return poly;
}

export async function getStatistics (iso) {
  // WFS CQL Filtering for on the fly intersection
  var fields = 'SHAPE,SA12018_V1_00,C18_OccPrivDwelDamp_Always,C18_OccPrivDwelDamp_Sometimes,C18_OccPrivDwelDamp_TotalWith,C18_OccPrivDwelDamp_Not_Damp,C18_OccPrivDwelDamp_TStated,C18_OccPrivDwelDamp_NEI,C18_OccPrivDwelDamp_Total,C18_OccPrivDwelMould_Always,C18_OccPrivDwelMould_Sometimes,C18_OccPrivDwelMould_TotalWith,C18_OccPrivDwelMould_No_mould,C18_OccPrivDwelMould_TStated,C18_OccPrivDwelMould_NEI,C18_OccPrivDwelMould_Total'
  const sa2 = `https://datafinder.stats.govt.nz/services;key=${LINZ}/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=layer-104628&SRSName=EPSG:4326&PropertyName=${fields}&outputformat=json`

  let iso2193 = transformCoords(2193, iso)
  var wkt = stringify(iso2193)
  var cql = `Intersects(SHAPE,${wkt})`

  let intersect = await axios.post(sa2, 
    querystring.stringify({
      cql_filter: cql,
    }), {
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    .then(resp => {
      // console.log('used cql filter',resp.data)
      let geojson = resp.data;
      return geojson;
    })
    .catch(e => {
      console.log(e)
    })
  return calcStatistics(intersect);
}

export function calcStatistics (data) {
  // Populate hex value according to dampness/mould rating
  for (let i = 0; i < data.features.length; i++) {
    // Assign values
    var total = data.features[i].properties.C18_OccPrivDwelDamp_Total;
    var none = data.features[i].properties.C18_OccPrivDwelDamp_Not_Damp;
    var damp_some = data.features[i].properties.C18_OccPrivDwelDamp_Sometimes;
    var damp_always = data.features[i].properties.C18_OccPrivDwelDamp_Always;

    // Account for -999 anonymised data
    if (total === 0 || none === -999) {
      data.features[i].properties.hex_percent = 0;
      data.features[i].properties.hex_colour = '#fff';
    }
    else {
      // Calculate the percentage
      var dampness = damp_some + damp_always;
      var percent = (dampness / total) * 100;

      data.features[i].properties.hex_percent = percent;
      data.features[i].properties.hex_colour = calcHex(percent,0,70);
    }
  }
  return data;
}

export function calcHex (value, min, max) {
  // CartoColor
  //#008080,#70a494,#b4c8a8,#f6edbd,#edbb8a,#de8a5a,#ca562c
  var c = ['#008080','#70a494','#b4c8a8','#f6edbd','#edbb8a','#de8a5a','#ca562c']
  var breaks = (max - min) / 5;
  if (min < 1) min = 1; 
  return value >= max ? c[6] :
    value > min + (4 * breaks) ? c[5] :
    value > min + (3 * breaks) ? c[4] :
    value > min + (2 * breaks) ? c[3] :
    value > min + (1 * breaks) ? c[2] :
    value >= min ? c[1] : c[0];
}

export function transformBbox (srid, bbox) {
  // Get the bounds from map, or optional input bbox
  // Returns a transformed and formatted bbox string
  var srid = srid || 4326; 
  var b = bbox;
  // 4326 = WGS84 (default)
  if (srid === 4326) {
      return `${b[0][0]},${b[0][1]},${b[1][0]},${b[1][1]}`
  }
  // 3857 = Web/Pseudo Mercator
  else if (srid === 3857) {
      var x_3857 = proj4("EPSG:4326", "EPSG:3857", b[0])
      var y_3857 = proj4("EPSG:4326", "EPSG:3857", b[1])
      return `${x_3857[1]},${x_3857[0]},${y_3857[1]},${y_3857[0]}`
  }
  // 4167 = NZGD2000 / Geographic
  else if (srid === 4167) {
      var x_4167 = proj4("EPSG:4326", "EPSG:4167", b[0])
      var y_4167 = proj4("EPSG:4326", "EPSG:4167", b[1])
      return `${x_4167[1]},${x_4167[0]},${y_4167[1]},${y_4167[0]}`
  }
  // 2193 = NZGD2000 / NZTM
  else if (srid === 2193) {
      var x_2193 = proj4("EPSG:4326", "EPSG:2193", b[0])
      var y_2193 = proj4("EPSG:4326", "EPSG:2193", b[1])
      return `${x_2193[1]},${x_2193[0]},${y_2193[1]},${y_2193[0]}`
  }
}

export function transformCoords (srid, gjson) {
  // Transform from 4326 to local projected coordinate system
  if (srid === 4326) {
    return gjson;
  }
  // 2193 = NZGD2000 / NZTM
  else if (srid === 2193) {
    for (let i = 0; i < gjson.geometry.coordinates[0].length; i++) {
      gjson.geometry.coordinates[0][i] = proj4("EPSG:4326", "EPSG:2193", gjson.geometry.coordinates[0][i]).reverse()
    }
    // console.log('proj4',gjson)
    return gjson;
  }
}