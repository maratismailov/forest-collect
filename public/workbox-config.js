module.exports = {
  "globDirectory": "public",
  "globPatterns": [
    "**/*.css",
    "**/*.png",
    "**/*.svg",
    "**/*.ico",
    "**/*.html",
    "**/*.js",
    "**/*.json"
  ],
  "swSrc": "public/sw-src.js",
  "swDest": "public/sw.js",
  "globIgnores": [
    "**/workbox*.js",
    "**/**/sw.js",
    "**/sw.js"
  ]
};
