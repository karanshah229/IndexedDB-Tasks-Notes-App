var dbPromise, db;

(function() {
	'use strict';
  
	if (!('indexedDB' in window)) {
		alert("Data will not be stored since the platform does not support IndexDB");
		console.error('This browser doesn\'t support IndexedDB');
	}
	
	dbPromise = indexedDB.open("Tasks_Notes", 1.0); 

	dbPromise.onupgradeneeded = function(event) {
		db = event.target.result;
		console.info('making a new object store');
		if (!db.objectStoreNames.contains('users')) {
			var users_store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
			users_store.createIndex('name', 'name', { unique: true });
		}
		if (!db.objectStoreNames.contains('tasks')) {
			var tasks_store = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
			tasks_store.createIndex('title', 'title', { unique: false });
		}
		if (!db.objectStoreNames.contains('notes')) {
			var notes_store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
			notes_store.createIndex('title', 'title', { unique: false });
		}
	}

	dbPromise.onsuccess = function(event) {
		db = event.target.result;
	}
	dbPromise.onerror = function(event) {
		alert("Data will not be stored as application. Check console for more details");
		console.error('error opening database ' + event.target.errorCode);
	}
})();

function addUser(db, name){
	var tx = db.transaction('users', 'readwrite');
	var store = tx.objectStore('users');
	var user = { name: name, created: new Date().getTime() };
	store.add(user);
	
	tx.oncomplete = function() { console.log(`Added User: ${name} to the User Store!`); }
	tx.onerror = function(event) {
		alert("Couldn't create new user. Check console for more details");
		console.error('error storing user ' + event.target.errorCode);
	}
}

function addTask(db, data){
	var tx = db.transaction('tasks', 'readwrite');
	var store = tx.objectStore('tasks');
	var task = {
		userID: data.userID,
		status: data.taskStatus,
		title: data.taskTitle,
		description: data.taskDescription,
		date: data.taskDate,
		taskList: data.taskList || "default",
		startTime: data.taskStarTime,
		endTime: data.taskEndTime,
		remindTime: data.taskRemindTime,
		starred: data.taskStarred,
		created: new Date().getTime()
	};
	store.add(task);
	
	tx.oncomplete = function() { console.log(`Added Task to the Tasks Store!`); }
	tx.onerror = function(event) {
		alert("Couldn't create new Task. Check console for more details");
		console.error('error storing task ' + event.target.errorCode);
	}
}

function addNote(db, data){
	var tx = db.transaction('notes', 'readwrite');
	var store = tx.objectStore('notes');
	var note = {
		userID: data.userID,
		title: data.noteTitle,
		description: data.noteDescription,
		created: new Date().getTime()
	};
	store.add(note);
	
	tx.oncomplete = function() { console.log(`Added Note to the Notes Store!`); }
	tx.onerror = function(event) {
		alert("Couldn't create new Note. Check console for more details");
		console.error('error storing note ' + event.target.errorCode);
	}
}

document.addEventListener("DOMContentLoaded", function(event) {

});