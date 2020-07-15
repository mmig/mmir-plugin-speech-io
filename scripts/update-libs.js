

const fs = require('fs-extra');
const path = require('path');

const srcDirTextCaretPos = path.dirname(require.resolve('text-caret-pos'));
const srcDirWebUnits = path.dirname(require.resolve('web-units'));
const targetDir = path.resolve(__dirname, '../src/lib');

Promise.all([
  fs.copy(path.resolve(srcDirTextCaretPos, 'index.d.ts'), path.resolve(targetDir, 'caretPosition.d.ts')),
  fs.copy(path.resolve(srcDirTextCaretPos, 'dist/textCaretPos.js'), path.resolve(targetDir, 'caretPosition.js')),
    fs.copy(path.resolve(srcDirWebUnits, 'length.d.ts'), path.resolve(targetDir, 'length.d.ts')),
    fs.copy(path.resolve(srcDirWebUnits, 'length.js'), path.resolve(targetDir, 'length.js'))
]).then(function(){
  console.log('updated libraries in src/lib/**');
});
