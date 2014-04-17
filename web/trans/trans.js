var mapSize = 400;

var transformator = [200,200];
var housesCoords;
var numHouses;
var numDistributions;
//var circleRadius = 100;
$(document).ready(function(){
	$('#clickit').click(function(){
		numHouses = parseInt($('#numHouses').val(),10);
        numDistributions = parseInt($('#numDistributions').val());
		var popSize = parseInt($('#populationSize').val());
		var generations = parseInt($('#numGenerations').val());
		var mutability = ($('#mutabilityPercent').val()%100)/100;
		var popDie = ($('#populationDieOff').val()%100)/100;

    //Generate static houses coordinates.
    housesCoords = Array();
    for(var i = 0; i < numHouses*2;i++){
       housesCoords.push(Math.random()*mapSize);
    }

		console.log(numHouses + " " + popSize + " " + generations + " " + mutability + " " + popDie);
		Environment.configure({'populationSize':popSize,'generations':generations, 'mutability':mutability,'populationDieOff':popDie });
		Environment.Individual.chromosomeLength=numHouses+2*numDistributions;
		Environment.init();
	});
});

function drawMap(generation,av){
	var ctx = document.getElementById('gacanvas');	
	ctx = ctx.getContext('2d');
	ctx.clearRect(0,0,mapSize+220,mapSize);
	ctx.beginPath();
	ctx.rect(0,0,mapSize,mapSize);
	ctx.stroke();
	ctx.fillText(generation,400,20);
    ctx.fillText("AF:"+av,400,40);

    //Draw transformator
  ctx.beginPath();
  ctx.fillStyle = '#FF0000';
  ctx.arc(transformator[0],transformator[1],6,0,2*Math.PI,true);
  ctx.fill();

  //Draw houses on each iteration which stays the same
  for(var i = 0; i < numHouses*2; i+=2){
    var x = housesCoords[i];
    var y = housesCoords[i+1];
    ctx.beginPath();
    ctx.arc(x,y,2,0,2*Math.PI,true);
    ctx.fillStyle = '#000000';
    ctx.fill();
  }

}

function distanceTo(pointA, pointB){
	return Math.sqrt(Math.pow(pointB[0]-pointA[0],2) + Math.pow(pointB[1]-pointA[1],2));
}


Environment.fitnessFunction = function(individual, draw){
    var fitness = 0;

    if (draw){
		var ctx = document.getElementById('gacanvas');
		ctx = ctx.getContext('2d');
	}

    var getHousesConnected = function(distributor){
        var houses = Array();
        for(var i = 0; i < numHouses; i++){
           if(individual.chromosome[i] == distributor){
             houses.push(housesCoords[2*i]);
             houses.push(housesCoords[2*i+1]);
           }
        }
    return houses;
    }
    // iterate over distr nodes
    for(var i = numHouses; i < individual.chromosomeLength; i+=2){
		var x = individual.chromosome[i];
		var y = individual.chromosome[i+1];	
		var distanceToTrans = distanceTo([x,y], transformator);
        if (draw){
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = '#00ff00';
            ctx.lineTo(transformator[0], transformator[1]);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        var housesConn = getHousesConnected((i - numHouses)/2);
        for(var j = 0; j < housesConn.length;j+=2){
            var homeX = housesConn[j];
            var homeY = housesConn[j+1];
            var distanceToHome = distanceTo([x,y],[homeX,homeY]);
            if (draw){
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.strokeStyle = '#00ff00';
                ctx.lineTo(homeX, homeY);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            fitness+= Math.abs(distanceToHome);
        }
		fitness+= Math.abs(distanceToTrans);
		
		if (draw){
			ctx.beginPath();
			ctx.arc(x,y,4,0,2*Math.PI,true);
			ctx.fill();
		}
	}
	return -fitness;
}


//Specify my individual - including chromosome length, mate, and init
Environment.Individual = function(){
        this.fitness = 0;
        this.chromosomeLength = numHouses + (2 * numDistributions);
        this.chromosome = new Array();
        this.mate = function(mutability, mate){
                if (!mate.chromosome){
                        throw "Mate does not have a chromosome";
                }
                var newGuy = new Environment.Individual();

                //two-phase mating: either change houses connection, or exchange distributors coordinates vectors.

                if(Math.random() < 0.5){
                  //crossover only houses connections
                  var slicer = Math.floor(Math.random()*numHouses);
                  newGuy.chromosome = this.chromosome.slice(0, slicer).concat(mate.chromosome.slice(slicer, Math.floor(this.chromosomeLength)));
                } else{
                  //crossover on distributions coords;
                  var slicer = Math.floor(Math.random()*numDistributions)*2 + numHouses;
                  newGuy.chromosome = this.chromosome.slice(0, slicer).concat(mate.chromosome.slice(slicer, Math.floor(this.chromosomeLength)));
                }

                while (Math.random() < mutability){
                        var mutateIndex = Math.floor(Math.random()*this.chromosomeLength); //a random gene will be mutated;
                        if (mutateIndex >= numHouses){
                          newGuy.chromosome[mutateIndex] = Math.random()*mapSize;
                        }else{
                          newGuy.chromosome[mutateIndex] = Math.floor(Math.random()*numDistributions);
                        }

                }
                return newGuy;
        }
        //Environment.Individual.prototype.init = function(){

        //Fill house to distributor edges.
        for (var i = 0; i < numHouses;i++){
          this.chromosome.push(Math.floor(Math.random()*numDistributions));
        }
        //Fill distributor coordinates
        for (var i = numHouses; i < this.chromosomeLength;i++){
                this.chromosome.push(Math.random()*mapSize);
        }

  //console.log(this.chromosome);
        //}
}

Environment.beforeGeneration = function(generation, av) {
	drawMap(generation, av);
}

Environment.afterGeneration = function(generation) {
	Environment.fitnessFunction(Environment.inhabitants[0],true);
	setTimeout("Environment.generation()",10);
};


