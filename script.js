// 드롭다운 -> 이미지로 전환해주는 로직
// 표를 복제해도 각 테이블의 DOM 요소가 별도로 존재하므로 독립적으로 동작합니다.

// 사용될 이미지 링크(예시):
const IMAGE_URLS = {
    red: "https://github.com/Jun-cp/work_repo/blob/main/traffic_green.jpg?raw=true",
    yellow: "https://github.com/Jun-cp/work_repo/blob/main/traffic_yellow.jpg?raw=true",
    green: "https://github.com/Jun-cp/work_repo/blob/main/traffic_red.jpg?raw=true"
  };
  
  function initStatusDropdowns() {
    // 모든 테이블의 dropdown-cell을 순회
    const dropdownCells = document.querySelectorAll('.dropdown-cell');
    dropdownCells.forEach((cell) => {
      const dropdown = cell.querySelector('.status-dropdown');
      const image = cell.querySelector('.status-image');
  
      // 드롭다운 변경 이벤트
      dropdown.addEventListener('change', () => {
        const selectedValue = dropdown.value;
        if (IMAGE_URLS[selectedValue]) {
          // 이미지 URL 변경
          image.src = IMAGE_URLS[selectedValue];
          // 드롭다운 숨기고 이미지 표시
          dropdown.classList.add('hidden');
          image.classList.remove('hidden');
        }
      });
  
      // 이미지 클릭 시 다시 드롭다운으로 복귀
      image.addEventListener('click', () => {
        image.classList.add('hidden');
        dropdown.classList.remove('hidden');
        // 선택값 초기화하거나 유지하고 싶다면 필요시 처리
        // dropdown.value = "";
      });
    });
  }
  
  // DOM이 로드된 후 초기화
  document.addEventListener('DOMContentLoaded', initStatusDropdowns);
  