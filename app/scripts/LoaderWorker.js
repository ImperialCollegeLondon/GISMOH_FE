// avoid duplicate, redundent requests
var current_reqs = {}

self.addEventListener('message', function(evt)
{
	var args = JSON.parse(evt.data);
	checkAndSend(args);
	
}, false);

function checkAndSend(args)
{
    var q_string = getQString(args);
    var matching_req = current_reqs[args.url];
    
    if( !matching_req ) 
    {
        send(args.url, q_string);
    }
    else if( matching_req.data == q_string)
    {
        console.debug('don\'t send')
        return;
    }
    else
    {
        console.debug('cancel');
        matching_req.req.abort();
        send(args.url, q_string);
    }
}

function getQString(args)
{
    var q_arr = [];
    
    for ( var k in args.params )
    {
        q_arr.push(k + '=' + args.params[k]);
    }
    
    return q_arr.join('&');
}
            
function send(url, q_string)
{
    var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(evt){
		if (xhr.readyState==4)
		{
			var exists = xhr.status == 200;
			self.postMessage(xhr.responseText);
            
            delete current_reqs[url];
		}
	};
    
    current_reqs[url] = { data : q_string, req : xhr };
    
	xhr.open('GET', url + '?' + q_string, true);
	xhr.send();
}