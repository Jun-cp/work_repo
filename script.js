/************************************************************
 * 0) 전역 변수 / 상수
 ************************************************************/
/** 허용된 폴더(식별자) 목록. "1","2","3" 등 */
const ALLOWED_FOLDERS = ["11", "1", "2"];

/** 실제 선택된 folderName (쿼리 파라미터에서 가져옴) */
let folderName = "";

/**
 * 로컬 서버(Cloudflare 터널) 주소
 * 여기에서 /submit, /view 엔드포인트를 제공한다고 가정
 */
const LOCAL_SERVER_URL = "https://jun_cp.inviteu.org";

/************************************************************
 * 1) 폴더 파라미터 파싱
 ************************************************************/
function parseFolderFromQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const folder = urlParams.get("folder");
  if (!folder) {
    alert("folder 파라미터가 지정되지 않았습니다. (ex: ?folder=1)");
    return null;
  }
  if (!ALLOWED_FOLDERS.includes(folder)) {
    alert("허용되지 않은 folder 값: " + folder);
    return null;
  }
  return folder;
}

/************************************************************
 * 2) 날짜 드롭다운 관련
 ************************************************************/
const originalDates = ["250124", "250117"];
const fullDateList  = [
  "250206", "250124", "250117", "250110", 
  "250103", "250096", "250089"
];

function getNextThursday() {
  const today = new Date();
  const targetDay = 4; // 목(0:일,1:월,...,6:토)
  const diff = (targetDay + 7 - today.getDay()) % 7 || 7;
  const nextThursday = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
  const yy = String(nextThursday.getFullYear()).slice(2);
  const mm = String(nextThursday.getMonth() + 1).padStart(2, "0");
  const dd = String(nextThursday.getDate()).padStart(2, "0");
  return yy + mm + dd;
}

function createDateDropdown() {
  const container = document.getElementById("dateSelectorContainer");
  if (!container) return;
  container.innerHTML = "";

  const select = document.createElement("select");
  select.className = "dropdown-select date-dropdown";

  const newFirst = getNextThursday(); // 새 항목
  const opts = [
    { val: newFirst,          text: newFirst },
    { val: originalDates[0],  text: originalDates[0] },
    { val: originalDates[1],  text: originalDates[1] },
    { val: "more",            text: "더보기" }
  ];
  opts.forEach(o => {
    if (!o.val) return;
    const op = document.createElement("option");
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });

  container.appendChild(select);
  select.addEventListener("change", e => {
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
    selectEl.selectedIndex = 0; // 복원
  }
}

/************************************************************
 * 3) 표/드롭다운
 ************************************************************/
// 이미지 URL
const IMAGE_URLS = {
  red   : "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true",
  yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
  green : "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true"
};

// 0열(A-F)에 따른 1열 옵션 매핑
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

/** (0열)전략 드롭다운 생성 */
function createStrategyDropdown() {
  const container = document.createElement("div");
  const select = document.createElement("select");
  select.className = "dropdown-select strategy-dropdown";

  const opts = [
    { val:"",   text:"(선택)" },
    { val:"A",  text:"1_AX사업..." },
    { val:"B",  text:"1_MS파트너..." },
    { val:"C",  text:"1_C..." },
    { val:"D",  text:"1_D..." },
    { val:"E",  text:"2_E..." },
    { val:"F",  text:"2_F..." },
    { val:"G",  text:"2_G..." },
    { val:"H",  text:"2_Lead..." }
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

/** (1열) 세부항목 드롭다운 생성 */
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

/** (6열) 신호등(이미지) 드롭다운 */
function createTrafficDropdown() {
  const container = document.createElement("div");
  const select = document.createElement("select");
  select.className = "dropdown-select status-dropdown";
  const opts = [
    { val:"", text:"Select" },
    { val:"red", text:"Red" },
    { val:"yellow", text:"Yellow" },
    { val:"green", text:"Green" }
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

/** 드롭다운 이벤트 초기화 */
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

/** (0열) 전략 => (1열) 세부항목 연동 */
function handleStrategyChange(strategyTd, strategyVal) {
  const row = strategyTd.closest("tr");
  if (!row) return;
  const tds = row.querySelectorAll("td");
  if (tds.length < 2) return;

  const detailTd    = tds[1];
  const detailSelect = detailTd.querySelector(".detail-dropdown");
  const detailSpan   = detailTd.querySelector(".dropdown-text");
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
 * 4) 표 초기화 & 행 추가
 ************************************************************/
function initTable(table) {
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    const tds = row.querySelectorAll("td");
    // 0열 => 전략, 1열 => 세부, 6열 => 신호등
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
  for (let i=0; i<8; i++) {
    const td = document.createElement("td");
    if ([0,1,6].includes(i)) {
      // 드롭다운은 initTable에서 생성
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
 * 5) Submit 버튼
 ************************************************************/
function initSubmitButton() {
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", () => {
    if (!folderName) {
      alert("folder 파라미터가 유효하지 않아서 Submit 불가합니다.");
      return;
    }
    // 1) 날짜 선택
    const dateSelect = document.querySelector(".date-dropdown");
    if (!dateSelect || !dateSelect.value) {
      alert("날짜를 선택해주세요.");
      return;
    }
    const selectedDate = dateSelect.value;
    if (selectedDate === "more") {
      alert("유효한 날짜를 선택해주세요.");
      return;
    }

    // 2) 표 데이터
    const tbodyElem = document.querySelector(".myTable tbody");
    if (!tbodyElem) {
      alert("표를 찾을 수 없습니다.");
      return;
    }
    const tableData = tbodyElem.innerHTML;

    // 3) 서버 전송
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
      // iframe에 최신 데이터 표시
      const frame = document.getElementById("dataFrame");
      if (frame) {
        frame.src = `${LOCAL_SERVER_URL}/view?folder=${folderName}&date=${selectedDate}`;
      }
    })
    .catch(err => {
      console.error("전송 실패:", err);
      alert("전송에 실패했습니다.");
    });
  });
}

/************************************************************
 * 6) DOMContentLoaded
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // 1) 쿼리 파라미터에서 folder 파싱
  const parsed = parseFolderFromQuery();
  if (!parsed) {
    // 허용되지 않은 경우 => submit 버튼 막기
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = true;
    // 더 이상 진행 X
    return;
  }
  folderName = parsed;

  // 2) 날짜 드롭다운, 표 초기화
  createDateDropdown();
  const table = document.querySelector(".myTable");
  if (table) initTable(table);

  const addBtn = document.getElementById("addRowBtn");
  if (addBtn) addBtn.addEventListener("click", addNewRow);

  // 3) Submit
  initSubmitButton();
});
