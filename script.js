/************************************************************
 * 0. 전역 변수 / 상수
 ************************************************************/
var folderName = "";
var token = "";
var LOCAL_SERVER_URL = "https://jun_cp.inviteu.org"; // 서버 주소

var IMAGE_URLS = {
  red: "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true",
  yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
  green: "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true"
};

var AUTO_COMPLETE_LIST = [
  "산림청 LLM PoC", "국회 빅데이터 구축사업", "Copilot Agent 개발", "JTS LLM사업",
  "우리은행 GenAI 사업", "신한은행 GenAI 사업", "GPUaaS", "비씨카드",
  "업무 관리 프로세스", "고려대 산학 (MoM)", "신한은행 AI Branch 컨설팅/PoC 지원",
  "KPI 작성", "Lead 행사 추진", "구매/회계 업무", "IBM Agent Consulting",
  "agent agent", "Agent test"
];

var STRATEGY_TO_DETAIL_OPTIONS = {
  A: ["컨설팅/제안(핵심&전략고객)", "사전컨설팅(for 고객발굴/사업화)", "이슈조정/해소(for AX전략이행/사업추진)"],
  B: ["Delivery방안 확보", "고객Ref. 확보", "AIAgentSvc. 발굴/확보"],
  C: ["글로벌Ref. 확보", "협력파트너 확보", "CoWork 사업 Ref. 확보"],
  D: ["Lead 내 담당 업무"],
  E: ["컨설팅/제안 지원(핵심&전략고객)", "그룹AX협력과제 발굴/이행지원", "MS/AX유관조직 가교역할"],
  F: ["AX컨설팅수행(핵심&전략고객)", "PoC기획/개발/프로토타이핑(핵심&전략고객)", "AIMSP협력모델 구축"],
  G: ["AX컨설팅방법론 표준화/확산", "AI신기술분석/내부역량강화/기술지원", "Ref.아키텍처 발굴/확산"],
  H: ["Lead 내 담당 업무"]
};

// index.html에 사용한 테이블 구조 (colgroup + thead)
var TABLE_TEMPLATE =
  "<colgroup>" +
  "<col><col><col><col><col><col><col><col><col><col><col><col><col>" +
  "</colgroup>" +
  "<thead>" +
  "<tr>" +
    "<th>담당 전략과제</th>" +
    "<th>세부 과제</th>" +
    "<th>프로젝트/업무명</th>" +
    "<th>개요</th>" +
    "<th>주요 로드맵</th>" +
    "<th>진척률</th>" +
    "<th>원활도</th>" +
    "<th>현 주요 사항</th>" +
    "<th>추진 결과 / 산출물</th>" +
    "<th>담당자 (업무)</th>" +
    "<th>Issue / 대응 방안</th>" +
    "<th>컨플루언스 (히스토리)</th>" +
    "<th>(상무님 코멘터리)</th>" +
  "</tr>" +
  "</thead>";

// 현재 편집 대상 날짜 (기본적으로 최신 목요일)
var currentEditingDate = "";
// 서버에서 불러온 기록들을 저장할 전역 변수 (배열)
var fetchedRecords = [];

/************************************************************
 * 날짜 관련 헬퍼 함수
 ************************************************************/
function getUpcomingThursdayDate() {
  var today = new Date();
  var diff;
  if (today.getDay() <= 4) {
    diff = 4 - today.getDay();
  } else {
    diff = 11 - today.getDay();
  }
  var thursday = new Date(today);
  thursday.setDate(today.getDate() + diff);
  return thursday;
}

function formatDate(date) {
  var yy = String(date.getFullYear()).slice(2);
  var mm = String(date.getMonth() + 1).padStart(2, "0");
  var dd = String(date.getDate()).padStart(2, "0");
  return yy + mm + dd;
}

function getUpcomingThursday() {
  return formatDate(getUpcomingThursdayDate());
}

function getPreviousThursday(dateStr, weeksAgo) {
  var year = 2000 + parseInt(dateStr.slice(0,2));
  var month = parseInt(dateStr.slice(2,4)) - 1;
  var day = parseInt(dateStr.slice(4,6));
  var dateObj = new Date(year, month, day);
  dateObj.setDate(dateObj.getDate() - 7 * weeksAgo);
  return formatDate(dateObj);
}

