module.exports = function(grunt, options){
    return {
        all:{
            options : {
                port: 9000,
                hostname : "localhost",
                bases : [ options.dev, options.tmp ],
                livereload: true
            }
        }
    };
};
