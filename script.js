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
  
