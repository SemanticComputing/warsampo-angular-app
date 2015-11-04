"use strict";
////////////////////////////////
// SELECTOR WIDGET

// Component for selecting value from a SPARQL endpoint using autocompletion
// Eero Hyvönen
// (c) Aalto University, Semantic Computing Research Group
// http://www.seco.tkk.fi/
// 2015-07-30	First version

// Functionalities and usage are explained by comments in code

///////////////////////////////////////////////////////////////////
/// A trick to allow multiline SPARQL QUERIES in most browsers ... 
/// http://stackoverflow.com/questions/805107/creating-multiline-strings-in-javascript/5571069#5571069
	
function hereDoc(f) {
	  return f.toString().
	      replace(/^[^\/]+\/\*!?/, '').
	      replace(/\*\/[^\/]+$/, '');
	}

function emptyValue (value){
	if (value=="" || value==null || value==undefined) { 
		return true; 
		}
	else {
		return false;
	}
}

/////////////////////////
// SELECTOR BUILDER

function initQueryFromSelector(id) {
	var uri = getSelectionUri('selector1');
    if (emptyValue(uri)) 
    	uri = ':actor_940'; // 
    //else 
    //	uri = '<' + uri + '>';
    var label = getSelectionLabel('selector1');
    if (emptyValue(label)) label = 'Jalkaväkirykmentti 37';
	console.log("uri:"+uri);
	if (uri) {
		  	return eventService.getEventById(uri).then(function(e) {
		   	console.log(e);
		       if (e) {
		           //return self.createTimeMapForEvent(e);
		       } else {
		           // $location.url($location.path());
		       }
		
		   });
	}
}

function substituteEvalParts(query, sep) { // Evaluate escaped query parts !expr! -> eval(expr)
	var arr = query.split(sep);
	var len = arr.length;
	// alert(JSON.stringify(arr) + "\nLEN=" + len);
	var i = 1;
	while (len>i) {
		var v = sep + arr[i] + sep;
		var val = eval(arr[i]);
		query=query.replace(v,val); // !expr! -> eval(expr)
		// alert("\n Subst: " + v + ":\t" +val + "\nWhere arr[i] = " + arr[i] + ", i =" + i);
		i=i+2;
	}
	// alert(query);
	//alert("");
	return query;
}

function buildWidgetElement(elem) { // Widget builder, elem is a SELECT element
	//var selection = elem.getAttribute("value");
	(elem || console.log("Null elem in buildWidgetElement: " + elem));
	// console.log(elem);
	var selection = elem.value;
	var initialResults = elem.getAttribute("initialResults");
	if (selection == '' && initialResults) { // Clear selection selected
		elem.innerHTML = initialResults;
		return initialResults ;
	}
    var separator = elem.getAttribute("separator");
    if (emptyValue(separator))
    	separator = "%";  // Default separtor "!"
    
	var title= elem.getAttribute("title");
	if (!emptyValue(title)) {
		title = substituteEvalParts(title,separator);
		elem.getAttribute("title", function(n,v) {return title;});
		title = '<h1>' + title + '</h1>';
	}
	else title = "";
	var sparqlEndpoint = elem.getAttribute("sparql-endpoint");
	var query = elem.getAttribute("query").trim();
	var id = elem.getAttribute("id");
	var pattern = elem.getAttribute("pattern");
	var value = document.getElementById(elem.getAttribute("input")).value; // Input string in the related INPUT element
	query=query.replace(/<INPUT>/g,value);
	query=encodeURIComponent(query);
	// HTML code before and after elements
	var pre = elem.getAttribute("header"); 
	if (emptyValue(pre)) pre = "";
	pre=substituteEvalParts(pre,separator);
	
	var post = elem.getAttribute("footer");
	if (emptyValue(post)) post = "";
	post=substituteEvalParts(post,separator);
	
	var getArg = sparqlEndpoint + "?query=" + query + '&format=json' ;
	$.get(getArg, function(result) {
		// $(this).data('sparqlResult',result); // Save result in the element
		var elem = document.getElementById(id);
		if (result.results!=null) { // Non-empty result
			var bindings = result.results.bindings;
			var vars = result.head.vars;
			var divList = "";
			for (var i = 0; i<bindings.length; i++) {
				var newPattern = pattern;
				var b = bindings[i];
				
				//alert(JSON.stringify(b));
				for (var j = 0; j<vars.length; j++) {
					var v = vars[j];
					var val = null;
					if (b[v]==null) val="";  // Missing value for varible in a binding
					else val = b[v].value;   // var value in binding
					var expr = "\\?" + v; 
					var sv = new RegExp(expr, "g");
					newPattern = newPattern.replace(sv,val); // replace ?var with its value
					}
				newPattern=substituteEvalParts(newPattern, separator);
				var div = '<span class="sparqlWidgetItem">' + newPattern + '</span>';
				divList = divList + div;
				}
			var res = title + pre + divList +post;
			// console.log(elem, res);
			elem.innerHTML = res;
			if (selection == '') 
				elem.setAttribute("initialResults",res); // Cache initial result
			} // If
		else {
			elem.innerHTML = title + '<div class="sparqlWidgetItem">' + "No results" + "</div>";
			}
		 }	
		); // 
}

