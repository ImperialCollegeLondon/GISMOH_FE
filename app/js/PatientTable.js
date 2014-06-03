var PatientTable = (function(){
    var Table = function(div, templateManager)
    {
        this.div = $(div);
        this.date = new Date();
        this.antibiotics = [];

        templateManager.loadAndAppend('patient_table', {}, this.div);
        templateManager.load('patient_header');
        templateManager.load('patient_row');
        this.templateManager = templateManager;

        $(document.body).on('template:loaded:patient_table', this.tableLoaded.bind(this));

    };

    Table.prototype.addAntibiotic = function(name)
    {
        var ab_name = this.formatAntibiotic(name);

        this.addHeader(ab_name.shortName, ab_name.name, 'antibiotics');
        this.padExistingAntibiograms('antibiotics');
        this.antibiotics.push(name);
    }

    Table.prototype.addHeader = function(text, title, section)
    {
        var lastHeader = $('th', this.header);
        if(section)
        {
            var lastSectionHeader = $('th.' + section , this.header);

            if(lastSectionHeader.length) // if there's already a header in this section
            {
                lastHeader = lastSectionHeader
            }

        }

        lastHeader.not('.tail').last().after(this.templateManager.use_template('patient_header', { text: text, title:title, section: section}));
    }

    Table.prototype.addPatient = function(patient)
    {
        var patient_template = {};

        patient_template.ab = this.formatAntibiogram(patient);
        patient_template.patient_number = patient.patient_number;
        patient_template.date_of_birth = patient.dob;
        patient_template.location = patient.location;
        patient_template.patient_id = patient.patient_id;

        this.templateManager.loadAndAppend('patient_row', patient_template, this.body);

        this.getOverlapsFor(patient)

    }

    //add one more dot onto the end of any Antibiograms that have already been written
    Table.prototype.padExistingAntibiograms = function(section)
    {
        var rows = $('tr.patient', this.body),
            row_count = rows.length,
            row,
            last_td;

        for ( var r = 0; r < row_count; r++  )
        {
            row = rows[r];
            last_td = $('td.' + section + '', row);
            if( ! last_td.length )
            {
                last_td = $('td', row)
            }


            last_td.not('.tail').last().after('<td class="' + section + '">.</td>');
        }
    }

    Table.prototype.formatAntibiogram = function(patient)
    {
        var formatted_antibiogram = {},
            raw_antibiogram = patient.ab.sir_results,
            antibiotics_length = this.antibiotics.length,
            antibiotic;

        for ( var i = 0; i < antibiotics_length; i++ )
        {
            antibiotic = this.antibiotics[i];
            if( raw_antibiogram[antibiotic] )
            {
                formatted_antibiogram[antibiotic] = raw_antibiogram[antibiotic];
            }
            else
            {
                formatted_antibiogram[antibiotic] = '.';
            }
        }

        for( antibiotic in raw_antibiogram )
        {
            if( this.antibiotics.indexOf(antibiotic) == -1 ) // if the antibiotic is not already in the list
            {
                formatted_antibiogram[antibiotic] = raw_antibiogram[antibiotic];
                this.addAntibiotic(antibiotic);
            }
        }

        return formatted_antibiogram;
    }

    Table.prototype.formatAntibiotic = function(raw_name)
    {
        var antibiotic_name_end = raw_name.indexOf(' - '),
            name = antibiotic_name_end > 0 ? raw_name.substr(0, antibiotic_name_end) : raw_name,
            shortName = name.substr(0,3);


        return { name : name, shortName : shortName};
    }

    Table.prototype.getOverlapsFor = function(patient)
    {
        $('[patientid=n' + patient.patient_id + '] .inf, [patientid=n' + patient.patient_id + '] .ovl')
            .addClass('loading')

        $.ajax({
            url : '/api/similarity',
            data : {
                patient_id : patient.patient_id,
                at_date : new Date().strftime('%Y-%m-%dT%H:%M:%S'),
                isolate_id : patient.ab.isolate_id
            },
            success : function(data){
                $('[patientid=n' + patient.patient_id + '] .inf')
                    .removeClass('loading')
                    .text(data[patient.ab.isolate_id].length)
            }
        });

    }

    Table.prototype.tableLoaded = function(evt)
    {
        this.header = $('thead', this.div);
        this.body = $('tbody', this.div);
    }


    return Table;
})();
