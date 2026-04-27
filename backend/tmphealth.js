const http=require('http'); const req=http.request({hostname:'127.0.0.1',port:5000,path:'/api/v1/health',method:'GET'}, res=; res.on('data',()=;}); req.on('error', e=, e.message)); req.end(); 
