const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const ROOT_DIR = process.cwd();


function getAllPackages() {
    fs.readdir(path.join(ROOT_DIR, 'packages/'), (err, items) => {
        console.log(items);
    })
}


getAllPackages();