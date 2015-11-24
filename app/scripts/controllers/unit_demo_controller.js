'use strict';

/**
 * @ngdoc function
 * @name eventsApp.controller:MainCtrl
 * @description
 * # SimileMapCtrl
 * Controller of the eventsApp
 */
angular.module('eventsApp')
  .controller('UnitDemoCtrl', function ($routeParams, $location, 
              $anchorScroll, $timeout, $window, $scope, $rootScope, $route,
              eventService, photoService, casualtyService, unitService,
              Settings, timemapService) {

    var self = this;
    self.unitService=unitService;

    // Images related to currently selected event
    self.images = undefined;
    var tm, map, heatmap;

    $rootScope.showHelp = function() {
        self.current = undefined;
    };

    var fetchRelatedPeople = function(item) {
        if (item.participant_id) {
            casualtyService.getCasualtyInfo(item.participant_id).then(function(participants) {
                self.current.related_people = participants;
            });
            fetchActors(item);
        }
    };

    var fetchActors = function(item) {
        var actorTypePrefix = 'http://ldf.fi/warsa/actors/actor_types/';
			
        unitService.getActorInfo(item.participant_id).then(function(participants) {
            self.current.commanders = [];
            self.current.units = [];
            var setActor = function(actor) {
                if (actor.type === actorTypePrefix + 'MilitaryPerson') {
                    self.current.commanders.push(actor);
                } else if (actor.type === actorTypePrefix + 'MilitaryUnit') {
                    self.current.units.push(actor);
                }
            };
            if (_.isArray(participants)) {
                participants.forEach(function(p) {
                    setActor(p);
                });
            } else if (participants) {
                setActor(participants);
            }
        });
    };

// Petri's testings: 
self.testUnitPath=false; 

    var getCasualtyLocations = function() {
			var band = tm.timeline.getBand(1);
			var start = band.getMinVisibleDate();
      	if (self.testUnitPath) start = new Date(winterWarHighlights[0].startDate);
        	var end = band.getMaxVisibleDate();
			var unit='<'+self.current.id+'>';
        	
         return casualtyService.getCasualtyLocationsByTimeAndUnit(start.toISODateString(), end.toISODateString(), unit)
            .then(function(casualties) {
            	var res = [];
               casualties.forEach(function(casualty) {
                    if ('lat' in casualty) res.push(new google.maps.LatLng(parseFloat(casualty.lat), parseFloat(casualty.lon)));
               });
       			if (self.testUnitPath) { averagePath(casualties); } 
               return res;
            });
    };
    
    
    var averagePath = function (casualties) {
		
		var obj={};
		// casualties.sort(function(a, b){return a.death_date>b.death_date ? 1 : -1;});
		
		var coords = [], T=[], X=[], Y=[];
		for (var i=0; i<casualties.length; i++) {
			var c=casualties[i];
			if ('lat' in c && 'date' in c) {
				
				var x=parseFloat(c.lat),
					y=parseFloat(c.lon),
					point= new google.maps.LatLng(x, y);
				coords.push(point);
				X.push(x); Y.push(y);
				T.push(new Date(c.date).getTime());
			}
		}
		
		// console.log(casualties,T,X,Y);
		if (T.length) {
			var pf= new Polyfitter(T,2,false),
				px=pf.solve(X), py=pf.solve(Y);
			
			var tt=pf.linspace(T[0],T[T.length-1],10),
				nx=pf.polyval(px,tt),
				ny=pf.polyval(py,tt);
				
			var coords=[];
			for (var i=0; i<nx.length; i++) {
				coords.push(new google.maps.LatLng(nx[i], ny[i]));
			}
			drawUnitPath(coords);
		}
	}
    
    
    self.unitPath = false;
	 var drawUnitPath = function (coords) {
			if (self.unitPath) { self.unitPath.setMap(null); } 
			if (coords.length) {
				self.unitPath = new google.maps.Polyline({
						    path: coords,
						    geodesic: true,
						    strokeColor: '#0000FF',
						    strokeOpacity: 0.35,
						    strokeWeight: 5
						  });
				self.unitPath.setMap(map);
			}
		}
		
    var getCasualtyCount = function() {
        var band = tm.timeline.getBand(1);
        var start = band.getMinVisibleDate();
        var end = band.getMaxVisibleDate();
        var unit='<'+self.current.id+'>';
        
        self.minVisibleDate = start;
        self.maxVisibleDate = end;
        casualtyService.getCasualtyCountsByTimeGroupAndUnitByType(start.toISODateString(), end.toISODateString(), unit)
        .then(function(counts) {
        	   self.casualtyStats = counts;
            var count = 0;
            counts.forEach(function(type) {
                count += parseInt(type.count);
            });
            self.casualtyCount = count;
         });
    };

    var heatmapListener = function() {
        if (Settings.showCasualtyHeatmap) {
            getCasualtyLocations().then(function(locations) {
                heatmap.setData(locations);
                heatmap.setMap(map);
                
            });
        }
    };

    var clearHeatmap = function() {
        if (tm.timeline.getBand(0)._dragging || tm.timeline.getBand(1)._dragging) {
            heatmap.setMap(null);
        }
    };

    self.updateHeatmap = function() {
        if (Settings.showCasualtyHeatmap) {
            heatmapListener();
        } else {
            heatmap.setMap(null);
        }
    };

    var onMouseUpListener = function() {
        heatmapListener();
        getCasualtyCount();
    };

    var fetchImages = function(item) {
        self.isLoadingImages = true;
        var photoConfig = Settings.getPhotoConfig();
        self.images = [];
        photoService.getRelatedPhotosForEvent(item.opts.event, photoConfig).then(function(imgs) {
            self.images = imgs;
            self.isLoadingImages = false;
        });
    };
    
    var infoWindowCallback = function(item) {
        self.current = item;
        eventService.fetchRelated(item.opts.event);
        fetchImages(item);
    };


    self.createTimeMap = function(id, start, end, highlights) {
			var photoConfig = Settings.getPhotoConfig();
			
        return timemapService.createTimemapByActor(id, start, end, highlights, infoWindowCallback, photoConfig)
        .then(function(timemap) {
            tm = timemap;
            map = timemap.getNativeMap();
            map.setOptions({ zoomControl: true });

            //	control not to ever zoom too close up:
            var zminlistener = google.maps.event.addListener(map, "idle", function() { 
                if (map.getZoom() > 8) map.setZoom(8); 
                if (map.getZoom() < 2) {
                    map.setZoom(5);
                    map.setCenter({lat: 62.0, lng: 25.0 });
                }
                google.maps.event.removeListener(zminlistener); 
            });

            var band = tm.timeline.getBand(1);
            if (!tm.getItems().length) {
					band.setCenterVisibleDate(new Date(winterWarHighlights[0].startDate))
				}
				
            getCasualtyCount();
            timemapService.setOnMouseUpListener(onMouseUpListener);
            band.addOnScrollListener(clearHeatmap);
            tm.timeline.setAutoWidth();
            getCasualtyLocations().then(function(locations) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: locations,
                        radius: 30
                });
                self.updateHeatmap();
            });
        });
    };

    var worldWarHighlight = {
        startDate: "1939-09-01",
        endDate: "1945-09-02",
        color:      "#F2F2F2",
        opacity:    20,
        startLabel: "Toinen maailmansota",
        endLabel:   "",
        cssClass: "band-highlight"
    };

    var winterWarHighlights = [
    {
        startDate: "1939-11-30",
            endDate: "1940-03-13",
            color:      "#94BFFF",
            opacity:    20,
            startLabel: "Talvisota",
            endLabel:   "",
            cssClass: "band-highlight"
    }
    ];

    var winterWarTimeSpan = {
        start: '1939-07-01',
        end: '1940-04-30'
    };

    self.showWinterWar = function(id) {
        return self.createTimeMap(id, winterWarTimeSpan.start, winterWarTimeSpan.end, winterWarHighlights);
    };

    self.createTimeMapForActor = function(id) {
        self.currentUnitId = id;
        return self.showWinterWar(id);
    };

    self.showUnit_OLD_REMOVABLE = function() {
        var uri = getSelectionUri('unitSelector');
        if (!uri) { return initSelector('unitSelector'); /* uri = ':actor_940'; */ }
        self.noReload = true;
        $location.search('uri', uri);
        if (uri) {
            return self.showWinterWar(uri);
        }
    };

    self.showPerson = function() {
        var uri = getSelectionUri('unitSelector');
        if (!uri) { return initSelector('unitSelector'); /* uri = ':actor_940'; */ }
        self.noReload = true;
        $location.search('uri', uri);
        if (uri) {
            return self.showWinterWar(uri);
        }
    };

    this.updateByUri = function(uri) {
        self.isLoadingEvent = true;
        self.isLoadingLinks = false;
        unitService.getById(uri).then(function(unit) {
            if (_.isArray(unit.name)) {
                var arr=unit.name;
                unit.name=arr.shift();
                unit.altNames=arr;
            }
            self.current = unit; 
            self.isLoadingEvent = false;
            unitService.fetchRelated(unit);
            return self.createTimeMapForActor(uri);
        }).catch(function() {
            self.isLoadingEvent = false;
            self.isLoadingLinks = false;
        });
    };

    self.items= []; 
    self.queryregex="";
	 
    this.getItems= function () {
    		var rx = this.queryregex;
    		if (rx.length<1) { rx='^1.*$'; } 
    		else if (rx.length<3) { rx='^'+rx+'.*$'; } 
    		else if (rx.length<6) { rx = '(^|^.* )'+rx+'.*$'; }
    		else { rx = '^.*'+rx+'.*$'; }
    		
    		self.items = [ {id:'#', name:"Etsitään ..."} ];
    		
    		unitService.getItems(rx,this).then(function(data) {
    			/* // try to show units with events with a different color, not implemented though:
				for (var i=0; i<data.length; i++) {
					var item=data[i];
					if (item.e=="0") {
						 item.style="color:#333;";
					} else {
					item.style="color:#00F;"; 
					}
				}
				*/
				if (data.length) {
	            self.items = data; }
   			else {
   				self.items = [ {id:'#', name:"Ei hakutuloksia."} ];
   			}        
        });
    };

    this.getItems();
    
    /*
	 this.updateUnitSelection = function () {
    	 if (this.current) {
            var uri=this.current;
            // this.label = this.current.name;
            if ($location.search().uri != uri) {
                self.noReload = true;
                $location.search('uri', uri);
            }
            this.updateByUri(uri);
        }
    };
    */
    
    this.updateUnit = function () {
    	if (this.current && this.current.id) {
            var uri=this.current.id;
            this.label = this.current.name;
            if ($location.search().uri != uri) {
                self.noReload = true;
                $location.search('uri', uri);
            }
            this.updateByUri(uri);
        }
    };

    // Set listener to prevent reload when it is not desired.
    $scope.$on('$routeUpdate', function() {
        if (!self.noReload) {
            $route.reload();
        } else {
            self.noReload = false;
        }
    });


    if ($routeParams.uri) { 
        self.updateByUri($routeParams.uri); 
    } else { 
        self.current = { name: "Jalkaväkirykmentti 37", id: "http://ldf.fi/warsa/actors/actor_940" };
        self.updateUnit();
    }

