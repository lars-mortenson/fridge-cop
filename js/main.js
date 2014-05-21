google.load("visualization", "1"); //loads visualization
			
var timer = null;
var receivedStates = [];
var serverDateFormat = 'YYYY-MM-DD HH:mm:ss.SSS Z'
var updateURL = 'http://node.fridge-cop.com/';
var timeline = null;
var currentState = null;

var IMAGE =
	{
		FRIDGE_CLOSED: 0,
		FRIDGE_OPEN: 1,
		FRIDGE_UNKNOWN : 2,
		FAST_POLLING: 3,
		SLOW_POLLING: 4,
		SUCCESS: 5,
		FAILURE: 6
	}

var images = [
		'/images/fridge_closed2.png',
		'/images/fridge_open2.png',
		'/images/fridge_unknown.png',
		'/images/rabbit.png',
		'/images/snail.png',
		'/images/success.png',
		'/images/failure.png'
	]

$(function()
{
	//processState(currentSerializedState);
	preload(images);

	var endPoint = "state_changes";
	var reconnect = false;
	// Instantiate our timeline object.
	timeline = new links.Timeline(document.getElementById('timeline'));
	
	if (document.location.hostname == "localhost")
	{
		endPoint = "dev/" + endPoint;
	}
	
	if (window.io && io) //otherwise we can't connect to our node :(
	{
		var socket = io.connect(updateURL + endPoint);
		socket.on('connect', function()
		{
			if (reconnect) //then we disconnected, get the latest state again and it's party time
			{
				$.get("/current_state").done(function(data)
				{
					new StateData(JSON.parse(data)).apply()
				})
				reconnect = false;
			}
		});
		socket.on('new_states', function (data) 
		{
			processState(JSON.parse(data))
		});
		socket.on('disconnect', function()
		{
			setFridgeStateUnknown();
			reconnect = true;
		});
	}
	
	//setup points
	if (userLoggedIn())
	{	
		displayWhiteBoardPoints();
		var logoutContent = '<span class="accessText">Log Out</span>';
		$("#fridgeWhiteboard").on('mouseenter',  function() { $("#whiteboardLink").html(logoutContent) })
							  .on('mouseleave',  function() { displayWhiteBoardPoints() })
	}
	else
	{
		var loginContent = '<span class="accessText">Log In</span>'; 
		$("#whiteboardLink").html(loginContent); //default blank
	}
	
	attachEvents();	
})

function displayWhiteBoardPoints()
{
	var pointsContent = function() { return '<span class="pointsText">' + fridgePoints + '</span>'};
	$("#whiteboardLink").html(pointsContent())
};

function attachEvents()
{
	var spinner = new GameSpinner("fridgeClickVerifying");

	$("#fridgeClickOverlay").on("click", function()
	{
		if (userLoggedIn() && fridgeIsOpen())
		{
			spinner.setText("Verifying Click...");
			spinner.setImage(IMAGE.FRIDGE_CLOSED);
			spinner.spin();
			spinner.show();
			$.get("/fridge_point_click").done(function(result)
			{
				result = JSON.parse(result)
				if (result.error)
				{
					spinner.setText(result.errorMessage);
					spinner.setImage(IMAGE.FAILURE);
				}
				else
				{
					spinner.setText("+1 FRIDGE POINTS YEAHHHH");
					spinner.setImage(IMAGE.SUCCESS);
					fridgePoints = result.points;
					displayWhiteBoardPoints();
				}
			}).fail(function()
			{
				spinner.setText('Click failed! :(');
				spinner.setImage(IMAGE.FAILURE);
			}).always(function()
			{
				spinner.stop();
			})
		}
	})
	
	$("#statPopupButton").magnificPopup(
	{
		  items:
		  {
			src: "#statsPopup", // can be a HTML string, jQuery object, or CSS selector
			type: 'inline'
		  },
		  callbacks:
		  {
			open : function() 
			{
				redrawTimeline();
			} 
		  }
	})
	
	$(window).resize(function() 
	{
		if (timeline)
		{
			timeline.checkResize();
		}
	})
	
	$("#lastOpenedOverlay").qtip({
		style: 
		{
			classes: 'qtip-bootstrap',
			width: 150, // Overrides width set by CSS (but no max-width!)
		},
		content: 
		{
            text: $("#lastOpenedToolTipText")
        },
		position: 
		{
			my: "center left",
			at: "center right"
		}
	});
}

timelineRequests = {};
var requestIndex = 0;

