const sharedConfig = require("../../jest.config");

module.exports = {
    ...sharedConfig,
    testEnvironment: "node"
};