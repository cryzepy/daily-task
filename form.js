function parseText(target) {
  const parse = parseInt(target);
  return isNaN(parse) ? 0 : parse;
}

function parseBool(t, b) {
  try {
    return new Boolean(JSON.parse(t));
  } catch (err) {
    return b || false;
  }
}

function convertToTime(time) {
  const day = ~~(time / 60000 / 60 / 24);
  const hour = ~~((time / 60000 / 60) % 24);
  const minute = ~~(((time / 60000) % 60) % 24);
  return { day, hour, minute };
}

function reverseConvertToTime(day, hour, minute) {
  const payload = {
    day: day * 8.64e7,
    hour: hour * 3.6e6,
    minute: minute * 60000,
  };

  return day * 8.64e7 + hour * 3.6e6 + minute * 60000 + Date.now();
}

function gapTime(f) {
  const gap = f - Date.now();
  return gap <= 0 ? 0 : gap;
}

function convertToCalender(time) {
  const target = new Date(Date.now() + time);

  const year = target.getFullYear().toString();
  const month = (target.getMonth() + 1).toString();
  const date = target.getDate().toString();
  const hour = target.getHours().toString();
  const minute = target.getMinutes().toString();

  return `${year}-${month.length > 1 ? month : "0" + month}-${
    date.length > 1 ? date : "0" + date
  }T${hour.length > 1 ? hour : "0" + hour}:${
    minute.length > 1 ? minute : "0" + minute
  }`;
}

function getminmaxpriority(data, idTarget) {
  const result = {};

  for (let task of data) {
    if (!task.checklist.status && !task.wait.status) {
      if (result.min === undefined || task.priority_level < result.min)
        result.min = task.priority_level;
      if (result.max === undefined || task.priority_level > result.max)
        result.max = task.priority_level;
    }
  }

  result.min = result.min ? (result.min < 0 ? 0 : result.min) : 0;
  result.max = result.max || 0;

  return result;
}

function toggleBtnWait(mode) {
  if (mode === "1") {
    $("#inp-wait-mode1").show();
    $("#inp-wait-mode2").hide();
  } else {
    $("#inp-wait-mode1").hide();
    $("#inp-wait-mode2").show();
  }
}