function redrawTimeline() 
{
	$.each(timelineRequests, function(index, request) 
	{
		request.abort();
	})

	requestIndex++;

	makeRequest(requestIndex);
	
	function makeRequest(requestIndex)
	{
	
		timelineRequests[requestIndex] = 
		$.get("/timeline_states")
		.done(
			function(timelineStates)
			{
				renderTimeline(JSON.parse(timelineStates));
			})
		.always(
			function()
			{
				delete timelineRequests[requestIndex]
			})
	}
	
	function renderTimeline(timelineStates)
	{
		// Create and populate a data table.
		var data = new google.visualization.DataTable();
		data.addColumn('datetime', 'start');
		data.addColumn('datetime', 'end');
		data.addColumn('string', 'content');
		data.addColumn('string', 'type');
		data.addColumn('string', 'group');

		//construct timeline
		
		var lookingForFridgeState = 1;
		
		var statePair = {};

		
		
	//	data.addRow([, state.getChangeTime().toDate(), seconds + "s", "range", "Times"]);
		
		$.each(timelineStates.data, function(index, state)
		{ 
			var state = new StateData(state);
			state.setTimeZone("America/New_York");
			if (state.isFridgeData())
			{
				if (!statePair.startState)
				{
					if (state.getState() == 1)
					{
						statePair.startState = state;
					}
				}
				else //we do have a start state, now we need an end state
				{
					if (state.getState() == 2)
					{
						//add the timeline elements

						var seconds = state.getChangeTime().diff(statePair.startState.getChangeTime(), "seconds");
						var eventText = seconds + " sec"
						if (seconds > 60)
						{
							eventText = parseInt(seconds / 60) + " min"
						}
						else if (seconds == 0)
						{
							eventText = "1 sec";
						}
						
						data.addRow([statePair.startState.getChangeTime().toDate(), , eventText, "box", "Fridge Open"]);
						statePair = {};  //clear out pair
					}
				}
			}
		});
	
		// specify options
		var start = moment(timelineStates.start).tz("America/New_York");
		var end = moment(timelineStates.end).tz("America/New_York");

		var startDay = start.clone().hour(0).minute(0).second(0).millisecond(0)
		var endDay = end.clone().hour(0).minute(0).second(0).millisecond(0)
/*
		var dayIndex = startDay.clone();
		while (endDay.diff(dayIndex) >= 0)
		{
			lunchStart = dayIndex.clone().hour(12);
			lunchEnd = dayIndex.clone().hour(13);
			
			data.addRow([lunchStart.toDate(), lunchEnd.toDate(), "Lunch", "range", "Meals"]);
			dayIndex.add('days', 1);
		}
	*/	
		var options = {
			"style": "box",
			"cluster" : true,
			"stackEvents" : true,
			"showMajorLabels" : false,
			"width" : "auto"
		};
		
		// Draw our timeline with the created data and options
		timeline.draw(data, options);
	}
}

function getImage(imageIndex)
{
	return images[imageIndex];
}

var stateChangeTimer = null

//this function waits the appropriate amount of time for a delayed state change
function processState(state)
{	
	new StateData(state).apply();
}

function preload(arrayOfImages) {
	$("body").append('<div id="imagePreloadArea">');
	$(arrayOfImages).each(function(index, imageLocation){
		$("#imagePreloadArea").append('<img class="preloadedImage" src="' + imageLocation + '"/>');
	});
}

function fridgeIsOpen()
{
	return (currentState == "fridgeStateOpen");
}

function setFridgeStateUnknown()
{
	new StateData({ "s" : 3, "type" : "fridge" }).apply();
}

function userLoggedIn()
{
	return (loggedIn)
}

function GameSpinner(id)
{
	var that = this;
	var spinner = $("#" + id)
	spinner.on("click", function() {
		that.hide();
	});

	init()
	
	//generate 
	function init()
	{
		spinner.addClass("spinContainer gradientBackground")
		spinner.html(
			'<p class="spinText">' +
			'</p>' +
			'<div class="spinImage"></div>'
		)
	}
	
	this.setText = function(text)
	{
		spinner.find(".spinText").text(text);
	}

	this.spin = function()
	{
		spinner.find(".spinImage").addClass("spinning")
	}

	this.stop = function()
	{
		spinner.find(".spinImage").removeClass("spinning")
	}
	
	this.setImage = function(imageURL)
	{
		spinner.find(".spinImage").css("background-image", 'url(' + getImage(imageURL) + ')')
	}
	
	this.show = function()
	{
		spinner.show();
	}
	
	this.hide = function()
	{
		spinner.hide();
	}
	
	this.fadeOut = function()
	{
		spinner.delay(5000).fadeOut({ "duration" : 3000});
	}
}

function StateData(stateData)
{
	var that = this;
	that.stateType = stateData.type;
	that.eventTime = moment(stateData.t, serverDateFormat);
	that.lastState = stateData.ls;
	that.state = stateData.s;
	
	this.setTimeZone = function(zone)
	{
		that.eventTime.tz(zone);
	}
	
	this.isFridgeData = function()
	{
		return (that.stateType == "fridge");
	}
	
	this.getChangeTime = function()
	{
		return that.eventTime;
	}
	
	this.getLastState = function()
	{
		return that.lastState;
	}
	
	this.getState = function()
	{
		return that.state;
	}
	
	this.getType = function()
	{
		return that.stateType;
	}
	
	this.equals = function(b)
	{
		var a = that;
		return ((a.getState() == b.getState()) && (a.getChangeTime().diff(b.getChangeTime()) == 0) && (a.getType() == b.getType()))
	}
	
	this.apply = function()
	{
		var fridgeStates = ["", "fridgeStateOpen", "fridgeStateClosed", "fridgeStateUnknown", "fridgeStateTransition"]
		var stateToApply = that.state;
		if (that.isFridgeData())
		{
			newState = "";
			if (stateToApply > 0 && stateToApply < fridgeStates.length)
			{
				newState = fridgeStates[stateToApply]
			}
			
			if (newState != currentState)
			{			
				$("#fridgeStateContainer").removeClass(currentState).addClass(newState);
				currentState = newState;
				
				updateLastOpenedTime(that.getChangeTime())
			}
		}
		
		function updateLastOpenedTime(lastOpenedDate)
		{
			$("#lastOpenedToolTipText").html("Last opened <br><span class='toolTipTime'>" + lastOpenedDate.format("h:mm:ss A") + "</span>");
			$("#lastOpenedText").text(lastOpenedDate.format("hh:mm")).attr("title", lastOpenedDate.toString());
		}
	}
	
	this.timeDiff = function(otherState)
	{
		return that.getChangeTime().diff(otherState.getChangeTime())
	}
}