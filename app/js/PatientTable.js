var PatientTable = (function(){
    var Table = function(div, templateManager)
    {
        this.div = $(div);

        this.date = new Date();

        templateManager.loadAndAppend('patient_table', {}, this.div);
        
        this.templateManager = templateManager;

        this.header = $('thead', this.div);
        this.body = $('body', this.div);
    };

    Table.prototype.addHeader = function(text, section)
    {
        var lastHeader = $('th:last-child', this.header);
        if(section)
        {
            lastHeader = $('th.' + section + ':last-child', this.header);
        }

        lastHeader.after('<th class="' + section  || '' + '">' + text + '</th>');
    }

    return Table;
})();