$(document).ready(function () {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  let mode = urlParams.get("mode") === "edit" ? "edit" : "add";
  const taskname = urlParams.get("taskname") || "";
  const timewait = parseText(urlParams.get("timewait"));
  const priority_level = parseText(urlParams.get("priority_level"));
  const id = urlParams.get("id");
  const data = view.readController();
  const range = getminmaxpriority(data.data);
  let waitmode = urlParams.get("waitmode") || "1";
  const checklist = parseBool(urlParams.get("cheklist"));
  const checklistTime = parseText(urlParams.get("ctime"));

  if (!id) mode = "add";

  function writeMain() {
    if (data.status === 200) {
      const gaptime = gapTime(timewait);

      const body = $("body");
      const container = $('<div class="container">');
      body.append(container);
      const inpContainer = $("<div class='input-container'>");
      container.append(inpContainer);
      const form = $('<div class="form">');
      inpContainer.append(form);
      const conTaskName = $('<div class="task-name">');
      form.append(conTaskName);
      const txtTaskName = $('<label for="task-name">Task Name</label>');
      conTaskName.append(txtTaskName);
      const inpTaskName = $(
        `<input type="text" id="task-name" autocomplete="off" value="${
          mode === "edit" ? taskname : ""
        }" />`
      );
      conTaskName.append(inpTaskName);
      if (mode === "edit") {
        const waitingTimes = $('<div class="waiting-time"></div>');
        form.append(waitingTimes);
        const txtWaiting = $("<label>Waiting Time</label>");
        waitingTimes.append(txtWaiting);
        const waitingContainer = $('<div class="input">');
        waitingTimes.append(waitingContainer);

        const waitChilld1 = $(`<div id="inp-wait-mode1">
            <input
              type="number"
              autocomplete="off"
              placeholder="day"
              min="0"
              max="180"
              id="inp-day"
              value="${convertToTime(gaptime).day}"
            />
        <label for="inp-day">Hari</label>
            <input
              type="number"
              autocomplete="off"
              placeholder="hour"
              min="0"
              max="4320"
              id="inp-hour"
              value="${convertToTime(gaptime).hour}"
            />
        <label for="inp-day">Jam</label>
            <input
              type="number"
              autocomplete="off"
              placeholder="minute"
              max="259200"
              id="inp-minute"
              value="${convertToTime(gaptime).minute}"
            />
        <label for="inp-day">Menit</label>
          </div>`);

        const waitChilld2 = $(`<div>
            <input
              type="datetime-local"
              id="inp-wait-mode2"
              value="${convertToCalender(gaptime)}"
            />
          </div>`);

        waitingContainer.append(waitChilld1);
        waitingContainer.append(waitChilld2);

        const btnContainer = $("<div class='btn-container'>")

        waitingContainer.append(btnContainer)

        const button = $(`<button class="switch" id="btn-inp-switch-wait-mode">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-toggles2"
            viewBox="0 0 16 16"
          >
            <path
              d="M9.465 10H12a2 2 0 1 1 0 4H9.465c.34-.588.535-1.271.535-2 0-.729-.195-1.412-.535-2z"
            />
            <path
              d="M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm.535-10a3.975 3.975 0 0 1-.409-1H4a1 1 0 0 1 0-2h2.126c.091-.355.23-.69.41-1H4a2 2 0 1 0 0 4h2.535z"
            />
            <path d="M14 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
          </svg>
          switch
        </button>`);
        btnContainer.append(button);
        toggleBtnWait(waitmode);

        const btnReset =
          $(`<button class="reset" id="btn-reset">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bootstrap-reboot" viewBox="0 0 16 16">
                <path d="M1.161 8a6.84 6.84 0 1 0 6.842-6.84.58.58 0 1 1 0-1.16 8 8 0 1 1-6.556 3.412l-.663-.577a.58.58 0 0 1 .227-.997l2.52-.69a.58.58 0 0 1 .728.633l-.332 2.592a.58.58 0 0 1-.956.364l-.643-.56A6.812 6.812 0 0 0 1.16 8z"/>
                <path d="M6.641 11.671V8.843h1.57l1.498 2.828h1.314L9.377 8.665c.897-.3 1.427-1.106 1.427-2.1 0-1.37-.943-2.246-2.456-2.246H5.5v7.352h1.141zm0-3.75V5.277h1.57c.881 0 1.416.499 1.416 1.32 0 .84-.504 1.324-1.386 1.324h-1.6z"/>
              </svg>
              reset
            </button>`);
        btnContainer.append(btnReset);
      }

      const priority = $(`<div class="priority">
          <label>Priority</label>
          <div class="actions">
          <button class="decrement" id="btn-decrement">-</button>
          <input type="number" id="inp-priority_level" value="${
            mode === "edit" ? priority_level : range.min
          }" disabled readonly />
          <button class="increment" id="btn-increment">+</button>
          </div>
        </div>
      </div>`);

      form.append(priority);

      if (mode === "edit") {
        const delCon = $("<div class='delete'>");
        const btnDelete = $(`<button class="del">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-trash"
              viewBox="0 0 16 16"
          >
            <path
            d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"
            />
            <path
            d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"
            />
          </svg>
          delete item
        </button>`);
        btnDelete.click(function () {
          view.deleteController({ id });
          window.location.href = "index.html";
        });
        delCon.append(btnDelete);
        inpContainer.append(delCon);
      }

      const actions = $(`<div class="actions">
        <button class='cancel' id="btn-cancel-form">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
        <button class="ok" id="btn-confirm-form">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
      </div>`);

      inpContainer.append(actions);

      $("#btn-confirm-form").click(function () {
        if (mode === "edit") {
          let time = Date.now() - 1;

          if (waitmode == "1") {
            telement = $("#inp-wait-mode1");
            const payload = {
              day: parseText($("#inp-day").val()),
              hour: parseText($("#inp-hour").val()),
              minute: parseText($("#inp-minute").val()),
            };

            time = reverseConvertToTime(
              payload.day,
              payload.hour,
              payload.minute
            );
          } else {
            time = new Date($("#inp-wait-mode2").val()).getTime();
          }

          const payload = {
            item_name: $("#task-name").val(),
            checklist: {
              status: checklist,
            },
            priority_level: parseText($("#inp-priority_level").val()),
            id: parseText(id),
            wait: { status: true, time },
          };

          if (checklist) {
            payload.checklist.time = checklistTime;
          }

          const send = view.updateController({
            target: { id: parseText(id) },
            data: payload,
          });

          if (send.status === 200) window.location.href = "index.html";
          else alert(send.message);
        } else {
          const send = view.createController({
            item_name: $("#task-name").val(),
            priority_level: parseText($("#inp-priority_level").val()),
          });

          if (send.status === 200) {
            window.location.href = "index.html";
          } else {
            alert(send.message);
          }
        }
      });

      $("#btn-cancel-form").click(function () {
        window.location.href = "index.html";
      });

      eventlistener();
    } else {
      window.location.href = "index.html";
    }
  }

  function eventlistener() {
    $("#btn-decrement").click(function () {
      try {
        const value = $("#inp-priority_level");
        const int = parseInt(value.val());
        if (int < range.min) {
          value.val(range.min - 1);
        } else {
          value.val(int - 1);
        }
      } catch (err) {}
    });

    $("#btn-increment").click(function () {
      try {
        const value = $("#inp-priority_level");
        const int = parseInt(value.val());
        if (int >= range.max) {
          value.val(range.max + 1);
        } else {
          value.val(int + 1);
        }
      } catch (err) {}
    });

    $("#btn-inp-switch-wait-mode").click(function () {
      waitmode = waitmode === "1" ? "0" : "1";
      toggleBtnWait(waitmode);
    });

    $("#btn-reset").click(function(){
      if(waitmode === "0"){
        const x = convertToCalender(0)
        $("#inp-wait-mode2").val(x)
        return
      }
      if(waitmode === "1"){
        $("#inp-day").val(0)
        $("#inp-hour").val(0)
        $("#inp-minute").val(0)
        return
      }
    })
  }

  writeMain();
});
