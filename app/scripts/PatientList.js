var PatientList = (function(){
    var PatientList = {},
        TIME_FORMAT = '%Y-%m-%dT%H:%M:%S';


    /**
     *  An individual Patient Item
     */
    PatientList.PatientItem = Backbone.View.extend({
        tagName : 'tr',
        events : '',
        initialize: function() {
          this.listenTo(this.model, 'change', this.render);
        },
        template : _.template($('#patient_template').html()),
        render : function()
        {
            this.$el.prop('id', this.model.get('patient_id'));
            this.$el.append(this.template(this.model.attributes));
            this.$el.addClass(this.model.get('type'));
            this.$el.addClass('patient');
            this.$el.attr('data-isolate', this.model.get('ab').isolate_id);
            return this;
        }
    });

    /*
     * A list of patient Items
     */
    PatientList.List = Backbone.View.extend({
        selected_id : null,
        events : {
            'click tbody tr' : 'selectPatient'
        },

        abortRequest : function()
        {
            if (this.req && this.req.readyState > 0 && this.req.readyState < 4) this.req.abort();
        },
        addOne : function(item)
        {
            var pat_itm = new PatientList.PatientItem({model : item }),
                tr = pat_itm.render().el;

            this.addResult(item.get('ab').sir_results, tr);

            this.tbody.append(tr);
        },
        addAll : function()
        {
            this.collection.each(this.addOne, this)
            this.unsetLoading();
        },
        addResult : function(result, tr)
        {
            tr = $(tr);

            for( var i = 0; i < this.antibiotics.length ; i ++)
            {
               this.addAntibioticResult(result[this.antibiotics[i]], tr);
            }

            for( var antibiotic in result )
            {
                if( this.antibiotics.indexOf(antibiotic) == -1 )
                {
                    this.addAntibioticHeader(antibiotic);
                    this.addAntibioticResult(result[antibiotic], tr);
                }
            }
        },
        addAntibioticResult : function(result, tr)
        {
            if( result )
            {
                tr.append('<td class="' + result + '">' + result + '</td>');
            }
            else
            {
                tr.append('<td class="gap">.</td>');
            }
        },
        addAntibioticHeader : function(antibiotic)
        {
            var name_end = antibiotic.indexOf(' - ');

            this.antibiotics.push(antibiotic);

            if(name_end > 0)
            {
                antibiotic = antibiotic.substr(0, name_end);
            }

            this.thead.append('<th title="' + antibiotic + '">' + antibiotic.substr(0, 3) + '</th>');
        },
        initialize: function()
        {
            this.$el.addClass('gismoh_plugin');
            //this.collection = new PatientList.PatientCollection();

            this.router = this.options.router;
            this.router.components.push(this);

            //this.router.on('route:selected', this.selectedPatient, this);

            this.listenTo(this.collection, 'add', this.addOne);
            this.listenTo(this.collection, 'reset', this.addAll);
            this.listenTo(this.collection, 'all', this.render);
            this.listenTo(this.collection, 'request', this.setLoading);
            this.$el.empty();

            this.$el.addClass('patient_viewer');
            this.$el.append('<h2>Recent Isolates <button class="help" type="button" data-toggle="modal" data-target="#patient-list-help" title="Help">?</button></h2><table><thead><tr><th>NHS Number</th><th>Ward</th><th>Speciality</th></tr></thead><tbody></tbody></table>');

            this.tbody = this.$('tbody');
            this.thead = this.$('thead tr');
            this.antibiotics = [];
        },
        render : function(){

            this.list = this.$el;
            this.$('.patient').remove();
            $('i', this.$el).remove();

            if( this.collection.length == 0 && !this.$el.hasClass('loading') )
            {
                this.$el.append('<i>No new isolates</i>');
            }
            else
            {
                this.addAll();
            }

            if( this.selected_id )
            {
                this.selectedPatient(this.selected_id)
            }

            return this;
        },
        setLoading : function()
        {
            this.$el.addClass('loading');
        },
        unsetLoading : function()
        {
            this.$el.removeClass('loading');
        },
        selectPatient : function(evt)
        {
            $('.patient', this.$el).removeClass('selected');
            var tgt = $(evt.target);
            if (! tgt.hasClass('patient'))
            {
                tgt = tgt.parents('.patient')
            }
            tgt.addClass('selected');
            this.selected_id = tgt.prop('id');
            //this.router.navigate('/time/' +  this.router.dateTime.strftime('%Y-%m-%d %H:%M:%S') + '/patient/' + tgt.prop('id'), { trigger : true, replace:true });

            var isolate_id = tgt.attr('data-isolate'),
                patient_id = tgt.attr('id');

            this.router.set_path({ isolate : isolate_id, patient : patient_id});

        },
        selectedPatient: function(id)
        {

            this.selected_id = id;
            $('.patient', this.$el).removeClass('selected');
            $('#' + id, this.$el).addClass('selected');
        },
        setDateTime : function(dt)
        {
            this.abortRequest();
            this.req = this.collection.fetch({
                data : {
                    at_date : this.router.dateTime.strftime(TIME_FORMAT)
                }
            });
        },
        router : null
    });

    return PatientList;
})();
