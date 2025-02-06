/************************************************************
 * 0. 전역 변수 / 상수
 ************************************************************/
let folderName = "";
let token = "";
const LOCAL_SERVER_URL = "https://jun_cp.inviteu.org"; // 서버 주소

const IMAGE_URLS = {
  red: "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true",
  yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
  green: "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true"
};

const AUTO_COMPLETE_LIST = [
  "산림청 LLM PoC", "국회 빅데이터 구축사업", "Copilot Agent 개발", "JTS LLM사업",
  "우리은행 GenAI 사업", "신한은행 GenAI 사업", "GPUaaS", "비씨카드",
  "업무 관리 프로세스", "고려대 산학 (MoM)", "신한은행 AI Branch 컨설팅/PoC 지원",
  "KPI 작성", "Lead 행사 추진", "구매/회계 업무", "IBM Agent Consulting",
  "agent agent", "Agent test"
];

const STRATEGY_TO_DETAIL_OPTIONS = {
  A: ["핵심&전략고객 대상 컨설팅/제안", "고객발굴/사업화를 위한 사전컨설팅", "AX전략이행/사업추진을 위한 이슈조정/해소"],
  B: ["AI 서비스 Delivery 방안 확보", "KT Custom LLM 활용한 고객 레퍼런스 확보", "AI Agent 서비스 발굴/확보"],
  C: ["글로벌 확장을 위한 레퍼런스 확보", "사업 협력 파트너 확보", "파트너 CoWork 사업 레퍼런스 확보"],
  D: ["Lead 내 담당 업무"],
  E: ["핵심&전략고객 대상 컨설팅/제안", "그룹AX협력과제 발굴/이행지원", "MS 및 AX유관조직 가교역할"],
  F: ["핵심&전략고객 대상 AX컨 설팅 수행", "핵심&전략고객 대상 PoC기획/개발/프로토타이핑", "AI MSP 사업을 위한 협력모델 구축"],
  G: ["AX 컨설팅 방법론 표준화/확산", "AI 신기술 분석/내부 역량 강화/기술지원", "B2B 대상 레퍼런스 아키텍처 발굴/확산"],
  H: ["Lead 내 담당 업무"]
};
// index.html에 사용한 테이블 구조 (colgroup + thead)
const TABLE_TEMPLATE = `
<colgroup>
  <col><col><col><col><col><col><col><col><col><col><col><col><col>
</colgroup>
<thead>
  <tr>
    <th>담당 전략과제</th>
    <th>세부 과제</th>
    <th>프로젝트/업무명</th>
    <th>개요</th>
    <th>주요 로드맵</th>
    <th>진척률</th>
    <th>원활도</th>
    <th>현 주요 사항</th>
    <th>추진 결과 / 산출물</th>
    <th>담당자 (업무)</th>
    <th>Issue / 대응 방안</th>
    <th>컨플루언스 (히스토리)</th>
    <th>(상무님 코멘터리)</th>
  </tr>
</thead>
`;

// 현재 편집 대상 날짜 (기본적으로 최신 목요일)
let currentEditingDate = "";
// 서버에서 불러온 기록들을 저장할 전역 변수
let fetchedRecords = [];

/************************************************************
 * 날짜 관련 헬퍼 함수
 ************************************************************/
function getUpcomingThursdayDate() {
  const today = new Date();
  let diff;
  if (today.getDay() <= 4) {
    diff = 4 - today.getDay();    // 오늘이 월화수라면 이번주 목요일까지
  } else {
    diff = 11 - today.getDay();   // 금토일이면 다음주 목요일
  }
  const thursday = new Date(today);
  thursday.setDate(today.getDate() + diff);
  return thursday;
}
function formatDate(date) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return yy + mm + dd;
}
function getUpcomingThursday() {
  return formatDate(getUpcomingThursdayDate());
}
function getPreviousThursday(dateStr, weeksAgo) {
  const year = 2000 + parseInt(dateStr.slice(0,2));
  const month = parseInt(dateStr.slice(2,4)) - 1;
  const day = parseInt(dateStr.slice(4,6));
  const dateObj = new Date(year, month, day);
  dateObj.setDate(dateObj.getDate() - 7 * weeksAgo);
  return formatDate(dateObj);
}

