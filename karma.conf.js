
require('ts-node').register({
    compilerOptions: {
        module: 'commonjs'
    }
});
module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        files: [
            'packages/**/src/**/*.ts',
            'packages/**/tests/**/*.test.ts'
        ],
        preprocessors: {
            '**/*.ts': ['typescript']
        },
        typescriptPreprocessor: {
            options: {
                sourceMap: true,
                noResolve: false 
            },
            transformPath: function(path){
                return path.replace(/\.ts$/, '.js')
            }
        },
        reporters: ['progress'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless'],
    })
}