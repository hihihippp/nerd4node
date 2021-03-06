//   nerd4nodejs - A nodejs library which provides a programmable interface to the NERD API
//               http://nerd.eurecom.fr/api
//
//   Copyright 2012
//
//   Authors:
//      Giuseppe Rizzo <giuse.rizzo@gmail.com>
//      Yunjia Li <yl2@ecs.soton.ac.uk>
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU General Public License published by
// the Free Software Foundation, either version 3 of the License, or (at 
// your option) any later version. See the file Documentation/GPL3 in the
// original distribution for details. There is ABSOLUTELY NO warranty.

var needle = require('needle');
var async = require('async');
var errMsg= require('../lib/message.js').message.error;

var annotate = function (api_instance, 
                         api_key, 
                         ext, 
                         doc_type, 
                         t, 
                         gran, 
                         to, 
                         callback) 
{

    var postDocument = function (callbackDocument) {
        var data; 
        if ( doc_type == 'timedtext' ) data = {key: api_key, timedtext: t};
        else if ( doc_type == 'text' ) data = {key: api_key, text: t};

        needle.post(api_instance + 'document', data, function(err, resp, body) {
        	if(resp === undefined)
        	{
        		return callbackDocument(errMsg.INTERNET_CONNECTION_ERROR, null);
        	}
        	
            if(!err && resp.statusCode == 200 || resp.statusCode==201)
            {
                //console.log("postDocument");
                return callbackDocument(null, body.idDocument);
            }
            else if(resp.statusCode == 403) //api_key is not correct
            {
            	return callbackDocument(errMsg.API_KEY_ERROR, null);
            }
            else if(err) //err from the http connection in needle.post
            {
            	var errConn = errMsg.HTTP_CONNECTION_ERROR.message;
            	errConn += err;
            	
            	return callbackDocument(errConn, null);
            }
            else //err from NERD server
            {
            	return callbackDocument(errMsg.INTERNAL_ERROR, null);
            }
        });
    } 

    var postAnnotation = function (d, callbackAnnotation) {
        needle.post ( api_instance + 'annotation', {key: api_key,idDocument: d, extractor: ext, timeout: to }, {timeout: to*1000}, function(err, resp, body ){
        	if(resp === undefined)
        	{
        		return callbackAnnotation(errMsg.INTERNET_CONNECTION_ERROR, null);
        	}
            if(!err && resp.statusCode == 200 || resp.statusCode==201) 
            {
                return callbackAnnotation(null, body.idAnnotation);
            }
       		else if(resp.statusCode == 403) //api_key is not correct
            {
            	return callbackAnnotation(errMsg.API_KEY_ERROR, null);
            }
            else if(err) //err from the http connection in needle.post
            {
            	var errConn = errMsg.HTTP_CONNECTION_ERROR.message;
            	errConn += err;
            	
            	return callbackAnnotation(errConn, null);
            }
            else //err from NERD server
            {
            	return callbackAnnotation(errMsg.INTERNAL_ERROR, null);
            }
        });
    }

    var getEntities = function (e, callbackEntities) {
        needle.get(api_instance + 'entity?key='+api_key+'&idAnnotation=' + e + '&granularity=' + gran, function(err, resp, body){
        	if(resp === undefined)
        	{
        		return callbackEntities(errMsg.INTERNET_CONNECTION_ERROR, null);
        	}
        	
            if(!err && resp.statusCode == 200 || resp.statusCode==201) {
                return callbackEntities(null, body);
            }
            else if(resp.statusCode == 403) //api_key is not correct
            {
            	return callbackEntities(errMsg.API_KEY_ERROR, null);
            }
            else if(err) //err from the http connection in needle.post
            {
            	var errConn = errMsg.HTTP_CONNECTION_ERROR.message;
            	errConn += err;
            	
            	return callbackEntities(errConn, null);
            }
            else //err from NERD server
            {
            	return callbackEntities(errMsg.INTERNAL_ERROR, null);
            }
       });
    }

    async.waterfall([ 
        postDocument,
        postAnnotation,
        getEntities
    ], function(err, contents){
        callback(err, contents);
    });
}

exports.annotate = annotate;
