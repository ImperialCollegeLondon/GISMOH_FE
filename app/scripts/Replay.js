var Replay = (function(){
	var Replay = Backbone.View.extend({
		currentDateTime : null,
		events:{
			'click .handle' : 'toggle',
			'click .decday' : 'decrement_day',
			'click .dechr' : 'decrement_hour',
			'click .incday' : 'increment_day',
			'click .inchr' : 'increment_hour',
            'change input': 'set_time',
            'change select': 'set_time'
			
		},
		initialize : function()
		{
			this.controller = this.options.controller;
            this.controller.components.push(this);
            this.dateTime = this.controller.dateTime;
			this.render();
		},
		render : function()
		{
			$('body').append(this.$el);
			
			this.$el.addClass('replay');
			this.$el.append('<div class="tray"><form class="curdate" id="curdate"><input type="number" name="day" /><select name="month"><option value="0">January</option><option value="1">February</option><option value="2">March</option><option value="3">April</option><option value="4">May</option><option value="5">June</option><option value="6">July</option><option value="7">August</option><option value="8">September</option><option value="9">October</option><option value="10">November</option><option value="12">December</option></select><input type="number" name="year" /> <input type="number" name="hour" />:<input type="number" name="minute" /></form><span class="btn decday" title="-1 Day"><span class="glyphicon glyphicon-fast-backward"></span></span><span class="btn dechr"><span class="glyphicon glyphicon-backward" title="-1 Hour"></span></span><span>&nbsp;</span><span class="btn inchr" title="+1 Hour"><span class="glyphicon glyphicon-forward" title="-1 Hour"></span></span><span class="btn incday" title="+1 Day"><span class="glyphicon glyphicon-fast-forward" title="-1 Hour"></span></span></div><div class="handle">Set Time</div>')
		},
		open : function()
		{
			this.$el.clearQueue();
			this.$el.animate({'top' : '0px'})
		},
		close : function()
		{
			this.$el.clearQueue();
			this.$el.animate({'top' : '-90px'})
		},
		increment_day : function()
		{
			var d = this.controller.dateTime;
			this.setDateTime(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, d.getHours(), d.getMinutes(), d.getSeconds()));
			this.fireUpdate();
		},
		increment_hour: function()
		{
			var d = this.controller.dateTime;
			this.setDateTime(new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, d.getMinutes(), d.getSeconds()));
			this.fireUpdate();
		},
		decrement_day : function()
		{
			var d = this.controller.dateTime;
			this.setDateTime(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, d.getHours(), d.getMinutes(), d.getSeconds()));
			this.fireUpdate();
		},
		decrement_hour: function()
		{
			var d = this.controller.dateTime;
			this.setDateTime(new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() - 1, d.getMinutes(), d.getSeconds()));
			this.fireUpdate();
		},
        set_time : function()
        {
            console.debug('change_date');
            dt = new Date();
            var frm = document.forms['curdate'];
            dt.setDate(frm.day.value );
            dt.setMonth(frm.month.value);
            dt.setFullYear(frm.year.value);
            dt.setHours(frm.hour.value);
            dt.setMinutes(frm.minute.value);
            
            this.controller.setDateTime(dt);
        },
		toggle : function()
		{
			if(this.$el.offset().top == -90)
			{
				this.open();
			}
			else
			{
				this.close();
			}
		},
		setDateTime : function(dt)
		{
			this.controller.dateTime = dt;
			//$('.curdate', this.$el).text(dt);
            var frm = document.forms['curdate'];
            frm.day.value = dt.getDate();
            frm.month.value = dt.getMonth();
            frm.year.value = dt.getFullYear();
            frm.hour.value = dt.getHours();
            frm.minute.value = dt.getMinutes();
		},
		fireUpdate : function()
		{
			this.controller.setDateTime(this.controller.dateTime);
		}
	});

	return Replay;
})();