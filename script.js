/************************************************************
 * 0. 전역 변수 / 상수
 ************************************************************/
let folderName = "";
const LOCAL_SERVER_URL = "https://jun_cp.inviteu.org"; // 서버 주소
// (기타 이미지, 자동완성 후보, 전략→세부 매핑은 그대로 유지)
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
  A: ["컨설팅/제안(핵심&전략고객)", "사전컨설팅(for 고객발굴/사업화)", "이슈조정/해소(for AX전략이행/사업추진)"],
  B: ["Delivery방안 확보", "고객Ref. 확보", "AIAgentSvc. 발굴/확보"],
  C: ["글로벌Ref. 확보", "협력파트너 확보", "CoWork 사업 Ref. 확보"],
  D: ["Lead 내 담당 업무"],
  E: ["컨설팅/제안 지원(핵심&전략고객)", "그룹AX협력과제 발굴/이행지원", "MS/AX유관조직 가교역할"],
  F: ["AX컨설팅수행(핵심&전략고객)", "PoC기획/개발/프로토타이핑(핵심&전략고객)", "AIMSP협력모델 구축"],
  G: ["AX컨설팅방법론 표준화/확산", "AI신기술분석/내부역량강화/기술지원", "Ref.아키텍처 발굴/확산"],
  H: ["Lead 내 담당 업무"]
};

// 편집 영역 기본 날짜(최신 날짜)
let currentEditingDate = "";
// 서버에서 불러온 기록들을 저장할 전역 변수 (배열)
let fetchedRecords = [];

/************************************************************
 * 1) 폴더 초기화 및 부모 도메인 검사
 *    - 부모 페이지에서는 반드시 iframe의 src에 ?folder=... 파라미터로 전달되어야 함.
 ************************************************************/
function initializeFolder() {
  const ref = document.referrer;
  if (!ref.includes("atlassian.net")) {
    alert("Confluence(.atlassian.net)에서 접근하지 않아 동작이 제한됩니다.");
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  const folder = params.get("folder");
  if (!folder) {
    alert("folder 파라미터가 없습니다. 올바른 접근이 아닙니다.");
    return false;
  }
  folderName = folder;
  console.log("Folder initialized as:", folderName);
  return true;
}

/************************************************************
 * 2) 날짜 드롭다운 관련 및 현재 날짜 계산
 ************************************************************/
const originalDates = ["250124", "250117"];
const fullDateList = ["250206", "250124", "250117", "250110", "250103", "250096", "250089"];

function getNextThursday() {
  const today = new Date();
  const targetDay = 4; // 목요일
  const diff = (targetDay + 7 - today.getDay()) % 7 || 7;
  const nextThursday = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
  const yy = String(nextThursday.getFullYear()).slice(2);
  const mm = String(nextThursday.getMonth() + 1).padStart(2, "0");
  const dd = String(nextThursday.getDate()).padStart(2, "0");
  return yy + mm + dd;
}
// 현재 편집 대상 날짜: 기본적으로 최신 날짜 (getNextThursday())
function getCurrentDate() {
  return getNextThursday();
}

function createDateDropdown() {
  const container = document.getElementById("dateSelectorContainer");
  if (!container) return;
  container.innerHTML = "";
  const select = document.createElement("select");
  select.className = "dropdown-select date-dropdown";
  const newFirst = getCurrentDate();
  const opts = [
    { val: newFirst, text: newFirst },
    { val: originalDates[0], text: originalDates[0] },
    { val: originalDates[1], text: originalDates[1] },
    { val: "more", text: "더보기" }
  ];
  opts.forEach(o => {
    if (!o.val) return;
    const op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });
  container.appendChild(select);
  select.addEventListener("change", (e) => {
    let newDate = e.target.value;
    // 만약 변경하려는 날짜가 과거이면 (최신 날짜보다 작은 값)
    if (newDate < getCurrentDate()) {
      let currentTableHTML = document.querySelector("#currentTableContainer .myTable tbody").innerHTML.trim();
      let savedRecord = fetchedRecords.find(rec => rec.date === currentEditingDate);
      let savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
      if (currentTableHTML !== savedTableHTML) {
        if (!confirm(`경고: 과거 (${currentEditingDate}) 날짜의 데이터를 덮어씌우는 작업이 수행됩니다. 과거 데이터는 복구하실 수 없습니다. 수행하시겠습니까?`)) {
          e.target.value = currentEditingDate;
          return;
        } else {
          // 저장 후 날짜 변경 (submitData() 함수 사용)
          submitData(currentEditingDate, function() {
            currentEditingDate = newDate;
            updateUIForSelectedDate(newDate);
          });
          return;
        }
      }
    }
    currentEditingDate = newDate;
    updateUIForSelectedDate(newDate);
  });
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
    { val: "A", text: "1_AX사업..." },
    { val: "B", text: "1_MS파트너..." },
    { val: "C", text: "1_C..." },
    { val: "D", text: "1_D..." },
    { val: "E", text: "2_E..." },
    { val: "F", text: "2_F..." },
    { val: "G", text: "2_G..." },
    { val: "H", text: "2_Lead..." }
  ];
  opts.forEach(o => {
    const op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });
  const span = document.createElement("span");
  span.className = "dropdown-text";
  // 초기 상태: 드롭다운 보임, span 숨김
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
 * 4) 드롭다운 이벤트 초기화 (UI 동작 개선)
 ************************************************************/
