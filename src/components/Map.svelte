<script>
  import L from "leaflet";
  import axios from "axios";
  import "../../public/leaflet/Bing.js";
  import "../../public/leaflet/Leaflet.Editable.js";
  import { onMount } from "svelte";
  // import "leaflet/dist/leaflet.css";
  let height = (window.innerHeight * 0.35).toString() + "px";
  let map;

  let center = [42.87, 74.594];
  let zoom = 17;
  let lat;
  let lon;
  let standsdata = [];
  let currentstand;
  let selected = "";
  let area = "";
  let area_id = 0;
  let multi_json = 0;
  let multi_json_string;
  let polygon;
  let id;
  let bing;
  const api_key =
    "AijiWK2E56tAWqQiXj0TpzHR4V0xb0wDyCUzeUIqjbuPuwoFPP2kiWNi6TUVMpBn";

  onMount(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
      } else {
        location = "Geolocation is not supported by this browser.";
      }
    };
    createMap();
    // L.NewPolygonControl = L.Control.extend({
    //   options: {
    //     position: "topleft"
    //   },

    //   onAdd: function(map) {
    //     var container = L.DomUtil.create("div", "leaflet-control leaflet-bar"),
    //       link = L.DomUtil.create("a", "", container);

    //     link.href = "#";
    //     link.title = "Create a new polygon";
    //     link.innerHTML = "▱";
    //     L.DomEvent.on(link, "click", L.DomEvent.stop).on(
    //       link,
    //       "click",
    //       function() {
    //         map.editTools.startPolygon();
    //       }
    //     );
    //     container.style.display = "block";
    //     map.editTools.on("editable:enabled", function(e) {
    //       container.style.display = "none";
    //     });
    //     map.editTools.on("editable:disable", function(e) {
    //       container.style.display = "block";
    //     });
    //     return container;
    //   }
    // });
    // L.AddPolygonShapeControl = L.Control.extend({
    //   options: {
    //     position: "topleft"
    //   },

    //   onAdd: function(map) {
    //     var container = L.DomUtil.create("div", "leaflet-control leaflet-bar"),
    //       link = L.DomUtil.create("a", "", container);

    //     link.href = "#";
    //     link.title = "Create a new polygon";
    //     link.innerHTML = "▱▱";
    //     L.DomEvent.on(link, "click", L.DomEvent.stop).on(
    //       link,
    //       "click",
    //       function() {
    //         if (!map.editTools.currentPolygon) return;
    //         map.editTools.currentPolygon.editor.newShape();
    //       }
    //     );
    //     container.style.display = "none";
    //     map.editTools.on("editable:enabled", function(e) {
    //       container.style.display = "block";
    //     });
    //     map.editTools.on("editable:disable", function(e) {
    //       container.style.display = "none";
    //     });

    //     return container;
    //   }
    // });

    // map.addControl(new L.NewPolygonControl());
    // map.addControl(new L.AddPolygonShapeControl());
    // map.on("layeradd", function(e) {
    //   if (e.layer instanceof L.Polygon)
    //     e.layer
    //       .on("dblclick", L.DomEvent.stop)
    //       .on("dblclick", e.layer.toggleEdit);
    // });
    // map.on("layerremove", function(e) {
    //   if (e.layer instanceof L.Polygon)
    //     e.layer
    //       .off("dblclick", L.DomEvent.stop)
    //       .off("dblclick", e.layer.toggleEdit);
    // });
    // map.editTools.on("editable:enable", function(e) {
    //   if (this.currentPolygon) this.currentPolygon.disableEdit();
    //   this.currentPolygon = e.layer;
    //   this.fire("editable:enabled");
    // });
    // map.editTools.on("editable:disable", function(e) {
    //   delete this.currentPolygon;
    // });

    axios.get("https://gd.caiag.kg/forestpwagetstands").then(response => {
      const pre_data = response.data;
      refineData(pre_data);
    });
  });

  const showPosition = position => {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    center = [lat, lon];
  };

  const createMap = () => {
    map = L.map("map", {
      editable: true
    }).setView(center, zoom);
    bing = new L.BingLayer(api_key);
    map.addLayer(bing);
  };

  const resize = () => {
    height = (window.innerHeight * 0.35).toString() + "px";
  };

  const refineData = data => {
    standsdata = data.map(elem => {
      return {
        id: elem[0],
        area: JSON.parse(elem[1]),
        line: elem[2],
        point1: elem[3],
        point2: elem[4]
      };
    });
  };

  const handle_select = () => {
    id = selected.id;
    console.log(selected);
    area = L.geoJSON(selected.area).addTo(map);
    multi_json = area.toGeoJSON();
    area_id = area._leaflet_id;
    console.log(area_id);
    // let multi = area.addTo(map);
    // map.setView([42.87, 74.594], 5)
    map.fitBounds(area.getBounds());
    area.getLayers().forEach(l => {
      l.enableEdit();
    });

    // const geo = L.geoJSON(geoJsonObj).addTo(this.map);
    // geo.enableEdit();
    // geo.getLayers().forEach(l => l.enableEdit())
  };
  const refresh_area = () => {
    console.log(area.toGeoJSON());
    console.log(polygon.toGeoJSON());
    area = area;
  };

  const add_to_current = () => {
    area._layers[area_id - 1]._latlngs[0].push(polygon._latlngs[0]);
  };

  const save_changes = () => {
    multi_json = area.toGeoJSON();
    multi_json_string = JSON.stringify(multi_json.features[0].geometry);
    axios.post(
      "https://gd.caiag.kg/forestpwawritemultipoly?geojson=" +
        `'` +
        multi_json_string +
        `'` +
        "&id=" +
        id
    );
  };

  const start_polygon = () => {
    polygon = 0;
    polygon = map.editTools.startPolygon();
  };

  const show_map_object = () => {
    console.log(polygon.toGeoJSON());
  };

  const stop_drawing = () => {
    map.editTools.stopDrawing();
  };

  const show_url = () => {
    Object.entries(bing._tiles).forEach(elem => {
      console.log(elem[1].el.getAttribute("src"))
    })
    // console.log(bing._tiles)
  }


