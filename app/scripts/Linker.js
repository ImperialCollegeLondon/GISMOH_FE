/*global define, Backbone, Raphael */
define(['backbone', 'underscore', 'raphael', 'strftime'], function (ig, no, re, d) {
    'use strict';
	var Linker = {};
	var TIME_FORMAT = '%Y-%m-%dT%H:%M:%S';
    
	Linker.Graph = Backbone.View.extend({
		events : {
			'click circle' : 'selectPatient'
		},
		abortRequest : function () {
			if (this.breq && this.breq.readyState > 0 && this.breq.readyState < 4) { this.breq.abort(); }
			if (this.lreq && this.lreq.readyState > 0 && this.lreq.readyState < 4) { this.lreq.abort(); }
		},
		initialize: function () {
			this.loc_collection = this.options.loc_collection;
			this.bio_collection = this.options.bio_collection;
			
			this.$el.addClass('gismoh_plugin');
			
			this.router = this.options.router;
            this.router.components.push(this);
            
			this.d = 10.0;
			this.r = this.d / 2.0;
			this.padding = 10.0;
			
			this.size = [this.$el.width(), Math.max(this.$el.height(), 300)];
			this.centre = [this.size[0] / 2, this.size[1] / 2];
			
			this.rmin = this.d * 8;
			this.rmax = Math.min(this.centre[0], this.centre[1]) - this.padding;
			
			this.r_c = this.rmax - this.rmin;
			
			this.canvas = new Raphael(this.el, this.size[0], this.size[1]);
			this.$el.prepend('<h2>Related Isolates</h2>');
			
			this.listenTo(this.bio_collection, 'sync', this.addAll);
			this.listenTo(this.loc_collection, 'sync', this.addAllLocations);
			
			this.router.on('route:selected', this.selectedPatient, this);
            
			this.listenTo(this.bio_collection, 'request', this.setLoading);
			this.listenTo(this.loc_collection, 'request', this.setLoading);
			this.listenTo(this.bio_collection, 'sync', this.unsetLoading);
			this.listenTo(this.loc_collection, 'sync', this.unsetLoading);
			
		},
		getR : function (similarity) {
			return this.rmin + (this.r_c *  (1 - similarity));
		},
		getCentre : function (i, similarity) {
			var theta = (i / this.bio_collection.length) * Math.PI * 2,
                r = this.getR(similarity);
			
			return [r * Math.cos(theta), r * Math.sin(theta)];
		},
		getTextAnchor : function (i, similarity) {
			var theta = (i / this.bio_collection.length) * Math.PI * 2,
                r = this.getR(similarity) + this.d + 10;
			
			return [r * Math.cos(theta), r * Math.sin(theta)];
		},
		addAll : function () {

			this.canvas.clear();
			this.eles = {};
			
            if (this.bio_collection.length == 0) {
                //this.no_links();
            }
            else
            {
                this.bio_collection.each(this.addOne, this);
                
                var c = this.canvas.circle(this.centre[0], this.centre[1], this.d * 2),
                    lbl = this.canvas.text(this.centre[0], this.centre[1], this.selected_id);
                
                c.attr('fill', '#428bca');
                c.attr('stroke', '#357ebd');
                c.attr('title', 'Selected Patient (' + this.selected_id  + ')');
                    
                lbl.attr('fill', '#FFF');
                lbl.attr('font-size', 16);
                this.loc_collection.reset();
                this.lreq = this.loc_collection.fetch({data: {patient_id : this.selected_id,  at_date : this.router.dateTime.strftime(TIME_FORMAT,  this.dateTime) }}); 
                this.addAllLocations();
            }
		},
		addOne : function (model, i) {
			//if(this.eles[model.get('Result')['patient_id']]) return;
			
			var cen = this.getCentre(i, model.get('similarity')),
                l = this.canvas.path('M ' + this.centre[0] + ' ' + this.centre[1] + ' l' + cen[0] + ' ' + cen[1], this.d),
                c = this.canvas.circle(this.centre[0] + cen[0], this.centre[1] + cen[1], this.d);
			l.attr('stroke', '#b3b3b3');
			
			
			c.attr('fill', '#e6e6e6');
			c.attr('stroke', '#b3b3b3');
			c.attr('title', model.get('Result')['patient_id']);
			c.node.id = model.get('Result')['patient_id'];
		
			this.eles[model.get('Result')['patient_id'].toString()] = c;
			
			var ct = this.getTextAnchor(i, model.get('similarity'));
			var lbl = this.canvas.text(this.centre[0] + ct[0], this.centre[1] + ct[1], model.get('Result')['patient_id']);

			if(ct[0] > 0)
			{
				lbl.attr('text-anchor', 'start');
			}
			else
			{
				lbl.attr('text-anchor', 'end');
			}
		},
		addAllLocations : function() {
		
                console.debug(this.loc_collection.length);
				this.loc_collection.each(this.addOneLocation, this);
			
            
		},
		addOneLocation : function(model, i) {
			var ele = this.eles[model.get('patient_id').toString()];
			if(ele)
			{
				ele.attr('fill', '#d9534f');
				ele.attr('stroke', '#d43f3a');
			}
		},
		no_links:function() {
            this.$el.removeClass('laoding');
            
			var txt = this.canvas.text(10, 10, 'No Patients');
			txt.attr('text-anchor', 'start');
			txt.attr('font-size', 14);
		},
		selectPatient : function(evt) {
		
			this.selected_id = $(evt.target).prop('id');
			this.router.navigate('patient/' + this.selected_id, { trigger : true, replace:true });
		},
		selectedPatient : function (id) {
			this.canvas.clear();
			this.abortRequest();
			this.bio_collection.reset();
			this.selected_id = id;
			
			if(this.selected_id)
			{
				this.breq = this.bio_collection.fetch({data:{patient_id: this.selected_id,  at_date :  this.router.dateTime.strftime(TIME_FORMAT) }});
			}
			else
			{
				this.no_links();
			}
		},
		setDateTime : function(dt) {
			this.datetime = dt;
			this.abortRequest();
            
			if(this.selected_id)
			{
				this.breq = this.bio_collection.fetch({data:{patient_id: this.selected_id,  at_date : this.router.dateTime.strftime(TIME_FORMAT) }});
			}
			else
			{
				this.no_links();
			}
			//this.lreq = this.loc_collection.fetch({data:{patient_id: this.selected_id,  at_date : strftime(TIME_FORMAT,  this.datetime) }});
		},
		setLoading : function() {
			this.$el.addClass('loading');
		},
		unsetLoading : function() {
		  this.$el.removeClass('loading');
		},
	});
	
	return Linker;
});