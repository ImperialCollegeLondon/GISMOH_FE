/*global define, Backbone, Raphael */
var Linker = (function () {
    'use strict';
	var Linker = {},
        TIME_FORMAT = '%Y-%m-%dT%H:%M:%S',
        SVG_NS = "http://www.w3.org/2000/svg";
    
    
	Linker.Graph = Backbone.View.extend({
		events : {
			'click circle' : 'selectPatient',
			'click path.danger' : 'selectPatient'
		},
		abortRequest : function () {
			if (this.breq && this.breq.readyState > 0 && this.breq.readyState < 4) { this.breq.abort(); }
			if (this.lreq && this.lreq.readyState > 0 && this.lreq.readyState < 4) { this.lreq.abort(); }
		},
		initialize: function () {
			this.loc_collection = this.options.loc_collection;
			this.bio_collection = this.options.bio_collection;
			
			this.$el.addClass('gismoh_plugin');
			
            this.isolate_id = -1;
            
			this.router = this.options.router;
            this.router.components.push(this);
            
			this.d = 10.0;
			this.r = this.d / 2.0;
			this.padding = 10.0;
			
			this.size = [this.$el.width(), Math.max(this.$el.height(), 300)];
			this.centre = [this.size[0] / 2, this.size[1] / 2];
			
			this.rmin = this.d * 7.0;
			this.rmax = Math.min(this.centre[0], this.centre[1]) - this.padding;
			
			this.r_c = this.rmax - this.rmin;
			
            this.$el.append('<svg class="linker" width="' +this.size[0]+ '" height="' + this.size[1] + '"></svg>');
            
			this.canvas = this.$('svg');
			this.$el.prepend('<h2>Related Isolates<button class="help" type="button" data-toggle="modal" data-target="#isolates-help" title="Help">?</button></h2>');
            
			this.listenTo(this.bio_collection, 'sync', this.addAll);
			this.listenTo(this.loc_collection, 'sync', this.addAllLocations);
			
            this.router.on('route:selected', this.selectedPatient, this);
            
			this.listenTo(this.bio_collection, 'request', this.setLoading);
			this.listenTo(this.loc_collection, 'request', this.setLoading);
			this.listenTo(this.bio_collection, 'sync', this.unsetLoading);
			this.listenTo(this.loc_collection, 'sync', this.unsetLoading);
		},
        createLegend : function()
        {
            var legend_group = this.createSVGElement('g', { 
                class : 'legend', 
                transform : 'translate('+ (this.size[0] - 205) +','+(this.size[1] - 60)  +')'
            });

            legend_group.appendChild(this.createSVGElement('circle', {
                x:0, 
                y:10, 
                r:this.d
            }, true));
            
            legend_group.appendChild(this.createSVGElement('text', {
                x:10 + this.d, 
                y:5, 
                r:this.d
            }, true))
                .appendChild(document.createTextNode('Strain match'));
            
            legend_group.appendChild(this.createSVGElement('path', {
                d : this.getTrianglePath(0, 25, this.d * 1.1), 
                class : 'danger'
            }, true));
            
            var lbl2 = this.createSVGElement('text', {x:10 + this.d, y:30, r:this.d}, true);
            var sp1 = this.createSVGElement('tspan', { x : 10 + this.d }, true);
            var sp2 = this.createSVGElement('tspan', { x : 10 + this.d, dy : "1.2em" }, true);

            sp1.appendChild(document.createTextNode('Strain match and'));
            sp2.appendChild(document.createTextNode('location overlap'));
            
            lbl2.appendChild(sp1);
            lbl2.appendChild(sp2);
            
            legend_group.appendChild(lbl2);
            
        },
        set_isolate : function(isolate_id)
        {
            this.isolate_id = isolate_id;
            this.loadData();
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
                r = this.getR(similarity) + this.d + 60;
			
			return [r * Math.cos(theta), r * Math.sin(theta) + 6];
		},
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
         * create and return an SVG element 
         *
         * @param tag_name {string} the type of element to be created
         * @param attrs {object} a dictionary of the attributes to apply to the object
         */
        createSVGElement : function (tag_name, attrs, prevent_append)
        {
            var ele  = document.createElementNS(SVG_NS, tag_name);
            
            for( var key in attrs )
            {
                ele.setAttribute(key, attrs[key]);   
            }
            
            if(!prevent_append) this.canvas.append(ele);
            
            return ele;
        },
		addAll : function () {

			this.canvas.empty();
			this.eles = {};
			
            if (this.bio_collection.length == 0) {
                
                this.no_links();
            }
            else
            {
                this.bio_collection.each(this.addOne, this);

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
 
                //lbl.appendChild(document.createTextNode(this.selected_id));
                
                this.loc_collection.reset();
                this.lreq = this.loc_collection.fetch({
                    data: {
                        patient_id : this.patient_id,  
                        at_date : this.router.dateTime.strftime(TIME_FORMAT,  this.dateTime) 
                    }
                }); 
                this.addAllLocations();
            }
            this.createLegend();
		},
		addOne : function (model, i) {
			//if(this.eles[model.get('Result')['patient_id']]) return;
			
			var cen = this.getCentre(i, model.get('similarity')),
                l = this.createSVGElement('path', {d : 'M ' + this.centre[0] + ' ' + this.centre[1] + ' l' + cen[0] + ' ' + cen[1], id : this.d }),
                 c = this.createSVGElement('circle', {
                    cx : this.centre[0] + cen[0],
                    cy :this.centre[1] + cen[1],
                    r : this.d,
                    title : model.get('Isolate').patient_number,
                    id : model.get('Isolate').patient_id
                });

			this.eles[model.get('Isolate')['patient_id'].toString()] = c;
			
			var ct = this.getTextAnchor(i, model.get('similarity'));
			var lbl = this.createSVGElement('text', { 
                x : this.centre[0] + ct[0], 
                y :this.centre[1] + ct[1], 
                'text-anchor' : ct[0] > 0 ? 'start': 'end' });
            lbl.appendChild(document.createTextNode(model.get('Isolate')['patient_number']));
		},
		addAllLocations : function() {
            this.$('.danger').removeClass('danger');
            this.loc_collection.each(this.addOneLocation, this);
		},
		addOneLocation : function(model, i) {
			var ele = this.eles[model.get('patient_id').toString()];
			if(ele && ele.tagName == 'circle')
			{
                $(ele).remove();
                ele = this.createSVGElement('path', { 
                d : this.getTrianglePath(ele.cx.baseVal.value, 
                                         ele.cy.baseVal.value, 
                                         ele.r.baseVal.value * 1.1), 
                    class : 'danger',
                    id: ele.id,
                    title : ele.title
                });
                
				this.eles[model.get('patient_id').toString()] = ele;
			}
		},
        loadData : function()
        {
                this.breq = this.bio_collection.fetch({
                    data:{
                        isolate_id: this.isolate_id,  
                        at_date :  this.router.dateTime.strftime(TIME_FORMAT),  
                    }
                });  
        },
		no_links:function() {
            this.$el.removeClass('laoding');
            
			var txt = this.createSVGElement('text', {
                x : 70,
                y : 20,
                'font-style':'italic'
            });
            txt.appendChild(document.createTextNode("No similar isolates"));
		
			//txt.attr('font-size', 14);
			//txt.attr('font-style', 'italic');
            
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
				this.loadData();
			}
			else
			{
				this.no_links();
			}
		},
        /**
         *  set the date and time the plugin uses as a base
         */
		setDateTime : function(dt) {
			this.datetime = dt;
			this.abortRequest();
            
			if(this.selected_id)
			{
				this.loadData();
			}
			else
			{
				this.no_links();
			}
		},
		setLoading : function() {
			this.$el.addClass('loading');
		},
		unsetLoading : function() {
		  this.$el.removeClass('loading');
		}
	});
	
	return Linker;
})();