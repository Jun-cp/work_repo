/************************************************************
 * 0. 전역 변수 / 상수
 ************************************************************/
/**
 * 부모 페이지(Confluence) 전체 URL
 * postMessage 이벤트로부터 설정될 예정
 */
let parentFullUrl = "";

/**
 * 허용된 부모 사이트 목록
 * => 정확히 이 URL들과 일치할 때만 동작
 */
const allowedSites = [
  "https://ktspace.atlassian.net/wiki/spaces/SBCAILead/pages/edit-v2/194315289",
  "https://ktspace.atlassian.net/wiki/spaces/SBCAILead/pages/194315289/1-1+AI+_test",
  "https://ktspace.atlassian.net/wiki/spaces/XXX/pages/3"
];

/** 실제 동작 여부 */
let isAllowedSite = false;

/** 폴더명 (마지막 슬래시 뒤, 예: "1") */
let folderName = "";

/** 2열 자동완성, 0열(A,B...) => 1열 세부항목, 이미지 등은 기존 유지 */
const IMAGE_URLS = {
  red: "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true",
  yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
  green: "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true"
};
const AUTO_COMPLETE_LIST = [ /* 필요 시 추가 */ ];
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
 * 1) postMessage 수신 -> 부모 페이지 URL 획득
 ************************************************************/
window.addEventListener("message", function(event) {
  // 1) 보안 검사: atlassian.net 출처인지 (필요 시 도메인/서브도메인 정교하게 검사)
  alert(event.origin)
  if (!event.origin.includes("atlassian.net")) {
    console.warn("허용되지 않은 origin:", event.origin);
    return;
  }
  // 2) 메시지 안에 url이 있는지 확인
  if (!event.data || !event.data.url) {
    console.warn("메시지에 url 값이 없습니다.");
    return;
  }

  // 3) 부모 페이지 전체 URL
  parentFullUrl = event.data.url;
  console.log("[iframe] 부모 페이지 URL 수신:", parentFullUrl);

  // 4) 허용된 사이트인지 검사
  if (allowedSites.includes(parentFullUrl)) {
    isAllowedSite = true;
    console.log("허용된 페이지:", parentFullUrl);
  } else {
    isAllowedSite = false;
    console.warn("허용되지 않은 페이지:", parentFullUrl);
  }

  // 5) 허용된 경우만 folderName 추출
  if (isAllowedSite) {
    // 마지막 슬래시 뒤 부분 ex) "https://.../1" -> "1"
    folderName = parentFullUrl.substring(parentFullUrl.lastIndexOf("/") + 1);
    console.log("folderName:", folderName);
  }
});


/************************************************************
 * 2) 날짜 드롭다운 관련
 ************************************************************/
const originalDates = ["250124","250117"];
const fullDateList = ["250206","250124","250117","250110","250103","250096","250089"];

function getNextThursday() {
  const today = new Date();
  const targetDay = 4; // 목요일
  const diff = (targetDay + 7 - today.getDay()) % 7 || 7;
  const nextThursday = new Date(today.getTime() + diff*24*60*60*1000);
  const yy = String(nextThursday.getFullYear()).slice(2);
  const mm = String(nextThursday.getMonth() + 1).padStart(2,'0');
  const dd = String(nextThursday.getDate()).padStart(2,'0');
  return yy + mm + dd;
}

function createDateDropdown() {
  const container = document.getElementById('dateSelectorContainer');
  if (!container) return;
  container.innerHTML = '';

  const select = document.createElement('select');
  select.className = 'dropdown-select date-dropdown';

  const newFirst = getNextThursday();
  // 순서: 새 항목, originalDates[0], [1], "더보기"
  const opts = [
    { val: newFirst, text: newFirst },
    { val: originalDates[0], text: originalDates[0] },
    { val: originalDates[1], text: originalDates[1] },
    { val: 'more', text: '더보기' }
  ];

  opts.forEach(o => {
    if (!o.val) return; // 빈 문자열 건너뜀
    const op = document.createElement('option');
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });
  container.appendChild(select);

  select.addEventListener('change',(e)=>{
    if (e.target.value === 'more') {
      showFullDateList(select);
    }
  });
}

function showFullDateList(selectEl) {
  const listStr = fullDateList.join(', ');
  const chosen = prompt("전체 날짜 목록:\n" + listStr + "\n\n원하는 날짜를 입력하세요:");
  if (fullDateList.includes(chosen)) {
    selectEl.value = chosen;
  } else {
    alert("유효한 날짜가 아닙니다.");
    selectEl.selectedIndex = 0; // 복원
  }
}

