class Databases {
	constructor(){
		this.dbname = "daily-task"
		this.model = function(payload){

			const itemnamemax = 128

			const result = {
				status: 200,
				message: "",
				payload: {
					item_name: payload.item_name,
					checklist: payload.checklist,
					priority_level: payload.priority_level,
					id: payload.id,
					wait: payload.wait
				}
			}
			
			// validasi item name
			if(payload.item_name === undefined){
				result.status = 300
				result.message = "empty item name"
				return result
			}
			if(typeof payload.item_name != "string"){
				result.status = 300
				result.message = "item name is not valid"
				return result
			}
			if(payload.item_name.length > itemnamemax){
				result.status = 300
				result.message = "item name is too long"
				return result
			}

			if(payload.item_name.length < 1){
				result.status = 300
				result.message = "item name is too short"
				return result
			}


			// validasi checklist
			if(typeof payload.checklist != "boolean"){
				result.payload.checklist = false
			}

			// validasi priority_level
			if(typeof payload.priority_level != "number"){
				result.payload.priority_level = 0
			}

			// validasi id 
			if(payload.id === undefined){
				result.payload.id = Date.now()
			}

			// validasi wait
			if(typeof payload.wait != "boolean"){
				result.payload.wait = false
			}

			result.status = 200
			result.message = "sukses membuat model"

			return result
		}
		this.validasidata = function(data){
			let resdata = data
			if(data === null){
				return []
			}else if(typeof data === "string"){
				try {
					const newdata = JSON.parse(data)
					resdata = newdata
				} catch(err) {
					resdata = []
				}
			}else if(typeof data === "object"){
				if(data.length === undefined){
					resdata = []
				}
			}

			// validasi beberapa element yang memiliki key tidak valid
			const datasementara = []
			for(let i = 0; i < resdata.length; i++){
				const item = resdata[i]
				const check = this.model(item)
				if(check.status === 200){
					datasementara.push(check.payload)
				}
			}
			resdata = datasementara

			return resdata
		}
	}

	getlocal(){
		const db = localStorage.getItem(this.dbname)
		return this.validasidata(db)
	}

	setlocal(newdata){
		const validasi = this.validasidata(newdata)
		localStorage.setItem(this.dbname,JSON.stringify(validasi))
		return {
			status: 200,
			message: "Sukses mengubah data"
		}
	}

	get cloud(){

	}

	set cloud(payload){

	}
}

class Models extends Databases {

	constructor(){
		super()
		this.totalitem = 5
		this.validasiquery = function(query){

			const queryerror = {
				status: 300,
				message: "query error"
			}
			const queryvalid = {}
			if(!query) return queryerror

			if(typeof query != "object") return queryerror

			const model = this.model({ item_name: "example" })
			const queryentrie = Object.entries(query)

			if(queryentrie.length > this.totalitem) return queryerror

			let wrongquery = 0

			for(let i = 0; i < queryentrie.length; i++){
				const [keyquery,valuequery] = queryentrie[i]
				if(model.payload[keyquery] === undefined){
					wrongquery += 1
				}else{
					queryvalid[keyquery] = valuequery
				}

				if(wrongquery > 1) return queryerror
			}	

			return {
				status: 200,
				message: "query valid",
				query: queryvalid
			}
		}
		this.getindex = function(db,query){
			const res = {
				status: 300,
				message: "index not found",
			}
			let indexdeleted = -1
			const qentrie = Object.entries(query)
			for(let i = 0; i < db.length; i++){
				for(let j = 0; j < qentrie.length; j++){
					const keyselected = qentrie[j][0]
					if(query[keyselected] != db[i][keyselected]){
						continue
					}
					indexdeleted = i
				}
				if(indexdeleted != -1){
					res.status = 200
					res.message = "success get index"
					res.index = i
					break
				}
			}
			return res
		}
	}

	createModel(payload){
		const model = this.model(payload)
		if(model.status === 200){
			const db = this.getlocal()
			db.push(model.payload)
			this.setlocal(db)
			return {
				status: 200,
				message: "success create new data"
			}
		}
		return model
	}

