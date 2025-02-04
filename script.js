/************************************************************
 * 0. 전역 변수 / 상수
 ************************************************************/
let folderName = "";
const ALLOWED_FOLDERS = ["11", "1", "3"]; // 허용된 folder 값 (서버에서도 검증)
const LOCAL_SERVER_URL = "https://jun_cp.inviteu.org"; // 서버 주소

// 이미지, 자동완성 후보, 전략→세부 매핑 (기존 그대로)
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

// 편집 영역 현재 날짜 (기본적으로 드롭다운 기본값) 저장
let currentEditingDate = "";
// 서버에서 불러온 기록들을 저장할 전역 변수 (배열)
let fetchedRecords = [];

/************************************************************
 * 1) 폴더 초기화 및 부모 도메인 검사
 *    - 반드시 쿼리파라미터 (?folder=1 등)로 전달되어야 함.
 *    - 또한 document.referrer로 최소한 atlassian.net 도메인인지 확인.
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
  if (!ALLOWED_FOLDERS.includes(folder)) {
    alert("허용되지 않은 folder 파라미터: " + folder);
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
// 현재 편집 대상 날짜는 기본적으로 getNextThursday() (최신)로 설정됨.
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
  
  // 날짜 변경 시 처리 (아래 추가 이벤트에서 업데이트)
  select.addEventListener("change", (e) => {
    let newDate = e.target.value;
    // 만약 변경 전 날짜와 다르다면...
    if (newDate === currentEditingDate) return;
    
    // 만일 변경하려는 날짜가 과거 (getCurrentDate()보다 작은 값)…
    if (newDate < getCurrentDate()) {
      // 현재 편집 영역(.myTable tbody)의 내용과 저장된 값(저장된 기록 중 currentEditingDate의 내용)을 비교
      let currentTableHTML = document.querySelector(".myTable tbody").innerHTML.trim();
      let savedRecord = fetchedRecords.find(rec => rec.date === currentEditingDate);
      let savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
      if (currentTableHTML !== savedTableHTML) {
        if (!confirm(`경고: 과거 (${currentEditingDate}) 날짜의 데이터를 덮어씌우는 작업이 수행됩니다. 과거 데이터는 복구하실 수 없습니다. 수행하시겠습니까?`)) {
          // 사용자가 취소하면 드롭다운을 이전 값으로 되돌림.
          e.target.value = currentEditingDate;
          return;
        } else {
          // 확인 시, 기존 편집 내용을 저장하고 UI 갱신
          submitData(currentEditingDate, function() {
            // 저장 후 계속 진행하여 날짜 변경
            currentEditingDate = newDate;
            updateUIForSelectedDate(newDate);
          });
          return; // submitData 호출 후 리턴
        }
      }
    }
    // 변경 사항이 없거나 최신 날짜인 경우 바로 변경
    currentEditingDate = newDate;
    updateUIForSelectedDate(newDate);
  });
}

/************************************************************
 * 3) 기존 드롭다운/신호등 생성 및 이벤트 (변경 없음)
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
  span.className = "dropdown-text hidden";
  container.appendChild(select);
  container.appendChild(span);
  return { container };
}

function createDetailDropdown() {
  const container = document.createElement("div");
  const select = document.createElement("select");
  select.className = "dropdown-select detail-dropdown hidden";
  const span = document.createElement("span");
  span.className = "dropdown-text hidden";
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
  img.className = "status-image hidden";
  container.appendChild(select);
  container.appendChild(img);
  return { container };
}

function initDropDownEvents(td) {
  const strategySelect = td.querySelector(".strategy-dropdown");
  const strategySpan   = td.querySelector(".dropdown-text");
  if (strategySelect && strategySpan) {
    strategySelect.addEventListener("change", () => {
      const val = strategySelect.value;
      const displayText = strategySelect.options[strategySelect.selectedIndex].textContent;
      if (val) {
        strategySpan.textContent = displayText;
        strategySelect.classList.add("hidden");
        strategySpan.classList.remove("hidden");
      } else {
        strategySpan.textContent = "";
      }
      handleStrategyChange(td, val);
    });
    strategySpan.addEventListener("click", () => {
      strategySpan.classList.add("hidden");
      strategySelect.classList.remove("hidden");
    });
  }
  const detailSelect = td.querySelector(".detail-dropdown");
  const detailSpan   = td.querySelector(".dropdown-text");
  if (detailSelect && detailSpan) {
    detailSelect.addEventListener("change", () => {
      const val = detailSelect.value;
      if (val) {
        detailSpan.textContent = val;
        detailSelect.classList.add("hidden");
        detailSpan.classList.remove("hidden");
      } else {
        detailSpan.textContent = "";
      }
    });
    detailSpan.addEventListener("click", () => {
      detailSpan.classList.add("hidden");
      detailSelect.classList.remove("hidden");
    });
  }
  const statusSelect = td.querySelector(".status-dropdown");
  const statusImage  = td.querySelector(".status-image");
  if (statusSelect && statusImage) {
    statusSelect.addEventListener("change", () => {
      const colorVal = statusSelect.value;
      if (IMAGE_URLS[colorVal]) {
        statusImage.src = IMAGE_URLS[colorVal];
        statusSelect.classList.add("hidden");
        statusImage.classList.remove("hidden");
      } else {
        statusImage.classList.add("hidden");
      }
    });
    statusImage.addEventListener("click", () => {
      statusImage.classList.add("hidden");
      statusSelect.classList.remove("hidden");
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
    detailSelect.classList.add("hidden");
    detailSpan.classList.add("hidden");
    detailSpan.textContent = "";
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
  detailSelect.classList.remove("hidden");
  detailSpan.classList.add("hidden");
  detailSpan.textContent = "";
}

/************************************************************
 * 4) 표 초기화 및 행 추가 (편집용)
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
 * 5) 서버 저장 데이터 불러오기 및 UI 업데이트
 ************************************************************/
