const container_daftar_items = document.getElementById('daftar-items')
const add_item = document.getElementById('add-item')
const set_data = document.getElementById('set-data')
const get_data = document.getElementById('get-data')
const root = document.querySelector('body')
const index = root.id == 'index';

const X_MASTER_KEY = "for private";
const BIN_ID = "for private";

add_item.addEventListener('click',() => {
	create_element_input('add')
})

set_data.addEventListener('dblclick',() => {
	set_to_server()
})

get_data.addEventListener('dblclick',() => {
	get_from_server()
})


// FUNCTION 
// DATA
function get_data_storage(){
	const data = localStorage.getItem('daily-task');

	const ambil = data ? JSON.parse(data) : new Array();

	const ceklistEsok = cekChecklist(ambil);

	// cek data checklist yang belum valid
	const result = ceklistEsok.map(item => {

		const convert = typeof item.checklist === 'boolean' ? item.checklist ? {checklist: true, time: Date.now()} : {checklist: false} : item.checklist

		return {
			...item,
			checklist: convert
		}
	})

	

	return result;
}

function data_wait_or_no(data,wait){
	return data
	.map(item => {
		if(waitIsFinish(item.wait)){
			item.wait = 0
		}
		return item
	})
	.filter(item => wait ? item.wait > 0 : item.wait <= 0)
}

function set_data_storage(data){
	if(data){
		localStorage.setItem('daily-task',typeof data == 'string' ? data : JSON.stringify(data))
	}
}

function edit_data(item_name,checklist,priority_level,id,wait){

	validasiInputLabel(item_name)

	const data = get_data_storage()

	return data.map(item => {
		if(item.id == id){
			return {
				item_name,
				checklist,
				priority_level,
				id,
				wait
			}
		}
		return item
	})
}

function add_data(item_name){

	validasiInputLabel(item_name)

	const data_awal = get_data_storage()
	const list_id = data_awal.map(x => x.id)

	data_awal.push({
		item_name,
		checklist: { checklist: false },
		priority_level: 0,
		id: buat_ID(list_id),
		wait: 0
	})

	return data_awal
}

function delete_data(id){
	return get_data_storage().filter(item => item.id != id)
}

function sort_data(data){
	const priority_level = data.sort((x,y) => x.priority_level - y.priority_level).reverse()
	const checklist = priority_level.filter(x => {if(!x.checklist.checklist) return x}).concat(data.filter(x => {if(x.checklist.checklist) return x}))
	return checklist
}

function set_to_server(){
	let req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.DONE) {

            if (req.status == 200) {
                alert('SUCCESS UPDATE TO SERVER')
            } else {
                alert('FAILED UPDATE TO SERVER')
            }
        }
    };

    req.open("PUT", `https://api.jsonbin.io/v3/b/${BIN_ID}`, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("X-Master-Key", X_MASTER_KEY);
    req.send(JSON.stringify(get_data_storage()))
	return 0
}

function get_from_server(){

	let req = new XMLHttpRequest();
    req.onreadystatechange = () => {

        if (req.readyState == XMLHttpRequest.DONE) {

        	if (req.status == 200) {
            	set_data_storage(JSON.parse(req.responseText).record)
                reload()
            } else {
                alert('FAILED GET DATA FROM SERVER')
            }
        }
    };

    req.open("GET", `https://api.jsonbin.io/v3/b/${BIN_ID}`, true);
    req.setRequestHeader("X-Master-Key", X_MASTER_KEY);
    req.send();

    return 0
}

// hapus ceklist jika sudah hari besok
function cekChecklist(data){
	return data.map(item => {

		if(item.checklist.checklist){
			const waktuItem = new Date(item.checklist.time);
			const waktuEsok = new Date(waktuItem.getFullYear(),waktuItem.getMonth(),waktuItem.getDate() + 1);

			console.log('waktu sekarang')
			console.log(Date.now())
			console.log('waktu waktu item')
			console.log(item.checklist.time)

			if(Date.now() < item.checklist.time || Date.now() >= waktuEsok.getTime()){
				return {...item, checklist: { checklist: false }};
			}

		}

	return item

	})
}


// HTML
function innerHTML(data){
	const container = container_daftar_items

	const priority2 = data.filter(item => item.priority_level == 2 && !item.checklist.checklist)
	const priority1 = data.filter(item => item.priority_level == 1 && !item.checklist.checklist)
	const priority0 = data.filter(item => item.priority_level == 0 && !item.checklist.checklist)
	const checklist = data.filter(item => item.checklist.checklist)

	if(priority2.length){
		const div = document.createElement('div')
		priority2.forEach(item => {
			div.appendChild(buat_element(item))
		})
		container.appendChild(div)
	}
	if(priority1.length){
		const div = document.createElement('div')
		priority1.forEach(item => {
			div.appendChild(buat_element(item))
		})
		container.appendChild(div)
	}
	if(priority0.length){
		const div = document.createElement('div')
		priority0.forEach(item => {
			div.appendChild(buat_element(item))
		})
		container.appendChild(div)
	}
	if(checklist.length){
		const div = document.createElement('div')
		checklist.forEach(item => {
			div.appendChild(buat_element(item))
		})
		container.appendChild(div)
	}
}

