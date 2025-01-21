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
    "구매/회계 업무"

    // ...
  ];
  
  
  // 0열(A~F)에 따른 1열 옵션 매핑
  // 예: A -> [A-1, A-2, A-3], C -> [C-1, C-2], ...
  const COL0_TO_COL7_OPTIONS = {
    A: ["컨설팅/제안(핵심&전략고객)", "사전컨설팅(for 고객발굴/사업화)", "이슈조정/해소(for AX전략이행/사업추진)"],
    B: ["Delivery방안 확보", "고객Ref. 확보", "AIAgentSvc. 발굴/확보"], // 필요시 확장
    C: ["글로벌Ref. 확보", "협력파트너 확보", "CoWork 사업 Ref. 확보"],
    D: ["Lead 내 담당 업무"],
    E: ["컨설팅/제안 지원(핵심&전략고객)", "그룹AX협력과제 발굴/이행지원", "MS/AX유관조직 가교역할"],
    F: ["AX컨설팅수행(핵심&전략고객)", "PoC기획/개발/프로토타이핑(핵심&전략고객)", "AIMSP협력모델 구축"], // 필요시 확장
    G: ["AX컨설팅방법론 표준화/확산", "AI신기술분석/내부역량강화/기술지원", "Ref.아키텍처 발굴/확산"],
    H: ["Lead 내 담당 업무"]  // 필요시 확장
  };
  
  
  /************************************************************
   * 1. 드롭다운 생성 함수들
   ************************************************************/
  * 1. 드롭다운 생성 함수
 ************************************************************/
