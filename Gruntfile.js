/*globals require, module */
module.exports = function (grunt) {
    'use strict';
    // show elapsed time at the end
    require('time-grunt')(grunt);

    // load all grunt tasks
    require('load-grunt-config')(grunt,{
        init: true,
        data:{
            backend: {
                path : '/api',
                port : 3000,
                host : 'localhost'
            },
            livereload : {
                port : 35726
            },
            dev : 'app',
            dist : 'dist',
            tmp : '.tmp'
        }
    });

};
