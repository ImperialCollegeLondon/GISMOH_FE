var TemplateManager = (function(){
    TemplateManager = function(){

        this.template_dir = '/templates/';
        this.templates = {};
        this.loaded_event = $.Event('gismoh:template_loaded', { bubbles:false });
    }

    TemplateManager.prototype.load = function(name)
    {
        this.templates[name] = false;

        $.ajax({
            url : this.template_dir + name + '.mustache',
            success: this.load_template_callback.bind({ templates : this.templates, name : name, loaded_event : this.loaded_event }),
            error: this.load_template_error
        });
    }

    TemplateManager.prototype.loadAndAppend = function(name, data, parent)
    {
        if(this.templates[name])
        {
            $(parent).append(this.use_template(name, data));
        }
        else
        {
            $(document.body).one('template:loaded:' + name, function(evt, name)
            {

                $(parent).append(this.use_template(name, data));
            }.bind(this));

            this.load(name);
        }
    }

    TemplateManager.prototype.load_template_callback = function(data, status, xhr)
    {

        this.templates[this.name] = data;

        $(document.body).trigger('template:loaded', [this.name]);
        $(document.body).trigger('template:loaded:' + this.name, [this.name]);
    }

    TemplateManager.prototype.load_template_error = function(xhr, errorType, error)
    {
        $('section').remove();
        $(body).append('<section class="error"><h1>Loading Error<h1><p>Template Loading failed with error : ' + error + '</section>');
    }

    TemplateManager.prototype.use_template = function(name, data)
    {


        if(this.templates[name])
        {
            console.debug('render');
            return Mustache.render(this.templates[name], data);
        }
        else
        {
            if(console) console.error('template ' + name + ' not loaded');
        }
    }

    return TemplateManager;
})()
