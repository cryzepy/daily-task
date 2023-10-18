class Databases {
  constructor() {
    this.dbname = "daily-task";
    this.dbencryption = "daily-task-enc";
    this.model = function (payload) {
      const itemnamemax = 128;

      const result = {
        status: 200,
        message: "",
        payload: {
          item_name: payload.item_name,
          checklist: payload.checklist,
          priority_level: payload.priority_level,
          id: payload.id,
          wait: payload.wait,
        },
      };

      // validasi item name
      if (payload.item_name === undefined) {
        result.status = 300;
        result.message = "empty item name";
        return result;
      }
      if (typeof payload.item_name != "string") {
        result.status = 300;
        result.message = "item name is not valid";
        return result;
      }
      if (payload.item_name.length > itemnamemax) {
        result.status = 300;
        result.message = "item name is too long";
        return result;
      }

      if (payload.item_name.length < 1) {
        result.status = 300;
        result.message = "item name is too short";
        return result;
      }

      // validasi checklist
      if (typeof payload.checklist != "object") {
        result.payload.checklist = {
          status: false,
        };
      }

      // validasi priority_level
      if (typeof payload.priority_level != "number") {
        result.payload.priority_level = 0;
      }

      // validasi id
      if (payload.id === undefined) {
        result.payload.id = Date.now();
      }

      // validasi wait
      if (typeof payload.wait != "object") {
        result.payload.wait = {
          status: false,
        };
      }

      result.status = 200;
      result.message = "sukses membuat model";

      return result;
    };
    this.validasidata = function (data) {
      let resdata = data;
      if (data === null) {
        return [];
      } else if (typeof data === "string") {
        try {
          const newdata = JSON.parse(data);
          resdata = newdata;
        } catch (err) {
          resdata = [];
        }
      } else if (typeof data === "object") {
        if (data.length === undefined) {
          resdata = [];
        }
      }

      // validasi beberapa element yang memiliki key tidak valid
      const datasementara = [];
      for (let i = 0; i < resdata.length; i++) {
        const item = resdata[i];
        const check = this.model(item);
        if (check.status === 200) {
          datasementara.push(check.payload);
        }
      }
      resdata = datasementara;

      return resdata;
    };

    this.migrations = function (data) {
      for (let i = 0; i < (data.length > 1 ? 1 : data.length); i++) {
        if (
          data[i].checklist.checklist === true ||
          data[i].checklist.checklist === false ||
          typeof data[i].checklist.checklist === "number" ||
          data[i].checklist.checklist === false
        ) {
          const newdata = data.map((task) => {
            const result = {
              item_name: task.item_name,
              checklist: {
                status: task.checklist.checklist,
              },
              priority_level: task.priority_level,
              id: task.id,
              wait: {
                status: false,
              },
            };

            if (result.checklist.status)
              result.checklist.time = task.checklist.time || Date.now();
            if (task.wait > 0) {
              result.wait.status = true;
              result.wait.time = task.wait;
            }

            return result;
          });

          return {
            changed: true,
            data: newdata,
          };
        }
      }

      return {
        changed: false,
        data: data,
      };
    };

    // migrasi
    const check = this.migrations(this.getlocal());
    if (check.changed) this.setlocal(check.data);

    this.getEncryption = function () {
      const result = { status: false };

      const dbname = this.dbencryption;
      const data = localStorage.getItem(dbname);

      if (!data) return result;

      try {
        const response = JSON.parse(data);

        if (typeof response != "object") return result;
        if (!response.binid) return result;
        if (!response.key) return result;

        return {
          status: true,
          data: {
            binid: response.binid,
            key: response.key,
          },
        };
      } catch (err) {
        return result;
      }
    };
  }

  getlocal() {
    const db = localStorage.getItem(this.dbname);
    return this.validasidata(db);
  }

  setlocal(newdata) {
    const validasi = this.validasidata(newdata);
    localStorage.setItem(this.dbname, JSON.stringify(validasi));
    return {
      status: 200,
      message: "Sukses mengubah data",
    };
  }

  getcloud() {
    const enc = this.getEncryption();

    if (!enc.status) {
      alert("you don't have access");
      return;
    }
    let req = new XMLHttpRequest();
    req.onreadystatechange = () => {
      if (req.readyState == XMLHttpRequest.DONE) {
        if (req.status == 200) {
          this.setlocal(JSON.parse(req.responseText).record);
          window.location.reload();
        } else {
          alert("FAILED GET DATA FROM SERVER");
        }
      }
    };

    req.open("GET", `https://api.jsonbin.io/v3/b/${enc.data.binid}`, true);
    req.setRequestHeader("X-Master-Key", enc.data.key);
    req.send();

    return 0;
  }

  setcloud() {
    const enc = this.getEncryption();

    if (!enc.status) {
      alert("you don't have access");
      return;
    }

    let req = new XMLHttpRequest();

    const data = this.getlocal()

    req.onreadystatechange = () => {
      if (req.readyState == XMLHttpRequest.DONE) {
        if (req.status == 200) {
          alert("SUCCESS UPDATE TO SERVER");
        } else {
          alert("FAILED UPDATE TO SERVER");
        }
      }
    };

    req.open("PUT", `https://api.jsonbin.io/v3/b/${enc.data.binid}`, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("X-Master-Key", enc.data.key);
    req.send(JSON.stringify(data));
    return 0;
  }
}

class Models extends Databases {
  constructor() {
    super();
    this.totalitem = 5;
    this.validasiquery = function (query) {
      const queryerror = {
        status: 300,
        message: "query error",
      };
      const queryvalid = {};
      if (!query) return queryerror;

      if (typeof query != "object") return queryerror;

      const model = this.model({ item_name: "example" });
      const queryentrie = Object.entries(query);

      if (queryentrie.length > this.totalitem) return queryerror;

      let wrongquery = 0;

      for (let i = 0; i < queryentrie.length; i++) {
        const [keyquery, valuequery] = queryentrie[i];
        if (model.payload[keyquery] === undefined) {
          wrongquery += 1;
        } else {
          queryvalid[keyquery] = valuequery;
        }

        if (wrongquery > 1) return queryerror;
      }

      return {
        status: 200,
        message: "query valid",
        query: queryvalid,
      };
    };
    this.getindex = function (db, query) {
      const res = {
        status: 300,
        message: "index not found",
      };
      let indexdeleted = -1;
      const qentrie = Object.entries(query);
      for (let i = 0; i < db.length; i++) {
        for (let j = 0; j < qentrie.length; j++) {
          const keyselected = qentrie[j][0];
          if (query[keyselected] != db[i][keyselected]) {
            continue;
          }
          indexdeleted = i;
        }
        if (indexdeleted != -1) {
          res.status = 200;
          res.message = "success get index";
          res.index = i;
          break;
        }
      }
      return res;
    };
  }

  createModel(payload) {
    const model = this.model(payload);
    if (model.status === 200) {
      const db = this.getlocal();
      db.push(model.payload);
      this.setlocal(db);
      return {
        status: 200,
        message: "success create new data",
      };
    }
    return model;
  }

  readModel(query) {
    const db = this.getlocal();
    const getall = () => {
      return {
        status: 200,
        message: "success get all data",
        data: db,
      };
    };

    if (query) {
      const q = this.validasiquery(query);
      if (q.status === 200) {
        const qentrie = Object.entries(q.query);

        if (qentrie.length < 1) {
          return getall();
        }

        const dbfilter = db.filter((item) => {
          let res = true;
          for (let i = 0; i < qentrie.length; i++) {
            const key = qentrie[i][0];
            if (q.query[key] != item[key]) {
              res = false;
            }
            if (!res) return false;
          }
          return res;
        });
        return {
          status: 200,
          message: "success get data",
          data: dbfilter,
        };
      }
      return q;
    }
    return getall();
  }

  deleteModel(query) {
    if (query) {
      const q = this.validasiquery(query);

      if (q.status === 200) {
        const qentrie = Object.entries(q.query);

        if (qentrie.length < 1) {
          return {
            status: 300,
            message: "error query",
          };
        }

        const db = this.getlocal();

        // mencari index dengan query terkirim
        const getindex = this.getindex(db, query);
        if (getindex.index >= 0) {
          db.splice(getindex.index, 1);
          this.setlocal(db);
          return {
            status: 200,
            message: "success deleted data",
          };
        }
        return {
          status: 300,
          message: "failed deleted data because query not matching",
        };
      }

      return q;
    }
    return {
      status: 300,
      message: "empty query",
    };
  }

  updateModel(targetq, newq) {
    if (targetq && newq) {
      const vtargetq = this.validasiquery(targetq);
      const vnewq = this.validasiquery(newq);

      if (vtargetq.status === 200 && vnewq.status === 200) {
        const tqentrie = Object.entries(vtargetq.query);

        if (tqentrie.length < 1) {
          return {
            status: 300,
            message: "query or target is not valid",
          };
        }

        const db = this.getlocal();
        // mencari index dengan query terkirim
        const getindex = this.getindex(db, vtargetq.query);
        if (getindex.index >= 0) {
          db[getindex.index] = {
            ...db[getindex.index],
            ...vnewq.query,
          };
          this.setlocal(db);
          return {
            status: 200,
            message: "success upadated data",
          };
        }

        return {
          status: 300,
          message: "failed updated data because query not matching",
        };
      }
      return q;
    }

    return {
      status: 300,
      message: "query or target is not valid",
    };
  }

  setcloudModel() {
    return this.setcloud();
  }

  getcloudModel() {
    return this.getcloud();
  }
}

class Controllers extends Models {
  constructor() {
    super();
  }

  createController(payload) {
    return this.createModel(payload);
  }

  readController(query) {
    return this.readModel(query);
  }

  deleteController(payload) {
    return this.deleteModel(payload);
  }

  updateController(payload) {
    return this.updateModel(payload.target, payload.data);
  }

  setcloudController() {
    return this.setcloudModel();
  }

  getcloudController() {
    return this.getcloudModel();
  }
}

class Views extends Controllers {
  constructor() {
    super();
    this.data = (query = {}) => {
      return this.readController(query);
    };
    this.container = $("#tasks");
  }
  get main() {
    const data = this.data();

    if (data.status != 200) {
      this.container.html(
        `<span class="notask-label">Failed get tasks in databases</span>`
      );
    } else if (data.data.length === 0) {
      this.container.html(`<span class="notask-label">No Task :)</span>`);
    } else {
      const parsedata = this.datadiv(data);

      let lenactive = 0;

      parsedata.priority_level.forEach((tasks) => {
        const ul = $("<ul class='active'></ul>");
        this.container.append(ul);
        tasks.forEach((task) => {
          lenactive++;
          const li = this.createlielement(task);
          ul.append(li);

          this.checklistToggle(li, task.id, task.checklist.status);
        });
      });

      const ulw = $("<ul class='task-waiting'></ul>");
      this.container.append(ulw);
      parsedata.wait.forEach((task) => {
        ulw.append(this.createlielement(task));
      });

      const ulc = $("<ul class='task-completed'></ul>");
      this.container.append(ulc);
      parsedata.checklist.forEach((task) => {
        const el = this.createlielement(task);
        ulc.append(el);

        this.checklistToggle(el, task.id, task.checklist.status);
      });

      if (lenactive || parsedata.wait.length || parsedata.checklist.length) {
        $("#content").append(`<ul class="task-info">

        ${lenactive ? `<li><span>${lenactive}</span> active task</li>` : ""}
        ${
          parsedata.wait.length
            ? `<li><span>${parsedata.wait.length}</span> task waiting</li>`
            : ""
        }
        ${
          parsedata.checklist.length
            ? `<li><span>${parsedata.checklist.length}</span> task completed</li>`
            : ""
        }
      </ul>`);
      }
    }

    this.eventlistener();
    this.cekFinishedWaiting();
  }

  datadiv(data) {
    const newdata = {
      priority_level: [],
      wait: [],
      checklist: [],
    };

    for (let task of data.data) {
      if (task.checklist.status) {
        newdata.checklist.push(task);
      } else if (task.wait.status) {
        newdata.wait.push(task);
      } else {
        newdata.priority_level.push(task);
      }
    }

    newdata.wait.sort((task1, task2) =>
      task1.wait.time > task2.wait.time ? 1 : -1
    );
    newdata.checklist.sort((task1, task2) =>
      task1.item_name > task2.item_name ? 1 : -1
    );

    const x = [...newdata.priority_level].sort((task1, task2) =>
      task1.priority_level > task2.priority_level ? -1 : 1
    );
    newdata.priority_level = [];

    let cp;
    let c_index = -1;

    for (let task of x) {
      if (task.priority_level != cp) {
        cp = task.priority_level;
        c_index += 1;
        newdata.priority_level[c_index] = new Array();
      }
      newdata.priority_level[c_index].push(task);
    }

    return newdata;
  }

  parseTime(target) {
    const now = Date.now();
    const gap = target - now;

    const day = parseInt(gap / 1000 / 60 / 60 / 24);
    const hour = parseInt((gap / 1000 / 60 / 60) % 24);
    const minute = parseInt(((gap / 1000 / 60) % 60) % 24);

    if (!day && !hour && !minute) return "Beberapa saat lagi";

    return `${day ? day + " Hari " : ""}${hour ? hour + " Jam " : ""}${
      minute ? minute + " Menit " : ""
    }`;
  }

  createlielement(task) {
    const result = this.checkTomorrow(task);

    const container = $("<li></li>");
    const label = $(`<div class="label">
      <span class=${
        task.wait.status
          ? "wait"
          : task.checklist.status
          ? "checklist"
          : "normal"
      }>${task.item_name}</span>
      ${
        task.wait.status
          ? `<span class="time">${this.parseTime(task.wait.time)}</span>`
          : ""
      }
    </div>`);

    const action = $('<div class="action">');
    const button = $(`<button>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      class="bi bi-pencil-fill"
      viewBox="0 0 16 16"
    >
      <path
        d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"
      />
    </svg>
  </button>`);

    container.append(label);
    container.append(action);
    action.append(button);

    button.click(function () {
      window.location.href = `form.html?mode=edit&id=${task.id}&taskname=${
        task.item_name
      }&timewait=${task.wait.time || 0}&priority_level=${
        task.priority_level
      }&cheklist=${task.checklist.status}${
        task.checklist.status ? `&ctime=${task.checklist.time}` : ""
      }`;
    });

    return container;
  }

  checklistToggle(el, id, checklist) {
    el.dblclick(() => {
      const payload = {};

      if (checklist) {
        payload.checklist = { status: false };
      } else {
        payload.checklist = {
          status: true,
          time: Date.now(),
        };
      }

      this.updateController({
        target: { id },
        data: payload,
      });
      location.reload();
    });
  }

  eventlistener() {
    $("#btn-create").click(function () {
      window.location = "form.html?mode=add";
    });

    $(document).ready(() => {
      setInterval(() => {
        this.cekFinishedWaiting();
      }, 60000);
    });

    $("#btn-get-data-cloud").dblclick(() => {
      this.getcloudController();
    });

    $("#btn-set-data-cloud").dblclick(() => {
      this.setcloudController();
    });

    $("#btn-insert-key").click(function () {
      const binid = prompt("insert binid");
      const key = prompt("insert key");

      localStorage.setItem("daily-task-enc", JSON.stringify({ binid, key }));
    });
  }

  cekFinishedWaiting() {
    const response = this.readController();
    if (response.status === 200) {
      const data = response.data;
      let index = 0;
      let change = false;
      for (let task of data) {
        const datenow = Date.now();
        if (task.wait.status && task.wait.time <= datenow) {
          change = true;
          const x = this.updateController({
            target: { id: task.id },
            data: {
              ...data[index],
              wait: false,
            },
          });
        }
        index++;
      }
      if (change) window.location.reload();
    }
  }

  checkTomorrow(task) {
    let change = false;

    // checklist
    if (task.checklist.status) {
      const tCheckList = new Date(task.checklist.time);
      const tGap = new Date(
        tCheckList.getFullYear(),
        tCheckList.getMonth(),
        tCheckList.getDate(),
        23,
        59
      );

      if (Date.now() > tGap.getTime()) {
        this.updateController({
          target: { id: task.id },
          data: {
            ...task,
            checklist: {
              status: false,
            },
          },
        });
        change = true;
      }
    }

    return change;
  }
}

const db = new Databases();
const model = new Models();
const controller = new Controllers();
const view = new Views();

view.main;