// 전역에 저장된 fetchedRecords (배열)
function fetchStoredData(callback) {
  fetch(`${LOCAL_SERVER_URL}/listData?folder=${folderName}`)
    .then(resp => resp.json())
    .then(records => {
      fetchedRecords = records || [];
      if (callback) callback();
      updateUIForSelectedDate(currentEditingDate);
    })
    .catch(err => {
      console.error("데이터 로드 오류:", err);
    });
}

// 편집영역과 과거영역을 업데이트
function updateUIForSelectedDate(selectedDate) {
  // 업데이트 대상: currentDataContainer (편집영역)와 pastDataContainer (읽기 전용 과거 기록)
  const currentHeader = document.getElementById("currentHeader");
  const currentContainer = document.getElementById("currentTableContainer");
  const pastContainer = document.getElementById("pastDataContainer");
  currentHeader.textContent = `(현재) ${selectedDate} 주간현황`;
  // 편집영역: 만약 저장된 기록이 있으면 불러오고, 없으면 기존 .myTable (빈 편집 표) 그대로 유지
  const record = fetchedRecords.find(rec => rec.date === selectedDate);
  if (record) {
    // 편집영역에 저장된 HTML을 불러오되, 드롭다운 및 이벤트는 활성화되어야 하므로
    // 기존 편집용 표(.myTable)의 tbody를 교체
    const editableTbody = document.querySelector(".myTable tbody");
    editableTbody.innerHTML = record.tableHTML;
    initTable(document.querySelector(".myTable"));
  } else {
    // 저장된 기록이 없으면 그대로 빈 편집 표를 유지
  }
  // 과거 영역: selectedDate보다 이전인 기록만 표시 (읽기 전용)
  pastContainer.innerHTML = "";
  const pastRecords = fetchedRecords.filter(rec => rec.date < selectedDate);
  if (pastRecords.length === 0) {
    pastContainer.textContent = "(과거 주간현황 기록 없음)";
  } else {
    // 내림차순 정렬 (최신순)
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
      // Make static: disable editing and hide dropdowns
      makeTableStatic(wrapper);
      section.appendChild(wrapper);
      pastContainer.appendChild(section);
    });
  }
}

// 함수: wrapper 내의 모든 드롭다운, contenteditable 속성을 제거하여 읽기 전용으로 만듦.
function makeTableStatic(wrapper) {
  // 모든 select 태그는 disabled 처리
  const selects = wrapper.querySelectorAll("select");
  selects.forEach(sel => sel.disabled = true);
  // 모든 td.editable는 contenteditable="false"
  const tds = wrapper.querySelectorAll("td.editable");
  tds.forEach(td => {
    td.removeAttribute("contenteditable");
    td.style.backgroundColor = "#f0f0f0";
  });
}

/************************************************************
 * 6) 데이터 제출 (Submit 버튼 클릭 시)
 ************************************************************/
function submitData(date, callback) {
  // 수집: 편집 표(.myTable tbody)의 innerHTML
  const tbodyElem = document.querySelector(".myTable tbody");
  if (!tbodyElem) {
    alert("표 데이터가 없습니다.");
    return;
  }
  const tableData = tbodyElem.innerHTML;
  const payload = { folder: folderName, date: date, tableData: tableData };
  fetch(`${LOCAL_SERVER_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(resp => resp.json())
    .then(data => {
      alert("전송 성공: " + JSON.stringify(data));
      if (callback) callback();
      fetchStoredData(); // 저장 후 데이터 새로 불러오기
    })
    .catch(err => {
      console.error("전송 오류:", err);
      alert("전송에 실패했습니다.");
    });
}

// Submit 버튼 이벤트 – 사용자가 직접 Submit 버튼을 클릭할 경우
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
    // 만일 과거 날짜로 제출할 경우, 편집 표 내용이 저장된 기록과 다르면 경고
    if (selectedDate < getCurrentDate()) {
      let currentTableHTML = document.querySelector(".myTable tbody").innerHTML.trim();
      let savedRecord = fetchedRecords.find(rec => rec.date === selectedDate);
      let savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
      if (currentTableHTML !== savedTableHTML) {
        if (!confirm(`경고: 과거 (${selectedDate}) 날짜의 데이터를 덮어씌우는 작업이 수행됩니다. 과거 데이터는 복구하실 수 없습니다. 수행하시겠습니까?`)) {
          return; // 취소하면 아무 작업도 하지 않음
        }
      }
    }
    // 제출
    submitData(selectedDate);
    // currentEditingDate는 dropdown의 현재 값으로 업데이트
    currentEditingDate = selectedDate;
  });
}

/************************************************************
 * 7) DOMContentLoaded – 초기화
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  if (!initializeFolder()) {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }
  createDateDropdown();
  // 기본 편집 표 초기화
  const editingTable = document.querySelector(".myTable");
  if (editingTable) initTable(editingTable);
  const addBtn = document.getElementById("addRowBtn");
  if (addBtn) addBtn.addEventListener("click", addNewRow);
  initSubmitButton();
  // 전역 편집 날짜 기본값: 드롭다운의 현재 선택값
  const dateSelect = document.querySelector(".date-dropdown");
  currentEditingDate = dateSelect ? dateSelect.value : getCurrentDate();
  // 페이지 진입 시 서버 데이터 불러오기 및 UI 업데이트
  fetchStoredData();
});
