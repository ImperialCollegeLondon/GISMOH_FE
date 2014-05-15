var Panels = (function(){
    var Panels = function(div)
    {
        this.panels = $('.panel');
        this.selected_index = 0;
        this.select(0);
    };

    Panels.prototype.select = function (panel_index)
    {
        this.selected_index = panel_index;

        $.each(this.panels, function(i, raw_panel){
            var panel = $(raw_panel);

            if( i < this.selected_index )
            {
                this.sendLeft(panel);
            }
            else if( i > this.selected_index )
            {
                this.sendRight(panel);
            }
            else
            {
                this.sendMiddle(panel);
            }
        }.bind(this));
    };

    Panels.prototype.sendLeft = function(panel)
    {
        panel.addClass('left');
        panel.removeClass('selected');
    }

    Panels.prototype.sendRight = function(panel)
    {
        panel.removeClass('left');
        panel.removeClass('selected');
    }

    Panels.prototype.sendMiddle = function(panel)
    {
        panel.removeClass('left');
        panel.addClass('selected');
    }


    return Panels;
})();