/************************************************************
 * 1) 폴더 초기화
 ************************************************************/
function initializeFolder() {
  const ref = document.referrer;
  if (!ref.includes("atlassian.net")) {
    alert("Confluence(.atlassian.net)에서 접근하지 않아 동작이 제한됩니다.");
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  const folder = params.get("folder");
  const tokenParam = params.get("token");
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
  const container = document.getElementById("dateSelectorContainer");
  if (!container) return;
  container.innerHTML = "";
  const select = document.createElement("select");
  select.className = "dropdown-select date-dropdown";
  
  const latest = getUpcomingThursday();
  const prev1 = getPreviousThursday(latest, 1);
  const prev2 = getPreviousThursday(latest, 2);
  const opts = [
    { val: latest, text: latest },
    { val: prev1, text: prev1 },
    { val: prev2, text: prev2 },
    { val: "more", text: "더보기" }
  ];
  opts.forEach(o => {
    const op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });
  container.appendChild(select);
  select.addEventListener("change", handleDateDropdownChange);
}

function updateDateDropdownWithAllDates() {
  const select = document.querySelector(".date-dropdown");
  if (!select) return;
  select.innerHTML = "";
  
  let dates = fetchedRecords.map(r => r.date);
  const latest = getUpcomingThursday();
  if (!dates.includes(latest)) {
    dates.push(latest);
  }
  dates = Array.from(new Set(dates));  // 중복 제거
  dates.sort((a, b) => a.localeCompare(b)); // 오름차순
  
  dates.forEach(date => {
    const op = document.createElement("option");
    op.value = date;
    op.textContent = date;
    select.appendChild(op);
  });
  if (dates.includes(currentEditingDate)) {
    select.value = currentEditingDate;
  } else {
    currentEditingDate = latest;
    select.value = latest;
  }
}

function handleDateDropdownChange(e) {
  const select = e.target;
  let newDate = select.value;
  if (newDate === "more") {
    updateDateDropdownWithAllDates();
    return;
  }
  if (newDate === currentEditingDate) {
    select.value = currentEditingDate;
    return;
  }
  const currentTableElem = document.querySelector("#currentTableContainer .myTable tbody");
  if (!currentTableElem) {
    // 편집 테이블이 없으면 그냥 날짜만 바꾼다
    currentEditingDate = newDate;
    updateUIForSelectedDate(newDate);
    return;
  }
  // 변경사항 비교
  const currentTableHTML = currentTableElem.innerHTML.trim();
  const savedRecord = fetchedRecords.find(r => r.date === currentEditingDate);
  const savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
  
  if (currentTableHTML !== savedTableHTML) {
    // 변경사항 있음
    const choice = prompt(
      `(${currentEditingDate}) 날짜의 내용에서 변경된 부분이 있습니다.\n아래 옵션 중 선택해주세요:\n1: 변경사항 저장 후 진행\n2: 저장 없이 진행\n3: 취소`
    );
    if (choice === "1") {
      // 저장 후 진행
      submitData(currentEditingDate, () => {
        currentEditingDate = newDate;
        updateUIForSelectedDate(newDate);
      });
      return;
    } else if (choice === "2") {
      // 저장 없이 진행
    } else {
      // 취소
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
  const container = document.createElement("div");
  const select = document.createElement("select");
  select.className = "dropdown-select strategy-dropdown";
  const opts = [
    { val: "", text: "(선택)" },
    { val: "A", text: "1_AX사업 수주 지원 및 컨설팅" },
    { val: "B", text: "1_MS파트너십 기반 고객 경험 혁신서비스 발굴" },
    { val: "C", text: "1_AX사업 경쟁력 강화를 위한 파트너 발굴" },
    { val: "D", text: "1_Lead 내 담당 업무" },
    { val: "E", text: "2_AX사업 수주 지원 및 컨설팅" },
    { val: "F", text: "2_AX전문 컨설팅 및 프로토타이핑 수행" },
    { val: "G", text: "2_고객 기반 표준화된 오퍼링 제공" },
    { val: "H", text: "2_Lead 내 담당 업무" }
  ];
  opts.forEach(o => {
    const op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });
  
  const span = document.createElement("span");
  span.className = "dropdown-text";
  // 처음엔 select 보임, span 숨김
  select.style.display = "inline-block";
  span.style.display = "none";
  
  container.appendChild(select);
  container.appendChild(span);
  return { container };
}

function createDetailDropdown() {
  const container = document.createElement("div");
  const select = document.createElement("select");
  select.className = "dropdown-select detail-dropdown";
  // 기본값 'Select'는 전략과제 선택 후 추가
  select.disabled = true;
  
  const span = document.createElement("span");
  span.className = "dropdown-text";
  select.style.display = "inline-block";
  span.style.display = "none";
  
  container.appendChild(select);
  container.appendChild(span);
  return { container };
}

function createTrafficDropdown() {
  const container = document.createElement("div");
  const select = document.createElement("select");
  select.className = "dropdown-select status-dropdown";
  
  const opts = [
    { val: "", text: "Select" },
    { val: "red", text: "Red" },
    { val: "yellow", text: "Yellow" },
    { val: "green", text: "Green" }
  ];
  opts.forEach(o => {
    const op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });
  
  const img = document.createElement("img");
  img.className = "status-image";
  select.style.display = "inline-block";
  img.style.display = "none";
  
  container.appendChild(select);
  container.appendChild(img);
  return { container };
}

/************************************************************
 * 4) 드롭다운 이벤트 초기화 (UI 동작 개선) - 발췌
 ************************************************************/
function initDropDownEvents(td) {
  // (0열) 전략
  const strategySelect = td.querySelector(".strategy-dropdown");
  const strategySpan = td.querySelector(".dropdown-text");
  if (strategySelect && strategySpan) {
    strategySelect.addEventListener("change", () => {
      const val = strategySelect.value;
      const displayText = strategySelect.options[strategySelect.selectedIndex].textContent;

      // ... 중략 ...
    });

    strategySpan.addEventListener("click", () => {
      strategySpan.style.display = "none";
      strategySelect.style.display = "inline-block";
      strategySelect.focus();

      
    });
  }

  // (1열) 세부 과제
  const detailSelect = td.querySelector(".detail-dropdown");
  const detailSpan = td.querySelector(".dropdown-text");
  if (detailSelect && detailSpan) {
    detailSelect.addEventListener("change", () => {
      // ...
    });
    detailSpan.addEventListener("click", () => {
      if (detailSelect.disabled) return;
      detailSpan.style.display = "none";
      detailSelect.style.display = "inline-block";
      detailSelect.focus();

      
    });
  }

  // (6열) 원활도(신호등)
  const statusSelect = td.querySelector(".status-dropdown");
  const statusImage = td.querySelector(".status-image");
  if (statusSelect && statusImage) {
    statusSelect.addEventListener("change", () => {
      // ...
    });
    statusImage.addEventListener("click", () => {
      statusImage.style.display = "none";
      statusSelect.style.display = "inline-block";
      statusSelect.focus();

      ['mousedown','mouseup','click'].forEach(evtType => {
        const evt = new MouseEvent(evtType, { bubbles: true, cancelable: true, view: window });
        statusSelect.dispatchEvent(evt);
      });
    });
  }
}


function handleStrategyChange(strategyTd, val) {
  // val에 따라 세부 과제 dropdown 채우기
  const row = strategyTd.closest("tr");
  if (!row) return;
  const tds = row.querySelectorAll("td");
  if (tds.length < 2) return;
  const detailTd = tds[1];
  const detailSelect = detailTd.querySelector(".detail-dropdown");
  const detailSpan = detailTd.querySelector(".dropdown-text");
  
  if (!val) {
    // (선택)인 경우 detail 초기화
    detailSelect.innerHTML = "";
    detailSelect.disabled = true;
    detailSpan.textContent = "";
    detailSpan.style.display = "none";
    return;
  }
  detailSelect.disabled = false;
  detailSelect.innerHTML = "";
  const newOptions = STRATEGY_TO_DETAIL_OPTIONS[val] || [];
  newOptions.forEach(item => {
    const op = document.createElement("option");
    op.value = item;
    op.textContent = item;
    detailSelect.appendChild(op);
  });
  detailSelect.style.display = "inline-block";
  detailSpan.textContent = "";
  detailSpan.style.display = "none";
}

/************************************************************
 * 5) 표 초기화 + 행 추가
 ************************************************************/
function initTable(table) {
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    const tds = row.querySelectorAll("td");
    // 0열=전략, 1열=세부, 6열=신호등
    // 만약 해당 열에 dropdown이 없으면 생성
    // (이미 서버에서 불러온 HTML에 들어있지 않을 수도 있으니)
    
    // 0열 (전략)
    if (tds[0] && !tds[0].querySelector(".strategy-dropdown")) {
      const { container } = createStrategyDropdown();
      tds[0].appendChild(container);
    }
    // 1열 (세부)
    if (tds[1] && !tds[1].querySelector(".detail-dropdown")) {
      const { container } = createDetailDropdown();
      tds[1].appendChild(container);
    }
    // 6열 (원활도)
    if (tds[6] && !tds[6].querySelector(".status-dropdown")) {
      const { container } = createTrafficDropdown();
      tds[6].appendChild(container);
    }
    // 그 외 컬럼(2,3,4,5,7,8,9,10,11,12)은 editable로 처리 (이미 HTML에 contenteditable 지정)
    
    // 드롭다운 이벤트 바인딩
    tds.forEach(td => initDropDownEvents(td));
  });
  
  // 표가 바뀔 때마다 “행 삭제” 드롭다운을 갱신
  updateDeleteRowDropdown();
}

function addNewRow() {
  const table = document.querySelector(".myTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  // 총 13열 (0..12)
  const tr = document.createElement("tr");
  for (let col=0; col<13; col++) {
    const td = document.createElement("td");
    if (col === 0) {
      // 전략 dropdown
      const { container } = createStrategyDropdown();
      td.appendChild(container);
    } else if (col === 1) {
      // 세부 dropdown
      const { container } = createDetailDropdown();
      td.appendChild(container);
    } else if (col === 6) {
      // 원활도(신호등)
      const { container } = createTrafficDropdown();
      td.appendChild(container);
    } else {
      // 나머지 열은 editable
      td.classList.add("editable");
      td.contentEditable = "true";
    }
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  initTable(table);
}

/************************************************************
 * 5-1) 행 삭제 드롭다운 & 버튼
 ************************************************************/
function updateDeleteRowDropdown() {
  // 현재 테이블의 행 수 파악 (thead 제외)
  const select = document.getElementById("deleteRowSelect");
  if (!select) return;
  const table = document.querySelector("#currentTableContainer .myTable");
  if (!table) {
    select.innerHTML = "";
    const op = document.createElement("option");
    op.value = "-";
    op.textContent = "-";
    select.appendChild(op);
    return;
  }
  const tbody = table.querySelector("tbody");
  if (!tbody) {
    select.innerHTML = "";
    const op = document.createElement("option");
    op.value = "-";
    op.textContent = "-";
    select.appendChild(op);
    return;
  }
  const rows = tbody.querySelectorAll("tr");
  const rowCount = rows.length;
  select.innerHTML = "";
  if (rowCount === 0) {
    // 행이 없으면 "-"
    const op = document.createElement("option");
    op.value = "-";
    op.textContent = "-";
    select.appendChild(op);
  } else {
    // 1..rowCount
    for (let i=1; i<=rowCount; i++) {
      const op = document.createElement("option");
      op.value = String(i);
      op.textContent = String(i);
      select.appendChild(op);
    }
  }
}

function initDeleteRowButton() {
  const btn = document.getElementById("deleteRowBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const select = document.getElementById("deleteRowSelect");
    if (!select) return;
    const val = select.value;
    if (val === "-" || !val) {
      return; // 삭제할 행이 없음
    }
    // val은 "1"~"n". n번째 행 => index = n-1
    const table = document.querySelector("#currentTableContainer .myTable");
    if (!table) return;
    const rows = table.querySelectorAll("tbody tr");
    const idx = parseInt(val, 10) - 1;
    if (idx >= 0 && idx < rows.length) {
      rows[idx].parentNode.removeChild(rows[idx]);
    }
    // 삭제 후 드롭다운 갱신
    updateDeleteRowDropdown();
  });
}

/************************************************************
 * 6) 서버 저장 데이터 불러오기 및 UI 업데이트
 ************************************************************/
function fetchStoredData(callback) {
  fetch(`${LOCAL_SERVER_URL}/listData?folder=${folderName}&token=${token}`)
    .then(resp => resp.json())
    .then(records => {
      if (!Array.isArray(records)) {
        records = [];
      }
      fetchedRecords = records;
      if (callback) callback();
      updateUIForSelectedDate(currentEditingDate);
    })
    .catch(err => {
      console.error("데이터 로드 오류:", err);
    });
}

function updateUIForSelectedDate(selectedDate) {
  const latest = getUpcomingThursday();
  const currentHeader = document.getElementById("currentHeader");
  const currentContainer = document.getElementById("currentTableContainer");
  const pastContainer = document.getElementById("pastDataContainer");
  
  let headerText = (selectedDate === latest)
                   ? `(이번주) ${selectedDate} 주간현황`
                   : `(과거) ${selectedDate} 주간현황`;
  currentHeader.textContent = headerText;
  
  // 편집 영역
  const editableTable = currentContainer.querySelector(".myTable");
  if (editableTable) {
    const editableTbody = editableTable.querySelector("tbody");
    const record = fetchedRecords.find(r => r.date === selectedDate);
    if (record) {
      editableTbody.innerHTML = record.tableHTML;
      initTable(editableTable);
    } else {
      if (selectedDate === latest) {
        currentHeader.textContent = `(이번주) ${selectedDate} 주간현황 : 아직 작성되지 않았음`;
      }
      editableTbody.innerHTML = "";
      initTable(editableTable);
    }
  }
  
  // 조회 영역 (과거 날짜들)
  pastContainer.innerHTML = "";
  // "<저장된 주간현황 내역>" 등 이미 index.html에 썼을 수도 있으나, 
  // 여기서는 기존대로 pastContainer 내부만 갱신
  let datesToShow = [];
  if (selectedDate === latest) {
    // 최신 + 전주 + 전전주
    const recLatest = fetchedRecords.find(r => r.date === latest);
    if (recLatest) {
      datesToShow.push(latest);
    }
    const p1 = getPreviousThursday(latest, 1);
    const p2 = getPreviousThursday(latest, 2);
    if (fetchedRecords.find(r => r.date === p1)) {
      datesToShow.push(p1);
    }
    if (fetchedRecords.find(r => r.date === p2)) {
      datesToShow.push(p2);
    }
  } else {
    datesToShow = fetchedRecords
      .map(r => r.date)
      .filter(d => d <= latest && d >= selectedDate);
    if (!datesToShow.includes(latest)) {
      datesToShow.push(latest);
    }
    datesToShow.sort((a,b) => b.localeCompare(a));
  }
  
  if (datesToShow.length === 0) {
    pastContainer.textContent = "(과거 주간현황 기록 없음)";
  } else {
    datesToShow.forEach(date => {
      const rec = fetchedRecords.find(r => r.date === date);
      const section = document.createElement("div");
      section.style.marginBottom = "20px";
      const header = document.createElement("div");
      header.textContent = (date === latest)
                           ? `(이번주) ${date} 주간현황`
                           : `(과거) ${date} 주간현황`;
      if (date === selectedDate) {
        header.style.backgroundColor = "#ffffe0";
        header.style.color = "blue";
        header.style.fontWeight = "bold";
        header.style.fontStyle = "italic";
      }
      section.appendChild(header);
      
      if (rec) {
        const table = document.createElement("table");
        table.className = "myTable";
        table.innerHTML = TABLE_TEMPLATE + `<tbody>${rec.tableHTML}</tbody>`;
        makeTableStatic(table);
        section.appendChild(table);
      } else {
        const msg = document.createElement("div");
        msg.textContent = "기록 없음";
        section.appendChild(msg);
      }
      pastContainer.appendChild(section);
    });
  }
}

/************************************************************
 * makeTableStatic – 조회 영역 표는 읽기 전용
 ************************************************************/
function makeTableStatic(wrapper) {
  const selects = wrapper.querySelectorAll("select");
  selects.forEach(sel => sel.disabled = true);
  
  const tds = wrapper.querySelectorAll("td.editable");
  tds.forEach(td => {
    td.removeAttribute("contenteditable");
    td.style.backgroundColor = "#f0f0f0";
  });
}

/************************************************************
 * 7) 데이터 제출 (Submit 버튼)
 ************************************************************/
function submitData(date, callback) {
  const tbodyElem = document.querySelector("#currentTableContainer .myTable tbody");
  if (!tbodyElem) {
    alert("표 데이터가 없습니다.");
    return;
  }
  const tableData = tbodyElem.innerHTML;
  const payload = { folder: folderName, date, tableData, token };
  
  fetch(`${LOCAL_SERVER_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(resp => resp.json())
    .then(data => {
      if (data.error) {
        alert("전송 오류: " + data.error);
      } else {
        if (callback) callback();
        fetchStoredData();
      }
    })
    .catch(err => {
      console.error("전송 오류:", err);
      alert("전송에 실패했습니다.");
    });
}

function initSubmitButton() {
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) return;
  submitBtn.addEventListener("click", () => {
    if (!folderName) {
      alert("folder 파라미터가 유효하지 않습니다.");
      return;
    }
    const dateSelect = document.querySelector(".date-dropdown");
    if (!dateSelect || !dateSelect.value) {
      alert("날짜를 선택해주세요.");
      return;
    }
    const selectedDate = dateSelect.value;
    
    const currentTableElem = document.querySelector("#currentTableContainer .myTable tbody");
    if (!currentTableElem) return;
    const currentTableHTML = currentTableElem.innerHTML.trim();
    const savedRecord = fetchedRecords.find(r => r.date === selectedDate);
    const savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
    
    if (!savedRecord) {
      // 신규 저장
      submitData(selectedDate, () => {
        alert(`(${selectedDate}) 진행현황을 신규 저장했습니다.`);
        updateUIForSelectedDate(selectedDate);
      });
    } else {
      // 기존 값과 비교
      if (currentTableHTML !== savedTableHTML) {
        const choice = prompt(
          "현재 작성한 내용을 저장하시겠습니까? 기존 저장 내용과 다른 부분이 있습니다.\n1: 저장하기\n2: 취소 및 다시 확인하기"
        );
        if (choice === "1") {
          submitData(selectedDate, () => {
            alert(`(${selectedDate}) 진행현황을 저장했습니다.`);
            updateUIForSelectedDate(selectedDate);
          });
        } else {
          // 취소
          return;
        }
      } else {
        // 같으면 실제 전송 없이 메시지만
        alert(`(${selectedDate}) 진행현황을 저장했습니다.`);
        updateUIForSelectedDate(selectedDate);
      }
    }
    currentEditingDate = selectedDate;
  });
}

/************************************************************
 * 8) DOMContentLoaded
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  if (!initializeFolder()) {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }
  createDateDropdown();
  
  const editingTable = document.querySelector("#currentTableContainer .myTable");
  if (editingTable) initTable(editingTable);
  
  // 행 추가 버튼
  const addBtn = document.getElementById("addRowBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      addNewRow();
    });
  }
  // 행 삭제 버튼
  initDeleteRowButton();
  
  initSubmitButton();
  // 기본 편집 날짜
  const dateSelect = document.querySelector(".date-dropdown");
  currentEditingDate = dateSelect ? dateSelect.value : getUpcomingThursday();
  
  fetchStoredData();
});
