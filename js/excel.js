// js/excel.js

function downloadXlsx() {
    let data = [];
    const headers = ["＃", "作業日", "作業場所", "始業時間", "終業時間", "離席時間", "作業時間", "作業内容"];
    data.push(headers);
    
    document.querySelectorAll("#workTableBody tr").forEach(tr => {
      const status = tr.querySelector(".status").value;
      if (status === "非稼働") return;
      const cells = tr.children;
      let rowData = [];
      rowData.push(cells[0].textContent.trim());
      rowData.push(cells[1].textContent.trim());
      rowData.push(cells[3].querySelector("input") ? cells[3].querySelector("input").value : "");
      rowData.push(cells[4].querySelector("input") ? cells[4].querySelector("input").value : "");
      rowData.push(cells[5].querySelector("input") ? cells[5].querySelector("input").value : "");
      rowData.push(cells[6].querySelector("input") ? cells[6].querySelector("input").value + "分" : "");
      rowData.push(cells[7].textContent.trim());
      rowData.push(cells[8].querySelector("input") ? cells[8].querySelector("input").value : "");
      data.push(rowData);
    });
    
    const totalWorkTime = document.getElementById("totalWorkTime").textContent;
    data.push(["総稼動時間：", totalWorkTime, "", "", "", "", "", ""]);
    
    let ws = XLSX.utils.aoa_to_sheet(data);
    
    let colWidths = [];
    for (let i = 0; i < data[0].length; i++) {
      colWidths[i] = data[0][i] ? data[0][i].toString().length : 10;
    }
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        let cellText = data[i][j] ? data[i][j].toString() : "";
        if (cellText.length > colWidths[j]) {
          colWidths[j] = cellText.length;
        }
      }
    }
    ws['!cols'] = colWidths.map(w => ({ wch: w + 2 }));
    
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "作業記録");
    XLSX.writeFile(wb, "work_record.xlsx");
  }
  