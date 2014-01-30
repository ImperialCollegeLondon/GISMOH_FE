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
            
            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
        },
        addAll : function(){
            this.reset();
            if(this.selected_patient)
            {
                this.collection.each(this.addOne, this);
                this.draw();
                this.$('.btn:first').addClass('btn-info');
            }
        },
        addOne : function(mdl)
        {
            var ab = mdl.get('result');
            if( ab.length < 3 || mdl.get('patient_id') != this.selected_patient ) return; 
            var str = this.getABString(ab);
            
            if( !this.abs[str] || this.abs[str].test_date < mdl.get('test_date') )
            {
                this.abs[str] = { 
                    test_date : mdl.get('test_date'),
                    str : str,
                    result : mdl.get('result')
                }
            }   
        },
        click_ab : function(evt)
        {
            
            var btn = evt.target;
            
            while(!btn.classList.contains('btn')) { 
                btn = btn.parentElement; 
                if (!btn) throw "null button";
            }
            
            
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
            
            var ab_span = document.createElement('div')
            ab_span.className='ab-string';
            ab_span.appendChild(document.createTextNode(ab.str));
            
            var date_span = document.createElement('div')
            date_span.className='ab-date';
            date_span.appendChild(document.createTextNode(new Date(ab.test_date).strftime('%d %b %Y')));
            
            ctl.appendChild(ab_span);
            ctl.appendChild(date_span);
            ctl.classList.add(ab.str);
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
        selectAntibiogram : function(iso_id)
        {
            
        },
        /***
         * return the 
         */
        getABString : function(ab)
        {
            var str = "";
            for( var i = this.order.length; i--; ) { str += '-'; }
            
            for( var j = 0; j < ab.length ; j++ )
            {
                var pos = this.order.indexOf(ab[j]['Antibiotic']);
                
                if(pos < 0)
                {
                    pos = this.order.length;
                    this.order.push(ab[j]['Antibiotic']);
                }

                str = str.substr(0, pos) + ab[j]['SIR'] + str.substr(pos+1);
            }
        
            return str;
        },
        reset : function(){
            this.order = [];   
            this.abs = {};
        }
    });
    
    return AB_List;
})();