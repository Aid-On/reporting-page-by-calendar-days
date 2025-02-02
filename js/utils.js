// js/utils.js

// 30分刻みの丸め
function roundTimeToNearestHalf(timeStr) {
    const parts = timeStr.split(":");
    let hour = parseInt(parts[0], 10);
    let minute = parseInt(parts[1], 10);
    if (minute < 15) {
      minute = 0;
    } else if (minute < 45) {
      minute = 30;
    } else {
      minute = 0;
      hour = (hour + 1) % 24;
    }
    return ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2);
  }
  
  // 時刻文字列→分変換
  function timeStringToMinutes(timeStr) {
    const [hour, minute] = timeStr.split(":").map(Number);
    return hour * 60 + minute;
  }
  
  // 分→時刻文字列変換
  function minutesToTimeString(totalMin) {
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    return hours.toString() + ":" + ("0" + minutes).slice(-2);
  }
  
  // 日付を「YYYY年MM月DD日(曜日)」にフォーマット
  function formatJapaneseDate(date) {
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const week = weekdayMap[date.getDay()];
    return `${year}年${month}月${day}日(${week})`;
  }
  
  // 日付を比較用フォーマット「YYYY-MM-DD」に変換
  function formatDateForComparison(date) {
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
  
  // 曜日表示用グローバル変数
  const weekdayMap = ["日", "月", "火", "水", "木", "金", "土"];
  