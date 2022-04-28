/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

const path = require('path');
const { lstatSync, readdirSync } = require('fs');
// get listing of packages in the mono repo
const basePath = path.resolve(__dirname, 'packages');
const packages = readdirSync(basePath).filter(name => {
   return lstatSync(path.join(basePath, name)).isDirectory();
});

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    ...packages.reduce(
      (acc, name) => ({
        ...acc,
        [`@almight-sdk/${name}(.*)$`]: `<rootDir>/packages/./${name}/src/$1`
      })
    )
  },

};