function initDropDownEvents(td) {
  // (0열) 전략과제
  const strategySelect = td.querySelector(".strategy-dropdown");
  const strategySpan = td.querySelector(".dropdown-text");
  if (strategySelect && strategySpan) {
    strategySelect.addEventListener("change", () => {
      const val = strategySelect.value;
      const displayText = strategySelect.options[strategySelect.selectedIndex].textContent;
      if (val) {
        strategySpan.textContent = displayText;
        // 드롭다운 숨기고 텍스트만 보이게
        strategySelect.style.display = "none";
        strategySpan.style.display = "inline-block";
      }
      handleStrategyChange(td, val);
    });
    strategySpan.addEventListener("click", () => {
      // 텍스트 클릭 시 다시 드롭다운으로 전환
      strategySpan.textContent = "";
      strategySpan.style.display = "none";
      strategySelect.value = "";
      strategySelect.style.display = "inline-block";
    });
  }
  
  // (1열) 세부항목
  const detailSelect = td.querySelector(".detail-dropdown");
  const detailSpan = td.querySelector(".dropdown-text");
  if (detailSelect && detailSpan) {
    detailSelect.addEventListener("change", () => {
      const val = detailSelect.value;
      if (val) {
        detailSpan.textContent = val;
        detailSelect.style.display = "none";
        detailSpan.style.display = "inline-block";
      }
    });
    detailSpan.addEventListener("click", () => {
      detailSpan.textContent = "";
      detailSpan.style.display = "none";
      detailSelect.value = "";
      detailSelect.style.display = "inline-block";
    });
  }
  
  // (6열) 신호등
  const statusSelect = td.querySelector(".status-dropdown");
  const statusImage = td.querySelector(".status-image");
  if (statusSelect && statusImage) {
    statusSelect.addEventListener("change", () => {
      const colorVal = statusSelect.value;
      if (IMAGE_URLS[colorVal]) {
        statusImage.src = IMAGE_URLS[colorVal];
        statusSelect.style.display = "none";
        statusImage.style.display = "inline-block";
      }
    });
    statusImage.addEventListener("click", () => {
      statusImage.style.display = "none";
      statusSelect.value = "";
      statusSelect.style.display = "inline-block";
    });
  }
}

function handleStrategyChange(strategyTd, strategyVal) {
  const row = strategyTd.closest("tr");
  if (!row) return;
  const tds = row.querySelectorAll("td");
  if (tds.length < 2) return;
  const detailTd = tds[1];
  const detailSelect = detailTd.querySelector(".detail-dropdown");
  const detailSpan = detailTd.querySelector(".dropdown-text");
  if (!detailSelect || !detailSpan) return;
  if (!strategyVal) {
    detailSelect.innerHTML = "";
    detailSelect.style.display = "inline-block";
    detailSpan.textContent = "";
    detailSpan.style.display = "none";
    return;
  }
  detailSelect.innerHTML = "";
  const blankOpt = document.createElement("option");
  blankOpt.value = "";
  blankOpt.textContent = "Select";
  detailSelect.appendChild(blankOpt);
  const newOptions = STRATEGY_TO_DETAIL_OPTIONS[strategyVal] || [];
  newOptions.forEach(val => {
    const op = document.createElement("option");
    op.value = val;
    op.textContent = val;
    detailSelect.appendChild(op);
  });
  detailSelect.value = "";
  detailSelect.style.display = "inline-block";
  detailSpan.textContent = "";
  detailSpan.style.display = "none";
}

/************************************************************
 * 5) 표 초기화 및 행 추가 (편집용 표)
 ************************************************************/
