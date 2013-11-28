define(['backbone', 'underscore'], function(){
	var Replay = Backbone.View.extend({
		currentDateTime : null,
		events:{
			'click .handle' : 'toggle',
			'click .decday' : 'decrement_day',
			'click .dechr' : 'decrement_hour',
			'click .incday' : 'increment_day',
			'click .inchr' : 'increment_hour'
			
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
			this.$el.append('<div class="tray"><div class="curdate"></div><span class="btn decday" title="-1 Day"><span class="glyphicon glyphicon-fast-backward"></span></span><span class="btn dechr"><span class="glyphicon glyphicon-backward" title="-1 Hour"></span></span><span>&nbsp;</span><span class="btn inchr" title="+1 Hour"><span class="glyphicon glyphicon-forward" title="-1 Hour"></span></span><span class="btn incday" title="+1 Day"><span class="glyphicon glyphicon-fast-forward" title="-1 Hour"></span></span></div><div class="handle">Set Time</div>')
		},
		open : function()
		{
			console.debug('open');
			this.$el.clearQueue();
			this.$el.animate({'top' : '0px'})
		},
		close : function()
		{
			this.$el.clearQueue();
			this.$el.animate({'top' : '-70px'})
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
		toggle : function()
		{
			if(this.$el.offset().top == -70)
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
			$('.curdate', this.$el).text(dt);
		},
		fireUpdate : function()
		{
			this.controller.setDateTime(this.controller.dateTime);
		}
	});

	return Replay;
});