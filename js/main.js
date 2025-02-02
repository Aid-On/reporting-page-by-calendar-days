// js/main.js

document.addEventListener("DOMContentLoaded", function() {
    // デフォルト設定の読み込み
    loadDefaultSettings();
  
    // 最後に開いた年月を localStorage から取得
    const lastOpened = localStorage.getItem("lastOpenedMonth");
    let year, month;
    if (lastOpened) {
      try {
        const obj = JSON.parse(lastOpened);
        year = obj.year;
        month = obj.month;
      } catch (e) {
        console.error("lastOpenedMonth JSON parse error:", e);
      }
    }
    // 値がない場合は今日の日付を採用
    if (!year || !month) {
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
    }
    document.getElementById("yearInput").value = year;
    document.getElementById("monthInput").value = month;
    
    // 指定月の営業日リスト生成
    generateBusinessDayList(year, month);
    
    // 前月ボタンのイベント登録
    document.getElementById("prevMonthButton").addEventListener("click", function() {
      let y = parseInt(document.getElementById("yearInput").value, 10);
      let m = parseInt(document.getElementById("monthInput").value, 10);
      m--;
      if (m < 1) { m = 12; y--; }
      document.getElementById("yearInput").value = y;
      document.getElementById("monthInput").value = m;
      generateBusinessDayList(y, m);
      localStorage.setItem("lastOpenedMonth", JSON.stringify({ year: y, month: m }));
    });
    
    // 次月ボタンのイベント登録
    document.getElementById("nextMonthButton").addEventListener("click", function() {
      let y = parseInt(document.getElementById("yearInput").value, 10);
      let m = parseInt(document.getElementById("monthInput").value, 10);
      m++;
      if (m > 12) { m = 1; y++; }
      document.getElementById("yearInput").value = y;
      document.getElementById("monthInput").value = m;
      generateBusinessDayList(y, m);
      localStorage.setItem("lastOpenedMonth", JSON.stringify({ year: y, month: m }));
    });
    
    // デフォルト適用ボタンのイベント登録
    document.getElementById("applyDefaultsButton").addEventListener("click", applyDefaultsToTable);
    
    // デフォルト設定変更のイベント登録
    registerDefaultSettingsEvents();
  
    // テーブル内入力項目変更のイベント登録
    registerTimeInputEvents();
  
    // Excelダウンロードボタンのイベント登録
    document.getElementById("downloadButton").addEventListener("click", downloadXlsx);
  });
  