/************************************************************
 * 1) 폴더 초기화 및 부모 도메인 검사
 ************************************************************/
function initializeFolder() {
  var ref = document.referrer;
  if (ref.indexOf("atlassian.net") === -1) {
    alert("Confluence(.atlassian.net)에서 접근하지 않아 동작이 제한됩니다.");
    return false;
  }
  var params = new URLSearchParams(window.location.search);
  var folder = params.get("folder");
  var tokenParam = params.get("token");
  if (!folder) {
    alert("folder 파라미터가 없습니다. 올바른 접근이 아닙니다.");
    return false;
  }
  if (!tokenParam) {
    alert("token 파라미터가 없습니다. 올바른 접근이 아닙니다.");
    return false;
  }
  folderName = folder;
  token = tokenParam;
  console.log("Folder initialized as:", folderName, "with token:", token);
  return true;
}

/************************************************************
 * 2) 날짜 드롭다운 및 현재 날짜 계산
 ************************************************************/
function createDateDropdown() {
  var container = document.getElementById("dateSelectorContainer");
  if (!container) return;
  container.innerHTML = "";
  var select = document.createElement("select");
  select.className = "dropdown-select date-dropdown";
  var latest = getUpcomingThursday();
  var prev1 = getPreviousThursday(latest, 1);
  var prev2 = getPreviousThursday(latest, 2);
  var opts = [
    { val: latest, text: latest },
    { val: prev1, text: prev1 },
    { val: prev2, text: prev2 },
    { val: "more", text: "더보기" }
  ];
  for (var i = 0; i < opts.length; i++) {
    var o = opts[i];
    var op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  }
  container.appendChild(select);
  select.addEventListener("change", function(e) {
    handleDateDropdownChange(e);
  });
}

function updateDateDropdownWithAllDates() {
  var select = document.querySelector(".date-dropdown");
  if (!select) return;
  select.innerHTML = "";
  // ES5 방식: var uniqueDates = Array.from(new Set(dates)); → 구형 브라우저 대비
  var dates = [];
  for (var i = 0; i < fetchedRecords.length; i++) {
    dates.push(fetchedRecords[i].date);
  }
  var latest = getUpcomingThursday();
  if (dates.indexOf(latest) === -1) {
    dates.push(latest);
  }
  // 중복 제거
  var setObj = {};
  var uniqueArr = [];
  for (var j = 0; j < dates.length; j++) {
    if (!setObj[dates[j]]) {
      setObj[dates[j]] = true;
      uniqueArr.push(dates[j]);
    }
  }
  // 정렬 (오름차순)
  uniqueArr.sort(function(a, b) {
    return a.localeCompare(b);
  });
  for (var k = 0; k < uniqueArr.length; k++) {
    var date = uniqueArr[k];
    var op = document.createElement("option");
    op.value = date;
    op.textContent = date;
    select.appendChild(op);
  }
  if (uniqueArr.indexOf(currentEditingDate) !== -1) {
    select.value = currentEditingDate;
  } else {
    currentEditingDate = latest;
    select.value = latest;
  }
}

function handleDateDropdownChange(e) {
  var select = e.target;
  var newDate = select.value;
  if (newDate === "more") {
    updateDateDropdownWithAllDates();
    return;
  }
  if (newDate === currentEditingDate) {
    select.value = currentEditingDate;
    return;
  }
  var currentTableElem = document.querySelector("#currentTableContainer .myTable tbody");
  if (!currentTableElem) {
    currentEditingDate = newDate;
    updateUIForSelectedDate(newDate);
    return;
  }
  var currentTableHTML = currentTableElem.innerHTML.trim();
  var savedRecord = null;
  for (var i = 0; i < fetchedRecords.length; i++) {
    if (fetchedRecords[i].date === currentEditingDate) {
      savedRecord = fetchedRecords[i];
      break;
    }
  }
  var savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
  
  if (currentTableHTML !== savedTableHTML) {
    var choice = prompt(
      "(" + currentEditingDate + ") 날짜의 내용에서 변경된 부분이 있습니다.\n" +
      "아래 옵션 중 선택해주세요:\n1: 변경사항 저장 후 진행\n2: 저장 없이 진행\n3: 취소"
    );
    if (choice === "1") {
      submitData(currentEditingDate, function() {
        currentEditingDate = newDate;
        updateUIForSelectedDate(newDate);
      });
      return;
    } else if (choice === "2") {
      // 저장 없이 진행
    } else {
      select.value = currentEditingDate;
      return;
    }
  }
  currentEditingDate = newDate;
  updateUIForSelectedDate(newDate);
}

