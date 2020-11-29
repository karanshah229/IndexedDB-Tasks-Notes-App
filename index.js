(function init() {
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

function addUser(name){
	var tx = db.transaction('users', 'readwrite');
	var store = tx.objectStore('users');
	var user = { name: name, created: new Date().getTime() };
	store.add(user);
	
	tx.oncomplete = function() { 
		console.log(`Added User: ${name} to the User Store!`);
		users.push(user);
		var ele = document.createElement('li');
		var i_ele = document.createElement('a');
		i_ele.classList.add('black-text');
		i_ele.textContent = user.name;
		ele.append(i_ele);
		document.getElementById("user_dropdown").prepend(ele);
	}
	tx.onerror = function(event) {
		alert("Couldn't create new user. Check console for more details");
		console.error('error storing user ' + event.target.errorCode);
	}
}

function addTask(data){
	var tx = db.transaction('tasks', 'readwrite');
	var store = tx.objectStore('tasks');
	var task = {
		userID: data.userID,
		completed: false,
		title: data.taskTitle,
		description: data.taskDescription,
		taskListID: data.taskListID,
		dueDate: data.taskDueDate,
		reminderDate: data.taskReminderDate,
		reminderTime: data.taskReminderTime,
		important: data.taskImportant,
		created: new Date().getTime()
	};
	store.add(task);
	
	tx.oncomplete = function() { console.log(`Added Task to the Tasks Store!`); }
	tx.onerror = function(event) {
		alert("Couldn't create new Task. Check console for more details");
		console.error('error storing task ' + event.target.errorCode);
	}
}

function addNote(data){
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

function addList(data){
	var tx = db.transaction('lists', 'readwrite');
	var store = tx.objectStore('lists');
	var list = {
		userID: data.userID,
		title: data.listTitle,
		created: new Date().getTime()
	};
	store.add(list);
	
	tx.oncomplete = function() {
		console.log(`Added List to the Lists Store!`); 
		// Push to Side Nav
		userLists.push(list);
		var ele = document.createElement('div');
		ele.classList.add('nav_item');
		ele.style.paddingLeft = '2rem';
		ele.textContent = list.title;
		document.getElementById("user_lists").append(ele);
		// Push to Task - Change List
		var ele2 = document.createElement('div');
		ele2.classList.add('nav_item');
		ele2.style.paddingLeft = '2rem';
		ele2.textContent = list.title;
		document.getElementById("list_change_dropdown").prepend(ele2);
		// Push to Create Task Select Button
		var ele3 = document.createElement('option');
		ele3.value = list.id;
		ele3.textContent = list.title;
		document.getElementById("create_task_listID").prepend(ele3);
		elems = document.querySelectorAll('select');
		instances = M.FormSelect.init(elems, {});
	}
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
			if(cursor.value.userID == currentUserID){
				// Push to Side Nav
				var ele = document.createElement('div');
				ele.classList.add('nav_item');
				ele.style.paddingLeft = '2rem';
				ele.textContent = cursor.value.title;
				document.getElementById("user_lists").append(ele);
				// Push to Task - Change List
				var ele2 = document.createElement('div');
				ele2.classList.add('nav_item');
				ele2.style.paddingLeft = '2rem';
				ele2.textContent = cursor.value.title;
				document.getElementById("list_change_dropdown").prepend(ele2);
				// Push to Create Task Select Button
				var ele3 = document.createElement('option');
				ele3.value = cursor.value.id;
				ele3.textContent = cursor.value.title;
				document.getElementById("create_task_listID").append(ele3);
			}
			cursor.continue();
		}
		elems = document.querySelectorAll('select');
		instances = M.FormSelect.init(elems, {});
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
	req.onerror = function(event){
		alert("Couldn't fetch lists. Check console for more details");
		console.error("error displaying lists " + event.target.errorCode);
	}
}

// function getUserTasks(){
// 	var tx = db.transaction('tasks', 'readonly');
// 	var store = tx.objectStore('tasks');

// 	var req = store.openCursor();

// 	req.onsuccess = function(event){
// 		let cursor = event.target.result;
// 		if (cursor != null) {
// 			users.push(cursor.value);
// 			var ele = document.createElement('li');
// 			var i_ele = document.createElement('a');
// 			i_ele.classList.add('black-text');
// 			i_ele.textContent = cursor.value.name;
// 			ele.append(i_ele);
// 			document.getElementById("user_dropdown").prepend(ele);
// 			cursor.continue();
// 		}
// 	}
// 	req.onerror = function(event){
// 		alert("Couldn't fetch tasks. Check console for more details");
// 		console.error("error displaying tasks " + event.target.errorCode);
// 	}
// }