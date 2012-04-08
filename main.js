"use strict";
(function(){
    "use strict";
    var DOUBLE_QUOTE = '"';
    
    String.prototype.unquote = function(){
        if(this[0] === DOUBLE_QUOTE && this[this.length-1] === DOUBLE_QUOTE){
            return this.substring(1, this.length-1);
        }
        if(this[0] !== DOUBLE_QUOTE && this[this.length-1] !== DOUBLE_QUOTE){
            return this;
        }
        
        console.warn("unhandled case", this);
    };

})();


var mapSVGP = $.get('./Images/MAP/map.svg');

var pathPerCommuneDefer = new $.Deferred();
var pathPerCommuneP = pathPerCommuneDefer.promise();

var canvas;

$(function(){
    console.log('yo');
    
    canvas = Raphael(document.getElementById('map'), 567, 550);

    mapSVGP.then(function(mapSVG){
        var pathPerCommune = {
            
            communeCoodinates : function(commune){
                if(! commune in this)
                    throw "no commune like "+commune;
                    
                var pathBBox = this[commune].getBBox();
                var x = pathBBox.x + pathBBox.width/2,
                    y = pathBBox.y + pathBBox.height/2;
                
                switch(commune){
                    case 'Bordeaux':
                        x+=10;
                        y+=20;
                        break;
                    case 'Pessac':
                        x+=10;
                        y-=15;
                        break;
                }
                
                return {x:x, y:y};
            }
            
        };
        
        
        
        //console.log('map', mapSVG);
        var svgEl = $(mapSVG).find('svg');
        svgEl.find('g').each(function(i, e){
            var uniqueChild = $(e).children()[0]; // that's an assumption that is true in our case.
            var path;
            var commune = $(e).attr('data-commune');

            path = $(uniqueChild).attr('d'); // path
            
            if(!path)
                throw 'problem: no path';
            
            var pathObj = canvas.path(path);
            pathObj.attr({fill: "#AAA", "stroke-width": 0, opacity: 0.8});
            
            if(commune){
                var text = commune;
                pathPerCommune[commune] = pathObj;
                
                if(commune === 'Bordeaux'){                
                    var coords = pathPerCommune.communeCoodinates(commune);
                
                    // so that text is on top
                    setTimeout(function(){
                        canvas.text(coords.x, coords.y, text)
                              .attr({'font-size': 13});
                    }, 0);
                }
            }
            
        });
        
        pathPerCommuneDefer.resolve(pathPerCommune);
        
    });
    mapSVGP.fail(function(err){
        console.log('fail', err);
    });
    
});

var dataDefer = new $.Deferred(),
    dataP = dataDefer.promise();

// DATA
(function(){
    var data = Object.create(null); // TODO shim (+forEach, + map)
    
    $.ajax({
        url: './Data/EndettementParHabitant.csv',
        dataType: "text"
    }).then(function(csvData){
        //console.log('CSV retrieved');
        
        // parsing CSV
        var lines = csvData.split('\n');
        lines.forEach(function(l, i){
            lines[i] = lines[i].split(';');

            // removing freaking quote
            lines[i].forEach(function(e, j){
                lines[i][j] = e.unquote() || lines[i][j];
            });
        });
        
        var firstLine = lines.shift();
        //console.log("firstLine", firstLine);
        
        var dataArray = lines.map(function(l){
            var d = {};
            var commune;
            
            l.forEach(function(val, i){
                var key = firstLine[i];
                
                switch(key){
                    case "commune":
                        commune = val;
                        break;
                    default:
                        val = parseInt(val);
                        break;
                }
            
                d[key] = val;
            });
            
            if(commune.trim() !== '')
                data[commune] = d;
        });

        dataDefer.resolve(data);
            
        //console.log(data);
    });

})();





var bulleDataDefer = new $.Deferred(),
    bulleDataP = bulleDataDefer.promise();

// DATA
(function(){
    var data = Object.create(null); // TODO shim (+forEach, + map)
    
    $.ajax({
        url: './Data/données bulles.csv',
        dataType: "text"
    }).then(function(csvData){
        console.log('CSV retrieved');
        
        // parsing CSV
        var lines = csvData.split('\n');
        lines.forEach(function(l, i){
            lines[i] = lines[i].split(';');

            // removing freaking quote
            lines[i].forEach(function(e, j){
                lines[i][j] = e.unquote() || lines[i][j];
            });
        });
        
        var firstLine = lines.shift();
        //console.log("firstLine", firstLine);
        
        var dataArray = lines.map(function(l){
            var d = {};
            var commune;
            
            l.forEach(function(val, i){
                var key = firstLine[i];
                
                switch(key){
                    case "commune":
                        commune = val;
                        break;
                    case "Parti maire":
                        // nothing, kee it as text
                        break;
                    default:
                        val = parseInt(val);
                        break;
                }
            
                d[key] = val;
            });
            
            if(commune.trim() !== '')
                data[commune] = d;
        });

        bulleDataDefer.resolve(data);
            
        console.log(data);
    });

})();




