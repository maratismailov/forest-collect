<script>
  import L from "leaflet";
  import axios from "redaxios";
  import "../../public/leaflet/Bing.js";
  import "../../public/leaflet/Leaflet.Editable.js";
  import { onMount } from "svelte";
  // import "leaflet/dist/leaflet.css";
  let height = (window.innerHeight * 0.35).toString() + "px";
  let map;

  let center = [41.595, 74.673];
  let zoom = 7;
  let lat;
  let lon;
  let allplaces;
  let selected_oblast;
  let selected_leshoz;
  let fullleshozlist = [];
  let leshozlist = [];
  let forestrieslist = [];
  let db;
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
    //check for support
    if (!("indexedDB" in window)) {
      console.log("This browser doesn't support IndexedDB");
      return;
    }
    // var idb = window.indexedDB
    var db_surveycard = indexedDB.open("db_surveycard", 1);
    db_surveycard.onsuccess = function(e) {
      db = e.target.result;
      getResult();
    };
    db_surveycard.onerror = function(e) {
      console.log("onerror!");
      console.dir(e);
    };
    db_surveycard.onupgradeneeded = function(e) {
      db = e.target.result;
      if (!db.objectStoreNames.contains("allplaces")) {
        var allplaces = db.createObjectStore("allplaces", {
          autoIncrement: true
        });
      }
      // if (!db.objectStoreNames.contains("geo")) {
      //   var books_store = db.createObjectStore("geo", {
      //     autoIncrement: true
      //   });
      // }
      // if (!db.objectStoreNames.contains("search_result")) {
      //   var books_store = db.createObjectStore("search_result", {
      //     autoIncrement: true
      //   });
      // }
    };
    function getResult() {
      var transaction = db.transaction(["allplaces"], "readonly");
      var store = transaction.objectStore("allplaces");

      var request = store.get(1);

      request.onerror = function(e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function(e) {
        allplaces = e.target.result;
        if (allplaces != undefined) {
          make_fullleshozlist();
        }
        console.log("allplaces from idb", allplaces);
        if (allplaces == undefined) {
          console.log("is getting", allplaces);
          getAllplaces();
        }
      };
    }
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
      } else {
        location = "Geolocation is not supported by this browser.";
      }
    };
    createMap();
  });

  const getAllplaces = () => {
    console.log("getiing");
    const allplaces_query = `{
                    allplaces {
                      oblasts {
                        oblast_id
                        oblast_ru
                        leshoz_list {
                          leshoz_id
                          leshoz_ru
                          forestries_list {
                            forestry_ru
                            forestry_num
                            gid
                            block_list {
                              block_num
                              gid
                              stand_list {
                                stand_num
                                gid
                              }
                            }
                          }
                        }
                      }
                    }
                  }`;
    // const url = "https://graphql.forest.caiag.kg/?query="
    const url = "http://localhost:8080/?query=";
    axios.get(url + allplaces_query).then(response => {
      allplaces = JSON.parse(response.data);
      console.log(allplaces);
      save_allplaces(allplaces.data.allplaces);
    });
  };

  const save_allplaces = allplacestodb => {
    //check for support
    if (!("indexedDB" in window)) {
      console.log("This browser doesn't support IndexedDB");
      return;
    }
    var db_surveycard = indexedDB.open("db_surveycard", 1);

    db_surveycard.onsuccess = function(e) {
      db = e.target.result;
      putResult(allplaces);
    };
    db_surveycard.onerror = function(e) {
      console.log("onerror!");
      console.dir(e);
    };

    function putResult(allplacestodb) {
      var transaction = db.transaction(["allplaces"], "readwrite");
      var store = transaction.objectStore("allplaces");

      var request = store.put(allplacestodb, 1);

      request.onerror = function(e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function(e) {};
    }
    allplaces = allplacestodb;
    make_fullleshozlist();
  };

  const make_fullleshozlist = () => {
    allplaces.oblasts.map(oblast => {
      oblast.leshoz_list.map(leshoz => {
        fullleshozlist.push(leshoz);
      });
    });
    fullleshozlist = fullleshozlist;
    leshozlist = fullleshozlist;
  };

  const select_oblast = e => {
    forestrieslist = []
    selected_oblast = e.target.value;
    if (e.target.value === "all") {
      leshozlist = fullleshozlist;
    } else {
      leshozlist = [];
      allplaces.oblasts.map(oblast => {
        if (oblast.oblast_id == e.target.value) {
          oblast.leshoz_list.map(leshoz => {
            leshozlist.push(leshoz);
          });
        }
      });
      leshozlist = leshozlist;
    }
  };

  const select_leshoz = e => {
    selected_leshoz = e.target.value;
    forestrieslist = [];
    leshozlist.map(leshoz => {
      if(leshoz.leshoz_id === e.target.value){
        leshoz.forestries_list.map(forestry => {
          forestrieslist.push(forestry)
        })
      }
    })
    forestrieslist = forestrieslist;
  };

  const getGeometry = id => {
    const geometry_query = `{
                              geometry {
                                oblasts {
                                  oblast_id
                                }
                              }
                            }`;
  };

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
      console.log(elem[1].el.getAttribute("src"));
    });
    // console.log(bing._tiles)
  };

  // In your web app's JavaScript:

  async function add_to_cache() {
    const urls = Object.entries(bing._tiles).map(elem => {
      return elem[1].el.getAttribute("src");
    });
    const myCache = await window.caches.open("bing-maps");
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
    width: 95vw;
    margin: auto;
  }
</style>

<svelte:window on:resize={resize} on:orientationchange={resize} />

<div style="height: {height}" class="map" id="map">
  <slot />
</div>

<br />

<div class="row">
  <!-- <div>Область</div> -->
  {#if allplaces != undefined}
    <select on:change={select_oblast}>
      <option value="all">Область</option>
      {#if allplaces.oblasts != undefined}
        {#each allplaces.oblasts as oblast}
          <option value={oblast.oblast_id}>{oblast.oblast_ru}</option>
        {/each}
      {/if}
    </select>
  {/if}
  <hr />
</div>

<div class="row">
  <div>Лесхоз</div>
  {#if leshozlist != undefined}
    <select on:change={select_leshoz}>
      {#each leshozlist as leshoz}
        <option value={leshoz.leshoz_id}>{leshoz.leshoz_ru}</option>
      {/each}
    </select>
  {/if}
  <hr />
</div>

<div class="row">
  <div>Лесничество</div>
  {#if forestrieslist != undefined}
    <select on:change={handle_select}>
      {#each forestrieslist as forestry}
        <option value={forestry.gid}>{forestry.forestry_ru}</option>
      {/each}
    </select>
  {/if}
  <hr />
</div>

<!-- <button class="action" on:click={refresh_area}>Refresh Selected</button>
<button class="action" on:click={save_changes}>Save changes</button>
<button class="action" on:click={show_map_object}>Show L.map</button>
<br />
<button class="action" on:click={start_polygon}>Start Polygon</button>
<button class="action" on:click={stop_drawing}>Stop drawing</button>
<button class="action" on:click={add_to_current}>Add to current</button>
<br />
<button class="action" on:click={show_url}>Show url</button>
<button class="action" on:click={add_to_cache}>Add to cache</button> -->

{#if area != ''}
  {#each area._layers[area_id - 1]._latlngs[0][0] as coordinate, index}
    <p>{index}</p>
    <p>{coordinate}</p>
  {/each}
{/if}
