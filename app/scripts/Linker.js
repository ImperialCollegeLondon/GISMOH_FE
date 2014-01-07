/*global define, Backbone, Raphael */
var Linker = (function () {
    'use strict';
	var Linker = {},
        TIME_FORMAT = '%Y-%m-%dT%H:%M:%S',
        SVG_NS = "http://www.w3.org/2000/svg";
    
    
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
			
            this.$el.append('<svg class="linker" width="' +this.size[0]+ '" height="' + this.size[1] + '"></svg>');
            
			this.canvas = this.$('svg');
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
			
			return [r * Math.cos(theta), r * Math.sin(theta) + 6];
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
            
            this.canvas.append(ele);
            
            return ele;
        },
		addAll : function () {

			this.canvas.empty();
			this.eles = {};
			
            if (this.bio_collection.length == 0) {
                //this.no_links();
            }
            else
            {
                this.bio_collection.each(this.addOne, this);
                
                /*var c = this.canvas.circle(this.centre[0], this.centre[1], this.d * 2),
                    lbl = this.canvas.text(this.centre[0], this.centre[1], this.selected_id);
                
                c.attr('fill', '#428bca');
                c.attr('stroke', '#357ebd');
                c.attr('title', 'Selected Patient (' + this.selected_id  + ')');
                    
                lbl.attr('fill', '#FFF');
                lbl.attr('font-size', 16);*/
                
                var c = this.createSVGElement('circle', {
                    cx : this.centre[0],
                    cy :this.centre[1],
                    r : this.d*2,
                    class : 'selected',
                    title : 'Selected Patient (' + this.selected_id  + ')'
                }), lbl = this.createSVGElement('text', {
                    x : this.centre[0],
                    y :this.centre[1] + 6,
                    class : 'selected',
                    title : 'Selected Patient (' + this.selected_id  + ')'
                });
                
                
                
                lbl.appendChild(document.createTextNode(this.selected_id));
                
                this.loc_collection.reset();
                this.lreq = this.loc_collection.fetch({data: {patient_id : this.selected_id,  at_date : this.router.dateTime.strftime(TIME_FORMAT,  this.dateTime) }}); 
                this.addAllLocations();
            }
		},
		addOne : function (model, i) {
			//if(this.eles[model.get('Result')['patient_id']]) return;
			
			var cen = this.getCentre(i, model.get('similarity')),
                l = this.createSVGElement('path', {d : 'M ' + this.centre[0] + ' ' + this.centre[1] + ' l' + cen[0] + ' ' + cen[1], id : this.d }),
                 c = this.createSVGElement('circle', {
                    cx : this.centre[0] + cen[0],
                    cy :this.centre[1] + cen[1],
                    r : this.d,
                    title : model.get('Result')['patient_id'],
                    id : model.get('Result')['patient_id']
                })
    
		      
            
			this.eles[model.get('Result')['patient_id'].toString()] = c;
			
			var ct = this.getTextAnchor(i, model.get('similarity'));
			var lbl = this.createSVGElement('text', { x : this.centre[0] + ct[0], y :this.centre[1] + ct[1], 'text-anchor' : ct[0] > 0 ? 'start': 'end' });
            lbl.appendChild(document.createTextNode(model.get('Result')['patient_id']));
		},
		addAllLocations : function() {
            this.$('.danger').removeClass('danger');
            this.loc_collection.each(this.addOneLocation, this);
		},
		addOneLocation : function(model, i) {
			var ele = this.eles[model.get('patient_id').toString()];
			if(ele)
			{
				ele.classList.add('danger');
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
			this.canvas.empty();
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
})();