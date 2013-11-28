/*global require, Backbone*/


require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: [
                'jquery'
            ],
            exports: 'jquery'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone/backbone',
        underscore: '../bower_components/underscore/underscore',
        bootstrap: 'vendor/bootstrap',
        'g.raphael': '../bower_components/g.raphael/g.raphael',
        modernizr: '../bower_components/modernizr/modernizr',
        raphael: '../bower_components/raphael/raphael',
        'requirejs-text': '../bower_components/requirejs-text/text',
        requirejs: '../bower_components/requirejs/require',
        'sass-bootstrap': '../bower_components/sass-bootstrap/dist/js/bootstrap'
    }
});

require([
    'PatientList', 'Linker', 'Replay', 'strftime', 'Timeline', 'models', 'WorkerLoader'
], function (PatientList, Linker, Replay, strftime, Timeline, Models, Loader) {
    'use strict';
    
    if(Modernizr.webworkers)
    {
        Backbone.Collection.prototype.fetch = function(args)
        {
            this.trigger('request');
            
            var wkr = new Loader({ callback: $.proxy(this.fetch_callback, this) });
            wkr.loadUrl(this.url, args.data);
        };
        
        Backbone.Collection.prototype.fetch_callback = function(data)
        {
            this.reset(data);
            this.trigger('sync');
            this.trigger('reset');
        }
        
    }
    
    var Controller = Backbone.Router.extend({
            /***
             * Views that this controller influences
             */
            components : [],
            initialize: function (dt) {
                this.dateTime = dt;
            },
            routes : {
                "patient/:id" : "selected"
            },
            selected : function (page) {
                
            },
            setDateTime : function (dt) {
                var c = 0;
                this.dateTime = dt;
                
                for (c = 0; c < this.components.length; c = c + 1) {
                    this.components[c].setDateTime(dt);
                }
            }
        }),
        currentDate = new Date('2011-02-26T00:00:00'),
        controller = new Controller(currentDate),
        patientCollection = new Models.PatientCollection(),
        isolateCollection = new Models.BioLinkCollection(),
        overlapCollection = new Models.LocationLinkCollection(),
        locationCollection = new Models.LocationCollection(),
        resutsCollection = new Models.IsolateCollection(),
        linker = new Linker.Graph({
            el : '#linker', 
            router : controller, 
            bio_collection : isolateCollection, 
            loc_collection: overlapCollection 
        }),
        plist = new PatientList.PatientList({
            el : '#patient_list', 
            router : controller, 
            collection: patientCollection
        }),
        replay = new Replay({ 
            controller : controller 
        }),
        timeline = new Timeline({ 
            el: '#timeline', 
            controller : controller, 
            collection : locationCollection,
            isolateCollection : resutsCollection,
            overlapCollection : overlapCollection
        });

    Backbone.history.start();
    
    window.timline = timeline;
    
    controller.dateTime = currentDate;
    controller.setDateTime(currentDate);
});
