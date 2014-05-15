(function(){
    var templateManager,
        patientTable;

    function init()
    {
        templateManager = new TemplateManager();

        templateManager.loadAndAppend('patient_table', {}, document.getElementById('patient_table'));
        templateManager.load('patient_row');
    }



    document.body.onload = init;
})();
