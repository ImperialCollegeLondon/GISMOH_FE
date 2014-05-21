(function(){
    var templateManager,
        patientTable;

    function init()
    {
        templateManager = new TemplateManager();

        templateManager.loadAndAppend('patient_table', {}, document.getElementById('patient_table'));
        templateManager.load('patient_row');

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

    function drawPatients(data)
    {
        if(typeof data == 'string') { data = JSON.parse(data); }

        var table = document.getElementById('patient_table').firstChild.tBodies[0];

        for( var i = 0; i < data.length; i++ )
        {
            console.debug(data[i]);
            templateManager.loadAndAppend('patient_row', data[i], table);
        }
    }

    document.body.onload = init;
})();
