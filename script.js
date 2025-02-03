/************************************************************
 *  날짜 드롭다운 관련 (요건 1)
 ************************************************************/
// 기존 “고정” 날짜값이 있었다고 가정(예: [ '250124', '250117' ])
const originalDates = ['250124', '250117'];

// 미리 정의된 전체 날짜 리스트 (더보기 선택 시 보여줄 목록; 필요에 따라 확장)
const fullDateList = [
  '250206', '250124', '250117', '250110', '250103', '250096', '250089'
  // 추가 날짜들...
];

// 오늘 날짜 기준으로 다음 목요일 날짜 (yyMMdd 형식) 계산
function getNextThursday() {
  const today = new Date();
  // 4: 목요일 (0:일, 1:월, ..., 6:토)
  const targetDay = 4;
  const diff = (targetDay + 7 - today.getDay()) % 7 || 7;
  const nextThursday = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
  const yy = String(nextThursday.getFullYear()).slice(2);
  const mm = String(nextThursday.getMonth() + 1).padStart(2, '0');
  const dd = String(nextThursday.getDate()).padStart(2, '0');
  return yy + mm + dd;
}

// 드롭다운 생성: 기본 3개 항목 + "더보기"
function createDateDropdown() {
  const container = document.getElementById('dateSelectorContainer');
  container.innerHTML = ''; // 초기화

  const select = document.createElement('select');
  select.className = 'dropdown-select date-dropdown';

  // 새 항목 계산
  const newFirst = getNextThursday();
  // 순서: [새 항목, 기존 첫번째, 기존 두번째, "더보기"]
  const opts = [
    { val: newFirst, text: newFirst },
    { val: originalDates[0], text: originalDates[0] },
    { val: originalDates[1] || '', text: originalDates[1] || '' },
    { val: 'more', text: '더보기' }
  ];

  opts.forEach(o => {
    // 만약 기존 두번째 값이 없으면 건너뜀.
    if (o.val === '') return;
    const op = document.createElement('option');
    op.value = o.val;
    op.textContent = o.text;
    select.appendChild(op);
  });

  container.appendChild(select);

  // "더보기" 선택 시 전체 목록을 보여주는 이벤트
  select.addEventListener('change', (e) => {
    if (e.target.value === 'more') {
      showFullDateList(select);
    }
  });
}

// "더보기" 동작: fullDateList 전체를 옵션으로 교체 (팝업창 혹은 별도 UI로 구현 가능)
function showFullDateList(selectEl) {
  // 예시: prompt를 통해 전체 목록에서 선택하도록 함
  const listStr = fullDateList.join(', ');
  const chosen = prompt("전체 날짜 목록:\n" + listStr + "\n\n원하는 날짜를 입력하세요:");
  if (fullDateList.includes(chosen)) {
    // 선택한 날짜를 드롭다운의 값로 지정
    selectEl.value = chosen;
  } else {
    alert("유효한 날짜가 아닙니다.");
    // 기본값(첫번째 항목)으로 복원
    selectEl.selectedIndex = 0;
  }
}

/************************************************************
 *  기존 표 및 드롭다운 (이미 작성된 코드 유지)
 ************************************************************/
// 이미지용 (Red/Yellow/Green)
const IMAGE_URLS = {
    red: "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true",
    yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
    green: "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true"
  };

/************************************************************
 * 0. 전역/상수 설정
 ************************************************************/
// 2열 자동완성 후보
const AUTO_COMPLETE_LIST = [
    "산림청 LLM PoC",
    "국회 빅데이터 구축사업",
    "Copilot Agent 개발",
    "JTS LLM사업",
    "우리은행 GenAI 사업",
    "신한은행 GenAI 사업",
    "GPUaaS",
    "비씨카드",
    "업무 관리 프로세스",
    "고려대 산학 (MoM)",
    "신한은행 AI Branch 컨설팅/PoC 지원",
    "KPI 작성",
    "Lead 행사 추진",
    "구매/회계 업무",
    "IBM Agent Consulting",
    "agent agent",
    "Agent test"
    // ...
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
 * 1. 드롭다운 생성 함수
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
 * 2. 드롭다운 이벤트
 ************************************************************/
function initDropDownEvents(td) {
    const strategySelect = td.querySelector('.strategy-dropdown');
    const strategySpan   = td.querySelector('.dropdown-text');
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
    const detailSpan   = td.querySelector('.dropdown-text');
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
 * 3. 표 초기화
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
 * 4. 새 행 추가 (버튼)
 ************************************************************/
function addNewRow() {
    const table = document.querySelector('.myTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    for (let i = 0; i < 8; i++) {
      const td = document.createElement('td');
      if ([0, 1, 6].includes(i)) {
        // 드롭다운은 initTable에서 채워짐
      } else {
        td.classList.add('editable');
        td.contentEditable = "true";
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    initTable(table);
    // 2열 자동완성 (필요 시 attachAutoCompleteForCol2 함수 구현)
}

/************************************************************
 * 5. Submit 버튼: 선택한 날짜와 현재 도메인을 로컬 서버에 전송 (요건 2)
 ************************************************************/
function initSubmitButton() {
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.addEventListener('click', () => {
    const domain = window.location.hostname;
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
    // 전송할 문자열: A + X (예: "도메인값"+"선택날짜")
    const payload = {
      A: domain,
      X: selectedDate
    };

    // 로컬 서버 IP와 포트는 아래 변수를 수정하여 연결하세요.
    // 현재 내 맥북의 wifi 주소(b2:f6:ea:24:89:bb)는 MAC 주소이므로,
    // 실제 연결하려면 같은 네트워크 내의 IP (예: 192.168.1.100)와 포트(예: 3000)가 필요합니다.
    // 중간 AP의 주소나 포트포워딩 설정 등은 네트워크 환경에 따라 달라집니다.
    const LOCAL_SERVER_URL = "http://YOUR_LOCAL_SERVER_IP:YOUR_PORT/submit"; // 수정 필요

    fetch(LOCAL_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      alert("전송 성공: " + JSON.stringify(data));
      // 만약 A 주소에 들어왔을 경우, 최신 데이터를 iframe에 로드 (요건 4)
      // 예: 서버측 /view?domain=현재도메인
      document.getElementById("dataFrame").src = "http://YOUR_LOCAL_SERVER_IP:YOUR_PORT/view?domain=" + domain;
    })
    .catch(err => {
      console.error("전송 오류:", err);
      alert("전송에 실패했습니다.");
    });
  });
}

/************************************************************
 * 6. DOMContentLoaded: 초기화
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
