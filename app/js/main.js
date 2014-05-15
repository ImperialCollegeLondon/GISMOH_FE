(function(){
    function init()
    {
        var panels = new Panels(document.body.querySelector('.panels'));
        window.panels = panels;
    }

    document.body.onload = init;
})();
