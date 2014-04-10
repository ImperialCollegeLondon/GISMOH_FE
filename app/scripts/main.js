/*global require, Backbone*/
function main(){
    'use strict';

    var Controller = Backbone.Router.extend({
            /***
             * Views that this controller influences
             */
            components : [],
            /***
             * Set up the controller
             */
            initialize: function (dt) {
                this.dateTime = dt;
            },
            /***
             * dictionary of post-hash urls i.e /#/patient/123 selects a patient with GISMOH ID 123
             */
            routes : {
                "patient/:id" : "selected"
            },
            /***
             *  Doesn't do much as the functionality is handled using the "route" event
             */
            selected : function (page) {
                
            },
            /**
             * Set the currently selected isolate in all components to @isolate_id
             */
            select_isolate : function(isolate_id)
            {
                for (var c = 0; c < this.components.length; c = c + 1) {
                    if(this.components[c].set_isolate) this.components[c].set_isolate(isolate_id);
                }
            },
            /**
             * Set the current Date of all components  to @pt
             */
            setDateTime : function (dt) {
                var c = 0;
                this.dateTime = dt;
                
                for (c = 0; c < this.components.length; c = c + 1) {
                   if(this.components[c].setDateTime) this.components[c].setDateTime(dt);
                }
            }
        }),
        
        /**
         * The app should be initialised to today's date
         */
        currentDate = new Date(),
        
        /*
         * Create and instance of the controller object
         */
        controller = new Controller(currentDate),
        /*
         * Collection for patients who 
         */
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