function buat_element(items){
	const li = document.createElement('li')

	const span = document.createElement('span')
	li.appendChild(span)
	span.innerText = items.item_name
	li.style.fontStyle = items.checklist.checklist ? 'italic' : 'normal'
	li.style.color = items.checklist.checklist ? 'gray' : 'black'

	const checkbox = document.createElement('i')
	li.appendChild(checkbox)
	checkbox.addEventListener('dblclick', e => {
		set_data_storage(edit_data(items.item_name,{checklist: !items.checklist.checklist, time: Date.now()},items.priority_level,items.id,items.wait))
		reload()
	})

	const div = document.createElement('div')
	li.appendChild(div)

	const i3 = document.createElement('i')
	div.appendChild(i3)
	i3.innerText = 'W'
	i3.addEventListener('click',() => {
		if(waitIsFinish(items.wait)){
			create_element_input('wait',items)
		}else{
			set_data_storage(edit_data(items.item_name,items.checklist,items.priority_level,items.id, 0))
			reload()
		}
	})

	if(items.priority_level == 1 && index){
		const i = document.createElement('i')
		div.appendChild(i)
		i.innerText = '+'
		i.addEventListener('click',() => {
			set_data_storage(edit_data(items.item_name,items.checklist,++items.priority_level,items.id,items.wait))
			reload()
		})
		const i2 = document.createElement('i')
		div.appendChild(i2)
		i2.innerText = '-'
		i2.addEventListener('click',() => {
			set_data_storage(edit_data(items.item_name,items.checklist,--items.priority_level,items.id,items.wait))
			reload()
		})

	}else if(index){
		const item_condition = items.priority_level == 0
		const i = document.createElement('i')
		div.appendChild(i)
		i.innerText =  item_condition ? '+' : '-'
		i.addEventListener('click',() => {
			set_data_storage(edit_data(items.item_name,items.checklist,item_condition ? ++items.priority_level : --items.priority_level,items.id,items.wait))
			reload()
		})
	}

	const edit = document.createElement('i')
	div.appendChild(edit)
	edit.innerText = 'E'
	edit.addEventListener('click',() => {
		create_element_input('edit',items)
	})

	const hapus = document.createElement('i')
	div.appendChild(hapus)
	hapus.innerText = 'x'
	hapus.addEventListener('click',() => {
		set_data_storage(delete_data(items.id))
		reload()
	})

	return li
}

function create_element_input(type,item){
	const container = document.querySelector('body')

	const input_container = document.createElement('div')
	input_container.classList.add('input-container')
	container.appendChild(input_container)

	const input_box = document.createElement('div')
	input_box.classList.add('input-box')
	input_container.appendChild(input_box)

	const i = document.createElement('i')
	i.innerText = 'X'
	i.addEventListener('click',() => {
		input_container.remove()
	})
	input_box.appendChild(i)

	const input = document.createElement('input')
	const button = document.createElement('button')

	if(type === 'add'){
		input.type = 'text'
		input.placeholder = 'Input Items'
		button.innerText = 'add'
	}else if(type === 'edit'){
		input.type = 'text'
		input.value = item.item_name
		input.placeholder = 'Input Items'
		button.innerText = 'edit'
	}else{
		const span = document.createElement('span')
		input_box.appendChild(span)
		input.type = 'range'
		input.min = 1
		input.max = 210
		input.step = 1
		input.value = 0
		span.innerText = convertWaktuMenit(+input.value)
		button.innerText = 'wait'
		input.addEventListener('touchmove', () => {
			span.innerText = convertWaktuMenit(+input.value)
		})
		input.addEventListener('mousemove', () => {
			span.innerText = convertWaktuMenit(+input.value)
		})
	}

	button.addEventListener('click',() => {
		if(type === 'edit'){
			set_data_storage(edit_data(input.value,item.checklist,item.priority_level,item.id,item.wait))
		}else if(type === 'add'){
			set_data_storage(add_data(input.value))
		}else{
			set_data_storage(edit_data(item.item_name,item.checklist,item.priority_level,item.id, +input.value * 60000 + Date.now()))
		}
		reload()
	})

	input_box.appendChild(input)
	input_box.appendChild(button)
}

function reload(){
	return window.location.reload()
}


// LOGIC
function buat_ID(ids){
	let id = 0

	ids = [...new Set(ids.sort((x,y) => x - y))]

	for(let i = 0; i < ids.length; i++){
		if (id != ids[i]){
			break
		}else{
			id++  
		}
	}

	return id
}

function waitIsFinish(time){
	return time < Date.now() ? true : false
}

function validasiInputLabel(label){
	if(label.trim().length == 0){
		throw new Error()
	}
}

function convertWaktuMenit(time){
	if(time < 60){
		return `${time} Menit`
	}else{
		const jam = ~~(time/60)
		const menit = time%60
		return `${jam ? jam + ' Jam' : ''} ${menit ? menit + ' Menit' : ''}`
	}
}


innerHTML(sort_data(data_wait_or_no(get_data_storage(),root.id == 'wait' ? true : false)))