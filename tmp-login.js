const http=require('http'); 
const data=JSON.stringify({email:'admin2@cms.com',password:'admin123456'}); 
const options={hostname:'127.0.0.1',port:5000,path:'/api/v1/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}}; 
const req=http.request(options,res= body='';res.on('data',chunk==chunk);res.on('end',()=;});}); 
req.on('error',err=,err.message)); 
req.write(data); 
req.end(); 