/************************************************************
 * 3) 드롭다운/신호등 생성 함수
 ************************************************************/
function createStrategyDropdown() {
  const container = document.createElement('div');
  const select = document.createElement('select');
  select.className = 'dropdown-select strategy-dropdown';

  const opts = [
    { val:'', text:'(선택)' },
    { val:'A', text:'1_AX사업...' },
    { val:'B', text:'1_MS파트너...' },
    { val:'C', text:'1_C...' },
    { val:'D', text:'1_D...' },
    { val:'E', text:'2_E...' },
    { val:'F', text:'2_F...' },
    { val:'G', text:'2_G...' },
    { val:'H', text:'2_Lead...' }
  ];
  opts.forEach(o => {
    const op = document.createElement('option');
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });

  const span = document.createElement('span');
  span.className = 'dropdown-text hidden';
  container.appendChild(select);
  container.appendChild(span);
  return { container };
}

function createDetailDropdown() {
  const container = document.createElement('div');
  const select = document.createElement('select');
  select.className = 'dropdown-select detail-dropdown hidden';
  const span = document.createElement('span');
  span.className = 'dropdown-text hidden';
  container.appendChild(select);
  container.appendChild(span);
  return { container };
}

function createTrafficDropdown() {
  const container = document.createElement('div');
  const select = document.createElement('select');
  select.className = 'dropdown-select status-dropdown';
  const opts = [
    { val:'', text:'Select' },
    { val:'red', text:'Red' },
    { val:'yellow', text:'Yellow' },
    { val:'green', text:'Green' }
  ];
  opts.forEach(o => {
    const op = document.createElement('option');
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });
  const img = document.createElement('img');
  img.className = 'status-image hidden';
  container.appendChild(select);
  container.appendChild(img);
  return { container };
}

/************************************************************
 * 4) 드롭다운 이벤트 초기화
 ************************************************************/
function initDropDownEvents(td) {
  // (0열) 전략과제
  const strategySelect = td.querySelector('.strategy-dropdown');
  const strategySpan   = td.querySelector('.dropdown-text');
  if (strategySelect && strategySpan) {
    strategySelect.addEventListener('change', ()=>{
      const val = strategySelect.value;
      const displayText = strategySelect.options[strategySelect.selectedIndex].textContent;
      if (val) {
        strategySpan.textContent = displayText;
        strategySelect.classList.add('hidden');
        strategySpan.classList.remove('hidden');
      } else {
        strategySpan.textContent = '';
      }
      handleStrategyChange(td, val);
    });
    strategySpan.addEventListener('click', ()=>{
      strategySpan.classList.add('hidden');
      strategySelect.classList.remove('hidden');
    });
  }

  // (1열) 세부항목
  const detailSelect = td.querySelector('.detail-dropdown');
  const detailSpan   = td.querySelector('.dropdown-text');
  if (detailSelect && detailSpan) {
    detailSelect.addEventListener('change', ()=>{
      const val = detailSelect.value;
      if (val) {
        detailSpan.textContent = val;
        detailSelect.classList.add('hidden');
        detailSpan.classList.remove('hidden');
      } else {
        detailSpan.textContent = '';
      }
    });
    detailSpan.addEventListener('click', ()=>{
      detailSpan.classList.add('hidden');
      detailSelect.classList.remove('hidden');
    });
  }

  // (6열) 신호등
  const statusSelect = td.querySelector('.status-dropdown');
  const statusImage  = td.querySelector('.status-image');
  if (statusSelect && statusImage) {
    statusSelect.addEventListener('change', ()=>{
      const colorVal = statusSelect.value;
      if (IMAGE_URLS[colorVal]) {
        statusImage.src = IMAGE_URLS[colorVal];
        statusSelect.classList.add('hidden');
        statusImage.classList.remove('hidden');
      } else {
        statusImage.classList.add('hidden');
      }
    });
    statusImage.addEventListener('click', ()=>{
      statusImage.classList.add('hidden');
      statusSelect.classList.remove('hidden');
    });
  }
}