$.when(dataP, bulleDataP, pathPerCommuneP).then(function(data, bulleData, pathPerCommune){
    
    var textElements = Object.create(null);
    var bulleContents = Object.create(null);
    
    Object.keys(data).forEach(function(commune){
    
        function createInfoPiece(imgsrc, t1, t2){
            var infoPiece = document.createElement('div');
            $(infoPiece).addClass('infoPiece');
            
            var img = document.createElement('img');
            img.src = imgsrc;
            
            var texts = document.createElement('div');
            $(texts).addClass('texts');
            
            var text1 = document.createElement('div');
            $(text1).text(t1).addClass('value');
            var text2 = document.createElement('div');
            $(text2).text(t2).addClass('desc');
        
            $(texts).append(text1).append(text2);
            
            
            $(infoPiece).append(img).append(texts);
            return infoPiece;
        }
    
        if(!(commune in pathPerCommune)){
            console.error('no path for', commune);
        }
        else{            
            var dette2010 = data[commune][2010];
            var coords = pathPerCommune.communeCoodinates(commune);
            setTimeout(function(){
                textElements[commune] = canvas.text(coords.x, coords.y, commune)
                                              .attr({'font-size': 13})
                                              .hide();
            }, 0);
            
            canvas.circle(coords.x, coords.y, Math.sqrt(dette2010/2)+5 )
                  .attr({fill:'purple', "stroke-width": 0, opacity: 0.5})
                  .hover(function hoverin(){
                        textElements[commune].show();
                        $('#info').empty().append(bulleContents[commune]);
                        
                   },function hoverout(){
                        textElements[commune].hide();
                   }
                  );
                  
            var infoCommune = document.createElement('div');
            $(infoCommune).addClass('info-commune');
            bulleContents[commune] = infoCommune;
            
            // bonhommes
            var bonhommesContainer = document.createElement('div');
            var bonhommes = document.createElement('div');
            $(bonhommes).addClass('bonhommes');
            for(var i=1 ; i<=10 ; i++){
                var b = document.createElement('div')
                b.className = (bulleData[commune]['Bonhomme'] === i ? 'bb' : 'b') + i;
                bonhommes.appendChild(b);
            }
            
            $(bonhommesContainer).append(bonhommes)

            // commune
            var c = document.createElement('div');
            $(c).addClass('commune').text(commune);
            

            // réponses communes
            var response = document.createElement('div');
            
            var title = document.createElement('h1');
            $(title).text("Principaux investissements financés par des emprunts en 2010");
            
            var responseText = $("#reponses-communes ."+commune.replace(' ', '_')).text();
            
            $(response).append(title).append(responseText);
            

            // infos
            var endettementGlobal = createInfoPiece(
                './Images/Picto/Coins.png', 
                bulleData[commune]['Endettement global en 2010'] + ' €', 
                "Endettement global au 31/12/2010"
            );
            
            var endettementParHabitant = createInfoPiece(
                './Images/Picto/Dette.png', 
                bulleData[commune]['Endettement par habitant en 2010'] + ' €', 
                "Endettement par habitant au 31/12/2010"
            );

            var habitants = createInfoPiece(
                './Images/Picto/Habitant.png', 
                bulleData[commune]["Nombre d'habitants en 2010"], 
                "Nombre d'habitants en 2010"
            );
            
            var partyColor = bulleData[commune]["Parti maire"];
            var etiquetteSrc = partyColor === 'Divers droite' ? 'UMP' : partyColor;
            
            var maire = createInfoPiece(
                './Images/Etiquettes/'+etiquetteSrc+'.png', 
                partyColor, 
                "Etiquette politique du maire"
            );
            
            
            
            
            $(infoCommune)
                .append(c)
                .append(bonhommesContainer)
                .append(endettementGlobal)
                .append(endettementParHabitant)
                .append(habitants)
                .append(maire)
                .append(response);

        }
    });
});
