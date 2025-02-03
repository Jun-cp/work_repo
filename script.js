/************************************************************
 *  날짜 드롭다운 관련 
 ************************************************************/
const originalDates = ['250124', '250117'];
const fullDateList = [
  '250206', '250124', '250117', '250110', '250103', '250096', '250089'
];

function getNextThursday() {
  const today = new Date();
  const targetDay = 4; // 4: 목요일
  const diff = (targetDay + 7 - today.getDay()) % 7 || 7;
  const nextThursday = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
  const yy = String(nextThursday.getFullYear()).slice(2);
  const mm = String(nextThursday.getMonth() + 1).padStart(2, '0');
  const dd = String(nextThursday.getDate()).padStart(2, '0');
  return yy + mm + dd;
}

function createDateDropdown() {
  const container = document.getElementById('dateSelectorContainer');
  container.innerHTML = '';

  const select = document.createElement('select');
  select.className = 'dropdown-select date-dropdown';

  const newFirst = getNextThursday();
  const opts = [
    { val: newFirst, text: newFirst },
    { val: originalDates[0], text: originalDates[0] },
    { val: originalDates[1] || '', text: originalDates[1] || '' },
    { val: 'more', text: '더보기' }
  ];

  opts.forEach(o => {
    if (o.val === '') return;
    const op = document.createElement('option');
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });

  container.appendChild(select);

  select.addEventListener('change', (e) => {
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
    selectEl.selectedIndex = 0;
  }
}

/************************************************************
 *  이미지 경로/전역 상수
 ************************************************************/
const IMAGE_URLS = {
  red: "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true",
  yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
  green: "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true"
};

// 자동완성 후보 (실제 사용 시 attachAutoCompleteToCell 등 구현)
const AUTO_COMPLETE_LIST = [
  "산림청 LLM PoC", "국회 빅데이터 구축사업", "Copilot Agent 개발",
  "JTS LLM사업", "우리은행 GenAI 사업", "신한은행 GenAI 사업",
  "GPUaaS", "비씨카드", "업무 관리 프로세스", "고려대 산학 (MoM)",
  "신한은행 AI Branch 컨설팅/PoC 지원", "KPI 작성", "Lead 행사 추진",
  "구매/회계 업무", "IBM Agent Consulting", "agent agent", "Agent test"
];

// 0열(A~F)에 따른 1열 옵션 매핑
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
 *  드롭다운 + 표 초기화
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
 *  드롭다운 이벤트
 ************************************************************/
function initDropDownEvents(td) {
  const strategySelect = td.querySelector('.strategy-dropdown');
  const strategySpan = td.querySelector('.dropdown-text');
  if (strategySelect && strategySpan) {
    strategySelect.addEventListener('change', () => {
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
    strategySpan.addEventListener('click', () => {
      strategySpan.classList.add('hidden');
      strategySelect.classList.remove('hidden');
    });
  }
  const detailSelect = td.querySelector('.detail-dropdown');
  const detailSpan = td.querySelector('.dropdown-text');
  if (detailSelect && detailSpan) {
    detailSelect.addEventListener('change', () => {
      const val = detailSelect.value;
      if (val) {
        detailSpan.textContent = val;
        detailSelect.classList.add('hidden');
        detailSpan.classList.remove('hidden');
      } else {
        detailSpan.textContent = '';
      }
    });
    detailSpan.addEventListener('click', () => {
      detailSpan.classList.add('hidden');
      detailSelect.classList.remove('hidden');
    });
  }
  const statusSelect = td.querySelector('.status-dropdown');
  const statusImage  = td.querySelector('.status-image');
  if (statusSelect && statusImage) {
    statusSelect.addEventListener('change', () => {
      const colorVal = statusSelect.value;
      if (IMAGE_URLS[colorVal]) {
        statusImage.src = IMAGE_URLS[colorVal];
        statusSelect.classList.add('hidden');
        statusImage.classList.remove('hidden');
      } else {
        statusImage.classList.add('hidden');
      }
    });
    statusImage.addEventListener('click', () => {
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
 *  표 초기화
 ************************************************************/
function initTable(table) {
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const tds = row.querySelectorAll('td');
    if (tds[0]) {
      const col0 = tds[0];
      if (!col0.querySelector('.strategy-dropdown')) {
        const { container } = createStrategyDropdown();
        col0.appendChild(container);
      }
    }
    if (tds[1]) {
      const col1 = tds[1];
      if (!col1.querySelector('.detail-dropdown')) {
        const { container } = createDetailDropdown();
        col1.appendChild(container);
      }
    }
    if (tds[6]) {
      const col6 = tds[6];
      if (!col6.querySelector('.status-dropdown')) {
        const { container } = createTrafficDropdown();
        col6.appendChild(container);
      }
    }
    tds.forEach(td => initDropDownEvents(td));
  });
}

/************************************************************
 *  새 행 추가
 ************************************************************/
function addNewRow() {
  const table = document.querySelector('.myTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  // 예시로 8칸만. 필요 시 늘리거나 줄이세요.
  for (let i = 0; i < 13; i++) {
    const td = document.createElement('td');
    if ([0, 1, 6].includes(i)) {
      // 추후 initTable에서 드롭다운 생성
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
 *  테이블 데이터 수집
 ************************************************************/
function gatherTableData() {
  const table = document.querySelector('.myTable');
  if (!table) return [];
  const rows = table.querySelectorAll('tbody tr');
  const allData = [];
  rows.forEach(row => {
    const rowData = [];
    const tds = row.querySelectorAll('td');
    tds.forEach((td, colIndex) => {
      // (0,1): 드롭다운
      const strategySelect = td.querySelector('.strategy-dropdown');
      const detailSelect   = td.querySelector('.detail-dropdown');
      const statusSelect   = td.querySelector('.status-dropdown');
      const statusImage    = td.querySelector('.status-image');
      if (strategySelect) {
        // 전략과제 드롭다운
        rowData.push({
          type: 'strategy',
          value: strategySelect.value || ''  // 실제 선택된 값
        });
      }
      else if (detailSelect) {
        // 세부과제 드롭다운
        rowData.push({
          type: 'detail',
          value: detailSelect.value || ''
        });
      }
      else if (statusSelect && statusImage) {
        // 신호등
        rowData.push({
          type: 'traffic',
          value: statusSelect.value || '',
          image: statusImage.src || '' // 현재 이미지 주소
        });
      }
      else {
        // 그 외 editable 텍스트
        rowData.push({
          type: 'text',
          value: td.textContent.trim()
        });
      }
    });
    allData.push(rowData);
  });
  return allData;
}

/************************************************************
 *  특정 사이트인지 판단하는 로직
 ************************************************************/
// 예: 사전에 정의한 사이트 목록 (각각 전체 URL). 
// 여기서는 단순 예시로 3개만 명시:
const ALLOWED_SITES = [
  "http://ktspace.atlassian.net/1",
  "http://ktspace.atlassian.net/2",
  "http://ktspace.atlassian.net/3"
];

/************************************************************
 *  Submit 버튼
 ************************************************************/
function initSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.addEventListener('click', () => {
    const currentURL = window.location.href;
    
    // 1) URL 체크: 사전에 정의된 사이트가 맞는지
    if (!ALLOWED_SITES.includes(currentURL)) {
      alert("허용되지 않은 사이트 주소입니다. 제출할 수 없습니다.");
      return;
    }

    // 2) 주소 마지막 slash 뒤의 경로명( '1' | '2' | '3' ) 뽑아내기
    //    예) http://ktspace.atlassian.net/1 → pathname: "/1" → folderName: "1"
    const folderName = window.location.pathname.replace('/', ''); 
    // 혹은 const folderName = currentURL.split('/').pop();

    // 3) 드롭다운 날짜 확인
    const dateSelect = document.querySelector('.date-dropdown');
    if (!dateSelect) {
      alert("날짜 선택 요소를 찾을 수 없습니다.");
      return;
    }
    const selectedDate = dateSelect.value;
    if (!selectedDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    // 4) 테이블 전체 데이터 수집
    const tableData = gatherTableData();

    // 5) 서버에 전송할 payload 구성
    const payload = {
      siteFolder: folderName,     // 예: "1"
      dateKey: selectedDate,      // 예: "250206"
      table: tableData            // 테이블 전체 데이터 (JSON)
    };

    // 6) 실제 서버 주소 (Cloudflare 터널)
    //    예: https://jun_cp.inviteu.org/api/submit  (엔드포인트 변경 가능)
    const LOCAL_SERVER_URL = "https://jun_cp.inviteu.org/submit";

    fetch(LOCAL_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) throw new Error("서버 응답 오류");
      return response.json();
    })
    .then(data => {
      alert("전송 성공: " + JSON.stringify(data));
      // 필요하다면 iframe에 최신 데이터 로드
      document.getElementById("dataFrame").src = "https://jun_cp.inviteu.org/view?folder=" + folderName;
    })
    .catch(err => {
      console.error("전송 오류:", err);
      alert("전송에 실패했습니다.");
    });
  });
}

/************************************************************
 *  DOMContentLoaded
 ************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  createDateDropdown();
  const table = document.querySelector('.myTable');
  if (table) {
    initTable(table);
  }
  const addBtn = document.getElementById('addRowBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewRow);
  }
  initSubmitButton();
});