/************************************************************
 * 3) 드롭다운/신호등 생성 함수
 ************************************************************/
function createStrategyDropdown() {
  var container = document.createElement("div");
  var select = document.createElement("select");
  select.className = "dropdown-select strategy-dropdown";
  // 옵션 구성 – 기본값 "(선택)" 포함
  var opts = [
    { val: "", text: "(선택)" },
    { val: "A", text: "1_AX사업..." },
    { val: "B", text: "1_MS파트너..." },
    { val: "C", text: "1_C..." },
    { val: "D", text: "1_D..." },
    { val: "E", text: "2_E..." },
    { val: "F", text: "2_F..." },
    { val: "G", text: "2_G..." },
    { val: "H", text: "2_Lead..." }
  ];
  for (var i = 0; i < opts.length; i++) {
    var o = opts[i];
    var op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  }
  var span = document.createElement("span");
  span.className = "dropdown-text";
  // 처음에는 select 보이고, span은 감춤
  select.style.display = "inline-block";
  span.style.display = "none";
  container.appendChild(select);
  container.appendChild(span);
  return { container: container };
}

function createDetailDropdown() {
  var container = document.createElement("div");
  var select = document.createElement("select");
  select.className = "dropdown-select detail-dropdown";
  // 기본값 "Select"는 나중에 strategy 선택에 따라 제거할 예정
  var span = document.createElement("span");
  span.className = "dropdown-text";
  // 초기 상태: detail dropdown은 비활성화
  select.style.display = "inline-block";
  select.disabled = true;
  span.style.display = "none";
  container.appendChild(select);
  container.appendChild(span);
  return { container: container };
}

function createTrafficDropdown() {
  var container = document.createElement("div");
  var select = document.createElement("select");
  select.className = "dropdown-select status-dropdown";
  var opts = [
    { val: "", text: "Select" },
    { val: "red", text: "Red" },
    { val: "yellow", text: "Yellow" },
    { val: "green", text: "Green" }
  ];
  for (var i = 0; i < opts.length; i++) {
    var o = opts[i];
    var op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  }
  var img = document.createElement("img");
  img.className = "status-image";
  select.style.display = "inline-block";
  img.style.display = "none";
  container.appendChild(select);
  container.appendChild(img);
  return { container: container };
}

/************************************************************
 * 4) 드롭다운 이벤트 초기화 (UI 동작 개선)
 ************************************************************/
function initDropDownEvents(td) {
  // --- 0열 (전략과제) ---
  var strategySelect = td.querySelector(".strategy-dropdown");
  var strategySpan = td.querySelector(".dropdown-text");
  if (strategySelect && strategySpan) {
    strategySelect.addEventListener("change", function() {
      var val = strategySelect.value;
      var displayText = strategySelect.options[strategySelect.selectedIndex].textContent;
      // detail dropdown 비활성화 여부
      var detailSelect = td.parentNode.querySelector(".detail-dropdown");
      if (val === "") {
        if (detailSelect) {
          detailSelect.disabled = true;
          detailSelect.style.display = "none";
        }
      } else {
        // "(선택)" 제거
        for (var i = 0; i < strategySelect.options.length; i++) {
          if (strategySelect.options[i].value === "") {
            strategySelect.remove(i);
            break;
          }
        }
        strategySpan.textContent = displayText;
        strategySelect.style.display = "none";
        strategySpan.style.display = "inline-block";
      }
      handleStrategyChange(td, val);
    });
    // click 이벤트
    strategySpan.addEventListener("click", function() {
      var detailSelect = td.parentNode.querySelector(".detail-dropdown");
      if (detailSelect) {
        detailSelect.disabled = true;
        detailSelect.style.display = "none";
      }
      strategySpan.style.display = "none";
      strategySelect.style.display = "inline-block";
      strategySelect.focus();
      var event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      strategySelect.dispatchEvent(event);
    });
  }
  
  // --- 1열 (세부 과제) ---
  var detailSelect = td.querySelector(".detail-dropdown");
  var detailSpan = td.querySelector(".dropdown-text");
  if (detailSelect && detailSpan) {
    detailSelect.addEventListener("change", function() {
      var val = detailSelect.value;
      if (val) {
        detailSpan.textContent = val;
        detailSelect.style.display = "none";
        detailSpan.style.display = "inline-block";
      }
    });
    detailSpan.addEventListener("click", function() {
      if (detailSelect.disabled) return;
      detailSpan.style.display = "none";
      detailSelect.style.display = "inline-block";
      detailSelect.focus();
      var event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      detailSelect.dispatchEvent(event);
    });
  }
  
  // --- 6열 (신호등) ---
  var statusSelect = td.querySelector(".status-dropdown");
  var statusImage = td.querySelector(".status-image");
  if (statusSelect && statusImage) {
    statusSelect.addEventListener("change", function() {
      var colorVal = statusSelect.value;
      if (IMAGE_URLS[colorVal]) {
        statusImage.src = IMAGE_URLS[colorVal];
        statusSelect.style.display = "none";
        statusImage.style.display = "inline-block";
      }
    });
    statusImage.addEventListener("click", function() {
      statusImage.style.display = "none";
      statusSelect.value = "";
      statusSelect.style.display = "inline-block";
    });
  }
}

