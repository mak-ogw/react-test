import { useState } from 'react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import { MidiIo } from './MidiIo.js';
let receiveMidiInput = function(event)
{
  let receivedMessages = event.data;
  if( receivedMessages.length <= 1 ) return;
  console.log(receivedMessages[0]);
};
function SyncStatusArea(isOpen = false){
  const [portOpen] = useState(isOpen);
  return (
    <>
    {
      ( portOpen ) ? <p>Please connect your SEQTRAK via USB cable.</p>
      : <p>SEQTRAK is connected.</p>
    }
    </>
  )
}
function notifyPortNumber(isOpen){
  console.log("changed open status");
  SyncStatusArea(isOpen);
};
new MidiIo( receiveMidiInput, notifyPortNumber );

var noteList = [];
function makeNoteList(data){
  console.log(data);
  if( data.track === undefined ) return;
  if( data.track === null ) return;

  // converting to SEQTRAK reso. (480 ticks/beat)
  let resoCoef = 480 / data.timeDivision;

  var noteOnHash = {};
  let events = data.track[0].event;
  var totalDeltaTime = 0;
  for( var i=0; i<events.length; ++i ){
    let evt = events[i];
    totalDeltaTime += evt.deltaTime;
    if( evt.channel !== 0 ) continue; // ch=0 only
    if( evt.type !== 8 && evt.type !== 9 ) continue; // Note only

    let eventTime = totalDeltaTime * resoCoef;
    let noteNumber = evt.data[0];
    let velocity = evt.data[1];
    switch( evt.type ){
      case 9: // Note On
        if( noteOnHash[noteNumber] === undefined ){ // noteNum is not found, add it simply
          noteOnHash[noteNumber] = [eventTime, velocity];
        }
        else{ // already there is noteOn
          // push
          let startTime = noteOnHash[noteNumber][0];
          let duration = eventTime - startTime - 1; // avoid dup notes
          let note = {};
          note.eventTime = startTime;
          note.noteNumber = noteNumber;
          note.velocity = noteOnHash[noteNumber][1];
          note.duration = duration;
          noteList.push(note);
          // delete from hash
          delete noteOnHash[noteNumber];
          // add to hash
          noteOnHash[noteNumber] = [eventTime, velocity];
        }
        break;
      case 8: // Note Off
        {
          if( noteOnHash[noteNumber] !== undefined ){ // already there is noteOn
            // push
            let startTime = noteOnHash[noteNumber][0];
            let duration = eventTime - startTime;
            let note = {};
            note.eventTime = startTime;
            note.noteNumber = noteNumber;
            note.velocity = noteOnHash[noteNumber][1];
            note.duration = duration;
            noteList.push(note);
            // delete from hash
            delete noteOnHash[noteNumber];
          }
          else{ // noteNum is not found, so ignore noteOff
          }
          break;
        }
      default:
        break;
    }
    // console.log(eventTime, noteNumber, velocity);
  }
  console.log(noteList);
}

let midiParser  = require('midi-parser-js');
function FileDropArea(){
  const onDrop = useCallback((acceptedFiles) => {
    // console.log('acceptedFiles:', acceptedFiles);
    if( acceptedFiles.length !== 1 ){
      setResult(2);
      return;
    }
    setResult(1);
    let file = acceptedFiles[0];
    let reader=new FileReader();
    reader.onload = function(e){
      let rawDataUint8 = new Uint8Array(e.target.result);
      // console.log(rawDataUint8);
      let midiData = midiParser.parse(rawDataUint8);
      makeNoteList(midiData);
    };
    reader.readAsArrayBuffer(file);

}, []);
const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
const [result, setResult] = useState(0);
const [successMessage] = useState("succeeded to get a .MID file.");
return (
  <>
    <div {...getRootProps()} className={isDragActive?"filedroparea-normal":"filedroparea-drag"} >
    <input {...getInputProps()} />
    {
      isDragActive ?
        <p>Drop the .MID file here ...</p> :
        <p>Drag and drop a .MID file here, or click to select a file</p>
    }
    </div>
    <div>
    {
      ( result === 0 ) ?
        <p></p> :
      ( result === 1 ) ?
        <p> {successMessage} </p> :
        <p> Error happend. Please retry it. (Only one file is acceptable.)</p>
    }
    </div>
  </>
);
}

// add:    F0 43 10 7F 1C 0C 70 00 00 ss nn vv dm dl F7
// timing: F0 43 10 7F 1C 0C 70 10 00 ss tt F7    tt = 00(-60) ~ 3C(0) ~ 77(+59)
// remove: F0 43 10 7F 1C 0C 70 20 00 ss F7
function sendSysEx( events, channel=0 ){
  if( channel >= 11 ) return;
  for( var i=0; i<events.length; ++i ){
    var addMsg = [ 0xF0, 0x43, 0x10, 0x7F, 0x1C, 0x0C, 0x70, channel, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xF7 ];
    var timMsg = [ 0xF0, 0x43, 0x10, 0x7F, 0x1C, 0x0C, 0x70, channel, 0x00, 0x00, 0x00, 0xF7 ];
    // ss : addMsg[9]
    addMsg[9] = Math.trunc( ( events[i].eventTime + 60 ) / 120 );
    // nn : addMsg[10]
    addMsg[10] = events[i].noteNumber;
    // vv : addMsg[11]
    addMsg[11] = events[i].velocity;
    // dm : addMsg[12]
    addMsg[12] = Math.trunc(events[i].duration / 128);
    // dl : addMsg[13]
    addMsg[13] = events[i].duration % 128;
    // ss : timMsg[9]
    timMsg[9] = addMsg[9];
    // tt : timMsg[10]
    timMsg[10] = events[i].eventTime - (addMsg[9]*120-60);

    MidiIo.sendMidiMessage(addMsg);
    MidiIo.sendMidiMessage(timMsg);
  }
}

function SendButton(){
  const sendButtonClicked = ()=>{
    if( MidiIo.openOutputPortNumber === -1 ){
      console.log("SEQTRAK is not connected.");
      return;
    }
    if( noteList.length === 0 ){
      console.log("There is no MIDI file.");
      return;
    }
    sendSysEx(noteList, 0);
  };
  return(
    <>
      <button onClick={sendButtonClicked}>Send To SEQTRAK(Track=0)</button>
    </>
  )
}

export default function App() {
  return(
    <>
      <SyncStatusArea />
      <FileDropArea />
      <SendButton />
    </>
  );
}