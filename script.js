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
  // 예: A -> [A-1, A-2, A-3], C -> [C-1, C-2], ...
const STRATEGY_TO_DETAIL_OPTIONS = {
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
   * 1. 드롭다운 생성 함수
   ************************************************************/
  /** (0열) 전략과제 드롭다운 */
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

  /** (1열) 세부항목 드롭다운 */
  function createDetailDropdown() {
    const container = document.createElement('div');
    const select = document.createElement('select');
    // 처음엔 숨겨둬야 한다면 'hidden' 클래스를 추가해도 됨
    select.className = 'dropdown-select detail-dropdown hidden';

    const span = document.createElement('span');
    span.className = 'dropdown-text hidden';

    container.appendChild(select);
    container.appendChild(span);
    return { container };
  }

  /** (6열) 신호등(이미지) 드롭다운 */
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
    img.className = 'status-image hidden';  // CSS로 높이 고정
    container.appendChild(select);
    container.appendChild(img);

    return { container };
  }

  /************************************************************
   * 2. 드롭다운 이벤트
   ************************************************************/
  /** 각 TD 내부(전략/세부/신호등) 컴포넌트 초기화 */
  function initDropDownEvents(td) {
    // (0열) 전략과제
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
        // 세부항목 연동
        handleStrategyChange(td, val);
      });
      strategySpan.addEventListener('click', () => {
        strategySpan.classList.add('hidden');
        strategySelect.classList.remove('hidden');
      });
    }

    // (1열) 세부항목
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

    // (6열) 신호등
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

  /************************************************************
   * 3. (0열)전략과제 => (1열)세부항목 연동
   ************************************************************/
  function handleStrategyChange(strategyTd, strategyVal) {
    // strategyTd는 (0열)TD
    const row = strategyTd.closest('tr');
    if (!row) return;

    const tds = row.querySelectorAll('td');
    if (tds.length < 2) return; // 최소 2칸 (0,1)

    // (1열) 세부항목 TD
    const detailTd = tds[1];
    const detailSelect = detailTd.querySelector('.detail-dropdown');
    const detailSpan   = detailTd.querySelector('.dropdown-text');
    if (!detailSelect || !detailSpan) return;

    // 값이 없으면 => 1열 비우기+숨김
    if (!strategyVal) {
      detailSelect.innerHTML = '';
      detailSelect.classList.add('hidden');
      detailSpan.classList.add('hidden');
      detailSpan.textContent = '';
      return;
    }

    // 새 옵션
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
   * 4. 표 초기화
   ************************************************************/
  function initTable(table) {
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const tds = row.querySelectorAll('td');

      // 0열 => 전략과제
      if (tds[0]) {
        const col0 = tds[0];
        if (!col0.querySelector('.strategy-dropdown')) {
          const { container } = createStrategyDropdown();
          col0.appendChild(container);
        }
      }

      // 1열 => 세부항목
      if (tds[1]) {
        const col1 = tds[1];
        if (!col1.querySelector('.detail-dropdown')) {
          const { container } = createDetailDropdown();
          col1.appendChild(container);
        }
      }

      // 2열 => 자동완성 (단순 contenteditable, 나중에 autoComplete 붙임)

      // 6열 => 신호등
      if (tds[6]) {
        const col6 = tds[6];
        if (!col6.querySelector('.status-dropdown')) {
          const { container } = createTrafficDropdown();
          col6.appendChild(container);
        }
      }

      // 각 TD별로 드롭다운 이벤트 초기화
      tds.forEach(td => initDropDownEvents(td));
    });
  }


//   function attachAutoCompleteToCell(td) {
//     if (!td) return;
  
//     let isComposing = false;  // IME 조합 상태
//     // 만약 "한글 1글자 입력" 시에도 바로 검색/표시를 원한다면,
//     // compositionupdate 단계에서 updateHints()를 호출해주면 됩니다.
  
//     // 자동완성 힌트 박스
//     const hintBox = document.createElement('div');
//     hintBox.className = 'autocomplete-hint hidden';
//     td.appendChild(hintBox);
  
//     /************************************************************
//      * 1) IME 조합 이벤트
//      ************************************************************/
//     td.addEventListener('compositionstart', () => {
//       isComposing = true;
//     });
  
//     // [추가] compositionupdate => 한글 초성/중성만 입력 중이라도
//     //        실시간으로 반영하고 싶다면 여기서 updateHints()를 호출
//     td.addEventListener('compositionupdate', () => {
//       // 만약 "한 글자씩 바로 표시"를 원한다면:
//       updateHints(); 
//       // (이 부분은 사용자 취향/UX에 따라 on/off 가능)
//     });
  
//     td.addEventListener('compositionend', () => {
//       isComposing = false;
//       updateHints(); // 조합 완료 시 최종 확정된 텍스트로 업데이트
//     });
  
//     /************************************************************
//      * 2) 일반 input 이벤트
//      ************************************************************/
//     td.addEventListener('input', () => {
//       // IME 조합 중이 아닐 때만 updateHints
//       if (!isComposing) {
//         updateHints();
//       }
//     });
  
