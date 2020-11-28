var dbPromise, db, users = [], currentUser, userNotes = [], userTasks = [], userLists = [];

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
		if (!db.objectStoreNames.contains('lists')) {
			var notes_store = db.createObjectStore('lists', { keyPath: 'id', autoIncrement: true });
			notes_store.createIndex('title', 'title', { unique: false });
		}
		if (!db.objectStoreNames.contains('notes')) {
			var notes_store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
			notes_store.createIndex('title', 'title', { unique: false });
		}
	}

	dbPromise.onsuccess = function(event) {
		db = event.target.result;

		// addList(db, { userID: 'karan', listTitle: 'List1' });
		// addList(db, { userID: 'karan', listTitle: 'List3' });
		// addList(db, { userID: 'karan', listTitle: 'List2' });
		// addUser(db, 'karan');
		// addUser(db, 'karan1');
		// addUser(db, 'karan12');

		getUsers();
		getUserLists();
		// getUserTasks();
		// getUserNotes();
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
		taskListID: data.taskListID || -1,
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

function addList(db, data){
	var tx = db.transaction('lists', 'readwrite');
	var store = tx.objectStore('lists');
	var list = {
		userID: data.userID,
		title: data.listTitle,
		created: new Date().getTime()
	};
	store.add(list);
	
	tx.oncomplete = function() { console.log(`Added List to the Lists Store!`); }
	tx.onerror = function(event) {
		alert("Couldn't create new List. Check console for more details");
		console.error('error storing list ' + event.target.errorCode);
	}
}

function getUserLists(){
	var tx = db.transaction('lists', 'readonly');
	var store = tx.objectStore('lists');

	var req = store.openCursor();

	req.onsuccess = function(event){
		let cursor = event.target.result;
		if (cursor != null) {
			if(cursor.value.userID == currentUser){
				userLists.push(cursor.value);
				var ele = document.createElement('div');
				ele.classList.add('nav_item');
				ele.style.paddingLeft = '2rem';
				ele.textContent = cursor.value.title;
				document.getElementById("user_lists").append(ele);
			}
			cursor.continue();
		}
	}
	req.onerror = function(event){
		alert("Couldn't fetch lists. Check console for more details");
		console.error("error displaying lists " + event.target.errorCode);
	}
}

function getUsers(){
	var tx = db.transaction('users', 'readonly');
	var store = tx.objectStore('users');

	var req = store.openCursor();

	req.onsuccess = function(event){
		let cursor = event.target.result;
		if (cursor != null) {
			if(cursor.value.userID != currentUser){
				console.log(cursor.value)
				users.push(cursor.value);
				var ele = document.createElement('li');
				var i_ele = document.createElement('a');
				i_ele.classList.add('black-text');
				i_ele.textContent = cursor.value.name;
				ele.append(i_ele);
				document.getElementById("user_dropdown").prepend(ele);
				cursor.continue();
			}
		}
	}
	req.onerror = function(event){
		alert("Couldn't fetch lists. Check console for more details");
		console.error("error displaying lists " + event.target.errorCode);
	}
}

document.addEventListener("DOMContentLoaded", function(event) {

});