function handleStrategyChange(strategyTd, strategyVal) {
  var row = strategyTd.closest("tr");
  if (!row) return;
  var tds = row.querySelectorAll("td");
  if (tds.length < 2) return;
  var detailTd = tds[1];
  var detailSelect = detailTd.querySelector(".detail-dropdown");
  var detailSpan = detailTd.querySelector(".dropdown-text");
  if (!strategyVal) {
    detailSelect.innerHTML = "";
    detailSelect.disabled = true;
    detailSpan.textContent = "";
    detailSpan.style.display = "none";
    return;
  }
  detailSelect.disabled = false;
  detailSelect.innerHTML = "";
  var newOptions = STRATEGY_TO_DETAIL_OPTIONS[strategyVal] || [];
  for (var i = 0; i < newOptions.length; i++) {
    var opVal = newOptions[i];
    var op = document.createElement("option");
    op.value = opVal;
    op.textContent = opVal;
    detailSelect.appendChild(op);
  }
  detailSelect.style.display = "inline-block";
  detailSpan.textContent = "";
  detailSpan.style.display = "none";
}

/************************************************************
 * 5) 표 초기화 및 행 추가 (편집용 표)
 ************************************************************/
function initTable(table) {
  if (!table) return;
  var rows = table.querySelectorAll("tbody tr");
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var tds = row.querySelectorAll("td");
    if (tds[0] && !tds[0].querySelector(".strategy-dropdown")) {
      var sObj = createStrategyDropdown();
      tds[0].appendChild(sObj.container);
    }
    if (tds[1] && !tds[1].querySelector(".detail-dropdown")) {
      var dObj = createDetailDropdown();
      tds[1].appendChild(dObj.container);
    }
    if (tds[6] && !tds[6].querySelector(".status-dropdown")) {
      var tObj = createTrafficDropdown();
      tds[6].appendChild(tObj.container);
    }
    for (var c = 0; c < tds.length; c++) {
      initDropDownEvents(tds[c]);
    }
  }
}