function createADTextDropdown() {
  // 0열에서 쓸 '전략과제' 드롭다운
  const container = document.createElement('div');
  const select = document.createElement('select');
  select.className = 'dropdown-select text-dropdown';

  // 예: A~H
  const opts = [
    { val:'',  text:'(선택)' },
    { val:'A', text:'1_AX사업...' },
    { val:'B', text:'1_MS파트너...' },
    { val:'C', text:'1_c...' },
    { val:'D', text:'1_d...' },
    { val:'E', text:'2_1...' },
    { val:'F', text:'2_2...' },
    { val:'G', text:'2_3...' },
    { val:'H', text:'2_Lead내 담당...' }
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

function createImageDropdown() {
  // 신호등
  const container = document.createElement('div');
  const select = document.createElement('select');
  select.className = 'dropdown-select status-dropdown';

  const opts = [
    { val:'', text:'Select' },
    { val:'red',    text:'Red' },
    { val:'yellow', text:'Yellow' },
    { val:'green',  text:'Green' }
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

function createCol7Dropdown() {
  // 7열에서 쓸 '세부항목' 드롭다운
  const container = document.createElement('div');

  const select = document.createElement('select');
  select.className = 'dropdown-select col7-dropdown hidden';

  const span = document.createElement('span');
  span.className = 'dropdown-text hidden';

  container.appendChild(select);
  container.appendChild(span);
  return { container };
}

/************************************************************
 * 2. 드롭다운 이벤트
 ************************************************************/
function initDropDownEvents(td) {
  // 0열 드롭다운
  const textDropdown = td.querySelector('.text-dropdown');
  const textSpan = td.querySelector('.dropdown-text');
  if (textDropdown && textSpan) {
    textDropdown.addEventListener('change', () => {
      const val = textDropdown.value;
      const displayText = textDropdown.options[textDropdown.selectedIndex].textContent;

      if (val) {
        textSpan.textContent = displayText;
        textDropdown.classList.add('hidden');
        textSpan.classList.remove('hidden');
      } else {
        textSpan.textContent = '';
      }
      // 7열 연동
      handleCol0Change(td, val);
    });

    textSpan.addEventListener('click', () => {
      textSpan.classList.add('hidden');
      textDropdown.classList.remove('hidden');
    });
  }

  // 신호등 드롭다운
  const statusDropdown = td.querySelector('.status-dropdown');
  const statusImage = td.querySelector('.status-image');
  if (statusDropdown && statusImage) {
    statusDropdown.addEventListener('change', () => {
      const selVal = statusDropdown.value;
      if (IMAGE_URLS[selVal]) {
        statusImage.src = IMAGE_URLS[selVal];
        statusDropdown.classList.add('hidden');
        statusImage.classList.remove('hidden');
      } else {
        statusImage.classList.add('hidden');
      }
    });
    statusImage.addEventListener('click', () => {
      statusImage.classList.add('hidden');
      statusDropdown.classList.remove('hidden');
    });
  }

  // 7열 드롭다운
  const col7Dropdown = td.querySelector('.col7-dropdown');
  const col7Span = td.querySelector('.dropdown-text');
  if (col7Dropdown && col7Span) {
    col7Dropdown.addEventListener('change', () => {
      const val = col7Dropdown.value;
      if (val) {
        col7Span.textContent = val;
        col7Dropdown.classList.add('hidden');
        col7Span.classList.remove('hidden');
      } else {
        col7Span.textContent = '';
      }
    });
    col7Span.addEventListener('click', () => {
      col7Span.classList.add('hidden');
      col7Dropdown.classList.remove('hidden');
    });
  }
}

/************************************************************
 * 3. 0열 -> 7열 연동
 ************************************************************/
function handleCol0Change(col0Td, col0Val) {
  // col0Td: 0열의 TD
  const row = col0Td.closest('tr');
  if (!row) return;

  // 7열 = index 7
  const tds = row.querySelectorAll('td');
  if (tds.length < 8) return;
  const col7Td = tds[7];

  const col7Select = col7Td.querySelector('.col7-dropdown');
  const col7Span   = col7Td.querySelector('.dropdown-text');
  if (!col7Select || !col7Span) return;

  if (!col0Val) {
    // 선택 해제 -> 7열도 숨김/리셋
    col7Select.innerHTML = '';
    col7Select.classList.add('hidden');
    col7Span.classList.add('hidden');
    col7Span.textContent = '';
    return;
  }

  // 새 옵션
  const newOptions = COL0_TO_COL7_OPTIONS[col0Val] || [];
  col7Select.innerHTML = '';
  // 맨 앞에 Select
  const blankOpt = document.createElement('option');
  blankOpt.value = '';
  blankOpt.textContent = 'Select';
  col7Select.appendChild(blankOpt);

  newOptions.forEach(val => {
    const op = document.createElement('option');
    op.value = val;
    op.textContent = val;
    col7Select.appendChild(op);
  });

  col7Select.value = '';
  col7Select.classList.remove('hidden');
  col7Span.classList.add('hidden');
  col7Span.textContent = '';
}

/************************************************************
 * 4. 표 초기화
 ************************************************************/
function initTable(table) {
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const tds = row.querySelectorAll('td');
    // 원하는 열 개수보다 적으면 무시
    if (tds.length < 8) return; // 예시로 최소 8칸

    // 0열 => createADTextDropdown
    {
      const col0 = tds[0];
      if (col0.children.length === 0) {
        const { container } = createADTextDropdown();
        col0.appendChild(container);
      }
    }

    // 6열 => createImageDropdown (신호등)
    {
      const col6 = tds[6];
      if (col6.children.length === 0) {
        const { container } = createImageDropdown();
        col6.appendChild(container);
      }
    }

    // 7열 => createCol7Dropdown
    {
      const col7 = tds[7];
      if (col7.children.length === 0) {
        const { container } = createCol7Dropdown();
        col7.appendChild(container);
      }
    }

    // 각 td에 이벤트 부여
    tds.forEach(td => initDropDownEvents(td));
  });
}

/************************************************************
 * 5. 자동완성(1열 => index=1) 예시
 ************************************************************/
function attachAutoCompleteForTd(td) {
  if (!td) return;
  const hintBox = document.createElement('div');
  hintBox.className = 'autocomplete-hint hidden';
  td.appendChild(hintBox);

  td.addEventListener('input', () => {
    const text = td.textContent.trim();
    if (!text) {
      hintBox.classList.add('hidden');
      return;
    }
    const found = AUTO_COMPLETE_LIST.find(item => item.includes(text));
    if (found) {
      hintBox.textContent = found;
      hintBox.classList.remove('hidden');
    } else {
      hintBox.classList.add('hidden');
    }
  });

  td.addEventListener('blur', () => hintBox.classList.add('hidden'));
  td.addEventListener('keydown', (e) => {
    if (['ArrowUp','ArrowDown','ArrowRight',' ','Enter'].includes(e.key)) {
      hintBox.classList.add('hidden');
    }
  });
}

/************************************************************
 * 6. 행 초기화 + DOMContentLoaded
 ************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('table.myTable');
  if (table) {
    initTable(table);

    // 예) 1열(index=1)만 자동완성 적용
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const tds = row.querySelectorAll('td');
      if (tds.length > 1) {
        attachAutoCompleteForTd(tds[1]);
      }
    });
  }
});