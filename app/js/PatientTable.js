var PatientTable = (function(){
    var Table = function(div)
    {
        this.div = $(div);

        this.date = new Date();

        this.div.append('<table><thead></thead><tbody></tbody></table>');
    };

    Table.prototype.loadData = function()
    {

    }

    Table.prototype.loadDataCallback = function(data)
    {

    }

    return Table;
})();
