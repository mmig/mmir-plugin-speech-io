
const fs = require('fs-extra');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src/typings');
const targetFile = path.resolve(__dirname, '../lib/typings/index.d.ts');
const targetJsFile = path.resolve(__dirname, '../lib/typings/index.js');
const targetMapFile = path.resolve(__dirname, '../lib/typings/index.js.map');

const jsContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`;

function removeOwnTypings(fileContents){
  return fileContents.map(function(c){
    return c.replace(/import type .* from '.\/';?/g, '');
  })
}

fs.readdir(srcDir).then(function(files){

  const tasks = files.filter(function(f){ return !/index\.ts/.test(f); }).map(function(f){
    return fs.readFile(path.resolve(srcDir, f), 'utf8')
  });

  return Promise.all(tasks);

}).then(function(fileContents){

  fileContents = removeOwnTypings(fileContents);

  return Promise.all([
    fs.writeFile(targetFile, '\r\n' + fileContents.join('\r\n') +  '\r\n'),
    fs.writeFile(targetJsFile, jsContent),
    fs.remove(targetMapFile)
  ]);
}).then(function(){
  console.log('updated *.d.ts from src/typings/** in lib/typings/**');
});
