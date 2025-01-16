/************************************************************
 * 1. 편집 모드/발행 모드에 따른 버튼 노출 제어
 ************************************************************/
// URL에 ?editMode=true 가 있으면, 편집 모드로 간주
(function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('editMode') === 'true';
  
    if (isEditMode) {
      // 편집 모드: 버튼 보이기
      const editElements = document.querySelectorAll('.edit-only');
      editElements.forEach(el => {
        el.style.display = 'block';
      });
    }
  })();
  
  /************************************************************
   * 2. 이미지 드롭다운, 텍스트 드롭다운 토글 기능 초기화
   ************************************************************/
  // 사용될 이미지 링크(예시)
  const IMAGE_URLS = {
    red: "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true",
    yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
    green: "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true"
  };
  
  /** 
   * 각 셀의 드롭다운/이미지/텍스트 등을 초기화하는 함수.
   * (표가 복제되거나 새 행이 추가되었을 때도 재호출)
   */
  function initDropDownInCell(cell) {
    // 1) 텍스트 드롭다운(A/B/C/D)
    const textDropdown = cell.querySelector('.text-dropdown');
    const dropdownText = cell.querySelector('.dropdown-text');
    if (textDropdown && dropdownText) {
      // 드롭다운 변경 -> 텍스트 표시
      textDropdown.addEventListener('change', () => {
        const val = textDropdown.value;
        if (val) {
          dropdownText.textContent = val;  // A/B/C/D 중 선택값
          textDropdown.classList.add('hidden');
          dropdownText.classList.remove('hidden');
        }
      });
      // 텍스트 클릭 -> 다시 드롭다운 보이기
      dropdownText.addEventListener('click', () => {
        dropdownText.classList.add('hidden');
        textDropdown.classList.remove('hidden');
        // 필요 시 드롭다운 선택값 초기화
        // textDropdown.value = "";
      });
    }
  
    // 2) 이미지 드롭다운(Red/Yellow/Green)
    const statusDropdown = cell.querySelector('.status-dropdown');
    const statusImage = cell.querySelector('.status-image');
    if (statusDropdown && statusImage) {
      // 드롭다운 변경 -> 이미지 표시
      statusDropdown.addEventListener('change', () => {
        const selectedValue = statusDropdown.value;
        if (IMAGE_URLS[selectedValue]) {
          statusImage.src = IMAGE_URLS[selectedValue];
          // 토글
          statusDropdown.classList.add('hidden');
          statusImage.classList.remove('hidden');
        }
      });
      // 이미지 클릭 -> 다시 드롭다운 보이기
      statusImage.addEventListener('click', () => {
        statusImage.classList.add('hidden');
        statusDropdown.classList.remove('hidden');
        // 필요 시 statusDropdown.value = "";
      });
    }
  }
  
  /** 
   * 테이블 전체에 있는 1열/3열 드롭다운 셀을 초기화 
   * (기존 표 + 새로 생성 표/행에도 적용 가능)
   */
  function initTable(table) {
    if (!table) return;
    // table 내의 모든 .dropdown-cell 에 대해 initDropDownInCell
    const dropdownCells = table.querySelectorAll('.dropdown-cell');
    dropdownCells.forEach(cell => {
      initDropDownInCell(cell);
    });
  }
  
  /** 
   * 페이지 로드 시, 모든 .myTable 초기화 
   */
  function initAllTables() {
    const allTables = document.querySelectorAll('.myTable');
    allTables.forEach(table => initTable(table));
  }
  
  /************************************************************
   * 3. 표 크기(행/열) 변동 시 자동으로 드롭다운 삽입하기 (선택 구현)
   ************************************************************/
  /*  
    Confluence 환경에서 DOM 변경(MutationObserver)이 허용되는 경우를 가정.
    - 편집 모드에서 표 크기를 늘리면, 내부 DOM이 변경되거나 재생성될 수 있음.
    - 아래와 같이 Observer를 달아놓고, 새로운 row나 cell이 생기면
      수동으로 .dropdown-cell 구조를 주입하거나, initDropDownInCell() 호출 등 가능.
  */
  (function observeTableChanges() {
    // 옵션: subtree 전체 감시, 자식 추가/삭제/속성변경 등
    const observerConfig = {
      childList: true,
      subtree: true
    };
  
    const callback = function(mutationsList, observer) {
      // 새로 생긴 노드 중에 테이블/row/td가 있으면 재초기화
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            // 새로 추가된 tr, td 등이 있을 수 있음
            if (node.nodeName === 'TABLE' || node.nodeName === 'TR' || node.nodeName === 'TD') {
              // 간단히 전체 테이블 다시 init
              initAllTables();
            }
          });
        }
      }
    };
  
    // body 전체를 감시(또는 특정 영역만 감시)
    const targetNode = document.body;
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, observerConfig);
  })();
  
  /************************************************************
   * 4. "새로운 표 만들기" 버튼 기능
   *    - 새 표의 1행은 기존 표들과 동일(Week/Some Info/Status/Comment)
   *    - 그 뒤, 페이지 내 '모든 표' 중에서 '첫 번째 표'의 (2행 ~ 끝행)만 순회:
   *      (a) 1열 == 2열이면 4열 뒤에 " (=)" 추가
   *      (b) (a)와 무관하게, 2열 값이 '새 표에 이미 추가된 2열 값들'과 중복 아니면, 4열 뒤에 " (new)" 추가
   ************************************************************/
  function createNewTableFromExisting() {
    // 1) 새로운 표 요소 만들기
    const newTable = document.createElement('table');
    newTable.classList.add('myTable'); // 동일한 스타일/스크립트 적용받도록
  
    // 1-1) 헤더(1행)
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Week</th>
        <th>Some Info</th>
        <th>Status</th>
        <th>Comment</th>
      </tr>
    `;
    newTable.appendChild(thead);
  
    const tbody = document.createElement('tbody');
    newTable.appendChild(tbody);
  
    // 2) 모든 표 중 첫 번째 표를 찾기
    const allTables = document.querySelectorAll('.myTable');
    if (allTables.length === 0) {
      alert('기존 표가 없습니다!');
      return;
    }
    const firstTable = allTables[0];
  
    // 2열 값 중복 체크용 (새 표에 이미 들어간 2열 값들)
    const secondColValuesInNew = new Set();
  
    // 3) 첫 번째 표의 2행~마지막 행만 순회
    const firstTableBody = firstTable.querySelector('tbody');
    if (!firstTableBody) return;
  
    const rows = firstTableBody.querySelectorAll('tr');
    rows.forEach(row => {
      // (Week, Some Info, Status, Comment)
      // row의 4개 셀을 가져온다고 가정
      const cells = row.querySelectorAll('td, th');
      if (cells.length < 4) return; // 혹시 4개 미만이면 무시
  
      // 값 읽어오기
      const col1Val = cells[0].textContent.trim();
      const col2Val = cells[1].textContent.trim();
      const col3Val = cells[2].textContent.trim();
      const col4Val = cells[3].textContent.trim();
  
      // 새 row 만들기
      // (a) 1열과 2열이 같다면, 4열 뒤에 " (=)" 추가
      let newCol4Val = col4Val;
      if (col1Val === col2Val) {
        newCol4Val += ' (=)';
      }
  
      // (b) 만약 2열 값이 아직 새 표에 없는 값이면 " (new)" 추가
      if (!secondColValuesInNew.has(col2Val)) {
        newCol4Val += ' (new)';
        secondColValuesInNew.add(col2Val);
      }
  
      // tr + td 4개 생성
      const newTr = document.createElement('tr');
      newTr.innerHTML = `
        <td class="dropdown-cell">
          <select class="text-dropdown">
            <option value="">Select</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
          <span class="dropdown-text hidden"></span>
        </td>
        <td class="editable">${col2Val}</td>
        <td class="dropdown-cell">
          <select class="status-dropdown">
            <option value="">Select</option>
            <option value="red">Red</option>
            <option value="yellow">Yellow</option>
            <option value="green">Green</option>
          </select>
          <img class="status-image hidden" src="" alt="status image" />
        </td>
        <td class="editable">${newCol4Val}</td>
      `;
      tbody.appendChild(newTr);
    });
  
    // 4) newTable을 화면 상단의 #newTableContainer 안에 추가
    const container = document.getElementById('newTableContainer');
    container.prepend(newTable);
  
    // 5) 새로 만든 표에도 드롭다운 초기화
    initTable(newTable);
  }
  
  /** 
   * 버튼에 이벤트 연결 
   */
  document.addEventListener('DOMContentLoaded', () => {
    // 기존 테이블 초기화
    initAllTables();
  
    // "새로운 표 만들기" 버튼
    const createBtn = document.getElementById('createTableBtn');
    if (createBtn) {
      createBtn.addEventListener('click', createNewTableFromExisting);
    }
  });
  
/************************************************************
 * 0. 전역/상수 설정
 ************************************************************/
// 자동완성 후보들 (예: "산림청 LLM PoC" 등)
// 나중에 필요 시 추가/수정 가능
const AUTO_COMPLETE_LIST = [
    "산림청 LLM PoC",
    "샘플 텍스트1",
    "샘플 텍스트2",
    // ...
  ];
  
  // 이미지용 (Red/Yellow/Green)
  const IMAGE_URLS = {
    red: "https://via.placeholder.com/100x50/ff0000/ffffff?text=RED",
    yellow: "https://via.placeholder.com/100x50/ffff00/000000?text=YELLOW",
    green: "https://via.placeholder.com/100x50/00ff00/000000?text=GREEN"
  };
  
  
  /************************************************************
   * 1. 드롭다운 구성 함수들
   ************************************************************/
  /**
   * A-D 텍스트 드롭다운 생성 함수
   * 반환값: { container } (select + span.text)
   *  - select: class="dropdown-select text-dropdown"
   *  - span: class="dropdown-text hidden"
   * 클릭/토글 로직은 initDropDownEvents()에서 처리
   */
  function createADTextDropdown() {
    // 컨테이너
    const container = document.createElement('div');
  
    // select
    const select = document.createElement('select');
    select.className = 'dropdown-select text-dropdown'; 
    // 옵션 A~D
    const opts = ['', 'A', 'B', 'C', 'D'];
    opts.forEach(val => {
      const op = document.createElement('option');
      op.value = val;
      op.textContent = val === '' ? 'Select' : val;
      select.appendChild(op);
    });
  
    // span
    const span = document.createElement('span');
    span.className = 'dropdown-text hidden';
    span.textContent = ''; // 선택 시 갱신
  
    container.appendChild(select);
    container.appendChild(span);
  
    return { container };
  }
  
  /**
   * 이미지 드롭다운(Red/Yellow/Green) 생성 함수
   * 반환값: { container } (select + img)
   */
  function createImageDropdown() {
    const container = document.createElement('div');
  
    const select = document.createElement('select');
    select.className = 'dropdown-select status-dropdown';
    // 옵션
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
   * 텍스트 드롭다운(예: 1열과 같은 방식)이지만
   * 나중에 옵션을 바꾸기 쉽게 모듈화
   * 현재는 A~D라고 가정 (or 다른 문자열들)
   */
  function createCustomTextDropdown() {
    // 여기서 옵션 목록을 바꾸면 됨 (주석)
    // 예: ['', 'X', 'Y', 'Z', ...]
    const container = document.createElement('div');
  
    const select = document.createElement('select');
    select.className = 'dropdown-select custom-text-dropdown';
    // 옵션 (예: E~H?)
    const opts = ['', 'E', 'F', 'G', 'H'];
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
  
  
  /************************************************************
   * 2. 드롭다운 이벤트 초기화
   ************************************************************/
  function initDropDownEvents(td) {
    if (!td) return;
  
    // 1) A-D 드롭다운
    const textDropdown = td.querySelector('.text-dropdown');
    const textSpan = td.querySelector('.dropdown-text');
    if (textDropdown && textSpan) {
      textDropdown.addEventListener('change', () => {
        const val = textDropdown.value;
        if (val) {
          textSpan.textContent = val;
          textDropdown.classList.add('hidden');
          textSpan.classList.remove('hidden');
        }
      });
      textSpan.addEventListener('click', () => {
        textSpan.classList.add('hidden');
        textDropdown.classList.remove('hidden');
      });
    }
  
    // 2) 이미지 드롭다운 (5열)
    const statusDropdown = td.querySelector('.status-dropdown');
    const statusImage = td.querySelector('.status-image');
    if (statusDropdown && statusImage) {
      statusDropdown.addEventListener('change', () => {
        const selVal = statusDropdown.value;
        if (IMAGE_URLS[selVal]) {
          statusImage.src = IMAGE_URLS[selVal];
          statusDropdown.classList.add('hidden');
          statusImage.classList.remove('hidden');
        }
      });
      statusImage.addEventListener('click', () => {
        statusImage.classList.add('hidden');
        statusDropdown.classList.remove('hidden');
      });
    }
  
    // 3) custom-text-dropdown (7열)
    const customDropdown = td.querySelector('.custom-text-dropdown');
    const customSpan = td.querySelector('.dropdown-text');
    if (customDropdown && customSpan) {
      customDropdown.addEventListener('change', () => {
        const val = customDropdown.value;
        if (val) {
          customSpan.textContent = val;
          customDropdown.classList.add('hidden');
          customSpan.classList.remove('hidden');
        }
      });
      customSpan.addEventListener('click', () => {
        customSpan.classList.add('hidden');
        customDropdown.classList.remove('hidden');
      });
    }
  }
  
  
  /************************************************************
   * 3. 표 초기화(드롭다운 삽입 + 이벤트)
   ************************************************************/
  function initTable(table) {
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // 각 tr을 순회, 필요한 td에 드롭다운을 삽입
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const tds = row.querySelectorAll('td');
      if (tds.length < 13) return; // 13열
  
      // 1열 (index 0): A-D 드롭다운
      {
        const col1 = tds[0];
        if (col1.children.length === 0) {
          // 아직 드롭다운 미생성 시
          const { container } = createADTextDropdown();
          col1.appendChild(container);
        }
      }
      // 5열 (index 4): 이미지 드롭다운
      {
        const col5 = tds[4];
        if (col5.children.length === 0) {
          const { container } = createImageDropdown();
          col5.appendChild(container);
        }
      }
      // 7열 (index 6): custom 텍스트 드롭다운
      {
        const col7 = tds[6];
        if (col7.children.length === 0) {
          const { container } = createCustomTextDropdown();
          col7.appendChild(container);
        }
      }
  
      // 이제 각 td에 대해 이벤트 할당
      tds.forEach(td => initDropDownEvents(td));
  
      // 2열은 자동완성 + 편집 가능, etc.
      // 그러나 실제로는 'td.editable' 이 여러 곳 있을 수 있으므로
      // 아래에서 "자동완성 로직"은 'td:nth-child(2) 즉 index=1'인지 확인해서만 동작토록
      // (문제 요구사항대로라면 'Label_1'이 2열이므로 index=1)
    });
  }
  
  /************************************************************
   * 4. 자동완성(2열) 기능
   ************************************************************/
  // 자동완성은 "input" 이벤트를 감지할 수 없으므로, 
  // contenteditable을 가진 td에 "keyup" or "input" 등 이벤트 리스너를 달아서 구현.
  
  function attachAutoCompleteForTd(td) {
    if (!td) return;
    // hint 박스를 만든다
    let hintBox = document.createElement('div');
    hintBox.className = 'autocomplete-hint hidden';
    td.appendChild(hintBox);
  
    // 입력 이벤트
    td.addEventListener('input', (e) => {
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
    
    // "완료" 이벤트: 키보드 이동, 스페이스/엔터, 포커스 아웃 등
    // 간단하게 blur 이벤트 + keydown 로직으로 구현 예시
    td.addEventListener('blur', handleAutoCompleteDone);
    td.addEventListener('keydown', (e) => {
      // up/down/right/space/enter
      const keys = ['ArrowUp','ArrowDown','ArrowRight',' ','Enter'];
      if (keys.includes(e.key)) {
        handleAutoCompleteDone(e);
      }
    });
  
    // 실제 로직
    function handleAutoCompleteDone(e) {
      // 자동완성 힌트 숨기기
      hintBox.classList.add('hidden');
  
      // (7)번 요구사항 로직
      //  - "해당 표의 2열에 있는 값이 이 표의 2열에 없을 경우,
      //    해당 행의 3,4,12열을 이 표의 3,4,12열에 그대로 복사"
      //  
      //  - "이 페이지에 있는 지난 표들을 위에서부터 탐색" -> 
      //    (가정) '현재 TD'가 속한 표보다 위에 있는 'myTable'들을 순회
      const currentVal = td.textContent.trim();
      if (!currentVal) return; // 값이 없으면 패스
  
      // 1) 현재 표를 찾고, 그 위에 있는 표들
      const allTables = Array.from(document.querySelectorAll('table.myTable'));
      const currentTable = td.closest('table.myTable');
      const currentTableIndex = allTables.indexOf(currentTable);
  
      // 위쪽 표들(0 ~ currentTableIndex-1)을 순회
      for (let i = 0; i < currentTableIndex; i++) {
        const thatTable = allTables[i];
        const thatRows = thatTable.querySelectorAll('tbody tr');
        // 2열 -> index=1
        const foundRow = Array.from(thatRows).find(r => {
          const tds = r.querySelectorAll('td');
          if (tds.length < 13) return false;
          return tds[1].textContent.trim() === currentVal;
        });
  
        // "해당 표의 2열에 있는 값이 == 현재 2열 값" 인 row가 '없다'면
        // => 그 표의 "임의의 한 행(첫 행?)"의 3,4,12열을 복사해온다고 가정
        if (!foundRow) {
          // 그 표의 첫 번째 tbody행을 사용해본다고 예시 구현
          // 필요하다면 특정 규칙(예: 마지막 행)을 써도 됨
          const copyRow = thatTable.querySelector('tbody tr');
          if (!copyRow) continue;
  
          const copyTds = copyRow.querySelectorAll('td');
          if (copyTds.length < 13) continue;
  
          // 현재 행
          const currentRow = td.closest('tr');
          const currentTds = currentRow.querySelectorAll('td');
  
          // 3,4,12열 => index 2,3,11
          currentTds[2].textContent = copyTds[2].textContent;  // label_2
          currentTds[3].textContent = copyTds[3].textContent;  // label_3
          currentTds[11].textContent = copyTds[11].textContent; // label_11
  
          // 복사 후, 더 이상 위 표 검색 안 함(한 번만)
          break;
        }
      }
    }
  }
  
  
  /************************************************************
   * 5. 전체 초기화
   ************************************************************/
  document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('table.myTable');
    tables.forEach(tbl => {
      initTable(tbl);
  
      // 2열( index=1 )에 자동완성 기능 부여
      // 각 row마다 td index=1을 찾아 이벤트 연결
      const rows = tbl.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const tds = row.querySelectorAll('td');
        if (tds.length >= 2) {
          const col2 = tds[1];
          // attachAutoCompleteForTd
          attachAutoCompleteForTd(col2);
        }
      });
    });
  });
  