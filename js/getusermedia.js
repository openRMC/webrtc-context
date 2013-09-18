var openrmc = openrmc || {} ;
openrmc.webrtc = openrmc.webrtc || {} ;

openrmc.webrtc.Errors = {
		NOT_SUPPORTED : 'NOT_SUPPORTED', // WebRTC not supported by browser
		CONSTRAINTS_REQUIRED : 'CONSTRAINTS_REQUIRED', // Audio and/or video must be requested
		AUDIO_NOT_AVAILABLE : 'AUDIO_NOT_AVAILABLE',
		VIDEO_NOT_AVAILABLE : 'VIDEO_NOT_AVAILABLE',
		AV_NOT_AVAILABLE : 'AV_NOT_AVAILABLE',
		PERMISSION_DENIED : 'PERMISSION_DENIED',
		CONSTRAINT_NOT_SATISFIED : 'CONSTRAINT_NOT_SATISFIED',
	} ;

openrmc.webrtc.error = openrmc.webrtc.error || {} ;
(function(ns) {
	
	if(webrtcDetectedBrowser==='chrome') {
		ns.getError= function(err, spec) {
			// Take account of varying forms of this error across Chrome versions
			if(err.name==='PERMISSION_DENIED' || err.PERMISSION_DENIED===1 || err.code===1) {
				if(spec.audio && spec.video) {
					return openrmc.webrtc.Errors.AV_NOT_AVAILABLE ;
				}
				else {
					if(spec.audio && !spec.video) {
						return openrmc.webrtc.Errors.AUDIO_NOT_AVAILABLE ;
					}
					else {
						return openrmc.webrtc.Errors.VIDEO_NOT_AVAILABLE ;
					}
				}
			}
		} ; 
	}
	else if(webrtcDetectedBrowser==='firefox') {
		ns.getError = function(err, spec) {
			if(err==='NO_DEVICES_FOUND' || err==='HARDWARE_UNAVAILABLE') {
				if(spec.audio && spec.video) {
					return openrmc.webrtc.Errors.AV_NOT_AVAILABLE ;
				}
				else {
					if(spec.audio && !spec.video) {
						return openrmc.webrtc.Errors.AUDIO_NOT_AVAILABLE ;
					}
					else {
						return openrmc.webrtc.Errors.VIDEO_NOT_AVAILABLE ;
					}
				}
			}
		} ;
	}
	else {
		ns.getError = function() {
			console.log('No error handler set for '  + webrtcDetectedBrowser) ;
			return openrmc.webrtc.Errors.NOT_SUPPORTED ;
		} ;
	}
}(openrmc.webrtc.error)) ;

openrmc.webrtc.Context = function(spec) {
	var that = {};

	that.getLocalStream = function() {
		return spec.localStream ;
	};
	
	that.isrtcavailable = function(){
		return spec.localStream !== undefined ;
	} ;
	
	var aavail = (spec.localStream && 
		spec.localStream.getAudioTracks() &&
		spec.localStream.getAudioTracks().length>0) || false ;
	
	that.isrtcaudioavailable = function() {
		return aavail ;
	} ;
	
	var vavail = (spec.localStream && 
			spec.localStream.getVideoTracks() &&
			spec.localStream.getVideoTracks().length>0) || false ;
	
	that.isrtcvideoavailable = function() {
		return vavail ;
	} ; 
	
	var messages = [] ;
	
	if(spec.error) {
		messages.push(spec.error.message) ;
	}
	
	that.getMessages = function() {
		return messages ;
	} ;
	
	that.getError = function() {
		return spec.error ;
	};
	
	return that ;
} ;

