// js/table.js

// 祝日データやテーブル行番号用の変数
let holidays = [];
let rowNumber = 1;

// 指定された年・月の日付リスト生成（全カレンダー日付を対象）
function generateBusinessDayList(year, month) {
  // ※今回はカレンダーの日付全てを表示するため、休日をスキップしません。
  fetch('https://holidays-jp.github.io/api/v1/' + year + '/date.json')
    .then(response => response.json())
    .then(data => {
      holidays = Object.keys(data);  // 祝日データは取得しておく（必要に応じて参照可能）
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
    // 保存済みデータがある場合はその内容を利用
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
    // 保存済みデータがない場合、当月のすべての日付について行を生成
    let index = 0;
    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
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

// ステータスと日付に応じた行のスタイル更新
function updateRowStyle(tr) {
  const status = tr.querySelector(".status").value;
  if (status === "非稼働") {
    tr.classList.add("nonworking");
  } else {
    tr.classList.remove("nonworking");
  }

  // 日付セルのテキストを取得し、Date オブジェクトに変換
  const dateText = tr.querySelector(".readonly").textContent.trim();
  let dateObj = new Date(dateText);
  if (isNaN(dateObj)) {
    // 例: "2025/02/02" や "2025-02-02" のような形式の場合の対応
    const parts = dateText.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (parts) {
      dateObj = new Date(parts[1], parts[2] - 1, parts[3]);
    }
  }

  // 曜日・祝日判定による文字色の設定（デフォルトは黒）
  let color = "black";
  if (!isNaN(dateObj)) {
    // 日付を "YYYY-MM-DD" 形式に整形
    const yyyy = dateObj.getFullYear();
    const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const dd = dateObj.getDate().toString().padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // 日曜または祝日は赤、土曜は青、その他は黒
    if (dateObj.getDay() === 0 || holidays.includes(formattedDate)) {
      color = "red";
    } else if (dateObj.getDay() === 6) {
      color = "blue";
    }
  }
  tr.style.color = color;
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
