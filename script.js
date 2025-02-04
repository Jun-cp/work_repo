/************************************************************
 * 0. 전역 변수 / 상수
 ************************************************************/
let folderName = "";
const ALLOWED_FOLDERS = ["11", "1", "3"]; // 허용된 folder 값
const LOCAL_SERVER_URL = "https://jun_cp.inviteu.org"; // 서버 주소

// 이미지, 자동완성 후보, 전략→세부 매핑
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

/************************************************************
 * 1) 폴더 초기화 및 부모 도메인 검사
 *    - 부모 페이지에서는 반드시 iframe src에 ?folder=1,2,3 등으로 전달
 *    - 또한 document.referrer에서 atlassian.net 도메인이 있는지 최소 검사
 ************************************************************/
function initializeFolder() {
  // 최소한 Confluence 도메인 검사
  const ref = document.referrer;
  if (!ref.includes("atlassian.net")) {
    alert("Confluence(.atlassian.net)에서 접근하지 않아 동작이 제한됩니다.");
    return false;
  }
  // URL 쿼리 파라미터에서 folder 읽기
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
 * 2) 날짜 드롭다운 관련
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
// 현재 날짜(현재의 기준 날짜, getNextThursday() 사용)
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
    if (e.target.value === "more") {
      showFullDateList(select);
    }
  });
}

function showFullDateList(selectEl) {
  const listStr = fullDateList.join(", ");
  const chosen = prompt("전체 날짜 목록:\n" + listStr + "\n\n원하는 날짜를 입력하세요:");
  if (fullDateList.includes(chosen)) {
    selectEl.value = chosen;
  } else {
    alert("유효한 날짜가 아닙니다.");
    selectEl.selectedIndex = 0;
  }
}

/************************************************************
 * 3) 드롭다운/신호등 생성 함수 (기존 유지)
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

/************************************************************
 * 4) 드롭다운 이벤트 초기화 (기존 유지)
 ************************************************************/
function initDropDownEvents(td) {
  const strategySelect = td.querySelector(".strategy-dropdown");
  const strategySpan = td.querySelector(".dropdown-text");
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
  const detailSpan = td.querySelector(".dropdown-text");
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
  const statusImage = td.querySelector(".status-image");
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
 * 5) 표 초기화 및 행 추가 (편집용 표: .myTable)
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
 * 6) 저장 데이터 불러오기 (GET /listData?folder=…)
 ************************************************************/
function fetchStoredData() {
  fetch(`${LOCAL_SERVER_URL}/listData?folder=${folderName}`)
    .then(resp => resp.json())
    .then(records => {
      // records: 배열 of { tableHTML, timestamp, date }
      const currentDate = getCurrentDate();
      console.log("Computed current date:", currentDate);
      
      // 컨테이너 초기화
      const currentHeader = document.getElementById("currentHeader");
      const currentContainer = document.getElementById("currentTableContainer");
      const pastContainer = document.getElementById("pastDataContainer");
      currentHeader.innerHTML = "";
      currentContainer.innerHTML = "";
      pastContainer.innerHTML = "";
      
      let currentRecord = null;
      const pastRecords = [];
      records.forEach(rec => {
        if (rec.date === currentDate) {
          currentRecord = rec;
        } else {
          pastRecords.push(rec);
        }
      });
      
      // 현재 데이터 표시
      currentHeader.textContent = `(현재) ${currentDate} 주간현황`;
      if (currentRecord) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = currentRecord.tableHTML;
        const table = wrapper.querySelector("table");
        if (table) initTable(table);
        currentContainer.appendChild(wrapper);
      } else {
        // 현재 데이터 없으면 편집용 표를 그대로 클론하여 표시
        const editingTable = document.querySelector(".myTable");
        if (editingTable) {
          const cloneWrapper = document.createElement("div");
          cloneWrapper.innerHTML = editingTable.outerHTML;
          currentContainer.appendChild(cloneWrapper);
        }
      }
      
      // 과거 데이터 표시 (날짜 내림차순 정렬)
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
        const table = wrapper.querySelector("table");
        if (table) initTable(table);
        section.appendChild(wrapper);
        pastContainer.appendChild(section);
      });
    })
    .catch(err => {
      console.error("데이터 로드 오류:", err);
    });
}

/************************************************************
 * 7) Submit 버튼 (데이터 수집 및 전송)
 * - 만약 선택한 날짜가 현재 날짜와 다르면 경고창 표시
 ************************************************************/
function initSubmitButton() {
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) return;
  submitBtn.addEventListener("click", () => {
    if (!folderName) {
      alert("folder 파라미터가 유효하지 않습니다.");
      return;
    }
    // 날짜 선택 확인
    const dateSelect = document.querySelector(".date-dropdown");
    if (!dateSelect || !dateSelect.value) {
      alert("날짜를 선택해주세요.");
      return;
    }
    const selectedDate = dateSelect.value;
    if (selectedDate === "more") {
      alert("날짜를 올바르게 선택해주세요.");
      return;
    }
    // 만약 선택한 날짜가 현재 날짜(getCurrentDate())와 다르면 경고
    const currentDate = getCurrentDate();
    if (selectedDate !== currentDate) {
      const confirmMsg = `경고: 과거 (${selectedDate}) 날짜의 데이터를 덮어씌우는 작업이 수행됩니다. 과거 데이터는 복구하실 수 없습니다. 수행하시겠습니까?`;
      if (!confirm(confirmMsg)) {
        // 취소 시 작업 중단 (입력 내용 유지)
        return;
      }
    }
    // 편집용 표 데이터 수집
    const tbodyElem = document.querySelector(".myTable tbody");
    if (!tbodyElem) {
      alert("표 데이터가 없습니다.");
      return;
    }
    const tableData = tbodyElem.innerHTML;
    const payload = {
      folder: folderName,
      date: selectedDate,
      tableData: tableData
    };
    fetch(`${LOCAL_SERVER_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(resp => resp.json())
      .then(data => {
        alert("전송 성공: " + JSON.stringify(data));
        // 제출 후 저장 데이터 새로 고침
        fetchStoredData();
      })
      .catch(err => {
        console.error("전송 오류:", err);
        alert("전송에 실패했습니다.");
      });
  });
}

/************************************************************
 * 8) DOMContentLoaded: 초기화
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  if (!initializeFolder()) {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;
    return;
  }
  createDateDropdown();
  const editingTable = document.querySelector(".myTable");
  if (editingTable) initTable(editingTable);
  const addBtn = document.getElementById("addRowBtn");
  if (addBtn) addBtn.addEventListener("click", addNewRow);
  initSubmitButton();
  // 페이지 진입 시 서버로부터 저장된 데이터 불러오기
  fetchStoredData();
});