function Polyfitter(T,degree,Weight) {
	
	this.A;
	this.AT;
	this.ATA;
	this.Weight=Weight;
	
	this.init = function(T,degree) {
		var N=T.length,
			W= new Array(T);
		
		for (var i=0; i<N; i++) {
			W[i]=this.wandermonde(T[i],degree);
		}
		
		this.A=new Matrix(W);
		if (this.Weight) {
			for (var i=0; i<Weight.length; i++) {
				this.A.multiplyRow(i,Weight[i]);
				// X[i] *= Weight[i];
			}
		}
		
		this.AT=this.A.transpose();
		this.ATA=this.AT.multiply(this.A);
	}
	
	this.solve = function(X) {
		
		if (this.Weight) {
			for (var i=0; i<Weight.length; i++) {
				X[i] *= Weight[i];
			}
		}
		
		var b=new Matrix([X]),
			ATb=this.AT.multiply(b.transpose());
		
		var M=this.ATA.rightConcat(ATb);
		
		M.gaussify();
	
		var resX=[],
			N=M.A.length;
		for (var i=0; i<N; i++) {
			resX.push(M.A[i][N]);
		}
		return resX;
	}
	
	this.wandermonde = function (x,n) {
		var y=1,arr=[y];
		for (var i=1; i<=n; i++) {
			arr.push(y*=x);
		}
		return arr;
	}
	
	this.polyval = function(p,X) {
		if (typeof X=='number') {
			var i=p.length-1, res=p[i];
			while (i>0) {
				res = res*X +p[--i];
			}
			return res;
		} else {
			var arr=new Array(X.length);
			for (var i=0;i<X.length; i++) {
				arr[i]=(this.polyval(p,X[i]));
			}
			return arr;
		}
	}
	
	this.linspace = function(min,max, N) {
		var x=min,
			h=(max-x)/(N-1),
			arr=new Array(N);
		for (var i=0; i<N; i++) {
			arr[i]=x;
			x += h;
		}
		return arr;
	}
	
	this.init(T,degree);
	
}