	readModel(query){
		const db = this.getlocal()
		const getall = () => {
			return {
				status: 200,
				message: "success get all data",
				data: db
			}
		}

		if(query){
			const q = this.validasiquery(query)
			if(q.status === 200){
				const qentrie = Object.entries(q.query)

				if(qentrie.length < 1){
					return getall()
				}

				const dbfilter = db.filter(item => {
					let res = true
					for(let i = 0; i < qentrie.length; i++){
						const key = qentrie[i][0]
						if(q.query[key] != item[key]){
							res = false
						}
						if(!res) return false
					}
					return res
				})
				return {
					status: 200,
					message: "success get data",
					data: dbfilter
				}
			}
			return q
		}
		return getall()
	}

	deleteModel(query){

		if(query){
			const q = this.validasiquery(query)

			if(q.status === 200){

				const qentrie = Object.entries(q.query)

				if(qentrie.length < 1){
					return {
						status: 300,
						message: "error query"
					}
				}

				const db = this.getlocal()

				// mencari index dengan query terkirim
				const getindex = this.getindex(db,query)
				if(getindex.index >= 0){
					db.splice(getindex.index,1)
					this.setlocal(db)
					return {
						status: 200,
						message: "success deleted data"
					}
				}
				return {
					status: 300,
					message: "failed deleted data because query not matching"
				}
			}

			return q
		}
		return {
			status: 300,
			message: "empty query"
		}
	}

	updateModel(targetq,newq){


		if(targetq && newq){
			const vtargetq = this.validasiquery(targetq)
			const vnewq = this.validasiquery(newq)

			if(vtargetq.status === 200 && vnewq.status === 200){

				const tqentrie = Object.entries(vtargetq.query)

				if(tqentrie.length < 1){
					return {
						status: 300,
						message: "query or target is not valid"
					}
				}

				const db = this.getlocal()
				// mencari index dengan query terkirim
				const getindex = this.getindex(db,vtargetq.query)
				if(getindex.index >= 0){
					db[getindex.index] = {
						...db[getindex.index],
						...vnewq.query
					}
					this.setlocal(db)
					return {
						status: 200,
						message: "success upadated data"
					}
				}

				return {
					status: 300,
					message: "failed updated data because query not matching"
				}
			}
			return q
		}

		return {
			status: 300,
			message: "query or target is not valid"
		}
	}

}

class Controllers extends Models {

	constructor(){
		super()
	}

	set createController(payload){
	}

	readController(query){
		return this.readModel(query)	
	} 

	set deleteController(payload){
	}

	set updateController(payload){
	}

}

class Views extends Controllers {
	constructor(){
		super()
		this.root = $("body")
	}

	status(){
		
	}

}

const db = new Databases()
const model = new Models()
const controller = new Controllers()
const view = new Views()

// model.createModel({ item_name: "Belajar React Native" })
// model.deleteModel({ id: 1693471635333 })
// model.updateModel({ id: 1693473459237 }, { priority_level: 333 })

// function set_to_server(){
// 	let req = new XMLHttpRequest();
//     req.onreadystatechange = () => {
//         if (req.readyState == XMLHttpRequest.DONE) {

//             if (req.status == 200) {
//                 alert('SUCCESS UPDATE TO SERVER')
//             } else {
//                 alert('FAILED UPDATE TO SERVER')
//             }
//         }
//     };

//     req.open("PUT", `https://api.jsonbin.io/v3/b/${BIN_ID}`, true);
//     req.setRequestHeader("Content-Type", "application/json");
//     req.setRequestHeader("X-Master-Key", X_MASTER_KEY);
//     req.send(JSON.stringify(db.getlocal))
// 	return 0
// }

// function get_from_server(){

// 	let req = new XMLHttpRequest();
//     req.onreadystatechange = () => {

//         if (req.readyState == XMLHttpRequest.DONE) {

//         	if (req.status == 200) {
//             	db.setlocal(JSON.parse(req.responseText).record)
//                 reload()
//             } else {
//                 alert('FAILED GET DATA FROM SERVER')
//             }
//         }
//     };

//     req.open("GET", `https://api.jsonbin.io/v3/b/${BIN_ID}`, true);
//     req.setRequestHeader("X-Master-Key", X_MASTER_KEY);
//     req.send();

//     return 0
// }