function addNewRow() {
  var table = document.querySelector(".myTable");
  if (!table) return;
  var tbody = table.querySelector("tbody");
  if (!tbody) return;
  var tr = document.createElement("tr");
  for (var i = 0; i < 8; i++) {
    var td = document.createElement("td");
    if (i !== 0 && i !== 1 && i !== 6) {
      td.classList.add("editable");
      td.contentEditable = "true";
    }
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  initTable(table);
}

/************************************************************
 * 6) 서버 저장 데이터 불러오기 및 UI 업데이트
 ************************************************************/
function fetchStoredData(callback) {
  fetch(LOCAL_SERVER_URL + "/listData?folder=" + folderName + "&token=" + token)
    .then(function(resp) {
      return resp.json();
    })
    .then(function(records) {
      console.log("Fetched records:", records);
      if (!Array.isArray(records)) {
         records = [];
      }
      fetchedRecords = records;
      if (callback) { callback(); }
      updateUIForSelectedDate(currentEditingDate);
    })
    .catch(function(err) {
      console.error("데이터 로드 오류:", err);
    });
}

function updateUIForSelectedDate(selectedDate) {
  var latest = getUpcomingThursday();
  var currentHeader = document.getElementById("currentHeader");
  var currentContainer = document.getElementById("currentTableContainer");
  var pastContainer = document.getElementById("pastDataContainer");
  
  // 편집 영역 헤더
  var headerText = (selectedDate === latest)
                   ? "(이번주) " + selectedDate + " 주간현황"
                   : "(과거) " + selectedDate + " 주간현황";
  currentHeader.textContent = headerText;
  
  // 편집 영역 업데이트
  var editableTable = currentContainer.querySelector(".myTable");
  if (editableTable) {
    var editableTbody = editableTable.querySelector("tbody");
    var record = null;
    for (var i = 0; i < fetchedRecords.length; i++) {
      if (fetchedRecords[i].date === selectedDate) {
        record = fetchedRecords[i];
        break;
      }
    }
    if (record) {
      editableTbody.innerHTML = record.tableHTML;
      initTable(editableTable);
    } else {
      if (selectedDate === latest) {
        currentHeader.textContent = "(이번주) " + selectedDate + " 주간현황 : 아직 작성되지 않았음";
      }
      editableTbody.innerHTML = "";
    }
  }
  
  // 조회 영역 업데이트
  pastContainer.innerHTML = "";
  var pastHeader = document.createElement("div");
  pastHeader.style.textAlign = "center";
  pastHeader.style.fontWeight = "bold";
  pastHeader.textContent = "<저장된 주간현황 내역>";
  pastContainer.appendChild(document.createElement("br"));
  pastContainer.appendChild(pastHeader);
  pastContainer.appendChild(document.createElement("br"));
  
  var datesToShow = [];
  if (selectedDate === latest) {
    // find record of latest
    var recLatest = null;
    for (var x = 0; x < fetchedRecords.length; x++) {
      if (fetchedRecords[x].date === latest) {
        recLatest = fetchedRecords[x];
        break;
      }
    }
    if (recLatest) {
      datesToShow.push(latest);
    }
    var prev1 = getPreviousThursday(latest, 1);
    var prev2 = getPreviousThursday(latest, 2);
    var foundPrev1 = false;
    var foundPrev2 = false;
    for (var y = 0; y < fetchedRecords.length; y++) {
      if (fetchedRecords[y].date === prev1) foundPrev1 = true;
      if (fetchedRecords[y].date === prev2) foundPrev2 = true;
    }
    if (foundPrev1) {
      datesToShow.push(prev1);
    }
    if (foundPrev2) {
      datesToShow.push(prev2);
    }
  } else {
    // dates from selectedDate up to latest
    var recordDates = [];
    for (var d = 0; d < fetchedRecords.length; d++) {
      recordDates.push(fetchedRecords[d].date);
    }
    for (var dd = 0; dd < recordDates.length; dd++) {
      var dt = recordDates[dd];
      if (dt <= latest && dt >= selectedDate) {
        if (datesToShow.indexOf(dt) === -1) {
          datesToShow.push(dt);
        }
      }
    }
    if (datesToShow.indexOf(latest) === -1) {
      datesToShow.push(latest);
    }
    // 내림차순 정렬
    datesToShow.sort(function(a, b) {
      return b.localeCompare(a);
    });
  }
  
  if (datesToShow.length === 0) {
    pastContainer.appendChild(document.createTextNode("(과거 주간현황 기록 없음)"));
  } else {
    for (var t = 0; t < datesToShow.length; t++) {
      var dateVal = datesToShow[t];
      var rec = null;
      for (var r = 0; r < fetchedRecords.length; r++) {
        if (fetchedRecords[r].date === dateVal) {
          rec = fetchedRecords[r];
          break;
        }
      }
      var section = document.createElement("div");
      section.style.marginBottom = "20px";
      var header = document.createElement("div");
      if (dateVal === latest) {
        header.textContent = "(이번주) " + dateVal + " 주간현황";
      } else {
        header.textContent = "(과거) " + dateVal + " 주간현황";
      }
      if (dateVal === selectedDate) {
        header.style.backgroundColor = "#ffffe0";
        header.style.color = "blue";
        header.style.fontWeight = "bold";
        header.style.fontStyle = "italic";
      }
      section.appendChild(header);
      if (rec) {
        var table = document.createElement("table");
        table.className = "myTable";
        table.innerHTML = TABLE_TEMPLATE + "<tbody>" + rec.tableHTML + "</tbody>";
        makeTableStatic(table);
        section.appendChild(table);
      } else {
        var msg = document.createElement("div");
        msg.textContent = "기록 없음";
        section.appendChild(msg);
      }
      pastContainer.appendChild(section);
    }
  }
}

function makeTableStatic(wrapper) {
  var selects = wrapper.querySelectorAll("select");
  for (var i = 0; i < selects.length; i++) {
    selects[i].disabled = true;
  }
  var tds = wrapper.querySelectorAll("td.editable");
  for (var j = 0; j < tds.length; j++) {
    tds[j].removeAttribute("contenteditable");
    tds[j].style.backgroundColor = "#f0f0f0";
  }
}

/************************************************************
 * 7) 데이터 제출 (Submit 버튼)
 ************************************************************/
function submitData(date, callback) {
  var tbodyElem = document.querySelector("#currentTableContainer .myTable tbody");
  if (!tbodyElem) {
    alert("표 데이터가 없습니다.");
    return;
  }
  var tableData = tbodyElem.innerHTML;
  var payload = { folder: folderName, date: date, tableData: tableData, token: token };
  fetch(LOCAL_SERVER_URL + "/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function(resp) {
      return resp.json();
    })
    .then(function(data) {
      if (data.error) {
        alert("전송 오류: " + data.error);
      } else {
        if (callback) { callback(); }
        fetchStoredData();
      }
    })
    .catch(function(err) {
      console.error("전송 오류:", err);
      alert("전송에 실패했습니다.");
    });
}

