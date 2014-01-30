/*jslint nomen: true*/
/*global define, $, Backbone, _, strftime, Raphael */
var Timeline = (function () {
	"use strict";
    var TIME_FORMAT = '%Y-%m-%dT%H:%M:%S',
        SVG_NS = "http://www.w3.org/2000/svg",
        TimeLine = Backbone.View.extend({
            events:
            {
                'click a#zoom_in' : 'zoomOut',
                'click a#zoom_out' : 'zoomIn',
                'click a.zoom_level': 'zoomTo'
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
                this.show = [];
                
                this.overlapCollection = this.options.overlapCollection;
                this.isolateCollection = this.options.isolateCollection;
                
                this.$el.addClass('gismoh_plugin timeline');
                
                this.size = [this.$el.width() - 50, Math.max(this.$el.height(), 500)];
                
                this.addControls();
                
                this.$el.append('<svg class="timeline" width="' +this.size[0]+ '" height="' + this.size[1] + '"></svg>');
            
			 this.canvas = this.$('svg');
                this.$el.prepend('<h2>Location and Isolate Timeline<button class="help" type="button" data-toggle="modal" data-target="#timeline-help" title="Help">?</button></h2>');
                
                this.svg = this.$('svg')[0];
                
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
                this.setZoom(2);
            },
            addControls : function()
            {   
                this.$el.append('<div class="zoom_bar"><b>Zoom</b><a href="#" id="zoom_in" title="Zoom in" data-toggle="tooltip" data-placement="auto"  class="btn btn-primary"> + </a><a href="#" id="zoom_1" class="btn zoom_level btn-default" data-toggle="tooltip" data-placement="auto" title="1 week"> 1 </a><a href="#" id="zoom_2" class="btn btn-default zoom_level" data-toggle="tooltip" data-placement="auto" title="2 weeks"> 2 </a><a href="#" id="zoom_3" class="btn btn-default zoom_level" data-toggle="tooltip" data-placement="auto" title="4 weeks"> 3 </a><a href="#" id="zoom_4" class="btn btn-default zoom_level" data-toggle="tooltip" data-placement="auto" title="~3 months (12 weeks)"> 4 </a><a href="#" id="zoom_5" class="btn btn-default zoom_level" data-toggle="tooltip" data-placement="auto" title="~6 months (16 weeks)"> 5 </a><a href="#" id="zoom_6" class="btn btn-default zoom_level" data-toggle="tooltip" data-placement="auto" title="~1 year (52 weeks)"> 6 </a><a href="#" id="zoom_out" class="btn btn-primary" data-toggle="tooltip" data-placement="auto" title="zoom out"> - </a></div>');
                this.$('.zoom_bar a').tooltip();
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
                this.canvas.width(this.size[0])
                this.canvas.height(this.size[1]);
                this.movePatients();
            },
            unhighlightOverlap : function (mdl) {
                var ovl = this.episodes[mdl.get('uniq_id')];
                if (ovl) {
                    ovl.rect.classList.remove('overlap');
                }
            },
            highlightOverlap : function (mdl) {
                var ovl = this.episodes[mdl.get('uniq_id')];
                if (ovl) {
                    ovl.rect.classList.add('overlap');
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
                    ab =  _.pluck(res, 'SIR').join(''),
                    circ;
                
                if(!i || res.length == 1) return;
                
                if (res.length == 0){
                    
                    circ = this.createSVGElement('circle', { 
                        cx : c, 
                        cy : h/2, 
                        r : h/3, 
                        class: 'isolate'
                    }); 
                }
                else
                {
                    var s = model.get('patient_id').toString();
                    if (this.show.indexOf(s) == -1 ) this.show.push(s);
                    
                    circ = this.createSVGElement('path', {
                        d : this.getTrianglePath(c, h * 0.6, h/2),
                        class : 'isolate positive ' + ab, 
                        title : ab 
                    });
                }
                
                circ.id = model.get('isolate_id');
                
                i.appendChild(circ);
                
                circ.onmouseover = $.proxy(this.isolateHover, this);
                circ.onmouseout = $.proxy(this.isolateResetHover, this);
                circ.onclick = function(evt)
                {
                    evt.stopPropagation();
                    evt.preventDefault(); 
                    evt.cancelBubble = true;
                };
                
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
            checkLoaded : function()
            {
                if(this.isolatesLoaded && this.overlapsLoaded && this.loactionLoaded) {
                    this.redraw();   
                }
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
                    g = this.createSVGElement('g', { 'id' : 'Patient:' +patient_id, 'class' : 'patient' + (i % 2 ? '' : ' alt' ) + (patient_id == this.selected_patient ? ' selected' : ''), 'transform' : 'translate(0, ' + (i*h) + ')' }),
                    band = this.createSVGElement('rect' , { 'x' : 0, 'y' : 0, 'rx' : 5, 'ry' : 5, 'width' : this.size[0], 'height' : h, class : 'band' }),
                    label = this.createSVGElement('text',  { 'x' : 10, 'y' : 20, 'class': 'label' }),
                    lock = this.createSVGElement('path', { transform : 'scale(0.9, 0.9) translate(70, 1)', class:'lock', d : 'M24.875 15.334 V10.457999999999998 C24.875 5.563999999999998 20.894 1.5829999999999984 16 1.5829999999999984S7.125 5.563999999999998 7.125 10.457999999999998 V15.334 H5.042 V30.417 H26.958V15.334 H24.875ZM10.625 10.458 C10.625 7.494 13.036 5.083 16 5.083S21.375 7.494 21.375 10.458 V15.334H10.625 V10.458Z M18.272 26.956 H13.726999999999999 L14.948999999999998 23.289 C14.166999999999998 22.900000000000002 13.624999999999998 22.101000000000003 13.624999999999998 21.17 C13.624999999999998 19.858 14.687999999999999 18.795 15.999999999999998 18.795 S18.375 19.857000000000003 18.375 21.17 C18.375 22.102 17.833 22.900000000000002 17.051 23.289 L18.272 26.956Z'}),
                    selected = this.createSVGElement('path', { transform : 'scale(0.9, 0.9) translate(70, 1)', class:'select', d : 'M2.379,14.729 5.208,11.899 12.958,19.648 25.877,6.733 28.707,9.561 12.958,25.308z'}),
                    ctx = this;
                
                g.onclick = function(evt)
                {
                    ctx.lock(patient_id); 
                    evt.preventDefault();
                };
                
                label.appendChild(document.createTextNode(patient_id));
                g.appendChild(band);
                g.appendChild(label);
                g.appendChild(lock);
                g.appendChild(selected);
                
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
                    txt = this.createSVGElement('text', { x : gu + 5, y : 20, class : 'episode' });
                
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
                
                yr = this.createSVGElement('text', { x: 0,  y: 13,
                    'fill': '#444',
                    'font-size': 15,
                    'class': 'tick year'});
                yr.appendChild(document.createTextNode(this.start_date.getFullYear()));
                
                this.svg.appendChild(yr);
                
                for(var d = new Date(this.start_date.getFullYear(), this.start_date.getMonth(), this.start_date.getDate());
                    d <= this.end_date; 
                    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + zoom.gap_days))
                {
                    var x = this.getPositionOnScale(d);
                    
                    if( x < this.gutter ) continue;
                    
                    //var tick = this.canvas.path('M ' + x + ' 20 L ' + x + ' ' + this.size[1]);
                    //tick.attr('stroke', isFirst ? '#666' : '#ccc');
                    
                     var is1Jan = d.getMonth() == 0 && d.getDate() == 1;
                    d.setHours(0);
                    x = this.getPositionOnScale(d);
                    
                    var tick = this.createSVGElement('path', 
                             {
                                d :  'M ' + x + ' 20 L ' + x + ' ' + this.size[1],
                                stroke: isFirst ? '#666' : '#ccc'
                             }),
                    label = this.createSVGElement('text', {
                        x : x,
                        y : 13,
                        'class' : 'tick'  + (is1Jan ? ' year' : ''),
                        'fill' : '#444',
                        'font-size' : 15
                    });
                    
                    this.svg.appendChild(tick);
                    label.appendChild(document.createTextNode(d.strftime(is1Jan ? '%Y' : '%d %b')));
                    
                    this.svg.appendChild(label);
                    
                    isFirst = false;
                }
                
                var d = new Date(this.end_date.getFullYear(), this.end_date.getMonth(), this.end_date.getDate() +1 ),
                    x = this.getPositionOnScale(d);
                    tick = this.createSVGElement('path', {d : 'M ' + x + ' 20 L ' + x + ' ' + this.size[1], 'stroke': '#666'});
                
            },
            /**
             * get path text for an equalateral triangle where the point are r from the centre
             */
            getTrianglePath : function(x, y, r) {
                var points = [];
                var stp = Math.PI * 2 / 3;
                
                for ( var i = 3 ; i-- ; )
                {
                    var theta = stp* i;
                    points.push([x + r * Math.sin(theta), y - r * Math.cos(theta)].join(' '));
                }
                
                return 'M ' + points.join(' L ') + ' z';
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
                    var jqs = $('.positive', this.$el);
                    for(var i = 0; i < jqs.length; i++)
                    {   
                        var ttl2 = jqs[i].getAttribute('title');

                        if( ttl2.indexOf(ttl) !== -1 || ttl.indexOf(ttl2) !== -1)
                        {
                            jqs[i].classList.add('related');
                        }
                    }
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
                if (id == this.selected_patient) { return; }
                var idx = this.locked.indexOf(id);
                if(idx == -1)
                {
                    this.locked.push(id);
                    document.getElementById('Patient:' + id).classList.add('locked');
                }
                else
                {
                    this.locked.splice(idx, 1);
                    document.getElementById('Patient:' + id).classList.remove('locked');
                }
                
                this.movePatients();
            },
            movePatient : function(patient, idx)
            {
                if(!patient) return;
                
                idx = idx + 1;
                
                var desty = idx * 30,
                    srcy = Number(patient.getAttribute('transform').replace(/[^\d]/gi ,''));
                
                if(idx % 2) 
                {
                    patient.classList.add('alt');   
                }
                else
                {
                    patient.classList.remove('alt'); 
                }
                
                if( desty == srcy ) { return; }
                    
                var i = 0,
                    steps = 10.0,
                    step = (desty - srcy) / steps,
                    ival = setInterval(function(){
                        patient.setAttribute('transform', 'translate(0, ' + (srcy + (i * step)) + ')');
                        if( i == steps ) clearInterval(ival);
                        i++;
                    }, 10);
                
                
            },
            movePatients : function()
            {
                var i = 0;
                console.debug(this.show);
                
                if(this.selected_patient && this.patients[this.selected_patient])
                {
                    //this.patients[this.selected_patient].classList.remove('hidden'); 
                    this.movePatient(this.patients[this.selected_patient], i++);
                }
                
                for( var j = 0; j < this.locked.length; j++ )
                {
                    //this.patients[this.locked[j]].classList.remove('hidden');
                    this.movePatient(this.patients[this.locked[j]],  i++);
                    this.patients[this.locked[j]].classList.add('locked');
                }
                
                for( var p in this.patients)
                {
                    if(this.show.indexOf(p.toString()) == -1)
                    {
                        //this.patients[p].classList.add('hidden');
                        //continue;
                    }
                    else
                    {
                        console.debug(p);
                        //this.patients[p].classList.remove('hidden');
                    }
                    
                    if( this.selected_patient != p &&  this.locked.indexOf(p) == -1 )
                    {
                         this.movePatient(this.patients[p],  i++);
                    }
                }
            },
            popup : function(ele, txt)
            {
                /*var transform = ele.getCTM();
                if ( ele.tagName == 'path' )
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
                this.patients = {};
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
                
                this.$('.zoom_bar .btn-info').removeClass('btn-info');
                this.$('.zoom_bar #zoom_' + (this.zoom + 1)).addClass('btn-info');
            },
            zoomOut : function()
            {
                if( this.zoom > 0 ) { this.setZoom(this.zoom - 1) ; }
            },
            zoomIn : function()
            {
                if( this.zoom < this.zooms.length - 1 ) { this.setZoom(this.zoom + 1); }
            },
            zoomTo : function(evt)
            {
                var lvl = evt.target.id.replace(/zoom_/, '');
                this.setZoom(Number(lvl) - 1);
            }
	   });
    
	return TimeLine;
	
})();