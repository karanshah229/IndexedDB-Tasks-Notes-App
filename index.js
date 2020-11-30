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
		if(window.location.hash == "#important") getUserTasks(true)
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
		userID: parseInt(data.userID),
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
	ele.classList.add('nav_item');
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
		if (cursor != null) {
			if(cursor.value.userID === currentUserID){
				userLists.push(cursor.value)
				// Push to Side Nav
				var ele = document.createElement('div');
				ele.classList.add('nav_item');
				ele.style.paddingLeft = '2rem';
				ele.textContent = cursor.value.title;
				document.getElementById("user_lists").append(ele);
				
				// Push to Create Task Select Button
				ele = document.createElement('option');
				ele.value = cursor.value.id;
				ele.textContent = cursor.value.title;
				document.getElementById("create_task_listID").append(ele);

				// Push to Update Task Select Button
				ele = document.createElement('option');
				ele.value = cursor.value.id;
				ele.textContent = cursor.value.title;
				document.getElementById("update_task_listID").append(ele);
			}
			cursor.continue();
		} else {
			if(window.location.hash == "#important") getUserTasks(true)
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
		else getUserLists();
	}
	req.onerror = function(event){
		alert("Couldn't fetch lists. Check console for more details");
		console.error("error displaying lists " + event.target.errorCode);
	}
}

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
				var div8 = document.createElement("div")
				div8.className = "taskDetails"
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

function getUserTasks(imp){
	userTasks = [], todayUserTasks = [], allUserTasks = []
	document.getElementById("my_day_tasks").innerHTML = ""
	document.getElementById("all_tasks").innerHTML = ""
	var tx = db.transaction('tasks', 'readonly');
	var store = tx.objectStore('tasks');

	var req = store.openCursor();

	req.onsuccess = function(event){
		let cursor = event.target.result;
		if (cursor != null && cursor.value.userID === currentUserID) {
			userTasks.push(cursor.value)
			if(imp === true && cursor.value.important === true){
				var x = getTaskTemplate(cursor)
				var taskTime = cursor.value.dueDate.toString().split("-")
				var d = new Date()
				if( taskTime[0] == d.getDate() && taskTime[1] == d.getMonth()+1 && taskTime[2] == d.getFullYear() ){
					// Today
					todayUserTasks.push(cursor.value)
					document.getElementById("my_day_tasks").append(x)
				} else if( taskTime[0] > d.getDate() || taskTime[1] > d.getMonth()+1 || taskTime[2] > d.getFullYear() ) {
					// Later
					document.getElementById("all_tasks").append(x)
					allUserTasks.push(cursor.value)
				}
			} else if(imp === false) {
				var x = getTaskTemplate(cursor)
				var taskTime = cursor.value.dueDate.toString().split("-")
				var d = new Date()
				if( taskTime[0] == d.getDate() && taskTime[1] == d.getMonth()+1 && taskTime[2] == d.getFullYear() ){
					// Today
					todayUserTasks.push(cursor.value)
					document.getElementById("my_day_tasks").append(x)
				} else if( taskTime[0] > d.getDate() || taskTime[1] > d.getMonth()+1 || taskTime[2] > d.getFullYear() ) {
					// Later
					document.getElementById("all_tasks").append(x)
					allUserTasks.push(cursor.value)
				}
			}
			cursor.continue();
		} else playReminder()
	}
	req.onerror = function(event){
		alert("Couldn't fetch tasks. Check console for more details");
		console.error("error displaying tasks " + event.target.errorCode);
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

function playReminder(){
	var audio = new Audio('/audio/task_complete.mp3');
	setInterval(function(){
		todayUserTasks.forEach(function(item, index){
			var d = new Date()
			var taskTime = item.reminderTime.toString().split(":")
			if(!item.completed && taskTime[0] == d.getHours() && taskTime[1] == d.getMinutes() && d.getSeconds() == 0){
				audio.play();

				let elem = document.querySelector('#taskCompleteModal');
				taskCompleteModalInstance = M.Modal.init(elem, { dismissible: false })
				document.getElementById("taskCompleteModalTaskID").value = item.id;
				document.getElementById("taskCompleteModalTaskTitle").textContent = `Were you able to complete: ${item.title} ?`
				taskCompleteModalInstance.open()
			}
		})
	}, 990)
}

// function getUserTasksUIChanges(){
// 	console.log(todayUserTasks)
// 	console.log(allUserTasks)
// 	var x = "<div class='task'>Hooray! No Tasks ✌🏽</div>"
// 	if(todayUserTasks.length === 0) document.getElementById("my_day_tasks").innerHTML = x
// 	if(allUserTasks.length === 0) document.getElementById("all_tasks").innerHTML = x
// }