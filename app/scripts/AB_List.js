var AB_List = (function()
{
    "use strict";
    
    var AB_List = Backbone.View.extend({
        events: {
            "click .btn" : "click_ab" 
        },
        initialize: function(){
            this.order = [];
            this.selected_patient = undefined;
            
            this.$el.addClass('gismoh_plugin');
            this.$el.append('<h2>Antibiograms</h2>'); 
            
            this.options.controller.on('route:selected', this.selectPatient, this);
            this.controller = this.options.controller;
            this.controller.components.push(this);
            
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
        },
        addAll : function(){
            this.reset();
            if(this.selected_patient)
            {
                this.collection.each(this.addOne, this);
                this.draw();
                //this.$('.btn:first').addClass('btn-info');
                this.$('.btn:first').click();
            }
        },
        addOne : function(mdl)
        {
            
            var ab = mdl.get('result')[0];
            if(  mdl.get('patient_id') != this.selected_patient ) return; 
            
            this.abs[ab.sir_identifier] = ab;
        },
        click_ab : function(evt)
        {
            
            var btn = evt.target;
            
            while(!btn.classList.contains('btn')) { 
                btn = btn.parentElement; 
                if (!btn) throw "null button";
            }
            
            this.controller.select_isolate(btn.id);
            
        },
        draw : function()
        {
            this.$('div').remove();
            var lst = _.sortBy(this.abs, function(obj){return obj.test_date;} );
            
            for( var ab in lst)
            {
                this.drawOne(lst[ab]);
            }
            
        },
        drawOne : function(ab){
            
            var ctl = document.createElement('div');
            ctl.classList.add('btn');
            ctl.classList.add('btn-default');
            ctl.id = ab.isolate_id;
            
            var ab_span = document.createElement('div')
            ab_span.className='ab-string';
            ab_span.appendChild(document.createTextNode(this.getABString(ab.sir_results)));
            
            var date_span = document.createElement('div')
            date_span.className='ab-date';
            
            
            date_span.appendChild(document.createTextNode(new Date(ab.date_tested.replace(' ', 'T')).strftime('%d %b %Y')));
            
            ctl.appendChild(ab_span);
            ctl.appendChild(date_span);
            ctl.classList.add(ab.sir_results_identifier);
            this.$('h2').after(ctl);
            
        },
        /**
         * Event handler to trigger list generation when the selected patient is changed
         */
        selectPatient : function(evt){
            this.selected_patient = evt;
            this.reset();
            this.addAll();
        },
        set_isolate : function(iso_id)
        {
           this.$('.btn').each(function(idx, ele)
           {
                if( ele.id == iso_id )
                {
                    ele.classList.add('selected');
                }
                else
                {
                    ele.classList.remove('selected');
                }
           });
        },
        /***
         * return the 
         */
        getABString : function(ab)
        {
//            var str = "";
//            for( var i = this.order.length; i--; ) { str += '-'; }
//            
//            for( var j = 0; j < ab.length ; j++ )
//            {
//                var pos = this.order.indexOf(ab[j]['Antibiotic']);
//                
//                if(pos < 0)
//                {
//                    pos = this.order.length;
//                    this.order.push(ab[j]['Antibiotic']);
//                }
//
//                str = str.substr(0, pos) + ab[j]['SIR'] + str.substr(pos+1);
//            }
        
            var str = '';
            for ( var x in ab) { str += ab[x]}
            return str;
        },
        reset : function(){
            this.order = [];   
            this.abs = {};
        }
    });
    
    return AB_List;
})();