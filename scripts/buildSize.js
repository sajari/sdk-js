var fs = require('fs');
var gzipSize = require('gzip-size').sync;

console.log('gzipped size: ' + (gzipSize(fs.readFileSync('./sajari.js')) / 1024).toFixed(2) + 'KB');
