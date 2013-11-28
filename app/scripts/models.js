define(['backbone', 'underscore'], function(){
	var Models = {};
	
    Models.Location = Backbone.Model.extend({
        
    });
    
    Models.Isolate = Backbone.Model.extend({
        
    });
    
	Models.LocationLink = Backbone.Model.extend({
		
	});
	
	Models.BioLink = Backbone.Model.extend({
		
	});
	
	Models.Patient = Backbone.Model.extend({
		idAttribute : 'patient_id'
	});
	
	Models.PatientCollection = Backbone.Collection.extend({
		model : Models.Patient,
		url : '/api/risk_patients'
	});
	
	Models.LocationLinkCollection = Backbone.Collection.extend({
		model: Models.LocationLink,
		url : '/api/overlaps'
	});
	
	Models.BioLinkCollection = Backbone.Collection.extend({
		model: Models.BioLink,
		url : '/api/antibiogram'
	});
	
    Models.LocationCollection = Backbone.Collection.extend({
        model : Models.Location,
        url : '/api/locations'
    });
    
    Models.IsolateCollection = Backbone.Collection.extend({
        model : Models.Isolate,
        url : '/api/isolates'
    });
    
	return Models;
});