// In your web app's JavaScript:

async function add_to_cache() {
  const urls = Object.entries(bing._tiles).map(elem => {
      return elem[1].el.getAttribute("src")
    })
  const myCache = await window.caches.open('bing-maps');
  await myCache.addAll(urls);
}
// caches.open('v1').then(function(cache) {
//   cache.matchAll('/images/').then(function(response) {
//     response.forEach(function(element, index, array) {
//       cache.delete(element);
//     });
//   });
// })
// Call addToCache whenever you'd like. E.g. to add to cache after a page load:
// window.addEventListener('load', () => {
//   // ...do something to determine the list of related URLs for the current page...
//   addToCache(['/static/relatedUrl1', '/static/relatedUrl2']);
// });
</script>

<style>
  .map {
    width: 98vw;
    margin: auto;
  }
</style>

<svelte:window on:resize={resize} on:orientationchange={resize} />

<div style="height: {height}" class="map" id="map">
  <slot />
</div>

<br />

<span>Выберите выдел</span>

<select bind:value={selected} on:change={handle_select}>
  {#each standsdata as stand}
    <option value={stand}>{stand.id}</option>
  {/each}
</select>
<br />

<button class="action" on:click={refresh_area}>Refresh Selected</button>
<button class="action" on:click={save_changes}>Save changes</button>
<button class="action" on:click={show_map_object}>Show L.map</button>
<br />
<button class="action" on:click={start_polygon}>Start Polygon</button>
<button class="action" on:click={stop_drawing}>Stop drawing</button>
<button class="action" on:click={add_to_current}>Add to current</button>
<br />
<button class="action" on:click={show_url}>Show url</button>
<button class="action" on:click={add_to_cache}>Add to cache</button>


{#if area != ''}
  {#each area._layers[area_id - 1]._latlngs[0][0] as coordinate, index}
    <p>{index}</p>
    <p>{coordinate}</p>
  {/each}
{/if}