function initSubmitButton() {
  var submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) return;
  submitBtn.addEventListener("click", function() {
    if (!folderName) {
      alert("folder 파라미터가 유효하지 않습니다.");
      return;
    }
    var dateSelect = document.querySelector(".date-dropdown");
    if (!dateSelect || !dateSelect.value) {
      alert("날짜를 선택해주세요.");
      return;
    }
    var selectedDate = dateSelect.value;
    var currentTableElem = document.querySelector("#currentTableContainer .myTable tbody");
    if (!currentTableElem) return;
    var currentTableHTML = currentTableElem.innerHTML.trim();
    var savedRecord = null;
    for (var i = 0; i < fetchedRecords.length; i++) {
      if (fetchedRecords[i].date === selectedDate) {
        savedRecord = fetchedRecords[i];
        break;
      }
    }
    var savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
    if (!savedRecord) {
      submitData(selectedDate, function() {
        alert("(" + selectedDate + ") 진행현황을 신규 저장했습니다.");
        updateUIForSelectedDate(selectedDate);
      });
    } else {
      if (currentTableHTML !== savedTableHTML) {
        var choice = prompt(
          "현재 작성한 내용을 저장하시겠습니까? 기존 저장 내용과 다른 부분이 있습니다.\n" +
          "1: 저장하기\n2: 취소 및 다시 확인하기"
        );
        if (choice === "1") {
          submitData(selectedDate, function() {
            alert("(" + selectedDate + ") 진행현황을 저장했습니다.");
            updateUIForSelectedDate(selectedDate);
          });
        } else {
          return;
        }
      } else {
        alert("(" + selectedDate + ") 진행현황을 저장했습니다.");
        updateUIForSelectedDate(selectedDate);
      }
    }
    currentEditingDate = selectedDate;
  });
}

/************************************************************
 * 8) DOMContentLoaded – 초기화
 ************************************************************/
document.addEventListener("DOMContentLoaded", function() {
  if (!initializeFolder()) {
    var submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }
  createDateDropdown();
  var editingTable = document.querySelector("#currentTableContainer .myTable");
  if (editingTable) {
    initTable(editingTable);
  }
  var addBtn = document.getElementById("addRowBtn");
  if (addBtn) {
    addBtn.addEventListener("click", function() {
      addNewRow();
    });
  }
  initSubmitButton();
  var defaultSelect = document.querySelector(".date-dropdown");
  if (defaultSelect && defaultSelect.value) {
    currentEditingDate = defaultSelect.value;
  } else {
    currentEditingDate = getUpcomingThursday();
  }
  fetchStoredData();
});