/////////////////////////
// GENERIC HELP FUNCTIONS

function enoughInput (n, id) { // Tru if input element 'id' contains more than n chars
	//alert(element.attr("value"));
    var str = document.getElementById(id).value;
    if (str.length>=n && str.charAt(0)!='*')
    	return true;
    else return false;
}

/*
function isURI (str) { // Check is srt is a uri
	if (str.indexOf("http://") == -1)  return false;
	else return true;
}
*/

// Functionality of facet widgets

function initKeyActions () {   // Set update action for all input fields; they update related select-elements
    $(".selectorInput").keyup(function(){
    	var value = this.value;
    	if (value.length>=1) {
	   		// OBJECT_STR =  this.value;
	   		this.style.background = "LightGreen";
	   		// $("#objectSelector").each(buildWidget());
	   		var selectorId = this.getAttribute("selector");
	   		buildWidgetElement(document.getElementById(selectorId)); // Update related SELECT component
	   		}
	   	else {
	   		this.style.background = "LightPink";
	   	}
  });
}

function initSelectorWidget (selectorId) {
	// elem = document.getElementById(selectorId);
	var elem = document.getElementById("unitSelector-SELECT");
	// console.log(elem);
	if (elem) {
		buildWidgetElement(elem); // Update related SELECT component
		elem.setAttribute("initialResults",elem.innerHTML);
	}
}

// WIDGET UPDATE LOGIC AFTER A CHANGE

// Change action for each widget

function getSelectedText(elem) { // Return from SELECT text selected
	return elem.options[elem.selectedIndex].text
}

function getElementByAttributeId(elem, attr) { // Retun element given by attribute id value of elem
	return document.getElementById(elem.getAttribute(attr));
}

function updateObjectSelection (elem) { // elem is the SELECT element
  var value = elem.value; 
  var valueElem = getElementByAttributeId(elem,"valueId"); // SPAN for showing value
  if (value=='') { // Clear values selected
	valueElem.innerHTML='';
	getElementByAttributeId(elem,"input").value='';
 	buildWidgetElement(getElementByAttributeId(elem,"selector"));
	}
  else 
	valueElem.innerHTML=getSelectedText(elem);  // Selected value is shown in the value SPAN
}

function replaceAll(find, replace, str) {
		return str.replace(new RegExp(find, 'g'), replace);
	}

///////////////////////////////////////////////////////////////////////////////
// Main functions for using the selector componet.

// The selector is identified by ID
// It selects a URI and corresponding human readable label that can be accessed

// Getters