function initTable(table) {
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    const tds = row.querySelectorAll("td");
    if (tds[0] && !tds[0].querySelector(".strategy-dropdown")) {
      const { container } = createStrategyDropdown();
      tds[0].appendChild(container);
    }
    if (tds[1] && !tds[1].querySelector(".detail-dropdown")) {
      const { container } = createDetailDropdown();
      tds[1].appendChild(container);
    }
    if (tds[6] && !tds[6].querySelector(".status-dropdown")) {
      const { container } = createTrafficDropdown();
      tds[6].appendChild(container);
    }
    tds.forEach(td => initDropDownEvents(td));
  });
}

function addNewRow() {
  const table = document.querySelector(".myTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;
  const tr = document.createElement("tr");
  for (let i = 0; i < 8; i++) {
    const td = document.createElement("td");
    if ([0, 1, 6].includes(i)) {
      // 드롭다운은 initTable에서 추가됨
    } else {
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
 *     - 수평선 위: 편집 영역 (현재 데이터)
 *     - 수평선 아래: 과거 기록 영역 (읽기 전용)
 ************************************************************/
function fetchStoredData(callback) {
  fetch(`${LOCAL_SERVER_URL}/listData?folder=${folderName}&token=${token}`)

    .then(resp => resp.json())
    .then(records => {
      console.log("Fetched records:", records);
      // records가 배열이 아닐 경우 강제로 배열로 처리
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
  const currentHeader = document.getElementById("currentHeader");
  const currentContainer = document.getElementById("currentTableContainer");
  const pastContainer = document.getElementById("pastDataContainer");
  currentHeader.textContent = `(현재) ${selectedDate} 주간현황`;
  
  // 편집 영역 업데이트: #currentTableContainer 내 편집용 표
  const editableTable = currentContainer.querySelector(".myTable");
  if (editableTable) {
    const editableTbody = editableTable.querySelector("tbody");
    const record = fetchedRecords.find(rec => rec.date === selectedDate);
    if (record) {
      editableTbody.innerHTML = record.tableHTML;
      initTable(editableTable);
    }
    // 기록이 없으면 편집 표 그대로 둠
  }
  
  // 과거 영역 업데이트: selectedDate보다 이전 날짜의 기록만 표시
  pastContainer.innerHTML = "";
  const pastRecords = fetchedRecords.filter(rec => rec.date < selectedDate);
  if (pastRecords.length === 0) {
    pastContainer.textContent = "(과거 주간현황 기록 없음)";
  } else {
    pastRecords.sort((a, b) => b.date.localeCompare(a.date));
    pastRecords.forEach(rec => {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";
      const header = document.createElement("div");
      header.className = "data-section-header";
      header.textContent = `(과거) ${rec.date} 주간현황`;
      section.appendChild(header);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = rec.tableHTML;
      makeTableStatic(wrapper);
      section.appendChild(wrapper);
      pastContainer.appendChild(section);
    });
  }
}

// makeTableStatic: wrapper 내의 드롭다운과 편집 기능 비활성화 (읽기 전용)
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
 *     - 과거 날짜 제출 시, 기존 데이터와 비교하여 경고창 표시
 ************************************************************/
function submitData(date, callback) {
  const tbodyElem = document.querySelector("#currentTableContainer .myTable tbody");
  if (!tbodyElem) {
    alert("표 데이터가 없습니다.");
    return;
  }
  const tableData = tbodyElem.innerHTML;
  const payload = { folder: folderName, date: date, tableData: tableData, token: token };
  fetch(`${LOCAL_SERVER_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(resp => resp.json())
    .then(data => {
      alert("전송 성공: " + JSON.stringify(data));
      if (callback) callback();
      fetchStoredData();
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
    // 과거 날짜로 제출하는 경우
    if (selectedDate < getCurrentDate()) {
      let currentTableHTML = document.querySelector("#currentTableContainer .myTable tbody").innerHTML.trim();
      let savedRecord = fetchedRecords.find(rec => rec.date === selectedDate);
      let savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
      if (currentTableHTML !== savedTableHTML) {
        if (!confirm(`경고: 과거 (${selectedDate}) 날짜의 데이터를 덮어씌우는 작업이 수행됩니다. 과거 데이터는 복구하실 수 없습니다. 수행하시겠습니까?`)) {
          return;
        }
      }
    }
    submitData(selectedDate);
    currentEditingDate = selectedDate;
  });
}

/************************************************************
 * 8) DOMContentLoaded – 초기화
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
  const addBtn = document.getElementById("addRowBtn");
  if (addBtn) addBtn.addEventListener("click", addNewRow);
  initSubmitButton();
  currentEditingDate = document.querySelector(".date-dropdown") ? document.querySelector(".date-dropdown").value : getCurrentDate();
  fetchStoredData();
});