function handleStrategyChange(strategyTd, strategyVal) {
  const row = strategyTd.closest('tr');
  if (!row) return;
  const tds = row.querySelectorAll('td');
  if (tds.length < 2) return;

  const detailTd = tds[1];
  const detailSelect = detailTd.querySelector('.detail-dropdown');
  const detailSpan   = detailTd.querySelector('.dropdown-text');
  if (!detailSelect || !detailSpan) return;

  if (!strategyVal) {
    detailSelect.innerHTML = '';
    detailSelect.classList.add('hidden');
    detailSpan.classList.add('hidden');
    detailSpan.textContent = '';
    return;
  }
  detailSelect.innerHTML = '';
  const blankOpt = document.createElement('option');
  blankOpt.value = '';
  blankOpt.textContent = 'Select';
  detailSelect.appendChild(blankOpt);

  const newOptions = STRATEGY_TO_DETAIL_OPTIONS[strategyVal] || [];
  newOptions.forEach(val => {
    const op = document.createElement('option');
    op.value = val;
    op.textContent = val;
    detailSelect.appendChild(op);
  });
  detailSelect.value = '';
  detailSelect.classList.remove('hidden');
  detailSpan.classList.add('hidden');
  detailSpan.textContent = '';
}

/************************************************************
 * 5) 표 초기화 및 행 추가
 ************************************************************/
function initTable(table) {
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row=>{
    const tds = row.querySelectorAll('td');
    if (tds[0] && !tds[0].querySelector('.strategy-dropdown')) {
      const { container } = createStrategyDropdown();
      tds[0].appendChild(container);
    }
    if (tds[1] && !tds[1].querySelector('.detail-dropdown')) {
      const { container } = createDetailDropdown();
      tds[1].appendChild(container);
    }
    if (tds[6] && !tds[6].querySelector('.status-dropdown')) {
      const { container } = createTrafficDropdown();
      tds[6].appendChild(container);
    }
    tds.forEach(td => initDropDownEvents(td));
  });
}

function addNewRow() {
  const table = document.querySelector('.myTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const tr = document.createElement('tr');
  for (let i=0; i<8; i++) {
    const td = document.createElement('td');
    if ([0,1,6].includes(i)) {
      // 드롭다운은 나중에 initTable로
    } else {
      td.classList.add('editable');
      td.contentEditable = "true";
    }
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  initTable(table);
}

/************************************************************
 * 6) Submit 버튼
 ************************************************************/
function initSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', ()=>{
    // 1) 허용된 페이지인지 검사
    if (!isAllowedSite) {
      alert("허용되지 않은 페이지(URL)에서 접근하여 Submit할 수 없습니다.");
      return;
    }
    if (!folderName) {
      alert("폴더명을 찾을 수 없습니다. (부모 페이지 URL 수신 전)");
      return;
    }

    // 2) 날짜 선택
    const dateSelect = document.querySelector('.date-dropdown');
    if (!dateSelect || !dateSelect.value) {
      alert("날짜를 선택해주세요.");
      return;
    }
    const selectedDate = dateSelect.value;
    if (selectedDate === 'more') {
      alert("날짜를 올바르게 선택해주세요.");
      return;
    }

    // 3) 표 데이터 수집
    const tbodyElem = document.querySelector('.myTable tbody');
    if (!tbodyElem) {
      alert("테이블이 존재하지 않습니다.");
      return;
    }
    const tableData = tbodyElem.innerHTML;

    // 4) 서버로 전송
    const payload = {
      folder: folderName,
      date: selectedDate,
      tableData: tableData
    };

    // Cloudflare 터널 연결 예시
    const LOCAL_SERVER_URL = "https://jun_cp.inviteu.org/submit";

    fetch(LOCAL_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(resp => resp.json())
    .then(data => {
      alert("전송 성공: " + JSON.stringify(data));
      // 저장 완료 후 iframe에 최신 데이터 표시
      const iframeEl = document.getElementById("dataFrame");
      if (iframeEl) {
        iframeEl.src = "https://jun_cp.inviteu.org/view?folder=" + folderName + "&date=" + selectedDate;
      }
    })
    .catch(err => {
      console.error("전송 오류:",err);
      alert("전송에 실패했습니다.");
    });
  });
}

/************************************************************
 * 7) DOMContentLoaded
 ************************************************************/
document.addEventListener('DOMContentLoaded', ()=>{
  // 날짜 드롭다운 생성
  createDateDropdown();
  // 표 초기화
  const table = document.querySelector('.myTable');
  if (table) initTable(table);
  // 행 추가 버튼
  const addBtn = document.getElementById('addRowBtn');
  if (addBtn) addBtn.addEventListener('click', addNewRow);
  // submit 버튼
  initSubmitButton();
});
