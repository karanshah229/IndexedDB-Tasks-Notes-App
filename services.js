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
			users_store.createIndex('usersName', 'name', { unique: true });
		}
		if (!db.objectStoreNames.contains('tasks')) {
			var tasks_store = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
			tasks_store.createIndex('tasksTitle', 'title', { unique: false });
		}
		if (!db.objectStoreNames.contains('lists')) {
			var lists_store = db.createObjectStore('lists', { keyPath: 'id', autoIncrement: true });
			lists_store.createIndex('listsTitle', 'title', { unique: false });
		}
		if (!db.objectStoreNames.contains('notes')) {
			var notes_store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
			notes_store.createIndex('notesTitle', 'title', { unique: false });
		}
	}

	dbPromise.onsuccess = function(event) {
		db = event.target.result;
		
		// var userLoginModal = document.querySelector("#userModal")
		// userLoginModalInstance = M.Modal.init(userLoginModal, { dismissible: false })
		// if(localStorage.getItem("userid")) {
		// 	currentUserID = parseInt(localStorage.getItem("userid"))
		// 	currentUserName = localStorage.getItem("username")
		// 	document.getElementById("user_dropdown_trigger").textContent = currentUserName
		// } else userLoginModalInstance.open()
		// if(currentUserID != -1) getUsers()

		getUsers()
		// getUserNotes();
	}
	dbPromise.onerror = function(event) {
		alert("Data will not be stored as application. Check console for more details");
		console.error('error opening database ' + event.target.errorCode);
	}
})();

function addUser(name, login = false){
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
		if(login) {
			document.getElementById("user_dropdown_trigger").textContent = name
			getUsers()
		}
	}
	tx.onerror = function(event) {
		alert("Couldn't create new user. Check console for more details");
		console.error('error storing user ' + event.target.errorCode);
	}
}

