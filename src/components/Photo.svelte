<script>
  let images = [];

  const loadFile = e => {
    var output = document.getElementById("output");
    images.push(URL.createObjectURL(e.target.files[0]));
    images = images;
  };
</script>

<style>

</style>

<main>

  <div class="image-upload">
    <label for="file-input">
      <img src="assets/photo.svg" alt="camera" style="max-height: 6vh" />
    </label>
    <input
      id="file-input"
      type="file"
      accept="image/*"
      capture
      on:change={event => loadFile(event)} />
  </div>

  {#each images as image}
    <img src={image} alt="" />
  {/each}
</main>
