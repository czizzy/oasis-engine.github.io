const fs = require('fs-extra');

fs.removeSync('./0.7'); 
fs.removeSync('./404'); 
fs.removeSync('./examples'); 
fs.removeSync('./gltf-viewer'); 
// fs.removeSync('./index-cn'); 
fs.removeSync('./404.html'); 
fs.removeSync('./index.html'); 
fs.removeSync('./sitemap.xml'); 

fs.copySync('./public/0.7', './0.7');
fs.copySync('./public/404', './404'); 
fs.copySync('./public/examples', './examples'); 
fs.copySync('./public/gltf-viewer', './gltf-viewer'); 
// fs.copySync('./public/index-cn', './index-cn'); 
fs.copySync('./public/404.html', './404.html'); 
fs.copySync('./public/index.html', './index.html'); 
fs.copySync('./public/sitemap.xml', './sitemap.xml'); 