var mapSize = 400;

var transformator = [200,200];
var housesCoords;
var numHouses;
var numDistributions;
//var circleRadius = 100;
$(document).ready(function(){
	$('#clickit').click(function(){
		numHouses = $('#numHouses').val();
    numDistributions = $('#numDistributions').val();
		var popSize = $('#populationSize').val();
		var generations = $('#numGenerations').val();
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

function drawMap(generation){
	var ctx = document.getElementById('gacanvas');	
	ctx = ctx.getContext('2d');
	ctx.clearRect(0,0,mapSize+50,mapSize);
	ctx.beginPath();
	ctx.rect(0,0,mapSize,mapSize);
	ctx.stroke();
	ctx.fillText(generation,400,20);

  //Draw transformator
  ctx.beginPath();
  ctx.arc(transformator[0],transformator[1],10,0,2*Math.PI,true);
  ctx.fill();

  //Draw houses on each iteration which stays the same
  for(var i = 0; i < numHouses*2;i++){
    var x = housesCoords[i];
    var y = housesCoords[i+1];
    ctx.beginPath();
    ctx.arc(x,y,3,0,2*Math.PI,true);
    ctx.fill();
  }

}

function distanceTo(pointA, pointB){
	return Math.sqrt(Math.pow(pointB[0]-pointA[0],2) + Math.pow(pointB[1]-pointA[1],2));
}


Environment.fitnessFunction = function(individual, draw){
	fitness = 0;	
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
	for(var i = numHouses; i < individual.chromosomeLength; i+=2){
		var x = individual.chromosome[i];
		var y = individual.chromosome[i+1];	
		var distanceToTrans = distanceTo([x,y], transformator);
    var housesConn = getHousesConnected(i - numHouses);
    for(var j = 0; j < housesConn.length;j+=2){
        var homeX = housesConn[i];
        var homeY = housesConn[i+1];
        var distanceToHome = distanceTo([x,y],[homeX,homeY]);
        fitness+= Math.abs(distanceToHome);
    }
		fitness+= Math.abs(distanceToTrans);
		
		if (draw){
			ctx.beginPath();
			ctx.arc(x,y,1,0,2*Math.PI,true);
			ctx.stroke();
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
                newGuy.chromosome = this.chromosome.slice(0,Math.floor(this.chromosomeLength)).concat(mate.chromosome.slice(Math.floor(this.chromosomeLength)));

                while (Math.random() < mutability){
                        var mutateIndex = Math.floor(Math.random()*this.chromosomeLength); //a random gene will be mutated;                     
                        newGuy.chromosome[mutateIndex] = Math.random()*mapSize;

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

Environment.beforeGeneration = function(generation) {
	drawMap(generation);
}

Environment.afterGeneration = function(generation) {
	Environment.fitnessFunction(Environment.inhabitants[0],true);
	setTimeout("Environment.generation()",100);
};