function getSelectionUri(id){ // SELECT element value (uri) of Widget id
	var elem = document.getElementById(id + "-SELECT-TAG");
	if (!elem) return null;
	// (elem || alert("No SELECT elem found in getSelcotionUri: " +id + "-SELECT-TAG" ))
	var uri = document.getElementById(id + "-SELECT-TAG").value;
	return uri;
}
function getSelectionLabel(id){
	var elem = document.getElementById(id + "-VALUE");
	(elem || alert("Undefined elem in getSelectionLabel(id)"));
	var label = elem.innerHTML;
	return label;
}

// Setters TBA

function setSelectionEndpoint(id,endpoint) {}
function setSelectionQuery(id,query) {}

// Create a selector with a given ID based on a SPARQL endpoint and a query.
// The component layout can be specidied using optional params JSON; cf. "defaults" section
// The component is embedded in HTML by using a DIV: <div id="mySelector"></div>

function createSelector(id,endpoint,query,param) {
	var e = document.getElementById(id);
	
	if (e==null) { 
		console.log("Illegal id for div, skipping widget creation: " + id); 
		return; }
	// Defaults
	if(!param) param = {};
	if(!param['inputSize']) param['inputSize']=26;
	if(!param['selectSize']) param['selectSize']=30;
	if(!param['selectWidth']) param['selectWidth']=190;
	var DEFAULT_QUERY = hereDoc(function() {/*!
	   'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
		PREFIX cidoc: <http://www.cidoc-crm.org/cidoc-crm/>
		PREFIX histo: <http://ldf.fi/history/histo/>
		PREFIX kb: <http://ldf.fi/history/kb/>

		SELECT DISTINCT ?term ?uri 
		WHERE {
		GRAPH <http://ldf.fi/history/kb> {
		?uri a cidoc:E21_Person .
		?uri rdfs:label ?term .
		FILTER (regex(?term, "^<INPUT>.*$", "i"))
		}
		}
		ORDER BY lcase(?term)
		LIMIT 100
		'
	*/});
	endpoint = (endpoint || "http://fuseki2.onki.fi/history/sparql");
	query = (query || DEFAULT_QUERY);
	
	var selectId = id + "-SELECT";
	var selectTagId  = id + "-SELECT-TAG";
	var inputId = id + "-INPUT";
	var valueId = id + "-VALUE";
	/*divPattern = divPattern.replace(/objectSelector/g,selectId);
	divPattern = divPattern.replace(/objectInput/g,inputId);
	divPattern = divPattern.replace(/objectValue/g,valueId);
	*/
	// HTML pattern
	var header = 
       '<select size=' + q(param.selectSize) +' width=' + q(param.selectWidth) + ' id=' + q(selectTagId) + ' selector=' + q(selectId) + 
       ' valueId=' + q(valueId) + ' input=' +q(inputId) +
       ' onchange=updateObjectSelection(this) class="selector">\n' + 
       '<option value="" class="deselect"> Clear selection </option>';
	header = "'" + header + "'";
	//alert(header);
function q(s)	 {return '"' + s + '"';};
var divPattern = 
'<div input=' + q(inputId) + ' selector=' + q(selectId) + ' valueId=' + q(valueId) + '>\n' +
'<b>Selected: </b><span id=' + q(valueId) + '></span><br/>\n' +
'<input id=' + q(inputId) + ' class="selectorInput" selector=' + q(selectId) + 
' type="text" value="" class="textfield" size=' + q(param.inputSize) + '><br/>\n' +
'<div' +
'   class="sparqlWidget" class="SWTightBox" style=""' +
'	id=' + q(selectId) + 
'	input=' + q(inputId) +
'	title=""\n' +
'	header=' + header + '\n' +
'	pattern= "<option value=?uri> ?term </option>"\n' +
'	footer= "</select>"\n' +
'	sparql-endpoint="' + endpoint + '"\n' +
'	separator="%"\n' +
'	query=' +  query + '\n' +
'> Fill in the input field above </div> </div>';

	//alert(divPattern);
	e.innerHTML = divPattern;

	initKeyActions();
	initSelectorWidget(selectId);
	
}

// Clear selector

function clearSelector(id) {
    e = document.getElementById(id);
    if (e) while (e.firstChild) { e.removeChild(e.firstChild); }
}