openrmc.webrtc.api = {};
(function(ns) {
	ns.getUserMedia = function(spec) {
		if(webrtcDetectedBrowser===null) {
			console.log("[RTCInit] : Browser does not appear to be WebRTC-capable");
			var cxt=openrmc.webrtc.Context({
				error : openrmc.webrtc.Errors.NOT_SUPPORTED
			});
			spec.failure && spec.failure(cxt) ;
			return ;
		}
		// Request audio by default
		if(spec.audio===undefined) spec.audio=true ;
		
		//
		// At least one of audio or video must be requested
		//
		if(!(spec.audio || spec.video)) {
			spec.failure && spec.failure(openrmc.webrtc.Context({
				error : openrmc.webrtc.Errors.CONSTRAINTS_REQUIRED
			})) ;
			return ;
		}
		
		// Navigator.getUserMedia()
		getUserMedia({
				audio: spec.audio,   
				video: spec.video || false
			}, 
			function(stream) {
				spec.success && spec.success(openrmc.webrtc.Context({
					localStream : stream
				})) ;
			}, 
			function(err) {
				var error = openrmc.webrtc.error.getError(err, spec) ;
				console.log("[mediaFailure] : " + error) ;
				spec.failure && spec.failure(openrmc.webrtc.Context({
					error : error
				})) ;
			}) ;
		
	} ;
	/*
	{
		}
		//
		// Make a call to getUserMedia to make sure we can get a stream 
		//
		
		// Request audio by default
		if(spec.audio===undefined) spec.audio=true ;
		
		//
		// At least one of audio or video must be requested
		//
		if(!(spec.audio || spec.video)) {
			ns.baseContext = new openrmc.webrtc.Context({
				error : openrmc.webrtc.Errors.CONSTRAINTS_REQUIRED
			}) ;
			spec.failure && spec.failure(ns.baseContext) ;
			return ;
		}
		
		getMedia({
				audio: spec.audio,   
				video: spec.video || false
			}, 
			function(stream) {
				ns.baseContext = new openrmc.webrtc.Context({
					localStream : stream
				});
				spec.success && spec.success(ns.baseContext) ;
			}, 
			function(err) {
				var msg="getUserMedia() failed : code=" + err.code + (err.message?" " + err.message:"") ;
				// Is it permission denied?
				var error = undefined ;
				if(err.code===1) {
					if(spec.audio && spec.video) {
						error = openrmc.webrtc.Errors.AV_NOT_AVAILABLE ;
					}
					else {
						if(spec.audio && !spec.video) {
							error = openrmc.webrtc.Errors.AUDIO_NOT_AVAILABLE ;
						}
						else {
							error = openrmc.webrtc.Errors.VIDEO_NOT_AVAILABLE ;
						}
					}
				}
				log.error("[mediaFailure] : " + msg) ;
				ns.baseContext = new openrmc.webrtc.Context({
					error : error
				}) ;
				spec.failure && spec.failure(ns.baseContext) ;
			}) ;
	};
	
	
	ns.getUserMedia = function(spec) {
		if(RTCSupportStatus!=0) {
			log.warn("[getUserMedia] : Browser does not appear to be WebRTC-capable");
			spec.failure && spec.failure(ns.baseContext) ;
			return ;
		}
		
		//
		// At least one of audio or video must be requested
		//
		if(!(spec.audio || spec.video)) {
			spec.failure && spec.failure(new openrmc.webrtc.Context({
							error : openrmc.webrtc.Errors.CONSTRAINTS_REQUIRED
						})) ;
		}
		
		
		// Default to audio=true, video=false
		if(spec.audio === undefined) {
			spec.audio = true ;
		}
		if(spec.video === undefined) {
			spec.video = false ;
		}
		
		var err = undefined ;
		if((spec.audio && !ns.baseContext.isrtcaudioavailable()) && (spec.video && !ns.baseContext.isrtcvideoavailable)) {
			err = openrmc.webrtc.Errors.AV_NOT_AVAILABLE ;
		}
		else if(spec.audio && !ns.baseContext.isrtcaudioavailable()) {
			err = openrmc.webrtc.Errors.AUDIO_NOT_AVAILABLE ;
		}
		else if(spec.video && !ns.baseContext.isrtcvideoavailable()) {
			err = openrmc.webrtc.Errors.VIDEO_NOT_AVAILABLE ;
		}
		if(err) {
			spec.failure && spec.failure(openrmc.webrtc.Context({ error : err})) ; 
			return ;
		}
		spec.success && spec.success(openrmc.webrtc.Context({
					localStream : ns.baseContext.getLocalStream()
				})) ;
	};
	
	ns.createOffer = function(options) {
		// Create an RTCPeerConnection object
		var pc = createPeerConnection(options) ;
	
		pc.createOffer(onOfferCreated, onPeerConnectionFailure, buildOfferConstraints()) ;

		function onOfferCreated(sessionDescription) {
			// TODO : Look at adding Opus
			pc.setLocalDescription(sessionDescription) ;
			log.trace('SD (offer) = ' + ns.formatSDP(sessionDescription.sdp)) ;
			var offer = {
					callParty : {
						name : options.userContext.name ,
						number : options.userContext.number
					},
					sessionDescription : JSON.stringify(sessionDescription) 
			};
			options.onoffercreated(offer) ;
		}

		function onPeerConnectionFailure(err) {
			log.error("[offer::onPeerConnectionFailure] : " + err) ;
			if(options.failure) {
				options.failure("Offer creation failure : " + err) ;
			}
		}
		
		return pc ;
	} ;
	
	ns.createAnswer = function(options) {
		// Create an RTCPeerConnection object
		var pc = createPeerConnection(options) ;
		var sd = JSON.parse(options.offer.body.sessionDescription) ;
		log.trace("SD (recv offer) = " + ns.formatSDP(sd.sdp)) ;
		pc.setRemoteDescription(new RTCSessionDescription(sd)) ;
		pc.createAnswer(onAnswerCreated, onPeerConnectionFailure, buildOfferConstraints()) ;

		function onAnswerCreated(sessionDescription) {
			// TODO : Look at adding Opus
			pc.setLocalDescription(sessionDescription) ;
			log.trace("SD (answer) = " + ns.formatSDP(sessionDescription.sdp)) ;
			var ans= {
					callParty : {
						name : options.userContext.name ,
						number : options.userContext.number
					},
					sessionDescription : JSON.stringify(sessionDescription) 
			};
			options.onanswercreated && options.onanswercreated(ans) ; 
		}

		function onPeerConnectionFailure(err) {
			log.error("[answer::onPeerConnectionFailure] : " + err) ;
			if(options.failure) {
				options.failure("Offer creation failure : " + err) ;
			}
		}
		
		return pc ;
	};
	
	
	function getIceServers() {
		//
		// Firefox currently only supports IP addresses for TURN/STUN
		// Ref: http://www.webrtc.org/interop
		//
		return webrtcDetectedBrowser==="firefox"?
				"stun:23.21.150.121":
				"stun:stun.l.google.com:19302" ;
	}

	function createPeerConnection(options) {
		if(!RTCPeerConnection) {
			log.error("[createPeerConnection] : Peer connection not supported") ;
			return undefined ;
		}
		
		if(options.audio === undefined) {
			options.audio=true ;
		}
		if(options.video === undefined) {
			options.video=false;
		}
		
		var config={
				"iceServers": [{ "url": getIceServers() }]
		};
		//
		// For Chrome-Firefox interop, this may need to be 'mandatory' 
		// as Firefox at the moment only supports DTLS-SRTP
		// Ref: http://www.webrtc.org/interop
		//
		var constraints={
				"optional": [{"DtlsSrtpKeyAgreement": true}]
		} ;

		
		try {
			var pc = new RTCPeerConnection(config, constraints) ;
			pc.onicecandidate = options.onicecandidate;
			pc.onaddstream = options.onremotestreamadded ;
			pc.onremovestream = options.onremotestreamremoved ;
			if(options.stream) {
				pc.addStream(CreateMediaStream(options.stream, options.audio, options.video)) ;
			} 
			else {
				log.error('[createPeerConnection] - No media stream') ;
			}
		    log.trace("Created RTCPeerConnnection with:\n" + 
	              "  config: \"" + JSON.stringify(config) + "\";\n" + 
	              "  constraints: \"" + JSON.stringify(constraints) + "\".");
		    return pc ;
		}
		catch(e) {
			log.error("[createPeerConnection] : ERROR - Failed to create PeerConnection, exception=" + e.message) ;
			return undefined ;
		}
	}

	ns.formatSDP = function(sdp) {
		var lines = sdp.split('\r\n') ;
		var fsdp="{\n" ;
		for(var i=0;i<lines.length;++i) {
			fsdp += "\t" + lines[i] + "\n" ;
		}
		return fsdp + "}" ;
	};
	
	ns.isrtcavailable = function() {
		return (ns.baseContext && ns.baseContext.isrtcavailable()) || false ;
	} ;

	ns.isrtcaudioavailable = function() {
		return (ns.baseContext && ns.baseContext.isrtcaudioavailable()) || false ;
	} ;

	ns.isrtcvideoavailable = function() {
		return (ns.baseContext && ns.baseContext.isrtcvideoavailable()) || false ;
	} ;

	function buildOfferConstraints() {
		var constraints = {
				"optional": [],
				"mandatory": {
					'OfferToReceiveAudio':true, 
	                'OfferToReceiveVideo':false
				}
			} ;
		if("firefox" === webrtcDetectedBrowser) {
			// Disable data channel - confuses Chrome 
			// Ref: http://www.webrtc.org/interop
			constraints.mandatory.MozDontOfferDataChannel = true ;
		}
		return constraints ;
	}
*/
	
}(openrmc.webrtc.api)); 