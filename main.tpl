<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="width=365, initial-scale=1" >
		<link rel="stylesheet" type="text/css" href="/css/jquery.qtip.min.css"></link>
		<link rel="stylesheet" type="text/css" href="/css/timeline.css"></link>
		<link rel="stylesheet" type="text/css" href="/css/main.css"></link>
		<link rel="stylesheet" type="text/css" href="/css/sprites.css"></link>
		<link rel="stylesheet" type="text/css" href="/css/magnific-popup.css"></link> 
		<title>Fridge Cop</title>
	</head>

	<body>
		<div id="fridgeStateContainer" class="unselectable {{fridge_state}}">
			<div id="lastOpenedTime" class="lastOpenedClockPosition digitalFont"><span id="lastOpenedText">00:00</span></div>
			<div id="lastOpenedOverlay" class="lastOpenedClockPosition"></div><div id="lastOpenedToolTipText" class="hidden"></div>
			
			<div id="fridgeClickOverlay"></div>
			<div id="fridgeWhiteboard" class="whiteboardText"><a href="{{user_url}}" id="whiteboardLink" ></a></div>
			<div id="statPopupButton"></div>
			<div id="fridgeClickVerifying" class="hidden">
			
			</div>
		</div>
		<div id="statsPopup" class="white-popup mfp-hide">
			<div id="timeline"></div>
		</div>

		<script type="text/javascript" src="//www.google.com/jsapi"></script>
		<script type="text/javascript" src="/init.js"></script>
		
		<script type="text/javascript" src="/js/jquery-1.11.1.min.js"></script>
		<script type="text/javascript" src="/js/main.js?v=6"></script>
		<script type="text/javascript" src="/js/json2.min.js"></script>
		<script type="text/javascript" src="/js/moment.min.js"></script>
		<script type="text/javascript" src="/js/moment-timezone.min.js"></script>
		<script type="text/javascript" src="/js/moment-timezone-data.js"></script>
		<script type="text/javascript" src="/js/jquery.qtip.min.js"></script>
		<script type="text/javascript" src="/js/timeline-min.js"></script>
		<script type="text/javascript" src="/js/magnific.js"></script>
		<script src="//node.fridge-cop.com/socket.io/socket.io.js"></script>

	</body>
</html>