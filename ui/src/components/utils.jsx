import { encode, decode } from './polyline';
import axios from 'axios';
import { point, feature, featureCollection, polygon } from '@turf/turf';

const HERE = '8A2g5AjfRMpTn59J9SB0m_AWBgO6B0lzzGtNsArwCt4'

// Utils
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


export async function getECE () {
  const ece = 'https://catalogue.data.govt.nz/api/3/action/datastore_search?resource_id=f65dfeb4-94be-4879-957c-e081d9570216&limit=5000'
  const qry = '?sql=SELECT * from "f65dfeb4-94be-4879-957c-e081d9570216" WHERE Add1_City IN ("Auckland","Wellington","Christchurch")'
  const feats = []
  let gjson = await axios.get(ece)
    .then(resp => {
      // console.log(resp)
      let records = resp.data.result.records;

      var min = Math.min.apply(Math, records.map(function (o) { return o.All_Children; }))
      var max = Math.max.apply(Math, records.map(function (o) { return o.All_Children; }))

      for (let i = 0; i < records.length; i++) {
        let geom = [records[i].Longitude, records[i].Latitude]
        feats.push({
          "type": "Feature",
          "properties": {
            ...records[i],
            "hex": calcHex(records[i].All_Children, min, max)
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

export async function getHERE () {
  // add geojson from here studio
  const ID = 'pO2YTR8X'
  const token = 'AKkxwrw0T9KZYZQ2NmVRigA'
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
    `https://isoline.router.hereapi.com/v8/isolines?apiKey=${HERE}&transportMode=car&origin=${geom['lat']},${geom['lng']}&range[type]=distance&range[values]=4000&routingMode=fast`

  let iso = await axios.get(iso_api)
    .then(resp => {
      // console.log('here isoline',resp,resp.data.isolines[0].polygons[0].outer)
      var outer = decode(resp.data.isolines[0].polygons[0].outer)
      // console.log(outer)
      var gjson = isolineToJson(outer)
      return gjson;
    })
    .catch(e => {
      console.log(e)
    })
  return iso;
}

export function isolineToJson(iso) {
  const coords = [];
  for (let i = 0; i < iso.polyline.length; i++) {
    coords.push(iso.polyline[i].reverse());
  }
  coords.push(iso.polyline[0])
  const poly = polygon([coords]);
  return poly;
}