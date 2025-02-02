// js/table.js

// 祝日データやテーブル行番号用の変数
let holidays = [];
let rowNumber = 1;

// 指定された年・月の営業日リスト生成
function generateBusinessDayList(year, month) {
  // ※以前は以下の行で現在の選択月以外のlocalStorageデータをリセットしていましたが、
  //     前回入力内容を保持するため、この呼び出しを削除しています。
  // resetLocalStorageForOtherMonths(year, month);

  fetch('https://holidays-jp.github.io/api/v1/' + year + '/date.json')
    .then(response => response.json())
    .then(data => {
      holidays = Object.keys(data);
      createTable(year, month);
    })
    .catch(error => {
      console.error("祝日データ取得エラー:", error);
      holidays = [];
      createTable(year, month);
    });
  localStorage.setItem("lastOpenedMonth", JSON.stringify({ year: year, month: month }));
}

// テーブルの作成
function createTable(year, month) {
  const tbody = document.getElementById("workTableBody");
  tbody.innerHTML = "";
  rowNumber = 1;
  
  // デフォルト設定の取得
  const defaultWorkPlace = document.getElementById('defaultWorkPlace').value || "";
  const defaultStartTime = document.getElementById('defaultStartTime').value || "";
  const defaultEndTime = document.getElementById('defaultEndTime').value || "";
  const defaultBreakTime = document.getElementById('defaultBreakTime').value || "0";
  const defaultWorkContent = document.getElementById('defaultWorkContent').value || "";
  const defaultStatus = document.getElementById('defaultStatus').value || "稼働";

  const savedData = loadDataFromLocalStorage(year, month);
  
  // 当月の初日～末日
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0);
  
  if (savedData && Array.isArray(savedData) && savedData.length > 0) {
    savedData.forEach((rowObj, index) => {
      const tr = document.createElement("tr");
      tr.dataset.rowIndex = index + 1;
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td class="readonly">${rowObj.date}</td>
        <td>
          <select class="status">
            <option value="稼働" ${rowObj.status === "稼働" ? "selected" : ""}>稼働</option>
            <option value="非稼働" ${rowObj.status === "非稼働" ? "selected" : ""}>非稼働</option>
          </select>
        </td>
        <td><input type="text" class="workPlace" placeholder="作業場所" value="${rowObj.workPlace}"></td>
        <td><input type="time" class="startTime" step="1800" value="${rowObj.startTime}"></td>
        <td><input type="time" class="endTime" step="1800" value="${rowObj.endTime}"></td>
        <td><input type="number" class="breakTime" min="0" step="30" value="${rowObj.breakTime}" style="width:60px;">分</td>
        <td class="workTime">${rowObj.workTime}</td>
        <td><input type="text" class="workContent" placeholder="作業内容" value="${rowObj.workContent}"></td>
      `;
      tbody.appendChild(tr);
      updateRowStyle(tr);
    });
  } else {
    let index = 0;
    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateForComparison(d);
      const dayOfWeek = d.getDay();
      // 休日（週末または祝日）はスキップ
      // if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.includes(dateStr)) continue;
      index++;
      const formattedDate = formatJapaneseDate(d);
      const tr = document.createElement("tr");
      tr.dataset.rowIndex = index;
      tr.innerHTML = `
        <td>${index}</td>
        <td class="readonly">${formattedDate}</td>
        <td>
          <select class="status">
            <option value="稼働" selected>稼働</option>
            <option value="非稼働">非稼働</option>
          </select>
        </td>
        <td><input type="text" class="workPlace" placeholder="作業場所" value="${defaultWorkPlace}"></td>
        <td><input type="time" class="startTime" step="1800" value="${defaultStartTime}"></td>
        <td><input type="time" class="endTime" step="1800" value="${defaultEndTime}"></td>
        <td><input type="number" class="breakTime" min="0" step="30" value="${defaultBreakTime}" style="width:60px;">分</td>
        <td class="workTime">00:00</td>
        <td><input type="text" class="workContent" placeholder="作業内容" value="${defaultWorkContent}"></td>
      `;
      tbody.appendChild(tr);
    }
  }
  
  // 各行の作業時間再計算
  document.querySelectorAll("#workTableBody tr").forEach(tr => {
    calculateRowWorkTime(tr);
  });
  calculateTotalWorkTime();
  saveCurrentData();
}

// 1行の作業時間の計算（Excel 数式に合わせ、常に60分控除）
function calculateRowWorkTime(tr) {
  const status = tr.querySelector(".status").value;
  const startInput = tr.querySelector(".startTime");
  const endInput = tr.querySelector(".endTime");
  const breakInput = tr.querySelector(".breakTime");
  const workTimeCell = tr.querySelector(".workTime");
  const errorMsg = document.getElementById("errorMsg");
  
  if (status === "非稼働") {
    workTimeCell.textContent = "00:00";
    updateRowStyle(tr);
    return;
  }
  
  errorMsg.textContent = "";
  const startTime = startInput.value;
  const endTime = endInput.value;
  let breakTimeInput = parseInt(breakInput.value, 10);
  if (isNaN(breakTimeInput)) breakTimeInput = 0;
  if (!startTime || !endTime) {
    workTimeCell.textContent = "00:00";
    return;
  }
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    errorMsg.textContent = "終業時間は始業時間より後に設定してください。（行 " + tr.dataset.rowIndex + "）";
    workTimeCell.textContent = "00:00";
    return;
  }
  const scheduledMinutes = endMinutes - startMinutes;
  let workMinutes = scheduledMinutes - breakTimeInput - 60;
  if (workMinutes < 0) workMinutes = 0;
  workTimeCell.textContent = minutesToTimeString(workMinutes);
}

// 総稼動時間の計算
function calculateTotalWorkTime() {
  const tbody = document.getElementById("workTableBody");
  let total = 0;
  tbody.querySelectorAll("tr").forEach(tr => {
    const status = tr.querySelector(".status").value;
    if (status === "非稼働") return;
    const wt = tr.querySelector(".workTime").textContent;
    total += timeStringToMinutes(wt);
  });
  document.getElementById("totalWorkTime").textContent = minutesToTimeString(total);
}

// ステータスに応じた行のスタイル更新
function updateRowStyle(tr) {
  const status = tr.querySelector(".status").value;
  if (status === "非稼働") {
    tr.classList.add("nonworking");
  } else {
    tr.classList.remove("nonworking");
  }
}

// 「デフォルト適用」ボタン押下時に全行にデフォルト値を反映
function applyDefaultsToTable() {
  const defaultWorkPlace = document.getElementById('defaultWorkPlace').value || "";
  const defaultStartTime = document.getElementById('defaultStartTime').value || "";
  const defaultEndTime = document.getElementById('defaultEndTime').value || "";
  const defaultBreakTime = document.getElementById('defaultBreakTime').value || "0";
  const defaultWorkContent = document.getElementById('defaultWorkContent').value || "";
  const defaultStatus = document.getElementById('defaultStatus').value || "稼働";
  
  document.querySelectorAll("#workTableBody tr").forEach(tr => {
    tr.querySelector(".workPlace").value = defaultWorkPlace;
    tr.querySelector(".startTime").value = defaultStartTime;
    tr.querySelector(".endTime").value = defaultEndTime;
    tr.querySelector(".breakTime").value = defaultBreakTime;
    tr.querySelector(".workContent").value = defaultWorkContent;
    tr.querySelector(".status").value = defaultStatus;
    updateRowStyle(tr);
    calculateRowWorkTime(tr);
  });
  calculateTotalWorkTime();
  saveCurrentData();
}

// テーブル内の入力項目変更時のイベント登録
function registerTimeInputEvents() {
  const tbody = document.getElementById("workTableBody");
  tbody.addEventListener("change", function(e) {
    if (
      e.target.classList.contains("startTime") ||
      e.target.classList.contains("endTime") ||
      e.target.classList.contains("breakTime") ||
      e.target.classList.contains("status") ||
      e.target.classList.contains("workContent") ||
      e.target.classList.contains("workPlace")
    ) {
      const tr = e.target.closest("tr");
      calculateRowWorkTime(tr);
      calculateTotalWorkTime();
      if (e.target.classList.contains("status")) {
        updateRowStyle(tr);
      }
      saveCurrentData();
    }
  });
  tbody.addEventListener("focusout", function(e) {
    if (e.target.classList.contains("startTime") || e.target.classList.contains("endTime")) {
      let originalVal = e.target.value;
      if (originalVal) {
        let rounded = roundTimeToNearestHalf(originalVal);
        if (rounded !== originalVal) {
          e.target.value = rounded;
          const tr = e.target.closest("tr");
          calculateRowWorkTime(tr);
          calculateTotalWorkTime();
          saveCurrentData();
        }
      }
    }
  });
}