function addTask(data){
	userTasks = []
	todayUserTasks = []
	allUserTasks = []
	var tx = db.transaction('tasks', 'readwrite');
	var store = tx.objectStore('tasks');
	var task = {
		userID: parseInt(currentUserID),
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
	
	tx.oncomplete = function() {
		console.log(`Added Task to the Tasks Store!`);
		userTasks = []
		if(window.location.hash.includes("important") ) getUserTasks(true)
		else if(window.location.hash.includes("L~")) getUserTasks(false, window.location.hash.split("L~")[1])
		else if(window.location.hash.includes("notes")) showNotes()
		else getUserTasks(false)
	}
	tx.onerror = function(event) {
		alert("Couldn't create new Task. Check console for more details");
		console.error('error storing task ' + event.target.errorCode);
	}
}

function addNote(data){
	var tx = db.transaction('notes', 'readwrite');
	var store = tx.objectStore('notes');
	var note = {
		userID: currentUserID,
		title: data.noteTitle,
		description: data.noteDescription,
		pinned: data.notePinned,
		created: new Date().getTime()
	};
	store.add(note);
	
	tx.oncomplete = function() { 
		console.log(`Added Note to the Notes Store!`);
		getUserNotes()
	}
	tx.onerror = function(event) {
		alert("Couldn't create new Note. Check console for more details");
		console.error('error storing note ' + event.target.errorCode);
	}
}

function getUserNoteTemplate(cursor){
	let x = {...cursor.value}
	var div = document.createElement("div")
	div.className = "note"
		var div1 = document.createElement("div")
		div1.className = "note_data"
			var div2 = document.createElement("div")
			div2.className = "note_data_div"
				var div3 = document.createElement("div")
				div3.className = "display_note_title"
				div3.textContent = cursor.value.title
				var div4 = document.createElement("div")
				div4.className = "note_actions"
					var div5 = document.createElement("div")
					div5.className = "note_actions_div"
						var img = document.createElement("img")
						img.src = cursor.value.pinned ? "images/push_pin.svg" : "images/push_pin_outline.svg"
						img.alt = "Pin Note"
						img.id = "createNote_pin"
						img.onclick = function(){ updatePinned(img, x) }
						img.style.width = "25px"
					div5.append(img)
				div4.append(div5)
			div2.append(div3)
			div2.append(div4)
			var div6 = document.createElement("div")
			div6.className = "note_data_div"
				var div7 = document.createElement("div")
				div7.textContent = cursor.value.description
				var div8 = document.createElement("div")
				div8.className = "note_actions"
					var div9 = document.createElement("div")
					div9.className = "note_actions_div"
						var i = document.createElement("i")
						i.className = "material-icons"
						i.textContent = "edit"
						// i.onclick = function(){ deleteNote(cursor.value) }
					div9.append(i)
					var div10 = document.createElement("div")
					div10.className = "note_actions_div"
						var i2 = document.createElement("i")
						i2.className = "material-icons red_icon"
						i2.textContent = "delete"
						i2.onclick = function(){ deleteNote(cursor.value) }
					div10.append(i2)
				div8.append(div9)
				div8.append(div10)
			div6.append(div7)
			div6.append(div8)
		div1.append(div2)
		div1.append(div6)
	div.append(div1)

	return div
}

function getUserNotes(){
	if(!window.location.hash.includes("notes")) return

	document.getElementById("main_heading_1_container").innerHTML = ""
	document.getElementById("main_heading_2_container").innerHTML = ""
	pinnedNotes = [], allUserNotes = []

	var tx = db.transaction('notes', 'readonly');
	var store = tx.objectStore('notes')

	var req = store.openCursor();

	req.onsuccess = function(event){
		let cursor = event.target.result;
		if (cursor) {
			// if(cursor.value.userID != currentUserID){
				var x = cursor.value

				let template = getUserNoteTemplate(cursor)
				if(cursor.value.pinned){
					pinnedNotes.push(x)
					document.getElementById("main_heading_1_container").appendChild(template)
				} else {
					allUserNotes.push(x)
					document.getElementById("main_heading_2_container").appendChild(template)
				}

				cursor.continue();
			// }
		} else getUserNotesUIChanges()
	}
	req.onerror = function(event){
		alert("Couldn't fetch notes. Check console for more details");
		console.error("error displaying notes " + event.target.errorCode);
	}
}

function updatePinned(pinEl, cursor_value){
	var tx = db.transaction('notes', 'readwrite');
	var store = tx.objectStore('notes');

	var note = {
		userID: parseInt(cursor_value.userID),
		id: parseInt(cursor_value.id),
		created: cursor_value.created,
		title: cursor_value.title,
		description: cursor_value.description,
		pinned: !cursor_value.pinned,
	};
	store.put(note);

	tx.oncomplete = function() { 
		console.log(`Pinned Note: ${cursor_value.id}!`);
		changeNotePin(pinEl)
		getUserNotes()
	}
	tx.onerror = function(event) {
		alert("Couldn't update 'Pinned' state. Check console for more details");
		console.error('error updating "Pinned" state ' + event.target.errorCode);
	}
}

function deleteNote(cursor_value){
	var tx = db.transaction('notes', 'readwrite');
	var store = tx.objectStore('notes');
	store.delete(cursor_value.id);

	tx.oncomplete = function() {
		console.log(`Deleted Note ${cursor_value.id} from the Notes Store!`);
		if(window.location.hash == "important") getUserTasks(true)
		if(window.location.hash.includes("#L~")) getUserTasks(false, window.location.hash.split("L~")[1])
		else getUserTasks(false, null)
	}
	tx.onerror = function(event) {
		alert("Couldn't delete Note. Check console for more details");
		console.error('error deleting notes ' + event.target.errorCode);
	}
	M.toast({html: `Note Deleted successfully`, classes: 'rounded'});
}

function addList(data){
	var tx = db.transaction('lists', 'readwrite');
	var store = tx.objectStore('lists');
	var list = {
		userID: parseInt(data.userID),
		title: data.listTitle,
		created: new Date().getTime()
	};
	store.add(list);
	
	tx.oncomplete = function() {
		console.log(`Added List to the Lists Store!`);
		getUserLists();
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

	// Initialize Divs
	document.getElementById("user_lists").innerHTML = "";
	var ele = document.createElement('div');
	ele.className = 'nav_item truncate';
	ele.style.paddingLeft = '2rem';
	ele.textContent = "Create New List";
	ele.onclick = function(){M.Modal.getInstance(document.getElementById('createListModal')).open()};
	document.getElementById("user_lists").append(ele);

	document.getElementById("create_task_listID").innerHTML = "";
	ele = document.createElement("option");
	ele.value = "";
	ele.disabled = true;
	ele.selected = true
	ele.textContent = "Choose List"
	document.getElementById("create_task_listID").appendChild(ele)

	document.getElementById("update_task_listID").innerHTML = "";
	ele = document.createElement("option");
	ele.value = "";
	ele.disabled = true;
	ele.textContent = "Choose List"
	document.getElementById("update_task_listID").appendChild(ele)

	req.onsuccess = function(event){
		let cursor = event.target.result;
		if (cursor) {
			if(cursor.value.userID === currentUserID){
				userLists.push(cursor.value)
				// Push to Side Nav
				var _ele = document.createElement('div');
				_ele.style.display = "flex"
				_ele.style.justifyContent = "space-between"
					ele = document.createElement('div');
					ele.className = 'nav_item truncate';
					ele.style.paddingLeft = '2rem';
					ele.style.flex = "1"
					ele.textContent = cursor.value.title;
					var cursor_value = {...cursor.value}
					ele.onclick = function(){ filter_list(cursor_value) }
					var ele2 = document.createElement('div')
					ele2.className = "nav_item material-icons red-text";
					ele2.innerHTML = "delete_outline"
					ele2.style.paddingRight = "15px"
					var cursor_value = {...cursor.value}
					ele2.onclick = function(){ if(confirm("All tasks associated with this list will also be deleted. Are you sure ?")) deleteList(cursor_value) }
				_ele.append(ele)
				_ele.append(ele2)
				document.getElementById("user_lists").append(_ele);
				
				// Push to Create Task Select Button
				ele = document.createElement('option');
				ele.value = cursor.value.id;
				ele.textContent = cursor.value.title;
				document.getElementById("create_task_listID").append(ele);

				// Push to Update Task Select Button
				ele = document.createElement('option');
				ele.value = cursor.value.id;
				ele.textContent = cursor.value.title;
				var x = cursor.value
				ele.onclick = function(){ filter_list(x) };
				document.getElementById("update_task_listID").append(ele);
			}
			cursor.continue();
		} else {
			if(window.location.hash.includes("important") ) getUserTasks(true)
			else if(window.location.hash.includes("L~")) getUserTasks(false, window.location.hash.split("L~")[1])
			else if(window.location.hash.includes("notes")) showNotes()
			else getUserTasks(false)
		}
		elems = document.querySelectorAll('select');
		instances = M.FormSelect.init( elems );
	}
	req.onerror = function(event){
		alert("Couldn't fetch lists. Check console for more details");
		console.error("error displaying lists " + event.target.errorCode);
	}
}

function deleteList(cursor_value){
	var tx = db.transaction('lists', 'readwrite');
	var store = tx.objectStore('lists');

	store.delete(cursor_value.id);

	tx.oncomplete = function() {
		console.log(`Deleted List ${cursor_value.id} from the Lists Store!`);
		
		// Get All Tasks to be Deleted - Cascade Delete
		let objectStore = db.transaction('tasks', 'readwrite').objectStore('tasks')

		objectStore.openCursor().onsuccess = function(event) {
			var cursor = event.target.result;
			if(cursor) {
				console.log(cursor)
				if(cursor.value.userID === currentUserID && cursor.value.taskListID === cursor_value.id){
					var request = cursor.delete();
					request.onsuccess = function() {
						console.log(`Deleted Task ${cursor.value.id} associated with list ${cursor_value.id}`);
					};
					request.onerror = function() {
						console.log(`ERROR: Deleting Task ${cursor.value.id} associated with list ${cursor_value.id}`);
					  };
				}
			  	cursor.continue();
			} else {
				M.toast({html: `List and tasks associated, deleted successfully`, classes: 'rounded'});
				if(window.location.hash.includes("important") ) getUserTasks(true)
				else if(window.location.hash.includes("L~")) getUserTasks(false, window.location.hash.split("L~")[1])
				else if(window.location.hash.includes("notes")) showNotes()
				else getUserTasks(false)
				getUserLists()
			}
		};

		objectStore.openCursor().onerror = function(event){
			alert("Couldn't delete tasks associated with list. Check console for more details");
			console.error("error deleteing tasks associated with list " + event.target.errorCode);
		}
	}
	tx.onerror = function(event) {
		alert("Couldn't delete Task. Check console for more details");
		console.error('error deleting task ' + event.target.errorCode);
	}
}

function getUsers(){
	document.getElementById("user_dropdown").innerHTML = ""
	// document.getElementById("user_dropdown").innerHTML = '<li class="divider" tabindex="-1"></li><li><a class="grey lighten-3 black-text" onclick="createUserModalInstance.open()">Create New User</a></li>'
	var tx = db.transaction('users', 'readonly');
	var store = tx.objectStore('users');

	var req = store.openCursor();

	req.onsuccess = function(event){
		let cursor = event.target.result;
		if (cursor) {
			// if(cursor.value.ID != currentUserID){
				var x = cursor.value
				users.push(cursor.value);
				var ele = document.createElement('li');
				// ele.onclick = function(){ switchUser(x) }
				var i_ele = document.createElement('a');
				i_ele.classList.add('black-text');
				i_ele.textContent = cursor.value.name;
				ele.append(i_ele);
				document.getElementById("user_dropdown").prepend(ele);
				cursor.continue();
			// }
		} else getUserLists()
	}
	req.onerror = function(event){
		alert("Couldn't fetch lists. Check console for more details");
		console.error("error displaying lists " + event.target.errorCode);
	}
}

// Task Related ------------------------------------
function getTaskTemplate(cursor){
	let cursor_value = {...cursor.value}
	var div = document.createElement("div")
	div.className = "task"
	if(cursor.value.completed) div.classList.add('true')
		var div2 = document.createElement("div")
		div2.className = "task_div"
			var div3 = document.createElement("div")
			div3.className = "task_div_left"
				var div4 = document.createElement("div")
				div4.className = "task_div_left_status"
					var label = document.createElement("label")
						var checkbox = document.createElement("input")
							checkbox.type = "checkbox"
							checkbox.id = "taskCompleted"
							checkbox.className = "checkbox-blue-grey"
							checkbox.value = cursor.value.completed
							checkbox.checked = cursor.value.completed
							checkbox.onclick = function(){ taskCompleted(checkbox, div, cursor_value) }
						var span = document.createElement("span")
					label.append(checkbox)
					label.append(span)
				div4.append(label)
				var div5 = document.createElement("div")
				div5.className = "star"
					var i = document.createElement("i")
					i.title = cursor.value.important
					i.className = "material-icons nav_icon yellow_icon"
					i.textContent = cursor.value.important ? "star" : "star_outline"
					i.onclick = function(){ updateImportant(i, cursor_value) }
				div5.append(i)
			div3.append(div4)
			div3.append(div5)
			var div6 = document.createElement("div")
			div6.className = "middle"
				var div7 = document.createElement("div")
				div7.className = "taskTitle"
				div7.textContent = cursor.value.title
				var _div = document.createElement("div")
				_div.textContent = cursor.value.description
				_div.className = "taskDescription"
				div6.onclick = function() { expandDescription(_div) }
				var div8 = document.createElement("div")
				div8.className = "taskDetails taskDetails_mobile"
					var div12 = document.createElement("div")
					div12.style.marginRight = "1rem"
		
					var x = userLists.find(function(el){
						return el.id == cursor.value.taskListID
					})
					
					div12.textContent = x.title
					div12.innerHTML += "&nbsp;&nbsp;&bull;"
					var div9 = document.createElement("div")
					div9.className = "taskDetails_div"
						var i2 = document.createElement("i")
						i2.title = "Due Date"
						i2.className = "material-icons"
						i2.style.marginLeft = 0
						i2.textContent = "calendar_today"
					div9.append(i2)
					div9.innerHTML += cursor.value.dueDate
					var div10 = document.createElement("div")
					div10.className = "taskDetails_div"
						var i3 = document.createElement("i")
						i3.title = "Reminder"
						i3.className = "material-icons"
						i3.textContent = "alarm"
						var span2 = document.createElement("span")
						span2.style.marginRight = "10px"
						span2.innerHTML += cursor.value.reminderDate
						var span3 = document.createElement("span")
						span3.textContent = cursor.value.reminderTime
					div10.append(i3)
					div10.append(span2)
					div10.append(span3)
				div8.append(div12)
				div8.append(div9)
				div8.append(div10)
			div6.append(div7)
			div6.append(_div)
			div6.append(div8)
		div2.append(div3)
		div2.append(div6)
		var div11 = document.createElement("div")
		div11.className = "right"
		div11.style.display = "flex"
			var div13 = document.createElement("div")
			div13.className = "delete"
				var i4 = document.createElement("i")
				i4.title = "Delete Task"
				i4.className = "material-icons nav_icon red_icon"
				i4.textContent = "delete"
				i4.onclick = function(){ deleteTask(cursor_value) }
				var div14 = document.createElement("div")
				div14.className = "edit"
					var i5 = document.createElement("i")
					i5.title = "Edit Task"
					i5.className = "material-icons nav_icon purple_icon"
					i5.textContent = "edit"
					i5.onclick = function(){ updateTaskUI(cursor_value) }
			div13.append(i5)
			div13.append(i4)
		div11.append(div13)
	div.append(div2)
	div.append(div11)

	return div
}

function getUserTasks(imp = false, listFilterID = null){
	userTasks = [], todayUserTasks = [], allUserTasks = []
	document.getElementById("main_heading_1_container").innerHTML = ""
	document.getElementById("main_heading_2_container").innerHTML = ""
	var tx = db.transaction('tasks', 'readonly');
	var store = tx.objectStore('tasks');

	var req = store.openCursor();

	req.onsuccess = function(event){
		let cursor = event.target.result;
		if (cursor) {
			if(cursor.value.userID === currentUserID){
				userTasks.push(cursor.value)
				var taskTime = cursor.value.dueDate.toString().split("-")
				var d = new Date()
				var x = getTaskTemplate(cursor)
				// Important Tasks
				if(imp === true && cursor.value.important === true){
					if( taskTime[0] == d.getDate() && taskTime[1] == d.getMonth()+1 && taskTime[2] == d.getFullYear() ){
						// Today
						todayUserTasks.push(cursor.value)
						document.getElementById("main_heading_1_container").append(x)
					} else if( taskTime[0] > d.getDate() || taskTime[1] > d.getMonth()+1 || taskTime[2] > d.getFullYear() ) {
						// Later
						document.getElementById("main_heading_2_container").append(x)
						allUserTasks.push(cursor.value)
					}
				}
				// All Tasks - No Filters / Importance
				else if(imp === false && listFilterID == null) {
					if( taskTime[0] == d.getDate() && taskTime[1] == d.getMonth()+1 && taskTime[2] == d.getFullYear() ){
						// Today
						todayUserTasks.push(cursor.value)
						document.getElementById("main_heading_1_container").append(x)
					} else if( taskTime[0] > d.getDate() || taskTime[1] > d.getMonth()+1 || taskTime[2] > d.getFullYear() ) {
						// Later
						document.getElementById("main_heading_2_container").append(x)
						allUserTasks.push(cursor.value)
					}
				}
				// Filtered Tasks - Based on ListID
				else if(listFilterID != null){
					if( listFilterID === cursor.value.taskListID && taskTime[0] == d.getDate() && taskTime[1] == d.getMonth()+1 && taskTime[2] == d.getFullYear() ){
						// Today
						todayUserTasks.push(cursor.value)
						document.getElementById("main_heading_1_container").append(x)
					} else if( listFilterID === cursor.value.taskListID && (taskTime[0] > d.getDate() || taskTime[1] > d.getMonth()+1 || taskTime[2] > d.getFullYear()) ) {
						// Later
						document.getElementById("main_heading_2_container").append(x)
						allUserTasks.push(cursor.value)
					}
				}
				cursor.continue();
			}
		} else {
			playReminder()
			getUserTasksUIChanges()
			getUserNotes()
		}
	}
	req.onerror = function(event){
		alert("Couldn't fetch tasks. Check console for more details");
		console.error("error displaying tasks " + event.target.errorCode);
	}
}

function updateTaskDetails(){
	var task = {
		"id": parseInt(document.getElementById("update_task_id").value),
		"created": parseInt(document.getElementById("update_task_createdAt").value),
		"completed": document.getElementById("update_task_completed").value === "true" ? true: false,
		"userID": parseInt(currentUserID),
		"important": document.getElementById("update_task_important").innerHTML == "star" ? true: false,
		"title": document.getElementById("update_task_title").value,
		"description": document.getElementById("update_task_description").value,
		"taskListID": parseInt(document.getElementById("update_task_listID").value),
		"dueDate": document.getElementById("update_task_due_date").value,
		"reminderDate": document.getElementById("update_task_reminder_date").value,
		"reminderTime": document.getElementById("update_task_reminder_time").value
	}

	if(task.taskListID == NaN){
		document.getElementById("create_task_form_errors").textContent = "Please Fill all Valid Details"
	} else {
		var tx = db.transaction('tasks', 'readwrite');
		var store = tx.objectStore('tasks');
		store.put(task);

		tx.oncomplete = function() {
			console.log(`Updated Task ${task.id} to the Tasks Store!`);
			updateTaskModalInstance.close()
			var hash = window.location.hash
			if(window.location.hash.includes("important") ) getUserTasks(true)
			else if(window.location.hash.includes("L~")) getUserTasks(false, window.location.hash.split("L~")[1])
			else if(window.location.hash.includes("notes")) showNotes()
			else getUserTasks(false)
		}
		tx.onerror = function(event) {
			alert("Couldn't create new Task. Check console for more details");
			console.error('error storing task ' + event.target.errorCode);
		}
	}
}

function updateImportant(starEl, cursor_value){
	var tx = db.transaction('tasks', 'readwrite');
	var store = tx.objectStore('tasks');

	var task = {
		userID: parseInt(cursor_value.userID),
		id: parseInt(cursor_value.id),
		completed: cursor_value.completed,
		title: cursor_value.title,
		description: cursor_value.description,
		taskListID: cursor_value.taskListID,
		dueDate: cursor_value.dueDate,
		reminderDate: cursor_value.reminderDate,
		reminderTime: cursor_value.reminderTime,
		important: !cursor_value.important,
		created: cursor_value.created
	};
	store.put(task);

	tx.oncomplete = function() { 
		console.log(`Updated Task ${cursor_value.id} to the Tasks Store!`); 
		if(starEl.innerHTML == "star_outline"){
			starEl.innerHTML = "star"
		} else starEl.innerHTML = "star_outline"
	}
	tx.onerror = function(event) {
		alert("Couldn't update 'Imporatant' state. Check console for more details");
		console.error('error updating "Imporant" state ' + event.target.errorCode);
	}
}
function deleteTask(cursor_value){
	var tx = db.transaction('tasks', 'readwrite');
	var store = tx.objectStore('tasks');
	store.delete(cursor_value.id);

	tx.oncomplete = function() {
		console.log(`Deleted Task ${cursor_value.id} from the Tasks Store!`);
		if(window.location.hash.includes("important") ) getUserTasks(true)
		else if(window.location.hash.includes("L~")) getUserTasks(false, window.location.hash.split("L~")[1])
		else if(window.location.hash.includes("notes")) showNotes()
		else getUserTasks(false)
	}
	tx.onerror = function(event) {
		alert("Couldn't delete Task. Check console for more details");
		console.error('error deleting task ' + event.target.errorCode);
	}
	M.toast({html: `Task Deleted successfully`, classes: 'rounded'});
}

var _setInterval
function playReminder(){
	var audio = new Audio('/audio/task_complete.mp3');
	clearInterval(_setInterval)
	_setInterval = setInterval(function(){
		todayUserTasks.forEach(function(item, _){
			var d = new Date()
			var taskTime = item.reminderTime.toString().split(":")
			if(!item.completed && d.getDate() == item.dueDate.split("-")[0] && (d.getMonth()+1) == item.dueDate.split("-")[1] && d.getFullYear() == item.dueDate.split("-")[2]  && d.getHours() == 0 && d.getMinutes() == 0){
				// Task Due
				audio.play();
				let elem = document.querySelector('#taskCompleteModal');
				taskCompleteModalInstance = M.Modal.init(elem, { dismissible: false })
				document.getElementById("taskCompleteModalTaskID").value = item.id;
				document.getElementById("taskCompleteModalHeading_Reminder").style.display = "none"
				document.getElementById("taskCompleteModalHeading_TimeUp").style.display = "block"
				document.getElementById("taskCompleteModalTaskTitle").innerHTML = `<p>Were you able to complete: <span style="font-size: larger"> ${item.title} </span> ? </p><p>Due: ${item.dueDate}</p>`
				taskCompleteModalInstance.open()
			} else if(!item.completed && taskTime[0] == d.getHours() && taskTime[1] == d.getMinutes() && d.getSeconds() == 0){
				// Task Reminder
				audio.play();
				let elem = document.querySelector('#taskCompleteModal');
				taskCompleteModalInstance = M.Modal.init(elem, { dismissible: false })
				document.getElementById("taskCompleteModalTaskID").value = item.id;
				document.getElementById("taskCompleteModalHeading_TimeUp").style.display = "none"
				document.getElementById("taskCompleteModalHeading_Reminder").style.display = "block"
				document.getElementById("taskCompleteModalTaskTitle").innerHTML = `<p>Were you able to complete: <span style="font-size: larger"> ${item.title} </span> ? </p><p>Due: ${item.dueDate}</p>`
				taskCompleteModalInstance.open()
			}
		})
	}, 990)
}

function taskCompleted(checkbox, taskEl, cursor_value){
	if( checkbox.checked ){
		taskEl.classList.add('true')
	} else taskEl.classList.remove('true')
	
	var tx = db.transaction('tasks', 'readwrite');
	var store = tx.objectStore('tasks');
	var task = {
		userID: parseInt(cursor_value.userID),
		id: parseInt(cursor_value.id),
		completed: !cursor_value.completed,
		title: cursor_value.title,
		description: cursor_value.description,
		taskListID: cursor_value.taskListID,
		dueDate: cursor_value.dueDate,
		reminderDate: cursor_value.reminderDate,
		reminderTime: cursor_value.reminderTime,
		important: cursor_value.important,
		created: cursor_value.created
	};
	store.put(task);

	tx.oncomplete = function() { console.log(`Updated Task ${cursor_value.id} to the Tasks Store!`); }
	tx.onerror = function(event) {
		alert("Couldn't create new Task. Check console for more details");
		console.error('error storing task ' + event.target.errorCode);
	}
}

function putUpdateTaskViaModal(id, val, _completed){
	let tx = db.transaction('tasks', 'readwrite');
	let store = tx.objectStore('tasks');
	let task = {
		userID: parseInt(val.userID),
		id: parseInt(id),
		completed: _completed,
		title: val.title,
		description: val.description,
		taskListID: val.taskListID,
		dueDate: val.dueDate,
		reminderDate: val.reminderDate,
		reminderTime: val.reminderTime,
		important: !val.important,
		created: val.created
	}
	store.put(task);

	tx.oncomplete = function() {
		console.log(`Updated Task ${id} to the Tasks Store!`);
		taskCompleteModalInstance.close()
		if(window.location.hash.includes("important") ) getUserTasks(true)
		else if(window.location.hash.includes("L~")) getUserTasks(false, window.location.hash.split("L~")[1])
		else if(window.location.hash.includes("notes")) showNotes()
		else getUserTasks(false)
	}
	tx.onerror = function(event) {
		alert("Couldn't udpate Task. Check console for more details");
		console.error('error updating task ' + event.target.errorCode);
	}
}

function updateTaskViaModal(){
	var id = parseInt(document.getElementById("taskCompleteModalTaskID").value)
	var _completed = document.getElementById("taskCompleteAfterDueDateModal").checked
	
	var tx = db.transaction('tasks', 'readonly');
	var store = tx.objectStore('tasks');
	let req = store.get(id);

	req.onsuccess = function(val){
		putUpdateTaskViaModal(id, val.target.result, _completed)
	}
	req.onerror = function(event) {
		alert("Couldn't update Task. Check console for more details");
		console.error('error updating task ' + event.target.errorCode);
	}
}

function getUserTasksUIChanges(){
	if(!window.location.hash.includes("notes") || !window.location.hash.includes("L~")){
		var x = "<div class='task'>Hooray! No Tasks ✌🏽</div>"
		if(todayUserTasks.length === 0) document.getElementById("main_heading_1_container").innerHTML = x
		if(allUserTasks.length === 0) document.getElementById("main_heading_2_container").innerHTML = x
	}
}

function getUserNotesUIChanges(){
	if(window.location.hash.includes("notes")){
		var x = "<div class='task'>No Notes. Tap '+' to create a Note</div>"
		if(pinnedNotes.length === 0) document.getElementById("main_heading_1_container").innerHTML = x
		if(allUserNotes.length === 0) document.getElementById("main_heading_2_container").innerHTML = x
	}
}