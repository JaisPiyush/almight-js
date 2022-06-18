'use strict';

const fs = require('fs');
const path = require('path');

function matchFileInDirectory(_path) {
    const envFileName = ".env";
    return fs.readdirSync(_path, { withFileTypes: true }).filter((item) => !item.isDirectory() && item.name === envFileName).map((item) => path.join(_path, item.name));
}

function _findInDirectory(dirname) {

    const stopLimit = parseInt(process.env.STOP_LIMIT) || 4;
    let currentNumber = 0

    function _innerFindEnvInDirectory(dirname) {
        let matches = [];
        matches = matchFileInDirectory(dirname);
        if (matches.length === 0 && currentNumber < stopLimit) {
            currentNumber += 1;
            const _path = path.parse(dirname);
            return _innerFindEnvInDirectory(_path.dir);
        }else if(currentNumber === stopLimit){
            return "";
        }
        return matches[0]
    }

    return _innerFindEnvInDirectory(dirname);
}


function findFile(dirname) {
    const match =  _findInDirectory(dirname);
    return match.length === 0? dirname : match;
}


const dotenv = require('dotenv');

const _path = findFile(__dirname);
dotenv.config({path: _path})



module.exports = {
    spec: ['__tests__/**/*.spec.ts'],
    'watch-files': ['__tests__/**/*.spec.ts', 'src/**/*.ts'],
    'require': "ts-node/register",

}