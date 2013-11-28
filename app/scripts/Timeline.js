/*jslint nomen: true*/
/*global define, $, Backbone, _, strftime, Raphael */

define(['backbone', 'underscore', 'strftime'], function (ig, no, strfdate) {
	"use strict";
    var TIME_FORMAT = '%Y-%m-%dT%H:%M:%S',
        SVG_NS = "http://www.w3.org/2000/svg",
        TimeLine = Backbone.View.extend({
            events:
            {
                'click a#zoom_in' : 'zoomOut',
                'click a#zoom_out' : 'zoomIn'
            },
            zooms : [
                { weeks : 1, gap_days : 1 },
                { weeks : 2, gap_days : 1 },
                { weeks : 4, gap_days : 2 },
                { weeks : 12, gap_days : 7 },
                { weeks : 26, gap_days : 14 },
                { weeks : 52, gap_days : 28 }                
            ],
            initialize : function () {
                this.router = this.options.controller;
                this.router.components.push(this);
                
                this.locked = [];
                
                this.zoom = 1;
                
                this.overlapCollection = this.options.overlapCollection;
                this.isolateCollection = this.options.isolateCollection;
                
                this.$el.addClass('gismoh_plugin timeline');
                
                this.size = [this.$el.width() - 50, Math.max(this.$el.height(), 500)];
                
                this.addControls();
                
                this.canvas = new Raphael(this.el, this.size[0], this.size[1]);
                this.$el.prepend('<h2>Location and Isolate Timeline</h2>');
                
                this.svg = $('svg', this.$el)[0];
                
                this.gutter = 100;
                
                this.listenTo(this.collection, 'request', this.setLoading);
                this.listenTo(this.collection, 'sync', this.locationsLoadedCB);
                this.listenTo(this.isolateCollection, 'sync', this.isolatesLoadedCB);
                this.listenTo(this.overlapCollection, 'sync', this.overlapsLoadedCB);
                
                this.router.on('route:selected', this.selectedPatient, this);
            
                this.patients = {};
                this.episodes = {};
                this.isolates = [];
    
                var today = new Date(), two_weeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10, today.getHours(), today.getMinutes(), today.getSeconds());
                
                this.setScale(two_weeks, today);
            },
            addControls : function()
            {   
                this.$el.append('<a href="#" id="zoom_in" class="btn btn-default"> + </a><a href="#" id="zoom_out" class="btn btn-default"> - </a>');
            },
            addOne : function (model) {
                var patient_id = model.get('patient_id').toString(),
                    draw_base = false,
                    start = new Date(model.get('arrived')),
                    end = new Date(model.get('left'));
                
                if (end >= this.start_date && start <= this.end_date) {
                    if (!this.patients[patient_id] && this.patients[patient_id] !== 0) {
                        this.addPatient(patient_id);
                    }
                    
                    this.drawEpisode(model);
                }
            },
            addAll : function () {
                while(this.svg.childElementCount >0 ) this.svg.removeChild(this.svg.childNodes[0]);
                this.patients = {};
                
                if (this.selected_patient) {
                    this.drawPatient(this.selected_patient);
                }
                
                this.collection.each(this.addOne, this);
    
                this.size[1] = (_.size(this.patients) * 30) + 30;
                this.canvas.setSize(this.size[0], this.size[1]);
            },
            unhighlightOverlap : function (mdl) {
                var ovl = this.episodes[mdl.get('uniq_id')];
                if (ovl) {
                    var jq = $(ovl.rect);
                    jq.attr('class', jq.attr('class').replace(/\b(selected|overlap)\b/, ' '));
                }
            },
            highlightOverlap : function (mdl) {
                var ovl = this.episodes[mdl.get('uniq_id')];
                if (ovl) {
                    var jq = $(ovl.rect);
                    jq.attr('class', jq.attr('class') +  (mdl.get('patient_id') == this.selected_patient ? ' selected' : ' overlap'));
                }
            },
            highlightOverlaps : function () {
                this.overlapCollection.each(this.unhighlightOverlap, this);
                this.overlapCollection.each(this.highlightOverlap, this);
                //this.redraw('overlaps');
            },
            addIsolate : function (model) {
                var d = new Date(model.get('test_date'));
                d.setHours(12);
                
                var c = this.getPositionOnScale(d),
                    h = 30,
                    i = this.patients[model.get('patient_id')],
                    res = model.get('result'),
                    ab =  _.pluck(res, 'SIR').join('');
                    
                if (i !== undefined){
                    var circ = this.createSVGElement('circle', { 
                        cx : c, 
                        cy : h/2, 
                        r : h/3, 
                        class : res.length > 0 ? 'positive' + (res.length > 3 ? ' ' + ab : '') : '', 
                        title : (res.length > 3 ? ab : '') 
                    }); 
                    
                    i.appendChild(circ);
                    
                    circ.onmouseover = $.proxy(this.isolateHover, this);
                    circ.onmouseout = $.proxy(this.isolateResetHover, this);
                }
            },
            addIsolates : function ()
            {
                this.isolateCollection.each(this.addIsolate, this);
            },
            addPatient : function (patient_id)
            {
                var oldele = document.getElementById('Patient:' + patient_id);
                if(oldele)oldele.remove();
                this.patients[patient_id] =  this.drawPatient(patient_id); 
                //this.drawPatient(patient_id);
            },
            /**
             * create and return an SVG element 
             *
             * @param tag_name {string} the type of element to be created
             * @param attrs {object} a dictionary of the attributes to apply to the object
             */
            createSVGElement : function (tag_name, attrs)
            {
                var ele  = document.createElementNS(SVG_NS, tag_name);
                
                for( var key in attrs )
                {
                    ele.setAttribute(key, attrs[key]);   
                }
                
                return ele;
            },
            /**
             * Add the patient element
             *
             * Update 25/11/2013 - Use the SVG DOM directly so we can use groups to move the patients around
             * also use CSS transitions properly
             */
            drawPatient : function (patient_id)
            {
                var h = 30,
                    i = _.size(this.patients) + 1,
                    g = this.createSVGElement('g', { 'id' : 'Patient:' +patient_id, 'class' : 'patient' + (i % 2 ? '' : ' alt' ), 'transform' : 'translate(0, ' + (i*h) + ')' }),
                    band = this.createSVGElement('rect' , { 'x' : 0, 'y' : 0, 'width' : this.size[0], 'height' : h }),
                    label = this.createSVGElement('text',  { 'x' : 5, 'y' : 18, 'class': 'label' });
                
                var ctx = this;
                g.ondblclick = function(evt)
                {
                    ctx.lock(patient_id);   
                };
                
                label.appendChild(document.createTextNode(patient_id));
                g.appendChild(band);
                g.appendChild(label);
                
                this.svg.appendChild(g);
                return g;
            },
            drawEpisode : function (model)
            {
                var i = this.patients[model.get('patient_id')],
                    sx = Math.max(this.gutter, this.getPositionOnScale(new Date(model.get('arrived')))),
                    ex = Math.min(this.size[0], this.getPositionOnScale(new Date(model.get('left')))),
                    gu = Math.max(sx, this.gutter);
                if (ex < 0 ) return;
                
                var rect = this.createSVGElement('rect', { x : gu, y : 0, width: ex - sx, height : 30, class : 'episode' }),
                    txt = this.createSVGElement('text', { x : gu + 5, y : 18  });
                
                txt.appendChild(document.createTextNode(model.get('ward')));
                try{
                    i.appendChild(rect);
                    i.appendChild(txt);
                } catch(err) {
                    console.error(i);   
                }
                this.episodes[model.get('uniq_id')] = { rect : rect, label : txt };
            },
            /**
             * Draw the timescale onto the Timeline.
             */
            drawScale : function ()
            {
                var isFirst = true, zoom = this.zooms[this.zoom], yr = 0;
                
                this.start_date = new Date(this.end_date.getFullYear(), this.end_date.getMonth(), this.end_date.getDate() - zoom.weeks * 7)
                
                yr = this.canvas.text(0, 13, this.start_date.getFullYear());
                yr.attr('fill', '#444');
                yr.attr('font-size', 15);
                yr.attr('text-anchor', 'start');
                yr.attr('font-weight', 'bold');
                
                for(var d = new Date(this.start_date.getFullYear(), this.start_date.getMonth(), this.start_date.getDate());
                    d <= this.end_date; 
                    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + zoom.gap_days))
                {
                    var x = this.getPositionOnScale(d);
                    
                    if( x < this.gutter ) continue;
                    
                    var tick = this.canvas.path('M ' + x + ' 20 L ' + x + ' ' + this.size[1]);
                    tick.attr('stroke', isFirst ? '#666' : '#ccc');
                    
                    var is1Jan = d.getMonth() == 0 && d.getDate() == 1;
                    d.setHours(12);
                    x = this.getPositionOnScale(d);
                    
                    var label = this.canvas.text(x, 13, d.strftime(( is1Jan ? '%Y' : '%d %b')));
                    
                    if(is1Jan) {
                        label.attr('font-weight', 'bold');   
                    }
                    
                    label.attr('fill', '#444');
                    label.attr('font-size', 15);
                    
                    isFirst = false;
                }
                
                var d = new Date(this.end_date.getFullYear(), this.end_date.getMonth(), this.end_date.getDate() +1 ),
                    x = this.getPositionOnScale(d);
                    tick = this.canvas.path('M ' + x + ' 20 L ' + x + ' ' + this.size[1]);
                    tick.attr('stroke', '#666');
                
            },
            /**
             * Set the start and end of the  time period displayed on the timeline.
             * @param from_date {Date} start date
             * @param to_date {Date} end date
             */
            setScale : function(from_date, to_date)
            {
                this.start_date = from_date;
                this.end_date = to_date;
                
                this.end_seconds = new Date(to_date.getFullYear(), to_date.getMonth(), to_date.getDate() + 1).getTime();
                this.start_seconds = new Date(from_date.getFullYear(), from_date.getMonth(), from_date.getDate()).getTime();
                this.total_seconds = this.end_seconds - this.start_seconds; 
                this.scalar = (this.size[0] - this.gutter) / this.total_seconds;
            },
            /**
             * Get the x position of an element that is at date d
             * d {Date} the date at which the even occured
             */
            getPositionOnScale : function(d)
            {
                var secs = d.getTime();
                var o_secs = secs - this.start_seconds;
                return (o_secs * this.scalar) + this.gutter;
            },
            isolateHover : function(iso_sel)
            {
                var iso = iso_sel.target;
                var ttl = iso.getAttribute('title');
                
                this.popup(iso, ttl);
                
                if(ttl)
                {
                    var jq = $('.' + ttl, this.$el);
                    jq.attr('class', jq.attr('class') + ' related');
                }
            },
            isolateResetHover : function()
            {
                var jqs = $('.positive', this.$el);
                for(var i = 0; i < jqs.length; i++)
                {   
                    jqs[i].classList.remove('related');
                }
                
            },
            lock : function(id)
            {
                var idx = this.locked.indexOf(id);
                if(idx == -1)
                {
                    this.locked.push(id);
                }
                else
                {
                    this.locked.splice(idx, 1);
                }
                this.movePatients();
            },
            movePatient : function(patient, idx)
            {
                idx = idx + 1;
                
                var desty = idx * 30,
                    srcy = Number(patient.getAttribute('transform').replace(/[^\d]/gi ,'')),
                    i = 0,
                    steps = 10.0,
                    step = (desty - srcy) / steps,
                    ival = setInterval(function(){
                        patient.setAttribute('transform', 'translate(0, ' + (srcy + (i * step)) + ')');
                        if( i == steps ) clearInterval(ival);
                        i++;
                    }, 10);
                
                if(idx % 2) 
                {
                    patient.classList.add('alt');   
                }
                else
                {
                    patient.classList.remove('alt'); 
                }
            },
            movePatients : function()
            {
                if(this.selected_patient)
                {
                    this.movePatient(this.patients[this.selected_patient], 0);
                }
                
                for( var i = 0; i < this.locked.length; i++ )
                {
                    this.movePatient(this.patients[this.locked[i]],  i + 1);
                }
                
                var  i = this.locked.length + 1;
        
                for( var p in this.patients)
                {
                    if( this.selected_patient != p &&  this.locked.indexOf(p) == -1 )
                    {
                         this.movePatient(this.patients[p],  i++);
                    }
                }
            },
            popup : function(ele, txt)
            {
                /*var transform = ele.getCTM();
                if ( ele.tagName == 'circle' )
                {
                    var popup = this.createSVGElement('g', { class : 'popup', transform : 'translate(' + ele.cx.baseVal.value  + ',' + ele.cy.baseVal.value+ ')' }),
                        text = this.createSVGElement('text', {});
                    
                    text.appendChild(document.createTextNode(txt));
                    popup.appendChild(text);
                    popup.transform.baseVal.createSVGTransformFromMatrix(transform);
                    
                    this.svg.appendChild(popup);    
                }*/
            },
            redraw : function(source)
            {
                this.addAll();
                this.addIsolates();
                this.highlightOverlaps();
                this.drawScale();
                this.unsetLoading();
            },
            /**
             * 
             */
            selectedPatient : function(patient_id)
            {
                this.selected_patient = patient_id;
                
                this.loadData();
            },
            setDateTime : function(dt)
            {
                this.dateTime = dt;
                
                this.loadData();
            },
            loadData : function()
            {
                var today = this.router.dateTime;
                var two_weeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() - this.zooms[this.zoom].weeks * 7, today.getHours(), today.getMinutes(), today.getSeconds());
                
                 this.setScale(two_weeks, today);
                
                this.loactionLoaded = false;
                this.collection.fetch({ 
                    data: {
                        to : today.strftime(TIME_FORMAT),      
                        from : two_weeks.strftime(TIME_FORMAT)      
                    },
                    reset: true
                });
                
            },
            isolatesLoadedCB : function()
            {
                this.isolatesLoaded = true;
                this.checkLoaded();
            },
            overlapsLoadedCB : function()
            {
                this.overlapsLoaded = true;
                this.checkLoaded();
            },
            locationsLoadedCB : function()
            {
                var today = this.router.dateTime;
                var two_weeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() - this.zooms[this.zoom].weeks * 7, today.getHours(), today.getMinutes(), today.getSeconds());
                
                this.loactionLoaded = true;
                this.checkLoaded();
                
                if(this.selected_patient)
                {
                    this.overlapsLoaded = false;
                    this.overlapCollection.fetch({
                       data: {
                            patient_id : this.selected_patient,
                            at_date : today.strftime(TIME_FORMAT)
                       },
                    reset: true
                    });
                }
                else {
                    this.overlapsLoaded = true;
                }
                
                this.isolatesLoaded = false;
                this.isolateCollection.fetch({
                     data: {
                        to : today.strftime(TIME_FORMAT),      
                        from : two_weeks.strftime(TIME_FORMAT)      
                    },
                    reset: true
                });
            },
            checkLoaded : function()
            {
                console.debug(this.isolatesLoaded , this.overlapsLoaded , this.loactionLoaded);
                if(this.isolatesLoaded && this.overlapsLoaded && this.loactionLoaded) {
                    this.redraw();   
                }
            },
            setLoading : function()
            {
                this.$el.addClass('loading');
            },
            unsetLoading : function()
            {
                this.$el.removeClass('loading');
            },
            setZoom : function(lvl)
            {
                this.zoom = Math.min(this.zooms.length, Math.max(0, lvl));    
                this.setDateTime(this.router.dateTime);
            },
            zoomOut : function()
            {
                if( this.zoom > 0 ) { this.setZoom(this.zoom - 1) ; }
            },
            zoomIn : function()
            {
                if( this.zoom < this.zooms.length ) { this.setZoom(this.zoom + 1); }
            }
	   });
    
	return TimeLine;
	
});