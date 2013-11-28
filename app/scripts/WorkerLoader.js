define([],function () {
    var WorkerLoader = function(params){
        var worker = new Worker('/scripts/LoaderWorker.js');
        
        worker.onmessage = function(message)
        {
            var data = message.data;
            if( typeof(data) == 'string' ) 
            {
                data = JSON.parse(data);   
            }
 
           if(params && params.callback) params.callback(data);  
        };
        
        this.loadUrl = function(url, params){
            worker.postMessage(JSON.stringify({ url : url, params : params }));   
        };
    };
    
    return WorkerLoader;
});