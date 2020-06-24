<script>
  let location = ''

  const showPosition = position => {
    location =
      "Latitude: " +
      position.coords.latitude +
      "\nLongitude: " +
      position.coords.longitude;
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      location = "Geolocation is not supported by this browser.";
    }
  };
</script>

<main>
  <input
    type="image"
    alt="location"
    src="assets/pin.svg"
    style="max-height: 6vh"
    on:click={() => getLocation()} />
  <div style="white-space: pre-line">{location}</div>
</main>