//     /************************************************************
//      * 3) 백스페이스 처리
//      ************************************************************/
//     td.addEventListener('keyup', (e) => {
//       // 백스페이스 / Delete 등 글자 제거 시에도 즉시 반영
//       if ((e.key === 'Backspace' || e.key === 'Delete') && !isComposing) {
//         // 0ms 지연(브라우저에서 textContent가 갱신된 후 실행)
//         setTimeout(() => {
//           updateHints();
//         }, 0);
//       }
//     });
  
//     /************************************************************
//      * 4) blur 시 hint 닫기
//      ************************************************************/
//     td.addEventListener('blur', () => {
//       setTimeout(() => {
//         hintBox.classList.add('hidden');
//       }, 150);
//     });
  
//     /************************************************************
//      * 5) ESC 키로 hint 닫기
//      ************************************************************/
//     td.addEventListener('keydown', (e) => {
//       if (e.key === 'Escape') {
//         hintBox.classList.add('hidden');
//       }
//     });
  
//     /************************************************************
//      * 6) updateHints() : 목록을 실시간 필터 + 표시
//      ************************************************************/
//     function updateHints() {
//       const text = td.textContent.trim();
//       if (!text) {
//         // 완전히 빈 셀 => hint 숨김
//         hintBox.innerHTML = '';
//         hintBox.classList.add('hidden');
//         return;
//       }
  
//       // 대소문자 구분 없이 부분 검색
//       const lowerText = text.toLowerCase();
//       const matches = AUTO_COMPLETE_LIST.filter(item =>
//         item.toLowerCase().includes(lowerText)
//       );
  
//       if (matches.length === 0) {
//         hintBox.innerHTML = '';
//         hintBox.classList.add('hidden');
//         return;
//       }
  
//       // 목록 표시
//       let html = '';
//       matches.forEach(m => {
//         html += `<div class="autocomplete-item">${m}</div>`;
//       });
//       hintBox.innerHTML = html;
//       hintBox.classList.remove('hidden');
  
//       // 아이템 클릭 => td에 반영 + 다음 편집도 가능하게
//       const itemEls = hintBox.querySelectorAll('.autocomplete-item');
//       itemEls.forEach(itemEl => {
//         itemEl.addEventListener('mousedown', (e) => {
//           e.stopPropagation(); // blur 방지
//           // 1) 셀 내용 삽입
//           td.textContent = itemEl.textContent;
//           // 2) 힌트 숨김
//           hintBox.classList.add('hidden');
//           // 3) 포커스 + 커서 위치 이동
//           focusEndOfCell(td);
  
//           // 4) 인위적 input 이벤트 발생 => 이후 편집 시 곧바로 업데이트
//           //    (이것이 없으면, 한 번 선택 후 textContent 변경 시
//           //     브라우저가 input 이벤트를 못 감지하는 경우가 생길 수 있음)
//           td.dispatchEvent(new Event('input', { bubbles: true }));
//         });
//       });
//     }
  
//     /************************************************************
//      * 7) focusEndOfCell() : 셀 맨 뒤로 커서 이동
//      ************************************************************/
//     function focusEndOfCell(cell) {
//       // focus() 후, caret 맨 뒤로 보내기
//       cell.focus();
//       const selection = window.getSelection();
//       if (!selection) return;
  
//       const range = document.createRange();
//       range.selectNodeContents(cell);
//       range.collapse(false); // 맨 뒤로
//       selection.removeAllRanges();
//       selection.addRange(range);
//     }
//   }
  
  
  /************************************************************
   * 6. 새 행 추가 (버튼)
   ************************************************************/
  function addNewRow() {
    const table = document.querySelector('.myTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // 새 tr 생성(여기선 8칸 예시)
    const tr = document.createElement('tr');
    for (let i=0; i<8; i++) {
      const td = document.createElement('td');
      // 0열(전략), 1열(세부항목), 6열(신호등)에만 드롭다운. 
      // 2열(자동완성) 포함 나머지는 editable
      if ([0,1,6].includes(i)) {
        // 나중에 initTable()에서 드롭다운 삽입
      } else {
        td.classList.add('editable');
        td.contentEditable = "true";
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);

    // 새 행에도 initTable
    initTable(table);

    // 2열 => 자동완성
    const tds = tr.querySelectorAll('td');
    if (tds[2]) {
      attachAutoCompleteForCol2(tds[2]);
    }
  }

   /************************************************************
   * 7. DOMContentLoaded
   ************************************************************/
   document.addEventListener('DOMContentLoaded', () => {
    const table = document.querySelector('.myTable');
    if (table) {
      // 1) 기존 행 드롭다운 삽입
      initTable(table);
    //   // 2) 자동완성 -> 2열
    //   const rows = table.querySelectorAll('tbody tr');
    //   rows.forEach(row => {
    //     const tds = row.querySelectorAll('td');
    //     if (tds[2]) {
    //       attachAutoCompleteToCell(tds[2]);
    //     }
    //   });
    }

    // (4) 버튼 안 뜬다면, 아래 요소가 HTML에 없는지 확인
    const addBtn = document.getElementById('addRowBtn');
    if (addBtn) {
      addBtn.addEventListener('click', addNewRow);
    } else {
      console.log("addRowBtn 버튼이 HTML에 없습니다. 버튼이 안 보일 수 있습니다.");
    }
  });