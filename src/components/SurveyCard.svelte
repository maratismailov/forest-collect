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
  let selected_forestry;
  let selected_block;
  let selected_stand;
  let fullleshozlist = [];
  let leshozlist = [];
  let forestrieslist = [];
  let blocklist = [];
  let standlist = [];
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
  // const url = "https://graphql.forest.caiag.kg/?query="
  const url = "http://localhost:8080/?query=";

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
      if (!db.objectStoreNames.contains("forestry")) {
        var allplaces = db.createObjectStore("forestry", {
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
          // console.log('all', allplaces)
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
                          }
                        }
                      }
                    }
                  }`;
    // const url = "https://graphql.forest.caiag.kg/?query="
    const url = "http://localhost:8080/?query=";
    axios.get(url + allplaces_query).then(response => {
      allplaces = JSON.parse(response.data).data.allplaces.oblasts;
      console.log(allplaces);
      save_allplaces(allplaces);
    });
  };

  const getForestry = () => {
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
                          }
                        }
                      }
                    }
                  }`;

    axios.get(url + allplaces_query).then(response => {
      allplaces = JSON.parse(response.data);
      console.log(allplaces);
      save_allplaces(allplaces.data.allplaces);
    });
  };

  const save_allplaces = allplacestodb => {
    console.log("save");
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

  const save_forestry = forestrytodb => {
    // blocklist.forEach(block => {
    //   console.log(block.geom)
    //   block.stand_list.map(stand => {
    //     console.log(stand.geom)
    //   })
    // })

    // const handle_select = () => {
    //   id = selected.id;
    //   console.log(selected);
    //   area = L.geoJSON(selected.area).addTo(map);
    //   multi_json = area.toGeoJSON();
    //   area_id = area._leaflet_id;
    //   console.log(area_id);
    //   // let multi = area.addTo(map);
    //   // map.setView([42.87, 74.594], 5)
    //   map.fitBounds(area.getBounds());
    //   area.getLayers().forEach(l => {
    //     l.enableEdit();
    //   });
    // };
    forestrytodb.forEach(block => {
      block.stand_list.forEach(stand => {
        // console.log(stand.gid);
        area = null
          area = L.geoJSON(JSON.parse(stand.geom)).addTo(map);
          save_tiles(area)
          // console.log(area.getBounds());
      });
    });
    console.log("save forestry");
    //check for support
    if (!("indexedDB" in window)) {
      console.log("This browser doesn't support IndexedDB");
      return;
    }
    var db_surveycard = indexedDB.open("db_surveycard", 1);

    db_surveycard.onsuccess = function(e) {
      db = e.target.result;
      putResult(forestrytodb);
    };
    db_surveycard.onerror = function(e) {
      console.log("onerror!");
      console.dir(e);
    };

    function putResult(forestrytodb) {
      var transaction = db.transaction(["forestry"], "readwrite");
      var store = transaction.objectStore("forestry");

      var request = store.put(forestrytodb, 1);

      request.onerror = function(e) {
        console.log("Error", e.target.error.name);
      };
      request.onsuccess = function(e) {};
    }
    // allplaces = allplacestodb;
    // make_fullleshozlist();
  };

  const save_tiles = async area => {
    map.fitBounds(area.getBounds());
    map.on("moveend", function(e) {
      console.log("test");
    });
  };

  const make_fullleshozlist = () => {
    allplaces.map(oblast => {
      oblast.leshoz_list.map(leshoz => {
        fullleshozlist.push(leshoz);
      });
    });
    fullleshozlist = fullleshozlist;
    leshozlist = fullleshozlist;
  };

  const select_oblast = e => {
    leshozlist = "";
    forestrieslist = [];
    blocklist = [];
    standlist = [];
    selected_leshoz = "all";
    selected_forestry = "all";
    selected_block = "all";
    selected_stand = "all";
    selected_oblast = e.target.value;
    if (e.target.value === "all") {
      leshozlist = fullleshozlist;
    } else {
      leshozlist = [];
      allplaces.map(oblast => {
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
    forestrieslist = [];
    blocklist = [];
    standlist = [];
    selected_forestry = "all";
    selected_block = "all";
    selected_stand = "all";
    selected_leshoz = e.target.value;
    leshozlist.map(leshoz => {
      if (leshoz.leshoz_id === e.target.value) {
        leshoz.forestries_list.map(forestry => {
          forestrieslist.push(forestry);
        });
      }
    });
    forestrieslist = forestrieslist;
  };

  const select_forestry = e => {
    selected_forestry = e.target.value;
    standlist = [];
    selected_block = "all";
    selected_stand = "all";
    const select_forestry_query =
      `{
        forestry (id: ` +
      selected_forestry +
      `){
          blocks {
          gid
          block_num
          geom
          forestry_id
          stand_list {
            gid
            leshoz_num
            geom
            forestry_num
            stand_num
          }
        }
      }
    }
    `;
    axios.get(url + select_forestry_query).then(response => {
      blocklist = JSON.parse(response.data).data.forestry.blocks;
      // blocklist.forEach(block => {
      //   console.log(block.geom)
      //   block.stand_list.map(stand => {
      //     console.log(stand.geom)
      //   })
      // })
      // save_allplaces(allplaces.data.allplaces);
    });
    // forestrieslist.map(forestry => {
    //   if (forestry.gid === e.target.value) {
    //     forestry.block_list.map(block => {
    //       blocklist.push(block);
    //     });
    //   }
    // });
    // blocklist = blocklist;
  };

  const select_block = e => {
    selected_block = e.target.value;
    standlist = [];
    selected_stand = "all";
    blocklist.map(block => {
      if (block.gid === e.target.value) {
        block.stand_list.map(stand => {
          standlist.push(stand);
        });
      }
    });
    standlist = standlist;
  };

  const select_stand = e => {
    console.log(e.target.value);
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
      {#if allplaces != undefined}
        {#each allplaces as oblast}
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
    <select bind:value={selected_leshoz} on:change={select_leshoz}>
      <option value="all">Лесхоз</option>
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
    <select bind:value={selected_forestry} on:change={select_forestry}>
      <option value="all">Лесничество</option>
      {#each forestrieslist as forestry}
        <option value={forestry.gid}>{forestry.forestry_ru}</option>
      {/each}
    </select>
  {/if}
  <input
    type="image"
    alt="location"
    src="assets/download.svg"
    style="max-height: 3vh"
    on:click={() => save_forestry(blocklist)} />
  <hr />
</div>

<div class="row">
  <div>Квартал</div>
  {#if blocklist != undefined}
    <select bind:value={selected_block} on:change={select_block}>
      <option value="all">Квартал</option>
      {#each blocklist as block}
        <option value={block.gid}>{block.block_num}</option>
      {/each}
    </select>
  {/if}
  <hr />
</div>

<div class="row">
  <div>Выдел</div>
  {#if standlist != undefined}
    <select bind:value={selected_stand} on:change={select_stand}>
      <option value="all">Выдел</option>
      {#each standlist as stand}
        <option value={stand.gid}>{stand.stand_num}</option>
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

<!-- {#if area != ''}
  {#each area._layers[area_id - 1]._latlngs[0][0] as coordinate, index}
    <p>{index}</p>
    <p>{coordinate}</p>
  {/each}
{/if} -->
