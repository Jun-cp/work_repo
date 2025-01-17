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
  const COL1_TO_COL7_OPTIONS = {
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
  /**
   * 0열 : 담당전략과제 : 드롭다운
   */
  function createADTextDropdown() {
    const container = document.createElement('div');
  
    const select = document.createElement('select');
    select.className = 'dropdown-select text-dropdown'; 
    const opts = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    opts.forEach(val => {
      const op = document.createElement('option');
      op.value = val;
      op.textContent = val === '' ? 'Select' : val;
      select.appendChild(op);
    });
  
    const span = document.createElement('span');
    span.className = 'dropdown-text hidden';
  
    container.appendChild(select);
    container.appendChild(span);
  
    return { container };
  }
  
  /**
   * 이미지 드롭다운(5열)
   */
  function createImageDropdown() {
    const container = document.createElement('div');
  
    const select = document.createElement('select');
    select.className = 'dropdown-select status-dropdown';
    const opts = [
      {val:'', text:'Select'},
      {val:'red', text:'Red'},
      {val:'yellow', text:'Yellow'},
      {val:'green', text:'Green'}
    ];
    opts.forEach(o => {
      const op = document.createElement('option');
      op.value = o.val;
      op.textContent = o.text;
      select.appendChild(op);
    });
  
    const img = document.createElement('img');
    img.className = 'status-image hidden';
    img.alt = 'status image';
  
    container.appendChild(select);
    container.appendChild(img);
  
    return { container };
  }
  
  /**
   * 7열 드롭다운: 동적으로 옵션을 세팅해야 하므로
   * 기본 구조만 만들고, 옵션은 나중에 주입
   */
  function createCol7Dropdown() {
    const container = document.createElement('div');
  
    const select = document.createElement('select');
    select.className = 'dropdown-select col7-dropdown hidden'; 
    // 초기에는 숨김
    // 옵션은 이후 populateCol7Options() 에서 설정
  
    const span = document.createElement('span');
    span.className = 'dropdown-text hidden';
  
    container.appendChild(select);
    container.appendChild(span);
  
    return { container };
  }
  
  /************************************************************
   * 2. 드롭다운 이벤트 초기화
   ************************************************************/
  function initDropDownEvents(td) {
    if (!td) return;
  
    // 1) A-D 드롭다운(1열)
    const textDropdown = td.querySelector('.text-dropdown');
    const textSpan = td.querySelector('.dropdown-text');
    if (textDropdown && textSpan) {
      textDropdown.addEventListener('change', () => {
        const val = textDropdown.value;
        if (val) {
          textSpan.textContent = val;
          textDropdown.classList.add('hidden');
          textSpan.classList.remove('hidden');
        } else {
          // “Select” (빈 값)으로 돌아갔을 때
          textSpan.textContent = '';
        }
        // 7열과 연동
        handleCol1Change(td, val);
      });
      textSpan.addEventListener('click', () => {
        textSpan.classList.add('hidden');
        textDropdown.classList.remove('hidden');
      });
    }
  
    // 2) 이미지 드롭다운(5열)
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
          // “Select”
          statusImage.classList.add('hidden');
        }
      });
      statusImage.addEventListener('click', () => {
        statusImage.classList.add('hidden');
        statusDropdown.classList.remove('hidden');
      });
    }
  
    // 3) 7열 드롭다운
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
          // “Select” -> 비워두기
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
   * 3. 1열-7열 연동 로직
   *   - 1열(A/B/C/D) 값 바뀔 때 => 같은 행의 7열 드롭다운 옵션 세팅
   ************************************************************/
  function handleCol1Change(col1Td, col1Val) {
    // col1Td가 속한 행을 찾음
    const row = col1Td.closest('tr');
    if (!row) return;
  
    const tds = row.querySelectorAll('td');
    if (tds.length < 13) return;
  
    // 7열은 index=6
    const col7Td = tds[6];
    if (!col7Td) return;
  
    // col7의 select, span 찾기
    const col7Select = col7Td.querySelector('.col7-dropdown');
    const col7Span = col7Td.querySelector('.dropdown-text');
    if (!col7Select || !col7Span) return;
  
    // 만약 1열이 “Select” 상태(값 없음)라면 => 7열도 비우고 숨김
    if (!col1Val) {
      // 드롭다운 reset
      col7Select.innerHTML = '';
      col7Select.classList.add('hidden');
      // span 숨기기 + text 지우기
      col7Span.classList.add('hidden');
      col7Span.textContent = '';
      return;
    }
  
    // 1열에 A/B/C/D 중 하나가 선택된 경우 => 7열 옵션 구성
    const newOptions = COL1_TO_COL7_OPTIONS[col1Val] || [];
  
    // 새 옵션 주입
    col7Select.innerHTML = ''; // 초기화
    // 맨 앞에 빈 옵션(Select)
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
  
    // 7열 드롭다운을 다시 보여주되, 아직 선택된 값 없음
    col7Select.value = '';
    col7Select.classList.remove('hidden');
    // span은 hidden
    col7Span.classList.add('hidden');
    col7Span.textContent = '';
  }
  
  
  /************************************************************
   * 4. 표 초기화(드롭다운 삽입 + 자동완성)
   ************************************************************/
  function initTable(table) {
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const tds = row.querySelectorAll('td');
      if (tds.length < 13) return;
  
      // 1열( index=0 )
      {
        const col1 = tds[0];
        if (col1.children.length === 0) {
          const { container } = createADTextDropdown();
          col1.appendChild(container);
        }
      }
      // 5열( index=4 ) 이미지 드롭다운
      {
        const col5 = tds[4];
        if (col5.children.length === 0) {
          const { container } = createImageDropdown();
          col5.appendChild(container);
        }
      }
      // 7열( index=6 ), 동적 텍스트 드롭다운
      {
        const col7 = tds[6];
        if (col7.children.length === 0) {
          const { container } = createCol7Dropdown();
          col7.appendChild(container);
        }
      }
      // 이벤트 부여
      tds.forEach(td => initDropDownEvents(td));
    });
  }
  
  /************************************************************
   * 5. 자동완성(2열) 기능
   ************************************************************/
  function attachAutoCompleteForTd(td) {
    if (!td) return;
    // hint 박스
    let hintBox = document.createElement('div');
    hintBox.className = 'autocomplete-hint hidden';
    td.appendChild(hintBox);
  
    // 입력 이벤트
    td.addEventListener('input', () => {
      const text = td.textContent.trim();
      if (!text) {
        hintBox.classList.add('hidden');
        return;
      }
      // 후보 중에 text를 부분적으로 포함하는 항목
      const found = AUTO_COMPLETE_LIST.find(item => item.includes(text));
      if (found) {
        hintBox.textContent = found;
        hintBox.classList.remove('hidden');
      } else {
        hintBox.classList.add('hidden');
      }
    });
  
    // blur + 일부 keydown 시점에 hint 숨김
    td.addEventListener('blur', hideHint);
    td.addEventListener('keydown', (e) => {
      const keys = ['ArrowUp','ArrowDown','ArrowRight',' ','Enter'];
      if (keys.includes(e.key)) {
        hideHint();
      }
    });
    function hideHint() {
      hintBox.classList.add('hidden');
    }
  }
  
  
  /************************************************************
   * 6. 전체 초기화
   ************************************************************/
  document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('table.myTable');
    tables.forEach(tbl => {
      initTable(tbl);
  
      // 2열( index=1 ) 자동완성 기능
      const rows = tbl.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const tds = row.querySelectorAll('td');
        if (tds.length >= 2) {
          attachAutoCompleteForTd(tds[1]); // 2열
        }
      });
    });
  });
  