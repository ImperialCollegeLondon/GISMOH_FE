/*global require, Backbone*/
function main(){
    'use strict';

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
        resultsCollection = new Models.IsolateCollection(),
        linker = new Linker.Graph({
            el : '#linker', 
            router : controller, 
            bio_collection : isolateCollection, 
            loc_collection: overlapCollection 
        }),
        plist = new PatientList.List({
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
            isolateCollection : resultsCollection,
            overlapCollection : overlapCollection
        }),
        ab_list = new AB_List({
            el:'#ab_list',
            controller : controller,
            collection : resultsCollection
        });

    Backbone.history.start();
    
    controller.dateTime = currentDate;
    controller.setDateTime(currentDate);
}

$(main);