function Polyfit(T,X,Y,degree,Weight) {
	
	var N=T.length,
		W= new Array(T);
	
	var wandermonde = function (x,n) {
		var y=1,arr=[y];
		for (var i=1; i<=n; i++) {
			arr.push(y*=x);
		}
		return arr;
	}
	
	for (var i=0; i<N; i++) {
		W[i]=wandermonde(T[i],degree);
	}
	
	A=new Matrix(W);
	if (Weight) {
		for (var i=0; i<Weight.length; i++) {
			A.multiplyRow(i,Weight[i]);
			// X[i] *= Weight[i];
		}
	}
	
	var AT=A.transpose(),
		ATA=AT.multiply(A);
	
	var	b=new Matrix([X]),
		ATAb=ATA.multiply(b.transpose());
	
	var Ab=A.rightConcat(b);
	
	Ab.gaussify();
	
	var resX=[];
	N=AX.A.length;
	for (var i=0; i<N; i++) {
		resX.push(AX.A[i][N]);
	}
	return {px:resX};
	
}

function Matrix(data) {
	
	this.A=data;
	
	this.matrixInverse3 = function() {
		var A=this.A;
		//  subdeterminants:
		var d0 = A[1][1]*A[2][2]-A[1][2]*A[2][1],
		d1 = A[1][0]*A[2][2]-A[1][2]*A[2][0],
		d2 = A[1][0]*A[2][1]-A[1][1]*A[2][0],
		
		d3 = A[0][1]*A[2][2]-A[0][2]*A[2][1],
		d4 = A[0][0]*A[2][2]-A[0][2]*A[2][0],
		d5 = A[0][0]*A[2][1]-A[0][1]*A[2][0],
		
		d6 = A[0][1]*A[1][2]-A[0][2]*A[1][1],
		d7 = A[0][0]*A[1][2]-A[0][2]*A[1][0],
		d8 = A[0][0]*A[1][1]-A[0][1]*A[1][0];
		
		// det(A) and 1/det(A):
		var det = A[0][0]*d0 - A[0][1]*d1 + A[0][2]*d2,
		id = 1.0/det;
		
		//  inverse matrix:
		return [[d0*id, -d3*id, d6*id],
				[-d1*id, d4*id, -d7*id],
				[d2*id, -d5*id, d8*id]];
	}
	
	this.multiply = function(M2) {
		var A=this.A, B=M2.A,
			w=B[0].length,
			h=A.length,
			C=[];
		for (var y=0;y<h;y++) {
			var row=A[y], arr=[];
			for (var x=0; x<w; x++) {
				var res=0;
				for (var k=0; k<row.length; k++) {
					res += row[k]*B[k][x];
				}
				arr.push(res);
			}
			C.push(arr);
		}
		return new Matrix(C);
	}
	
	this.transpose = function () {
		var B=[];
		for (var x=0; x<this.A[0].length; x++) {
			var row=[];
			for (var y=0; y<this.A.length; y++) {
				row.push(this.A[y][x]);
			}
			B.push(row);
		}
		return new Matrix(B);
	}
	
	this.toString = function () {
		var res="";
		for (var y=0; y<this.A.length; y++) { res += this.A[y].join('\t') +"\n"; }
		//res=this.A.join('\n');
		return res;
	};
	
	this.multiplyRow = function(y, k) {
		var row=this.A[y];
		for (var x=0; x<row.length; x++) {
			row[x] *= k;
		}
	};
	
	this.gaussify = function () {
		var h=this.A.length,
			w=this.A[0].length,
			check=[], order=[];
		for (var i=0; i<h; i++) { check.push(false); }
		for (var col=0; col<w-1; col++) {
			// first largest row by absolute value
			var crow=0, cval = -0.01;
			for (row=0; row<h; row++) {
				if (!check[row]) {
					var val2=this.A[row][col];
					if (val2<-cval) {
						crow=row; cval=-val2;
					} else if(val2>cval) {
						crow=row; cval=val2;
					}
				}
			}
			check[crow] = true;
			var f=1.0/this.A[crow][col];
			order.push(crow);
			
			for (var y=0; y<h; y++) {
				if (!check[y]) {
					var f2=this.A[y][col]*f;
					for (var x=0; x<w; x++) {
						this.A[y][x] -= f2*this.A[crow][x];
					}
				}
			}
			for (var x=0; x<w; x++) {
				this.A[crow][x] *= f;
			}
			
			
		}
		
		for (var i=order.length-1; i>-1; i--) {
			var crow=order[i];
			for (var j=i-1; j>-1; j--) {
				var row=order[j];
				var f=this.A[row][i];
				for (var x=i; x<w; x++) {
					this.A[row][x] -= f*this.A[crow][x];
				}
			}
			// console.log(this.toString());
		}
		
		var B=new Array(h);
		for (var i=0; i<order.length; i++) {
			B[i]=this.A[order[i]];
		}
		this.A=B;
		// console.log(this.toString());
	}
	
	this.rightConcat = function(M2) {
		var B=[];
		for (var y=0; y<this.A.length; y++) {
			B.push(this.A[y].concat(M2.A[y]));
		}
		return new Matrix(B);
	}
}

});
