class MidiIo
{
	constructor( midiInFunc=null, notifyPortNumber )
	{
		MidiIo.midi = null;
		MidiIo.inputs = [];
		MidiIo.outputs = [];
		MidiIo.midiInHandler = midiInFunc;
		MidiIo.portNumberNotifier = notifyPortNumber;
		MidiIo.openInputPortNumber = -1;
		MidiIo.openOutputPortNumber = -1;
		
		navigator.requestMIDIAccess( { sysex: true } ).then( MidiIo.initSuccess, MidiIo.initFailure );
	}
	
	setInputHandler( midiInFunc )
	{
		MidiIo.midiInHandler = midiInFunc;
	}
	
	static initSuccess( midiAccess ) {
		MidiIo.midi = midiAccess;
		midiAccess.onstatechange = (e)=>{MidiIo.onStateChange(e)};
		MidiIo.openMidiPorts();
	}
	
	static initFailure( msg )
	{
		console.log("Web MIDI API failure!");
	}

	static onStateChange( event )
	{
		// console.log("midi state changed.");
		MidiIo.openMidiPorts();
	}

	static openMidiPorts()
	{
		if (typeof MidiIo.midi.inputs === "function")
			{
				MidiIo.inputs = MidiIo.midi.inputs();
				MidiIo.outputs = MidiIo.midi.outputs();
			}
			else
			{
				MidiIo.inputs = [];
				MidiIo.outputs = [];
				let inputIterator = MidiIo.midi.inputs.values();
				for (let o = inputIterator.next(); !o.done; o = inputIterator.next()) { MidiIo.inputs.push( o.value ) }
				let outputIterator = MidiIo.midi.outputs.values();
				for (let o = outputIterator.next(); !o.done; o = outputIterator.next()) { MidiIo.outputs.push( o.value ) }
			}
			MidiIo.initInputsList();
			MidiIo.initOutputsList();
			MidiIo.portNumberNotifier( MidiIo.openOutputPortNumber !== -1 );
	}
	
	static initInputsList()
	{
		for(let i=0; i<MidiIo.inputs.length; i++) {
			if( MidiIo.inputs[i].name.indexOf('SEQTRAK') > 0 ){
				MidiIo.openInputPortNumber = i;
				MidiIo.inputs[i].onmidimessage = MidiIo.handleMidiInMessage;
				console.log("SEQTRAK input port is opened.");
				return;
			}
		}
		console.log("SEQTRAK input port is NOT opened.");
		MidiIo.openInputPortNumber = -1;
	}
	
	static initOutputsList()
	{
		for(let i=0; i<MidiIo.outputs.length; i++) {
			if( MidiIo.outputs[i].name.indexOf('SEQTRAK') > 0 ){
				MidiIo.openOutputPortNumber = i;
				MidiIo.outputs[i].onmidimessage = MidiIo.handleMidioutMessage;
				console.log("SEQTRAK output port is opened.");
				return;
			}
		}
		console.log("SEQTRAK output port is NOT opened.");
		MidiIo.openOutputPortNumber = -1;
	}
	
	static handleMidiInMessage( event )
	{
		// console.log( "midi in got." );
		if( MidiIo.midiInHandler ) MidiIo.midiInHandler( event );
	}
	
	static sendMidiMessage( message, timestamp=0 )
	{
		// console.log( "midi out send." );
		if( MidiIo.openOutputPortNumber === -1 )
		{
			console.log( "midi out port error. need to select port." );
			return;
		}
		MidiIo.outputs[MidiIo.openOutputPortNumber].send( message, timestamp );
	}
	
	static sendNoteOn( channel, noteNumber, velocity )
	{
		const message = [ 0x90+channel, noteNumber, velocity ];
		// console.log(message);
		MidiIo.sendMidiMessage(message);
	}
	
	static sendNoteOff( channel, noteNumber, velocity = 0 )
	{
		const message = [ 0x80+channel, noteNumber, velocity ];
		// console.log(message);
		MidiIo.sendMidiMessage(message);
	}
	
	sendNoteOnWithDuration( channel, noteNumber, velocity, duration )
	{
		MidiIo.sendNoteOn( channel, noteNumber, velocity );
		// const timer = setTimeout( function(){MidiIo.sendNoteOff(channel,noteNumber);}, duration );
		setTimeout( function(){MidiIo.sendNoteOff(channel,noteNumber);}, duration );
	}
}

export { MidiIo };
