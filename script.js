try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}
const ky='rj,LWNFCf6VaKrh`gpst8nxS2AkajEIX8LMKdlj`JmMiBB6tNA4'
// Encode
function btoa(str){
  let encodedStr = '';

  for (let i = 0; i < str.length; i++){
    let charCode = str.charCodeAt(i);
    let encodedChar = String.fromCharCode(charCode + 1);
    encodedStr += encodedChar;
  }

  return encodedStr;
}

// Decode
function atob(str){
  let decodedStr = '';

  for (let i = 0; i < str.length; i++){
    let charCode = str.charCodeAt(i);
    let decodedChar = String.fromCharCode(charCode - 1);
    decodedStr += decodedChar;
  }

  return decodedStr;
}


var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);

const getNewHTML=async (value)=>{
   console.log(value)
  var url = "https://api.openai.com/v1/completions";

var xhr = new XMLHttpRequest();
xhr.open("POST", url);

xhr.setRequestHeader("Content-Type", "application/json");
xhr.setRequestHeader("Authorization", "Bearer "+btoa(ky));

xhr.onreadystatechange = function () {
   if (xhr.readyState === 4) {
    document.getElementById('recording-instructions').style.visibility='hidden'
 
      console.log(xhr.status);
      console.log(xhr.response);
      const ab=xhr.responseText
      console.log(ab)
      obj=JSON.parse(ab)
      console.log(JSON.stringify(obj.choices[0].text))
document.getElementsByClassName('contentbox')[0].innerHTML=obj.choices[0].text;
   }};
   
   document.getElementById('recording-instructions').style.visibility='visible'
   
   document.getElementById('recording-instructions').innerText="Aladdin is loading your website.. Wait for few sec.ðŸ’—ðŸ’—"
var contentbox=document.getElementsByClassName('contentbox')[0].innerHTML
//var data ="{'model': 'text-davinci-003', 'prompt': '"+"+value+' in the html:'+contentbox+''', "temperature": 0, "max_tokens": 2300}';
var jso=JSON.parse('{"model":"text-davinci-003"}');
jso.prompt=value+' in the html'+contentbox
jso.temperature=0
jso.max_tokens=2300
console.log(jso)
response= xhr.send(JSON.stringify(jso));
console.log(response)

}

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = true;

// This block is called every time the Speech APi captures a line. 
recognition.onresult = function(event) {
   
  // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;
  getNewHTML(transcript)
  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function() { 
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function() {
  instructions.text('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('No speech was detected. Try again.');  
  };
}



/*-----------------------------
      App buttons and input 
------------------------------*/

$('#start-record-btn').on('click', function(e) {
  if (noteContent.length) {
    noteContent += ' ';
  }
  document.getElementById('recording-instructions').innerText="Recording Started. Ask it to create a website as per your requirment"
  recognition.start();
});


$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  instructions.text('Voice recognition paused.');
  document.getElementById('recording-instructions').innerText="Recording Paused. Hope You liked it a little"
 
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function() {
  noteContent = $(this).val();
})

$('#save-note-btn').on('click', function(e) {
  recognition.stop();

  if(!noteContent.length) {
    instructions.text('Could not save empty note. Please add a message to your note.');
  }
  else {
    // Save note to localStorage.
    // The key is the dateTime with seconds, the value is the content of the note.
    saveNote(new Date().toLocaleString(), noteContent);

    // Reset variables and update UI.
    noteContent = '';
    renderNotes(getAllNotes());
    noteTextarea.val('');
    instructions.text('Note saved successfully.');
  }
      
})


notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected note.
  if(target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});



/*-----------------------------
      Speech Synthesis 
------------------------------*/

function readOutLoud(message) {
	var speech = new SpeechSynthesisUtterance();

  // Set the text and voice attributes.
	speech.text = message;
	speech.volume = 1;
	speech.rate = 1;
	speech.pitch = 1;
  
	window.speechSynthesis.speak(speech);
}



/*-----------------------------
      Helper Functions 
------------------------------*/

function renderNotes(notes) {
  var html = '';
  if(notes.length) {
    notes.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
  }
  notesList.html(html);
}


function saveNote(dateTime, content) {
  localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if(key.substring(0,5) == 'note-') {
      notes.push({
        date: key.replace('note-',''),
        content: localStorage.getItem(localStorage.key(i))
      });
    } 
  }
  return notes;
}


function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime); 
}

