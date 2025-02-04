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

// 현재 편집 대상 날짜 (기본적으로 최신 목요일)
let currentEditingDate = "";
// 서버에서 불러온 기록들을 저장할 전역 변수 (배열)
let fetchedRecords = [];

/************************************************************
 * 날짜 관련 헬퍼 함수
 ************************************************************/
// “최신 목요일”은 오늘이 목요일이면 오늘, 그 외에는 이번주 목요일
function getUpcomingThursdayDate() {
  const today = new Date();
  let diff;
  if (today.getDay() <= 4) {
    diff = 4 - today.getDay(); // 오늘이 목요일이면 diff=0
  } else {
    diff = 11 - today.getDay(); // 금/토/일이면 다음주 목요일까지
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

// selectedDate(YYMMDD)를 Date객체로 변환한 후 weeksAgo 주(7일씩) 빼서 다시 YYMMDD 문자열 반환
function getPreviousThursday(dateStr, weeksAgo) {
  const year = 2000 + parseInt(dateStr.slice(0,2));
  const month = parseInt(dateStr.slice(2,4)) - 1;
  const day = parseInt(dateStr.slice(4,6));
  const dateObj = new Date(year, month, day);
  dateObj.setDate(dateObj.getDate() - 7 * weeksAgo);
  return formatDate(dateObj);
}

/************************************************************
 * 1) 폴더 초기화 및 부모 도메인 검사
 ************************************************************/
function initializeFolder() {
  const ref = document.referrer;
  if (!ref.includes("atlassian.net")) {
    alert("Confluence(.atlassian.net)에서 접근하지 않아 동작이 제한됩니다.");
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  const folder = params.get("folder");
  const tokenParam = params.get("token");  // token 읽기
  if (!folder) {
    alert("folder 파라미터가 없습니다. 올바른 접근이 아닙니다.");
    return false;
  }
  if (!tokenParam) {
    alert("token 파라미터가 없습니다. 올바른 접근이 아닙니다.");
    return false;
  }
  folderName = folder;
  token = tokenParam;  // 전역 변수 token에 저장
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

// "더보기" 선택 시 서버에서 가져온 모든 날짜로 드롭다운 옵션 재구성
function updateDateDropdownWithAllDates() {
  const select = document.querySelector(".date-dropdown");
  if (!select) return;
  select.innerHTML = "";
  // fetchedRecords에 저장된 날짜들을 사용 (중복 제거)
  let dates = fetchedRecords.map(r => r.date);
  const latest = getUpcomingThursday();
  if (!dates.includes(latest)) {
    dates.push(latest);
  }
  dates = [...new Set(dates)];
  dates.sort((a, b) => b.localeCompare(a)); // 내림차순 정렬
  dates.forEach(date => {
    const op = document.createElement("option");
    op.value = date;
    op.textContent = date;
    select.appendChild(op);
  });
  // 현재 편집 날짜가 옵션에 있다면 그대로, 없으면 최신 날짜로 설정
  if (dates.includes(currentEditingDate)) {
    select.value = currentEditingDate;
  } else {
    currentEditingDate = latest;
    select.value = latest;
  }
}

// 날짜 드롭다운 값 변경 시 – (2) 이미 띄운 페이지 수정
function handleDateDropdownChange(e) {
  const select = e.target;
  let newDate = select.value;
  if (newDate === "more") {
    updateDateDropdownWithAllDates();
    return;
  }
  if (newDate === currentEditingDate) {
    // 같은 날짜 선택 시 아무런 동작 없이 원래 선택으로 복원
    select.value = currentEditingDate;
    return;
  }
  // 현재 편집 영역의 내용과 서버에 저장된 현재 편집 날짜의 내용 비교
  const currentTableElem = document.querySelector("#currentTableContainer .myTable tbody");
  if (!currentTableElem) {
    currentEditingDate = newDate;
    updateUIForSelectedDate(newDate);
    return;
  }
  let currentTableHTML = currentTableElem.innerHTML.trim();
  let savedRecord = fetchedRecords.find(rec => rec.date === currentEditingDate);
  let savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
  if (currentTableHTML !== savedTableHTML) {
    // 세 가지 옵션: 1) 변경사항 저장 후 진행, 2) 저장 없이 진행, 3) 취소
    let choice = prompt(
      `(${currentEditingDate}) 날짜의 내용에서 변경된 부분이 있습니다.\n아래 옵션 중 선택해주세요:\n1: 변경사항 저장 후 진행\n2: 저장 없이 진행\n3: 취소`
    );
    if (choice === "1") {
      // 저장 후 진행
      submitData(currentEditingDate, function() {
        currentEditingDate = newDate;
        updateUIForSelectedDate(newDate);
      });
      return;
    } else if (choice === "2") {
      // 저장 없이 진행
      // 아무것도 하지 않고 진행
    } else {
      // 취소 – 기존 날짜로 복원
      select.value = currentEditingDate;
      return;
    }
  }
  currentEditingDate = newDate;
  updateUIForSelectedDate(newDate);
}

/************************************************************
 * 3) 드롭다운/신호등 생성 함수 (변경 없음)
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
        strategySelect.style.display = "none";
        strategySpan.style.display = "inline-block";
      }
      handleStrategyChange(td, val);
    });
    strategySpan.addEventListener("click", () => {
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
 *     - 편집 영역 (#currentTableContainer) 및
 *     - 조회 영역 (#pastDataContainer)
 ************************************************************/
function fetchStoredData(callback) {
  fetch(`${LOCAL_SERVER_URL}/listData?folder=${folderName}&token=${token}`)
    .then(resp => resp.json())
    .then(records => {
      console.log("Fetched records:", records);
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

// 편집 영역과 조회 영역을 요구사항에 맞게 업데이트
function updateUIForSelectedDate(selectedDate) {
  const latest = getUpcomingThursday();
  const currentHeader = document.getElementById("currentHeader");
  const currentContainer = document.getElementById("currentTableContainer");
  const pastContainer = document.getElementById("pastDataContainer");
  
  // 편집 영역 헤더 – 최신이면 "(이번주)", 아니면 "(과거)"
  let headerText = (selectedDate === latest)
                   ? `(이번주) ${selectedDate} 주간현황`
                   : `(과거) ${selectedDate} 주간현황`;
  currentHeader.textContent = headerText;
  
  // 편집 영역 업데이트
  const editableTable = currentContainer.querySelector(".myTable");
  if (editableTable) {
    const editableTbody = editableTable.querySelector("tbody");
    const record = fetchedRecords.find(rec => rec.date === selectedDate);
    if (record) {
      editableTbody.innerHTML = record.tableHTML;
      initTable(editableTable);
    } else {
      // 만약 최신 목요일이면 “아직 작성되지 않았음” 메시지와 빈 표 표시
      if (selectedDate === latest) {
        currentHeader.textContent = `(이번주) ${selectedDate} 주간현황 : 아직 작성되지 않았음`;
      }
      editableTbody.innerHTML = "";
    }
  }
  
  // 조회 영역 업데이트
  pastContainer.innerHTML = "";
  let datesToShow = [];
  if (selectedDate === latest) {
    // 최신 날짜 선택 시 – 만약 최신 기록이 있다면 최신+전주+전전주 (존재하는 것만)
    const recLatest = fetchedRecords.find(rec => rec.date === latest);
    if (recLatest) {
      datesToShow.push(latest);
    }
    const prev1 = getPreviousThursday(latest, 1);
    const prev2 = getPreviousThursday(latest, 2);
    if (fetchedRecords.find(rec => rec.date === prev1)) {
      datesToShow.push(prev1);
    }
    if (fetchedRecords.find(rec => rec.date === prev2)) {
      datesToShow.push(prev2);
    }
  } else {
    // 과거 날짜 선택 시 – 최신부터 선택된 날짜까지 모두 표시 (존재하는 것만)
    datesToShow = fetchedRecords
                  .map(r => r.date)
                  .filter(d => d <= latest && d >= selectedDate);
    if (!datesToShow.includes(latest)) {
      datesToShow.push(latest);
    }
    datesToShow.sort((a, b) => b.localeCompare(a));
  }
  
  if (datesToShow.length === 0) {
    pastContainer.textContent = "(과거 주간현황 기록 없음)";
  } else {
    datesToShow.forEach(date => {
      const record = fetchedRecords.find(rec => rec.date === date);
      const section = document.createElement("div");
      section.style.marginBottom = "20px";
      const header = document.createElement("div");
      // 헤더 텍스트 – 최신이면 (이번주), 나머지는 (과거)
      header.textContent = (date === latest)
                           ? `(이번주) ${date} 주간현황`
                           : `(과거) ${date} 주간현황`;
      // 드롭다운에서 선택된 날짜와 일치하는 헤더는 옅은 노랑 배경, 파란색 bold, italic
      if (date === selectedDate) {
        header.style.backgroundColor = "#ffffe0";
        header.style.color = "blue";
        header.style.fontWeight = "bold";
        header.style.fontStyle = "italic";
      }
      section.appendChild(header);
      if (record) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = record.tableHTML;
        makeTableStatic(wrapper);
        section.appendChild(wrapper);
      } else {
        const msg = document.createElement("div");
        msg.textContent = "기록 없음";
        section.appendChild(msg);
      }
      pastContainer.appendChild(section);
    });
  }
}

// 읽기 전용으로 만들기 – 조회 영역 내의 드롭다운과 편집 기능 비활성화
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
 *     - 제출 시 서버에 저장 전/후 내용 비교 후 안내
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
    let currentTableHTML = currentTableElem.innerHTML.trim();
    let savedRecord = fetchedRecords.find(rec => rec.date === selectedDate);
    let savedTableHTML = savedRecord ? savedRecord.tableHTML.trim() : "";
    if (!savedRecord) {
      // 기록이 없으면 신규 저장
      submitData(selectedDate, () => {
        alert(`(${selectedDate}) 진행현황을 신규 저장했습니다.`);
        updateUIForSelectedDate(selectedDate);
      });
    } else {
      if (currentTableHTML !== savedTableHTML) {
        let choice = prompt(
          "현재 작성한 내용을 저장하시겠습니까? 기존 저장 내용과 다른 부분이 있습니다.\n1: 저장하기\n2: 취소 및 다시 확인하기"
        );
        if (choice === "1") {
          submitData(selectedDate, () => {
            alert(`(${selectedDate}) 진행현황을 저장했습니다.`);
            updateUIForSelectedDate(selectedDate);
          });
        } else {
          return;
        }
      } else {
        alert(`(${selectedDate}) 진행현황을 저장했습니다.`);
        updateUIForSelectedDate(selectedDate);
      }
    }
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
  // 기본 편집 날짜: 드롭다운 첫번째(최신 목요일)
  currentEditingDate = document.querySelector(".date-dropdown") ? document.querySelector(".date-dropdown").value : getUpcomingThursday();
  fetchStoredData();
});
