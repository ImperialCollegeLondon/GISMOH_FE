(function(){
    var templateManager,
        patientTable,
        antibioticList = [];

    function addAntibiotic(antibiotic)
    {
        patientTable.addHeader(antibiotic, 'antibiotics');
    }

    function drawPatients(data)
    {
        if(typeof data == 'string') { data = JSON.parse(data); }

        var table = document.getElementById('patient_table')

        for( var i = 0; i < data.length; i++ )
        {
            var formatted_isolate = format(data[i])
        }
    }

    function format(isolate)
    {
        var antibiogram = isolate.sir_result;
        for ( var antibiotic in antibiogram )
        {
            if ( antibioticList.indexOf(antibiotic) == -1 ) // if this antibiotic isn't in the list of antibiotics
            {
                addAntibiotic(antibiotic);
            }

        }

    }

    function init()
    {
        templateManager = new TemplateManager();

        patientTable = new PatientTable('#patient_table', templateManager);

        loadIsolates(null, new Date(2014, 01, 01));
    }

    function loadIsolates(from_date, to_date, filters)
    {
        $.ajax({
            url: '/api/risk_patients',
            data : {
                at_date : to_date.strftime('%Y-%m-%dT%H:%M:%S')
            },
            success: drawPatients
        });
    }

    document.body.onload = init;
})();
