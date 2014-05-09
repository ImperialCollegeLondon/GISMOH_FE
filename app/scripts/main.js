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
                this.patient = null;
            },
            /***
             * dictionary of post-hash urls i.e /#/patient/123 selects a patient with GISMOH ID 123
             */
            routes : {
                "patient/:id" : "selected",
                "time/:ti" : "set_time",
                "time/:ti/patient/:id" : "set_time",
                "time/:ti/patient/:id/isolate/:isolate" : "set_time"
            },
            /***
             *  Doesn't do much as the functionality is handled using the "route" event
             */
            selected : function (page) {

            },
            set_time: function(time, patient, isolate)
            {
                this.setDateTime(new Date(time));

                if(patient)
                {
                    for (var c = 0; c < this.components.length; c = c + 1) {
                        if(this.components[c].selectedPatient) this.components[c].selectedPatient(patient);
                    }
                }

                if(isolate)
                {
                    this.select_isolate(isolate);
                }
            },
            select_patient : function(patient_id)
            {
                this.patient = patient_id;

            },
            select_time : function(time)
            {
                this.dateTime = new Date(time);

            },
            set_path : function(obj)
            {
                if(obj.patient) this.select_patient(obj.patient);
                if(obj.isolate) this.select_isolate(obj.isolate);
                if(obj.time) this.select_time(obj.time);

                this.set_url();
            },
            set_url : function()
            {
                var url = '/time/' + this.dateTime.strftime('%Y-%m-%d %H:%M:%S');

                if(this.patient)
                {
                    url += '/patient/' + this.patient;

                    if(this.isolate)
                    {
                        url += '/isolate/' + this.isolate;
                    }
                }


                this.navigate(url, { trigger : true, replace:true });
            },
            /**
             * Set the currently selected isolate in all components to @isolate_id
             */
            select_isolate : function(isolate_id)
            {
                this.isolate = isolate_id;

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

}

$(main);
