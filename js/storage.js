// js/storage.js

// デフォルト設定の読み込み
function loadDefaultSettings() {
    const defaultSettingsStr = localStorage.getItem("defaultSettings");
    if (defaultSettingsStr) {
      try {
        const defaults = JSON.parse(defaultSettingsStr);
        document.getElementById("defaultWorkPlace").value = defaults.workPlace || "";
        document.getElementById("defaultStartTime").value = defaults.startTime || "09:00";
        document.getElementById("defaultEndTime").value = defaults.endTime || "18:00";
        document.getElementById("defaultBreakTime").value = defaults.breakTime || "0";
        document.getElementById("defaultWorkContent").value = defaults.workContent || "";
        document.getElementById("defaultStatus").value = defaults.status || "稼働";
      } catch (e) {
        console.error("Default settings JSON parse error:", e);
      }
    }
  }
  
  // デフォルト設定の保存
  function saveDefaultSettings() {
    const defaults = {
      workPlace: document.getElementById("defaultWorkPlace").value,
      startTime: document.getElementById("defaultStartTime").value,
      endTime: document.getElementById("defaultEndTime").value,
      breakTime: document.getElementById("defaultBreakTime").value,
      workContent: document.getElementById("defaultWorkContent").value,
      status: document.getElementById("defaultStatus").value
    };
    localStorage.setItem("defaultSettings", JSON.stringify(defaults));
  }
  
  // デフォルト設定の変更イベント登録
  function registerDefaultSettingsEvents() {
    document.getElementById("defaultWorkPlace").addEventListener("change", saveDefaultSettings);
    document.getElementById("defaultStartTime").addEventListener("change", saveDefaultSettings);
    document.getElementById("defaultEndTime").addEventListener("change", saveDefaultSettings);
    document.getElementById("defaultBreakTime").addEventListener("change", saveDefaultSettings);
    document.getElementById("defaultWorkContent").addEventListener("change", saveDefaultSettings);
    document.getElementById("defaultStatus").addEventListener("change", saveDefaultSettings);
  }
  
  // 現在選択中の月以外の作業日データ（"workData_…"）を削除
  function resetLocalStorageForOtherMonths(currentYear, currentMonth) {
    const currentKey = "workData_" + currentYear + "_" + currentMonth;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("workData_") && key !== currentKey) {
        localStorage.removeItem(key);
      }
    });
  }
  
  // 保存済み作業日データの読み込み
  function loadDataFromLocalStorage(year, month) {
    const key = "workData_" + year + "_" + month;
    const dataStr = localStorage.getItem(key);
    if (dataStr) {
      try {
        return JSON.parse(dataStr);
      } catch (e) {
        console.error("JSONパースエラー", e);
        return null;
      }
    }
    return null;
  }
  
  // 作業日データの保存
  function saveDataToLocalStorage(year, month, data) {
    const key = "workData_" + year + "_" + month;
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  // 現在のテーブルデータを localStorage に保存
  function saveCurrentData() {
    const year = document.getElementById("yearInput").value;
    const month = document.getElementById("monthInput").value;
    const data = [];
    document.querySelectorAll("#workTableBody tr").forEach(tr => {
      const date = tr.children[1].textContent.trim();
      const status = tr.querySelector(".status").value;
      const workPlace = tr.querySelector(".workPlace").value;
      const startTime = tr.querySelector(".startTime").value;
      const endTime = tr.querySelector(".endTime").value;
      const breakTime = tr.querySelector(".breakTime").value;
      const workTime = tr.querySelector(".workTime").textContent.trim();
      const workContent = tr.querySelector(".workContent").value;
      data.push({ date, status, workPlace, startTime, endTime, breakTime, workTime, workContent });
    });
    saveDataToLocalStorage(year, month, data);
  }
  