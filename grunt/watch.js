module.exports = {
//    js: {
//        files : '**/*.js',
//        tasks : ['node_serverOne']
//    },
    css: {
        files: '**/*.less',
        tasks: ['styles_dev'],
        options: {
          livereload: true,
        }
    },
    livereload: {
        options: {
            livereload: true
        },
        files: [
            'app/js/*.js'
        ]
    }
}
