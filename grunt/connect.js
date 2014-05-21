module.exports = function(grunt, options){
    return {
        server:{
            options : {
                port: 9000,
                hostname : "localhost",
                base : [ options.dev, options.tmp ],
                livereload: true,
                 middleware: function (connect, options) {
                    if (!Array.isArray(options.base)) {
                        options.base = [options.base];
                    }

                    // Setup the proxy
                    var middlewares = [require('grunt-connect-proxy/lib/utils').proxyRequest];

                    // Serve static files.
                    options.base.forEach(function(base) {
                        middlewares.push(connect.static(base));
                    });

                    // Make directory browse-able.
                    var directory = options.directory || options.base[options.base.length - 1];
                    middlewares.push(connect.directory(directory));

                    return middlewares;
                }
            },
            proxies: [
                {
                    context: '/api',
                    host: 'localhost',
                    port: 3000,
                    https: false,
                    changeOrigin: false,
                    xforward: false,
                    headers: {

                    }
                }
            ]
        }
    };
};
